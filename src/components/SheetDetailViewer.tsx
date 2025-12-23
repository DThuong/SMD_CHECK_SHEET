import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { 
  setCheckModel,
  setStandardProduction,
  setTimeChangeModel,
  setStandardVehicle,
  setPQCCheck,
  clearAllSubTableData,
  addCompletedTable
} from '../redux/slices/subTableSlice';
import { 
  getSheetWithFullObject, 
  updateSheetStatus,
  clearError, 
  type ChangeModelResponse
} from '../redux/slices/changeModelSlice';

// Import các sub-components
import CheckModels from "./smd_Sheet/CheckModels";
import PQCChecks from "./smd_Sheet/PQCChecks";
// import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "./smd_Sheet/SheetHeader";
import StandardProductionSection from "./smd_Sheet/StandardProductions";
import StandardVehicles from "./smd_Sheet/StandardVehicles";
import TimeChangeModels from "./smd_Sheet/TimeChangeModels";
import { FaRegClock } from 'react-icons/fa6';
import { useNotification } from '../redux/hooks';
import Notification from './Notification';
import { REQUIRED_FIELDS_CONFIG, hasAllRequiredData, getMissingFields } from '../utils/requiredFieldsConfig';

const SheetDetailViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Lấy data từ Redux store
  const { currentSheet, loading, error } = useAppSelector((state) => state.changeModel);
  const { user } = useAppSelector((state) => state.auth);
  const { notification, showNotification, hideNotification } = useNotification();
  const [confirming, setConfirming] = useState(false);

  // PHÂN QUYỀN CHÍNH XÁC
  const canEdit = () => {
    if (!user || !currentSheet) return false;
    
    const userRole = user.role;
    const status = currentSheet.status?.toLowerCase();
    
    if (userRole === 'ENG' && status === 'pqcdone') return true;
    if (userRole === 'Supervisior' && status === 'engdone') return true;
    
    return false;
  };

  const canConfirm = () => {
    if (!user || !currentSheet) return false;
    
    const userRole = user.role;
    const status = currentSheet.status?.toLowerCase();
    
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

  // Load dữ liệu sheet từ Redux action
  useEffect(() => {
    const loadSheetData = async () => {
      if (!id) return;
      
      try {
        const result = await dispatch(getSheetWithFullObject(Number(id))).unwrap();
        // Dispatch nested objects
        // CheckModel
                if (result.checkModel) {
                  dispatch(setCheckModel(result.checkModel));
                  
                  if (hasAllRequiredData(result.checkModel, REQUIRED_FIELDS_CONFIG.CheckModel)) {
                    dispatch(addCompletedTable('CheckModel'));
                  } else {
                    const missing = getMissingFields(result.checkModel, REQUIRED_FIELDS_CONFIG.CheckModel);
                    console.log(missing);
                  }
                }
                
                // ✅ StandardProduction
                if (result.standardProduction) {
                  dispatch(setStandardProduction(result.standardProduction));
                  
                  if (hasAllRequiredData(result.standardProduction, REQUIRED_FIELDS_CONFIG.StandardProduction)) {
                    dispatch(addCompletedTable('StandardProduction'));
                  } else {
                    const missing = getMissingFields(result.standardProduction, REQUIRED_FIELDS_CONFIG.StandardProduction);
                    console.log(missing);
        
                  }
                }
                
                // ✅ TimeChangeModel
                if (result.timeChangeModel) {
                  dispatch(setTimeChangeModel(result.timeChangeModel));
                  
                  if (hasAllRequiredData(result.timeChangeModel, REQUIRED_FIELDS_CONFIG.TimeChangeModel)) {
                    dispatch(addCompletedTable('TimeChangeModel'));
                  } else {
                    const missing = getMissingFields(result.timeChangeModel, REQUIRED_FIELDS_CONFIG.TimeChangeModel);
                    console.log(missing);
                  }
                }
                
                // ✅ StandardVehicle
                if (result.standardVehicle) {
                  dispatch(setStandardVehicle(result.standardVehicle));
                  
                  if (hasAllRequiredData(result.standardVehicle, REQUIRED_FIELDS_CONFIG.StandardVehicle)) {
                    dispatch(addCompletedTable('StandardVehicle'));
                  } else {
                    const missing = getMissingFields(result.standardVehicle, REQUIRED_FIELDS_CONFIG.StandardVehicle);
                    console.log(missing);
                  }
                }
                
                // ✅ PQCCheck
                if (result.pqcCheck) {
                  dispatch(setPQCCheck(result.pqcCheck));
                  
                  if (hasAllRequiredData(result.pqcCheck, REQUIRED_FIELDS_CONFIG.PQCCheck)) {
                    dispatch(addCompletedTable('PQCCheck'));
                  } else {
                    const missing = getMissingFields(result.pqcCheck, REQUIRED_FIELDS_CONFIG.PQCCheck);
                    console.log(missing);
                  }
                }
                
        
      } catch (error: any) {
        console.error('❌ Error loading sheet:', error);
      }
    };

    loadSheetData();
    
    return () => {
      dispatch(clearAllSubTableData());
      dispatch(clearError());
    };
  }, [id, dispatch]);

  // XỬ LÝ KÝ XÁC NHẬN
  const handleConfirm = async () => {
    if (!canConfirm()) {
      showNotification('error', 'Bạn không có quyền xác nhận bước này!');
      return;
    }

    if (!user || !currentSheet) return;
    try {
      setConfirming(true);
      await dispatch(updateSheetStatus({
        sheetId: currentSheet.id!,
        currentStatus: currentSheet.status!,
        userRole: user.role as string
      })).unwrap();
      
      showNotification('success', `Xác nhận thành công bởi ${user.role}!`);
      
      setTimeout(() => {
        navigate(0);
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Lỗi khi xác nhận:', error);
      showNotification('error', 'Xác nhận thất bại', error || 'Đã xảy ra lỗi khi xác nhận bước này');
    } finally {
      setConfirming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-8xl mx-auto p-8">
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
  if (error || !currentSheet) {
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

    const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();
    
    // ✅ Kiểm tra xem có phải trạng thái "Done" không
    const isDone = status && status !== 'pending';
    
    // Status label mapping (hiển thị đẹp cho user)
    const statusLabels: Record<string, string> = {
      'pending': 'Pending',
      'pqcdone': 'PQC Done',
      'engdone': 'Engineer Done',
      'supervisiordone': 'Supervisor Done',
      'managerdone': 'Manager Done',
      'koreamanagerdone': 'Korea Manager Done',
    };
  
    // ✅ Lấy label đẹp
    const label = statusLabels[status || 'pending'] || (sheet.status || 'Unknown');
  
    // ✅ Chọn màu: Pending = Vàng, Done = Xanh lá
    const bgColor = isDone ? 'bg-green-100' : 'bg-yellow-100';
    const textColor = isDone ? 'text-green-700' : 'text-yellow-700';
    const iconColor = isDone ? '#16a34a' : '#f59e0b'; // green-600 : yellow-500
  
    return (
      <div className={`flex items-center gap-1 ${bgColor} ${textColor} rounded-full px-2 py-1 text-xs font-medium`}>
        <FaRegClock color={iconColor} /> 
        <span>{label}</span>
      </div>
    );
  };
  

  const isEditable = canEdit();
  const isConfirmable = canConfirm();

  return (
    <div className="max-w-8xl mx-auto my-4">
      {/** notification */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
      {/* Header */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Chi tiết Sheet #{currentSheet.id}
            </h1>
            {currentSheet.createAt && (
              <p className="text-xs text-gray-500 mt-1 mb-0">
                Tạo lúc: {new Date(currentSheet.createAt).toLocaleString('vi-VN')}
              </p>
            )}
            {currentSheet.account && (
              <p className="text-xs text-gray-500 mb-0">
                Người tạo: {currentSheet.account?.fullName || currentSheet.account.userName} ({currentSheet.account.role})
              </p>
            )}
          </div>
          <div className='text-center py-2'>{getStatusBadge(currentSheet)}</div>
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
        {/* <ProgramChecks canEdit={isEditable} /> */}
        <StandardProductionSection canEdit={isEditable} />
        <TimeChangeModels canEdit={isEditable} />
        <StandardVehicles canEdit={isEditable} />
        <PQCChecks canEdit={isEditable} />
      </div>

      {/* Buttons */}
      <div className="w-full sticky bottom-0 bg-white border-t-2 border-l-2 border-r-2 border-gray-300 p-4 flex items-center justify-center gap-3 shadow-lg mt-4 z-10">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-3 bg-gray-600 text-white rounded-lg! text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Quay lại
        </button>
        
        {isConfirmable && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? 'Đang xác nhận...' : `Ký xác nhận (${user?.role})`}
          </button>
        )}
        
        {!isConfirmable && (
          <div className="flex-1 px-4 py-3 bg-gray-300 text-gray-600  font-semibold text-center text-sm cursor-not-allowed">
            {user?.role === 'Manager' || user?.role === 'KoreaManager' 
              ? '👁️ Chỉ xem (Chưa đến lượt xác nhận)'
              : '🔒 Không thể ký'}
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