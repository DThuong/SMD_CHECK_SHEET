import React, { useState, useEffect } from 'react';
import { 
  AiOutlineEye, 
  AiOutlineCheckCircle, 
  AiOutlineClockCircle, 
  AiOutlineCalendar 
} from 'react-icons/ai';
import { FaRegUserCircle } from "react-icons/fa";
import SmdSheetUser from '../../components/SmdSheetUser';

// Types & Interfaces
interface SmdSheetData {
  [key: string]: any;
}

interface SmdLog {
  id: string;
  submittedBy: string;
  submittedAt: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  data: SmdSheetData;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<SmdLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<SmdLog | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Sample data for testing
  const createSampleData = (): void => {
    const sampleLog: SmdLog = {
      id: 'sample_001',
      submittedBy: 'Nguyễn Văn A',
      submittedAt: '2024-12-01T08:30:00.000Z',
      confirmed: false,
      data: {
        lineChange: 'Line 1',
        korea: 'korea',
        modelSide: 'TOP',
        tb: 'T',
        revS15: 'REV 1.0',
        fCode: 'FC001-3IN1',
        revMounter: 'REV M1.2',
        workOrder: 'PD2025',
        pcbVer: 'V2.1',
        qty: '500',
        cnCard: 'Yes',
        jig: 'Yes',
        maPCB: 'PCB-2024-001',
        programPrinter: 'PRINT_PROG_V1',
        programSPI: 'SPI_PROG_V1',
        programMounter: 'MOUNT_PROG_V1',
        mounterPoint: '250',
        programMAOI: 'MAOI_PROG_V1',
        programSAOI: 'SAOI_PROG_V1',
        saoiPoint: '180',
        programReflow: 'REFLOW_PROG_V1',
        reflowSpeed: '1.2 m/min',
        maskNumber: 'MASK-2024-001',
        printerBlade: 'BLADE-001',
        msl3Material: 'MSL3-OPENED',
        chipUsage: 'Duksan',
        labelProgram: 'LABEL_V1',
        mesRegistration: 'MES-2024-001',
        mesBladeRegistration: 'MES-BLADE-001',
        changeModelTime: '45 phút',
        printerPressure: '25 kg',
        printSpeed: '50 mm/s',
        separationSpeed: '3.5 mm/s',
        cleanCount: '5',
        bladeUsed: 'BLADE-001',
        vacuumBlockOk: true,
        spiInspectionOk: true,
        mount3BoardsOk: true,
        mountBottomOk: true,
        reflowConveyorOk: true,
        railSettingValue: '330 mm',
        railActualValue: '330 mm',
        aoiXray3BoardsOk: true,
        outputMagazineOk: true,
        outputModel: 'MODEL-A',
        outputPitch: '5.0 mm',
        opName: 'Trần Văn B',
        opNote: 'Đổi model thành công',
        aoiOperator: 'Lê Thị C',
        aoiNote: 'Kiểm tra OK',
        sampleErrors: [
          { errorName: 'Offset', errorCount: 2, repairStatus: 'Đã sửa' },
        ],
        pqcFirstBoard: 'OK - Checked by QC Team',
        icPlanChecksum: 'CHK-2024-001',
        actualChecksum: 'CHK-2024-001',
        checksumChanged: 'No',
        tuner: 'TUNER-V1.0',
        lcrStartTime: '09:00',
        lcrEndTime: '09:30',
        lcrTester: 'Phạm Văn D',
        lcrResult: 'PASS'
      }
    };

    const sampleLog2: SmdLog = {
      id: 'sample_002',
      submittedBy: 'Trần Thị B',
      submittedAt: '2024-11-30T14:15:00.000Z',
      confirmed: true,
      confirmedBy: 'Manager Korea',
      confirmedAt: '2024-11-30T15:00:00.000Z',
      data: {
        lineChange: 'Line 2',
        korea: 'korea',
        modelSide: 'BOTTOM',
        tb: 'B',
        revS15: 'REV 2.0',
        fCode: 'FC002-3IN1',
        revMounter: 'REV M2.0',
        workOrder: 'PD2025',
        pcbVer: 'V3.0',
        qty: '1000',
        cnCard: 'No',
        jig: 'Yes',
        maPCB: 'PCB-2024-002',
        programPrinter: 'PRINT_PROG_V2',
        programSPI: 'SPI_PROG_V2',
        programMounter: 'MOUNT_PROG_V2',
        mounterPoint: '300',
        programMAOI: 'MAOI_PROG_V2',
        programSAOI: 'SAOI_PROG_V2',
        saoiPoint: '200',
        programReflow: 'REFLOW_PROG_V2',
        reflowSpeed: '1.0 m/min',
        maskNumber: 'MASK-2024-002',
        printerBlade: 'BLADE-002',
        msl3Material: 'MSL3-CLOSED',
        chipUsage: 'Heesung',
        labelProgram: 'LABEL_V2',
        mesRegistration: 'MES-2024-002',
        mesBladeRegistration: 'MES-BLADE-002',
        changeModelTime: '60 phút',
        printerPressure: '28 kg',
        printSpeed: '55 mm/s',
        separationSpeed: '4.0 mm/s',
        cleanCount: '6',
        bladeUsed: 'BLADE-002',
        vacuumBlockOk: true,
        spiInspectionOk: true,
        mount3BoardsOk: true,
        mountBottomOk: true,
        reflowConveyorOk: true,
        railSettingValue: '340 mm',
        railActualValue: '340 mm',
        aoiXray3BoardsOk: true,
        outputMagazineOk: true,
        outputModel: 'MODEL-B',
        outputPitch: '6.0 mm',
        opName: 'Nguyễn Văn E',
        opNote: 'Model mới test thành công',
        aoiOperator: 'Hoàng Thị F',
        aoiNote: 'Không có lỗi',
        sampleErrors: [],
        pqcFirstBoard: 'OK - All tests passed',
        icPlanChecksum: 'CHK-2024-002',
        actualChecksum: 'CHK-2024-002',
        checksumChanged: 'No',
        tuner: 'TUNER-V2.0',
        lcrStartTime: '14:30',
        lcrEndTime: '15:00',
        lcrTester: 'Lê Văn G',
        lcrResult: 'PASS'
      }
    };

    try {
      localStorage.setItem('smd_logs:sample_001', JSON.stringify(sampleLog));
      localStorage.setItem('smd_logs:sample_002', JSON.stringify(sampleLog2));
      console.log('Sample data created successfully');
      loadLogs(); // Reload after creating sample data
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert('Lỗi khi tạo dữ liệu mẫu: ' + error);
    }
  };

