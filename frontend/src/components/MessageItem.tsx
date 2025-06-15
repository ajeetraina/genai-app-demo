import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

interface MessageItemProps {
  message: Message;
  showTokenCount?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, showTokenCount = false }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Extract token counts for display
  const userTokens = message.metrics?.tokensIn;
  const assistantTokens = message.metrics?.tokensOut;
  
  return (
    <div className={`flex message-item ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 9h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H9c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1z"/>
            </svg>
          </div>
        </div>
      )}
      <div className="flex flex-col max-w-[75%]">
        <div
          className={`p-3 rounded-lg ${isUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-100 dark:bg-gray-800 dark:text-white rounded-tl-none'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                components={{
                  // Customize code blocks
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <pre className={`bg-gray-900 dark:bg-gray-950 rounded p-2 my-2 overflow-x-auto`}>
                        <code className={`language-${match[1]}`} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Customize links
                  a({ node, children, href, ...props }) {
                    return (
                      <a
                        href={href}
                        className="text-blue-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  // Customize tables
                  table({ node, children, ...props }) {
                    return (
                      <div className="overflow-x-auto my-2">
                        <table className="border-collapse w-full" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ node, children, ...props }) {
                    return (
                      <thead className="bg-gray-200 dark:bg-gray-700" {...props}>
                        {children}
                      </thead>
                    );
                  },
                  th({ node, children, ...props }) {
                    return (
                      <th className="border border-gray-300 dark:border-gray-600 p-2 text-left" {...props}>
                        {children}
                      </th>
                    );
                  },
                  td({ node, children, ...props }) {
                    return (
                      <td className="border border-gray-300 dark:border-gray-600 p-2" {...props}>
                        {children}
                      </td>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={`text-xs mt-1 ${isUser ? 'text-right' : 'text-left'} flex items-center ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-gray-500">{timestamp}</span>
          
          {showTokenCount && (
            <div className="flex items-center ml-2">
              {isUser && userTokens !== undefined && (
                <span className="text-white bg-blue-500 px-2 py-0.5 rounded-full font-medium">
                  {userTokens} tokens
                </span>
              )}
              {!isUser && assistantTokens !== undefined && (
                <span className="text-white bg-green-500 px-2 py-0.5 rounded-full font-medium">
                  {assistantTokens} tokens
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 ml-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
