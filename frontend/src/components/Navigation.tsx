import React from 'react';

type ViewType = 'chat' | 'metrics' | 'model-info';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  isConnected: boolean;
  modelStatus: 'loading' | 'ready' | 'error';
}

const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  isDarkMode,
  onThemeToggle,
  isConnected,
  modelStatus
}) => {
  const navStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    boxShadow: isDarkMode 
      ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
      : '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const logoStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const navLinksStyles: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  };

  const getLinkStyles = (view: ViewType): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: currentView === view 
      ? (isDarkMode ? '#3b82f6' : '#3b82f6')
      : 'transparent',
    color: currentView === view 
      ? '#ffffff'
      : (isDarkMode ? '#d1d5db' : '#6b7280'),
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });

  const themeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: `2px solid ${isDarkMode ? '#6b7280' : '#d1d5db'}`,
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: isDarkMode ? '#ffffff' : '#1f2937',
    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  return (
    <nav style={navStyles}>
      {/* Logo */}
      <div style={logoStyles}>
        🤖 GenAI Model Runner
        {modelStatus === 'ready' && (
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '0.25rem 0.5rem',
            borderRadius: '1rem',
            fontWeight: 'normal'
          }}>
            LIVE
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <div style={navLinksStyles}>
        <button
          onClick={() => onViewChange('chat')}
          style={getLinkStyles('chat')}
          onMouseEnter={(e) => {
            if (currentView !== 'chat') {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== 'chat') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          💬 Chat
        </button>

        <button
          onClick={() => onViewChange('metrics')}
          style={getLinkStyles('metrics')}
          onMouseEnter={(e) => {
            if (currentView !== 'metrics') {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== 'metrics') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          📊 Metrics
        </button>

        <button
          onClick={() => onViewChange('model-info')}
          style={getLinkStyles('model-info')}
          onMouseEnter={(e) => {
            if (currentView !== 'model-info') {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== 'model-info') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          ⚙️ Model Info
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          style={themeButtonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#ffffff';
          }}
          title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;