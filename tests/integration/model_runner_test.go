package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// SocatContainer is a custom container that sets up a network tunnel
// between the test environment and Docker's internal network
type SocatContainer struct {
	testcontainers.Container
	TargetPort int
	TargetHost string
}

// ModelRunnerTestEnvironment represents the test environment for Docker Model Runner
type ModelRunnerTestEnvironment struct {
	BaseURL        string
	ModelName      string
	SocatContainer testcontainers.Container
	ctx            context.Context
}

// TestModelRunnerIntegration tests the integration with Docker Model Runner
func TestModelRunnerIntegration(t *testing.T) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping Docker Model Runner integration test in short mode")
	}

	// Check if Docker Model Runner is available
	if !isModelRunnerAvailable() {
		t.Skip("Docker Model Runner is not available. Enable it in Docker Desktop settings.")
	}

	// Setup test environment with Model Runner
	env, err := setupModelRunnerEnvironment(t)
	if err != nil {
		t.Fatalf("Failed to setup Model Runner environment: %v", err)
	}
	defer env.Cleanup(t)

	// Verify the model is available
	modelName := "ignaciolopezluna020/llama3.2:1B"
	if err := env.EnsureModelAvailable(modelName); err != nil {
		t.Fatalf("Failed to ensure model is available: %v", err)
	}

	// Test simple text generation
	t.Run("TextGeneration", func(t *testing.T) {
		prompt := "Explain what Docker is in one paragraph."
		response, err := env.GenerateText(modelName, prompt)
		if err != nil {
			t.Fatalf("Failed to generate text: %v", err)
		}

		// Verify the response is not empty
		if response == "" {
			t.Fatal("Received empty response from model")
		}

		// Display a preview of the response
		displayLen := min(len(response), 100) // First 100 chars
		t.Logf("Response: %s...", response[:displayLen])

		// Verify response contains expected content
		if !containsAny(response, []string{"Docker", "container", "containerization"}) {
			t.Errorf("Response doesn't mention Docker or containers: %s", response)
		}
	})

	// Test streaming text generation (simulated)
	t.Run("StreamingTextGeneration", func(t *testing.T) {
		prompt := "List 3 benefits of using Docker."
		response, err := env.GenerateText(modelName, prompt)
		if err != nil {
			t.Fatalf("Failed to generate streaming text: %v", err)
		}

		// Verify the response is not empty
		if response == "" {
			t.Fatal("Received empty streaming response from model")
		}

		// Display a preview of the response
		displayLen := min(len(response), 100) // First 100 chars
		t.Logf("Streaming response: %s...", response[:displayLen])

		// Count the number of benefits mentioned (we expect at least 3)
		// This is a simple heuristic, not a precise check
		numPoints := countPoints(response)
		if numPoints < 3 {
			t.Errorf("Expected at least 3 benefits, but found approximately %d", numPoints)
		}
	})
}

// setupModelRunnerEnvironment creates a test environment with Docker Model Runner
func setupModelRunnerEnvironment(t *testing.T) (*ModelRunnerTestEnvironment, error) {
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

	baseURL := fmt.Sprintf("http://%s:%s", host, port.Port())
	t.Logf("Docker Model Runner accessible at: %s", baseURL)

	return &ModelRunnerTestEnvironment{
		BaseURL:        baseURL,
		SocatContainer: socatContainer,
		ctx:            ctx,
	}, nil
}

// Cleanup releases resources used by the test environment
func (env *ModelRunnerTestEnvironment) Cleanup(t *testing.T) {
	if env.SocatContainer != nil {
		t.Log("Terminating Socat container")
		err := env.SocatContainer.Terminate(env.ctx)
		if err != nil {
			t.Logf("Warning: failed to terminate Socat container: %v", err)
		}
	}
}

// EnsureModelAvailable ensures the specified model is available in Docker Model Runner
func (env *ModelRunnerTestEnvironment) EnsureModelAvailable(modelName string) error {
	// Check if model is already available
	resp, err := http.Get(fmt.Sprintf("%s/engines/llama.cpp/v1/models", env.BaseURL))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to list models, status: %d, body: %s", resp.StatusCode, body)
	}

	var modelList struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&modelList); err != nil {
		return err
	}

	for _, model := range modelList.Data {
		if model.ID == modelName {
			return nil // Model already available
		}
	}

	// Model not available, need to pull it
	return env.PullModel(modelName)
}

