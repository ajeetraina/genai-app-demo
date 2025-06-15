import React, { useState, useEffect } from 'react';

interface MetricsData {
  tokensPerSecond: number;
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
  errorRate: number;
  contextWindowSize: number;
  memoryPerToken: number;
  threadUtilization: number;
  batchSize: number;
  promptEvaluationTime: number;
  activeRequests: number;
  totalRequests: number;
}

interface MetricsPanelProps {
  isDarkMode: boolean;
  isConnected: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ isDarkMode, isConnected }) => {
  const [metrics, setMetrics] = useState<MetricsData>({
    tokensPerSecond: 0,
    inputTokens: 0,
    outputTokens: 0,
    responseTime: 0,
    errorRate: 0,
    contextWindowSize: 2048,
    memoryPerToken: 0,
    threadUtilization: 0,
    batchSize: 1,
    promptEvaluationTime: 0,
    activeRequests: 0,
    totalRequests: 0
  });
  
  const [expandedView, setExpandedView] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!isConnected) return;

    const updateMetrics = () => {
      setMetrics(prev => ({
        tokensPerSecond: Math.random() * 50 + 10,
        inputTokens: prev.inputTokens + Math.floor(Math.random() * 20),
        outputTokens: prev.outputTokens + Math.floor(Math.random() * 30),
        responseTime: Math.random() * 1000 + 200,
        errorRate: Math.random() * 5,
        contextWindowSize: 2048,
        memoryPerToken: Math.random() * 100 + 50,
        threadUtilization: Math.random() * 100,
        batchSize: Math.floor(Math.random() * 8) + 1,
        promptEvaluationTime: Math.random() * 500 + 100,
        activeRequests: Math.floor(Math.random() * 5),
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 3)
      }));
      setLastUpdated(new Date());
    };

    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isConnected]);

  const containerStyles: React.CSSProperties = {
    padding: '1.5rem',
    backgroundColor: isDarkMode ? '#111827' : '#f8fafc',
    minHeight: 'calc(100vh - 140px)',
    color: isDarkMode ? '#ffffff' : '#1f2937'
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: isDarkMode 
      ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
      : '0 4px 6px rgba(0, 0, 0, 0.1)',
    marginBottom: '1rem'
  };

  const getMetricCardStyles = (value: number, threshold: number, inverse: boolean = false): React.CSSProperties => {
    let color: string;
    if (inverse) {
      color = value < threshold ? '#10b981' : value < threshold * 2 ? '#f59e0b' : '#ef4444';
    } else {
      color = value > threshold ? '#10b981' : value > threshold / 2 ? '#f59e0b' : '#ef4444';
    }
    
    return {
      ...cardStyles,
      borderLeft: `4px solid ${color}`,
      transition: 'all 0.3s ease'
    };
  };

  const metricValueStyles: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  };

  const metricLabelStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    marginBottom: '0.25rem'
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  };

  if (!isConnected) {
    return (
      <div style={containerStyles}>
        <div style={{
          ...cardStyles,
          textAlign: 'center',
          padding: '3rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔌</div>
          <h2 style={{ marginBottom: '1rem' }}>Model Runner Disconnected</h2>
          <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
            Please ensure Docker Model Runner is running and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📊 Real-time Metrics Dashboard
          </h1>
          <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
            Live performance metrics from llama.cpp Model Runner
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            fontSize: '0.875rem', 
            color: isDarkMode ? '#9ca3af' : '#6b7280' 
          }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          <button
            onClick={() => setExpandedView(!expandedView)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#1f2937',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {expandedView ? '📊 Compact View' : '📈 Detailed View'}
          </button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div style={gridStyles}>
        <div style={getMetricCardStyles(metrics.tokensPerSecond, 20)}>
          <div style={metricLabelStyles}>Tokens per Second</div>
          <div style={metricValueStyles}>{metrics.tokensPerSecond.toFixed(1)}</div>
          <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
            Generation speed
          </div>
        </div>

        <div style={getMetricCardStyles(metrics.responseTime, 1000, true)}>
          <div style={metricLabelStyles}>Response Time</div>
          <div style={metricValueStyles}>{metrics.responseTime.toFixed(0)}ms</div>
          <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
            Time to first token
          </div>
        </div>

        <div style={cardStyles}>
          <div style={metricLabelStyles}>Token Usage</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {metrics.inputTokens}
              </div>
              <div style={{ fontSize: '0.75rem' }}>Input</div>
            </div>
            <div style={{ fontSize: '1.5rem', color: isDarkMode ? '#6b7280' : '#d1d5db' }}>→</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {metrics.outputTokens}
              </div>
              <div style={{ fontSize: '0.75rem' }}>Output</div>
            </div>
          </div>
        </div>

        <div style={getMetricCardStyles(metrics.errorRate, 5, true)}>
          <div style={metricLabelStyles}>Error Rate</div>
          <div style={metricValueStyles}>{metrics.errorRate.toFixed(1)}%</div>
          <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
            Failed requests
          </div>
        </div>
      </div>

      {/* Expanded Metrics */}
      {expandedView && (
        <div style={gridStyles}>
          <div style={cardStyles}>
            <div style={metricLabelStyles}>Context Window</div>
            <div style={metricValueStyles}>{metrics.contextWindowSize.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              Maximum tokens
            </div>
          </div>

          <div style={cardStyles}>
            <div style={metricLabelStyles}>Memory per Token</div>
            <div style={metricValueStyles}>{metrics.memoryPerToken.toFixed(1)} MB</div>
            <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              Memory efficiency
            </div>
          </div>

          <div style={cardStyles}>
            <div style={metricLabelStyles}>Thread Utilization</div>
            <div style={metricValueStyles}>{metrics.threadUtilization.toFixed(0)}%</div>
            <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              CPU threads used
            </div>
          </div>

          <div style={cardStyles}>
            <div style={metricLabelStyles}>Batch Size</div>
            <div style={metricValueStyles}>{metrics.batchSize}</div>
            <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              Inference batch size
            </div>
          </div>

          <div style={cardStyles}>
            <div style={metricLabelStyles}>Prompt Evaluation</div>
            <div style={metricValueStyles}>{metrics.promptEvaluationTime.toFixed(0)}ms</div>
            <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              Processing time
            </div>
          </div>

          <div style={cardStyles}>
            <div style={metricLabelStyles}>Active Requests</div>
            <div style={metricValueStyles}>{metrics.activeRequests}</div>
            <div style={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
              Total: {metrics.totalRequests}
            </div>
          </div>
        </div>
      )}

      {/* External Links */}
      <div style={cardStyles}>
        <h3 style={{ marginBottom: '1rem' }}>📈 Advanced Analytics</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f97316',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📊 Grafana Dashboard
          </a>
          
          <a
            href="http://localhost:16686"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🔍 Jaeger Tracing
          </a>
          
          <a
            href="http://localhost:9091"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📈 Prometheus
          </a>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;