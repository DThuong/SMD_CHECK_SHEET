import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import CheckModels from "../smd_Sheet/CheckModels";
import PQCChecks from "../smd_Sheet/PQCChecks";
// import ProgramChecks from "./smd_Sheet/ProgramChecks";
import SheetHeader from "../smd_Sheet/SheetHeader";
import StandardProductionSection from "../smd_Sheet/StandardProductions";
import StandardVehicles from "../smd_Sheet/StandardVehicles";
import TimeChangeModels from "../smd_Sheet/TimeChangeModels";
import type { ChangeModelResponse } from '../../redux/slices/changeModelSlice';
import { FaRegClock } from "react-icons/fa";
import { 
  setCheckModel,
  setStandardProduction,
  setTimeChangeModel,
  setStandardVehicle,
  setPQCCheck,
  clearAllSubTableData,
  addCompletedTable,
  resetCompletedTables
} from '../../redux/slices/subTableSlice';
import { 
  getSheetWithFullObject, 
  updateSheetStatusToPQCDone,
  clearError 
} from '../../redux/slices/changeModelSlice';
import { useNotification } from '../../redux/hooks';
import Notification from '../general/Notification';
import { REQUIRED_FIELDS_CONFIG, hasAllRequiredData, getMissingFields } from '../../utils/requiredFieldsConfig';

const SmdSheetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Lấy data từ Redux store
  const { currentSheet, loading, error } = useAppSelector((state) => state.changeModel);
  
  // CHỈ status Pending mới được edit
  const canEdit = currentSheet?.status?.toLowerCase() === 'pending';

  // thông báo
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    dispatch(resetCompletedTables());
  }, [id, dispatch]);

  // Load dữ liệu sheet từ Redux action
  useEffect(() => {
    const loadSheetData = async () => {
      if (!id) return;
      
      try {
        const result = await dispatch(getSheetWithFullObject(Number(id))).unwrap();
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
        
        //  StandardProduction
        if (result.standardProduction) {
          dispatch(setStandardProduction(result.standardProduction));
          
          if (hasAllRequiredData(result.standardProduction, REQUIRED_FIELDS_CONFIG.StandardProduction)) {
            dispatch(addCompletedTable('StandardProduction'));
          } else {
            const missing = getMissingFields(result.standardProduction, REQUIRED_FIELDS_CONFIG.StandardProduction);
            console.log(missing);
          }
        }
        
        // TimeChangeModel
        if (result.timeChangeModel) {
          dispatch(setTimeChangeModel(result.timeChangeModel));
          
          if (hasAllRequiredData(result.timeChangeModel, REQUIRED_FIELDS_CONFIG.TimeChangeModel)) {
            dispatch(addCompletedTable('TimeChangeModel'));
          } else {
            const missing = getMissingFields(result.timeChangeModel, REQUIRED_FIELDS_CONFIG.TimeChangeModel);
            console.log(missing);
          }
        }
        
        //  StandardVehicle
        if (result.standardVehicle) {
          dispatch(setStandardVehicle(result.standardVehicle));
          
          if (hasAllRequiredData(result.standardVehicle, REQUIRED_FIELDS_CONFIG.StandardVehicle)) {
            dispatch(addCompletedTable('StandardVehicle'));
          } else {
            const missing = getMissingFields(result.standardVehicle, REQUIRED_FIELDS_CONFIG.StandardVehicle);
            console.log(missing);
          }
        }
        
        //  PQCCheck
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
    
    // Cleanup khi unmount
    return () => {
      dispatch(clearAllSubTableData());
      dispatch(resetCompletedTables());
      dispatch(clearError());
    };
  }, [id, dispatch]);

  // Xử lý lưu thay đổi
  const handleSaveEdit = async () => {
    if (!canEdit) {
      showNotification('warning', 'Không thể chỉnh sửa', 'Sheet này không ở trạng thái Pending, không thể chỉnh sửa.');
      return;
    }
    
    if (!currentSheet?.id) return;
    
    try {
      if(currentSheet?.pdfFileUrl !== "" && currentSheet?.excelFileUrl !== "") {
        await dispatch(updateSheetStatusToPQCDone(currentSheet.id)).unwrap();
        setTimeout(() => {
        navigate(0);
      }, 1000);
      }else{
        showNotification('warning', 'Thiếu file', 'Làm ơn upload cả 2 file: pdf và excel.');
      }
      
      
    } catch (error) {
      console.error('updateSheetStatus failed', error);
      showNotification('error', 'Lỗi', 'Có lỗi xảy ra khi ký xác nhận!');
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
  if (!currentSheet) {
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

  const getStatusBadge = (sheet: ChangeModelResponse) => {
  const status = sheet.status?.toLowerCase();
  
  //  Kiểm tra xem có phải trạng thái "Done" không
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

  //  Lấy label đẹp
  const label = statusLabels[status || 'pending'] || (sheet.status || 'Unknown');

  //  Chọn màu: Pending = Vàng, Done = Xanh lá
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

  return (
    <div className="max-w-8xl mx-auto p-4 my-4">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
      {/* Header với thông tin sheet */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Chi tiết Sheet: #{currentSheet?.id} & WorkOrder:{currentSheet?.checkModel?.workOrder !== '' ? currentSheet?.checkModel?.workOrder : 'Chưa Có'}
            </h1>
            {currentSheet.createAt && (
              <p className="text-xs text-gray-500 mt-1 mb-0">
                Tạo lúc: {new Date(currentSheet.createAt).toLocaleString('vi-VN')}
              </p>
            )}
            {currentSheet.account && (
              <p className="text-xs text-gray-500 mb-0">
                Người tạo: {currentSheet.account.fullName || currentSheet.account.userName} ({currentSheet.account.role})
              </p>
            )}
          </div>
          <div className='text-center py-2'>{getStatusBadge(currentSheet)}</div>
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
        <StandardProductionSection canEdit={canEdit} />
        <TimeChangeModels canEdit={canEdit} />
        <StandardVehicles canEdit={canEdit} />
        <PQCChecks canEdit={canEdit} />
          
      </div>

      {/* Buttons */}
      <div className="w-full sticky bottom-0 bg-white border-t-2 border-l-2 border-r-2 border-gray-300 p-4 flex items-center justify-center gap-3 shadow-lg mt-4 z-10">
        <button
          onClick={() => navigate('/my-sheets')}
          className="px-4 lg:py-3 md:py-3 py-3 bg-gray-600 text-white rounded-lg! font-semibold hover:bg-gray-700 transition-colors"
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
          <div className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 font-semibold text-center cursor-not-allowed">
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
            opacity: 1;
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