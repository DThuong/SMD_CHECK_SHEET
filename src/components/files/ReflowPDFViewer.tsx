/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';

interface ReflowPDFViewerProps {
  fileUrl?: string;
  fileData?: File | null;
}

const ReflowPDFViewer = ({ fileUrl, fileData }: ReflowPDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);

      // Ưu tiên fileUrl từ server
      if (fileUrl) {
        setPdfUrl(fileUrl);
        setLoading(false);
      } 
      // Fallback: dùng fileData nếu có
      else if (fileData) {
        const url = URL.createObjectURL(fileData);
        setPdfUrl(url);
        setLoading(false);
        
        // Cleanup URL khi unmount
        return () => URL.revokeObjectURL(url);
      } 
      else {
        setError('No PDF file available');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Failed to load PDF');
      setLoading(false);
    }
  }, [fileUrl, fileData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-600 font-semibold">Error loading PDF</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-yellow-700">⚠️ No PDF file available</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="my-4 border-none">
      {/* PDF Viewer */}
      <div className="border-2 border-gray-400 rounded-lg overflow-hidden bg-gray-100 shadow-lg">
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-[800px] border-none"
          title="Reflow PDF Viewer"
        />
      </div>

      {/* Action buttons */}
 <div className="flex gap-3 mt-3">
  {/* Download */}
  <a
    href={pdfUrl}
    download="reflow-file.pdf"
    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-decoration-none inline-flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    Download PDF
  </a>

  {/* Open new tab */}
  <a
    href={pdfUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="px-5 py-3 bg-gray-600 text-white text-decoration-none rounded-lg hover:bg-gray-700 transition inline-flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
    Open in New Tab
  </a>

</div>
    </div>
    </>
  );
  
};

export default ReflowPDFViewer;