import React, { useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isDarkMode: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isDarkMode }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Container styles with inline fallbacks
  const containerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    backgroundColor: isDarkMode ? '#111827' : '#f8fafc',
    color: isDarkMode ? '#ffffff' : '#1f2937',
    transition: 'all 0.3s ease',
  };

  // Message bubble styles
  const getMessageStyles = (sender: 'user' | 'assistant'): React.CSSProperties => {
    const isUser = sender === 'user';
    
    return {
      marginBottom: '1rem',
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    };
  };

  const getBubbleStyles = (sender: 'user' | 'assistant'): React.CSSProperties => {
    const isUser = sender === 'user';
    
    // Force theme colors with inline styles
    let backgroundColor: string;
    let color: string;
    let borderColor: string;

    if (isDarkMode) {
      backgroundColor = isUser ? '#3b82f6' : '#374151';
      color = '#ffffff';
      borderColor = isUser ? '#2563eb' : '#4b5563';
    } else {
      backgroundColor = isUser ? '#3b82f6' : '#ffffff';
      color = isUser ? '#ffffff' : '#1f2937';
      borderColor = isUser ? '#2563eb' : '#e5e7eb';
    }

    return {
      maxWidth: '70%',
      padding: '0.75rem 1rem',
      borderRadius: isUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
      backgroundColor,
      color,
      border: `1px solid ${borderColor}`,
      boxShadow: isDarkMode 
        ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
        : '0 2px 4px rgba(0, 0, 0, 0.1)',
      wordWrap: 'break-word',
      transition: 'all 0.3s ease',
    };
  };

  const getTimestampStyles = (): React.CSSProperties => ({
    fontSize: '0.75rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    marginTop: '0.25rem',
    textAlign: 'center' as const,
  });

  const getSenderLabelStyles = (sender: 'user' | 'assistant'): React.CSSProperties => ({
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: isDarkMode ? '#d1d5db' : '#4b5563',
    marginBottom: '0.25rem',
    textAlign: sender === 'user' ? 'right' : 'left' as const,
  });

  // Empty state styles
  const emptyStateStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    fontSize: '1.1rem',
  };

  const emptyIconStyles: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  };

  if (messages.length === 0) {
    return (
      <div style={containerStyles}>
        <div style={emptyStateStyles}>
          <div style={emptyIconStyles}>💬</div>
          <p>No messages yet. Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={containerStyles}
      className={`message-list ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
    >
      {messages.map((message) => (
        <div key={message.id} style={getMessageStyles(message.sender)}>
          <div>
            <div style={getSenderLabelStyles(message.sender)}>
              {message.sender === 'user' ? 'You' : 'Assistant'}
            </div>
            <div 
              style={getBubbleStyles(message.sender)}
              className={`message-bubble ${message.sender}-message ${isDarkMode ? 'dark' : 'light'}`}
            >
              {message.text}
            </div>
            <div style={getTimestampStyles()}>
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;