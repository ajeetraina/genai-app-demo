package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestModelRunnerIntegration tests connectivity to the Model Runner using host.docker.internal
func TestModelRunnerIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping Model Runner test in short mode")
	}

	// Use the fixed host.docker.internal:12434 endpoint
	baseURL := "http://host.docker.internal:12434"
	client := &http.Client{Timeout: 10 * time.Second}

	// Test 1: GET /models endpoint
	t.Log("Testing GET /models endpoint...")
	resp, err := client.Get(baseURL + "/models")
	if err != nil {
		t.Fatalf("Failed to call /models: %s", err)
	}
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode, "Expected status code 200 for /models")
	
	// Parse initial models list
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %s", err)
	}
	
	var models []map[string]interface{}
	if err := json.Unmarshal(body, &models); err != nil {
		t.Fatalf("Failed to parse JSON response: %s", err)
	}
	
	// Log what models are available
	t.Logf("Available models: %d found", len(models))
	for i, model := range models {
		modelName, ok := model["name"].(string)
		if ok {
			t.Logf("Model %d: %s", i+1, modelName)
		} else {
			t.Logf("Model %d: %v", i+1, model)
		}
	}
	
	// Test 2: Test /engines endpoint if available 
	t.Log("Testing /engines endpoint...")
	enginesResp, err := client.Get(baseURL + "/engines")
	if err != nil {
		t.Logf("Note: Failed to call /engines endpoint, this may be expected: %s", err)
	} else {
		defer enginesResp.Body.Close()
		
		if enginesResp.StatusCode == http.StatusOK {
			enginesBody, err := io.ReadAll(enginesResp.Body)
			if err != nil {
				t.Logf("Failed to read engines response body: %s", err)
			} else {
				t.Logf("Engines endpoint response: %s", string(enginesBody))
			}
		} else {
			t.Logf("Engines endpoint returned status: %d", enginesResp.StatusCode)
		}
	}
	
	// Define model name from configuration
	modelName := "ignaciolopezluna020/llama3.2:1B"
	modelPresent := false
	
	// Check if model is already present
	for _, model := range models {
		if name, ok := model["name"].(string); ok && name == modelName {
			modelPresent = true
			t.Logf("Model %s already exists, skipping create", modelName)
			break
		}
	}
	
	// Only try to create if model is not present
	if !modelPresent {
		t.Log("Attempting to create model (optional test)...")
		createModelReq, err := http.NewRequest(
			"POST", 
			baseURL+"/models/create", 
			strings.NewReader(fmt.Sprintf(`{"from": "%s"}`, modelName)),
		)
		if err != nil {
			t.Logf("Warning: Failed to create request: %s", err)
		} else {
			createModelReq.Header.Set("Content-Type", "application/json")
			
			createResp, err := client.Do(createModelReq)
			if err != nil {
				t.Logf("Warning: Failed to call /models/create: %s", err)
			} else {
				defer createResp.Body.Close()
				
				if createResp.StatusCode == http.StatusOK {
					t.Log("Successfully created model")
				} else {
					createBody, _ := io.ReadAll(createResp.Body)
					t.Logf("Warning: Model creation returned status %d: %s", 
						createResp.StatusCode, string(createBody))
				}
			}
		}
	}
	
	// Success message for debugging
	t.Log("Model Runner test completed successfully!")
	t.Logf("Model Runner is accessible via: %s", baseURL)
	t.Logf("Use this URL in your application config: %s/engines/llama.cpp/v1", baseURL)
}
