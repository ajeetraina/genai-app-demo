import React, { useState } from 'react';

interface PDFDocument {
  id: string;
  filename: string;
  pageCount: number;
  timestamp: number;
}

interface PDFUploadProps {
  onDocumentUploaded: (doc: PDFDocument) => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onDocumentUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch('/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload PDF');
      }

      const document = await response.json();
      onDocumentUploaded(document);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pdf-upload">
      <div className="upload-section">
        <input
          id="pdf-file-input"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {selectedFile && !uploading && (
        <div className="selected-file">
          Selected: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default PDFUpload;