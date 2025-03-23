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

// setupTestContainers creates and starts model-runner container
func setupTestContainers(t *testing.T) (string, func()) {
	// For this integration test, we'll use the local model runner
	// In a real CI/CD environment, you would create a container instance
	baseURL := "http://localhost:12434"
	
	// Test the connection before proceeding
	client := &http.Client{Timeout: 5 * time.Second}
	_, err := client.Get(baseURL + "/models")
	if err != nil {
		t.Skipf("Skipping test as model runner is not available: %v", err)
	}
	
	// Return cleanup function (not needed for local testing)
	cleanup := func() {}
	
	return baseURL, cleanup
}

// This is a version that uses actual testcontainers
// Comment out the function above and uncomment this when you have container setup
/*
func setupTestContainers(t *testing.T) (string, func()) {
	// Create model-runner container
	modelRunnerContainer, err := testcontainers.GenericContainer(context.Background(), testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image: "your-model-runner-image:latest",
			ExposedPorts: []string{"80/tcp"},
			Env: map[string]string{
				"MODEL": "ignaciolopezluna020/llama3.2:1B",
			},
			WaitingFor: wait.ForHTTP("/engines").WithPort("80/tcp"),
		},
		Started: true,
	})
	
	require.NoError(t, err)
	
	// Get host and port mapping
	host, err := modelRunnerContainer.Host(context.Background())
	require.NoError(t, err)
	
	port, err := modelRunnerContainer.MappedPort(context.Background(), "80")
	require.NoError(t, err)
	
	baseURL := fmt.Sprintf("http://%s:%s", host, port.Port())
	
	// Return cleanup function
	cleanup := func() {
		if err := modelRunnerContainer.Terminate(context.Background()); err != nil {
			t.Logf("Failed to terminate container: %s", err)
		}
	}
	
	return baseURL, cleanup
}
*/
