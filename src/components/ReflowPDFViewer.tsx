import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ReflowPDFViewerProps {
  fileUrl?: string;
}

const ReflowPDFViewer = ({ fileUrl }: ReflowPDFViewerProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!fileUrl) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No PDF file available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading PDF...</p>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">❌ Failed to load PDF file</p>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Open PDF in new tab
          </a>
        </div>
      )}

      <iframe
        src={fileUrl}
        className="w-full h-screen border-0"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        title="PDF Viewer"
      />
    </div>
  );
};

export default ReflowPDFViewer;