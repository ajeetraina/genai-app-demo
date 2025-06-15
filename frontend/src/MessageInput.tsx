import React, { useRef, useEffect } from 'react';
import { SendIcon } from './components/Icons';

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  error: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  input,
  setInput,
  sendMessage,
  isLoading,
  error,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resize the textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to fit all content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // When Shift+Enter is pressed, normal behavior (new line) will occur
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage();
      }}
      className="p-4 border-t dark:border-gray-800 transition-colors duration-200"
    >
      <div className="flex gap-2 items-start">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          className="flex-1 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
          disabled={isLoading}
          rows={1}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
};
