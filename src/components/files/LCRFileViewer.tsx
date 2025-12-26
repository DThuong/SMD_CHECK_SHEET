import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector, useNotification } from '../../redux/hooks';
import { downloadLCRExcelFile } from '../../redux/slices/FileSlice';

interface LCRFileViewerProps {
  fileUrl?: string;
  fileData?: File | null;
}

const LCRFileViewer = ({ fileUrl, fileData }: LCRFileViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {currentSheet} = useAppSelector((state) => state.changeModel);
  const dispatch = useAppDispatch();
  const { showNotification } = useNotification();

   const handleDownloadfile = async () => {
    if (!currentSheet?.id) {
      showNotification('error', 'Lỗi', 'Không tìm thấy Sheet ID');
      return;
    }

    try {
      await dispatch(downloadLCRExcelFile(currentSheet.id)).unwrap();
      showNotification('success', 'Thành công', 'Đã tải xuống file LCR Excel');
    } catch (error: any) {
      showNotification('error', 'Lỗi', error || 'Không thể tải xuống file');
    }
  };

  useEffect(() => {
    const loadPDF = async () => {
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
        console.error('Error loading LCR PDF:', err);
        setError(err.message || 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPDF();
  }, [fileUrl, fileData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading LCR PDF...</span>
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
            <p className="text-red-600 font-semibold">Error loading LCR PDF</p>
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
          <p className="text-yellow-700">⚠️ No LCR PDF file available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="my-4 border-none">
        {/* PDF Viewer */}
        <div className="border-2 border-green-400 rounded-lg overflow-hidden bg-gray-100 shadow-lg">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-[600px] md:h-[800px] border-none"
            title="LCR PDF Viewer"
            onError={(e) => {
              console.error('LCR iframe error:', e);
              setError('Failed to load PDF in iframe. Try opening in new tab.');
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-3">
          {/* Download */}
          <button
            onClick={handleDownloadfile}
            className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-decoration-none inline-flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download LCR Excel
          </button>

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

export default LCRFileViewer;