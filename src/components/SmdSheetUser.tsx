import { useNavigate } from 'react-router-dom';
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import type { ChangeModelResponse } from '../redux/slices/changeModelSlice';
import { updateSheetStatus } from '../redux/slices/changeModelSlice';
import { useState, useEffect } from 'react';

interface SmdSheetUserProps {
  sheetData?: ChangeModelResponse;
}

// Component con - Nội dung sheet
function SmdSheetContent({ sheetData }: SmdSheetUserProps) {
  // const { submitToLogs } = useSmdSheet();
  const { user } = useAppSelector(state => state.auth);
  const { completedTables, success: subTableSuccess, lastUpdatedTable } = useAppSelector(state => state.subTable);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [showSuccessNoti, setShowSuccessNoti] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // check trạng thái submit status

  // Notification khi update sub-table thành công
  useEffect(() => {
    if (subTableSuccess && lastUpdatedTable) {
      setShowSuccessNoti(true);
      const timer = setTimeout(() => setShowSuccessNoti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [subTableSuccess, lastUpdatedTable]);

  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  // Check quyền
  if (user?.role !== 'PQC') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">❌ Không có quyền truy cập</h2>
          <p className="text-red-700">Chỉ PQC mới có thể tạo sheet mới.</p>
          <button
            onClick={() => navigate('/logs')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Đi đến Logs
          </button>
        </div>
      </div>
    );
  }

  // Check toàn bộ các bảng đã complete hay chưa ?
  const requiredTables = ['CheckModel', 'ProgramCheck', 'StandardProduction', 'TimeChangeModel', 'StandardVehicle', 'PQCCheck', 'SheetHeader'];
  const allTablesCompleted = requiredTables.every(table => completedTables.includes(table));

  // HANDLE COMPLETE SHEET
  const handleCompleteSheet = async () => {
    if (!sheetData?.id) {
      alert('❌ Không có sheet data!');
      return;
    }

    if (!allTablesCompleted) {
      const missingTables = requiredTables.filter(t => !completedTables.includes(t));
      alert(
        `⚠️ Chưa hoàn thành tất cả bảng!\n\n` +
        `Còn thiếu: ${missingTables.join(', ')}\n\n` +
        `Vui lòng lưu tất cả ${requiredTables.length} bảng trước khi hoàn thành.`
      );
      return;
    }
    try {
      setIsCompleting(true);

      // Update status to PQCDone
      await dispatch(updateSheetStatus(sheetData.id)).unwrap();

      setIsSaved(true);
      setTimeout(() => {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
      }, 1500);

    } catch (error: any) {
      console.error('❌ Lỗi khi hoàn thành:', error);
      alert('❌ Lỗi: ' + (error || 'Không thể cập nhật status'));
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* Thông báo update status thành pqcdone */}
      {isSaved && (
        <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
          <div className="noti-inner bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800">✅ Cập nhật thành công! Dữ liệu đã được lưu vào hệ thống !!!</p>
          </div>
        </div>
      )}
      {/* Notification khi update sub-table thành công */}
      {showSuccessNoti && lastUpdatedTable && (
        <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
          <div className="noti-inner bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800">✅ Cập nhật thành công!</p>
            <p className="text-green-700 text-sm mt-1">{lastUpdatedTable}</p>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {sheetData && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Tiến độ hoàn thành</h4>
            <span className="text-sm font-bold text-blue-600">
              {completedTables.length} / {requiredTables.length}
            </span>
          </div>
          
          <div className="max-w-8xl bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(completedTables.length / requiredTables.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {requiredTables.map(table => (
              <div 
                key={table}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  completedTables.includes(table) 
                    ? 'bg-green-100 text-green-700 font-semibold' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{completedTables.includes(table) ? '✓' : '○'}</span>
                <span>{table}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thông báo role */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 text-center mb-0">
          ✏️ Bạn đang ở chế độ <strong>CHỈNH SỬA SHEET</strong> (Role: {user?.role})
        </p>
        {sheetData && (
          <p className="text-xs text-green-700 text-center mt-1">
            Sheet ID: <strong>{sheetData.id}</strong> | Status: <strong>{sheetData.status}</strong>
          </p>
        )}
      </div>

      {/* Các component form */}
      <SheetHeader />
      
      <CheckModels />
      
      <ProgramChecks />
      
      <StandardProductionSection 
      />
      
      <TimeChangeModels 
      />
      
      <StandardVehicles 
      />
      
      <PQCChecks 
      />

      {/* NÚT HOÀN THÀNH SHEET - Sticky Bottom */}
      {sheetData && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 p-4 shadow-lg z-10">
          <div className="max-w-4xl mx-auto">
            {/* Show complete button when ALL tables done */}
            {allTablesCompleted && sheetData.status !== 'PQCDone' ? (
              <div className="p-4 bg-linear-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
                <button
                  onClick={handleCompleteSheet}
                  disabled={isCompleting}
                  className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                    isCompleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transform hover:scale-95'
                  }`}
                >
                  {isCompleting 
                    ? '⏳ Đang hoàn thành...' 
                    : 'Ký xác nhận'}
                </button>
              </div>
            ) : sheetData.status === 'PQCDone' ? (
              // Already completed
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                <p className="text-green-800 font-semibold">
                  ✓ Sheet đã hoàn thành và được lưu vào hệ thống
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Status: <strong>PQCDone</strong>
                </p>
              </div>
            ) : (
              // Not all tables completed yet
              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 text-center font-semibold">
                  ⚠️ Vui lòng hoàn thành tất cả {requiredTables.length} bảng trước khi hoàn tất sheet
                </p>
                <p className="text-xs text-yellow-700 text-center mt-2 mb-0">
                  Còn lại: <strong>{requiredTables.length - completedTables.length}</strong> bảng chưa lưu
                </p>
                
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Component chính - Wrap với Provider
const SmdSheetUser = ({ sheetData }: SmdSheetUserProps) => {
  return (
        <SmdSheetContent sheetData={sheetData} />
  );
};

export default SmdSheetUser;