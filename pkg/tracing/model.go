package tracing

import (
	"context"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// TracedModelInference creates spans for model inference operations
type TracedModelInference struct {
	Ctx         context.Context
	ModelName   string
	ParentSpan  trace.Span
	CurrentSpan trace.Span
	StartTime   time.Time
}

// NewTracedModelInference creates a new traced model inference
func NewTracedModelInference(ctx context.Context, modelName string) *TracedModelInference {
	// Start the parent span for the overall inference
	ctx, span := StartSpan(ctx, "model_inference")
	span.SetAttributes(
		attribute.String("model.name", modelName),
		attribute.String("inference.type", "streaming"),
	)

	return &TracedModelInference{
		Ctx:        ctx,
		ModelName:  modelName,
		ParentSpan: span,
		StartTime:  time.Now(),
	}
}

// StartProcessing starts a processing phase span
func (t *TracedModelInference) StartProcessing(name string) {
	_, span := StartChildSpan(t.Ctx, name)
	t.CurrentSpan = span
}

// EndProcessing ends the current processing phase span
func (t *TracedModelInference) EndProcessing() {
	if t.CurrentSpan != nil {
		t.CurrentSpan.End()
		t.CurrentSpan = nil
	}
}

// RecordFirstToken records when the first token is received
func (t *TracedModelInference) RecordFirstToken(ttft time.Duration) {
	if t.ParentSpan == nil {
		return
	}
	
	t.ParentSpan.AddEvent("first_token", trace.WithAttributes(
		attribute.Float64("time_to_first_token_ms", float64(ttft.Milliseconds())),
	))
	t.ParentSpan.SetAttributes(attribute.Float64("time_to_first_token_sec", ttft.Seconds()))
}

// RecordTokenCounts records the input and output token counts
func (t *TracedModelInference) RecordTokenCounts(inputTokens, outputTokens int) {
	if t.ParentSpan == nil {
		return
	}
	
	t.ParentSpan.SetAttributes(
		attribute.Int("tokens.input", inputTokens),
		attribute.Int("tokens.output", outputTokens),
	)
}

// End ends the parent span and records completion metrics
func (t *TracedModelInference) End(outputTokens int, err error) {
	if t.ParentSpan == nil {
		return
	}
	
	totalDuration := time.Since(t.StartTime)
	t.ParentSpan.SetAttributes(
		attribute.Float64("duration_sec", totalDuration.Seconds()),
		attribute.Int("tokens.output.total", outputTokens),
	)
	
	if err != nil {
		RecordError(t.Ctx, err, "Model inference error")
	}
	
	t.ParentSpan.End()
}
