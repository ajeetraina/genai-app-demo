import React from 'react';
import { ModelMetadata } from '../types';

interface ModelInfoCardProps {
  modelInfo: ModelMetadata | null;
  isMinimized?: boolean;
}

export function ModelInfoCard({ modelInfo, isMinimized = false }: ModelInfoCardProps) {
  if (!modelInfo) return null;
  
  // Format the model name for display
  const getModelDisplayName = () => {
    if (!modelInfo.model) return "AI Model";
    
    // Extract base model name
    let displayName = modelInfo.model;
    
    if (displayName.includes('/')) {
      displayName = displayName.split('/').pop() || displayName;
    }
    
    if (displayName.includes(':')) {
      displayName = displayName.split(':')[0];
    }
    
    // Clean up common model name formats
    displayName = displayName
      .replace(/\.(\d)/g, ' $1')  // Add space before version numbers
      .replace(/([a-z])(\d)/gi, '$1 $2')  // Add space between letters and numbers
      .replace(/llama/i, 'Llama')  // Capitalize model names
      .replace(/smollm/i, 'SmolLM');
    
    return displayName;
  };
  
  // Extract size information from model name
  const getModelSize = () => {
    if (!modelInfo.model) return "";
    
    // Try to extract size information (like 1B, 7B, etc.)
    const sizeMatch = modelInfo.model.match(/[:\-_](\d+[bB])/);
    if (sizeMatch && sizeMatch[1]) {
      return sizeMatch[1].toUpperCase();
    }
    return "";
  };
  
  // Check if this is a llama.cpp model
  const isLlamaCppModel = 
    modelInfo.modelType === 'llama.cpp' || 
    modelInfo.model?.toLowerCase().includes('llama');
  
  // For minimized view (used in header or compact displays)
  if (isMinimized) {
    return (
      <div className="flex items-center">
        <span className="text-sm font-medium mr-1">{getModelDisplayName()}</span>
        {getModelSize() && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
            {getModelSize()}
          </span>
        )}
        {isLlamaCppModel && (
          <span className="ml-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">
            llama.cpp
          </span>
        )}
      </div>
    );
  }
  
  // Full expanded view
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h3 className="text-base font-semibold">{getModelDisplayName()}</h3>
          {getModelSize() && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
              {getModelSize()}
            </span>
          )}
        </div>
        {isLlamaCppModel && (
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
            llama.cpp
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Full Model Name</div>
          <div className="font-mono text-xs truncate" title={modelInfo.model}>
            {modelInfo.model}
          </div>
        </div>
        
        {modelInfo.contextWindow && (
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Context Window</div>
            <div className="font-medium">{modelInfo.contextWindow} tokens</div>
          </div>
        )}
      </div>
      
      {isLlamaCppModel && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Running with Docker Model Runner
          </span>
        </div>
      )}
    </div>
  );
}
