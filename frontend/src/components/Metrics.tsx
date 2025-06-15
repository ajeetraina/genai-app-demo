import { useState, useEffect } from 'react';
import { MetricsData } from '../types';

interface MetricsProps {
  isVisible: boolean;
  messages?: { id: string; role: string; content: string; metrics?: { tokensIn?: number; tokensOut?: number } }[];
}

export function Metrics({ isVisible, messages = [] }: MetricsProps) {
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
  
  // Debug logging
  console.log('Current message metrics:', { inputTokens, outputTokens });
  console.log('Messages with metrics:', messages.map(m => ({ 
    role: m.role, 
    tokensIn: m.metrics?.tokensIn,
    tokensOut: m.metrics?.tokensOut 
  })));

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">System Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <MetricCard title="Total Requests" value={serverMetrics.totalRequests} />
        <MetricCard 
          title="Avg Response Time" 
          value={`${serverMetrics.averageResponseTime.toFixed(2)}s`} 
        />
        <MetricCard 
          title="Input Tokens" 
          value={inputTokens} 
          highlight={true}
        />
        <MetricCard 
          title="Output Tokens" 
          value={outputTokens} 
          highlight={true}
        />
        <MetricCard title="Active Users" value={serverMetrics.activeUsers} />
        <MetricCard 
          title="Error Rate" 
          value={`${(serverMetrics.errorRate * 100).toFixed(2)}%`} 
          isError={serverMetrics.errorRate > 0.05}
        />
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

interface MetricCardProps {
  title: string;
  value: string | number;
  isError?: boolean;
  highlight?: boolean;
}

function MetricCard({ title, value, isError = false, highlight = false }: MetricCardProps) {
  return (
    <div className={`${highlight ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-700'} p-3 rounded shadow`}>
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className={`text-lg font-semibold ${isError ? 'text-red-500' : (highlight ? 'text-blue-600 dark:text-blue-400' : '')}`}>
        {value}
      </div>
    </div>
  );
}
