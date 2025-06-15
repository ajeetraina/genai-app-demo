import React, { useState, useRef, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isDarkMode: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isDarkMode }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
      setIsTyping(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setIsTyping(value.length > 0);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  // Container styles with inline fallbacks
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
    padding: '1rem',
    borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    transition: 'all 0.3s ease',
  };

  // Input area styles
  const inputAreaStyles: React.CSSProperties = {
    flex: 1,
    position: 'relative' as const,
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '44px',
    maxHeight: '120px',
    padding: '0.75rem 1rem',
    border: `2px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
    borderRadius: '1rem',
    resize: 'none' as const,
    fontSize: '1rem',
    lineHeight: '1.5',
    outline: 'none',
    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#1f2937',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  };

  const textareaFocusStyles: React.CSSProperties = {
    borderColor: '#3b82f6',
    boxShadow: isDarkMode 
      ? '0 0 0 3px rgba(59, 130, 246, 0.2)' 
      : '0 0 0 3px rgba(59, 130, 246, 0.1)',
  };

  // Send button styles
  const sendButtonStyles: React.CSSProperties = {
    minWidth: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    cursor: message.trim() ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    transition: 'all 0.2s ease',
    backgroundColor: message.trim() 
      ? '#3b82f6' 
      : (isDarkMode ? '#4b5563' : '#d1d5db'),
    color: message.trim() 
      ? '#ffffff' 
      : (isDarkMode ? '#9ca3af' : '#6b7280'),
    opacity: message.trim() ? 1 : 0.6,
  };

  const sendButtonHoverStyles: React.CSSProperties = {
    backgroundColor: message.trim() ? '#2563eb' : sendButtonStyles.backgroundColor,
    transform: message.trim() ? 'scale(1.05)' : 'none',
  };

  // Character count styles
  const characterCountStyles: React.CSSProperties = {
    position: 'absolute' as const,
    bottom: '-1.5rem',
    right: '0.5rem',
    fontSize: '0.75rem',
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    opacity: isTyping ? 1 : 0,
    transition: 'opacity 0.2s ease',
  };

  // Typing indicator styles
  const typingIndicatorStyles: React.CSSProperties = {
    position: 'absolute' as const,
    top: '-1.5rem',
    left: '0.5rem',
    fontSize: '0.75rem',
    color: '#3b82f6',
    opacity: isTyping ? 1 : 0,
    transition: 'opacity 0.2s ease',
  };

  const placeholderText = isDarkMode 
    ? "Type your message... (Press Enter to send, Shift+Enter for new line)"
    : "Type your message... (Press Enter to send, Shift+Enter for new line)";

  return (
    <div 
      style={containerStyles}
      className={`message-input-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
    >
      <div style={inputAreaStyles}>
        {/* Typing indicator */}
        <div style={typingIndicatorStyles}>
          ✏️ Typing...
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={(e) => {
            Object.assign(e.target.style, {
              ...textareaStyles,
              ...textareaFocusStyles,
            });
          }}
          onBlur={(e) => {
            Object.assign(e.target.style, textareaStyles);
          }}
          style={textareaStyles}
          placeholder={placeholderText}
          className={`message-textarea ${isDarkMode ? 'dark' : 'light'}`}
          aria-label="Type your message"
        />

        {/* Character count */}
        <div style={characterCountStyles}>
          {message.length}/1000
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!message.trim()}
        style={sendButtonStyles}
        onMouseEnter={(e) => {
          if (message.trim()) {
            Object.assign(e.currentTarget.style, {
              ...sendButtonStyles,
              ...sendButtonHoverStyles,
            });
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, sendButtonStyles);
        }}
        className={`send-button ${message.trim() ? 'enabled' : 'disabled'} ${isDarkMode ? 'dark' : 'light'}`}
        aria-label="Send message"
        title={message.trim() ? 'Send message (Enter)' : 'Type a message first'}
      >
        {message.trim() ? '🚀' : '📝'}
      </button>
    </div>
  );
};

export default MessageInput;