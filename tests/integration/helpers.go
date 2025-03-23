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

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// CompletionRequest represents a request to the model completion API
type CompletionRequest struct {
	Prompt      string  `json:"prompt"`
	MaxTokens   int     `json:"max_tokens,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
}

// CompletionResponse represents a response from the model completion API
type CompletionResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Text         string      `json:"text"`
		Index        int         `json:"index"`
		FinishReason string      `json:"finish_reason"`
		Logprobs     interface{} `json:"logprobs"`
	}
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// sendCompletionRequest sends a completion request to the specified URL
func sendCompletionRequest(baseURL string, prompt string) (*CompletionResponse, error) {
	reqBody := CompletionRequest{
		Prompt:      prompt,
		MaxTokens:   100,
		Temperature: 0.7,
	}
	
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}
	
	resp, err := http.Post(
		baseURL+"/completions",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}
	
	var result CompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return &result, nil
}

// setupTestContainers creates and starts a proper testcontainer for the model runner
func setupTestContainers(t *testing.T) (string, func()) {
	// Create a proxy container that forwards to your model runner
	ctx := context.Background()
	
	// Start a network for our test containers
	network, err := testcontainers.GenericNetwork(ctx, testcontainers.GenericNetworkRequest{
		NetworkRequest: testcontainers.NetworkRequest{
			Name:           "genai-test-network",
			CheckDuplicate: true,
		},
	})
	
	if err != nil {
		t.Fatalf("Failed to create test network: %s", err)
	}
	
	// Start a Socat container to forward traffic to the host
	socatContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image: "alpine/socat",
			Cmd:   []string{"tcp-listen:8080,fork,reuseaddr", "tcp:host.docker.internal:12434"},
			ExposedPorts: []string{
				"8080/tcp",
			},
			Networks: []string{"genai-test-network"},
			WaitingFor: wait.ForAll(
				wait.ForListeningPort("8080/tcp"),
				wait.ForLog("starting").WithStartupTimeout(10*time.Second),
			),
		},
		Started: true,
	})

	if err != nil {
		t.Fatalf("Failed to start socat container: %s", err)
	}
	
	// Get the mapped port
	mappedPort, err := socatContainer.MappedPort(ctx, "8080")
	if err != nil {
		t.Fatalf("Failed to get mapped port: %s", err)
	}

	host, err := socatContainer.Host(ctx)
	if err != nil {
		t.Fatalf("Failed to get host: %s", err)
	}
	
	// Create the base URL for the API
	baseURL := fmt.Sprintf("http://%s:%s", host, mappedPort.Port())
	
	// Test the connection before proceeding
	client := &http.Client{Timeout: 5 * time.Second}
	_, err = client.Get(baseURL + "/models")
	if err != nil {
		// Clean up containers if we can't connect
		if err := socatContainer.Terminate(ctx); err != nil {
			t.Logf("Failed to terminate socat container: %s", err)
		}
		if err := network.Remove(ctx); err != nil {
			t.Logf("Failed to remove network: %s", err)
		}
		t.Skipf("Skipping test as model runner is not available: %v", err)
	}
	
	// Return cleanup function
	cleanup := func() {
		if err := socatContainer.Terminate(ctx); err != nil {
			t.Logf("Failed to terminate socat container: %s", err)
		}
		if err := network.Remove(ctx); err != nil {
			t.Logf("Failed to remove network: %s", err)
		}
	}
	
	return baseURL, cleanup
}
