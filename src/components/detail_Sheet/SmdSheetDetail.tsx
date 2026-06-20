/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import CheckModels from "../smd_Sheet/CheckModels";
import PQCChecks from "../smd_Sheet/PQCChecks";
import SheetHeader from "../smd_Sheet/SheetHeader";
import StandardProductionSection from "../smd_Sheet/StandardProductions";
import StandardVehicles from "../smd_Sheet/StandardVehicles";
import TimeChangeModels from "../smd_Sheet/TimeChangeModels";
import type { ChangeModelResponse } from '../../redux/slices/changeModelSlice';
import { FaRegClock } from "react-icons/fa";
import { 
  AiOutlineHistory, 
  AiOutlineCheckCircle, 
  AiOutlineClockCircle, 
} from 'react-icons/ai';
import LoadingSpinner from '../general/LoadingSpinner';
import { 
  clearAllSubTableData,
  addCompletedTable,
  resetCompletedTables,
  setAllSubTableData
} from '../../redux/slices/subTableSlice';
import { 
  getSheetWithFullObject, 
  updateSheetStatusToPQCDone,
  clearError,
  getSheetStatusHistory,
  clearStatusHistory,
  clearSheet
} from '../../redux/slices/changeModelSlice';
import { useNotification } from '../../redux/hooks';
import Notification from '../general/Notification';
import { REQUIRED_FIELDS_CONFIG, hasAllRequiredData, getMissingFields } from '../../utils/requiredFieldsConfig';
import { ConfirmModal } from '../general/ConfirmModal';

const SmdSheetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [openModal ,setOpenModal] = useState(false);
  const location = useLocation();
  const returnPath = (location.state as any)?.returnPath || '/?tab=list';

  const handleGoBack = () => {
    if (returnPath) {
      // Priority 1: Navigate về exact path đã lưu
      navigate(returnPath);
    } else {
      // Priority 2: Fallback navigate(-1)
      navigate(-1);
    }
  };
  
  // Lấy data từ Redux store
  const { currentSheet, loading, error, statusHistory, loadingHistory } = useAppSelector((state) => state.changeModel);
  
  // CHỈ status Pending mới được edit
  const canEdit = (() => {
  if (!currentSheet || !user) return false;
  // Chỉ sheet ở trạng thái Pending mới có thể chỉnh sửa
  if (currentSheet.status?.toLowerCase() !== 'pending') return false;
  // PQC chỉ chỉnh sửa sheet của chính mình
  if (user.role?.toUpperCase() === 'PQC') {
    if (!currentSheet.account) return false;
    return currentSheet.account.id === user.id || 
           currentSheet.account.userName === user.username;
  }
  // Các role khác (ENG, SUPERVISOR, MANAGER, KOREA_MANAGER) có thể chỉnh sửa tất cả
  return true;
})();

  // thông báo
  const { notification, showNotification, hideNotification } = useNotification();

  // Load dữ liệu sheet từ Redux action
  useEffect(() => {
  // Chỉ clear error thôi, KHÔNG clear data cũ vội
  dispatch(clearError());

  const loadSheetData = async () => {
    if (!id) return;
    
    try {
      const result = await dispatch(getSheetWithFullObject(Number(id))).unwrap();

      // Clear và set data MỚI cùng lúc SAU KHI có data
      // UI không bao giờ thấy trạng thái trống
      dispatch(clearAllSubTableData());
      dispatch(resetCompletedTables());
      dispatch(setAllSubTableData({
        checkModel: result.checkModel ?? null,
        standardProduction: result.standardProduction ?? null,
        timeChangeModel: result.timeChangeModel ?? null,
        standardVehicle: result.standardVehicle ?? null,
        pqcCheck: result.pqcCheck ?? null,
        loadedFromSheetId: Number(id),
      }));

      // completedTables giữ nguyên logic
      const tableConfigs = [
        { data: result.checkModel, name: 'CheckModel' as const, config: REQUIRED_FIELDS_CONFIG.CheckModel },
        { data: result.standardProduction, name: 'StandardProduction' as const, config: REQUIRED_FIELDS_CONFIG.StandardProduction },
        { data: result.timeChangeModel, name: 'TimeChangeModel' as const, config: REQUIRED_FIELDS_CONFIG.TimeChangeModel },
        { data: result.standardVehicle, name: 'StandardVehicle' as const, config: REQUIRED_FIELDS_CONFIG.StandardVehicle },
        { data: result.pqcCheck, name: 'PQCCheck' as const, config: REQUIRED_FIELDS_CONFIG.PQCCheck },
      ];

      tableConfigs.forEach(({ data, name, config }) => {
        if (!data) return;
        if (hasAllRequiredData(data, config)) {
          dispatch(addCompletedTable(name));
        } else {
          getMissingFields(data, config);
        }
      });

      // Tải lịch sử ký trạng thái của sheet
      await dispatch(getSheetStatusHistory(Number(id))).unwrap();

    } catch (error: any) {
      // Lỗi mới clear để tránh hiển thị data cũ sai
      dispatch(clearAllSubTableData());
      dispatch(resetCompletedTables());
      console.error('❌ Error loading sheet:', error);
    }
  };

  loadSheetData();

  return () => {
    // Cleanup khi unmount hoặc id thay đổi
    dispatch(clearAllSubTableData());
    dispatch(resetCompletedTables());
    dispatch(clearError());
    dispatch(clearStatusHistory());
    dispatch(clearSheet());
  };
}, [id, dispatch]);

  const handleOpenConfirmModal = () => {
    // CHỈ mở modal, KHÔNG gọi API
    setOpenModal(true);
  };

  // Xử lý lưu thay đổi
  const handleSaveEdit = async () => {
    if (!canEdit) {
      showNotification('warning', 'Không thể chỉnh sửa', 'Sheet này không ở trạng thái Pending, không thể chỉnh sửa.');
      return;
    }
    
    if (!currentSheet?.id) return;
    setOpenModal(false);
    try {
      const res = await dispatch(updateSheetStatusToPQCDone(currentSheet.id)).unwrap();
      
      if(res){
        showNotification('success', 'Hoàn thành!', 'Sheet được ký xác nhận thành công!');
        setTimeout(() => {
          navigate(0);
        }, 1000);
      }else{
        showNotification('error', 'Lỗi', 'Không thể ký');
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

  const roles = [
    { key: "PQC", label: "PQC" },
    { key: "PQCLeader", label: "PQC Leader" },
    { key: "ENG", label: "Engineering" },
    { key: "Supervisior", label: "Supervisor" },
    { key: "Manager", label: "Manager" },
    { key: "KoreaManager", label: "Korea Manager" },
  ];

  const getSignerInfo = (roleKey: string) => {
    const history = Array.isArray(statusHistory) ? statusHistory : [];
    return history.find((item) => {
      const status = item.status?.toLowerCase();
      switch (roleKey) {
        case "PQC":
          return status === "pqcdone";
        case "PQCLeader":
          return status === "pqcleaderldone" || status === "pqcleaderdone";
        case "ENG":
          return status === "engdone";
        case "Supervisior":
          return status === "supervisiordone";
        case "Manager":
          return status === "managerdone";
        case "KoreaManager":
          return status === "koreamanagerdone";
        default:
          return false;
      }
    }) || null;
  };

  const canConfirmAtStep = (sheet: ChangeModelResponse, roleKey: string): boolean => {
    if (!user || user.role !== roleKey) return false;
    const status = sheet.status?.toLowerCase();
    switch (roleKey) {
      case "PQC":
        // PQC chỉ được ký sheet do chính mình tạo (so khớp người tạo).
        return (
          status === "pending" &&
          (sheet.account?.id === user.id ||
            sheet.account?.userName === user.username)
        );
      case "PQCLeader":
        return status === "pqcdone";
      case "ENG":
        return status === "pqcleaderdone";
      case "Supervisior":
        return status === "engdone";
      case "Manager":
        return status === "supervisiordone";
      case "KoreaManager":
        return status === "managerdone";
      default:
        return false;
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // HANDLE: Hủy modal
  const handleCancelModal = () => {
    setOpenModal(false);
  };

  return (
    <div className="max-w-8xl mx-auto p-4 my-4 opacity-100">
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
              title="Xác nhận ký"
              message={"Bạn có chắc chắn đã upload đầy đủ 2 file LCR (Excel) và REFLOW (PDF) chưa?"}
              confirmText="Xác nhận"
              cancelText="Hủy"
              type={"warning"}
              onConfirm={handleSaveEdit}
              onCancel={handleCancelModal}
            />
      {/* Header với thông tin sheet */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Chi tiết Sheet: #{currentSheet?.id} 
            </h1>
            <h6>WorkOrder: {currentSheet?.checkModel?.workOrder !== '' ? currentSheet?.checkModel?.workOrder : 'Chưa Có'}</h6>
            {currentSheet.createAt && (
              <p className="text-xs text-gray-500 mt-1 mb-0">
                Tạo lúc: {new Date(currentSheet.createAt).toLocaleString('vi-VN')}
              </p>
            )}
            {currentSheet.account && (
              <p className="text-xs text-gray-500 mb-0">
                Người tạo: {currentSheet?.account?.fullName} ({currentSheet.account.role})
              </p>
            )}
          </div>
          <div className='text-center py-2 flex items-start'>{getStatusBadge(currentSheet)}</div>
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

      {/* Tiến trình ký xác nhận */}
      <div className="pdf-section no-print mb-4">
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AiOutlineHistory className="w-5 h-5 text-gray-500" />
            Tiến trình ký xác nhận:
          </h3>

          {loadingHistory ? (
            <div className="py-4">
              <LoadingSpinner size="sm" message="Đang tải tiến trình..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {roles.map((role) => {
                const signerInfo = getSignerInfo(role.key);
                const isConfirmed = !!signerInfo;
                const canConfirm = canConfirmAtStep(currentSheet, role.key);

                // Xác định màu sắc premium cho từng trạng thái
                let cardBg = "bg-gray-50/50 border-gray-200 text-gray-400";
                let roleTextColor = "text-gray-600";
                if (isConfirmed) {
                  cardBg = "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm hover:shadow transition-all";
                  roleTextColor = "text-emerald-950 font-semibold";
                } else if (canConfirm) {
                  cardBg = "bg-blue-50/70 border-blue-300 shadow-sm hover:shadow transition-all duration-300";
                  roleTextColor = "text-blue-900 font-bold";
                }

                return (
                  <div
                    key={role.key}
                    className={`p-3 rounded-lg border flex flex-col justify-between h-full transition-all duration-300 ${cardBg} shadow-sm`}
                    style={{ minHeight: '140px' }}
                  >
                    {/* Tiêu đề vai trò (Header) */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 shrink-0">
                      <span className={`text-[10px] font-bold ${roleTextColor} truncate uppercase tracking-wider`}>
                        {role.label}
                      </span>
                      {isConfirmed ? (
                        <AiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AiOutlineClockCircle className={`w-3.5 h-3.5 shrink-0 ${canConfirm ? "text-blue-500" : "text-gray-400"}`} />
                      )}
                    </div>

                    {/* Nội dung chính (Body) */}
                    <div className="flex-1 flex flex-col justify-center py-2 min-w-0">
                      {isConfirmed && signerInfo ? (
                        <div className="space-y-1">
                          {/* Tên người ký */}
                          <div 
                            className="text-xs font-semibold text-gray-800 truncate" 
                            title={signerInfo.account?.fullName || signerInfo.account?.userName}
                          >
                            {signerInfo.account?.fullName || signerInfo.account?.userName || "N/A"}
                          </div>
                          {/* Badge trạng thái "Đã ký" */}
                          <div className="inline-flex items-center gap-1 !bg-emerald-100 !text-emerald-800 text-[9px] !px-2 !py-1 rounded font-bold uppercase tracking-wider whitespace-nowrap">
                            <span>✓</span>
                            <span>Đã ký</span>
                          </div>
                        </div>
                      ) : canConfirm ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1 !bg-blue-100 !text-blue-800 text-[9px] !px-2 !py-1 rounded font-bold uppercase tracking-wider whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                            <span>Chờ ký</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="inline-flex items-center !bg-gray-100 !text-gray-500 text-[9px] !px-2 !py-1 rounded font-medium uppercase tracking-wider whitespace-nowrap">
                            <span>Chưa ký</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ngày tháng hoặc Nút ký (Footer) */}
                    <div className="pt-2 border-t border-gray-200 shrink-0">
                      {isConfirmed && signerInfo ? (
                        <div className="text-[9px] text-gray-500 font-medium flex items-center justify-between gap-1">
                          <span className="opacity-80">Thời gian:</span>
                          <span className="font-semibold text-gray-600">{formatDateTime(signerInfo.changedAt)}</span>
                        </div>
                      ) : canConfirm ? (
                        <div className="relative select-none">
                          {/* Khối nền phát sáng thở nhẹ */}
                          <div className="absolute inset-0 bg-blue-500 rounded filter blur-[1px] animate-pulse opacity-60"></div>
                          <button
                            onClick={handleOpenConfirmModal}
                            className="relative z-10 w-full !py-2 bg-blue-600 text-white rounded text-[10px] 
                                      font-bold hover:bg-blue-700 transition-all duration-300
                                      flex items-center justify-center gap-1 shadow-sm
                                      hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Ký ngay
                          </button>
                        </div>
                      ) : (
                        <div className="text-[9px] text-gray-400 italic text-center">
                          Đang chờ...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị các component */}
      <div className={!canEdit ? 'pointer-events-none' : ''}>
        <SheetHeader canEdit={canEdit} returnPath={returnPath} />
        <CheckModels canEdit={canEdit} />
        <StandardProductionSection canEdit={canEdit} />
        <TimeChangeModels canEdit={canEdit} />
        <StandardVehicles canEdit={canEdit} />
        <PQCChecks canEdit={canEdit} />
          
      </div>

      {/* Buttons */}
      <div className="w-full sticky bottom-0 bg-white border-t-2 border-l-2 border-r-2 border-gray-300 p-4 flex flex-col md:flex-row lg:flex-row items-stretch gap-3 shadow-lg mt-4 z-10">
        <button
          onClick={handleGoBack}
          className="w-full px-4 py-3 bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
        >
          Quay lại
        </button>
        
        {canEdit && (
          <button
            onClick={handleOpenConfirmModal}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            Ký xác nhận
          </button>
        )}
        
        {!canEdit && (
          <div className="w-full px-4 py-3 bg-gray-300 text-gray-600 font-semibold text-center cursor-not-allowed">
            🔒 Không thể chỉnh sửa
          </div>
        )}
      </div>

      {/* CSS để disable tương tác khi read-only */}
      {!canEdit && (
        <style>{`
          /* TẤT CẢ BUTTON - Màu xám theo mặc định */
          .pointer-events-none button {
            cursor: not-allowed !important;
            background-color: #d1d5db !important; /* gray-300 */
            color: #6b7280 !important; /* gray-500 */
            border-color: #9ca3af !important;
            opacity: 1 !important;
            pointer-events: none !important;
          }

          /* BUTTON "XEM CHI TIẾT" FILES - Màu xanh và hoạt động */
          .pointer-events-none button[data-view-detail="true"] {
            cursor: pointer !important;
            background-color: #3b82f6 !important; /* blue-500 */
            color: #ffffff !important;
            border-color: #2563eb !important;
            pointer-events: auto !important;
            opacity: 1 !important;
          }

          .pointer-events-none button[data-view-detail="true"]:hover {
            background-color: #2563eb !important; /* blue-600 */
          }

          /* BUTTON XEM HÌNH ẢNH (icon button) */
          .pointer-events-none button[data-view-image="true"] {
            cursor: pointer !important;
            background-color: transparent !important;
            color: #3b82f6 !important;
            border: none !important;
            pointer-events: auto !important;
            opacity: 1 !important;
          }

          /* Modal buttons */
          [data-close-modal="true"],
          [data-close-modal="true"] * {
            pointer-events: auto !important;
            cursor: pointer !important;
          }

          /* Input/Textarea */
          .pointer-events-none input,
          .pointer-events-none textarea,
          .pointer-events-none select {
            cursor: not-allowed !important;
            background-color: #f9fafb !important;
            opacity: 1;
          }
        `}</style>
      )}
    </div>
  );
};

export default SmdSheetDetail;