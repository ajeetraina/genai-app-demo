package tracing

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.12.0"
	otelTrace "go.opentelemetry.io/otel/trace"
)

// SetupTracing initializes OpenTelemetry tracing
func SetupTracing(serviceName string, otlpEndpoint string) (func(), error) {
	// Create a resource with service information
	res, err := resource.New(context.Background(),
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
		),
	)
	if err != nil {
		return nil, err
	}

	var traceProvider *trace.TracerProvider

	// If OTLP endpoint is provided, use it
	if otlpEndpoint != "" {
		client := otlptracehttp.NewClient(
			otlptracehttp.WithEndpoint(otlpEndpoint),
			otlptracehttp.WithInsecure(),
		)

		exporter, err := otlptrace.New(context.Background(), client)
		if err != nil {
			return nil, err
		}

		traceProvider = trace.NewTracerProvider(
			trace.WithResource(res),
			trace.WithBatcher(exporter,
				trace.WithBatchTimeout(5*time.Second),
			),
			trace.WithSampler(trace.AlwaysSample()), // Sample all traces for development
		)
	} else {
		// Use a no-op exporter if no endpoint is provided
		traceProvider = trace.NewTracerProvider(
			trace.WithResource(res),
			trace.WithSampler(trace.AlwaysSample()),
		)
	}

	// Set the global trace provider
	otel.SetTracerProvider(traceProvider)

	// Return a cleanup function to flush and shutdown the tracer
	return func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := traceProvider.Shutdown(ctx); err != nil {
			log.Printf("Error shutting down tracer provider: %v", err)
		}
	}, nil
}

// StartSpan starts a new span
func StartSpan(ctx context.Context, spanName string) (context.Context, otelTrace.Span) {
	tracer := otel.Tracer("genai-app")
	ctx, span := tracer.Start(ctx, spanName)
	return ctx, span
}

// AddAttributes adds multiple attributes to the current span
func AddAttributes(ctx context.Context, attrs ...attribute.KeyValue) {
	span := otelTrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}
	span.SetAttributes(attrs...)
}

// AddAttribute adds a single attribute to the current span
func AddAttribute(ctx context.Context, key string, value interface{}) {
	span := otelTrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}
	
	// Convert the value to the appropriate attribute type
	var attr attribute.KeyValue
	switch v := value.(type) {
	case string:
		attr = attribute.String(key, v)
	case int:
		attr = attribute.Int(key, v)
	case int64:
		attr = attribute.Int64(key, v)
	case float64:
		attr = attribute.Float64(key, v)
	case bool:
		attr = attribute.Bool(key, v)
	default:
		attr = attribute.String(key, fmt.Sprintf("%v", v))
	}
	
	span.SetAttributes(attr)
}

// RecordError records an error in the current span
func RecordError(ctx context.Context, err error, message string) {
	if err == nil {
		return
	}
	
	span := otelTrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}
	
	span.RecordError(err)
	span.SetStatus(codes.Error, message)
	if message != "" {
		span.SetAttributes(attribute.String("error.message", message))
	}
}

// End ends the current span
func End(ctx context.Context) {
	span := otelTrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}
	span.End()
}

// CreateEvent creates an event in the current span
func CreateEvent(ctx context.Context, name string, attrs ...attribute.KeyValue) {
	span := otelTrace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return
	}
	span.AddEvent(name, otelTrace.WithAttributes(attrs...))
}

// StartChildSpan starts a child span from the current span
func StartChildSpan(ctx context.Context, spanName string) (context.Context, otelTrace.Span) {
	tracer := otel.Tracer("genai-app")
	ctx, span := tracer.Start(ctx, spanName)
	return ctx, span
}