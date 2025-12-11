import { useState, useEffect, useRef } from 'react';
import SmdSheetUser from "../components/SmdSheetUser";
import { useNavigate } from 'react-router-dom';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { MdFavoriteBorder } from "react-icons/md";
import { BsCalendarDate } from "react-icons/bs";
import { FaRegClock } from "react-icons/fa";
import { Link } from 'react-router-dom';
import ReactPaginate from 'react-paginate';

// redux
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { createChangeModel, clearSheet, clearError, setCurrentSheet } from '../redux/slices/changeModelSlice';
import { clearAllSubTableData } from '../redux/slices/subTableSlice';
import { getSheetByFilter, fetchChangeModel } from '../redux/slices/changeModelSlice';
import type { ChangeModelResponse } from '../redux/slices/changeModelSlice';

type SheetFilter = {
  workOrder: string;
  fromDate: string;
  toDate: string;
  status: string;
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [showSheets, setShowSheets] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const { 
    currentSheet, 
    loading: creatingSheet, 
    error: sheetError, 
    success,
    filteredSheets,
    loadingList
  } = useAppSelector(state => state.changeModel);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    if(!loading && !isAuthenticated){
      navigate('/login');
    }
  }, [loading, isAuthenticated]);

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
    const timer = setTimeout(() => setShowLoginNoti(false), 4000);
    return () => clearTimeout(timer);
  }, [showLoginNoti]);

  // Notification khi tạo sheet thành công
  const [showCreateSheetNoti, setShowCreateSheetNoti] = useState(false);

  useEffect(() => {
    if (success && currentSheet) {
      setShowCreateSheetNoti(true);
      const timer = setTimeout(() => {
        setShowCreateSheetNoti(false);
        dispatch(clearSheet());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, currentSheet]);

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
  }, [sheetError]);

  // Filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: '',
    fromDate: '',
    toDate: '',
    status: 'all'
  });

  // Load sheets khi chuyển sang tab list
  useEffect(() => {
    if (activeTab === 'list') {
      resetFilter();
      loadSheets();
    }
  }, [activeTab]);

  // ✅ SMART LOAD SHEETS - Tự động chọn API phù hợp
  const loadSheets = async () => {
  try {
    const hasWorkOrder = filter.workOrder.trim() !== '';
    const hasDateRange = filter.fromDate !== '' && filter.toDate !== '';
    const hasStatus = filter.status !== '' && filter.status !== 'all';

    // ✅ Có bất kỳ filter nào → Dùng filterAll API
    if (hasWorkOrder || hasDateRange || hasStatus) {
      console.log('🔍 Using Filter API:', {
        workOrder: hasWorkOrder ? filter.workOrder.trim() : undefined,
        fromDate: hasDateRange ? filter.fromDate : undefined,
        toDate: hasDateRange ? filter.toDate : undefined,
        status: hasStatus ? filter.status : undefined,
      });
      
      await dispatch(getSheetByFilter({
        workOrder: hasWorkOrder ? filter.workOrder.trim() : undefined,
        fromDate: hasDateRange ? filter.fromDate : undefined,
        toDate: hasDateRange ? filter.toDate : undefined,
        status: hasStatus ? filter.status : undefined,
      })).unwrap();
      
      return;
    }

    // ✅ Không có filter → Load tất cả
    console.log('Using Get All API');
    await dispatch(fetchChangeModel()).unwrap();
    
  } catch (error: any) {
    console.error('❌ Lỗi khi tải sheets:', error);
    // Optionally show error to user
    if (error?.message) {
      alert(`Lỗi: ${error.message}`);
    }
  }
};

  // ✅ APPLY FILTER - Gọi lại API khi user click "Tìm kiếm"
  const applyFilter = () => {
    setCurrentPage(0);
    // Validate date range nếu chỉ có 1 ngày
    if (filter.fromDate && !filter.toDate) {
      alert('Vui lòng chọn "Đến ngày"');
      return;
    }
    if (!filter.fromDate && filter.toDate) {
      alert('Vui lòng chọn "Từ ngày"');
      return;
    }

    // Validate date range logic
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

  // ✅ RESET FILTER
  const resetFilter = async () => {
    setFilter({ 
      workOrder: '', 
      fromDate: '', 
      toDate: '',
      status: 'all'
    });
    // Load lại tất cả sheets
    try {
      await dispatch(fetchChangeModel()).unwrap();
      setCurrentPage(0);
    } catch (error) {
      console.error('❌ Lỗi khi reset filter:', error);
    }
  };

  // ✅ FORMAT DATETIME
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

  // ✅ GET STATUS BADGE COLOR & TEXT
  const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();
    
    // Status color mapping
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'pending': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending' },
      'PQCDone': { bg: 'bg-green-100', text: 'text-green-700', label: 'PQC Done' },
      'ENGDone': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Engineer Done' },
      'SupervisiorDone': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Supervisior Done' },
      'ManagerDone': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Manager Done' },
      'KoreaManagerDone': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Korea Manager Done' },
    };

    const config = statusConfig[status || 'pending'] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-700', 
      label: status || 'Unknown' 
    };

    return (
      <div className={`flex items-center gap-1 ${config.bg} ${config.text} rounded-full px-2 py-1 text-xs font-medium`}>
        <FaRegClock /> <span>{config.label}</span>
      </div>
    );
  };

  // ✅ HANDLE CREATE NEW SHEET
  const handleCreateNewSheet = async () => {
    if (user?.role?.toUpperCase() !== 'PQC') {
      alert('Chỉ PQC mới có thể tạo sheet mới!');
      return;
    }

    try {
      dispatch(clearSheet());
      dispatch(clearAllSubTableData());
      setActiveTab('create');
      setLoadingSheets(true);
      setShowSheets(false);
      
      const result = await dispatch(createChangeModel()).unwrap();
      
      console.log('✅ Sheet mới đã được tạo:', result);
      setCurrentSheet(result);
      
      await new Promise(res => setTimeout(res, 500));
      setShowSheets(true);
      
    } catch (error) {
      console.error('❌ Lỗi khi tạo sheet:', error);
    } finally {
      setLoadingSheets(false);
    }
  };

  // ✅ Sort sheets by date (newest first)
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
    
    // Scroll đến vị trí results thay vì top
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start' // 'start' | 'center' | 'end' | 'nearest'
      });
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-4">
      {/* Thông báo đăng nhập thành công */}
      {user && isAuthenticated && showLoginNoti && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[900px] animate-slide-down">
          <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800 text-lg">Đăng nhập thành công!</p>
            <p className="text-green-700 text-sm mt-1">
              User: <strong>{user?.username}</strong> - Role: <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      )}

      {currentSheet && showCreateSheetNoti && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[900px] animate-slide-down">
          <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800 text-lg">✅ Tạo sheet thành công!</p>
            <div className="text-green-700 text-sm mt-2 space-y-1">
              <p>Sheet ID: <strong>{currentSheet.id}</strong></p>
              <p>Status: <strong className="text-green-600">{currentSheet.status}</strong></p>
              {currentSheet.account && (
                <p>Người tạo: <strong>{currentSheet.account.fullName}</strong> ({currentSheet.account.role})</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thông báo lỗi */}
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

      {/* Component home render */}
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

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Tất Cả Sheet
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
                Hiển thị: <strong>Tất cả sheets trong hệ thống</strong> | User: <strong>{user?.username}</strong> ({user?.role})
              </p>
            </div>

            {/* Filters */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <AiOutlineSearch className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Tìm kiếm Sheet</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Work Order */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MdFavoriteBorder /> <span>Work Order</span>
                  </div>
                  <input
                    value={filter.workOrder}
                    onChange={(e) => setFilter((s) => ({ ...s, workOrder: e.target.value }))}
                    placeholder="Nhập Work Order..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status - 6 TRẠNG THÁI */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FaRegClock /> <span>Trạng thái</span>
                  </div>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter((s) => ({ ...s, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Pending</option>
                    <option value="PQCDone">PQC đã ký</option>
                    <option value="ENGDone">Engineer đã ký</option>
                    <option value="SupervisiorDone">Supervisor đã ký</option>
                    <option value="ManagerDone">Manager đã ký</option>
                    <option value="KoreaManagerDone">Korea Manager đã ký</option>
                  </select>
                </div>

                {/* From Date - Format YYYY-MM-DD */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <BsCalendarDate /> <span>Từ ngày</span>
                  </div>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={filter.fromDate}
                    onChange={(e) => setFilter((s) => ({ ...s, fromDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* To Date - Format YYYY-MM-DD */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <BsCalendarDate /> <span>Đến ngày</span>
                  </div>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={filter.toDate}
                    onChange={(e) => setFilter((s) => ({ ...s, toDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2">
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
                  {/* ✅ HIỂN THỊ SHEETS THEO TRANG */}
                  <div className="grid gap-3">
                    {currentSheets.map((sheet) => (
                      <div 
                        key={sheet.id} 
                        className="lg:p-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white cursor-pointer"
                      >
                        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Sheet ID */}
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                ID: {sheet.id}
                              </span>
                              
                              {/* Created By */}
                              {sheet.account && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                  👤 {sheet.account.fullName || sheet.account.userName}
                                </span>
                              )}
                              
                              {/* Date */}
                              <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                                {formatDateTime(sheet.createAt)}
                              </span>
                              
                              {/* Status Badge */}
                              {getStatusBadge(sheet)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="w-full lg:w-auto">
                            <button
                              onClick={() => navigate(`/pqc-sheet-detail/${sheet.id}`)}
                              className="w-full lg:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PAGINATION COMPONENT */}
                  {pageCount > 1 && (
                    <div className="mt-4 flex justify-center">
                      <ReactPaginate
                        previousLabel={'Trước'}
                        nextLabel={'Sau'}
                        breakLabel={'...'}
                        pageCount={pageCount}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handlePageChange}
                        forcePage={currentPage}
                        containerClassName={'flex items-center gap-2'}
                        pageClassName={''}
                        pageLinkClassName={'px-3 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-sm font-medium no-underline'}
                        previousClassName={''}
                        previousLinkClassName={'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium no-underline'}
                        nextClassName={''}
                        nextLinkClassName={'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium no-underline'}
                        breakClassName={''}
                        breakLinkClassName={'px-3 py-2 text-gray-500 no-underline'}
                        activeClassName={''}
                        activeLinkClassName={'!bg-blue-600 !text-white !border-blue-600 no-underline'}
                        disabledClassName={'opacity-50 cursor-not-allowed'}
                        disabledLinkClassName={'!cursor-not-allowed hover:!bg-transparent no-underline'}
                      />
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