//go:build dev
// +build dev

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

// Global variable to track our containers for clean shutdown
var devContainers []testcontainers.Container

func init() {
	log.Println("Initializing development environment with Testcontainers...")
	ctx := context.Background()

	// Start a socat container to forward traffic to model-runner.docker.internal
	socatContainer, err := createSocatForwarder(ctx)
	if err != nil {
		log.Fatalf("Failed to start model runner forwarder: %v", err)
	}
	devContainers = append(devContainers, socatContainer)

	// Get the mapped port and host of the socat container
	mappedPort, err := socatContainer.MappedPort(ctx, "8080")
	if err != nil {
		log.Fatalf("Failed to get mapped port: %v", err)
	}

	host, err := socatContainer.Host(ctx)
	if err != nil {
		log.Fatalf("Failed to get host: %v", err)
	}

	// Set the environment variables for the application
	baseURL := fmt.Sprintf("http://%s:%s/engines/llama.cpp/v1", host, mappedPort.Port())
	os.Setenv("BASE_URL", baseURL)
	os.Setenv("MODEL", "ignaciolopezluna020/llama3.2:1B") // Corrected to uppercase B
	os.Setenv("API_KEY", "ollama")

	log.Printf("Development environment initialized. Using BASE_URL: %s", baseURL)

	// Register a graceful shutdown handler
	setupGracefulShutdown()
}

// createSocatForwarder creates a socat container to forward traffic to model-runner.docker.internal
func createSocatForwarder(ctx context.Context) (testcontainers.Container, error) {
	socatContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image: "alpine/socat",
			Cmd:   []string{"tcp-listen:8080,fork,reuseaddr", "tcp:model-runner.docker.internal:80"},
			ExposedPorts: []string{
				"8080/tcp",
			},
			WaitingFor: wait.ForListeningPort("8080/tcp"),
		},
		Started: true,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to start socat container: %w", err)
	}

	// Check connectivity to make sure the container is actually forwarding traffic
	mappedPort, err := socatContainer.MappedPort(ctx, "8080")
	if err != nil {
		return nil, fmt.Errorf("failed to get mapped port: %w", err)
	}

	host, err := socatContainer.Host(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get host: %w", err)
	}

	// Log the container info
	log.Printf("Started socat container with port mapping: %s:%s -> model-runner.docker.internal:80", host, mappedPort.Port())

	return socatContainer, nil
}

// setupGracefulShutdown registers signal handlers to gracefully terminate containers on shutdown
func setupGracefulShutdown() {
	var gracefulStop = make(chan os.Signal, 1)
	signal.Notify(gracefulStop, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		sig := <-gracefulStop
		log.Printf("Caught signal: %+v", sig)
		log.Println("Shutting down development containers...")

		if err := shutdownDevDependencies(); err != nil {
			log.Printf("Error shutting down dev dependencies: %v", err)
			os.Exit(1)
		}

		os.Exit(0)
	}()
}

// shutdownDevDependencies terminates all development containers
func shutdownDevDependencies() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	for _, container := range devContainers {
		if err := container.Terminate(ctx); err != nil {
			return fmt.Errorf("failed to terminate container: %w", err)
		}
	}

	log.Println("All development containers terminated successfully")
	return nil
}
