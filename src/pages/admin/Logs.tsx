// src/pages/admin/Logs.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  AiOutlineEye, 
  AiOutlineCheckCircle, 
  AiOutlineClockCircle, 
  AiOutlineCalendar,
  AiOutlineEdit,
  AiOutlineSearch,
  AiOutlineClose 
} from 'react-icons/ai';
import { FaCalendarAlt, FaRegUserCircle, FaUserAlt } from "react-icons/fa";
import { MdSignalWifiStatusbar2Bar } from "react-icons/md";
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import ReactPaginate from 'react-paginate';

// Redux actions
import { 
  fetchChangeModel,
  getSheetByFilter,
  updateSheetStatus 
} from '../../redux/slices/changeModelSlice';
import type { ChangeModelResponse } from '../../redux/slices/changeModelSlice';
import { useNavigate } from 'react-router-dom';

// ==================== CONSTANTS ====================
const ROLES = {
  PQC: 'PQC',
  ENG: 'ENG',
  SUPERVISOR: 'Supervisior', // ✅ Đúng chính tả trong DB
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
};

const Logs = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { 
    filteredSheets, 
    loadingList, 
    error: sheetError 
  } = useAppSelector(state => state.changeModel);

  // ==================== STATE ====================
  const [selectedSheet, setSelectedSheet] = useState<ChangeModelResponse | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: '',
    fromDate: '',
    toDate: '',
    status: 'all'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // ==================== LOAD SHEETS ====================
  const loadSheets = async () => {
    try {
      const hasWorkOrder = filter.workOrder.trim() !== '';
      const hasDateRange = filter.fromDate !== '' && filter.toDate !== '';
      const hasStatus = filter.status !== '' && filter.status !== 'all';

      if (hasWorkOrder || hasDateRange || hasStatus) {
        
        await dispatch(getSheetByFilter({
          workOrder: hasWorkOrder ? filter.workOrder.trim() : undefined,
          fromDate: hasDateRange ? filter.fromDate : undefined,
          toDate: hasDateRange ? filter.toDate : undefined,
          status: hasStatus ? filter.status : undefined,
        })).unwrap();
        
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
      alert('Vui lòng chọn "Đến ngày"');
      return;
    }
    if (!filter.fromDate && filter.toDate) {
      alert('Vui lòng chọn "Từ ngày"');
      return;
    }

    if (filter.fromDate && filter.toDate) {
      const from = new Date(filter.fromDate);
      const to = new Date(filter.toDate);
      if (from > to) {
        alert('"Từ ngày" không thể lớn hơn "Đến ngày"');
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
      status: 'all'
    });
    
    try {
      await dispatch(fetchChangeModel()).unwrap();
      setCurrentPage(0);
    } catch (error) {
      console.error('❌ Lỗi khi reset filter:', error);
    }
  };

  const clearFilters = () => {
    resetFilter();
  };

  // ==================== CONFIRMATION LOGIC ====================
  
  // ✅ Kiểm tra role có thể xác nhận ở bước nào (CHUẨN)
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

  // ✅ Xác nhận theo bước (CHUẨN - Sử dụng updateSheetStatusByRole)
  const handleConfirmStep = async (
    sheetId: number, 
    role: typeof ROLES.ENG | typeof ROLES.SUPERVISOR | typeof ROLES.MANAGER | typeof ROLES.KOREA_MANAGER
  ) => {
    try {
      if (!user) {
        alert("❌ Bạn chưa đăng nhập!");
        return;
      }

      const sheet = filteredSheets?.find((s) => s.id === sheetId);
      if (!sheet) return;

      if (!canConfirmAtStep(sheet, role)) {
        alert("❌ Bạn không thể xác nhận ở bước này!");
        return;
      }

      // ✅ GỌI API TỰ ĐỘNG XÁC ĐỊNH STATUS
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

      // Check if completed
      const newStatus = sheet.status?.toLowerCase();
      if (newStatus === STATUS.KOREA_MANAGER_DONE.toLowerCase()) {
        alert(`🎉 Sheet đã được xác nhận hoàn tất bởi tất cả các cấp!`);
      } else {
        alert(`✅ Xác nhận thành công bởi ${roleNames[role]}!`);
      }

      await loadSheets();

      if (selectedSheet && selectedSheet.id === sheetId) {
        const updatedSheet = filteredSheets?.find((s) => s.id === sheetId);
        if (updatedSheet) {
          setSelectedSheet(updatedSheet);
        }
      }

    } catch (error: any) {
      console.error('Error confirming sheet:', error);
      alert(error || 'Có lỗi xảy ra khi xác nhận. Vui lòng thử lại.');
    }
  };

  // ==================== VIEW HANDLERS ====================
  const handleViewDetail = (sheet: ChangeModelResponse): void => {
    setSelectedSheet(sheet);
    setShowDetail(true);
  };

  const handleCloseDetail = (): void => {
    setShowDetail(false);
    setSelectedSheet(null);
    loadSheets();
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

  // ✅ CẬP NHẬT canEdit (CHUẨN)
  const canEdit = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;
    
    // Chỉ ENG và Supervisior mới được edit
    if (user.role !== ROLES.ENG && user.role !== ROLES.SUPERVISOR) return false;
    
    const status = sheet.status?.toLowerCase();
    
    // ENG edit khi PQCDone
    if (user.role === ROLES.ENG && status === STATUS.PQC_DONE.toLowerCase()) return true;
    
    // Supervisior edit khi ENGDone
    if (user.role === ROLES.SUPERVISOR && status === STATUS.ENG_DONE.toLowerCase()) return true;
    
    return false;
  };

  // ✅ Get status badge (CHUẨN)
  const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();
    
    const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
      [STATUS.PENDING.toLowerCase()]: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending', icon: '⏳' },
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

  // ✅ COMPONENT HIỂN THỊ TRẠNG THÁI XÁC NHẬN (CHUẨN)
  const ConfirmationStatus: React.FC<{ sheet: ChangeModelResponse }> = ({ sheet }) => {
    const status = sheet.status?.toLowerCase();
    
    const steps = [
      { key: ROLES.ENG, label: 'ENG', color: 'blue' },
      { key: ROLES.SUPERVISOR, label: 'SUP', color: 'purple' },
      { key: ROLES.MANAGER, label: 'MGR', color: 'orange' },
      { key: ROLES.KOREA_MANAGER, label: 'KMGR', color: 'red' }
    ];

    const getStepStatus = (stepKey: string) => {
      const statusOrder = [
        STATUS.PENDING.toLowerCase(),
        STATUS.PQC_DONE.toLowerCase(),
        STATUS.ENG_DONE.toLowerCase(),
        STATUS.SUPERVISOR_DONE.toLowerCase(),
        STATUS.MANAGER_DONE.toLowerCase(),
        STATUS.KOREA_MANAGER_DONE.toLowerCase()
      ];
      
      const currentIndex = statusOrder.indexOf(status || STATUS.PENDING.toLowerCase());
      
      switch (stepKey) {
        case ROLES.ENG:
          return currentIndex >= 2;
        case ROLES.SUPERVISOR:
          return currentIndex >= 3;
        case ROLES.MANAGER:
          return currentIndex >= 4;
        case ROLES.KOREA_MANAGER:
          return currentIndex >= 5;
        default:
          return false;
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {steps.map((step) => {
          const isConfirmed = getStepStatus(step.key);
          const canConfirm = canConfirmAtStep(sheet, step.key);
          
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`w-12 text-xs font-semibold ${isConfirmed ? `text-${step.color}-700` : 'text-gray-400'}`}>
                {step.label}
              </div>
              
              {isConfirmed ? (
                <div className="flex items-center gap-1">
                  <AiOutlineCheckCircle className={`w-4 h-4 text-${step.color}-600`} />
                  <span className="text-xs text-gray-600">Done</span>
                </div>
              ) : canConfirm ? (
                <input
                  type="checkbox"
                  onChange={() => handleConfirmStep(sheet.id, step.key)}
                  className={`w-4 h-4 cursor-pointer accent-${step.color}-600`}
                  title={`Xác nhận bởi ${step.label}`}
                />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 rounded bg-gray-100" />
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
  console.log(currentSheets);

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
    const status = selectedSheet.status?.toLowerCase();
    const roles = [ROLES.ENG, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.KOREA_MANAGER];
    
    const getStepConfirmed = (role: string) => {
      const statusOrder = [
        STATUS.PENDING.toLowerCase(),
        STATUS.PQC_DONE.toLowerCase(),
        STATUS.ENG_DONE.toLowerCase(),
        STATUS.SUPERVISOR_DONE.toLowerCase(),
        STATUS.MANAGER_DONE.toLowerCase(),
        STATUS.KOREA_MANAGER_DONE.toLowerCase()
      ];
      const currentIndex = statusOrder.indexOf(status || STATUS.PENDING.toLowerCase());
      
      switch (role) {
        case ROLES.ENG:
          return currentIndex >= 2;
        case ROLES.SUPERVISOR:
          return currentIndex >= 3;
        case ROLES.MANAGER:
          return currentIndex >= 4;
        case ROLES.KOREA_MANAGER:
          return currentIndex >= 5;
        default:
          return false;
      }
    };
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-8xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col items-center mb-4 gap-2">
              <div className="text-3xl font-bold text-gray-800">Chi tiết SMD Sheet</div>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Quay lại
              </button>
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

              {/* Tiến trình xác nhận */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <strong className="text-sm text-gray-700 mb-2 block">Tiến trình xác nhận:</strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {roles.map((role) => {
                    const isConfirmed = getStepConfirmed(role);
                    const labels: Record<string, string> = { 
                      [ROLES.ENG]: 'Engineering', 
                      [ROLES.SUPERVISOR]: 'Supervisor', 
                      [ROLES.MANAGER]: 'Manager', 
                      [ROLES.KOREA_MANAGER]: 'Manager Korea' 
                    };
                    
                    return (
                      <div key={role} className={`p-3 rounded-lg border-2 ${isConfirmed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {isConfirmed ? (
                            <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AiOutlineClockCircle className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="font-semibold text-xs">{labels[role]}</span>
                        </div>
                        {isConfirmed ? (
                          <div className="text-xs text-gray-600">
                            <div className="text-green-700 font-medium">✓ Đã xác nhận</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Chưa xác nhận</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Nút xác nhận */}
            {/* <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {user?.role === ROLES.ENG && canConfirmAtStep(selectedSheet, ROLES.ENG) && (
                <button
                  onClick={() => handleConfirmStep(selectedSheet.id, ROLES.ENG)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận ENG
                </button>
              )}
              {user?.role === ROLES.SUPERVISOR && canConfirmAtStep(selectedSheet, ROLES.SUPERVISOR) && (
                <button
                  onClick={() => handleConfirmStep(selectedSheet.id, ROLES.SUPERVISOR)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận SUP
                </button>
              )}
              {user?.role === ROLES.MANAGER && canConfirmAtStep(selectedSheet, ROLES.MANAGER) && (
                <button
                  onClick={() => handleConfirmStep(selectedSheet.id, ROLES.MANAGER)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận MGR
                </button>
              )}
              {user?.role === ROLES.KOREA_MANAGER && canConfirmAtStep(selectedSheet, ROLES.KOREA_MANAGER) && (
                <button
                  onClick={() => handleConfirmStep(selectedSheet.id, ROLES.KOREA_MANAGER)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận KMGR
                </button>
              )}
            </div> */}

            {/* ✅ Link đến trang detail theo role */}
            <div className="mt-4">
              <div className="text-center mb-4">
                <button
                  onClick={() => {
                    const roleLower = user?.role?.toLowerCase();
                    navigate(`/${roleLower}/sheet-detail/${selectedSheet.id}`);
                  }}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Xem chi tiết đầy đủ
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
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Quản lý SMD Sheet Logs
            </h1>
            <div className="text-sm text-gray-600">
              Role: <span className="font-semibold">{user?.role}</span>
            </div>
          </div>

          {/* Phân quyền thông báo */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800 text-center mb-0">
              {user?.role === ROLES.PQC && '📝 Bạn có thể xem logs mà bạn đã tạo'}
              {user?.role === ROLES.ENG && '✏️ Bạn có thể xem, chỉnh sửa và xác nhận ở bước ENG'}
              {user?.role === ROLES.SUPERVISOR && '✏️ Bạn có thể xem, chỉnh sửa và xác nhận ở bước SUPERVISOR'}
              {user?.role === ROLES.MANAGER && '👁️ Bạn có thể xem và xác nhận ở bước MANAGER (KHÔNG sửa)'}
              {user?.role === ROLES.KOREA_MANAGER && '👁️ Bạn có thể xem và xác nhận ở bước KOREA MANAGER (KHÔNG sửa)'}
              {user?.role === 'ADMIN' && '🔧 Bạn có quyền xem tất cả sheets'}
            </p>
          </div>

          {/* SEARCH FILTERS */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AiOutlineSearch className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Tìm kiếm & Lọc</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Work Order */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaUserAlt /><span>Work Order</span>
                </div>
                <input
                  type="text"
                  value={filter.workOrder}
                  onChange={(e) => setFilter(s => ({ ...s, workOrder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập Work Order..."
                />
              </div>

              {/* Status */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MdSignalWifiStatusbar2Bar /><span>Trạng thái</span>
                </div>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(s => ({ ...s, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value={STATUS.PENDING}>Pending</option>
                  <option value={STATUS.PQC_DONE}>PQC Done</option>
                  <option value={STATUS.ENG_DONE}>ENG Done</option>
                  <option value={STATUS.SUPERVISOR_DONE}>Supervisor Done</option>
                  <option value={STATUS.MANAGER_DONE}>Manager Done</option>
                  <option value={STATUS.KOREA_MANAGER_DONE}>Korea Manager Done</option>
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
                {loadingList ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <button
                onClick={clearFilters}
                disabled={loadingList}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <AiOutlineClose className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            </div>

            {/* Result Count */}
            <div className="mt-3 text-sm text-gray-600" ref={resultsRef}>
              Hiển thị <span className="font-semibold text-blue-600">{currentSheets.length}</span> / <span className="font-semibold">{sortedSheets.length}</span> sheets
              {pageCount > 1 && (
                <span className="ml-2">(Trang {currentPage + 1}/{pageCount})</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {sheetError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700 text-sm">❌ {sheetError}</p>
            </div>
          )}

          {/* Results - Table for Desktop/Tablet, Cards for Mobile */}
          {loadingList ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : currentSheets.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineClockCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {sortedSheets.length === 0 ? 'Chưa có sheet nào' : 'Không tìm thấy kết quả'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {sortedSheets.length === 0 
                  ? (user?.role === ROLES.PQC ? 'Hãy tạo và gửi SMD Sheet từ trang chính' : 'Chờ PQC tạo sheet mới')
                  : 'Thử thay đổi bộ lọc tìm kiếm'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">STT</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Sheet ID</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Người tạo</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Thời gian</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Xác nhận</th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Hành động</th>
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
                        <td className="border border-gray-300 px-2 sm:px-4 py-3">
                          <ConfirmationStatus sheet={sheet} />
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
                                  window.open(`/${roleLower}/sheet-detail/${sheet.id}`, '_blank');
                                }}
                                className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
                              >
                                <AiOutlineEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Sửa</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Cards */}
              <div className="md:hidden my-4">
                {currentSheets.map((sheet, index) => (
                  <div key={sheet.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">#{offset + index + 1}</span>
                        <span className="text-lg font-bold text-blue-600">Sheet #{sheet.id}</span>
                      </div>
                      <div>
                        {getStatusBadge(sheet)}
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="mb-3 pb-3 border-b border-gray-200 flex items-center flex-row gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">Người tạo:</span>
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

                    {/* Time */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AiOutlineCalendar className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">Thời gian</span>
                      </div>
                      <div className="pl-6 text-sm text-gray-900">
                        {formatDateTime(sheet.createAt)}
                      </div>
                    </div>

                    {/* Confirmation Status */}
                    <div className="mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AiOutlineCheckCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">Tiến trình xác nhận</span>
                      </div>
                      <div className="">
                        <ConfirmationStatus sheet={sheet} />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-row md:flex-row flex-col gap-2">
                      <button
                        onClick={() => handleViewDetail(sheet)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <AiOutlineEye className="w-4 h-4" />
                        <span>Xem chi tiết</span>
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

              {/* PAGINATION COMPONENT */}
              {pageCount > 1 && (
                <div className="mt-4 flex justify-center px-3">
                  <div className="w-full max-w-full">
                    <div className="overflow-x-auto scrollbar-hide">
                      <ReactPaginate
                        previousLabel={'Trước'}
                        nextLabel={'Sau'}
                        breakLabel={'...'}
                        pageCount={pageCount}
                        marginPagesDisplayed={1}
                        pageRangeDisplayed={2}
                        onPageChange={handlePageChange}
                        forcePage={currentPage}
                        containerClassName={'flex items-center lg:justify-center md:justify-center gap-1 sm:gap-2 px-2 min-w-max sm:px-0'}
                        pageClassName={''}
                        pageLinkClassName={
                          'px-3 py-2 sm:px-3 sm:py-2 rounded-lg block ' +
                          'ring-1 ring-inset ring-gray-300 ' +
                          'hover:bg-blue-50 hover:ring-blue-500 transition-all ' +
                          'text-xs sm:text-sm font-medium no-underline'
                        }
                        previousClassName={''}
                        previousLinkClassName={
                          'px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ' +
                          'ring-1 ring-inset ring-gray-300 ' +
                          'hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline'
                        }
                        nextClassName={''}
                        nextLinkClassName={
                          'px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ' +
                          'ring-1 ring-inset ring-gray-300 ' +
                          'hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline'
                        }
                        breakClassName={''}
                        breakLinkClassName={'px-1 sm:px-3 py-1.5 sm:py-2 text-gray-500 text-xs sm:text-sm no-underline'}
                        activeClassName={''}
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