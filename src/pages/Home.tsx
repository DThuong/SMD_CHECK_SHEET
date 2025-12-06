import { useState, useEffect } from 'react';
import SmdSheetUser from "../components/SmdSheetUser";
import { useNavigate } from 'react-router-dom';
import { useAuth } from './authLoginSample/AuthContext';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { MdFavoriteBorder } from "react-icons/md";
import { BsCalendarDate } from "react-icons/bs";
import { FaRegClock } from "react-icons/fa";

interface SmdLog {
  id: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  confirmed: boolean;
  data: {
    checkModels?: {
      workOrder?: string;
      date?: string;
      lineDoi?: string;
      modelSide?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

type SheetFilter = {
  workOrder: string;
  fromDate: string;
  toDate: string;
};

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [showSheets, setShowSheets] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const { user } = useAuth();

  // Notification logic
  const [showNoti, setShowNoti] = useState(() => {
    try {
      return sessionStorage.getItem("justLoggedIn") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showNoti) return;
    try { sessionStorage.removeItem("justLoggedIn"); } catch {}
    const timer = setTimeout(() => setShowNoti(false), 4000);
    return () => clearTimeout(timer);
  }, [showNoti]);

  // Filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: '',
    fromDate: '',
    toDate: ''
  });

  // Sheets list từ localStorage
  const [sheets, setSheets] = useState<SmdLog[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<SmdLog[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // HÀM LOAD SHEETS TỪ LOCALSTORAGE - CHỈ CỦA USER HIỆN TẠI
  const loadSheetsFromLocalStorage = () => {
    setLoadingList(true);
    try {
      const allSheets: SmdLog[] = [];
      
      // Lấy tất cả logs từ localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smd_logs:')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const log = JSON.parse(value) as SmdLog;
              allSheets.push(log);
            } catch (err) {
              console.error('Error parsing log:', key, err);
            }
          }
        }
      }
      
      // FILTER CHỈ SHEETS CỦA USER HIỆN TẠI
      const mySheets = allSheets.filter(sheet => {
        // So sánh theo fullName của user đang đăng nhập
        return sheet.submittedBy === user?.fullName;
      });
      
      // Sort by date (newest first)
      const sortedSheets = mySheets.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      setSheets(sortedSheets);
      setFilteredSheets(sortedSheets);
      console.log(`✅ Loaded ${sortedSheets.length} sheets của ${user?.fullName}`);
    } catch (error) {
      console.error('Error loading sheets:', error);
    } finally {
      setLoadingList(false);
    }
  };

  // FILTER SHEETS THEO WORK ORDER VÀ DATE
  useEffect(() => {
    if (sheets.length === 0) return;

    let filtered = [...sheets];

    // Filter theo Work Order
    if (filter.workOrder.trim()) {
      filtered = filtered.filter(sheet => {
        const workOrder = sheet.data?.checkModels?.workOrder || '';
        return workOrder.toLowerCase().includes(filter.workOrder.toLowerCase());
      });
    }

    // Filter theo From Date
    if (filter.fromDate) {
      filtered = filtered.filter(sheet => {
        const sheetDate = new Date(sheet.submittedAt);
        const fromDate = new Date(filter.fromDate);
        return sheetDate >= fromDate;
      });
    }

    // Filter theo To Date
    if (filter.toDate) {
      filtered = filtered.filter(sheet => {
        const sheetDate = new Date(sheet.submittedAt);
        const toDate = new Date(filter.toDate);
        // Set time to end of day
        toDate.setHours(23, 59, 59, 999);
        return sheetDate <= toDate;
      });
    }

    setFilteredSheets(filtered);
  }, [filter, sheets]);

  // Load sheets khi chuyển sang tab list
  useEffect(() => {
    if (activeTab === 'list') {
      loadSheetsFromLocalStorage();
    }
  }, [activeTab]);

  // ✅ RESET FILTER
  const resetFilter = () => {
    setFilter({ workOrder: '', fromDate: '', toDate: '' });
    setFilteredSheets(sheets);
  };

  // ✅ FORMAT DATETIME
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Thông báo đăng nhập thành công */}
      {showNoti && (
        <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
          <div className="noti-inner bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800 text-lg">Đăng nhập thành công!</p>
            <p className="text-green-700 text-sm mt-1">
              User: <strong>{user?.fullName}</strong> - Role: <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Component home render */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 mx-3">
          <button
            onClick={async () => {
              setActiveTab('create');
              setLoadingSheets(true);
              setShowSheets(false);
              await new Promise(res => setTimeout(res, 1000));
              setShowSheets(true);
              setLoadingSheets(false);
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'create' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Tạo Sheet Mới
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'list' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Sheet Của Tôi
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
            {showSheets && (
              <div className="mt-4">
                <SmdSheetUser />
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="my-4">
            {/* Info banner */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Hiển thị sheets của: <strong>{user?.fullName}</strong> ({user?.role})
              </p>
            </div>

            {/* Filters */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <AiOutlineSearch className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Tìm kiếm Sheet</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

                {/* From Date */}
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

                {/* To Date */}
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
                  onClick={resetFilter}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <AiOutlineClose className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              </div>

              {/* Result count */}
              <div className="mt-3 text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-blue-600">{filteredSheets.length}</span> / {sheets.length} sheets
              </div>
            </div>

            {/* Results */}
            <div className="mt-4">
              {loadingList ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-opacity-75 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredSheets.length > 0 ? (
                <div className="grid gap-3">
                  {filteredSheets.map((sheet) => (
                    <div 
                      key={sheet.id} 
                      className="lg:p-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white "
                    >
                      <div className="flex flex-row gap-2 items-center justify-between">
                        <div className="flex-1">
                          {/* Work Order */}
                          <div className="lg:flex md:flex flex flex-col lg:items-start md:items-center items-start lg:justify-start md:justify-start gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full lg:text-sm md:text-sm text-xs font-semibold">
                              {sheet.data?.checkModels?.workOrder || 'N/A'}
                            </span>
                            {sheet.confirmed && (
                              <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full lg:text-sm md:text-sm text-xs font-medium">
                                ✓ Đã xác nhận
                              </div>
                            )}
                            {!sheet.confirmed && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                <FaRegClock /> <span>Chưa xác nhận</span>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Actions */}
                        <div className="">
                          <button
                            onClick={() => {
                              // Navigate to detail page
                              navigate(`/my-sheet/${sheet.id}`);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-gray-600 text-lg font-medium">
                    {sheets.length === 0 
                      ? 'Bạn chưa tạo sheet nào' 
                      : 'Không tìm thấy sheet phù hợp'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {sheets.length === 0
                      ? 'Hãy tạo sheet mới ở tab "Tạo Sheet Mới"'
                      : 'Thử thay đổi bộ lọc tìm kiếm'}
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