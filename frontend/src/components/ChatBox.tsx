import { useState, useEffect } from 'react';
import { Message, MessageMetrics, ModelMetadata } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Metrics } from './Metrics';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true); // Default to true to show metrics
  const [messageMetrics, setMessageMetrics] = useState<Record<string, MessageMetrics>>({});
  const [modelInfo, setModelInfo] = useState<ModelMetadata | null>(null);

  // Load messages from local storage on initial render
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }

    // Fetch model information
    fetchModelInfo();
  }, []);

  // Save messages to local storage when they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('http://localhost:8080/health');
      if (response.ok) {
        const data = await response.json();
        if (data.model_info) {
          setModelInfo(data.model_info);
        }
      }
    } catch (e) {
      console.error('Failed to fetch model info:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const currentInput = input;
    setInput('');
    setError(null);

    try {
      // Record message metrics
      const messageId = Date.now().toString();
      const requestStartTime = performance.now();
      const tokensIn = estimateTokenCount(currentInput);
      
      console.log('Input tokens calculated:', tokensIn); // Debug log
      
      const metric: MessageMetrics = {
        requestTime: requestStartTime,
        responseTime: 0,
        tokensIn: tokensIn,
        tokensOut: 0,
        firstTokenTime: 0
      };
      setMessageMetrics(prev => ({ ...prev, [messageId]: metric }));

      // Add user message to the chat with token count
      const userMessage: Message = {
        id: messageId,
        role: 'user',
        content: currentInput,
        metrics: {
          tokensIn: tokensIn
        }
      };
      
      setMessages(prev => [...prev, userMessage]);
      console.log('User message with metrics:', userMessage); // Debug log

      // Send message to the backend
      const response = await fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, messages: messages }),
      });

      if (response.status !== 200) {
        setError(`Error: ${response.statusText || 'Failed to get response'}`);
        logError('api_error', response.status, currentInput.length);
        return;
      }

      await handleStreamResponse(response, messageId, requestStartTime);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error. Please check your connection and try again.');
      logError('network_error', 0, currentInput.length);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamResponse = async (response: Response, messageId: string, requestStartTime: number) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let hasReceivedFirstToken = false;

    const aiMessageId = Date.now().toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      metrics: {
        tokensOut: 0
      }
    };
    setMessages((prev) => [...prev, aiMessage]);

    let tokenCount = 0;
    while (!done && reader) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value, { stream: true });
      
      tokenCount += chunk.length > 0 ? 1 : 0; // Approximate token count
      
      // Record time to first token
      if (!hasReceivedFirstToken && chunk.length > 0) {
        hasReceivedFirstToken = true;
        const firstTokenTime = performance.now();
        setMessageMetrics(prev => {
          const metric = prev[messageId];
          if (metric) {
            return {
              ...prev,
              [messageId]: {
                ...metric,
                firstTokenTime: firstTokenTime - requestStartTime
              }
            };
          }
          return prev;
        });
      }

      // Update message content and token count
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { 
                ...msg, 
                content: msg.content + chunk,
                metrics: {
                  ...msg.metrics,
                  tokensOut: tokenCount
                }
              }
            : msg,
        ),
      );
    }

    // Record final metrics after response is complete
    const responseEndTime = performance.now();
    setMessageMetrics(prev => {
      const metric = prev[messageId];
      if (metric) {
        return {
          ...prev,
          [messageId]: {
            ...metric,
            responseTime: responseEndTime - requestStartTime,
            tokensOut: tokenCount
          }
        };
      }
      return prev;
    });

    // Log metrics to the backend
    logMetrics(messageId, tokenCount, responseEndTime - requestStartTime);
  };

  const estimateTokenCount = (text: string): number => {
    // Very rough token estimation (4 chars per token on average)
    const count = Math.ceil(text.length / 4);
    return count > 0 ? count : 1; // Ensure at least 1 token for any non-empty text
  };

  const logMetrics = async (messageId: string, tokenCount: number, responseTime: number) => {
    try {
      const metric = messageMetrics[messageId];
      if (!metric) return;
      
      // Send metrics to backend
      await fetch('http://localhost:8080/metrics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          tokens_in: metric.tokensIn,
          tokens_out: tokenCount,
          response_time_ms: responseTime,
          time_to_first_token_ms: metric.firstTokenTime || 0
        }),
      });
    } catch (e) {
      console.error('Failed to log metrics:', e);
    }
  };

  const logError = async (errorType: string, statusCode: number, inputLength: number) => {
    try {
      await fetch('http://localhost:8080/metrics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: errorType,
          status_code: statusCode,
          input_length: inputLength,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setMessageMetrics({});
    localStorage.removeItem('chatMessages');
  };

  const toggleMetrics = () => {
    setShowMetrics(!showMetrics);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[calc(100vh-180px)] rounded-lg shadow-lg border dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Chat with Llama 3.2</h2>
          {modelInfo && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {modelInfo.model}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleMetrics}
            className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
            >
              Clear conversation
            </button>
          )}
        </div>
      </div>
      
      {showMetrics && <Metrics isVisible={showMetrics} />}
      
      <MessageList messages={messages} showTokenCount={true} />
      <MessageInput
        input={input}
        setInput={setInput}
        sendMessage={handleSendMessage}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}