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
import SmdSheetDetail from '../../components/SmdSheetDetail';
import { FaUserAlt } from "react-icons/fa";
import { MdSignalWifiStatusbar2Bar } from "react-icons/md";
import { useAppSelector } from '../../redux/hooks';

// Types
interface ConfirmationStep {
  role: 'ENG' | 'SUPERVISOR' | 'MANAGER' | 'MANAGER_KOREA';
  confirmedBy: string;
  confirmedAt: string;
}

// ✅ FIX: Định nghĩa rõ ràng type cho confirmations
interface Confirmations {
  ENG?: ConfirmationStep;
  SUPERVISOR?: ConfirmationStep;
  MANAGER?: ConfirmationStep;
  MANAGER_KOREA?: ConfirmationStep;
}

interface SmdLog {
  id: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedByRole?: string;
  confirmedAt?: string;
  confirmations?: Confirmations;
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
  
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('all');

  const { user } = useAppSelector(state => state.auth);

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
      
      const sortedLogs = allLogs.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      setLogs(sortedLogs);
      setFilteredLogs(sortedLogs);
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadLogs();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let filtered = [...logs];

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

    if (searchName.trim()) {
      filtered = filtered.filter(log => 
        log.submittedBy.toLowerCase().includes(searchName.toLowerCase()) ||
        log.submittedByRole.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchStatus !== 'all') {
      filtered = filtered.filter(log => {
        if (searchStatus === 'confirmed') return log.confirmed;
        if (searchStatus === 'pending') return !log.confirmed;
        return true;
      });
    }

    setFilteredLogs(filtered);
  }, [searchDate, searchName, searchStatus, logs]);

  const clearFilters = () => {
    setSearchDate('');
    setSearchName('');
    setSearchStatus('all');
  };

  // ✅ FIX: Kiểm tra role có thể xác nhận ở bước nào
  const canConfirmAtStep = (log: SmdLog, role: string): boolean => {
    if (!user || user.role !== role) return false;

    const confirmations = log.confirmations || {};

    switch (role) {
      case 'ENG':
        // ENG luôn có thể xác nhận nếu chưa xác nhận
        return !confirmations.ENG;
      
      case 'SUPERVISOR':
        // SUPERVISOR chỉ xác nhận được khi ENG đã xác nhận
        return !!confirmations.ENG && !confirmations.SUPERVISOR;
      
      case 'MANAGER':
        // MANAGER chỉ xác nhận được khi ENG và SUPERVISOR đã xác nhận
        return !!confirmations.ENG && !!confirmations.SUPERVISOR && !confirmations.MANAGER;
      
      case 'MANAGER_KOREA':
        // MANAGER_KOREA chỉ xác nhận được khi cả 3 bước trước đã xác nhận
        return !!confirmations.ENG && !!confirmations.SUPERVISOR && !!confirmations.MANAGER && !confirmations.MANAGER_KOREA;
      
      default:
        return false;
    }
  };

  // FIX: Xác nhận theo bước
  const handleConfirmStep = (logId: string, role: 'ENG' | 'SUPERVISOR' | 'MANAGER' | 'MANAGER_KOREA'): void => {
    try {
      if (!user) {
        alert("❌ Bạn chưa đăng nhập!");
        return;
      }

      const log = logs.find((l) => l.id === logId);
      if (!log) return;

      if (!canConfirmAtStep(log, role)) {
        alert("❌ Bạn không thể xác nhận ở bước này!");
        return;
      }

      const confirmations = log.confirmations || {};
      
      // Cập nhật xác nhận cho bước hiện tại
      const updatedConfirmations: Confirmations = {
        ...confirmations,
        [role]: {
          role: role,
          confirmedBy: user.username,
          confirmedAt: new Date().toISOString()
        }
      };

      // Kiểm tra xem tất cả các bước đã hoàn thành chưa
      const allConfirmed = 
        !!updatedConfirmations.ENG &&
        !!updatedConfirmations.SUPERVISOR &&
        !!updatedConfirmations.MANAGER &&
        !!updatedConfirmations.MANAGER_KOREA;

      const updatedLog: SmdLog = {
        ...log,
        confirmations: updatedConfirmations,
        confirmed: allConfirmed,
        // Cập nhật thông tin xác nhận cuối cùng nếu hoàn tất tất cả
        ...(allConfirmed && {
          confirmedBy: user.username,
          confirmedByRole: user.role,
          confirmedAt: new Date().toISOString()
        })
      };

      localStorage.setItem(`smd_logs:${logId}`, JSON.stringify(updatedLog));
      
      setLogs((prevLogs) => 
        prevLogs.map((l) => l.id === logId ? updatedLog : l)
      );

      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(updatedLog);
      }

      const roleNames: Record<string, string> = {
        'ENG': 'Engineering',
        'SUPERVISOR': 'Supervisor',
        'MANAGER': 'Manager',
        'MANAGER_KOREA': 'Manager Korea'
      };

      if (allConfirmed) {
        alert(`🎉 Sheet đã được xác nhận hoàn tất bởi tất cả các cấp!`);
      } else {
        alert(`✅ Xác nhận thành công bởi ${roleNames[role]}!`);
      }
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

  const canEdit = (log: SmdLog): boolean => {
    if (!user) return false;
    if (user.role !== 'ENG' && user.role !== 'SUPERVISOR') return false;
    return true;
  };

  // ✅ COMPONENT HIỂN THỊ TRẠNG THÁI XÁC NHẬN
  const ConfirmationStatus: React.FC<{ log: SmdLog }> = ({ log }) => {
    const confirmations = log.confirmations || {};
    const steps = [
      { key: 'ENG' as const, label: 'ENG', color: 'blue' },
      { key: 'SUPERVISOR' as const, label: 'SUP', color: 'purple' },
      { key: 'MANAGER' as const, label: 'MGR', color: 'orange' },
      { key: 'MANAGER_KOREA' as const, label: 'KMGR', color: 'red' }
    ];

    return (
      <div className="flex flex-col gap-1">
        {steps.map((step) => {
          const confirmation = confirmations[step.key];
          const isConfirmed = !!confirmation;
          const canConfirm = canConfirmAtStep(log, step.key);
          
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`w-12 text-xs font-semibold ${isConfirmed ? `text-${step.color}-700` : 'text-gray-400'}`}>
                {step.label}
              </div>
              
              {isConfirmed ? (
                <div className="flex items-center gap-1">
                  <AiOutlineCheckCircle className={`w-4 h-4 text-${step.color}-600`} />
                  <span className="text-xs text-gray-600 truncate max-w-20" title={confirmation.confirmedBy}>
                    {confirmation.confirmedBy}
                  </span>
                </div>
              ) : canConfirm ? (
                <input
                  type="checkbox"
                  onChange={() => handleConfirmStep(log.id, step.key)}
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

  // Detail View Component
  if (showDetail && selectedLog) {
    const confirmations = selectedLog.confirmations || {};
    const roles: Array<keyof Confirmations> = ['ENG', 'SUPERVISOR', 'MANAGER', 'MANAGER_KOREA'];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-8xl mx-auto p-4">
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
                        Hoàn tất xác nhận
                      </span>
                    </>
                  ) : (
                    <>
                      <AiOutlineClockCircle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-orange-700 font-semibold">
                        Đang xác nhận
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Hiển thị trạng thái xác nhận từng bước */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <strong className="text-sm text-gray-700 mb-2 block">Tiến trình xác nhận:</strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {roles.map((role) => {
                    const confirmation = confirmations[role];
                    const labels: Record<keyof Confirmations, string> = { 
                      ENG: 'Engineering', 
                      SUPERVISOR: 'Supervisor', 
                      MANAGER: 'Manager', 
                      MANAGER_KOREA: 'Manager Korea' 
                    };
                    
                    return (
                      <div key={role} className={`p-3 rounded-lg border-2 ${confirmation ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {confirmation ? (
                            <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AiOutlineClockCircle className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="font-semibold text-xs">{labels[role]}</span>
                        </div>
                        {confirmation ? (
                          <div className="text-xs text-gray-600">
                            <div>{confirmation.confirmedBy}</div>
                            <div className="text-[10px] text-gray-500">{formatDateTime(confirmation.confirmedAt)}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Chưa xác nhận</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

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

            {/* Nút xác nhận theo role */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {user?.role === 'ENG' && canConfirmAtStep(selectedLog, 'ENG') && (
                <button
                  onClick={() => handleConfirmStep(selectedLog.id, 'ENG')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận ENG
                </button>
              )}
              {user?.role === 'SUPERVISOR' && canConfirmAtStep(selectedLog, 'SUPERVISOR') && (
                <button
                  onClick={() => handleConfirmStep(selectedLog.id, 'SUPERVISOR')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận SUP
                </button>
              )}
              {user?.role === 'MANAGER' && canConfirmAtStep(selectedLog, 'MANAGER') && (
                <button
                  onClick={() => handleConfirmStep(selectedLog.id, 'MANAGER')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận MGR
                </button>
              )}
              {user?.role === 'MANAGER_KOREA' && canConfirmAtStep(selectedLog, 'MANAGER_KOREA') && (
                <button
                  onClick={() => handleConfirmStep(selectedLog.id, 'MANAGER_KOREA')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <AiOutlineCheckCircle className="w-5 h-5" />
                  Xác nhận KMGR
                </button>
              )}
            </div>

            <div className="border-t border-gray-300 pt-6">

                <SmdSheetDetail 
                  logId={selectedLog.id} 
                  data={selectedLog.data}
                  canEdit={canEdit(selectedLog)}
                />
          
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
              {user?.role === 'ENG' && '✏️ Bạn có thể xem, chỉnh sửa và xác nhận ở bước ENG'}
              {user?.role === 'SUPERVISOR' && '✏️ Bạn có thể xem, chỉnh sửa và xác nhận ở bước SUPERVISOR'}
              {user?.role === 'MANAGER' && '👁️ Bạn có thể xem và xác nhận ở bước MANAGER'}
              {user?.role === 'MANAGER_KOREA' && '👁️ Bạn có thể xem và xác nhận ở bước MANAGER KOREA'}
            </p>
          </div>

          {/* SEARCH FILTERS */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AiOutlineSearch className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Tìm kiếm & Lọc</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  <option value="confirmed">Hoàn tất</option>
                  <option value="pending">Đang xử lý</option>
                </select>
              </div>

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
                    <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Trạng thái xác nhận</th>
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
                      <td className="border border-gray-300 px-2 sm:px-4 py-3">
                        <ConfirmationStatus log={log} />
                      </td>
                      <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                          <button
                            onClick={() => handleViewDetail(log)}
                            className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                          >
                            <AiOutlineEye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Xem</span>
                          </button>
                          {canEdit(log) && (
                            <button
                              onClick={() => handleViewDetail(log)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;