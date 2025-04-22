import { useState, useEffect, useRef } from "react";
import PDFUpload from "./PDFUpload";
import {
  FiSend,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiHighlight,
  FiCompare,
  FiTrash2,
  FiEdit3
} from "react-icons/fi";
import "./PDFChat.css";

interface PDFDocument {
  id: string;
  filename: string;
  pageCount: number;
  timestamp: number;
  annotations?: any[];
  highlights?: any[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PDFChat = () => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PDFDocument | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<PDFDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [isCompareMode, setIsCompareMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowPdfViewer(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load existing documents
  useEffect(() => {
    fetch('/list-pdfs')
      .then(res => res.json())
      .then(docs => {
        setDocuments(docs);
        if (docs.length > 0 && !selectedDoc) {
          setSelectedDoc(docs[0]);
        }
      })
      .catch(err => console.error('Failed to load documents:', err));
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDocumentUploaded = (doc: PDFDocument) => {
    setDocuments(prev => [...prev, doc]);
    setSelectedDoc(doc);
    setShowPdfViewer(true);
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
      inputRef.current?.focus();
    }
  };

  const changePage = (offset: number) => {
    setCurrentPage(prevPageNumber => {
      const maxPages = selectedDoc?.pageCount || 1;
      return Math.min(Math.max(prevPageNumber + offset, 1), maxPages);
    });
  };

  const togglePdfViewer = () => {
    if (isSmallScreen) {
      setShowPdfViewer(!showPdfViewer);
    }
  };
  
  // Toggle comparison mode
  const toggleCompareMode = () => {
    setIsCompareMode(!isCompareMode);
    if (isCompareMode) {
      setSelectedDocs([]);
      if (selectedDoc) {
        setSelectedDocs([selectedDoc]);
      }
    } else {
      if (selectedDoc) {
        setSelectedDocs([selectedDoc]);
      }
    }
  };
  
  // Add or remove a document from comparison
  const toggleDocumentForComparison = (doc: PDFDocument) => {
    if (!isCompareMode) return;
    
    const isSelected = selectedDocs.some(d => d.id === doc.id);
    
    if (isSelected) {
      if (selectedDocs.length > 1) {
        setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
      }
    } else {
      if (selectedDocs.length < 2) {
        setSelectedDocs([...selectedDocs, doc]);
      }
    }
  };

  const getPdfUrl = (docId: string) => {
    return `/pdf/${docId}`;
  };

  return (
    <div className="pdf-chat-container">
      <div className={`sidebar ${isSmallScreen && showPdfViewer ? 'hidden' : ''}`}>
        <div className="document-selector-header">
          <h2>Documents</h2>
          <div className="document-tools">
            <PDFUpload onDocumentUploaded={handleDocumentUploaded} />
            <button 
              className={`tool-button ${isCompareMode ? 'active' : ''}`} 
              onClick={toggleCompareMode}
              title="Compare Documents"
            >
              <FiCompare />
            </button>
          </div>
        </div>
        
        <div className="document-list">
          {documents.length === 0 ? (
            <div className="no-documents">
              <FiFileText size={32} />
              <p>No documents yet. Upload a PDF to get started.</p>
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc.id}
                className={`document-item ${selectedDoc?.id === doc.id ? 'selected' : ''} ${
                  isCompareMode && selectedDocs.some(d => d.id === doc.id) ? 'compare-selected' : ''
                }`}
                onClick={() => {
                  if (isCompareMode) {
                    toggleDocumentForComparison(doc);
                  } else {
                    setSelectedDoc(doc);
                    setCurrentPage(1);
                    if (isSmallScreen) {
                      setShowPdfViewer(false);
                    } else {
                      setShowPdfViewer(true);
                    }
                  }
                }}
              >
                <div className="document-icon">
                  <FiFileText />
                </div>
                <div className="document-details">
                  <div className="document-name">{doc.filename}</div>
                  <div className="document-info">
                    {doc.pageCount} pages • {new Date(doc.timestamp * 1000).toLocaleDateString()}
                  </div>
                </div>
                {isCompareMode && selectedDocs.some(d => d.id === doc.id) && (
                  <div className="compare-indicator">✓</div>
                )}
              </div>
            ))
          )}
        </div>
        
        {isCompareMode && selectedDocs.length === 2 && (
          <div className="comparison-info">
            <h3>Comparing Documents</h3>
            <p>Selected: {selectedDocs.map(d => d.filename).join(' & ')}</p>
            <button className="action-button" onClick={() => setShowPdfViewer(true)}>
              View Side by Side
            </button>
          </div>
        )}
      </div>
      
      {isSmallScreen && selectedDoc && (
        <div className="view-toggle">
          <button 
            className={!showPdfViewer ? 'active' : ''} 
            onClick={() => setShowPdfViewer(false)}
          >
            Chat
          </button>
          <button 
            className={showPdfViewer ? 'active' : ''} 
            onClick={() => setShowPdfViewer(true)}
          >
            PDF
          </button>
        </div>
      )}

      {/* PDF Viewer using browser's native PDF rendering */}
      {(isCompareMode ? selectedDocs.length > 0 : selectedDoc) && (
        <div className={`pdf-viewer ${isSmallScreen && !showPdfViewer ? 'hidden' : ''}`}>
          <div className="pdf-controls">
            <div className="pdf-pagination">
              <button onClick={() => changePage(-1)} disabled={currentPage <= 1}>
                <FiChevronLeft />
              </button>
              <span>
                Page {currentPage} of {selectedDoc?.pageCount || '?'}
              </span>
              <button onClick={() => changePage(1)} disabled={currentPage >= (selectedDoc?.pageCount || 1)}>
                <FiChevronRight />
              </button>
            </div>
          </div>
          
          {isCompareMode && selectedDocs.length === 2 ? (
            <div className="pdf-comparison-container">
              <div className="pdf-document-container">
                <iframe 
                  src={`${getPdfUrl(selectedDocs[0].id)}#page=${currentPage}`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title={`PDF Viewer for ${selectedDocs[0].filename}`}
                />
              </div>
              
              <div className="comparison-separator">
                <div className="comparison-label">VS</div>
              </div>
              
              <div className="pdf-document-container">
                <iframe 
                  src={`${getPdfUrl(selectedDocs[1].id)}#page=${currentPage}`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title={`PDF Viewer for ${selectedDocs[1].filename}`}
                />
              </div>
            </div>
          ) : (
            <div className="pdf-document-container">
              {selectedDoc && (
                <iframe 
                  src={`${getPdfUrl(selectedDoc.id)}#page=${currentPage}`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title={`PDF Viewer for ${selectedDoc.filename}`}
                />
              )}
            </div>
          )}
        </div>
      )}
      
      <div className={`chat-section ${isSmallScreen && showPdfViewer ? 'hidden' : ''}`}>
        <div className="chat-header">
          {selectedDoc && (
            <div className="selected-document">
              <span className="doc-title">{selectedDoc.filename}</span>
            </div>
          )}
        </div>
        
        {selectedDoc ? (
          <>
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-icon">💬</div>
                  <h3>Chat with your PDF</h3>
                  <p>Ask questions about "{selectedDoc.filename}"</p>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      <div className="message-content">
                        <div className="message-avatar">
                          {msg.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-bubble">
                          <div className="message-text">{msg.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="message assistant">
                      <div className="message-content">
                        <div className="message-avatar">🤖</div>
                        <div className="message-bubble loading-bubble">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question about the document..."
                disabled={loading}
              />
              <button 
                className={`send-button ${!input.trim() || loading ? 'disabled' : ''}`} 
                onClick={handleSendMessage} 
                disabled={!input.trim() || loading}
              >
                <FiSend />
              </button>
            </div>
          </>
        ) : (
          <div className="no-document-selected">
            <div className="empty-state">
              <FiFileText size={48} />
              <h3>No document selected</h3>
              <p>Please select or upload a PDF document to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFChat;