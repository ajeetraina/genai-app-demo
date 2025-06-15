import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  error: string | null;
}

export function MessageInput({ input, setInput, sendMessage, isLoading, error }: MessageInputProps) {
  const [height, setHeight] = useState(56); // Default height
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle textarea height adjustment
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate the new height (with a max height)
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200); // Max height of 200px
      
      // Only update if the height has changed
      if (newHeight !== height) {
        setHeight(newHeight);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [input, height]);
  
  // Handle key press events (e.g., Enter to send)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        sendMessage();
      }
    }
  };
  
  return (
    <div className="border-t dark:border-gray-800 p-3">
      {/* Error message display */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none transition-all"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ height: `${height}px` }}
          rows={1}
          disabled={isLoading}
        />
        
        <button
          className={`absolute right-3 bottom-3 rounded-full p-1.5 ${
            isLoading || !input.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          } transition-colors`}
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          {isLoading ? (
            // Loading spinner
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            // Send icon
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Optional hint for keyboard users */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
        Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to send, 
        <kbd className="ml-1 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift</kbd>+<kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> for new line
      </div>
    </div>
  );
}