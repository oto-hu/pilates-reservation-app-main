'use client'

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// バージョン5.3.31のワーカーを使用
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

interface PDFViewerProps {
  numPages: number;
  setNumPages: (n: number) => void;
  pdfBuffer: ArrayBuffer | null;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
}

const PDFViewer = ({ numPages, setNumPages, pdfBuffer, onDocumentLoadSuccess }: PDFViewerProps) => {
  console.log('PDFViewer rendering, pdfBuffer:', pdfBuffer ? `exists (${pdfBuffer.byteLength} bytes)` : 'null');
  
  if (!pdfBuffer) {
    return <div>PDFファイルが読み込まれていません</div>;
  }

  return (
    <Document
      file={pdfBuffer}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={(error) => {
        console.error('PDF読み込みエラー:', error);
      }}
      loading={<div>PDFを読み込み中...</div>}
      error={<div>PDFの読み込みに失敗しました</div>}
    >
      {Array.from(new Array(numPages), (el, idx) => (
        <Page 
          key={`page_${idx+1}`} 
          pageNumber={idx+1} 
          width={500}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onLoadError={(error) => {
            console.error(`ページ${idx+1}の読み込みエラー:`, error);
          }}
        />
      ))}
    </Document>
  );
};

export default PDFViewer;