import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiUser, FiMessageSquare, FiUpload, FiDatabase, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import DocumentUploader from './DocumentUploader';
import SourceCitations from './SourceCitations';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (ragEnabled) {
        await sendRagMessage(userMessage.content);
      } else {
        await sendRegularMessage(userMessage.content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }]);
      setIsLoading(false);
    }
  };

  const sendRegularMessage = async (content) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage.content += chunk;
        setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error streaming response:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const sendRagMessage = async (content) => {
    try {
      const response = await fetch('/api/rag/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: content }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage = { 
        role: 'assistant', 
        content: '',
        sources: [],
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const events = chunk.split('\n\n').filter(Boolean);
        
        for (const event of events) {
          if (event.startsWith('data: ')) {
            try {
              const data = JSON.parse(event.slice(6));
              
              if (data.type === 'token') {
                assistantMessage.content += data.text;
                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
                
                if (data.done) {
                  setIsLoading(false);
                }
              } else if (data.type === 'sources') {
                assistantMessage.sources = data.sources;
                setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming RAG response:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const handleDocumentUploaded = (document) => {
    // Add a system message to inform the user
    setMessages(prev => [
      ...prev, 
      { 
        role: 'system', 
        content: `Document uploaded: ${document.name} (${document.chunks_count} chunks processed)` 
      }
    ]);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header with RAG toggle */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
          <FiMessageSquare className="mr-2" /> 
          GenAI Chat
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <FiUpload className="mr-1" />
            {showUploader ? 'Hide Uploader' : 'Upload Documents'}
          </button>
          
          <button 
            onClick={() => setRagEnabled(!ragEnabled)}
            className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <FiDatabase className="mr-1" />
            RAG Mode: 
            {ragEnabled ? (
              <span className="flex items-center ml-1 text-green-600 dark:text-green-400">
                <FiToggleRight className="mr-1" /> On
              </span>
            ) : (
              <span className="flex items-center ml-1 text-gray-400 dark:text-gray-500">
                <FiToggleLeft className="mr-1" /> Off
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Document uploader */}
      {showUploader && (
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <DocumentUploader onDocumentUploaded={handleDocumentUploaded} />
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <h2 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                Start a conversation
              </h2>
              <p className="text-gray-400 dark:text-gray-500 mb-6">
                {ragEnabled 
                  ? 'Ask questions about your uploaded documents or any general topics.' 
                  : 'Ask any questions to get started.'}
              </p>
              {ragEnabled && (
                <button
                  onClick={() => setShowUploader(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <FiUpload className="mr-2" />
                  Upload Documents
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`px-4 py-3 rounded-lg max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.role === 'system'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex mb-1 text-xs text-gray-400 dark:text-gray-500">
                      {message.role === 'user' ? (
                        <FiUser className="mr-1" />
                      ) : message.role === 'system' ? (
                        <FiDatabase className="mr-1" />
                      ) : (
                        <FiMessageSquare className="mr-1" />
                      )}
                      {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'AI Assistant'}
                    </div>
                    
                    <div className="prose dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    
                    {message.sources && <SourceCitations sources={message.sources} />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isLoading 
                ? "Please wait..." 
                : ragEnabled 
                  ? "Ask about your documents or any topic..." 
                  : "Type your message..."
            }
            disabled={isLoading}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className={`bg-blue-600 text-white px-4 py-2 rounded-r-md ${
              isLoading || !inputMessage.trim() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-700'
            }`}
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
