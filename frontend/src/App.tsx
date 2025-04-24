import { useState, useEffect, createContext, useCallback } from 'react';
import './App.css';
import ChatBox from './components/ChatBox.tsx';
import { Header } from './components/Header.tsx';
import { ModelMetadata } from './types';

// Create context for theme that can be accessed by any component
export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {}
});

function App() {
  // Initialize darkMode from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    // This should match the logic in index.html
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [modelInfo, setModelInfo] = useState<ModelMetadata | null>(null);

  // Create a stable reference to the toggle function
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      // Update localStorage
      localStorage.setItem('darkMode', newMode ? 'true' : 'false');
      return newMode;
    });
  }, []);

  // Listen for changes to system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    };
    
    // Add the appropriate event listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // For older browsers
      // @ts-ignore - Some browsers use addListener
      mediaQuery.addListener(handleChange);
      return () => {
        // @ts-ignore - Some browsers use removeListener
        mediaQuery.removeListener(handleChange);
      };
    }
  }, []);

  // Apply dark mode class when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('darkMode', 'false');
    }
    
    // Debug output to help diagnose issues
    console.log('Theme mode updated:', darkMode ? 'dark' : 'light');
    console.log('HTML class list:', document.documentElement.classList.toString());
  }, [darkMode]);

  // Fetch model information on component mount
  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('http://localhost:8080/health');
      if (response.ok) {
        const data = await response.json();
        if (data.model_info) {
          setModelInfo(data.model_info);
        }
      }
    } catch (e) {
      console.error('Failed to fetch model info:', e);
    }
  };

  // Format the model name for display
  const getModelDisplayInfo = () => {
    if (!modelInfo || !modelInfo.model) {
      return "AI Model";  // Default fallback
    }
    
    let modelName = modelInfo.model;
    let modelSize = "";
    
    // Try to extract size information (like 1B, 7B, etc.)
    const sizeMatch = modelName.match(/[:\-](\d+[bB])/);
    if (sizeMatch && sizeMatch[1]) {
      modelSize = `(${sizeMatch[1].toUpperCase()})`;
    }
    
    // Extract base model name
    if (modelName.includes('/')) {
      modelName = modelName.split('/').pop() || modelName;
    }
    
    if (modelName.includes(':')) {
      modelName = modelName.split(':')[0];
    }
    
    // Clean up common model name formats
    modelName = modelName
      .replace(/\.(\d)/g, ' $1')  // Add space before version numbers
      .replace(/([a-z])(\d)/gi, '$1 $2')  // Add space between letters and numbers
      .replace(/llama/i, 'Llama')  // Capitalize model names
      .replace(/smollm/i, 'SmolLM');
    
    return `${modelName} ${modelSize}`;
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ease-in-out ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <Header toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
        <div className="flex-1 p-4">
          <ChatBox />
        </div>
        <footer className={`text-center p-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Powered by <span className="font-semibold">Docker Model Runner</span> running <span className="font-semibold">{getModelDisplayInfo()}</span> in a Docker container</p>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
