/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import SmdSheetUser from "../components/SmdSheetUser";
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { MdFavoriteBorder } from "react-icons/md";
import { BsCalendarDate } from "react-icons/bs";
import { FaRegClock, FaRegUserCircle } from "react-icons/fa";
import { Link } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { getSheetWithFullObject, getSheetByFilter } from '../redux/slices/changeModelSlice';
// redux
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { createChangeModel, clearSheet, clearError, setCurrentSheet } from '../redux/slices/changeModelSlice';
import { addCompletedTable, clearAllSubTableData, resetCompletedTables, setCheckModel, setPQCCheck, setStandardProduction, setStandardVehicle, setTimeChangeModel } from '../redux/slices/subTableSlice';
import { fetchChangeModel, deleteSheetById } from '../redux/slices/changeModelSlice';
import type { ChangeModelResponse } from '../redux/slices/changeModelSlice';
import { useNotification } from '../redux/hooks';
import Notification from '../components/general/Notification';
import { hasAllRequiredData, REQUIRED_FIELDS_CONFIG } from '../utils/requiredFieldsConfig';
import { ConfirmModal } from '../components/general/ConfirmModal';
import { 
  saveHomeFilterState, 
  getHomeFilterState,
  saveSelectedSheetId,
  getSelectedSheetId,
  clearSelectedSheetId
} from '../utils/navigationState';

type SheetFilter = {
  workOrder: string;
  fromDate: string;
  toDate: string;
  fcode: string;
  status: string;
  id:number;
  createrName: string;
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'create' | 'list') || 'list';
  const sheetIdFromUrl = searchParams.get("sheetId");
  const [activeTab, setActiveTab] = useState<'create' | 'list'>(initialTab);
  const [showSheets, setShowSheets] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [deletingSheetId, setDeletingSheetId] = useState<number | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);

  const [confirmCreateModal, setConfirmCreateModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    open: boolean;
    sheet: ChangeModelResponse | null;
  }>({
    open: false,
    sheet: null
  });

  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const location = useLocation();
  const { 
    currentSheet, 
    loading: creatingSheet, 
    error: sheetError, 
    filteredSheets,
    loadingList
  } = useAppSelector(state => state.changeModel);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const { showNotification, hideNotification, notification } = useNotification();

  // Filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: '',
    fromDate: '',
    fcode: '',
    toDate: '',
    id: 0,
    status: 'all',
    createrName: ''
  });

  useEffect(() => {
    if(!loading && !isAuthenticated){
      navigate('/login');
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    const params: Record<string, string> = { tab: activeTab };
    
    if (activeTab === 'create' && currentSheet?.id) {
      params.sheetId = currentSheet.id.toString();
    }
    
    setSearchParams(params, { replace: true });
  }, [activeTab, currentSheet?.id, setSearchParams]);

  // RESTORE SHEET KHI RELOAD
  useEffect(() => {
    const restoreSheet = async () => {
      if (sheetIdFromUrl) {
        setActiveTab('create');
        setLoadingSheets(true);
        dispatch(resetCompletedTables());
        
        try {
          const result = await dispatch(getSheetWithFullObject(Number(sheetIdFromUrl))).unwrap();
          dispatch(setCurrentSheet(result));
          
          if (result.checkModel) {
            dispatch(setCheckModel(result.checkModel));
            if (hasAllRequiredData(result.checkModel, REQUIRED_FIELDS_CONFIG.CheckModel)) {
              dispatch(addCompletedTable('CheckModel'));
            }
          }
          
          if (result.standardProduction) {
            dispatch(setStandardProduction(result.standardProduction));
            if (hasAllRequiredData(result.standardProduction, REQUIRED_FIELDS_CONFIG.StandardProduction)) {
              dispatch(addCompletedTable('StandardProduction'));
            }
          }
          
          if (result.timeChangeModel) {
            dispatch(setTimeChangeModel(result.timeChangeModel));
            if (hasAllRequiredData(result.timeChangeModel, REQUIRED_FIELDS_CONFIG.TimeChangeModel)) {
              dispatch(addCompletedTable('TimeChangeModel'));
            }
          }
          
          if (result.standardVehicle) {
            dispatch(setStandardVehicle(result.standardVehicle));
            if (hasAllRequiredData(result.standardVehicle, REQUIRED_FIELDS_CONFIG.StandardVehicle)) {
              dispatch(addCompletedTable('StandardVehicle'));
            }
          }
          
          if (result.pqcCheck) {
            dispatch(setPQCCheck(result.pqcCheck));
            if (hasAllRequiredData(result.pqcCheck, REQUIRED_FIELDS_CONFIG.PQCCheck)) {
              dispatch(addCompletedTable('PQCCheck'));
            }
          }
          
          setShowSheets(true);
          
        } catch (error: any) {
          console.error('❌ Failed to restore sheet:', error);
          showNotification('error', 'Lỗi', 'Không thể tải lại sheet. Vui lòng tạo mới.');
          setActiveTab('list');
        } finally {
          setLoadingSheets(false);
        }
      }
    };

    restoreSheet();
  }, [location.search, sheetIdFromUrl, dispatch]);

  // Notification logic
  const [showLoginNoti, setShowLoginNoti] = useState(() => {
    try {
      return sessionStorage.getItem("justLoggedIn") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showLoginNoti) return;
    try { sessionStorage.removeItem("justLoggedIn"); } catch {}
    const timer = setTimeout(() => setShowLoginNoti(false), 2000);
    return () => clearTimeout(timer);
  }, [showLoginNoti]);

  // Notification khi có lỗi
  const [showErrorNoti, setShowErrorNoti] = useState(false);

  useEffect(() => {
    if (sheetError) {
      setShowErrorNoti(true);
      const timer = setTimeout(() => {
        setShowErrorNoti(false);
        dispatch(clearError());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [sheetError, dispatch]);

  const formatDateTimeForAPI = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  
  const date = new Date(datetimeLocal);
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${month}-${day}-${year} ${hours}:${minutes}`;
};

/**
 * Get max datetime for datetime-local input (current datetime)
 */
const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

  // PATTERN TỪ LOGS: Load sheets với filter được truyền vào
  const loadSheetsWithFilter = async (filterToUse: SheetFilter) => {
    try {
      const hasWorkOrder = filterToUse.workOrder.trim() !== '';
      const hasDateRange = filterToUse.fromDate !== '' && filterToUse.toDate !== '';
      const hasStatus = filterToUse.status !== '' && filterToUse.status !== 'all';
      const hasFcode = filterToUse.fcode.trim() !== '';
      const hasId = filterToUse.id && filterToUse.id > 0;
      const hasCreaterName = filterToUse.createrName.trim() !== ''; 

      if (hasWorkOrder || hasDateRange || hasStatus || hasFcode || hasId || hasCreaterName) {
        const filterParams: any = {
          workOrder: hasWorkOrder ? filterToUse.workOrder.trim() : undefined,
          fromDate: hasDateRange ? formatDateTimeForAPI(filterToUse.fromDate) : undefined, 
          toDate: hasDateRange ? formatDateTimeForAPI(filterToUse.toDate) : undefined,      
          status: hasStatus ? filterToUse.status : undefined,
          fcode: hasFcode ? filterToUse.fcode.trim() : undefined,
          createrName: hasCreaterName ? filterToUse.createrName.trim() : undefined,
        };

        if (hasId) {
          filterParams.id = filterToUse.id;
        }

        await dispatch(getSheetByFilter(filterParams)).unwrap();
        return;
      }

      if (user?.role === 'PQC') {
        await dispatch(fetchChangeModel()).unwrap();
        return;
      }
      
    } catch (error: any) {
      console.error('❌ Lỗi khi tải sheets:', error);
      if (error?.message) {
        showNotification('error', `Lỗi khi tải sheets: ${error.message}`);
      }
    }
  };

  // EFFECT 1 - Load initial data hoặc restore saved state
  useEffect(() => {
    if (sheetIdFromUrl && initialTab === 'create') {
    // Nếu có sheetId trong URL và tab=create, không restore savedState
    return;
    }
    const savedState = getHomeFilterState();
    const savedSheetId = getSelectedSheetId();
    
    // Restore highlight nếu có
    if (savedSheetId) {
      setSelectedSheetId(savedSheetId);
    }
    
    if (savedState.filter) {
      // Restore from saved state
      setFilter(savedState.filter);
      setCurrentPage(savedState.currentPage);
      setActiveTab(savedState.activeTab as 'create' | 'list');
      
      // Load sheets sau khi setFilter
      if (savedState.activeTab === 'list') {
        setTimeout(() => {
          loadSheetsWithFilter(savedState.filter);
          
          // Scroll to highlighted row
          if (savedSheetId) {
            setTimeout(() => {
              const row = document.getElementById(`sheet-row-${savedSheetId}`);
              if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 500);
          }
        }, 100);
      }
    } else {
      // Load all sheets nếu không có saved state
      if (activeTab === 'list') {
        loadSheets();
      }
    }

    // Clear highlight sau 2 giây
    if (savedSheetId) {
      const timer = setTimeout(() => {
        setSelectedSheetId(null);
        clearSelectedSheetId();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []); // CHỈ CHẠY 1 LẦN KHI MOUNT

  // EFFECT 2 - Auto save filter state
  useEffect(() => {
    if (filteredSheets && filteredSheets.length > 0 && activeTab === 'list') {
      saveHomeFilterState(filter, currentPage, activeTab);
    }
  }, [filter, currentPage, activeTab, filteredSheets]);

  // Load sheets khi chuyển sang tab list
  useEffect(() => {
  if (activeTab === 'list') {
    const savedState = getHomeFilterState();
    
    // Luôn load lại sheets với filter hiện tại hoặc savedState
    if (savedState.filter) {
      // Restore filter và load
      setFilter(savedState.filter);
      setTimeout(() => {
        loadSheetsWithFilter(savedState.filter);
      }, 0);
    } else {
      // Load tất cả sheets
      loadSheets();
    }
  }
}, [activeTab]);

  // Load sheets
  const loadSheets = async () => {
    await loadSheetsWithFilter(filter);
  };

  // Apply filter
  const applyFilter = () => {
    setCurrentPage(0);
    
    if (filter.fromDate && !filter.toDate) {
      showNotification('error', 'Vui lòng chọn "Đến ngày"');
      return;
    }
    if (!filter.fromDate && filter.toDate) {
      showNotification('error', 'Vui lòng chọn "Từ ngày"');
      return;
    }

    if (filter.fromDate && filter.toDate) {
      const from = new Date(filter.fromDate);
      const to = new Date(filter.toDate);
      if (from > to) {
        showNotification('error', '"Từ ngày" không được sau "Đến ngày"');
        resetFilter();
        return;
      }
    }

    loadSheets();
  };

  // Reset filter
  const resetFilter = async () => {
    setFilter({ 
      workOrder: '', 
      fromDate: '', 
      fcode: '',
      id: 0,
      toDate: '',
      status: 'all',
      createrName: ''
    });
    
    try {
      await dispatch(fetchChangeModel()).unwrap();
      setCurrentPage(0);
    } catch (error) {
      console.error('❌ Lỗi khi reset filter:', error);
    }
  };

  // Format datetime
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

  // Get status badge
  const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();
    const isDone = status && status !== 'pending';
    
    const statusLabels: Record<string, string> = {
      'pending': 'Pending',
      'pqcdone': 'PQC Done',
      'engdone': 'Engineer Done',
      'supervisiordone': 'Supervisor Done',
      'managerdone': 'Manager Done',
      'koreamanagerdone': 'Korea Manager Done',
    };

    const label = statusLabels[status || 'pending'] || (sheet.status || 'Unknown');
    const bgColor = isDone ? 'bg-green-50' : 'bg-yellow-100';
    const textColor = isDone ? 'text-green-700' : 'text-yellow-700';
    const iconColor = isDone ? '#16a34a' : '#FFCC33';

    return (
      <div className={`flex items-center gap-1 ${bgColor} ${textColor} rounded-full px-2 py-1 text-xs font-medium`}>
        <FaRegClock color={iconColor} /> 
        <span>{label}</span>
      </div>
    );
  };

  const canViewDetail = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;
    return true;
  };

  const canDeleteSheet = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;

    const status = sheet.status?.toLowerCase();
    const userRole = user.role?.toUpperCase();

    if (status !== 'pending') {
      return false;
    }

    if (userRole === 'PQC') {
      if (!sheet.account) return false;
      return sheet.account.id === user.id || sheet.account.userName === user.username;
    }
    
    return false;
  };

  // PATTERN TỪ LOGS: HANDLE VIEW DETAIL - Save state trước khi navigate
  const handleViewDetail = (sheet: ChangeModelResponse) => {
    if (!canViewDetail(sheet)) {
      showNotification(
        'error', 
        'Không có quyền truy cập', 
        'Bạn không có quyền xem chi tiết sheet do người khác tạo ra'
      );
      return;
    }

    // Save state trước khi navigate (giống Logs)
    saveHomeFilterState(filter, currentPage, activeTab);
    saveSelectedSheetId(sheet.id);
    
    const currentPath = '/?tab=list'; // Path để quay về Home
    
    navigate(`/pqc-sheet-detail/${sheet.id}`, {
      state: {
        from: 'home',
        returnPath: currentPath
      }
    });
  };

  const handleDeleteSheet = (sheet: ChangeModelResponse) => {
    setConfirmDeleteModal({
      open: true,
      sheet: sheet
    });
  };

  const handleConfirmDelete = async () => {
    const sheet = confirmDeleteModal.sheet;
    if (!sheet) return;

    try {
      setConfirmDeleteModal({ open: false, sheet: null });
      setDeletingSheetId(sheet.id);
      
      const result = await dispatch(deleteSheetById(sheet.id)).unwrap();
      
      if (result) {
        showNotification('success', 'Xóa sheet thành công', `Sheet #${sheet.id} đã được xóa`);
        
        const totalPages = Math.ceil((sortedSheets.length - 1) / itemsPerPage);
        if (currentPage >= totalPages && currentPage > 0) {
          setCurrentPage(currentPage - 1);
        }
        
        await loadSheets();
      }
    } catch (error: any) {
      showNotification('error', 'Lỗi khi xóa sheet', error.message || 'Vui lòng thử lại');
    } finally {
      setDeletingSheetId(null);
    }
  };

  const handleCreateNewSheet = async () => {
    if (user?.role?.toUpperCase() !== 'PQC') {
      showNotification('error', 'Chỉ PQC mới có thể tạo sheet mới');
      return;
    }

    setConfirmCreateModal(true);
  };

  const handleConfirmCreateSheet = async () => {
    try {
      setConfirmCreateModal(false);
      sessionStorage.removeItem('homeFilterState');
      dispatch(clearSheet());
      dispatch(clearAllSubTableData());
      setActiveTab('create');
      setLoadingSheets(true);
      setShowSheets(false);
      
      const result = await dispatch(createChangeModel()).unwrap();
      
      setCurrentSheet(result);
      
      await new Promise(res => setTimeout(res, 500));
      setShowSheets(true);
      
      showNotification('success', 'Tạo sheet mới thành công!');
      
    } catch (error) {
      console.error('❌ Lỗi khi tạo sheet:', error);
      showNotification('error', 'Không thể tạo sheet mới. Vui lòng thử lại.');
    } finally {
      setLoadingSheets(false);
    }
  };

  // Sort sheets
  const sortedSheets = [...(filteredSheets || [])].sort((a, b) => {
    const dateA = new Date(a.createAt || 0).getTime();
    const dateB = new Date(b.createAt || 0).getTime();
    return dateB - dateA;
  });

  // Pagination
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

  return (
    <div className="max-w-8xl mx-auto p-4">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* Login notification */}
      {user && isAuthenticated && showLoginNoti && (
        <div className="fixed top-4 left-1/2 px-3 -translate-x-1/2 z-50 w-full max-w-[900px] animate-slide-down">
          <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800 text-lg">Đăng nhập thành công!</p>
            <p className="text-green-700 text-sm mt-1">
              User: <strong>{user?.username}</strong> - Role: <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {showErrorNoti && sheetError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[500px] animate-slide-down">
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded shadow-lg">
            <p className="font-bold text-red-800 text-lg">❌ Lỗi</p>
            <p className="text-red-700 text-sm mt-1">{sheetError}</p>
          </div>
        </div>
      )}

      {!user || !isAuthenticated ? (
        <Link to="/login"></Link>
      ) : null}

      {/* Main content */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 mx-0">
          <button
            onClick={handleCreateNewSheet}
            disabled={creatingSheet || user?.role?.toUpperCase() !== 'PQC'}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'create' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            } ${creatingSheet || user?.role?.toUpperCase() !== 'PQC' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {creatingSheet ? 'Đang tạo...' : 'Tạo Sheet Mới'}
          </button>
          
          <ConfirmModal
            open={confirmCreateModal}
            title="Xác nhận tạo Sheet mới"
            message="Bạn có chắc chắn muốn tạo Sheet mới không?"
            confirmText="Tạo mới"
            cancelText="Hủy"
            type="info"
            onConfirm={handleConfirmCreateSheet}
            onCancel={() => setConfirmCreateModal(false)}
          />

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {user?.role?.toUpperCase() === 'PQC' ? 'Sheets của tôi' : 'Tất cả Sheets'}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'create' && (
          <div className="my-4">
            {loadingSheets && (
              <div className="flex justify-center items-center py-6">
                <div 
                  className="w-8 h-8 border-4 border-blue-500 border-opacity-75 border-t-transparent border-r-transparent rounded-full animate-spin"
                  role="status"
                >
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            )}
            {showSheets && currentSheet && (
              <div className="mt-4">
                <SmdSheetUser sheetData={currentSheet} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="my-4">
            {/* Info banner */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-0 text-center">
                Hiển thị: <strong>Sheet của hệ thống</strong> | User: <strong>{user?.username}</strong> ({user?.role})
              </p>
            </div>

            {/* Filters */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <AiOutlineSearch className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Tìm kiếm Sheet</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* id */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MdFavoriteBorder /> <span>Id</span>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric" 
                    value={filter.id || ""}
                    onChange={(e) => setFilter((s) => ({ ...s, id: Number(e.target.value) || 0}))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    placeholder="Nhập id..."
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* fcode */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MdFavoriteBorder /> <span>FCode</span>
                  </div>
                  <input
                    value={filter.fcode}
                    onChange={(e) => setFilter((s) => ({ ...s, fcode: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    placeholder="Nhập fcode..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Work Order */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MdFavoriteBorder /> <span>Work Order</span>
                  </div>
                  <input
                    value={filter.workOrder}
                    onChange={(e) => setFilter((s) => ({ ...s, workOrder: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    placeholder="Nhập Work Order..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaRegClock /> <span>Trạng thái</span>
                  </div>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter((s) => ({ ...s, status: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ WebkitAppearance: 'none' }}
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Pending</option>
                    <option value="PQCDone">PQC đã ký</option>
                    <option value="PQCLeaderDone">PQC Leader đã ký</option>
                    <option value="ENGDone">Engineer đã ký</option>
                    <option value="SupervisiorDone">Supervisor đã ký</option>
                    <option value="ManagerDone">Manager đã ký</option>
                    <option value="KoreaManagerDone">Korea Manager đã ký</option>
                  </select>
                </div>

                {/* From Date */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <BsCalendarDate /> <span>Từ ngày</span>
                  </div>
                  <input
                    type="datetime-local"
                    max={getCurrentDateTimeLocal()}
                    value={filter.fromDate}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    onChange={(e) => setFilter((s) => ({ ...s, fromDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ 
                      WebkitAppearance: 'none',  // Remove iOS default styling
                      minHeight: '44px'  // iOS minimum touch target
                    }}
                  />
                </div>

                {/* To Date */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <BsCalendarDate /> <span>Đến ngày</span>
                  </div>
                  <input
                    type="datetime-local"
                    max={getCurrentDateTimeLocal()}
                    value={filter.toDate}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    onChange={(e) => setFilter((s) => ({ ...s, toDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ 
                      WebkitAppearance: 'none',  // Remove iOS default styling
                      minHeight: '44px'  // iOS minimum touch target
                    }}
                  />
                </div>
                  {/* Creater-name */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaRegUserCircle />
                    <span>Người Tạo</span>
                  </div>
                  <input
                    type="text"
                    value={filter.createrName}
                    onChange={(e) => setFilter(s => ({ ...s, createrName: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder='Nhập tên người tạo...'
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 lg:flex lg:flex-row md:flex md:flex-row flex flex-col gap-2">
                <button
                  onClick={applyFilter}
                  disabled={loadingList}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AiOutlineSearch className="w-4 h-4" />
                  {loadingList ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
                <button
                  onClick={resetFilter}
                  disabled={loadingList}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AiOutlineClose className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              </div>

              {/* Result count */}
              <div className="mt-3 text-sm text-gray-600" ref={resultsRef}>
                Hiển thị <span className="font-semibold text-blue-600">{currentSheets.length}</span> / <span className="font-semibold">{sortedSheets.length}</span> sheets
                {pageCount > 1 && (
                  <span className="ml-2">
                    (Trang {currentPage + 1}/{pageCount})
                  </span>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="mt-4">
              {loadingList ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-opacity-75 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : currentSheets.length > 0 ? (
                <>
                  <div className="grid gap-3">
                    {currentSheets.map((sheet) => (
                      <div 
                        key={sheet.id}
                        id={`sheet-row-${sheet.id}`}
                        className={`lg:p-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-500 bg-white cursor-pointer ${
                          selectedSheetId === sheet.id
                            ? 'bg-yellow-50 border-yellow-400 shadow-xl ring-2 ring-yellow-300'
                            : ''
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                ID: {sheet.id}
                              </span>
                              
                              {sheet.account && (
                                <span className="text-xs bg-amber-100 px-2 py-1 rounded-lg">
                                  Người tạo: <strong>{sheet.account.fullName || sheet.account.userName}</strong>
                                </span>
                              )}
                              
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {formatDateTime(sheet.createAt)}
                              </span>
                              
                              {getStatusBadge(sheet)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="w-full lg:w-auto">
                            <button
                              onClick={() => handleViewDetail(sheet)}
                              disabled={!canViewDetail(sheet)}
                              className={`
                                w-full 
                                lg:min-w-[150px] 
                                whitespace-nowrap 
                                px-4 py-2 
                                rounded-lg 
                                transition-colors 
                                text-sm 
                                font-medium 
                                ${
                                  canViewDetail(sheet)
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
                              `}
                            >
                              {canViewDetail(sheet) ? 'Xem chi tiết' : 'Không thể xem'}
                            </button>
                          </div>
                          
                          <div className="w-full lg:w-auto">
                            <button
                              onClick={() => handleDeleteSheet(sheet)}
                              disabled={!canDeleteSheet(sheet) || deletingSheetId === sheet.id}
                              className={`
                                w-full 
                                lg:min-w-[150px] 
                                whitespace-nowrap 
                                px-4 py-2 
                                rounded-lg 
                                transition-colors 
                                text-sm 
                                font-medium 
                                ${
                                  deletingSheetId === sheet.id
                                    ? 'bg-gray-400 text-white cursor-wait'
                                    : canDeleteSheet(sheet)
                                    ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
                              `}
                            >
                              {deletingSheetId === sheet.id 
                                  ? '⏳ Đang xóa...' 
                                  : canDeleteSheet(sheet) 
                                  ? 'Xóa Sheet' 
                                  : 'Không thể xóa'
                                }
                            </button>
                          </div>

                          <ConfirmModal
                            open={confirmDeleteModal.open}
                            title="Xác nhận xóa Sheet"
                            message={
                              confirmDeleteModal.sheet 
                                ? `Bạn có chắc chắn muốn xóa Sheet #${confirmDeleteModal.sheet.id}?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`
                                : ''
                            }
                            confirmText="Xóa"
                            cancelText="Hủy"
                            type="danger"
                            onConfirm={handleConfirmDelete}
                            onCancel={() => setConfirmDeleteModal({ open: false, sheet: null })}
                          />
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
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-600 text-lg font-medium">
                    Không tìm thấy sheet nào
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Thử thay đổi bộ lọc tìm kiếm
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;