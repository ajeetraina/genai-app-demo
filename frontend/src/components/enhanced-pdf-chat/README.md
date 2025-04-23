# Enhanced PDF Chat UI

This directory contains an enhanced version of the PDF chat UI with additional features:

## 1. Annotation and Highlighting

The PDF Chat now supports interactive annotation and highlighting of PDF content, allowing users to mark important information and add context.

### Highlighting Features
- Highlight important text within documents with color options
- Select from multiple highlight colors (yellow, green, and pink)
- Click on highlights to remove them
- Highlights persist across page navigation

### Annotation Features
- Add detailed notes to specific text selections
- Annotations are visually represented by markers in the document
- Hover over annotation markers to view the full note
- Edit and delete annotations as needed
- Organization by page number

## 2. Search Functionality

The application now includes powerful search capabilities for finding specific content within PDF documents.

### Search Features
- Full-text search within PDF documents
- Highlight of all search results within a page
- Navigation between search results with previous/next buttons
- Visual indication of the current search result
- Search result count display

## 3. Document Comparison

Compare two PDF documents side by side to identify differences and similarities.

### Comparison Features
- Select two documents for side-by-side comparison
- Synchronized page navigation between documents
- Visual indicators for differences between documents
- Maintain individual document context
- Easy toggling between comparison and single document view

## Files in this Directory

- `PDFChat.tsx`: Main component with enhanced functionality
- `PDFUpload.tsx`: Updated upload component with drag-and-drop support
- `PDFChat.css`: Styling for the enhanced interface

## Dependencies

This enhanced UI requires these additional dependencies:
- `react-pdf`: For rendering PDF documents
- `react-icons`: For UI icons

## Integration

To integrate this enhanced PDF chat UI:

1. Update package.json with the new dependencies
2. Replace the existing PDFChat implementation with these files
3. Configure the API endpoints in vite.config.ts
