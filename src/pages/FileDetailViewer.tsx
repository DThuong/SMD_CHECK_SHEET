import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import LCRFileViewer from '../components/files/LCRFileViewer';
import ReflowPDFViewer from '../components/files/ReflowPDFViewer';
import LoadingSpinner from '../components/general/LoadingSpinner';
import { getLcrFile, getReflowFile, clearLcrFile, clearReflowFile } from '../redux/slices/FileSlice';
import { getSheetWithFullObject } from '../redux/slices/changeModelSlice';

type FileType = 'lcr' | 'reflow';

const FileDetailViewer = () => {
  const { id, fileType } = useParams<{ id: string; fileType: FileType }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  const { currentSheet, loading: sheetLoading } = useAppSelector((state) => state.changeModel);
  const { lcrFileUrl, reflowFileUrl, loading: fileLoading, error: fileError } = useAppSelector(
    (state) => state.fileSlice
  );

  // Load sheet nếu chưa có trong Redux (khi reload trang)
  useEffect(() => {
    if (id && !currentSheet) {
      console.log(`FileDetailViewer: Loading sheet ${id} because currentSheet is null`);
      dispatch(getSheetWithFullObject(Number(id)));
    }
  }, [id, currentSheet, dispatch]);

  // Load files
  useEffect(() => {
    if (id) {
      const sheetId = parseInt(id);
      console.log(`FileDetailViewer: Loading files for sheet ${sheetId}`);
      dispatch(getLcrFile(sheetId));
      dispatch(getReflowFile(sheetId));
    }

    return () => {
      console.log('FileDetailViewer: Cleaning up files');
      dispatch(clearLcrFile());
      dispatch(clearReflowFile());
    };
  }, [id, dispatch]);
  
  const handleChangeTab = (tab: FileType) => {
    if (!id) return;
    const newPath = location.pathname.replace(/(lcr|reflow)$/, tab);  
    navigate(newPath, { replace: true });
  };

  //  Loading state - chờ load sheet
  if (sheetLoading || fileLoading) {
    return <LoadingSpinner />;
  }

  //  Error state
  if (fileError) {
    return (
      <div className="container mx-auto p-4 my-4 max-w-8xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Error loading files: {fileError}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  //  FIX: CHỈ hiển thị "Sheet not found" khi ĐÃ TẢI XONG nhưng vẫn không có data
  // KHÔNG hiển thị khi đang load (sheetLoading = false nhưng currentSheet = null trong lần render đầu)
  if (!sheetLoading && !currentSheet && id) {
    console.warn(`⚠️ FileDetailViewer: Sheet ${id} not found after loading`);
    return (
      <div className="container mx-auto my-4 max-w-8xl">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">Sheet not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  //  Nếu chưa có currentSheet, hiển thị loading (đang chờ load)
  if (!currentSheet) {
    return <LoadingSpinner />;
  }

  //  Ưu tiên URL từ Redux (Blob URL), fallback sang currentSheet
  const lcrUrl = lcrFileUrl || currentSheet.excelFileUrl;
  const reflowUrl = reflowFileUrl || currentSheet.pdfFileUrl;

  console.log('FileDetailViewer Render:', {
    sheetId: currentSheet.id,
    lcrUrl: lcrUrl ? 'EXISTS' : 'MISSING',
    reflowUrl: reflowUrl ? 'EXISTS' : 'MISSING',
    currentTab: fileType
  });

  return (
    <div className="container p-4 max-w-8xl mx-auto">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
        >
          ← Quay lại
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800">
          Xem chi tiết file
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Change Model ID: {currentSheet.id}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-300">
        <div className="flex gap-4">
          <button
            onClick={() => handleChangeTab('lcr')}
            disabled={!lcrUrl}
            className={`px-6 py-3 font-semibold transition ${
              fileType === 'lcr'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } ${!lcrUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            LCR File (Excel)
          </button>
          
          <button
            onClick={() => handleChangeTab('reflow')}
            disabled={!reflowUrl}
            className={`px-6 py-3 font-semibold transition ${
              fileType === 'reflow'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } ${!reflowUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Reflow File (PDF)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border-none">
        {fileType === 'lcr' && (
          <>
            {lcrUrl ? (
              <LCRFileViewer fileUrl={lcrUrl} />
            ) : (
              <div className="p-4 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-600">⚠️ LCR file has not been uploaded yet</p>
              </div>
            )}
          </>
        )}

        {fileType === 'reflow' && (
          <>
            {reflowUrl ? (
              <ReflowPDFViewer fileUrl={reflowUrl} />
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