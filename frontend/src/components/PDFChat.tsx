import React, { useState, useRef, useEffect } from "react";
import "./PDFChat.css";

const PDFChat = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  
  useEffect(() => {
    // Add drag event listeners
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files[0]);
      }
    };
    
    const element = dropAreaRef.current;
    if (element) {
      element.addEventListener("dragenter", handleDrag);
      element.addEventListener("dragover", handleDrag);
      element.addEventListener("dragleave", handleDrag);
      element.addEventListener("drop", handleDrop);
      
      return () => {
        element.removeEventListener("dragenter", handleDrag);
        element.removeEventListener("dragover", handleDrag);
        element.removeEventListener("dragleave", handleDrag);
        element.removeEventListener("drop", handleDrop);
      };
    }
  }, []);
  
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };
  
  const handleFiles = (file) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    
    // Removed the 200MB limit check
    
    setError("");
    setFile(file);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    
    // Auto-upload the file
    uploadFile(file);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  const uploadFile = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    
    try {
      // Check if we should use the new endpoint or the old one
      const response = await fetch("/upload-pdf", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText || "Server error"}`);
      }
      
      const data = await response.json();
      console.log("Upload successful:", data);
      // Store the document ID or other information returned by the server
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file");
      setFile(null);
      setFileName("");
      setFileSize("");
    } finally {
      setLoading(false);
    }
  };
  
  const removeFile = () => {
    setFile(null);
    setFileName("");
    setFileSize("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleAskQuestion = async () => {
    if (!file || !question.trim()) return;
    
    setLoading(true);
    setAnswer("");
    
    try {
      const response = await fetch("/chat-with-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: file.name, // This should be the document ID from the server
          question: question.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get an answer");
      }
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (err) {
      console.error("Question error:", err);
      setAnswer("Sorry, I couldn't process your question. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="pdf-chat-container dark-theme">
      <h1>
        <span className="pdf-icon">📄</span>
        Chat with your pdf file
      </h1>
      
      <div className="upload-section">
        <p>Upload your PDF</p>
        
        <div 
          ref={dropAreaRef}
          className={`drop-area ${dragActive ? "active" : ""}`}
        >
          <div className="drop-icon">📁</div>
          <p>Drag and drop file here</p>
          <p className="file-limit">PDF files only</p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <button className="browse-button" onClick={handleBrowseClick}>
            Browse files
          </button>
        </div>
        
        {fileName && (
          <div className="file-item">
            <span className="file-icon">📄</span>
            <span className="file-name">{fileName}</span>
            <span className="file-size">{fileSize}</span>
            <button className="remove-file" onClick={removeFile}>×</button>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {file && (
        <div className="question-section">
          <p>Ask questions about your uploaded PDF file</p>
          <div className="question-input-container">
            <input 
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your PDF..."
              className="question-input"
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
            />
            <button 
              className="ask-button" 
              onClick={handleAskQuestion}
              disabled={!question.trim() || loading}
            >
              Ask
            </button>
          </div>
          
          {loading && <div className="loading">Processing...</div>}
          
          {answer && (
            <div className="answer-container">
              <p>{answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFChat;
