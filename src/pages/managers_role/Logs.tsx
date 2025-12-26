// src/pages/admin/Logs.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  AiOutlineEye, 
  AiOutlineCheckCircle, 
  AiOutlineClockCircle, 
  AiOutlineCalendar,
  AiOutlineEdit,
  AiOutlineSearch,
  AiOutlineClose,
  AiOutlineHistory
} from 'react-icons/ai';
import { FaCalendarAlt, FaRegUserCircle } from "react-icons/fa";
import { MdSignalWifiStatusbar2Bar } from "react-icons/md";
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import ReactPaginate from 'react-paginate';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../redux/hooks';
import Notification from '../../components/general/Notification';
import { MdFavoriteBorder } from "react-icons/md";

// Redux actions
import { 
  fetchChangeModel,
  getSheetByFilter,
  updateSheetStatus,
  getSheetStatusHistory,
  clearStatusHistory
} from '../../redux/slices/changeModelSlice';
import type { ChangeModelResponse } from '../../redux/slices/changeModelSlice';

// ==================== CONSTANTS ====================
const ROLES = {
  PQC: 'PQC',
  ENG: 'ENG',
  SUPERVISOR: 'Supervisior',
  MANAGER: 'Manager',
  KOREA_MANAGER: 'KoreaManager'
} as const;

const STATUS = {
  PENDING: 'pending',
  PQC_DONE: 'PQCDone',
  ENG_DONE: 'ENGDone',
  SUPERVISOR_DONE: 'SupervisiorDone',
  MANAGER_DONE: 'ManagerDone',
  KOREA_MANAGER_DONE: 'KoreaManagerDone'
} as const;

// ==================== TYPES ====================
type SheetFilter = {
  workOrder: string;
  fromDate: string;
  toDate: string;
  status: string;
  fcode: string;
  id: number;
};

