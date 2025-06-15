package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
)

// FullAppTestEnvironment represents a complete test environment with backend and Model Runner
type FullAppTestEnvironment struct {
	BackendURL      string
	ModelRunnerURL  string
	SocatContainer  testcontainers.Container
	BackendProcess  *os.Process
	ctx             context.Context
}

// TestFullAppWithModelRunner tests the complete integration from backend to Model Runner
func TestFullAppWithModelRunner(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping full application integration test in short mode")
	}

	// Check if Docker Model Runner is available
	if !isModelRunnerAvailable() {
		t.Skip("Docker Model Runner is not available. Enable it in Docker Desktop settings.")
	}

	// Setup complete test environment
	env, err := setupFullAppEnvironment(t)
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}
	defer env.Cleanup(t)

	// Verify connectivity to backend
	if err := verifyBackendConnectivity(env.BackendURL); err != nil {
		t.Fatalf("Failed to connect to backend: %v", err)
	}
	t.Logf("Successfully connected to backend at %s", env.BackendURL)

	// Test chat functionality with Model Runner
	t.Run("ChatWithModelRunner", func(t *testing.T) {
		// Create a chat request
		chatReq := ChatRequest{
			Messages: []Message{
				{
					Role:    "user",
					Content: "Tell me about Docker in one paragraph.",
				},
			},
		}

		// Send the request to the backend
		response, err := sendChatRequestToBackend(env.BackendURL, chatReq)
		if err != nil {
			t.Fatalf("Failed to send chat request: %v", err)
		}

		// Verify the response
		if response == "" {
			t.Fatal("Received empty response from backend")
		}

		t.Logf("Received valid response from backend through Model Runner")
		displayLen := min(len(response), 100) // First 100 chars
		t.Logf("Response preview: %s...", response[:displayLen])

		// Verify response content
		if !containsAny(response, []string{"Docker", "container", "containerization"}) {
			t.Errorf("Response doesn't contain expected content about Docker: %s", response)
		}
	})
}

// setupFullAppEnvironment creates a complete test environment with backend and Model Runner
func setupFullAppEnvironment(t *testing.T) (*FullAppTestEnvironment, error) {
	ctx := context.Background()

	// Create a Socat container to tunnel to model-runner.docker.internal
	socatContainer, err := runSocatContainer(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create Socat container: %w", err)
	}

	// Get the mapped port for accessing Model Runner
	host, err := socatContainer.Host(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get container host: %w", err)
	}

	port, err := socatContainer.MappedPort(ctx, "8080")
	if err != nil {
		return nil, fmt.Errorf("failed to get mapped port: %w", err)
	}

	modelRunnerURL := fmt.Sprintf("http://%s:%s", host, port.Port())
	t.Logf("Docker Model Runner accessible at: %s", modelRunnerURL)

	// Start the backend with environment variables pointing to Model Runner
	backendProcess, backendURL, err := startBackend(modelRunnerURL)
	if err != nil {
		// Make sure to terminate the Socat container if backend startup fails
		socatContainer.Terminate(ctx)
		return nil, fmt.Errorf("failed to start backend: %w", err)
	}

	return &FullAppTestEnvironment{
		BackendURL:      backendURL,
		ModelRunnerURL:  modelRunnerURL,
		SocatContainer:  socatContainer,
		BackendProcess:  backendProcess,
		ctx:             ctx,
	}, nil
}

// startBackend starts the backend application with environment variables
func startBackend(modelRunnerURL string) (*os.Process, string, error) {
	// Set environment variables for the backend
	env := os.Environ()
	env = append(env, fmt.Sprintf("BASE_URL=http://model-runner.docker.internal/engines/llama.cpp/v1"))
	env = append(env, "MODEL=ai/llama3.2:1B-Q8_0")
	env = append(env, "API_KEY=dockermodelrunner") // Default API key

	// Start the backend on a random port
	// Updated path to point to the main.go in the project root
	cmd := exec.Command("go", "run", "../../main.go")
	cmd.Env = env
	cmd.Stdout = os.Stdout // Redirect output for debugging
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return nil, "", fmt.Errorf("failed to start backend: %w", err)
	}

	// Give the backend a moment to start
	time.Sleep(2 * time.Second)

	// The backend listens on port 8080 by default
	backendURL := "http://localhost:8080"

	// Wait for the backend to be ready
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		_, err := http.Get(backendURL)
		if err == nil {
			break
		}

		if i == maxRetries-1 {
			cmd.Process.Kill()
			return nil, "", fmt.Errorf("backend failed to start after %d retries", maxRetries)
		}

		time.Sleep(1 * time.Second)
	}

	return cmd.Process, backendURL, nil
}

// verifyBackendConnectivity checks if the backend is reachable
func verifyBackendConnectivity(backendURL string) error {
	resp, err := http.Get(backendURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// HTTP OK or Found are both acceptable
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusFound {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}

// sendChatRequestToBackend sends a chat request to the backend
func sendChatRequestToBackend(backendURL string, chatReq ChatRequest) (string, error) {
	// Convert the request to JSON
	jsonReq, err := json.Marshal(chatReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal chat request: %w", err)
	}

	// Send the request
	resp, err := http.Post(
		fmt.Sprintf("%s/chat", backendURL),
		"application/json",
		bytes.NewBuffer(jsonReq),
	)
	if err != nil {
		return "", fmt.Errorf("failed to send chat request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("chat endpoint returned non-200 status: %d", resp.StatusCode)
	}

	// Read the response as text
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	return string(body), nil
}

// Cleanup releases resources used by the test environment
func (env *FullAppTestEnvironment) Cleanup(t *testing.T) {
	// Stop the backend process
	if env.BackendProcess != nil {
		t.Log("Stopping backend process")
		if err := env.BackendProcess.Kill(); err != nil {
			t.Logf("Warning: failed to kill backend process: %v", err)
		}
	}

	// Terminate the Socat container
	if env.SocatContainer != nil {
		t.Log("Terminating Socat container")
		if err := env.SocatContainer.Terminate(env.ctx); err != nil {
			t.Logf("Warning: failed to terminate Socat container: %v", err)
		}
	}
}
