import React, { useState, useEffect } from 'react';
import { Message, MetricsData, LlamaCppMetrics } from '../types';
import { LlamaCppMetricsPanel } from './LlamaCppMetricsPanel';

interface SimplifiedMetricsProps {
  isVisible: boolean;
  messages: Message[];
}

export function SimplifiedMetrics({ isVisible, messages }: SimplifiedMetricsProps) {
  const [serverMetrics, setServerMetrics] = useState<MetricsData>({
    totalRequests: 0,
    averageResponseTime: 0,
    tokensGenerated: 0,
    tokensProcessed: 0,
    activeUsers: 0,
    errorRate: 0,
  });
  
  // State to track if metrics are expanded or collapsed
  const [expanded, setExpanded] = useState(false);
  // State to track if llama.cpp metrics are expanded
  const [llamaExpanded, setLlamaExpanded] = useState(false);

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

  // Check if llama.cpp metrics are available
  const hasLlamaCppMetrics = serverMetrics.llamaCppMetrics !== undefined;

  // Compact view (collapsed state)
  if (!expanded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg shadow mb-2 transition-all duration-200">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Metrics {hasLlamaCppMetrics && <span className="ml-1 text-xs font-normal text-blue-500">(llama.cpp)</span>}
          </h3>
          <button 
            onClick={() => setExpanded(true)} 
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs px-2"
          >
            Expand
          </button>
        </div>
        
        {/* Simplified metrics row */}
        <div className="flex justify-between items-center text-xs my-1">
          <div className="flex items-center space-x-3">
            <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded text-blue-800 dark:text-blue-300">
              In: {inputTokens}
            </span>
            <span className="bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded text-green-800 dark:text-green-300">
              Out: {outputTokens}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-gray-600 dark:text-gray-400">
              Reqs: {serverMetrics.totalRequests}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Avg: {serverMetrics.averageResponseTime.toFixed(2)}s
            </span>
          </div>
        </div>
        
        {/* Show compact llama.cpp metrics if available */}
        {hasLlamaCppMetrics && (
          <div className="text-xs my-1 bg-blue-50 dark:bg-blue-950/30 rounded px-2 py-1 text-blue-800 dark:text-blue-300">
            <div className="flex justify-between">
              <span>
                Tokens/sec: {serverMetrics.llamaCppMetrics?.tokensPerSecond.toFixed(2)}
              </span>
              <span>
                Context: {serverMetrics.llamaCppMetrics?.contextSize.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        {/* Link to detailed dashboard */}
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <a 
            href="http://localhost:3001" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline hover:text-blue-500"
          >
            Detailed Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow mb-3 transition-all duration-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Metrics {hasLlamaCppMetrics && <span className="ml-1 text-xs font-normal text-blue-500">(llama.cpp enabled)</span>}
        </h3>
        <button 
          onClick={() => setExpanded(false)} 
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs px-2"
        >
          Collapse
        </button>
      </div>
      
      {/* Main metrics in a more compact horizontal layout */}
      <div className="flex justify-between mb-2">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded text-center flex-1 mr-2">
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-200">Input Tokens</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-300">{inputTokens}</div>
        </div>
        
        <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded text-center flex-1">
          <div className="text-xs font-semibold text-green-800 dark:text-green-200">Output Tokens</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-300">{outputTokens}</div>
        </div>
      </div>
      
      {/* Secondary metrics in a compact row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded">
          <div className="text-gray-600 dark:text-gray-300 text-xs">Total Requests</div>
          <div className="font-medium">{serverMetrics.totalRequests}</div>
        </div>
        
        <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded">
          <div className="text-gray-600 dark:text-gray-300 text-xs">Avg Response</div>
          <div className="font-medium">{serverMetrics.averageResponseTime.toFixed(2)}s</div>
        </div>
        
        <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded">
          <div className="text-gray-600 dark:text-gray-300 text-xs">Error Rate</div>
          <div className={`font-medium ${serverMetrics.errorRate > 0.05 ? 'text-red-500' : ''}`}>
            {(serverMetrics.errorRate * 100).toFixed(2)}%
          </div>
        </div>
      </div>
      
      {/* Display llama.cpp metrics using the dedicated component */}
      {hasLlamaCppMetrics && (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-300">llama.cpp Metrics</div>
            <button
              onClick={() => setLlamaExpanded(!llamaExpanded)}
              className="text-xs text-blue-600 dark:text-blue-400"
            >
              {llamaExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          {!llamaExpanded ? (
            // Simple view
            <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded">
                <div className="text-blue-700 dark:text-blue-300">Tokens/sec</div>
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {serverMetrics.llamaCppMetrics?.tokensPerSecond.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded">
                <div className="text-blue-700 dark:text-blue-300">Context Size</div>
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {serverMetrics.llamaCppMetrics?.contextSize.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            // Detailed panel view
            <LlamaCppMetricsPanel 
              metrics={serverMetrics.llamaCppMetrics as LlamaCppMetrics} 
              showTitle={false} 
            />
          )}
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>Token calc: 4 chars = 1 token</span>
        <a 
          href="http://localhost:3001" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline hover:text-blue-500"
        >
          View detailed dashboard
        </a>
      </div>
    </div>
  );
}