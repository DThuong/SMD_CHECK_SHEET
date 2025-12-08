import { useNavigate } from 'react-router-dom';
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";
import { useSmdSheet, SmdSheetProvider } from "../contexts/SmdSheetContext";
import { useAuth } from "../pages/authLoginSample/AuthContext";

// Component con - Nội dung sheet
function SmdSheetContent() {
  const { submitToLogs, clearData, metadata } = useSmdSheet();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Kiểm tra quyền (CHỈ PQC được tạo sheet mới)
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

  // Xử lý submit
  const handleSubmitToLogs = () => {
      const success = submitToLogs();
      if (success) {
        alert('✅ Sheet đã được gửi thành công! Form đã được reset để tạo sheet mới.');
        // Form đã tự động reset trong submitToLogs()
        // Không cần navigate, user ở lại trang để tạo sheet mới
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('❌ Lỗi khi gửi sheet.');
    }
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* Hiển thị thông tin draft */}
      {metadata.submittedAt && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-bold text-blue-800 mb-2">Draft đã lưu</h4>
          <div className="text-sm space-y-1">
            <p><strong>Người tạo:</strong> {metadata.submittedBy}</p>
            <p><strong>Role:</strong> {metadata.role}</p>
            <p><strong>Lần lưu cuối:</strong> {new Date(metadata.submittedAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>
      )}

      {/* Thông báo role */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 text-center mb-0">
          ✏️ Bạn đang ở chế độ <strong>TẠO SHEET MỚI</strong> (Role: {user?.role})
        </p>
      </div>

      {/* Các component form */}
      <SheetHeader />
      <CheckModels />
      <ProgramChecks />
      <StandardProductionSection />
      <TimeChangeModels />
      <StandardVehicles />
      <PQCChecks />

      {/* Nút hành động - Sticky bottom */}
      <div className="max-w-4xl sticky bottom-0 left-1/4 bg-white border-gray-300 p-4 flex gap-3 justify-center shadow-lg flex-col">
        <button
          onClick={clearData}
          className="px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          Xóa (Draft)
        </button>
        
        {/* <button
          onClick={saveToLocalStorage}
          className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-md"
        >
          Lưu tạm (Draft)
        </button> */}

        <button
          onClick={handleSubmitToLogs}
          className="px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md"
        >
          Gửi Sheet (Draft)
        </button>
      </div>
    </div>
  );
}

// Component chính - Wrap với Provider
const SmdSheetUser = () => {
  return (
    <SmdSheetProvider>
      <SmdSheetContent />
    </SmdSheetProvider>
  );
};

export default SmdSheetUser;