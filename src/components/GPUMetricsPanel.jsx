// File: src/components/GPUMetricsPanel.jsx
import React, { useState, useEffect } from 'react';

/**
 * Component for displaying real-time GPU metrics in a Docker Model Runner chatbot
 * 
 * This can be added to a separate branch as it's an enhancement to the main application
 */
const GPUMetricsPanel = ({ modelName, isVisible = true }) => {
  const [metrics, setMetrics] = useState({
    gpuUtilization: 0,
    gpuMemoryUsage: 0,
    tokensPerSecond: 0,
    temperature: 0,
    latency: 0,
    inferenceActive: false
  });
  
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Poll for metrics every 2 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const pollInterval = setInterval(async () => {
      try {
        // Call the metrics API endpoint
        const response = await fetch('/api/gpu-metrics');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch GPU metrics:', error);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div className="gpu-metrics-panel">
      <div className="gpu-metrics-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>GPU Metrics {modelName ? `(${modelName})` : ''}</h4>
        <button>{isExpanded ? '−' : '+'}</button>
      </div>
      
      {isExpanded && (
        <div className="gpu-metrics-content">
          <div className="metric-item">
            <span className="metric-label">GPU Utilization:</span>
            <span className="metric-value">{metrics.gpuUtilization}%</span>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ width: `${metrics.gpuUtilization}%`, 
                         backgroundColor: metrics.gpuUtilization > 80 ? '#ff4d4d' : '#4d94ff' }} 
              />
            </div>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">GPU Memory:</span>
            <span className="metric-value">{metrics.gpuMemoryUsage}%</span>
            <div className="metric-bar">
              <div 
                className="metric-fill" 
                style={{ width: `${metrics.gpuMemoryUsage}%`,
                         backgroundColor: metrics.gpuMemoryUsage > 80 ? '#ff4d4d' : '#4d94ff' }} 
              />
            </div>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Tokens/sec:</span>
            <span className="metric-value">{metrics.tokensPerSecond.toFixed(1)}</span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Latency:</span>
            <span className="metric-value">{metrics.latency.toFixed(0)} ms</span>
          </div>
          
          <div className="metric-status">
            <span className={`status-indicator ${metrics.inferenceActive ? 'active' : 'idle'}`} />
            <span>{metrics.inferenceActive ? 'Processing' : 'Idle'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPUMetricsPanel;