const Logs = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const { 
    filteredSheets, 
    loadingList,
    statusHistory,
    loadingHistory,
    error: sheetError 
  } = useAppSelector(state => state.changeModel);

  // ==================== STATE ====================
  const [selectedSheet, setSelectedSheet] = useState<ChangeModelResponse | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { notification, showNotification, hideNotification } = useNotification();

  // Filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: '',
    fromDate: '',
    toDate: '',
    fcode: '',
    id: 0,
    status: 'all'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // ==================== LOAD SHEETS ====================
  const loadSheets = async () => {
    try {
      const hasWorkOrder = filter.workOrder.trim() !== '';
      const hasDateRange = filter.fromDate !== '' && filter.toDate !== '';
      const hasStatus = filter.status !== '' && filter.status !== 'all';
      const hasFcode = filter.fcode.trim() !== '';
      const hasId = filter.id && filter.id > 0;

       if (hasWorkOrder || hasDateRange || hasStatus || hasFcode || hasId) {
      const filterParams: any = {
        workOrder: hasWorkOrder ? filter.workOrder.trim() : undefined,
        fromDate: hasDateRange ? filter.fromDate : undefined,
        toDate: hasDateRange ? filter.toDate : undefined,
        status: hasStatus ? filter.status : undefined,
        fcode: hasFcode ? filter.fcode.trim() : undefined,
      };

      // ✅ CHỈ thêm id khi có giá trị
      if (hasId) {
        filterParams.id = filter.id;
      }

      await dispatch(getSheetByFilter(filterParams)).unwrap();
      return;
    }


      await dispatch(fetchChangeModel()).unwrap();
      
    } catch (error: any) {
      console.error('❌ Lỗi khi tải sheets:', error);
      if (error?.message) {
        alert(`Lỗi: ${error.message}`);
      }
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadSheets();
  }, []);

  // ==================== FILTER HANDLERS ====================
  const applyFilter = () => {
    setCurrentPage(0);
    
    if (filter.fromDate && !filter.toDate) {
      showNotification('warning', 'Vui lòng chọn "Đến ngày"');
      return;
    }
    if (!filter.fromDate && filter.toDate) {
      showNotification('warning', 'Vui lòng chọn "Từ ngày"');
      return;
    }

    if (filter.fromDate && filter.toDate) {
      const from = new Date(filter.fromDate);
      const to = new Date(filter.toDate);
      if (from > to) {
        showNotification('warning', '"Từ ngày" không được sau "Đến ngày"');
        resetFilter();
        return;
      }
    }

    loadSheets();
  };

  const resetFilter = async () => {
    setFilter({ 
      workOrder: '', 
      fromDate: '', 
      toDate: '',
      id: 0,
      fcode: '',
      status: 'all'
    });
    
    try {
      await dispatch(fetchChangeModel()).unwrap();
      setCurrentPage(0);
    } catch (error) {
      console.error('❌ Lỗi khi reset filter:', error);
    }
  };

  // ==================== VIEW HANDLERS ====================
  const handleViewDetail = async (sheet: ChangeModelResponse) => {
    setSelectedSheet(sheet);
    setShowDetail(true);
    
    // ✅ Load status history cho sheet này
    try {
      await dispatch(getSheetStatusHistory(sheet.id)).unwrap();
    } catch (error) {
      console.error('❌ Lỗi khi tải history:', error);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedSheet(null);
    dispatch(clearStatusHistory());
    loadSheets();
  };

  // ==================== CONFIRMATION LOGIC ====================
  const canConfirmAtStep = (sheet: ChangeModelResponse, role: string): boolean => {
    if (!user || user.role !== role) return false;
    const status = sheet.status?.toLowerCase();

    switch (role) {
      case ROLES.ENG:
        return status === STATUS.PQC_DONE.toLowerCase();
      case ROLES.SUPERVISOR:
        return status === STATUS.ENG_DONE.toLowerCase();
      case ROLES.MANAGER:
        return status === STATUS.SUPERVISOR_DONE.toLowerCase();
      case ROLES.KOREA_MANAGER:
        return status === STATUS.MANAGER_DONE.toLowerCase();
      default:
        return false;
    }
  };

  const handleConfirmStep = async (
    sheetId: number, 
    role: typeof ROLES.ENG | typeof ROLES.SUPERVISOR | typeof ROLES.MANAGER | typeof ROLES.KOREA_MANAGER
  ) => {
    try {
      if (!user) {
        showNotification('error', 'Người dùng không hợp lệ!');
        return;
      }

      const sheet = filteredSheets?.find((s) => s.id === sheetId);
      if (!sheet) return;

      if (!canConfirmAtStep(sheet, role)) {
        showNotification('error', 'Bạn không có quyền xác nhận bước này!');
        return;
      }

      await dispatch(updateSheetStatus({
        sheetId,
        currentStatus: sheet.status || STATUS.PENDING,
        userRole: role
      })).unwrap();

      const roleNames: Record<string, string> = {
        [ROLES.ENG]: 'Engineering',
        [ROLES.SUPERVISOR]: 'Supervisor',
        [ROLES.MANAGER]: 'Manager',
        [ROLES.KOREA_MANAGER]: 'Korea Manager'
      };

      showNotification('success', `Xác nhận thành công bởi ${roleNames[role]}!`);

      // ✅ Reload history sau khi confirm
      await dispatch(getSheetStatusHistory(sheetId)).unwrap();
      await loadSheets();

      if (selectedSheet && selectedSheet.id === sheetId) {
        const updatedSheet = filteredSheets?.find((s) => s.id === sheetId);
        if (updatedSheet) {
          setSelectedSheet(updatedSheet);
        }
      }

    } catch (error: any) {
      console.error('Error confirming sheet:', error);
      showNotification('error', 'Xác nhận thất bại', error || 'Đã xảy ra lỗi khi xác nhận bước này');
    }
  };

  // ==================== UTILITIES ====================
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;
    if (user.role !== ROLES.ENG && user.role !== ROLES.SUPERVISOR) return false;
    
    const status = sheet.status?.toLowerCase();
    if (user.role === ROLES.ENG && status === STATUS.PQC_DONE.toLowerCase()) return true;
    if (user.role === ROLES.SUPERVISOR && status === STATUS.ENG_DONE.toLowerCase()) return true;
    
    return false;
  };

  const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();
    
    const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
      [STATUS.PENDING.toLowerCase()]: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Pending', icon: '' },
      [STATUS.PQC_DONE.toLowerCase()]: { bg: 'bg-green-100', text: 'text-green-700', label: 'PQC Done', icon: '✓' },
      [STATUS.ENG_DONE.toLowerCase()]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ENG Done', icon: '✓' },
      [STATUS.SUPERVISOR_DONE.toLowerCase()]: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'SUP Done', icon: '✓' },
      [STATUS.MANAGER_DONE.toLowerCase()]: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'MGR Done', icon: '✓' },
      [STATUS.KOREA_MANAGER_DONE.toLowerCase()]: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'KMGR Done', icon: '✓' },
    };

    const config = statusConfig[status || STATUS.PENDING.toLowerCase()] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-700', 
      label: status || 'Unknown',
      icon: '❓'
    };

    return (
      <div className={`inline-flex items-center gap-1 ${config.bg} ${config.text} rounded-full px-3 py-1 text-xs font-semibold`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  // ✅ COMPONENT HIỂN THỊ TIẾN TRÌNH KÝ (dựa trên statusHistory)
  const SignatureProgress: React.FC<{ sheet: ChangeModelResponse }> = ({ sheet }) => {
    const roles = [
      { key: ROLES.ENG, label: 'Engineering', color: 'blue' },
      { key: ROLES.SUPERVISOR, label: 'Supervisor', color: 'purple' },
      { key: ROLES.MANAGER, label: 'Manager', color: 'orange' },
      { key: ROLES.KOREA_MANAGER, label: 'Korea Manager', color: 'red' }
    ];

    const getStepInfo = (role: string) => {
      // Tìm history item có status tương ứng với role
      const historyItem = statusHistory?.find((item) => {
        const status = item.status?.toLowerCase();
        switch (role) {
          case ROLES.ENG:
            return status === STATUS.ENG_DONE.toLowerCase();
          case ROLES.SUPERVISOR:
            return status === STATUS.SUPERVISOR_DONE.toLowerCase();
          case ROLES.MANAGER:
            return status === STATUS.MANAGER_DONE.toLowerCase();
          case ROLES.KOREA_MANAGER:
            return status === STATUS.KOREA_MANAGER_DONE.toLowerCase();
          default:
            return false;
        }
      });

      return historyItem || null;
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {roles.map((role) => {
          const stepInfo = getStepInfo(role.key);
          const isConfirmed = !!stepInfo;
          const canConfirm = canConfirmAtStep(sheet, role.key);
          
          return (
            <div 
              key={role.key} 
              className={`p-3 rounded-lg border-2 ${
                isConfirmed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {isConfirmed ? (
                  <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AiOutlineClockCircle className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-semibold text-xs">{role.label}</span>
              </div>
              
              {isConfirmed && stepInfo ? (
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="text-green-700 font-medium">✓ Đã xác nhận</div>
                  <div className="text-gray-500">
                    Bởi: {stepInfo.account?.fullName || stepInfo.account?.userName}
                  </div>
                  <div className="text-gray-500">
                    {formatDateTime(stepInfo.changedAt)}
                  </div>
                </div>
              ) : canConfirm ? (
                <button
                  onClick={() => handleConfirmStep(sheet.id, role.key)}
                  className={`mt-2 w-full px-3 py-1.5 bg-${role.color}-600 text-white rounded text-xs font-medium hover:bg-${role.color}-700 transition-colors`}
                >
                  Ký xác nhận
                </button>
              ) : (
                <div className="text-xs text-gray-400 mt-2">Chưa xác nhận</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== PAGINATION ====================
  const sortedSheets = [...(filteredSheets || [])].sort((a, b) => {
    const dateA = new Date(a.createAt || 0).getTime();
    const dateB = new Date(b.createAt || 0).getTime();
    return dateB - dateA;
  });

  const pageCount = Math.ceil(sortedSheets.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentSheets = sortedSheets.slice(offset, offset + itemsPerPage);

  const handlePageChange = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
    
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // ==================== DETAIL VIEW ====================
  if (showDetail && selectedSheet) {
    const getSignerInfo = (role: string) => {
    const historyItem = statusHistory?.find((item) => {
      const status = item.status?.toLowerCase();
      switch (role) {
        case ROLES.ENG:
          return status === STATUS.ENG_DONE.toLowerCase();
        case ROLES.SUPERVISOR:
          return status === STATUS.SUPERVISOR_DONE.toLowerCase();
        case ROLES.MANAGER:
          return status === STATUS.MANAGER_DONE.toLowerCase();
        case ROLES.KOREA_MANAGER:
          return status === STATUS.KOREA_MANAGER_DONE.toLowerCase();
        default:
          return false;
      }
    });
    return historyItem || null;
  };

  const roles = [
    { key: ROLES.ENG, label: 'Engineering' },
    { key: ROLES.SUPERVISOR, label: 'Supervisor' },
    { key: ROLES.MANAGER, label: 'Manager' },
    { key: ROLES.KOREA_MANAGER, label: 'Korea Manager' }
  ];
    return (
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex flex-col items-center mb-4 gap-2">
            <div className="text-3xl font-bold text-gray-800">Chi tiết SMD Sheet #{selectedSheet.id}</div>
            
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <FaRegUserCircle className="w-5 h-5" />
                <span className="text-sm text-gray-700">
                  <strong>Người tạo:</strong> {selectedSheet.account?.fullName || selectedSheet.account?.userName} ({selectedSheet.account?.role})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AiOutlineCalendar className="w-5 h-5" />
                <span className="text-sm text-gray-700">
                  <strong>Thời gian:</strong> {formatDateTime(selectedSheet.createAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedSheet)}
              </div>
            </div>

            {/* ✅ Tiến trình ký xác nhận - CẬP NHẬT PHẦN NÀY */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <strong className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                <AiOutlineHistory className="w-5 h-5" />
                Tiến trình ký xác nhận:
              </strong>
              
              {loadingHistory ? (
                <div className="text-center py-6">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Đang tải lịch sử...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {roles.map((role) => {
                    const signerInfo = getSignerInfo(role.key);
                    const isConfirmed = !!signerInfo;
                    const canConfirm = canConfirmAtStep(selectedSheet, role.key);
                    
                    return (
                      <div 
                        key={role.key} 
                        className={`p-3 rounded-lg border-2 ${
                          isConfirmed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isConfirmed ? (
                            <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AiOutlineClockCircle className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="font-semibold text-xs">{role.label}</span>
                        </div>
                        
                        {isConfirmed && signerInfo ? (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="text-green-700 font-medium">✓ Đã xác nhận</div>
                            {/* ✅ HIỂN THỊ TÊN NGƯỜI KÝ */}
                            <div className="text-gray-700">
                              <strong>Người ký:</strong><br/>
                              {signerInfo.account?.fullName || signerInfo.account?.userName || 'N/A'}
                            </div>
                            {/* ✅ HIỂN THỊ THỜI GIAN KÝ */}
                            <div className="text-gray-500">
                              {formatDateTime(signerInfo.changedAt)}
                            </div>
                          </div>
                        ) : canConfirm ? (
                          <button
                            onClick={() => handleConfirmStep(selectedSheet.id, role.key)}
                            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            Ký xác nhận
                          </button>
                        ) : (
                          <div className="text-xs text-gray-400">Chưa xác nhận</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Nút xem toàn bộ sheet */}
          <div className="mt-4">
            <div className="text-center mb-4 flex items-start gap-3 justify-start">
              <button
              onClick={handleCloseDetail}
              className="px-4 py-3 bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              Quay lại
            </button>
              <button
                onClick={() => {
                  const roleLower = user?.role?.toLowerCase();
                  navigate(`/${roleLower}/sheet-detail/${selectedSheet.id}`);
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Xem toàn bộ sheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  // ==================== LIST VIEW ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 text-center!">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Quản lý SMD Logs
            </h1>
            <div className="text-sm text-gray-600">
              Role: <span className="font-semibold">{user?.role}</span>
            </div>
          </div>

          {/* Info banner */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800 text-center mb-0">
              {user?.role === ROLES.ENG && 'Bạn có thể xem, chỉnh sửa và xác nhận ở bước ENG'}
              {user?.role === ROLES.SUPERVISOR && 'Bạn có thể xem, chỉnh sửa và xác nhận ở bước SUPERVISOR'}
              {user?.role === ROLES.MANAGER && 'Bạn có thể xem và xác nhận ở bước MANAGER (KHÔNG sửa)'}
              {user?.role === ROLES.KOREA_MANAGER && 'Bạn có thể xem và xác nhận ở bước KOREA MANAGER (KHÔNG sửa)'}
              {user?.role === 'ADMIN' && 'Bạn có quyền xem tất cả sheets'}
            </p>
          </div>

          {/* SEARCH FILTERS */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AiOutlineSearch className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Tìm kiếm</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Id */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MdFavoriteBorder /><span>Id</span>
                </div>
                <input
                  type="number"
                  value={filter.id}
                  onChange={(e) => setFilter(s => ({ ...s, id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Tìm kiếm theo Id...`}
                />
              </div>
              {/* FCode */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MdFavoriteBorder /><span>FCode</span>
                </div>
                <input
                  type="text"
                  value={filter.fcode}
                  onChange={(e) => setFilter(s => ({ ...s, fcode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Tìm kiếm theo fcode...`}
                />
              </div>
              {/* Work Order */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MdFavoriteBorder /><span>Work Order</span>
                </div>
                <input
                  type="text"
                  value={filter.workOrder}
                  onChange={(e) => setFilter(s => ({ ...s, workOrder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Tìm kiếm theo work order...`}
                />
              </div>

              {/* Status */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MdSignalWifiStatusbar2Bar /><span>Trạng Thái</span>
                </div>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(s => ({ ...s, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value={STATUS.PENDING}>Đang chờ</option>
                  <option value={STATUS.PQC_DONE}>PQC đã hoàn thành</option>
                  <option value={STATUS.ENG_DONE}>Engineering đã hoàn thành</option>
                  <option value={STATUS.SUPERVISOR_DONE}>Supervisor đã hoàn thành</option>
                  <option value={STATUS.MANAGER_DONE}>Manager đã hoàn thành</option>
                  <option value={STATUS.KOREA_MANAGER_DONE}>Korea Manager đã hoàn thành</option>
                </select>
              </div>

              {/* From Date */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaCalendarAlt /><span>Từ ngày</span>
                </div>
                <input
                  type="date"
                  value={filter.fromDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFilter(s => ({ ...s, fromDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* To Date */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaCalendarAlt /><span>Đến ngày</span>
                </div>
                <input
                  type="date"
                  value={filter.toDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFilter(s => ({ ...s, toDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex flex-col lg:flex-row md:flex-row gap-2">
              <button
                onClick={applyFilter}
                disabled={loadingList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <AiOutlineSearch className="w-4 h-4" />
                {loadingList ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
              </button>
              <button
                onClick={resetFilter}
                disabled={loadingList}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <AiOutlineClose className="w-4 h-4" />
                Thay đổi bộ lọc
              </button>
            </div>

            {/* Result Count */}
            <div className="mt-3 text-sm text-gray-600" ref={resultsRef}>
              Số trang: <span className="font-semibold text-blue-600">{currentSheets.length}</span> / <span className="font-semibold">{sortedSheets.length}</span> sheet
              {pageCount > 1 && (
                <span className="ml-2"> (page {currentPage + 1}/{pageCount})</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {sheetError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700 text-sm">❌ {sheetError}</p>
            </div>
          )}

          {/* Results */}
          {loadingList ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tìm kiếm...</p>
            </div>
          ) : currentSheets.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineClockCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {sortedSheets.length === 0 ? '' : 'Tạm thời không có sheet nào phù hợp'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {sortedSheets.length === 0 
                  ? (user?.role === ROLES.PQC ? 'Tạo sheet mới' : 'Chờ PQC tạo sheet')
                  : 'Thay đổi bộ lọc'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Id
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Sheet id
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Người tạo
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        Thời gian tạo
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">
                        Trạng thái
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheets.map((sheet, index) => (
                      <tr key={sheet.id} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 text-center">
                          {offset + index + 1}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          <span className="font-semibold text-blue-600">#{sheet.id}</span>
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-medium">{sheet.account?.fullName || sheet.account?.userName}</span>
                            <span className="text-[10px] sm:text-xs text-gray-500">({sheet.account?.role})</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          {formatDateTime(sheet.createAt)}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                          {getStatusBadge(sheet)}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={() => handleViewDetail(sheet)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                              <AiOutlineEye className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Xem</span>
                            </button>
                            {canEdit(sheet) && (
                              <button
                                onClick={() => {
                                  const roleLower = user?.role?.toLowerCase();
                                  navigate(`/${roleLower}/sheet-detail/${sheet.id}`);
                                }}
                                className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
                              >
                                <AiOutlineEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Chỉnh sửa</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden my-4">
                {currentSheets.map((sheet, index) => (
                  <div key={sheet.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">#{offset + index + 1}</span>
                        <span className="text-lg font-bold text-blue-600">Sheet #{sheet.id}</span>
                      </div>
                      <div>
                        {getStatusBadge(sheet)}
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-200 flex items-center flex-row gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">Được tạo bởi:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {sheet.account?.fullName || sheet.account?.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({sheet.account?.role})
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AiOutlineCalendar className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">Ngày tạo</span>
                      </div>
                      <div className="pl-6 text-sm text-gray-900">
                        {formatDateTime(sheet.createAt)}
                      </div>
                    </div>

                    <div className="flex lg:flex-row md:flex-row flex-col gap-2">
                      <button
                        onClick={() => handleViewDetail(sheet)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <AiOutlineEye className="w-4 h-4" />
                        <span>Xem</span>
                      </button>
                      {canEdit(sheet) && (
                        <button
                          onClick={() => {
                            const roleLower = user?.role?.toLowerCase();
                            navigate(`/${roleLower}/sheet-detail/${sheet.id}`);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <AiOutlineEdit className="w-4 h-4" />
                          <span>Chỉnh sửa</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              {pageCount > 1 && (
                <div className="mt-4 flex justify-center px-3">
                  <div className="w-full max-w-full">
                    <div className="overflow-x-auto scrollbar-hide">
                      <ReactPaginate
                        previousLabel='Trước'
                        nextLabel='Sau'
                        breakLabel={'...'}
                        pageCount={pageCount}
                        marginPagesDisplayed={1}
                        pageRangeDisplayed={2}
                        onPageChange={handlePageChange}
                        forcePage={currentPage}
                        containerClassName={'flex items-center lg:justify-center md:justify-center gap-1 sm:gap-2 px-2 min-w-max sm:px-0'}
                        pageLinkClassName={'px-3 py-2 sm:px-3 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-blue-50 hover:ring-blue-500 transition-all text-xs sm:text-sm font-medium no-underline'}
                        previousLinkClassName={'px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline'}
                        nextLinkClassName={'px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline'}
                        breakLinkClassName={'px-1 sm:px-3 py-1.5 sm:py-2 text-gray-500 text-xs sm:text-sm no-underline'}
                        activeLinkClassName={'!bg-blue-600 !text-white !ring-blue-600 no-underline'}
                        disabledClassName={'opacity-50 cursor-not-allowed'}
                        disabledLinkClassName={'!cursor-not-allowed hover:!bg-transparent no-underline'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;