import React, { useState, useEffect } from 'react';
import './App.css';
import ChatBox from './components/ChatBox';
import MetricsPanel from './components/MetricsPanel';
import ModelInfo from './components/ModelInfo';
import Navigation from './components/Navigation';

type ViewType = 'chat' | 'metrics' | 'model-info';

interface AppState {
  currentView: ViewType;
  isDarkMode: boolean;
  isConnected: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
}

function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'chat',
    isDarkMode: false,
    isConnected: false,
    modelStatus: 'loading'
  });

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setState(prev => ({ ...prev, isDarkMode: shouldUseDark }));
    
    // Apply theme to HTML element
    document.documentElement.classList.toggle('dark', shouldUseDark);
    
    console.log(`🎨 App theme initialized: ${shouldUseDark ? 'DARK' : 'LIGHT'}`);
  }, []);

  // Check backend connection and model status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setState(prev => ({ 
            ...prev, 
            isConnected: true, 
            modelStatus: 'ready' 
          }));
        }
      } catch (error) {
        console.warn('Backend connection check failed:', error);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          modelStatus: 'error' 
        }));
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !state.isDarkMode;
    console.log(`🔄 App theme toggle - switching to ${newTheme ? 'DARK' : 'LIGHT'}`);
    
    setState(prev => ({ ...prev, isDarkMode: newTheme }));
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Apply theme to HTML element
    document.documentElement.classList.toggle('dark', newTheme);
  };

  const handleViewChange = (view: ViewType) => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'chat':
        return (
          <ChatBox 
            isDarkMode={state.isDarkMode}
            isConnected={state.isConnected}
            modelStatus={state.modelStatus}
          />
        );
      case 'metrics':
        return (
          <MetricsPanel 
            isDarkMode={state.isDarkMode}
            isConnected={state.isConnected}
          />
        );
      case 'model-info':
        return (
          <ModelInfo 
            isDarkMode={state.isDarkMode}
            isConnected={state.isConnected}
            modelStatus={state.modelStatus}
          />
        );
      default:
        return (
          <ChatBox 
            isDarkMode={state.isDarkMode}
            isConnected={state.isConnected}
            modelStatus={state.modelStatus}
          />
        );
    }
  };

  // App container styles with theme support
  const appStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: state.isDarkMode ? '#0f172a' : '#ffffff',
    color: state.isDarkMode ? '#ffffff' : '#1f2937',
    transition: 'all 0.3s ease',
  };

  return (
    <div className="App" style={appStyles}>
      {/* Navigation Header */}
      <Navigation 
        currentView={state.currentView}
        onViewChange={handleViewChange}
        isDarkMode={state.isDarkMode}
        onThemeToggle={handleThemeToggle}
        isConnected={state.isConnected}
        modelStatus={state.modelStatus}
      />

      {/* Main Content Area */}
      <main className="app-main">
        {renderCurrentView()}
      </main>

      {/* Status Bar */}
      <footer className="app-footer" style={{
        padding: '0.5rem 1rem',
        borderTop: `1px solid ${state.isDarkMode ? '#374151' : '#e5e7eb'}`,
        backgroundColor: state.isDarkMode ? '#1f2937' : '#f9fafb',
        fontSize: '0.875rem',
        color: state.isDarkMode ? '#9ca3af' : '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="connection-status">
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: state.isConnected ? '#10b981' : '#ef4444',
            marginRight: '0.5rem'
          }}></span>
          {state.isConnected ? 'Connected to Model Runner' : 'Disconnected'}
        </div>
        
        <div className="model-status">
          Model: {state.modelStatus === 'ready' ? '✅ Ready' : 
                 state.modelStatus === 'loading' ? '⏳ Loading' : '❌ Error'}
        </div>
        
        <div className="app-info">
          GenAI Model Runner v1.0 | 
          <a 
            href="http://localhost:3001" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: state.isDarkMode ? '#60a5fa' : '#3b82f6',
              textDecoration: 'none',
              marginLeft: '0.5rem'
            }}
          >
            📊 Grafana
          </a>
          <a 
            href="http://localhost:16686" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: state.isDarkMode ? '#60a5fa' : '#3b82f6',
              textDecoration: 'none',
              marginLeft: '0.5rem'
            }}
          >
            🔍 Jaeger
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;