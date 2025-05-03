# llama.cpp Integration

This directory contains the llama.cpp integration for the GenAI App Demo. It allows running inference with the llama.cpp library directly within the application, providing an alternative to the Docker Model Runner.

## Features

- Direct integration with llama.cpp for local LLM inference
- Support for running models with minimal system requirements
- Configurable parameters for inference optimization
- Maintains compatibility with existing application observability

## Usage

To use the llama.cpp integration, modify the `compose.yaml` file to use the llama.cpp service instead of the Model Runner service.
