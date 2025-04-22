import React, { useState, useEffect, useRef } from 'react';
import PDFUpload from './PDFUpload';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiSend, FiFileText, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, 
         FiSearch, FiHighlight, FiCompare, FiTrash2, FiEdit3, FiSave } from 'react-icons/fi';
import './PDFChat.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface Annotation {
  id: string;
  pageNumber: number;
  text: string;
  content: string;
  color: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

interface Highlight {
  id: string;
  pageNumber: number;
  text: string;
  color: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

interface PDFDocument {
  id: string;
  filename: string;
  pageCount: number;
  timestamp: number;
  annotations?: Annotation[];
  highlights?: Highlight[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PDFChat: React.FC = () => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PDFDocument | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<PDFDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [annotationColor, setAnnotationColor] = useState('#ADD8E6');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<{page: number, positions: {x: number, y: number, width: number, height: number}[]}[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [pageTextMap, setPageTextMap] = useState<{[page: number]: string}>({});
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        // Auto-select the first document if available
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

  // Focus input when selected document changes
  useEffect(() => {
    if (selectedDoc) {
      inputRef.current?.focus();
    }
  }, [selectedDoc]);

  const handleDocumentUploaded = (doc: PDFDocument) => {
    // Initialize with empty annotations and highlights
    const docWithAnnotations = {
      ...doc,
      annotations: [],
      highlights: []
    };
    setDocuments(prev => [...prev, docWithAnnotations]);
    setSelectedDoc(docWithAnnotations);
    setShowPdfViewer(true);
  };
  
  // Text selection handler
  const handleTextSelection = () => {
    if (!isAnnotationMode && !isHighlightMode) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const pdfWrapper = pdfWrapperRef.current;
    
    if (!pdfWrapper) return;
    
    const pdfRect = pdfWrapper.getBoundingClientRect();
    const position = {
      x: rect.left - pdfRect.left,
      y: rect.top - pdfRect.top,
      width: rect.width,
      height: rect.height
    };
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    setSelectedText(selectedText);
    setSelectionPosition(position);
    
    if (isHighlightMode) {
      addHighlight(selectedText, position);
    } else if (isAnnotationMode) {
      setCurrentAnnotation({
        id: `annotation-${Date.now()}`,
        pageNumber: currentPage,
        text: selectedText,
        content: '',
        color: annotationColor,
        position,
        timestamp: Date.now()
      });
      setAnnotationText('');
    }
  };
  
  // Add a highlight to the document
  const addHighlight = (text: string, position: {x: number, y: number, width: number, height: number}) => {
    if (!selectedDoc) return;
    
    const highlight: Highlight = {
      id: `highlight-${Date.now()}`,
      pageNumber: currentPage,
      text,
      color: highlightColor,
      position,
      timestamp: Date.now()
    };
    
    const updatedDoc = {
      ...selectedDoc,
      highlights: [...(selectedDoc.highlights || []), highlight]
    };
    
    setSelectedDoc(updatedDoc);
    
    // Update in documents array
    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDoc.id ? updatedDoc : doc
    ));
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionPosition(null);
  };
  
  // Save an annotation
  const saveAnnotation = () => {
    if (!selectedDoc || !currentAnnotation) return;
    
    const annotation: Annotation = {
      ...currentAnnotation,
      content: annotationText
    };
    
    const updatedDoc = {
      ...selectedDoc,
      annotations: [...(selectedDoc.annotations || []), annotation]
    };
    
    setSelectedDoc(updatedDoc);
    
    // Update in documents array
    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDoc.id ? updatedDoc : doc
    ));
    
