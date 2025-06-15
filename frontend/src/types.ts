export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metrics?: {
    tokensIn?: number;
    tokensOut?: number;
  };
}

// LlamaCpp metrics interface
export interface LlamaCppMetrics {
  contextSize: number;
  promptEvalTime: number;
  tokensPerSecond: number;
  memoryPerToken: number;
  threadsUsed: number;
  batchSize: number;
  modelType: string;
}

// Metrics-related types
export interface MetricsData {
  totalRequests: number;
  averageResponseTime: number;
  tokensGenerated: number;
  tokensProcessed?: number; // New field for input tokens
  activeUsers: number;
  errorRate: number;
  llamaCppMetrics?: LlamaCppMetrics; // Added llama.cpp metrics
}

export interface MessageMetrics {
  requestTime: number;
  responseTime: number;
  tokensIn: number;
  tokensOut: number;
  firstTokenTime: number;
}

export interface ModelMetadata {
  model: string;
  contextWindow?: number;
  modelType?: string;
  parameters?: string;
}
