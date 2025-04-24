import React, { useContext } from 'react';
import { ThemeContext } from '../App';

interface HeaderProps {
  toggleDarkMode: () => void;
  darkMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleDarkMode, darkMode }) => {
  // Get theme from context to ensure it's in sync
  const themeContext = useContext(ThemeContext);
  
  // Use the most up-to-date darkMode value
  const isDarkMode = themeContext.darkMode !== undefined ? themeContext.darkMode : darkMode;
  
  // Use the toggle function from context or props
  const handleToggleDarkMode = () => {
    // Call both toggle functions to ensure sync
    if (themeContext.toggleDarkMode) {
      themeContext.toggleDarkMode();
    } else {
      toggleDarkMode();
    }
    
    // Log for debugging
    console.log('Toggle clicked, new state should be:', !isDarkMode);
  };

  return (
    <header 
      className={`p-4 border-b flex justify-between items-center sticky top-0 z-10 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-800 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      <div className="flex items-center space-x-2">
        <img 
          src="/docker-logo.svg" 
          alt="Docker Logo" 
          className="h-8 w-auto" 
        />
        <h1 className="text-xl font-bold">GenAI Chat</h1>
      </div>
      <button 
        onClick={handleToggleDarkMode}
        className={`p-2 rounded-full transition-colors ${
          isDarkMode 
            ? 'hover:bg-gray-700 text-yellow-400' 
            : 'hover:bg-gray-200 text-slate-700'
        }`}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        data-testid="theme-toggle"
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </header>
  );
};