    // Clear annotation state
    setCurrentAnnotation(null);
    setAnnotationText('');
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionPosition(null);
  };
  
  // Delete an annotation
  const deleteAnnotation = (annotationId: string) => {
    if (!selectedDoc) return;
    
    const updatedDoc = {
      ...selectedDoc,
      annotations: (selectedDoc.annotations || []).filter(ann => ann.id !== annotationId)
    };
    
    setSelectedDoc(updatedDoc);
    
    // Update in documents array
    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDoc.id ? updatedDoc : doc
    ));
  };
  
  // Delete a highlight
  const deleteHighlight = (highlightId: string) => {
    if (!selectedDoc) return;
    
    const updatedDoc = {
      ...selectedDoc,
      highlights: (selectedDoc.highlights || []).filter(h => h.id !== highlightId)
    };
    
    setSelectedDoc(updatedDoc);
    
    // Update in documents array
    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDoc.id ? updatedDoc : doc
    ));
  };

  // Toggle annotation mode
  const toggleAnnotationMode = () => {
    setIsAnnotationMode(!isAnnotationMode);
    if (isHighlightMode) setIsHighlightMode(false);
    if (!isAnnotationMode) {
      window.getSelection()?.removeAllRanges();
    }
  };
  
  // Toggle highlight mode
  const toggleHighlightMode = () => {
    setIsHighlightMode(!isHighlightMode);
    if (isAnnotationMode) setIsAnnotationMode(false);
    if (!isHighlightMode) {
      window.getSelection()?.removeAllRanges();
    }
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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Reset page text mapping when loading a new document
    setPageTextMap({});
  };
  
  // Extract text from rendered pages for search functionality
  const extractTextFromPage = async (pageNumber: number) => {
    if (!selectedDoc || pageTextMap[pageNumber]) return;
    
    try {
      // This is a placeholder - in a real application, you would need to:
      // 1. Either use a backend API to extract text per page
      // 2. Or use a PDF.js text layer extraction
      const response = await fetch(`/pdf-text/${selectedDoc.id}/${pageNumber}`);
      if (!response.ok) {
        // Fallback to simulating text extraction for demo purposes
        // In a real implementation, this would come from the PDF's text layer
        const simulatedText = `This is simulated text content for page ${pageNumber} of document ${selectedDoc.filename}. 
        This is searchable content that would normally be extracted from the PDF.
        You can search for terms like "searchable" or "content" or "page ${pageNumber}" to test the functionality.`;
        
        setPageTextMap(prev => ({
          ...prev,
          [pageNumber]: simulatedText
        }));
        return;
      }
      
      const text = await response.text();
      setPageTextMap(prev => ({
        ...prev,
        [pageNumber]: text
      }));
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
    }
  };
  
  // Function to search for text in the document
  const searchInDocument = () => {
    if (!searchText.trim() || !selectedDoc) return;
    
    const results: {page: number, positions: {x: number, y: number, width: number, height: number}[]}[] = [];
    
    // Search in each page's extracted text
    Object.entries(pageTextMap).forEach(([pageStr, text]) => {
      const page = parseInt(pageStr);
      if (text.toLowerCase().includes(searchText.toLowerCase())) {
        // This is simplified; in a real implementation, 
        // you would get actual text positions from the PDF
        const positions: {x: number, y: number, width: number, height: number}[] = [];
        
        // Generate simulated positions for search matches
        // In a real app, these would be actual coordinates from the PDF text layer
        const startIndex = text.toLowerCase().indexOf(searchText.toLowerCase());
        if (startIndex !== -1) {
          positions.push({
            x: 100, // Simulated values
            y: 100 + (startIndex % 5) * 20,
            width: 100,
            height: 20
          });
        }
        
        if (positions.length > 0) {
          results.push({ page, positions });
        }
      }
    });
    
    setSearchResults(results);
    
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      setCurrentPage(results[0].page);
    }
  };
  
  // Navigate to next search result
  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    setCurrentPage(searchResults[nextIndex].page);
  };
  
  // Navigate to previous search result
  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    setCurrentPage(searchResults[prevIndex].page);
  };

  const changePage = (offset: number) => {
    setCurrentPage(prevPageNumber => 
      Math.min(Math.max(prevPageNumber + offset, 1), numPages || 1)
    );
    
    // When changing pages, extract text for search functionality
    const newPage = Math.min(Math.max(currentPage + offset, 1), numPages || 1);
    if (selectedDoc) {
      extractTextFromPage(newPage);
    }
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
      // Exit compare mode
      setSelectedDocs([]);
      if (selectedDoc) {
        setSelectedDocs([selectedDoc]);
      }
    } else {
      // Enter compare mode
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
      // Remove from selection if not the last document
      if (selectedDocs.length > 1) {
        setSelectedDocs(selectedDocs.filter(d => d.id !== doc.id));
      }
    } else {
      // Add to selection (limit to 2 documents for side-by-side comparison)
      if (selectedDocs.length < 2) {
        setSelectedDocs([...selectedDocs, doc]);
      }
    }
  };
  
  // Get differences between two documents (simplified implementation)
  const getDocumentDifferences = () => {
    if (selectedDocs.length !== 2) return null;
    
    // This is a placeholder - in a real application, you would implement 
    // more sophisticated document comparison logic
    return {
      common: 'Common content would be displayed here',
      differences: [
        {
          doc1: { content: 'Content unique to first document', page: 1 },
          doc2: { content: 'Content unique to second document', page: 1 }
        }
      ]
    };
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

      {!isSmallScreen && (isCompareMode ? selectedDocs.length > 0 : selectedDoc) && (
        <div className="pdf-viewer">
          <div className="pdf-controls">
            <div className="pdf-pagination">
              <button onClick={() => changePage(-1)} disabled={currentPage <= 1}>
                <FiChevronLeft />
              </button>
              <span>
                Page {currentPage} of {numPages || '?'}
              </span>
              <button onClick={() => changePage(1)} disabled={currentPage >= (numPages || 1)}>
                <FiChevronRight />
              </button>
            </div>
            
            <div className="pdf-tools">
              <div className="search-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search in document..."
                  onKeyPress={(e) => e.key === 'Enter' && searchInDocument()}
                />
                <button onClick={searchInDocument} title="Search">
                  <FiSearch />
                </button>
                {searchResults.length > 0 && (
                  <div className="search-navigation">
                    <button onClick={goToPrevSearchResult} title="Previous result">
                      <FiChevronLeft />
                    </button>
                    <span>{currentSearchIndex + 1} of {searchResults.length}</span>
                    <button onClick={goToNextSearchResult} title="Next result">
                      <FiChevronRight />
                    </button>
                  </div>
                )}
              </div>
              
              {!isCompareMode && (
                <div className="annotation-tools">
                  <button 
                    className={`tool-button ${isHighlightMode ? 'active' : ''}`} 
                    onClick={toggleHighlightMode}
                    title="Highlight Text"
                  >
                    <FiHighlight />
                  </button>
                  <button 
                    className={`tool-button ${isAnnotationMode ? 'active' : ''}`} 
                    onClick={toggleAnnotationMode}
                    title="Add Annotation"
                  >
                    <FiEdit3 />
                  </button>
                  {isHighlightMode && (
                    <div className="color-picker">
                      <div 
                        className="color-swatch" 
                        style={{backgroundColor: '#FFFF00'}}
                        onClick={() => setHighlightColor('#FFFF00')}
                      />
                      <div 
                        className="color-swatch" 
                        style={{backgroundColor: '#90EE90'}}
                        onClick={() => setHighlightColor('#90EE90')}
                      />
                      <div 
                        className="color-swatch" 
                        style={{backgroundColor: '#FFB6C1'}}
                        onClick={() => setHighlightColor('#FFB6C1')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="pdf-zoom-controls">
              <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.6))} title="Zoom out">
                <FiZoomOut />
              </button>
              <span>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(prev => Math.min(prev + 0.2, 2.0))} title="Zoom in">
                <FiZoomIn />
              </button>
            </div>
          </div>
          
          {isCompareMode && selectedDocs.length === 2 ? (
            <div className="pdf-comparison-container">
              <div className="pdf-document-container">
                <Document
                  file={getPdfUrl(selectedDocs[0].id)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="pdf-loading">Loading PDF...</div>}
                  error={<div className="pdf-error">Failed to load PDF.</div>}
                >
                  <Page 
                    pageNumber={currentPage} 
                    scale={scale * 0.8} // Smaller scale to fit side-by-side
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>
                
                {/* Comparison indicators would appear here in a real implementation */}
              </div>
              
              <div className="comparison-separator">
                <div className="comparison-label">VS</div>
              </div>
              
              <div className="pdf-document-container">
                <Document
                  file={getPdfUrl(selectedDocs[1].id)}
                  loading={<div className="pdf-loading">Loading PDF...</div>}
                  error={<div className="pdf-error">Failed to load PDF.</div>}
                >
                  <Page 
                    pageNumber={currentPage}
                    scale={scale * 0.8} // Smaller scale to fit side-by-side
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            </div>
          ) : (
            <div className="pdf-document-container" ref={pdfWrapperRef} onClick={handleTextSelection}>
              {selectedDoc && (
                <>
                  <Document
                    file={getPdfUrl(selectedDoc.id)}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="pdf-loading">Loading PDF...</div>}
                    error={<div className="pdf-error">Failed to load PDF. Please try again.</div>}
                  >
                    <Page 
                      pageNumber={currentPage} 
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      onRenderSuccess={() => extractTextFromPage(currentPage)}
                    />
                  </Document>
                  
                  {/* Render highlights */}
                  {selectedDoc.highlights?.filter(h => h.pageNumber === currentPage).map(highlight => (
                    <div 
                      key={highlight.id}
                      className="highlight-overlay"
                      style={{
                        position: 'absolute',
                        left: `${highlight.position.x}px`,
                        top: `${highlight.position.y}px`,
                        width: `${highlight.position.width}px`,
                        height: `${highlight.position.height}px`,
                        backgroundColor: highlight.color,
                        opacity: 0.4,
                        zIndex: 10,
                        cursor: 'pointer'
                      }}
                      onClick={() => deleteHighlight(highlight.id)}
                      title="Click to remove highlight"
                    />
                  ))}
                  
                  {/* Render annotations */}
                  {selectedDoc.annotations?.filter(a => a.pageNumber === currentPage).map(annotation => (
                    <div 
                      key={annotation.id}
                      className="annotation-marker"
                      style={{
                        position: 'absolute',
                        left: `${annotation.position.x + annotation.position.width}px`,
                        top: `${annotation.position.y}px`,
                        backgroundColor: annotation.color,
                        zIndex: 20
                      }}
                    >
                      <div className="annotation-icon">💬</div>
                      <div className="annotation-popup">
                        <div className="annotation-text">{annotation.text}</div>
                        <div className="annotation-content">{annotation.content}</div>
                        <button 
                          className="annotation-delete"
                          onClick={() => deleteAnnotation(annotation.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Search result highlights */}
                  {searchResults
                    .filter(result => result.page === currentPage)
                    .map((result, idx) => 
                      result.positions.map((pos, posIdx) => (
                        <div
                          key={`search-${idx}-${posIdx}`}
                          className="search-highlight"
                          style={{
                            position: 'absolute',
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                            width: `${pos.width}px`,
                            height: `${pos.height}px`,
                            backgroundColor: idx === currentSearchIndex ? '#FFA500' : '#FFFF00',
                            opacity: 0.4,
                            zIndex: 15,
                            border: idx === currentSearchIndex ? '2px solid #FF4500' : 'none'
                          }}
                        />
                      ))
                    )
                  }
                </>
              )}
              
              {/* Selection overlay for annotation creation */}
              {currentAnnotation && (
                <div className="annotation-editor">
                  <div className="annotation-editor-header">
                    <h3>Add Annotation</h3>
                    <button onClick={() => setCurrentAnnotation(null)}>
                      <FiX />
                    </button>
                  </div>
                  <div className="annotation-selected-text">
                    {currentAnnotation.text}
                  </div>
                  <textarea
                    value={annotationText}
                    onChange={(e) => setAnnotationText(e.target.value)}
                    placeholder="Add your annotation here..."
                  />
                  <div className="annotation-editor-actions">
                    <button onClick={() => setCurrentAnnotation(null)}>Cancel</button>
                    <button onClick={saveAnnotation} disabled={!annotationText.trim()}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {selectedDoc && isSmallScreen && showPdfViewer && (
        <div className="pdf-viewer-mobile">
          <div className="pdf-controls">
            <div className="pdf-pagination">
              <button onClick={() => changePage(-1)} disabled={currentPage <= 1}>
                <FiChevronLeft />
              </button>
              <span>
                Page {currentPage} of {numPages || '?'}
              </span>
              <button onClick={() => changePage(1)} disabled={currentPage >= (numPages || 1)}>
                <FiChevronRight />
              </button>
            </div>
            <div className="pdf-zoom-controls">
              <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.6))} title="Zoom out">
                <FiZoomOut />
              </button>
              <span>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(prev => Math.min(prev + 0.2, 2.0))} title="Zoom in">
                <FiZoomIn />
              </button>
            </div>
          </div>
          <div className="pdf-document-container">
            {selectedDoc && (
              <Document
                file={getPdfUrl(selectedDoc.id)}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="pdf-loading">Loading PDF...</div>}
                error={<div className="pdf-error">Failed to load PDF. Please try again.</div>}
              >
                <Page 
                  pageNumber={currentPage} 
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
          </div>
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