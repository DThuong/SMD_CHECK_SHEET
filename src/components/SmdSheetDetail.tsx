import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/hooks';
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";
import { 
  setCheckModel,
  setProgramCheck,
  setStandardProduction,
  setTimeChangeModel,
  setStandardVehicle,
  setPQCCheck,
  clearAllSubTableData
} from '../redux/slices/subTableSlice';
import { setCurrentSheet, updateSheetStatusToPQCDone } from '../redux/slices/changeModelSlice';

const SmdSheetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [sheetData, setSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // CHỈ status Pending mới được edit, tất cả status khác đều chỉ xem
  const canEdit = sheetData?.status === 'pending';

  // Load dữ liệu sheet từ API
  useEffect(() => {
    const loadSheetData = async () => {
      if (!id) {
        setError('ID sheet không hợp lệ');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        // Gọi API lấy thông tin sheet theo id (đã bao gồm tất cả nested data)
        const response = await fetch(
          `https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api/ChangeModel/object/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Sheet data:", data);
        setSheetData(data);
        dispatch(setCurrentSheet(data));
        
        // Dispatch các nested objects vào Redux store
        if (data.checkModel) {
          dispatch(setCheckModel(data.checkModel));
        }
        
        if (data.programCheck) {
          dispatch(setProgramCheck(data.programCheck));
        }
        
        if (data.standardProduction) {
          dispatch(setStandardProduction(data.standardProduction));
        }
        
        if (data.timeChangeModel) {
          dispatch(setTimeChangeModel(data.timeChangeModel));
        }
        
        if (data.standardVehicle) {
          dispatch(setStandardVehicle(data.standardVehicle));
        }
        
        if (data.pqcCheck) {
          dispatch(setPQCCheck(data.pqcCheck));
        }
        
      } catch (error: any) {
        console.error('❌ Error loading sheet:', error);
        setError(error.message || 'Không thể tải dữ liệu sheet!');
      } finally {
        setLoading(false);
      }
    };

    loadSheetData();
    
    // Cleanup khi unmount
    return () => {
      dispatch(clearAllSubTableData());
    };
  }, [id, dispatch]);

  // Xử lý lưu thay đổi
  const handleSaveEdit = async () => {
    if (!canEdit) {
      alert('❌ Bạn không có quyền chỉnh sửa! Chỉ sheet có trạng thái "pending" mới có thể chỉnh sửa.');
      return;
    }
    try {
      await dispatch(updateSheetStatusToPQCDone(sheetData.id)).unwrap();
      alert('✅ Đã ký thành công!');
      // chuyển trang sau 2s
      setTimeout(() => {
        navigate(0); // reload lại component
      }, 2000);
  } catch (error) {
    console.error('updateSheetStatus failed', error);
  }
    }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-8xl mx-auto my-4 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-8xl mx-auto my-4 p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            ⚠️ Có lỗi xảy ra
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-sheets')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!sheetData) {
    return (
      <div className="max-w-8xl mx-auto my-4 p-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">
            ⚠️ Không tìm thấy dữ liệu
          </h2>
          <p className="text-yellow-600 mb-4">Sheet này không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/my-sheets')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // Helper function để hiển thị status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Đang xử lý' },
      'PQCDone': { bg: 'bg-green-100', text: 'text-green-800', icon: '✔', label: 'PQC hoàn thành' },
      'ENGDone': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔧', label: 'ENG đã xác nhận' },
      'SupervisiorDone': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '👔', label: 'Supervisor đã xác nhận' },
      'ManagerDone': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '👨‍💼', label: 'Manager đã xác nhận' },
      'KoreaManagerDone': { bg: 'bg-indigo-200', text: 'text-indigo-900', icon: '🇰🇷', label: 'Korea Manager đã xác nhận' },
      'Completed': { bg: 'bg-green-200', text: 'text-green-900', icon: '🎉', label: 'Hoàn thành' },
    };

    const config = statusConfig[status] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      icon: '📋', 
      label: status 
    };

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </div>
    );
  };

  return (
    <div className="max-w-8xl mx-auto p-4 my-4">
      {/* Header với thông tin sheet */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Chi tiết Sheet #{sheetData.id}
            </h1>
            {sheetData.createAt && (
              <p className="text-xs text-gray-500 mt-1 mb-0">
                Tạo lúc: {new Date(sheetData.createAt).toLocaleString('vi-VN')}
              </p>
            )}
            {sheetData.account && (
              <p className="text-xs text-gray-500 mb-0">
                Người tạo: {sheetData.account.username} ({sheetData.account.role})
              </p>
            )}
          </div>
          <div className='text-center py-2'>{getStatusBadge(sheetData.status)}</div>
        </div>
      </div>

      {/* Banner thông báo mode */}
      <div className={`mb-4 p-3 rounded-lg border ${
        canEdit 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <p className="text-sm font-semibold mb-0 text-center">
          {canEdit ? (
            <>
              ✏️ <span className="text-green-800">Chế độ chỉnh sửa</span> - Bạn có thể thay đổi và lưu nội dung
            </>
          ) : (
            <>
              👁️ <span className="text-blue-800">Chế độ xem</span> - Sheet này chỉ có thể xem, không thể chỉnh sửa
            </>
          )}
        </p>
      </div>

      {/* Hiển thị các component */}
      <div className={!canEdit ? 'pointer-events-none opacity-80' : ''}>
        <SheetHeader canEdit={canEdit} />
        <CheckModels canEdit={canEdit} />
        <ProgramChecks canEdit={canEdit} />
        <StandardProductionSection canEdit={canEdit} />
        <TimeChangeModels canEdit={canEdit} />
        <StandardVehicles canEdit={canEdit} />
        <PQCChecks canEdit={canEdit} />
      </div>

      {/* Buttons */}
      <div className="w-full sticky bottom-0 bg-white border-t border-gray-300 p-4 flex items-center justify-center gap-3 shadow-lg mt-4 z-10">
        <button
          onClick={() => navigate('/my-sheets')}
          className="px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          Quay lại
        </button>
        
        {canEdit && (
          <button
            onClick={handleSaveEdit}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            Ký xác nhận
          </button>
        )}
        
        {!canEdit && (
          <div className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold text-center cursor-not-allowed">
            🔒 Không thể chỉnh sửa
          </div>
        )}
      </div>

      {/* CSS để disable tương tác khi read-only */}
      {!canEdit && (
        <style>{`
          .pointer-events-none button,
          .pointer-events-none input,
          .pointer-events-none textarea,
          .pointer-events-none select {
            cursor: not-allowed !important;
            background-color: #f9fafb !important;
            opacity: 0.7;
          }
          .pointer-events-none input:focus,
          .pointer-events-none textarea:focus,
          .pointer-events-none select:focus {
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      )}
    </div>
  );
};

export default SmdSheetDetail;