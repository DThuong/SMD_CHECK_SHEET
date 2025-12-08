import { useEffect } from 'react';
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";
import { useSmdSheet } from "../contexts/SmdSheetContext";

interface SmdSheetDetailProps {
  logId: string;
  data: any;
  canEdit: boolean; // ENG, SUPERVISOR có thể edit
}

const SmdSheetDetail: React.FC<SmdSheetDetailProps> = ({ logId, data, canEdit }) => {
  const { 
    loadLogData,
    updateLogData,
  } = useSmdSheet();

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadLogData(logId);
  }, [logId]);

  // Xử lý lưu sau khi edit
  const handleSaveEdit = () => {
    if (!canEdit) {
      alert('❌ Bạn không có quyền chỉnh sửa!');
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn lưu các thay đổi?')) {
      const success = updateLogData(logId);
      if (success) {
        // Có thể reload hoặc quay lại logs
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  return (
    <div className="max-w-8xl mx-auto my-4">
      {/* Banner thông báo mode */}
      <div className={`mb-4 p-3 py-2 rounded-lg border border-gray-300 ${
        canEdit 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <p className="text-sm font-semibold mb-0">
          {canEdit ? (
            <>
              ✏️ <span className="text-green-800">Chế độ chỉnh sửa</span> - Bạn có thể thay đổi nội dung
            </>
          ) : (
            <>
              🔒 <span className="text-yellow-800">Chế độ xem</span> - Không thể chỉnh sửa
            </>
          )}
        </p>
      </div>

      {/* Hiển thị các component */}
      <div className={!canEdit ? 'pointer-events-none opacity-75' : ''}>
        <SheetHeader />
        <CheckModels />
        <ProgramChecks />
        <StandardProductionSection />
        <TimeChangeModels />
        <StandardVehicles />
        <PQCChecks />
      </div>

      {/* Nút lưu (chỉ hiện nếu có quyền edit) */}
      {canEdit && (
        <div className="sticky bottom-0 bg-white border-t border-gray-300 p-4 flex gap-3 justify-end shadow-lg mt-4 w-full">
          <button
            onClick={handleSaveEdit}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            Lưu thay đổi
          </button>
        </div>
      )}

      {/* CSS để disable tương tác khi read-only */}
      {!canEdit && (
        <style>{`
          .pointer-events-none button,
          .pointer-events-none input,
          .pointer-events-none textarea,
          .pointer-events-none select {
            cursor: not-allowed !important;
            background-color: #f5f5f5 !important;
          }
        `}</style>
      )}
    </div>
  );
};

export default SmdSheetDetail;