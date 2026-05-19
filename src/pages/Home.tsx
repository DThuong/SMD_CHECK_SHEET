/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SmdSheetUser from "../components/SmdSheetUser";
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaRegClock } from "react-icons/fa";
import { Link } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import { getSheetWithFullObject, getSheetByFilter } from '../redux/slices/changeModelSlice';
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
import { SmartSearchBar } from '../components/general/SmartSearchBar';

// ─── Types ───────────────────────────────────────────────────────────────────

type SheetFilter = {
  workOrder: string;
  fromDate: string;
  toDate: string;
  fcode: string;
  status: string;
  id: number;
  createrName: string;
};

const EMPTY_FILTER: SheetFilter = {
  workOrder: '',
  fromDate: '',
  fcode: '',
  toDate: '',
  id: 0,
  status: 'all',
  createrName: '',
};

const SESSION_KEY = 'home_filter_state';

// ─── Session helpers ──────────────────────────────────────────────────────────

function saveSession(data: object) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { }
}
function readSession(): any {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { }
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deletingSheetId, setDeletingSheetId] = useState<number | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const isFirstMountRef = useRef(true);

  const [confirmCreateModal, setConfirmCreateModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    open: boolean;
    sheet: ChangeModelResponse | null;
  }>({ open: false, sheet: null });

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

  const [filter, setFilter] = useState<SheetFilter>(EMPTY_FILTER);

  // Candidates cho FuzzySearchInput — chỉ expand, không bao giờ thu hẹp
  const candidatesRef = useRef<{
    fcode: string[];
    workOrder: string[];
    createrName: string[];
    id: string[];
  }>({ fcode: [], workOrder: [], createrName: [], id: [] });
  const [, setCandidatesTick] = useState(0);

  // Notification state
  const [showLoginNoti, setShowLoginNoti] = useState(() => {
    try { return sessionStorage.getItem("justLoggedIn") === "1"; } catch { return false; }
  });
  const [showErrorNoti, setShowErrorNoti] = useState(false);

  // ── Auth redirect
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated]);

  // ── Sync URL params
  useEffect(() => {
    const params: Record<string, string> = { tab: activeTab };
    if (activeTab === 'create' && currentSheet?.id) {
      params.sheetId = currentSheet.id.toString();
    }
    setSearchParams(params, { replace: true });
  }, [activeTab, currentSheet?.id, setSearchParams]);

  // ── Login noti
  useEffect(() => {
    if (!showLoginNoti) return;
    try { sessionStorage.removeItem("justLoggedIn"); } catch { }
    const timer = setTimeout(() => setShowLoginNoti(false), 2000);
    return () => clearTimeout(timer);
  }, [showLoginNoti]);

  // ── Error noti
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

  // ── Cập nhật candidates từ filteredSheets (chỉ khi không có text filter đang active)
  useEffect(() => {
    if (!filteredSheets || filteredSheets.length === 0) return;
    const hasTextFilter = filter.workOrder.trim() || filter.fcode.trim() || filter.createrName.trim();
    if (hasTextFilter) return; // Không thu hẹp candidates khi đang search text

    const newId = [...new Set(filteredSheets.map(s => String(s.id)).filter(Boolean))];
    const newFcode = [...new Set(filteredSheets.map(s => s.checkModel?.fCode).filter(Boolean) as string[])];
    const newWorkOrder = [...new Set(filteredSheets.map(s => s.checkModel?.workOrder).filter(Boolean) as string[])];
    const newCreater = [...new Set(filteredSheets.map(s => s.account?.fullName || s.account?.userName).filter(Boolean) as string[])];

    let changed = false;
    if (newId.length > candidatesRef.current.id.length) { candidatesRef.current.id = newId; changed = true; }
    if (newFcode.length > candidatesRef.current.fcode.length) { candidatesRef.current.fcode = newFcode; changed = true; }
    if (newWorkOrder.length > candidatesRef.current.workOrder.length) { candidatesRef.current.workOrder = newWorkOrder; changed = true; }
    if (newCreater.length > candidatesRef.current.createrName.length) { candidatesRef.current.createrName = newCreater; changed = true; }
    if (changed) setCandidatesTick(t => t + 1);
  }, [filteredSheets]);

  // ── formatDateTimeForAPI
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

  // ── Core: gọi API với filter
  const loadSheetsWithFilter = useCallback(async (filterToUse: SheetFilter) => {
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
        if (hasId) filterParams.id = filterToUse.id;
        await dispatch(getSheetByFilter(filterParams)).unwrap();
        return;
      }

      await dispatch(fetchChangeModel()).unwrap();
    } catch (error: any) {
      console.error('❌ Lỗi khi tải sheets:', error);
      if (error?.message) showNotification('error', `Lỗi khi tải sheets: ${error.message}`);
    }
  }, [dispatch, showNotification]);

  // ── Restore sheet khi có sheetId trong URL
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
            if (hasAllRequiredData(result.checkModel, REQUIRED_FIELDS_CONFIG.CheckModel))
              dispatch(addCompletedTable('CheckModel'));
          }
          if (result.standardProduction) {
            dispatch(setStandardProduction(result.standardProduction));
            if (hasAllRequiredData(result.standardProduction, REQUIRED_FIELDS_CONFIG.StandardProduction))
              dispatch(addCompletedTable('StandardProduction'));
          }
          if (result.timeChangeModel) {
            dispatch(setTimeChangeModel(result.timeChangeModel));
            if (hasAllRequiredData(result.timeChangeModel, REQUIRED_FIELDS_CONFIG.TimeChangeModel))
              dispatch(addCompletedTable('TimeChangeModel'));
          }
          if (result.standardVehicle) {
            dispatch(setStandardVehicle(result.standardVehicle));
            if (hasAllRequiredData(result.standardVehicle, REQUIRED_FIELDS_CONFIG.StandardVehicle))
              dispatch(addCompletedTable('StandardVehicle'));
          }
          if (result.pqcCheck) {
            dispatch(setPQCCheck(result.pqcCheck));
            if (hasAllRequiredData(result.pqcCheck, REQUIRED_FIELDS_CONFIG.PQCCheck))
              dispatch(addCompletedTable('PQCCheck'));
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

  // ── EFFECT 1: Mount — restore session hoặc load mới
  useEffect(() => {
    if (sheetIdFromUrl && initialTab === 'create') return;

    const savedState = getHomeFilterState();
    const savedSheetId = getSelectedSheetId();

    if (savedSheetId) {
      setSelectedSheetId(savedSheetId);
    }

    if (savedState.filter) {
      setFilter(savedState.filter);
      setCurrentPage(savedState.currentPage || 0);
      setActiveTab((savedState.activeTab as 'create' | 'list') || 'list');

      if (savedState.activeTab === 'list') {
        setTimeout(() => {
          loadSheetsWithFilter(savedState.filter);
          if (savedSheetId) {
            setTimeout(() => {
              document.getElementById(`sheet-row-${savedSheetId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
          }
        }, 100);
      }
    } else {
      if (activeTab === 'list') loadSheetsWithFilter(EMPTY_FILTER);
    }

    if (savedSheetId) {
      const timer = setTimeout(() => {
        setSelectedSheetId(null);
        clearSelectedSheetId();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []); // CHỈ CHẠY 1 LẦN KHI MOUNT

  // ── EFFECT 2: Auto save filter state vào session
  useEffect(() => {
    if (activeTab !== 'list') return;
    saveHomeFilterState(filter, currentPage, activeTab);
    saveSession({ ...readSession(), filter, currentPage, activeTab });
  }, [filter, currentPage, activeTab]);

  // ── EFFECT 3: Load khi chuyển sang tab list
  useEffect(() => {
    if (activeTab !== 'list') return;

    // Bỏ qua lần chạy đầu tiên khi mount
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    const savedState = getHomeFilterState();
    if (savedState.filter) {
      setFilter(savedState.filter);
      setCurrentPage(savedState.currentPage || 0);
      setTimeout(() => loadSheetsWithFilter(savedState.filter), 0);
    } else {
      loadSheetsWithFilter(EMPTY_FILTER);
    }
  }, [activeTab]);

  // ── handleFilterChange: debounce 400ms gọi API
  const handleFilterChange = useCallback((key: string, value: any) => {
    let parsedValue = value;
    if (key === 'id') {
      // FuzzySearchInput trả về string, cần parse thành number
      parsedValue = value === '' ? 0 : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
    }
    const newFilter = { ...filter, [key]: parsedValue };
    setFilter(newFilter);
    setCurrentPage(0);
    saveSession({ ...readSession(), filter: newFilter, currentPage: 0, activeTab });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadSheetsWithFilter(newFilter);
    }, 400);
  }, [filter, activeTab, loadSheetsWithFilter]);

  // ── Reset filter
  const resetFilter = useCallback(async () => {
    clearSession();
    candidatesRef.current = { fcode: [], workOrder: [], createrName: [], id: [] };
    setCandidatesTick(0);
    setFilter(EMPTY_FILTER);
    setCurrentPage(0);
    try { await dispatch(fetchChangeModel()).unwrap(); } catch { }
  }, [dispatch]);

  // ── Format datetime hiển thị
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ── Status badge
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

  // ── Permissions
  const canViewDetail = (sheet: ChangeModelResponse): boolean => !!user;

  const canDeleteSheet = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;
    if (sheet.status?.toLowerCase() !== 'pending') return false;
    if (user.role?.toUpperCase() === 'PQC') {
      if (!sheet.account) return false;
      return sheet.account.id === user.id || sheet.account.userName === user.username;
    }
    return false;
  };

  // ── Handlers
  const handleViewDetail = (sheet: ChangeModelResponse) => {
    if (!canViewDetail(sheet)) {
      showNotification('error', 'Không có quyền truy cập', 'Bạn không có quyền xem chi tiết sheet này');
      return;
    }
    saveHomeFilterState(filter, currentPage, activeTab);
    saveSelectedSheetId(sheet.id);
    navigate(`/pqc-sheet-detail/${sheet.id}`, {
      state: { from: 'home', returnPath: '/?tab=list' }
    });
  };

  const handleDeleteSheet = (sheet: ChangeModelResponse) => {
    setConfirmDeleteModal({ open: true, sheet });
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
        if (currentPage >= totalPages && currentPage > 0) setCurrentPage(currentPage - 1);
        await loadSheetsWithFilter(filter);
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
      clearSession();
      dispatch(clearSheet());
      dispatch(clearAllSubTableData());
      setActiveTab('create');
      setLoadingSheets(true);
      setShowSheets(false);
      const result = await dispatch(createChangeModel()).unwrap();
      dispatch(setCurrentSheet(result));
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

  // ── Sort + Paginate
  const sortedSheets = useMemo(() => {
    return [...(filteredSheets || [])].sort((a, b) =>
      new Date(b.createAt || 0).getTime() - new Date(a.createAt || 0).getTime()
    );
  }, [filteredSheets]);

  const pageCount = Math.ceil(sortedSheets.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentSheets = sortedSheets.slice(offset, offset + itemsPerPage);

  const handlePageChange = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-down px-2 whitespace-nowrap flex-nowrap">
          <div className="bg-green-50 border border-green-200 rounded-full shadow-lg flex flex-row items-center gap-3 py-2 px-4 flex-nowrap">
            <span className="flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full text-xs shrink-0">✓</span>
            <span className="font-bold text-green-800 text-sm shrink-0">
              Đăng nhập thành công!
            </span>
            <div className="h-4 w-px bg-green-300 shrink-0" />
            <div className="text-green-700 text-xs font-medium flex flex-row items-center gap-1 shrink-0 flex-nowrap">
              <span>User: <strong className="text-green-900">{user?.username}</strong></span>
              <span className="mx-1 text-green-300">|</span>
              <span>Role: <strong className="text-green-900">{user?.role}</strong></span>
            </div>
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

      {!user || !isAuthenticated ? <Link to="/login"></Link> : null}

      {/* Main content */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Tabs */}
        <div className="flex w-full gap-2 mb-4 mx-0">
          <button
            onClick={handleCreateNewSheet}
            disabled={creatingSheet || user?.role?.toUpperCase() !== 'PQC'}
            className={`flex-1 px-4 py-3 rounded-md transition-colors font-medium ${activeTab === 'create' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
            className={`flex-1 px-4 py-3 rounded-md transition-colors font-medium ${activeTab === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            {user?.role?.toUpperCase() === 'PQC' ? 'Sheets của tôi' : 'Tất cả Sheets'}
          </button>
        </div>

        {/* Tab: Create */}
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

        {/* Tab: List */}
        {activeTab === 'list' && (
          <div className="my-4">
            {/* Info banner */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-0 text-center">
                Hiển thị: <strong>Sheet của hệ thống</strong> | User: <strong>{user?.username}</strong> ({user?.role})
              </p>
            </div>

            {/* SmartSearchBar — fuzzy suggest + debounce API */}
            <SmartSearchBar
              fields={[
                { key: 'id', label: 'ID', type: 'number', placeholder: 'Nhập id...', candidates: candidatesRef.current.id },
                {
                  key: 'fcode', label: 'FCode', placeholder: 'Nhập fcode...',
                  candidates: candidatesRef.current.fcode,
                },
                {
                  key: 'workOrder', label: 'Work Order', placeholder: 'Nhập Work Order...',
                  candidates: candidatesRef.current.workOrder,
                },
                {
                  key: 'createrName', label: 'Người Tạo', placeholder: 'Nhập tên người tạo...',
                  candidates: candidatesRef.current.createrName,
                },
                {
                  key: 'status', label: 'Trạng thái', type: 'select',
                  options: [
                    { value: 'all', label: 'Tất cả' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'PQCDone', label: 'PQC đã ký' },
                    { value: 'PQCLeaderDone', label: 'PQC Leader đã ký' },
                    { value: 'ENGDone', label: 'Engineer đã ký' },
                    { value: 'SupervisiorDone', label: 'Supervisor đã ký' },
                    { value: 'ManagerDone', label: 'Manager đã ký' },
                    { value: 'KoreaManagerDone', label: 'Korea Manager đã ký' },
                  ],
                },
                { key: 'fromDate', label: 'Từ ngày', type: 'datetime-local' },
                { key: 'toDate', label: 'Đến ngày', type: 'datetime-local' },
              ]}
              values={filter}
              onChange={handleFilterChange}
              onReset={resetFilter}
              loading={loadingList}
              resultCount={{
                current: currentSheets.length,
                total: sortedSheets.length,
                page: currentPage,
                pageCount,
              }}
            />

            {/* Results */}
            <div className="mt-4" ref={resultsRef}>
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
                        onClick={() => handleViewDetail(sheet)}
                        className={`lg:p-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-500 bg-white cursor-pointer ${selectedSheetId === sheet.id
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

                          {/* View */}
                          <div className="w-full lg:w-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(sheet);
                              }}
                              disabled={!canViewDetail(sheet)}
                              className={`
                                w-full lg:min-w-[150px] whitespace-nowrap
                                px-4 py-2 rounded-lg transition-colors text-sm font-medium
                                ${canViewDetail(sheet)
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                              `}
                            >
                              {canViewDetail(sheet) ? 'Xem chi tiết' : 'Không thể xem'}
                            </button>
                          </div>

                          {/* Delete */}
                          <div className="w-full lg:w-auto">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSheet(sheet);
                              }}
                              disabled={!canDeleteSheet(sheet) || deletingSheetId === sheet.id}
                              className={`
                                w-full lg:min-w-[150px] whitespace-nowrap
                                px-4 py-2 rounded-lg transition-colors text-sm font-medium
                                ${deletingSheetId === sheet.id
                                  ? 'bg-gray-400 text-white cursor-wait'
                                  : canDeleteSheet(sheet)
                                    ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                              `}
                            >
                              {deletingSheetId === sheet.id
                                ? '⏳ Đang xóa...'
                                : canDeleteSheet(sheet) ? 'Xóa Sheet' : 'Không thể xóa'}
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