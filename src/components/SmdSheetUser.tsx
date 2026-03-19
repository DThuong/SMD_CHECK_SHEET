/* eslint-disable @typescript-eslint/no-explicit-any */
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
// import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import type { ChangeModelResponse } from '../redux/slices/changeModelSlice';
import { updateSheetStatusToPQCDone } from '../redux/slices/changeModelSlice';
import { useState, useEffect } from 'react';
import { useNotification } from '../redux/hooks';
import Notification from './general/Notification';
import { ConfirmModal } from "./general/ConfirmModal";

interface SmdSheetUserProps {
  sheetData?: ChangeModelResponse;
}

// Component con - Nội dung sheet
function SmdSheetContent({ sheetData }: SmdSheetUserProps) {
  const { user } = useAppSelector(state => state.auth);
  const { completedTables, success: subTableSuccess, lastUpdatedTable } = useAppSelector(state => state.subTable);
  // const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
  const dispatch = useAppDispatch();
  const [ openModal, setOpenModal ] = useState(false);

  const [isCompleting, setIsCompleting] = useState(false);

  // Hook notification thống nhất
  const { notification, showNotification, hideNotification } = useNotification();

  // Notification khi update sub-table thành công
  useEffect(() => {
    if (subTableSuccess && lastUpdatedTable) {
      showNotification('success', 'Cập nhật thành công!', lastUpdatedTable);
    }
  }, [subTableSuccess, lastUpdatedTable]);

  // Check toàn bộ các bảng đã complete hay chưa ?
  const requiredTables = ['CheckModel', 'StandardProduction', 'TimeChangeModel', 'StandardVehicle', 'PQCCheck'];
  const allTablesCompleted = requiredTables.every(table => completedTables.includes(table));

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  // HANDLE COMPLETE SHEET
  const handleCompleteSheet = async () => {
    if (!sheetData?.id) {
      showNotification('error', 'Không có sheet data!');
      return;
    }

    if (!allTablesCompleted) {
      const missingTables = requiredTables.filter(t => !completedTables.includes(t));
      showNotification(
        'warning',
        'Chưa hoàn thành tất cả bảng!',
        `Còn thiếu: ${missingTables.join(', ')}`
      );
      return;
    }
    setOpenModal(false);

    try {
      setIsCompleting(true);

      const res = await dispatch(updateSheetStatusToPQCDone(sheetData.id)).unwrap();
      if(res){
        showNotification('success', 'Hoàn thành!', 'Sheet đã được ký xác nhận thành công');
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
      }else{
        showNotification('error', 'Lỗi', 'Không thể ký');
      }
    } catch (error: any) {
      console.error('❌ Lỗi khi hoàn thành:', error);
      showNotification('error', 'Lỗi khi hoàn thành', error || 'Không thể cập nhật status');
    } finally {
      setIsCompleting(false);
    }
  };

  // HANDLE: Hủy modal
  const handleCancelModal = () => {
    setOpenModal(false);
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* Notification Component - Thay thế tất cả notification cũ */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        open={openModal}
        title="Xác nhận hoàn thành"
        message={"Bạn có chắc chắn đã upload đầy đủ 2 file LCR (Excel) và REFLOW (PDF) chưa?"}
        confirmText="Xác nhận"
        cancelText="Hủy"
        type={"warning"}
        onConfirm={handleCompleteSheet}
        onCancel={handleCancelModal}
      />

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
      <SheetHeader canEdit />
      
      <CheckModels canEdit />
      
      <StandardProductionSection canEdit />
      
      <TimeChangeModels canEdit />
      
      <StandardVehicles canEdit />
      
      <PQCChecks canEdit />

      {/* NÚT HOÀN THÀNH SHEET - Sticky Bottom */}
      {sheetData && (
        <div className="sticky bottom-0 left-[30%] bg-white border-t-2 border-l-2 border-r-2 border-gray-300 p-2 shadow-lg z-10 max-w-3xl ">
          <div className="mx-auto">
            {/* Show complete button when ALL tables done */}
            {allTablesCompleted && sheetData.status !== 'PQCDone' ? (
              <div className="p-3">
                <button
                  onClick={handleOpenModal}
                  disabled={isCompleting}
                  className={`w-full px-4 py-4 rounded-lg font-bold text-lg transition-all shadow-lg ${
                    isCompleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-[0.99]'
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
                <p className="text-green-800 font-semibold mb-0">
                  ✓ Sheet đã hoàn thành và được lưu vào hệ thống
                </p>
                <p className="text-sm text-green-700 mt-1 mb-0">
                  Status: <strong>PQCDone</strong>
                </p>
              </div>
            ) : (
              // Not all tables completed yet
              <div className="p-2 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 text-center font-semibold mb-0">
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
  return <SmdSheetContent sheetData={sheetData} />;
};

export default SmdSheetUser;