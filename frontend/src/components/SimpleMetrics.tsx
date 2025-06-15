import React, { useState, useEffect } from 'react';
import { Message } from '../types';

interface SimpleMetricsProps {
  messages: Message[];
}

export function SimpleMetrics({ messages }: SimpleMetricsProps) {
  const [serverData, setServerData] = useState({
    totalRequests: 0,
    averageResponseTime: 0,
    activeUsers: 0,
    errorRate: 0,
  });

  useEffect(() => {
    // Fetch basic server metrics every 5 seconds
    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8080/metrics/summary');
        if (response.ok) {
          const data = await response.json();
          setServerData({
            totalRequests: data.totalRequests || 0,
            averageResponseTime: data.averageResponseTime || 0,
            activeUsers: data.activeUsers || 0,
            errorRate: data.errorRate || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calculate tokens directly from messages
  const calculateTokens = () => {
    let inputTokens = 0;
    let outputTokens = 0;

    messages.forEach(message => {
      if (message.role === 'user') {
        // Use metrics if available or fallback to estimation
        if (message.metrics?.tokensIn) {
          inputTokens += message.metrics.tokensIn;
        } else {
          inputTokens += Math.ceil(message.content.length / 4) || 1;
        }
      } else if (message.role === 'assistant') {
        // Use metrics if available or fallback to estimation
        if (message.metrics?.tokensOut) {
          outputTokens += message.metrics.tokensOut;
        } else {
          outputTokens += Math.ceil(message.content.length / 4) || 1;
        }
      }
    });

    return { inputTokens, outputTokens };
  };

  const { inputTokens, outputTokens } = calculateTokens();

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">System Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Requests</div>
          <div className="text-lg font-semibold">{serverData.totalRequests}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</div>
          <div className="text-lg font-semibold">{serverData.averageResponseTime.toFixed(2)}s</div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Input Tokens</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{inputTokens}</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Output Tokens</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">{outputTokens}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
          <div className="text-lg font-semibold">{serverData.activeUsers}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
          <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
          <div className={`text-lg font-semibold ${serverData.errorRate > 0.05 ? 'text-red-500' : ''}`}>
            {(serverData.errorRate * 100).toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <p className="mb-1">Tokens are approximately calculated based on the text length. Actual token count may vary based on the model's tokenizer.</p>
        <p>
          <span className="font-medium">Error Rate</span> is the percentage of requests that failed out of the total requests.
        </p>
        <a 
          href="http://localhost:3001" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-block underline hover:text-blue-500"
        >
          View detailed metrics dashboard
        </a>
      </div>
    </div>
  );
}