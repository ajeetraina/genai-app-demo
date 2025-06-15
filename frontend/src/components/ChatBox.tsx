import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    setIsDarkMode(shouldUseDark);
    
    // Apply theme to HTML element
    document.documentElement.classList.toggle('dark', shouldUseDark);
    
    console.log(`🎨 Initial theme: ${shouldUseDark ? 'DARK' : 'LIGHT'}`);
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    console.log(`🔄 Theme toggle clicked - switching from ${isDarkMode ? 'DARK' : 'LIGHT'} to ${newTheme ? 'DARK' : 'LIGHT'}`);
    
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Apply theme to HTML element
    document.documentElement.classList.toggle('dark', newTheme);
    
    // Debug logging
    setTimeout(() => {
      const hasClass = document.documentElement.classList.contains('dark');
      console.log(`${newTheme ? '🌙' : '☀️'} ${newTheme ? 'Dark' : 'Light'} mode activated`);
      console.log(`✅ Dark class ${hasClass ? 'IS' : 'IS NOT'} present on HTML element`);
    }, 100);
  };

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I received your message: "${text}"`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  // Dynamic styles with inline fallbacks
  const chatBoxStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#000000',
    transition: 'all 0.3s ease',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
  };

  const themeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: `2px solid ${isDarkMode ? '#6b7280' : '#d1d5db'}`,
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: isDarkMode ? '#ffffff' : '#000000',
    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
    transition: 'all 0.2s ease',
  };

  return (
    <div 
      className={`chatbox-container ${isDarkMode ? 'dark-theme' : 'light-theme'}`}
      style={chatBoxStyles}
    >
      {/* Header with Theme Toggle */}
      <header style={headerStyles}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          Chat Application
        </h1>
        <button
          onClick={toggleTheme}
          style={themeButtonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#ffffff';
          }}
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* Messages Area */}
      <MessageList messages={messages} isDarkMode={isDarkMode} />

      {/* Input Area */}
      <MessageInput onSendMessage={handleSendMessage} isDarkMode={isDarkMode} />
    </div>
  );
};

export default ChatBox;