import React, { useState, useEffect } from 'react';
import { Message, MetricsData } from '../types';

interface CombinedMetricsProps {
  isVisible: boolean;
  messages: Message[];
}

export function CombinedMetrics({ isVisible, messages }: CombinedMetricsProps) {
  const [serverMetrics, setServerMetrics] = useState<MetricsData>({
    totalRequests: 0,
    averageResponseTime: 0,
    tokensGenerated: 0,
    tokensProcessed: 0,
    activeUsers: 0,
    errorRate: 0,
  });

  // Direct token calculation that works regardless of how the metrics are structured
  const calculateTokens = () => {
    let inputTokens = 0;
    let outputTokens = 0;
    
    // Loop through all messages and sum up their tokens
    messages.forEach(message => {
      if (message.role === 'user') {
        // If metrics exist, use them; otherwise estimate
        if (message.metrics?.tokensIn) {
          inputTokens += message.metrics.tokensIn;
        } else {
          // Estimate tokens (4 chars per token)
          inputTokens += Math.max(1, Math.ceil(message.content.length / 4));
        }
      } else if (message.role === 'assistant') {
        // If metrics exist, use them; otherwise estimate
        if (message.metrics?.tokensOut) {
          outputTokens += message.metrics.tokensOut;
        } else {
          // Estimate tokens (4 chars per token)
          outputTokens += Math.max(1, Math.ceil(message.content.length / 4));
        }
      }
    });
    
    return { inputTokens, outputTokens };
  };
  
  const { inputTokens, outputTokens } = calculateTokens();

  useEffect(() => {
    // Skip fetching if the metrics panel is not visible
    if (!isVisible) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('http://localhost:8080/metrics/summary');
        if (response.ok) {
          const data = await response.json();
          setServerMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Fetch metrics immediately and then every 10 seconds
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 dark:bg-gray-800 p-4 rounded-lg shadow mb-4 border border-yellow-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-center">Metrics</h3>
      
      {/* Main metrics grid with the most important metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
        {/* Input Tokens */}
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded text-center">
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">Input Tokens</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{inputTokens}</div>
        </div>
        
        {/* Output Tokens */}
        <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded text-center">
          <div className="text-sm font-semibold text-green-800 dark:text-green-200">Output Tokens</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">{outputTokens}</div>
        </div>
        
        {/* Response Time */}
        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded text-center md:col-span-1">
          <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">Avg Response Time</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">{serverMetrics.averageResponseTime.toFixed(2)}s</div>
        </div>
      </div>
      
      {/* Additional system metrics in a more compact format */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-600 dark:text-gray-300 text-xs">Total Requests</div>
          <div className="font-medium">{serverMetrics.totalRequests}</div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-600 dark:text-gray-300 text-xs">Active Users</div>
          <div className="font-medium">{serverMetrics.activeUsers}</div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-600 dark:text-gray-300 text-xs">Error Rate</div>
          <div className={`font-medium ${serverMetrics.errorRate > 0.05 ? 'text-red-500' : ''}`}>
            {(serverMetrics.errorRate * 100).toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Direct token calculation (4 chars = 1 token)
      </div>
    </div>
  );
}
