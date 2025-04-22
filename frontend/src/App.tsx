import React from 'react';
import PDFChat from './components/PDFChat';
import './App.css';
import './components/PDFChat.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GenAI App with PDF Chat</h1>
      </header>
      <main>
        <PDFChat />
      </main>
    </div>
  );
}

export default App;
