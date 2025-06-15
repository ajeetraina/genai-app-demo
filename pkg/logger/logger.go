package logger

import (
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Init initializes the global logger
func Init(level string, pretty bool) {
	// Set the global logger
	zerolog.TimeFieldFormat = time.RFC3339
	zerolog.SetGlobalLevel(parseLevel(level))

	var output io.Writer = os.Stdout
	if pretty {
		output = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
	}

	log.Logger = zerolog.New(output).With().Timestamp().Caller().Logger()
}

// parseLevel converts a string level to zerolog.Level
func parseLevel(level string) zerolog.Level {
	switch level {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	default:
		return zerolog.InfoLevel
	}
}

// Logger is a wrapper around zerolog.Logger
type Logger struct {
	logger zerolog.Logger
}

// New creates a new logger with the given context
func New(component string) *Logger {
	return &Logger{
		logger: log.With().Str("component", component).Logger(),
	}
}

// WithField adds a field to the logger
func (l *Logger) WithField(key string, value interface{}) *Logger {
	return &Logger{
		logger: l.logger.With().Interface(key, value).Logger(),
	}
}

// Debug logs a debug message
func (l *Logger) Debug(msg string) {
	l.logger.Debug().Msg(msg)
}

// Info logs an info message
func (l *Logger) Info(msg string) {
	l.logger.Info().Msg(msg)
}

// Warn logs a warning message
func (l *Logger) Warn(msg string) {
	l.logger.Warn().Msg(msg)
}

// Error logs an error message
func (l *Logger) Error(msg string, err error) {
	l.logger.Error().Err(err).Msg(msg)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(msg string, err error) {
	l.logger.Fatal().Err(err).Msg(msg)
}
