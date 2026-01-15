/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import LCRDataTable from '../components/files/LCRDataTable';
import LCRFullTable from '../components/files/LCRFullTable';
import ReflowPDFViewer from '../components/files/ReflowPDFViewer';
import LoadingSpinner from '../components/general/LoadingSpinner';
import { getSheetWithFullObject } from '../redux/slices/changeModelSlice';
import { useTranslation } from 'react-i18next';
import { getLcrFileData, getReflowFile, clearLcrFile, clearReflowFile } from '../redux/slices/FileSlice';

type FileType = 'lcr' | 'reflow';
type LcrViewMode = 'expandable' | 'full';

const FileDetailViewer = () => {
  const { id, fileType } = useParams<{ id: string; fileType: FileType }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [lcrViewMode, setLcrViewMode] = useState<LcrViewMode>('full');

  const from = (location.state as any)?.from;
  const returnPath = (location.state as any)?.returnPath;
  const originalReturnPath = (location.state as any)?.originalReturnPath;
  const user = useAppSelector((state) => state.auth.user);
  
  const { currentSheet, loading: sheetLoading } = useAppSelector((state) => state.changeModel);
  const { lcrFileData, reflowFileUrl, loading: fileLoading, error: fileError } = useAppSelector(
    (state) => state.fileSlice
  );

  const { t } = useTranslation('fileDetail');

  // Load files
  useEffect(() => {
    if (id) {
      const sheetId = parseInt(id);
      // console.log(` FileDetailViewer: Loading files for sheet ${sheetId}`);
      dispatch(getSheetWithFullObject(sheetId));
      // Load LCR data (JSON)
      dispatch(getLcrFileData(sheetId));
      // Load Reflow file (PDF)
      dispatch(getReflowFile(sheetId));
    }

    return () => {
      dispatch(clearLcrFile());
      dispatch(clearReflowFile());
    };
  }, [id, dispatch]);
  
  const handleChangeTab = (tab: FileType) => {
    if (!id) return;
    const newPath = location.pathname.replace(/(lcr|reflow)$/, tab);  
    navigate(newPath, { 
      replace: true,
      state: { from, returnPath, originalReturnPath } // Giữ lại state khi đổi tab
    });
  };

    const handleGoBack = () => {
      // console.group('🔙 FileDetailViewer - handleGoBack');
      // console.log('returnPath:', returnPath);
      // console.log('originalReturnPath:', originalReturnPath);
      // console.log('from:', from);
    if (returnPath) {
    //   console.log('✅ Using returnPath:', returnPath);
    // console.log('📦 Passing state:', {
    //   from: 'logs',
    //   returnPath: originalReturnPath
    // });
      // Priority 1: Navigate về SheetDetailViewer VÀ truyền lại originalReturnPath
      navigate(returnPath, {
        state: { 
          from: 'logs',
          returnPath: originalReturnPath // Truyền lại path của Logs
        }
      });
    } else if (from === 'sheetDetail') {
      // Priority 2: Build path từ role và id
      const roleLower = user?.role?.toLowerCase();
      navigate(`/${roleLower}/sheet-detail/${id}`);
      const targetPath = `/${roleLower}/sheet-detail/${id}`;
    // console.log('✅ Using from === sheetDetail, navigating to:', targetPath);
    navigate(targetPath);
    } else {
      // Priority 3: Fallback về home
       const fallbackPath = `/?tab=create&sheetId=${id}`;
      // console.log('✅ Using fallback:', fallbackPath);
      navigate(fallbackPath, { replace: true });
    }
  };

  // Loading state - chờ load sheet hoặc files
  if (sheetLoading || fileLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (fileError) {
    return (
      <div className="container mx-auto p-4 my-4 max-w-8xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading files: {fileError}</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // Sheet not found (chỉ hiển thị sau khi đã load xong)
  if (!sheetLoading && !currentSheet && id) {
    console.warn(`⚠️ FileDetailViewer: Sheet ${id} not found after loading`);
    return (
      <div className="container mx-auto my-4 max-w-8xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Sheet not found</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // Chờ load sheet
  if (!currentSheet) {
    return <LoadingSpinner />;
  }

  // Check file availability
  const hasLcrData = !!lcrFileData;
  const hasReflowFile = !!reflowFileUrl || !!currentSheet.pdfFileUrl;
  const reflowUrl = reflowFileUrl || currentSheet.pdfFileUrl;

  return (
    <div className="container p-4 max-w-8xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backButton')}
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800">
          {t('title')}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('changeModelId')}: <span className="font-semibold">{currentSheet.id}</span>
        </p>
      </div>

      {/* Tabs */}
<div className="mb-4 relative">
  <div className="flex items-end justify-between gap-4">
    {/* Left side - Tabs */}
    <div className="flex gap-4">
      <button
        onClick={() => handleChangeTab('lcr')}
        disabled={!hasLcrData}
        className={`px-6 py-3 font-semibold transition inline-flex items-center gap-2 ${
          fileType === 'lcr'
            ? 'text-green-600 border-b-2 border-green-600'
            : 'text-gray-600 hover:text-green-600'
        } ${!hasLcrData ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        LCR Data
        {hasLcrData && lcrFileData && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
            {lcrFileData.count}
          </span>
        )}
      </button>
      
      <button
        onClick={() => handleChangeTab('reflow')}
        disabled={!hasReflowFile}
        className={`px-6 py-3 font-semibold transition inline-flex items-center gap-2 ${
          fileType === 'reflow'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-blue-600'
        } ${!hasReflowFile ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Reflow PDF
      </button>
    </div>

    {/* View Mode Toggle - chỉ hiện khi LCR tab */}
    {fileType === 'lcr' && hasLcrData && (
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-0.5">
        <button
          onClick={() => setLcrViewMode('full')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition inline-flex items-center gap-2 ${
            lcrViewMode === 'full'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Full Table (27 cols)
        </button>
      </div>
    )}
  </div>

  {/* Reference Table - Position absolute, chỉ hiện khi Reflow tab */}
  {fileType === 'reflow' && (
    <div className="absolute right-0 bottom-0 z-10">
      <div className="bg-white border border-b-0 border-gray-300 shadow-sm">
        <table className="text-xs">
          <tbody>
            <tr>
              <td className="border-r! text-center border-gray-300 px-3 py-1.5 font-semibold text-gray-700 bg-gray-50">
                Max'C
              </td>
              <td className="border-r! text-center border-gray-300 px-3 py-1.5 font-semibold text-gray-700 bg-gray-50">
                T4-s, Ov-220
              </td>
              <td className="text-center px-3 py-1.5 font-semibold text-gray-700 bg-gray-50">
                T2-s
              </td>
            </tr>
            <tr>
              <td className="border-r! border-t! border-gray-300 px-3 py-1.5 whitespace-nowrap">
                <span className="font-medium text-blue-600">PIP:</span> 240-250°C
              </td>
              <td className="border-r! border-t! border-gray-300 px-3 py-1.5 whitespace-nowrap">
                <span className="font-medium text-blue-600">PIP:</span> 50-70 sec
              </td>
              <td className="border-t! border-gray-300 px-3 py-1.5 whitespace-nowrap" rowSpan={2}>
                <div className="flex flex-col gap-2">
                  <div><span className="font-medium text-orange-600">Preheating:</span> 150-180°C</div>
                  <div><span className="font-medium text-orange-600">Time:</span> 70-110 sec</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border-r! border-t! border-gray-300 px-3 py-1.5 whitespace-nowrap">
                <span className="font-medium text-green-600">None PIP:</span> 235-245°C
              </td>
              <td className="border-t! border-r! border-gray-300 px-3 py-1.5 whitespace-nowrap">
                <span className="font-medium text-green-600">None PIP:</span> 40-60 sec
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>

      {/* Content */}
      <div className="bg-white rounded-lg">
        {fileType === 'lcr' && (
          <>
            {hasLcrData && lcrFileData ? (
              <>
                {lcrViewMode === 'expandable' ? (
                  <LCRDataTable lcrData={lcrFileData} />
                ) : (
                  <LCRFullTable lcrData={lcrFileData} />
                )}
              </>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 text-lg font-medium">⚠️ LCR data has not been uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload an Excel file to view LCR measurement data</p>
              </div>
            )}
          </>
        )}

        {fileType === 'reflow' && (
          <>
            {hasReflowFile && reflowUrl ? (
              <ReflowPDFViewer fileUrl={reflowUrl} />
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 text-lg font-medium">⚠️ Reflow file has not been uploaded yet</p>
                <p className="text-gray-500 text-sm mt-2">Upload a PDF file to view Reflow profile data</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default FileDetailViewer;