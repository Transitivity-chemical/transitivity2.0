'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdfjs worker (uses unpkg CDN to match installed version)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface Props {
  fileUrl: string;
}

export function PdfDocument({ fileUrl }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [width, setWidth] = useState<number>(800);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => {
      const vw = window.innerWidth;
      // Sheet is 70vw on desktop; subtract padding
      setWidth(Math.min(vw * 0.66, 900));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-muted/30 p-4">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(err) => setError(err.message)}
        loading={<div className="text-center text-sm text-muted-foreground">Carregando PDF...</div>}
      >
        {error ? (
          <div className="text-center text-sm text-red-600">Falha ao renderizar PDF: {error}</div>
        ) : (
          Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="mb-4 mx-auto bg-white shadow-md" style={{ width }}>
              <Page
                pageNumber={i + 1}
                width={width}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))
        )}
      </Document>
    </div>
  );
}
