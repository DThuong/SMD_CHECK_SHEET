import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import LCRFileViewer from '../components/LCRFileViewer';
import ReflowPDFViewer from '../components/ReflowPDFViewer';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';

type FileType = 'lcr' | 'reflow';

const FileDetailViewer = () => {
  const { id, fileType } = useParams<{ id: string; fileType: FileType }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentSheet, loading } = useAppSelector((state) => state.changeModel);
  
  const [activeTab, setActiveTab] = useState<FileType>(fileType || 'lcr');

  useEffect(() => {
    if (fileType && (fileType === 'lcr' || fileType === 'reflow')) {
      setActiveTab(fileType);
    }
  }, [fileType]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentSheet) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Sheet not found</p>
        </div>
      </div>
    );
  }

  const hasLCR = currentSheet.excelFileUrl;
  const hasReflow = currentSheet.pdfFileUrl;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          ← {t('common:buttons.back')}
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800">
          {t('smdSheet:sheetHeader.title')} - File Viewer
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Change Model ID: {currentSheet.id}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-300">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('lcr')}
            disabled={!hasLCR}
            className={`px-6 py-3 font-semibold transition relative ${
              activeTab === 'lcr'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } ${!hasLCR ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📊 LCR File (Excel)
            {!hasLCR && <span className="ml-2 text-xs text-red-500">⚠️</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('reflow')}
            disabled={!hasReflow}
            className={`px-6 py-3 font-semibold transition relative ${
              activeTab === 'reflow'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } ${!hasReflow ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📄 Reflow File (PDF)
            {!hasReflow && <span className="ml-2 text-xs text-red-500">⚠️</span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'lcr' && (
          <>
            {hasLCR ? (
              <LCRFileViewer fileUrl={currentSheet.excelFileUrl} />
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-600">⚠️ LCR file has not been uploaded yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'reflow' && (
          <>
            {hasReflow ? (
              <ReflowPDFViewer fileUrl={currentSheet.pdfFileUrl} />
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-600">⚠️ Reflow file has not been uploaded yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileDetailViewer;