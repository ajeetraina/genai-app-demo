import React, { useState, useRef } from 'react';
import { FiUpload, FiFile, FiX, FiInfo } from 'react-icons/fi';

const DocumentUploader = ({ onDocumentUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    setError('');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type (only accept PDF and TXT for simplicity)
      const fileType = file.name.split('.').pop().toLowerCase();
      if (fileType !== 'pdf' && fileType !== 'txt') {
        setError(`Unsupported file type: ${fileType}. Only PDF and TXT files are supported.`);
        setIsUploading(false);
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Add to uploaded docs with the details from the server
        setUploadedDocs(prev => [...prev, {
          id: result.document.id,
          name: file.name,
          size: file.size,
          type: fileType,
        }]);
        
        // Notify parent component
        if (onDocumentUploaded) {
          onDocumentUploaded(result.document);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }
    
    setIsUploading(false);
  };

  const handleRemoveDoc = (docId) => {
    setUploadedDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Document Upload</h2>
      
      {/* Drag and drop area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <FiUpload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Supported formats: PDF, TXT
        </p>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.txt"
          multiple
          onChange={handleFileInputChange}
        />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-500">
          {error}
        </div>
      )}
      
      {/* Upload status */}
      {isUploading && (
        <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-t-blue-500 rounded-full animate-spin mr-2"></div>
          Uploading documents...
        </div>
      )}
      
      {/* Uploaded documents list */}
      {uploadedDocs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Uploaded Documents</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {uploadedDocs.map(doc => (
              <li key={doc.id} className="py-2 flex justify-between items-center">
                <div className="flex items-center">
                  <FiFile className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.size)} ? {doc.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveDoc(doc.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Info box */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded flex text-xs">
        <FiInfo className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5 mr-2" />
        <p className="text-blue-800 dark:text-blue-300">
          Uploaded documents will be processed and indexed for the chatbot to reference. 
          The more specific your questions are to the document content, the better the responses will be.
        </p>
      </div>
    </div>
  );
};

export default DocumentUploader;
