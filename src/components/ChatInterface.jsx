// File: src/components/ChatInterface.jsx
import React, { useState } from 'react';
import GPUMetricsPanel from './GPUMetricsPanel';

/**
 * Example of how to integrate the GPU Metrics Panel into a chatbot UI
 * This file shows the changes needed in your existing chatbot component
 */
const ChatInterface = ({ modelName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add this state for GPU metrics visibility toggle
  const [showGpuMetrics, setShowGpuMetrics] = useState(true);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Call your existing API for model inference
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: modelName
        }),
      });
      
      const data = await response.json();
      
      // Add response to chat
      setMessages(prevMessages => [...prevMessages, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, { 
        role: 'system', 
        content: 'Error: Failed to get response from model.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="chat-container">
      {/* Existing chat UI code */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isProcessing && (
          <div className="message assistant processing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          disabled={isProcessing}
        />
        <button onClick={handleSendMessage} disabled={isProcessing}>
          Send
        </button>
        
        {/* Add button to toggle GPU metrics visibility */}
        <button 
          className="metrics-toggle"
          onClick={() => setShowGpuMetrics(!showGpuMetrics)}
          title={showGpuMetrics ? "Hide GPU Metrics" : "Show GPU Metrics"}
        >
          {showGpuMetrics ? "Hide Metrics" : "Show Metrics"}
        </button>
      </div>
      
      {/* Add the GPU Metrics Panel component */}
      <GPUMetricsPanel 
        modelName={modelName}
        isVisible={showGpuMetrics}
      />
    </div>
  );
};

export default ChatInterface;
