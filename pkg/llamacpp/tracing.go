package llamacpp

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/trace"
	"go.opentelemetry.io/otel/sdk/trace as sdktrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

// LlamaCppTracer provides tracing capabilities for llama.cpp operations
type LlamaCppTracer struct {
	tracer trace.Tracer
}

// NewLlamaCppTracer creates a new tracer for llama.cpp operations
func NewLlamaCppTracer(serviceName string) (*LlamaCppTracer, func(), error) {
	exporter, err := otlptracehttp.New(
		context.Background(),
		otlptracehttp.WithEndpoint("jaeger:4318"),
		otlptracehttp.WithInsecure(),
	)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create OTLP exporter: %w", err)
	}

	// Create a resource with service information
	resource := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceNameKey.String(serviceName),
		semconv.ServiceVersionKey.String("1.0.0"),
		attribute.String("environment", "production"),
	)

	// Create a trace provider
	traceProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource),
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
	)

	// Set the global trace provider
	otel.SetTracerProvider(traceProvider)

	// Create a cleanup function
	cleanup := func() {
		// Shutdown the trace provider
		if err := traceProvider.Shutdown(context.Background()); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}

	// Create a tracer
	tracer := traceProvider.Tracer(
		"github.com/ajeetraina/genai-app-demo/pkg/llamacpp",
		trace.WithInstrumentationVersion("1.0.0"),
	)

	return &LlamaCppTracer{tracer: tracer}, cleanup, nil
}

// TraceInference creates a span for an inference operation
func (t *LlamaCppTracer) TraceInference(ctx context.Context, modelInfo map[string]string, inputTokens int) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{
		attribute.String("model.name", modelInfo["name"]),
		attribute.String("model.size", modelInfo["size"]),
		attribute.String("model.quantization", modelInfo["quantization"]),
		attribute.Int("tokens.input", inputTokens),
	}

	return t.tracer.Start(ctx, "llamacpp.inference", trace.WithAttributes(attrs...))
}

// TraceTokenGeneration creates a span for token generation
func (t *LlamaCppTracer) TraceTokenGeneration(ctx context.Context, batchSize int) (context.Context, trace.Span) {
	attrs := []attribute.KeyValue{
		attribute.Int("batch.size", batchSize),
	}

	return t.tracer.Start(ctx, "llamacpp.token_generation", trace.WithAttributes(attrs...))
}

// RecordGeneratedToken adds an event to the current span for a generated token
func (t *LlamaCppTracer) RecordGeneratedToken(ctx context.Context, tokenId int, tokenText string, tokenProbability float32) {
	span := trace.SpanFromContext(ctx)
	span.AddEvent("token.generated", trace.WithAttributes(
		attribute.Int("token.id", tokenId),
		attribute.String("token.text", tokenText),
		attribute.Float64("token.probability", float64(tokenProbability)),
	))
}

// RecordKVCacheInfo adds KV cache information to the current span
func (t *LlamaCppTracer) RecordKVCacheInfo(ctx context.Context, usedKVCacheEntries int, totalKVCacheEntries int) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(
		attribute.Int("kv_cache.used_entries", usedKVCacheEntries),
		attribute.Int("kv_cache.total_entries", totalKVCacheEntries),
		attribute.Float64("kv_cache.utilization", float64(usedKVCacheEntries)/float64(totalKVCacheEntries)),
	)
}

// RecordMemoryUsage adds memory usage information to the current span
func (t *LlamaCppTracer) RecordMemoryUsage(ctx context.Context, modelMemoryMB float64, kvCacheMemoryMB float64, totalRAMUsageMB float64) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(
		attribute.Float64("memory.model_mb", modelMemoryMB),
		attribute.Float64("memory.kv_cache_mb", kvCacheMemoryMB),
		attribute.Float64("memory.total_ram_mb", totalRAMUsageMB),
	)
}

// RecordTokensPerSecond records the generation speed
func (t *LlamaCppTracer) RecordTokensPerSecond(ctx context.Context, tokensPerSecond float64) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(
		attribute.Float64("performance.tokens_per_second", tokensPerSecond),
	)
}

// RecordFirstTokenLatency records the time to first token
func (t *LlamaCppTracer) RecordFirstTokenLatency(ctx context.Context, latencyMs float64) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(
		attribute.Float64("performance.first_token_latency_ms", latencyMs),
	)
}
