import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../App';

// This is a debugging component to help troubleshoot theme issues
// It can be removed in production
export const ThemeDebug: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [showDebug, setShowDebug] = useState(false);
  const [htmlClasses, setHtmlClasses] = useState('');
  const [bodyClasses, setBodyClasses] = useState('');
  const [localStorageValue, setLocalStorageValue] = useState('');
  
  useEffect(() => {
    // Update the debug info when dark mode changes
    setHtmlClasses(document.documentElement.classList.toString());
    setBodyClasses(document.body.classList.toString());
    setLocalStorageValue(localStorage.getItem('darkMode') || 'null');
    
    // Check if there's a URL parameter to show debug info
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'theme') {
      setShowDebug(true);
    }
  }, [darkMode]);
  
  if (!showDebug) return null;
  
  return (
    <div className="theme-debug">
      <h4>Theme Debug</h4>
      <ul className="text-xs">
        <li>Dark Mode: {darkMode ? 'true' : 'false'}</li>
        <li>localStorage: {localStorageValue}</li>
        <li>HTML classes: {htmlClasses}</li>
        <li>Body classes: {bodyClasses}</li>
        <li>System preference: {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}</li>
      </ul>
      <button 
        onClick={() => setShowDebug(false)}
        className="text-xs bg-red-500 text-white px-2 py-1 mt-2 rounded"
      >
        Close
      </button>
    </div>
  );
};
