package integration

import (
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestResponseLatency measures the response time of the model
func TestResponseLatency(t *testing.T) {
	baseURL, cleanup := setupTestContainers(t)
	defer cleanup()
	
	// Set the LLM API endpoint
	llmEndpoint := baseURL + "/engines/llama.cpp/v1"
	
	// Define prompts of different complexity
	testCases := []struct {
		name            string
		prompt          string
		maxExpectedTime time.Duration
	}{
		{"Short prompt", "What is 2+2?", 10 * time.Second}, // Simple math should be very fast
		{"Medium prompt", "Explain the concept of machine learning in 2-3 sentences.", 15 * time.Second},
		{"Complex prompt", "Compare and contrast REST and GraphQL APIs. Include pros and cons of each.", 20 * time.Second},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Skip longer tests in short mode
			if testing.Short() && tc.name != "Short prompt" {
				t.Skip("Skipping in short mode")
			}
			
			// Measure response time
			start := time.Now()
			resp, err := sendCompletionRequest(llmEndpoint, tc.prompt)
			duration := time.Since(start)
			
			// Validate response
			assert.NoError(t, err)
			assert.NotNil(t, resp)
			assert.NotEmpty(t, resp.Choices[0].Text)
			
			// Check if response time is within acceptable limits
			// Note: These limits should be adjusted based on your specific model and hardware
			assert.Less(t, duration, tc.maxExpectedTime, 
				"Response for '%s' took too long: %v", tc.name, duration)
			
			// Log the timing information
			t.Logf("%s - Response time: %v", tc.name, duration)
			t.Logf("Response length: %d characters", len(resp.Choices[0].Text))
			t.Logf("Tokens used - Prompt: %d, Completion: %d, Total: %d", 
				resp.Usage.PromptTokens, resp.Usage.CompletionTokens, resp.Usage.TotalTokens)
		})
	}
}

// TestConcurrentRequests tests how the model handles multiple concurrent requests
func TestConcurrentRequests(t *testing.T) {
	// Skip this test in short mode as it's more resource-intensive
	if testing.Short() {
		t.Skip("Skipping concurrent requests test in short mode")
	}
	
	baseURL, cleanup := setupTestContainers(t)
	defer cleanup()
	
	// Set the LLM API endpoint
	llmEndpoint := baseURL + "/engines/llama.cpp/v1"
	
	// Define the number of concurrent requests
	// Adjust based on your model's capabilities
	concurrentRequests := 3
	
	var wg sync.WaitGroup
	results := make(chan struct{
		id  int
		err error
		time time.Duration
	}, concurrentRequests)
	
	// Start timer for overall test
	overallStart := time.Now()
	
	// Launch concurrent requests
	for i := 0; i < concurrentRequests; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			
			// Create a simple prompt with the request ID
			prompt := fmt.Sprintf("This is concurrent request %d. Please summarize what concurrency means in computing.", id)
			
			// Time this specific request
			start := time.Now()
			_, err := sendCompletionRequest(llmEndpoint, prompt)
			duration := time.Since(start)
			
			// Send result to channel
			results <- struct {
				id  int
				err error
				time time.Duration
			}{id, err, duration}
		}(i)
	}
	
	// Close results channel once all goroutines complete
	go func() {
		wg.Wait()
		close(results)
	}()
	
	// Process results
	var successCount int
	var totalTime time.Duration
	var maxTime time.Duration
	var minTime = time.Hour // Start with a large value
	
	for result := range results {
		if result.err == nil {
			successCount++
			totalTime += result.time
			
			if result.time > maxTime {
				maxTime = result.time
			}
			if result.time < minTime {
				minTime = result.time
			}
			
			t.Logf("Request %d completed in %v", result.id, result.time)
		} else {
			t.Errorf("Request %d failed: %v", result.id, result.err)
		}
	}
	
	// Calculate overall statistics
	overallTime := time.Since(overallStart)
	avgTime := totalTime / time.Duration(successCount)
	
	// Log performance metrics
	t.Logf("Concurrent requests test completed in %v", overallTime)
	t.Logf("Success rate: %d/%d requests", successCount, concurrentRequests)
	t.Logf("Average response time: %v", avgTime)
	t.Logf("Min response time: %v", minTime)
	t.Logf("Max response time: %v", maxTime)
	
	// Assert all requests succeeded
	assert.Equal(t, concurrentRequests, successCount, "All concurrent requests should succeed")
}
