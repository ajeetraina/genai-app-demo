import React from 'react';
import { LlamaCppMetrics } from '../types';

interface LlamaCppMetricsPanelProps {
  metrics: LlamaCppMetrics;
  showTitle?: boolean;
}

export function LlamaCppMetricsPanel({ metrics, showTitle = true }: LlamaCppMetricsPanelProps) {
  // Format memory size to a human-readable format
  const formatMemorySize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Calculate color for tokens per second metric
  const getTokensPerSecondColor = (tps: number): string => {
    if (tps >= 30) return 'text-green-600 dark:text-green-400';
    if (tps >= 15) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Calculate memory efficiency
  const memoryEfficiency = (): string => {
    const memoryPerToken = metrics.memoryPerToken;
    if (memoryPerToken <= 1024 * 1024) return 'Excellent'; // Less than 1MB per token
    if (memoryPerToken <= 2 * 1024 * 1024) return 'Good'; // Less than 2MB per token
    if (memoryPerToken <= 4 * 1024 * 1024) return 'Fair'; // Less than 4MB per token
    return 'Poor'; // More than 4MB per token
  };

  // Calculate thread utilization
  const threadUtilization = (): { label: string; color: string } => {
    const threads = metrics.threadsUsed;
    
    if (threads <= 2) {
      return { label: 'Low', color: 'text-blue-600 dark:text-blue-400' };
    } else if (threads <= 8) {
      return { label: 'Moderate', color: 'text-green-600 dark:text-green-400' };
    } else if (threads <= 16) {
      return { label: 'High', color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { label: 'Very High', color: 'text-red-600 dark:text-red-400' };
    }
  };

  const threadUtil = threadUtilization();

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      {showTitle && (
        <div className="flex items-center mb-3">
          <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <h3 className="text-base font-semibold">llama.cpp Metrics</h3>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Performance</h4>
          
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tokens per Second</div>
              <div className={`text-lg font-bold ${getTokensPerSecondColor(metrics.tokensPerSecond)}`}>
                {metrics.tokensPerSecond.toFixed(2)}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Prompt Evaluation Time</div>
              <div className="text-md font-semibold">
                {metrics.promptEvalTime.toFixed(0)} ms
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Threads</div>
              <div className={`text-md font-semibold ${threadUtil.color}`}>
                {metrics.threadsUsed} <span className="text-xs font-normal">({threadUtil.label})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Metrics */}
        <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Memory</h4>
          
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Context Window</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {metrics.contextSize.toLocaleString()} tokens
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Memory per Token</div>
              <div className="text-md font-semibold">
                {formatMemorySize(metrics.memoryPerToken)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Batch Size</div>
              <div className="text-md font-semibold">
                {metrics.batchSize}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with efficiency rating */}
      <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          Memory Efficiency: <span className={
            memoryEfficiency() === 'Excellent' ? 'text-green-600 dark:text-green-400' :
            memoryEfficiency() === 'Good' ? 'text-blue-600 dark:text-blue-400' :
            memoryEfficiency() === 'Fair' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }>{memoryEfficiency()}</span>
        </div>
        <div>Powered by Docker Model Runner</div>
      </div>
    </div>
  );
}