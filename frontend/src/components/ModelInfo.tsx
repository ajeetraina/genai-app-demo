import React, { useState, useEffect } from 'react';

interface ModelData {
  name: string;
  version: string;
  parameters: string;
  quantization: string;
  size: string;
  contextLength: number;
  architecture: string;
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  memoryUsage: number;
  gpuUsage: number;
}

interface ModelInfoProps {
  isDarkMode: boolean;
  isConnected: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
}

const ModelInfo: React.FC<ModelInfoProps> = ({ isDarkMode, isConnected, modelStatus }) => {
  const [modelData, setModelData] = useState<ModelData>({
    name: 'Llama 3.2',
    version: '1B-Q8_0',
    parameters: '1.2B',
    quantization: 'Q8_0',
    size: '1.3 GB',
    contextLength: 2048,
    architecture: 'llama.cpp',
    status: modelStatus === 'ready' ? 'running' : 'stopped',
    uptime: 0,
    memoryUsage: 0,
    gpuUsage: 0
  });

  // Update model data when connection status changes
  useEffect(() => {
    if (isConnected && modelStatus === 'ready') {
      setModelData(prev => ({ ...prev, status: 'running' }));
      
      // Simulate uptime counter
      const interval = setInterval(() => {
        setModelData(prev => ({
          ...prev,
          uptime: prev.uptime + 1,
          memoryUsage: Math.random() * 1000 + 300,
          gpuUsage: Math.random() * 100
        }));
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setModelData(prev => ({ ...prev, status: 'stopped' }));
    }
  }, [isConnected, modelStatus]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#10b981';
      case 'stopped': return '#6b7280';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          ⚙️ Model Information
        </h1>
        <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
          Detailed information about the currently loaded AI model
        </p>
      </div>

      {/* Model Status Card */}
      <div style={{
        ...cardStyles,
        borderLeft: `4px solid ${getStatusColor(modelData.status)}`,
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {getStatusIcon(modelData.status)} {modelData.name} {modelData.version}
            </h2>
            <p style={{ 
              color: getStatusColor(modelData.status),
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              Status: {modelData.status}
            </p>
          </div>
          
          {modelData.status === 'running' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {formatUptime(modelData.uptime)}
              </div>
              <div style={{ fontSize: '0.875rem', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                Uptime
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={cardStyles}>
          <h3 style={{ marginBottom: '1rem', color: '#3b82f6' }}>📊 Model Specifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Parameters:</span>
              <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{modelData.parameters}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Quantization:</span>
              <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{modelData.quantization}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Model Size:</span>
              <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{modelData.size}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Context Length:</span>
              <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{modelData.contextLength.toLocaleString()} tokens</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Architecture:</span>
              <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{modelData.architecture}</span>
            </div>
          </div>
        </div>

        <div style={cardStyles}>
          <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>💾 Resource Usage</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500' }}>Memory Usage:</span>
                <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                  {modelData.memoryUsage.toFixed(0)} MB
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((modelData.memoryUsage / 2000) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '500' }}>GPU Usage:</span>
                <span style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                  {modelData.gpuUsage.toFixed(0)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${modelData.gpuUsage}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Configuration */}
      <div style={cardStyles}>
        <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>🔧 Configuration</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Environment</h4>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              fontSize: '0.875rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              <li>• Docker Model Runner</li>
              <li>• llama.cpp backend</li>
              <li>• Apple Silicon optimized</li>
              <li>• Host-side TCP enabled</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Endpoints</h4>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              fontSize: '0.875rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              <li>• http://localhost:12434</li>
              <li>• /v1/chat/completions</li>
              <li>• /v1/models</li>
              <li>• OpenAI compatible</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>Features</h4>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              fontSize: '0.875rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280'
            }}>
              <li>• Streaming responses</li>
              <li>• Context awareness</li>
              <li>• Temperature control</li>
              <li>• Token limiting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model Actions */}
      <div style={cardStyles}>
        <h3 style={{ marginBottom: '1rem' }}>🎛️ Model Controls</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            disabled={!isConnected}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isConnected ? '#10b981' : '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: isConnected ? 1 : 0.6
            }}
          >
            🔄 Restart Model
          </button>
          
          <button
            disabled={!isConnected}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isConnected ? '#3b82f6' : '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: isConnected ? 1 : 0.6
            }}
          >
            📋 View Logs
          </button>
          
          <button
            disabled={!isConnected}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isConnected ? '#f59e0b' : '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: isConnected ? 1 : 0.6
            }}
          >
            ⚙️ Configure
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelInfo;