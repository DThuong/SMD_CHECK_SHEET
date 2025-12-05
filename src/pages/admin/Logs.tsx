import React, { useState, useEffect } from 'react';
import { 
  AiOutlineEye, 
  AiOutlineCheckCircle, 
  AiOutlineClockCircle, 
  AiOutlineCalendar,
  AiOutlineEdit,
  AiOutlineSearch,
  AiOutlineClose 
} from 'react-icons/ai';
import { FaCalendarAlt, FaRegUserCircle } from "react-icons/fa";
import { useAuth } from '../authLoginSample/AuthContext';
import { SmdSheetProvider } from '../../contexts/SmdSheetContext';
import SmdSheetDetail from '../../components/SmdSheetDetail';
import { BsCalendarDate } from "react-icons/bs";
import { FaUserAlt } from "react-icons/fa";
import { MdSignalWifiStatusbar2Bar } from "react-icons/md";

// Types
interface SmdLog {
  id: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedByRole?: string;
  confirmedAt?: string;
  data: any;
  editHistory?: {
    editedBy: string;
    editedByRole: string;
    editedAt: string;
    changes: string;
  }[];
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<SmdLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SmdLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<SmdLog | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // ✅ THÊM: State cho tìm kiếm
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('all'); // 'all' | 'confirmed' | 'pending'

  const { user } = useAuth();

  // Load logs từ localStorage
  const loadLogs = (): void => {
    setLoading(true);
    try {
      const allLogs: SmdLog[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smd_logs:')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const log = JSON.parse(value) as SmdLog;
              allLogs.push(log);
            } catch (err) {
              console.error('Error parsing log:', key, err);
            }
          }
        }
      }
      
      // Sort by submission date (newest first)
      const sortedLogs = allLogs.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs); // Khởi tạo filtered logs
      console.log('✅ Loaded logs:', sortedLogs.length);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert('Lỗi khi tải dữ liệu: ' + error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Auto-reload mỗi 5 giây
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadLogs();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // ✅ THÊM: Effect để filter logs khi search thay đổi
  useEffect(() => {
    let filtered = [...logs];

    // Filter theo ngày
    if (searchDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.submittedAt);
        const searchDateObj = new Date(searchDate);
        
        return (
          logDate.getDate() === searchDateObj.getDate() &&
          logDate.getMonth() === searchDateObj.getMonth() &&
          logDate.getFullYear() === searchDateObj.getFullYear()
        );
      });
    }

    // Filter theo tên người gửi
    if (searchName.trim()) {
      filtered = filtered.filter(log => 
        log.submittedBy.toLowerCase().includes(searchName.toLowerCase()) ||
        log.submittedByRole.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter theo trạng thái
    if (searchStatus !== 'all') {
      filtered = filtered.filter(log => {
        if (searchStatus === 'confirmed') return log.confirmed;
        if (searchStatus === 'pending') return !log.confirmed;
        return true;
      });
    }

    setFilteredLogs(filtered);
  }, [searchDate, searchName, searchStatus, logs]);

  // ✅ THÊM: Clear tất cả filters
  const clearFilters = () => {
    setSearchDate('');
    setSearchName('');
    setSearchStatus('all');
  };

  // Xử lý xác nhận - TẤT CẢ ROLE TRỪ PQC
  const handleConfirm = (logId: string): void => {
    try {
      if (!user || user.role === 'PQC') {
        alert("❌ Bạn không có quyền xác nhận!");
        return;
      }

      const log = logs.find((l) => l.id === logId);
      if (!log) return;

      if (log.confirmed) {
        alert("ℹ️ Sheet này đã được xác nhận!");
        return;
      }

      const updatedLog: SmdLog = {
        ...log,
        confirmed: true,
        confirmedBy: user.fullName,
        confirmedByRole: user.role,
        confirmedAt: new Date().toISOString()
      };

      localStorage.setItem(`smd_logs:${logId}`, JSON.stringify(updatedLog));
      
      setLogs((prevLogs) => 
        prevLogs.map((l) => l.id === logId ? updatedLog : l)
      );

      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(updatedLog);
      }

      alert('✅ Đã xác nhận thành công!');
    } catch (error) {
      console.error('Error confirming log:', error);
      alert('Có lỗi xảy ra khi xác nhận. Vui lòng thử lại.');
    }
  };

  const handleViewDetail = (log: SmdLog): void => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const handleCloseDetail = (): void => {
    setShowDetail(false);
    setSelectedLog(null);
    loadLogs();
  };

  const clearStorage = (): void => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu logs?')) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('smd_logs:')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log(`Cleared ${keysToRemove.length} logs from storage`);
        alert(`Đã xóa ${keysToRemove.length} bản ghi thành công!`);
        
        loadLogs();
      } catch (error) {
        console.error('Error clearing storage:', error);
        alert('Có lỗi xảy ra khi xóa dữ liệu: ' + error);
      }
    }
  };

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

  const canConfirm = (log: SmdLog): boolean => {
    if (!user) return false;
    if (user.role === 'PQC') return false;
    if (log.confirmed) return false;
    return true;
  };

  const canEdit = (log: SmdLog): boolean => {
    if (!user) return false;
    if (user.role !== 'ENG' && user.role !== 'SUPERVISOR') return false;
    return true;
  };

  // Detail View Component
  if (showDetail && selectedLog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Chi tiết SMD Sheet</h2>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Quay lại
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <FaRegUserCircle className="w-5 h-5" />
                  <span className="text-sm text-gray-700">
                    <strong>Người gửi:</strong> {selectedLog.submittedBy} ({selectedLog.submittedByRole})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AiOutlineCalendar className="w-5 h-5" />
                  <span className="text-sm text-gray-700">
                    <strong>Thời gian:</strong> {formatDateTime(selectedLog.submittedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLog.confirmed ? (
                    <>
                      <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 font-semibold">
                        Đã xác nhận
                      </span>
                    </>
                  ) : (
                    <>
                      <AiOutlineClockCircle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-orange-700 font-semibold">
                        Chờ xác nhận
                      </span>
                    </>
                  )}
                </div>
              </div>

              {selectedLog.confirmed && selectedLog.confirmedBy && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-sm text-gray-700">
                    <strong>Xác nhận bởi:</strong> {selectedLog.confirmedBy} ({selectedLog.confirmedByRole}) 
                    - {formatDateTime(selectedLog.confirmedAt!)}
                  </div>
                </div>
              )}

              {selectedLog.editHistory && selectedLog.editHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <strong className="text-sm text-gray-700">Lịch sử chỉnh sửa:</strong>
                  {selectedLog.editHistory.map((edit, idx) => (
                    <div key={idx} className="text-xs text-gray-600 ml-4 mt-1">
                      • {edit.editedBy} ({edit.editedByRole}) - {formatDateTime(edit.editedAt)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canConfirm(selectedLog) && (
              <div className="mb-4">
                <button
                  onClick={() => handleConfirm(selectedLog.id)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận SMD Sheet này
                </button>
              </div>
            )}

            <div className="border-t pt-6">
              <SmdSheetProvider>
                <SmdSheetDetail 
                  logId={selectedLog.id} 
                  data={selectedLog.data}
                  canEdit={canEdit(selectedLog)}
                />
              </SmdSheetProvider>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
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
              {user?.role === 'PQC' && '📝 Bạn có thể xem logs mà bạn đã tạo'}
              {user?.role === 'ENG' && '✏️ Bạn có thể xem, chỉnh sửa và xác nhận logs'}
              {user?.role === 'SUPERVISOR' && '✏️ Bạn có thể xem, chỉnh sửa và xác nhận logs'}
              {user?.role === 'MANAGER' && '👁️ Bạn có thể xem và xác nhận logs'}
              {user?.role === 'MANAGER_KOREA' && '👁️ Bạn có thể xem và xác nhận logs'}
            </p>
          </div>

          {/* SEARCH FILTERS - RESPONSIVE */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AiOutlineSearch className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Tìm kiếm & Lọc</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tìm theo ngày */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaCalendarAlt /><span>Ngày gửi</span>
                  </div>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Chọn ngày..."
                />
              </div>

              {/* Tìm theo tên */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FaUserAlt /><span>Người gửi</span>
                  </div>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên hoặc role..."
                />
              </div>

              {/* Lọc theo trạng thái */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MdSignalWifiStatusbar2Bar /><span>Trạng thái</span>
                  </div>
                <select
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="pending">Chờ xác nhận</option>
                </select>
              </div>

              {/* Nút clear */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <AiOutlineClose className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            {/* Hiển thị kết quả */}
            <div className="mt-3 text-sm text-gray-600">
              Hiển thị <span className="font-semibold text-blue-600">{filteredLogs.length}</span> / {logs.length} bản ghi
            </div>
          </div>

          {/* Action buttons */}
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Tải lại
            </button>
            <button
              onClick={clearStorage}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Xóa tất cả
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineClockCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {logs.length === 0 ? 'Chưa có bản ghi nào' : 'Không tìm thấy kết quả'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {logs.length === 0 
                  ? (user?.role === 'PQC' ? 'Hãy tạo và gửi SMD Sheet từ trang chính' : 'Chờ PQC tạo sheet mới')
                  : 'Thử thay đổi bộ lọc tìm kiếm'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">STT</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Người gửi</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Thời gian</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Xác nhận</th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.submittedBy}</span>
                          <span className="text-[10px] sm:text-xs text-gray-500">({log.submittedByRole})</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                        {formatDateTime(log.submittedAt)}
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                        {log.confirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold whitespace-nowrap">
                            <AiOutlineCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span className="hidden sm:inline">Đã xác nhận</span>
                            <span className="sm:hidden">OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold whitespace-nowrap">
                            <AiOutlineClockCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            <span className="hidden sm:inline">Chờ Xác Nhận</span>
                            <span className="sm:hidden">Chờ Xác Nhận</span>
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                        {log.confirmed ? (
                          <div className="text-xs text-gray-600">
                            <div className="font-semibold truncate max-w-[100px] sm:max-w-none mx-auto">
                              {log.confirmedBy}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500">
                              ({log.confirmedByRole})
                            </div>
                            <div className="text-[10px] sm:text-xs hidden sm:block">
                              {formatDateTime(log.confirmedAt!)}
                            </div>
                          </div>
                        ) : canConfirm(log) ? (
                          <input
                            type="checkbox"
                            onChange={() => handleConfirm(log.id)}
                            className="w-5 h-5 cursor-pointer accent-green-600"
                            title="Xác nhận"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                          <button
                            onClick={() => handleViewDetail(log)}
                            className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                          >
                            <AiOutlineEye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Xem</span>
                          </button>
                          {canEdit(log) && (
                            <button
                              onClick={() => handleViewDetail(log)}
                              className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;