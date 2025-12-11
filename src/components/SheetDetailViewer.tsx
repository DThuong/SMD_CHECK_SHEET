// src/components/SheetDetailViewer.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  setCheckModel,
  setProgramCheck,
  setStandardProduction,
  setTimeChangeModel,
  setStandardVehicle,
  setPQCCheck,
  clearAllSubTableData
} from '../redux/slices/subTableSlice';
import { setCurrentSheet, updateSheetStatus } from '../redux/slices/changeModelSlice';

// Import các sub-components (READ-ONLY mode)
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";

const SheetDetailViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [sheetData, setSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // ✅ PHÂN QUYỀN CHÍNH XÁC
  // ENG, Supervisior: Có thể XEM và SỬA (nếu status phù hợp)
  // Manager, KoreaManager: CHỈ XEM (không sửa)
  const canEdit = () => {
    if (!user || !sheetData) return false;
    
    const userRole = user.role;
    const status = sheetData.status?.toLowerCase();
    
    // ENG có thể sửa khi status = PQCDone
    if (userRole === 'ENG' && status === 'pqcdone') return true;
    
    // Supervisior có thể sửa khi status = ENGDone
    if (userRole === 'Supervisior' && status === 'engdone') return true;
    
    // Manager và KoreaManager KHÔNG được sửa
    return false;
  };

  // ✅ KIỂM TRA QUYỀN KÝ
  const canConfirm = () => {
    if (!user || !sheetData) return false;
    
    const userRole = user.role;
    const status = sheetData.status?.toLowerCase();
    
    switch (userRole) {
      case 'ENG':
        return status === 'pqcdone';
      case 'Supervisior':
        return status === 'engdone';
      case 'Manager':
        return status === 'supervisiordone';
      case 'KoreaManager':
        return status === 'managerdone';
      default:
        return false;
    }
  };

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
        console.log("✅ Sheet data loaded:", data);
        setSheetData(data);
        dispatch(setCurrentSheet(data));
        
        // Dispatch nested objects
        if (data.checkModel) dispatch(setCheckModel(data.checkModel));
        if (data.programCheck) dispatch(setProgramCheck(data.programCheck));
        if (data.standardProduction) dispatch(setStandardProduction(data.standardProduction));
        if (data.timeChangeModel) dispatch(setTimeChangeModel(data.timeChangeModel));
        if (data.standardVehicle) dispatch(setStandardVehicle(data.standardVehicle));
        if (data.pqcCheck) dispatch(setPQCCheck(data.pqcCheck));
        
      } catch (error: any) {
        console.error('❌ Error loading sheet:', error);
        setError(error.message || 'Không thể tải dữ liệu sheet!');
      } finally {
        setLoading(false);
      }
    };

    loadSheetData();
    
    return () => {
      dispatch(clearAllSubTableData());
    };
  }, [id, dispatch]);

  // ✅ XỬ LÝ KÝ XÁC NHẬN
  const handleConfirm = async () => {
    if (!canConfirm()) {
      alert('❌ Bạn không có quyền xác nhận ở bước này!');
      return;
    }

    if (!user || !sheetData) return;

    const confirmMessage = `Bạn có chắc chắn muốn xác nhận sheet này với vai trò ${user.role}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setConfirming(true);
      
      await dispatch(updateSheetStatus({
        sheetId: sheetData.id,
        currentStatus: sheetData.status,
        userRole: user.role as string
      })).unwrap();
      
      alert('✅ Xác nhận thành công!');
      
      // Reload page sau 1s
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Lỗi khi xác nhận:', error);
      alert(`❌ ${error || 'Có lỗi xảy ra khi xác nhận'}`);
    } finally {
      setConfirming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-8xl mx-auto my-4 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Error state
  if (error || !sheetData) {
    return (
      <div className="max-w-8xl mx-auto my-4 p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">⚠️ Có lỗi xảy ra</h2>
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy dữ liệu'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Đang xử lý' },
      'pqcdone': { bg: 'bg-green-100', text: 'text-green-800', icon: '✔', label: 'PQC hoàn thành' },
      'engdone': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '', label: 'ENG đã xác nhận' },
      'supervisiordone': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '', label: 'Supervisor đã xác nhận' },
      'managerdone': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '', label: 'Manager đã xác nhận' },
      'koreamanagerdone': { bg: 'bg-teal-100', text: 'text-teal-900', icon: '🇰🇷', label: 'Korea Manager đã xác nhận' },
    };

    const config = statusConfig[status.toLowerCase()] || { 
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

  const isEditable = canEdit();
  const isConfirmable = canConfirm();

  return (
    <div className="max-w-8xl mx-auto p-4 my-4">
      {/* Header */}
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
                Người tạo: {sheetData.account.fullName || sheetData.account.userName} ({sheetData.account.role})
              </p>
            )}
          </div>
          <div className='text-center py-2'>{getStatusBadge(sheetData.status)}</div>
        </div>
      </div>

      {/* Banner phân quyền */}
      <div className={`mb-4 p-3 rounded-lg border ${
        isEditable 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <p className="text-sm font-semibold mb-0 text-center">
          {isEditable ? (
            <>
              ✏️ <span className="text-green-800">Chế độ chỉnh sửa</span> - Bạn có thể thay đổi và lưu nội dung
            </>
          ) : (
            <>
              👁️ <span className="text-blue-800">Chế độ xem</span> - Sheet này chỉ có thể xem
              {user?.role === 'Manager' || user?.role === 'KoreaManager' ? ' (Manager không có quyền chỉnh sửa)' : ''}
            </>
          )}
        </p>
      </div>

      {/* Hiển thị các component */}
      <div className={!isEditable ? 'pointer-events-none opacity-80' : ''}>
        <SheetHeader canEdit={isEditable} />
        <CheckModels canEdit={isEditable} />
        <ProgramChecks canEdit={isEditable} />
        <StandardProductionSection canEdit={isEditable} />
        <TimeChangeModels canEdit={isEditable} />
        <StandardVehicles canEdit={isEditable} />
        <PQCChecks canEdit={isEditable} />
      </div>

      {/* Buttons */}
      <div className="w-full sticky bottom-0 bg-white border-t border-gray-300 p-4 flex items-center justify-center gap-3 shadow-lg mt-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          Quay lại
        </button>
        
        {isConfirmable && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Đang xác nhận...' : ` Ký xác nhận (${user?.role})`}
          </button>
        )}
        
        {!isConfirmable && (
          <div className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold text-center cursor-not-allowed">
            {user?.role === 'Manager' || user?.role === 'KoreaManager' 
              ? '👁️ Chỉ xem (Chưa đến lượt xác nhận)'
              : '🔒 Không thể xác nhận'}
          </div>
        )}
      </div>

      {/* CSS để disable tương tác khi read-only */}
      {!isEditable && (
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

export default SheetDetailViewer;