// PullModel pulls a model through Docker Model Runner
func (env *ModelRunnerTestEnvironment) PullModel(modelName string) error {
	requestBody := map[string]interface{}{
		"from": modelName,
	}
	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return err
	}

	resp, err := http.Post(
		fmt.Sprintf("%s/api/models", env.BaseURL),
		"application/json",
		bytes.NewBuffer(bodyBytes),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to pull model, status: %d, body: %s", resp.StatusCode, body)
	}

	// Model pull can take some time, so we'll wait for it to complete
	// We'll check periodically if the model appears in the list
	for i := 0; i < 60; i++ { // Wait up to 5 minutes (60 * 5s)
		time.Sleep(5 * time.Second)

		models, err := env.ListModels()
		if err != nil {
			continue
		}

		for _, model := range models {
			if model.ID == modelName {
				return nil // Model found
			}
		}
	}

	return fmt.Errorf("timeout waiting for model to be pulled")
}

// ListModels returns the list of available models in Docker Model Runner
func (env *ModelRunnerTestEnvironment) ListModels() ([]struct{ ID string `json:"id"` }, error) {
	resp, err := http.Get(fmt.Sprintf("%s/engines/llama.cpp/v1/models", env.BaseURL))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to list models, status: %d, body: %s", resp.StatusCode, body)
	}

	var modelList struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&modelList); err != nil {
		return nil, err
	}

	return modelList.Data, nil
}

// GenerateText generates text using the specified model
func (env *ModelRunnerTestEnvironment) GenerateText(modelName, prompt string) (string, error) {
	requestBody := map[string]interface{}{
		"model":       modelName,
		"prompt":      prompt,
		"temperature": 0.2,
		"max_tokens":  500,
	}
	bodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(
		fmt.Sprintf("%s/engines/llama.cpp/v1/completions", env.BaseURL),
		"application/json",
		bytes.NewBuffer(bodyBytes),
	)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to generate text, status: %d, body: %s", resp.StatusCode, body)
	}

	var result struct {
		Choices []struct {
			Text string `json:"text"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no text generated")
	}

	return result.Choices[0].Text, nil
}

// runSocatContainer creates and starts a Socat container
func runSocatContainer(ctx context.Context) (testcontainers.Container, error) {
	req := testcontainers.ContainerRequest{
		Image:        "alpine/socat",
		ExposedPorts: []string{"8080/tcp"},
		Cmd:          []string{"tcp-listen:8080,fork,reuseaddr", "tcp-connect:model-runner.docker.internal:80"},
		WaitingFor:   wait.ForListeningPort("8080/tcp"),
	}

	return testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
}

// isModelRunnerAvailable checks if Docker Model Runner is available
func isModelRunnerAvailable() bool {
	// We can't check directly from tests, so we'll assume it's configured
	// and let the tests fail if it's not
	return true
}

// containsAny checks if the text contains any of the specified substrings
func containsAny(text string, substrings []string) bool {
	for _, s := range substrings {
		if bytes.Contains([]byte(text), []byte(s)) {
			return true
		}
	}
	return false
}

// countPoints counts the number of bullet points or numbered items in text
func countPoints(text string) int {
	// Simple heuristic: count number of lines that start with a number or dash
	// This is not perfect but good enough for testing
	count := 0
	lines := bytes.Split([]byte(text), []byte("\n"))
	for _, line := range lines {
		trimmed := bytes.TrimSpace(line)
		if len(trimmed) > 0 && (bytes.HasPrefix(trimmed, []byte("-")) || 
			bytes.HasPrefix(trimmed, []byte("*")) || 
			bytes.HasPrefix(trimmed, []byte("1.")) || 
			bytes.HasPrefix(trimmed, []byte("2.")) ||
			bytes.HasPrefix(trimmed, []byte("3."))) {
			count++
		}
	}
	return count
}
