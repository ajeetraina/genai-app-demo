# Testing GenAI Applications with Docker Model Runner and Testcontainers

This directory contains integration tests for the GenAI application, demonstrating how to test applications that use Docker Model Runner with Testcontainers.

This repo involves 2 tests:

- TestModelRunnerIntegration
- TestFullAppWithModelRunner


### TestModelRunnerIntegration - This test focuses on direct interaction with Docker Model Runner:

- Creates a Socat container to connect to model-runner.docker.internal
- Tests basic text generation with a prompt about Docker
- Tests structured response generation about Docker benefits
- Verifies proper responses from the model


### TestFullAppWithModelRunner - This test verifies the complete application stack:

- Sets up both the Socat container and the backend application
- Configures the backend to communicate with Model Runner
- Sends a chat request through the backend to Model Runner
- Verifies the entire flow works end-to-end

## Getting Started with TestModelRunnerIntegration Test


```
cd tests/
go test -v -run TestModelRunnerIntegration ./integration
```

```
go test -v -run TestModelRunnerIntegration ./integration
=== RUN   TestModelRunnerIntegration
2025/03/23 18:13:54 github.com/testcontainers/testcontainers-go - Connected to docker:
  Server Version: 28.0.2 (via Testcontainers Desktop 1.18.1)
  API Version: 1.43
  Operating System: Docker Desktop
  Total Memory: 9937 MB
  Resolved Docker Host: tcp://127.0.0.1:49152
  Resolved Docker Socket Path: /var/run/docker.sock
  Test SessionID: 11dd3311ac622738022cf1ce81704aeb0da64265ab78302206d4d32079b631cb
  Test ProcessID: 40bb4f95-3a95-499c-8628-5a44023b47bb
2025/03/23 18:13:54 🐳 Creating container for image testcontainers/ryuk:0.6.0
2025/03/23 18:13:54 ✅ Container created: 98d21a1c62ae
2025/03/23 18:13:54 🐳 Starting container: 98d21a1c62ae
2025/03/23 18:13:54 ✅ Container started: 98d21a1c62ae
2025/03/23 18:13:54 🚧 Waiting for container id 98d21a1c62ae image: testcontainers/ryuk:0.6.0. Waiting for: &{Port:8080/tcp timeout:<nil> PollInterval:100ms}
2025/03/23 18:13:54 🐳 Creating container for image alpine/socat
2025/03/23 18:13:54 ✅ Container created: 20bfbe6c76ce
2025/03/23 18:13:54 🐳 Starting container: 20bfbe6c76ce
2025/03/23 18:13:54 ✅ Container started: 20bfbe6c76ce
2025/03/23 18:13:54 🚧 Waiting for container id 20bfbe6c76ce image: alpine/socat. Waiting for: &{Port:8080/tcp timeout:<nil> PollInterval:100ms}
    model_runner_test.go:129: Docker Model Runner accessible at: http://127.0.0.1:65237
=== RUN   TestModelRunnerIntegration/TextGeneration
    model_runner_test.go:73: Response:  Docker is a containerization platform that allows users to package, ship, and run applications in c...
=== RUN   TestModelRunnerIntegration/StreamingTextGeneration
    model_runner_test.go:96: Streaming response:

        1. **Portability**: Docker allows you to create and manage containers that can be easily moved be...
=== NAME  TestModelRunnerIntegration
    model_runner_test.go:141: Terminating Socat container
2025/03/23 18:14:01 🐳 Terminating container: 20bfbe6c76ce
2025/03/23 18:14:01 🚫 Container terminated: 20bfbe6c76ce
--- PASS: TestModelRunnerIntegration (7.46s)
    --- PASS: TestModelRunnerIntegration/TextGeneration (4.45s)
    --- PASS: TestModelRunnerIntegration/StreamingTextGeneration (1.78s)
PASS
ok  	github.com/ajeetraina/genai-app-demo/tests/integration	11.040s
```



## Explanation:


Here's what the test was doing:

- Setting Up Test Environment: The test creates a special network connection (using a "Socat container") that allows the test to communicate with Docker Model Runner, which runs inside Docker's internal network.
- Model Verification: It checks whether the required Llama3.2 model (a small 1B parameter language model) is available. If not available, it would pull the model.
- Basic Text Generation: The first subtest sends a prompt about Docker to the model and verifies that the response mentions Docker or containerization concepts.
- Structured Response Testing: The second subtest asks the model to list benefits of Docker and checks that the response actually contains at least 3 distinct points.
- Cleanup: After the tests complete, it properly cleans up all resources.

The main benefit of this testing approach is that it tests the actual integration with the AI model running in Docker Model Runner, rather than using mocks or simulations. 
This ensures that your application will work correctly with the real model in production.
This type of testing is particularly valuable for AI applications because it verifies both the technical integration with the model service and the quality of the responses you're getting from the model.


## Getting Started with TestFullAppWithModelRunner


Go to tests/ directory:



```
go get github.com/openai/openai-go
go get github.com/openai/openai-go/option
go get github.com/testcontainers/testcontainers-go@v0.27.0
```

```
cd ../
go mod tidy
```


Now, run the test

```
cd tests/
go test -v -run TestFullAppWithModelRunner ./integration
```





