import React from 'react';
import { FiFileText, FiExternalLink } from 'react-icons/fi';

const SourceCitations = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center mb-1">
        <FiFileText className="mr-1 h-3 w-3" />
        <span className="font-medium">Sources:</span>
      </div>
      <ul className="pl-4 space-y-1">
        {sources.map((source, index) => (
          <li key={index} className="flex items-center">
            <span className="truncate">{source}</span>
            {source.startsWith('http') && (
              <a 
                href={source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-500 hover:text-blue-600 inline-flex items-center"
              >
                <FiExternalLink className="h-3 w-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceCitations;
