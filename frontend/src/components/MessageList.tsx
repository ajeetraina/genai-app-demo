import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
  showTokenCount?: boolean;
}

export function MessageList({ messages, showTokenCount = false }: MessageListProps) {
  return (
    <div className="flex flex-col space-y-4 p-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-center text-sm mb-1">No messages yet</p>
          <p className="text-xs text-center max-w-sm">Start a conversation by typing a message below. The model will respond in real-time.</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            showTokenCount={showTokenCount}
          />
        ))
      )}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  showTokenCount: boolean;
}

function MessageItem({ message, showTokenCount }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  // Format token counts for display
  const getTokenCount = () => {
    if (!showTokenCount) return null;
    
    const tokenCount = isUser 
      ? message.metrics?.tokensIn 
      : message.metrics?.tokensOut;
      
    if (tokenCount === undefined) return null;
    
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        isUser 
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      }`}>
        {tokenCount} tokens
      </span>
    );
  };
  
  return (
    <div className={`flex flex-col rounded-lg p-4 ${
      isUser
        ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <div className={`font-medium ${
          isUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
        }`}>
          {isUser ? 'You' : 'Assistant'}
        </div>
        {getTokenCount()}
      </div>
      
      <div className="message-content">
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none markdown-content"
            components={{
              pre: ({ node, ...props }) => (
                <div className="relative mt-2 mb-4">
                  <pre
                    className="bg-gray-100 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto text-sm"
                    {...props}
                  />
                </div>
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} />
                ) : (
                  <code {...props} />
                ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}