  // Load logs from localStorage
  const loadLogs = (): void => {
    setLoading(true);
    try {
      const allLogs: SmdLog[] = [];
      
      // Get all keys from localStorage
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
      console.log('Loaded logs:', sortedLogs.length);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert('Lỗi khi tải dữ liệu: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Load logs on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  const handleConfirm = (logId: string): void => {
    try {
      const log = logs.find((l) => l.id === logId);
      if (!log) return;

      const updatedLog: SmdLog = {
        ...log,
        confirmed: true,
        confirmedBy: 'MANAGER KOREA', // Replace with actual admin name from auth context
        confirmedAt: new Date().toISOString()
      };

      localStorage.setItem(`smd_logs:${logId}`, JSON.stringify(updatedLog));
      
      setLogs((prevLogs) => 
        prevLogs.map((l) => l.id === logId ? updatedLog : l)
      );

      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(updatedLog);
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
  };

  const clearStorage = (): void => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu logs?')) {
      try {
        // Get all keys that start with 'smd_logs:'
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('smd_logs:')) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all smd_logs keys
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log(`Cleared ${keysToRemove.length} logs from storage`);
        alert(`Đã xóa ${keysToRemove.length} bản ghi thành công!`);
        
        // Reload logs
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

  // Detail View Component
  if (showDetail && selectedLog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Chi tiết SMD Sheet</h2>
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Đóng
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <FaRegUserCircle className="w-5 h-5" />
                  <span className="text-sm text-gray-700">
                    <strong>Người gửi:</strong> {selectedLog.submittedBy}
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

              {selectedLog.confirmed && selectedLog.confirmedBy && selectedLog.confirmedAt && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-sm text-gray-700">
                    <strong>Xác nhận bởi:</strong> {selectedLog.confirmedBy} - {formatDateTime(selectedLog.confirmedAt)}
                  </div>
                </div>
              )}
            </div>

            {!selectedLog.confirmed && (
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
              {/* <h3 className="text-lg font-semibold mb-4 text-gray-800">Nội dung SMD Sheet</h3> */}
              <SmdSheetUser />
              {/* <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded"> */}
                {/* Component SmdSheet sẽ được import và hiển thị ở đây */}
                {/* <SmdSheet data={selectedLog.data} /> lưu ý sau này khi call api */}
                {/* <p className="text-center py-8 text-gray-500">
                  Import component SmdSheet vào đây để hiển thị nội dung chi tiết
                </p> */}
                {/* <pre className="mt-4 text-xs overflow-auto bg-white p-4 rounded border">
                  {JSON.stringify(selectedLog.data, null, 2)}
                </pre> */}
              {/* </div> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View Component
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Quản lý SMD Sheet Logs</h1>

          <div className="mb-4 lg:flex lg:flex-row flex flex-col gap-2">
            <button
              onClick={createSampleData}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Tạo dữ liệu mẫu (Sample Data)
            </button>
            <button
              onClick={clearStorage}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Xóa tất cả dữ liệu (Clear Storage)
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineClockCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Chưa có bản ghi nào</p>
              <p className="text-gray-500 text-sm mt-2">Click nút "Tạo dữ liệu mẫu" để test</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      STT
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Người gửi
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Thời gian gửi
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Xác nhận
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 lg:px-4 md:px-4 px-2 py-3 text-sm text-gray-700">
                        <div className="flex lg:flex-row flex-col items-center gap-2">
                          <FaRegUserCircle className="w-4 h-4 text-gray-500" />
                          {log.submittedBy}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(log.submittedAt)}
                      </td>
                      <td className="border border-gray-300 lg:px-4 md:px-4 px-2 py-3 text-center">
                        {log.confirmed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <AiOutlineCheckCircle className="w-4 h-4" />
                            Đã xác nhận
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                            <AiOutlineClockCircle className="w-4 h-4" />
                            Chờ xác nhận
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {log.confirmed ? (
                          <div className="text-xs text-gray-600">
                            <div className="font-semibold">{log.confirmedBy}</div>
                            <div>{log.confirmedAt && formatDateTime(log.confirmedAt)}</div>
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            onChange={() => handleConfirm(log.id)}
                            className="w-5 h-5 cursor-pointer accent-green-600"
                            title="Xác nhận"
                          />
                        )}
                      </td>
                      <td className="border border-gray-300 lg:px-4 md:px-4 px-2 py-3 text-center text-xs">
                        <button
                          onClick={() => handleViewDetail(log)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors lg:text-sm text-xs font-medium"
                        >
                          <AiOutlineEye className="w-4 h-4" />
                          Xem chi tiết
                        </button>
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