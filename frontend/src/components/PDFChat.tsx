import React, { useState, useEffect } from 'react';
import PDFUpload from './PDFUpload';

interface PDFDocument {
  id: string;
  filename: string;
  pageCount: number;
  timestamp: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PDFChat: React.FC = () => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PDFDocument | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing documents
    fetch('/list-pdfs')
      .then(res => res.json())
      .then(docs => setDocuments(docs))
      .catch(err => console.error('Failed to load documents:', err));
  }, []);

  const handleDocumentUploaded = (doc: PDFDocument) => {
    setDocuments(prev => [...prev, doc]);
    setSelectedDoc(doc);
  };

  const handleSendMessage = async () => {
    if (!selectedDoc || !input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/chat-with-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDoc.id,
          question: userMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your question.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-chat-container">
      <div className="document-selector">
        <h3>PDF Documents</h3>
        <PDFUpload onDocumentUploaded={handleDocumentUploaded} />
        
        <div className="document-list">
          {documents.map(doc => (
            <div
              key={doc.id}
              className={`document-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="document-name">{doc.filename}</div>
              <div className="document-info">
                {doc.pageCount} pages • {new Date(doc.timestamp * 1000).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-section">
        <h3>Chat with PDF</h3>
        {selectedDoc ? (
          <>
            <div className="selected-document">
              Chatting with: {selectedDoc.filename}
            </div>
            
            <div className="messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-role">{msg.role === 'user' ? 'You' : 'Assistant'}</div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              {loading && <div className="loading">Thinking...</div>}
            </div>
            
            <div className="input-area">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question about the PDF..."
                disabled={loading}
              />
              <button onClick={handleSendMessage} disabled={loading || !input.trim()}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-document-selected">
            Please select or upload a PDF document to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFChat;