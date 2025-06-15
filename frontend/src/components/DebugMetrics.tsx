import React from 'react';

interface DebugMetricsProps {
  messages: any[];
}

export const DebugMetrics: React.FC<DebugMetricsProps> = ({ messages }) => {
  // Simple calculation of tokens
  const calculateTokens = () => {
    let userTokens = 0;
    let assistantTokens = 0;
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        // Estimate based on message length
        userTokens += Math.max(1, Math.ceil(msg.content.length / 4));
      } else if (msg.role === 'assistant') {
        // Estimate based on message length
        assistantTokens += Math.max(1, Math.ceil(msg.content.length / 4));
      }
    });
    
    return { userTokens, assistantTokens };
  };
  
  const { userTokens, assistantTokens } = calculateTokens();
  
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg mb-3 border border-yellow-300 dark:border-yellow-700">
      <h3 className="text-center font-bold mb-2 text-yellow-800 dark:text-yellow-200">Debug Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded text-center">
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">Input Tokens</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{userTokens}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded text-center">
          <div className="text-sm font-semibold text-green-800 dark:text-green-200">Output Tokens</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">{assistantTokens}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 text-center">
        Direct token calculation (4 chars = 1 token)
      </div>
    </div>
  );
};
