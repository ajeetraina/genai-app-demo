package integration

import (
	"testing"
	"time"
)

// TestExtendedPerformance runs performance tests for an extended period
func TestExtendedPerformance(t *testing.T) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping extended performance test in short mode")
	}

	// Setup test environment
	baseURL, err := setupTestEnvironment()
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}

	// Define test duration
	duration := 30 * time.Second // Run for 30 seconds
	interval := 2 * time.Second  // Test every 2 seconds

	// Define test prompts
	prompts := []string{
		"What is the capital of France?",
		"Explain quantum computing in simple terms",
		"Write a short poem about technology",
		"What are three benefits of containerization?",
		"How does machine learning work?",
	}

	// Test stats
	var totalRequests, successfulRequests int
	var totalLatency time.Duration

	// Start test
	startTime := time.Now()
	endTime := startTime.Add(duration)

	t.Logf("Starting extended performance test for %s", duration)
	
	for time.Now().Before(endTime) {
		// Pick a prompt from the list
		promptIndex := totalRequests % len(prompts)
		prompt := prompts[promptIndex]

		// Send the request and measure time
		reqStart := time.Now()
		
		// Prepare chat request
		chatReq := ChatRequest{
			Messages: []Message{
				{
					Role:    "user",
					Content: prompt,
				},
			},
		}

		// Send request and capture response
		response := sendChatRequest(t, baseURL, chatReq)
		reqDuration := time.Since(reqStart)

		// Update stats
		totalRequests++
		if response != "" {
			successfulRequests++
			totalLatency += reqDuration

			// Print progress
			t.Logf("Request %d: %s (%.2fs)", totalRequests, prompt, reqDuration.Seconds())
		} else {
			t.Logf("Request %d: %s (FAILED)", totalRequests, prompt)
		}

		// Wait for next interval
		time.Sleep(interval)
	}

	// Calculate and report stats
	overallDuration := time.Since(startTime)
	avgLatency := totalLatency / time.Duration(successfulRequests)
	successRate := float64(successfulRequests) / float64(totalRequests) * 100

	t.Logf("\n--- Extended Performance Test Results ---")
	t.Logf("Test duration: %.2f seconds", overallDuration.Seconds())
	t.Logf("Total requests: %d", totalRequests)
	t.Logf("Successful requests: %d (%.2f%%)", successfulRequests, successRate)
	t.Logf("Average latency: %.2f seconds", avgLatency.Seconds())
	t.Logf("Requests per second: %.2f", float64(totalRequests)/overallDuration.Seconds())

	// Verify test expectations
	if successRate < 90 {
		t.Errorf("Success rate too low: %.2f%% (expected >= 90%%)", successRate)
	}

	if avgLatency > 5*time.Second {
		t.Errorf("Average latency too high: %.2fs (expected <= 5s)", avgLatency.Seconds())
	}
}