package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// sendChatRequest sends a chat request and returns the response text
func sendChatRequest(t *testing.T, baseURL string, chatReq ChatRequest) string {
	// Convert request to JSON
	jsonReq, err := json.Marshal(chatReq)
	require.NoError(t, err, "Failed to marshal chat request")

	// Create a new HTTP request
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/chat", baseURL), bytes.NewBuffer(jsonReq))
	require.NoError(t, err, "Failed to create request")
	req.Header.Set("Content-Type", "application/json")

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	require.NoError(t, err, "Failed to send request")
	defer resp.Body.Close()

	// Check response status
	assert.Equal(t, http.StatusOK, resp.StatusCode, "Expected status code 200")

	// Read the response
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err, "Failed to read response body")
	
	return string(body)
}