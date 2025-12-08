import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppSelector } from '../redux/hooks';

// Định nghĩa kiểu dữ liệu cho từng form
// checkModels
type CheckModelsData = {
  lineDoi?: string;
  modelSide?: string;
  fCode?: string;
  pcbVer?: string;
  workOrder?: string;
  revS15?: string;
  revMounter?: string;
  feederList?: string;
  opMounter?: string;
  qty?: string;
  date?: string;
  maPcb?: string;
  useCnCard?: "yes" | "no" | undefined;
  jig?: "yes" | "no" | undefined;
};

// programChecks
type ProgramChecksData = {
  printer?: string;
  spi?: string;
  mounter?: string;
  pointMounter?: string;
  mAoi?: string;
  sAoi?: string;
  pointSaoi?: string;
  reflow?: string;
  reflowSpeed?: string;
};

// standardProduction
type StandardProductData = {
  numMask?: string;
  numMes?: string;
  numDaoPrinter?: string;
  numDaoMes?: string;
  msl3Closed?: string;
  exclusiveUse?: "Duksan" | "Heesung";
  labelProgram?: string;
};

// standardVehicles
type StandardVehiclesData = {
  printer: {
    pressureSpec?: string;                    // Giá trị áp lực Spec (kg)
    scanSpeedSpec?: string;                   // Tốc độ quét Spec (mm/s)
    separationSpeedSpec?: string;             // Tốc độ khoảng cách tách bàn Spec (mm/s)
    wipeCountSpec?: string;                   // Số lần lau Spec
    bladeUsedSpec?: string;                   // Dao sử dụng Spec
    pressureActual?: string;                  // Giá trị áp lực thực tế trên máy (kg)
    scanSpeedActual?: string;                 // Tốc độ quét thực tế trên máy (mm/s)
    separationSpeedActual?: string;           // Tốc độ tách bàn thực tế trên máy (mm/s)
    wipeCountActual?: string;                 // Số lần lau thực tế trên máy
    bladeUsedActual?: string;                 // Dao sử dụng thực tế trên máy
    vacuumBlockOk: boolean;                   // Sau khi sử dụng Vaccum Block
  };
  spi: {
    inspectionSettingOk: boolean;             // Điều kiện setting Inspection
  };
  mount: {
    firstThreeBoardsOk: boolean;              // Kiểm tra 3 board đầu tiên
    bottomBoardOk: boolean;                   // Kiểm tra 1 tấm ở mặt dưới
  };
  reflow: {
    conveyorWidthOk: boolean;                 // Kiểm tra tình trạng chiều rộng của Conveyor
    railSettingValue?: string;                // Giá trị cài đặt Rail (mm)
    railActualValue?: string;                 // Giá trị thực tế Rail (mm)
  };
  aoi: {
    xrayThreeBoardsOk: boolean;               // Xoay 3 board đầu tiên
    xrayInspector?: string;                   // Người kiểm tra
  };
  output: {
    magazineDistanceOk: boolean;              // Kiểm tra tình trạng setting
    magazineInspector?: string;               // Người kiểm tra
    settingModel?: string;                    // Giá trị cài đặt theo yêu cầu Model
    settingPitch?: string;                    // Giá trị cài đặt theo yêu cầu Pitch
  };
  worker: {
    opName?: string;                          // Tên OP
    aoiName?: string;                         // Tên AOI
  };
};

// timeChangeData
type TimeChangeData = {
  resultName?: string;   
  timeStart?: string;
  timeEnd?: string;        
  minutes?: number;    
  history?: string;  
  qcName?: string;  
};

// pqcChecks
type PQCChecksData = {
  icPlan?: string;
  realChecksum?: string;
  checksumConfirmed?: string;
  tuner?: string;
  startTimeLCR?: string;
  endTimeLCR?: string;
  pqcName?: string;
  resultLCR?: boolean;
};

// sheetHeader
type SheetHeaderProps = {
  lcr?: File | undefined;
  reflow?: File | undefined;
};

// Định nghĩa kiểu dữ liệu cho toàn bộ sheet
type SmdSheetData = {
  checkModels: CheckModelsData;
  programChecks: ProgramChecksData;
  standardProduction: StandardProductData;
  standardVehicles: StandardVehiclesData;
  timeChange: TimeChangeData;
  pqcChecks: PQCChecksData;
  sheetHeader: SheetHeaderProps;
};

// Định nghĩa kiểu cho metadata
type SheetMetadata = {
  submittedBy?: string;
  submittedAt?: string;
  role?: string;
};

// Định nghĩa kiểu cho Log
type SmdLog = {
  id: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedByRole?: string;
  confirmedAt?: string;
  data: SmdSheetData;
  editHistory?: {
    editedBy: string;
    editedByRole: string;
    editedAt: string;
    changes: string;
  }[];
};

type ContextValue = {
  sheetData: SmdSheetData;
  metadata: SheetMetadata;
  updateCheckModels: (data: CheckModelsData) => void;
  updateProgramChecks: (data: ProgramChecksData) => void;
  updateStandardProduction: (data: StandardProductData) => void;
  updateStandardVehicles: (data: StandardVehiclesData) => void;
  updateTimeChange: (data: TimeChangeData) => void;
  updatePQCChecks: (data: PQCChecksData) => void;
  updateSheetHeader: (data: SheetHeaderProps) => void;
//   saveToLocalStorage: () => void;
  submitToLogs: () => boolean;
  loadFromLocalStorage: () => void;
  loadLogData: (logId: string) => void; // ✅ Load log để edit
  updateLogData: (logId: string) => boolean; // ✅ Cập nhật log sau khi edit
  clearData: () => void;
  isReadOnly: boolean;
  currentLogId: string | null;
};

const SmdSheetContext = createContext<ContextValue | undefined>(undefined);

// ===== INITIAL STATE =====
const getInitialSheetData = (): SmdSheetData => ({
  checkModels: { workOrder: "PD2025" },
  programChecks: {},
  standardProduction: {},
  standardVehicles: {
    printer: { vacuumBlockOk: false },
    spi: { inspectionSettingOk: false },
    mount: { firstThreeBoardsOk: false, bottomBoardOk: false },
    reflow: { conveyorWidthOk: false },
    aoi: { xrayThreeBoardsOk: false },
    output: { magazineDistanceOk: false },
    worker: {},
  },
  timeChange: {},
  pqcChecks: {},
  sheetHeader: {},
});

// Provider component
export function SmdSheetProvider({ children }: { children: ReactNode }) {
  const [sheetData, setSheetData] = useState<SmdSheetData>(getInitialSheetData());
  const [metadata, setMetadata] = useState<SheetMetadata>({});
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
    useEffect(() => {
    if (!isAuthenticated) {
      console.warn('User not authenticated');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // ===== CÁC HÀM CẬP NHẬT =====
  const updateCheckModels = (data: CheckModelsData) => {
    setSheetData((prev) => ({ ...prev, checkModels: data }));
  };

  const updateProgramChecks = (data: ProgramChecksData) => {
    setSheetData((prev) => ({ ...prev, programChecks: data }));
  };

  const updateStandardProduction = (data: StandardProductData) => {
    setSheetData((prev) => ({ ...prev, standardProduction: data }));
  };

  const updateStandardVehicles = (data: StandardVehiclesData) => {
    setSheetData((prev) => ({ ...prev, standardVehicles: data }));
  };

  const updateTimeChange = (data: TimeChangeData) => {
    setSheetData((prev) => ({ ...prev, timeChange: data }));
  };

  const updatePQCChecks = (data: PQCChecksData) => {
    setSheetData((prev) => ({ ...prev, pqcChecks: data }));
  };

  const updateSheetHeader = (data: SheetHeaderProps) => {
    setSheetData((prev) => ({ ...prev, sheetHeader: data }));
  };

  // Submit sheet vào logs (PQC gửi lần đầu)
  const submitToLogs = (): boolean => {
    try {
      if (!user) {
        alert("❌ Không tìm thấy thông tin user!");
        console.log("❌ Không tìm thấy thông tin user!");
        return false;
      }

      if (!user.fullName || !user.role) {
        console.error('❌ User missing required fields:', user);
        alert("❌ Thông tin user không đầy đủ!");
        return false;
      }

      const logId = `log_${Date.now()}`;
      
      const newLog: SmdLog = {
        id: logId,
        submittedBy: user.fullName,
        submittedByRole: user.role,
        submittedAt: new Date().toISOString(),
        confirmed: false,
        data: sheetData,
        editHistory: []
      };

      // Lưu vào localStorage
      localStorage.setItem(`smd_logs:${logId}`, JSON.stringify(newLog));
      
      // Xóa draft
      localStorage.removeItem("smd_sheet_data");
      
      // Reset form
      setSheetData(getInitialSheetData());
      setMetadata({});
      setCurrentLogId(null);
      setIsReadOnly(false);

      console.log("✅ Sheet submitted to logs:", newLog);
      return true;
    } catch (error) {
      console.error("Error submitting to logs:", error);
      alert("❌ Có lỗi khi gửi sheet!");
      return false;
    }
  };

  // Load draft từ localStorage
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("smd_sheet_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSheetData(parsed.sheetData || getInitialSheetData());
        setMetadata(parsed.metadata || {});
        console.log("Draft loaded:", parsed);
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  };

  // Load log để xem/edit (ENG, SUPERVISOR dùng)
  const loadLogData = (logId: string) => {
    try {
      // Validate logId
      if (!logId) {
        console.error('❌ Invalid logId');
        alert("❌ ID log không hợp lệ!");
        return;
      }

      const logString = localStorage.getItem(`smd_logs:${logId}`);
      if (!logString) {
        alert("❌ Không tìm thấy log!");
        return;
      }

      const log: SmdLog = JSON.parse(logString);
      setSheetData(log.data);
      setCurrentLogId(logId);

      // Check user trước khi set permissions
      if (!user) {
        console.warn('⚠️ No user found, setting read-only');
        setIsReadOnly(true);
        return;
      }
      
      // Kiểm tra quyền edit
      const canEdit = user?.role === 'ENG' || user?.role === 'SUPERVISOR';
      setIsReadOnly(!canEdit);

      console.log("✅ Log loaded:", log);
    } catch (error) {
      console.error("Error loading log:", error);
      alert("❌ Có lỗi khi tải log!");
    }
  };

  // Cập nhật log sau khi edit (ENG, SUPERVISOR dùng)
  const updateLogData = (logId: string): boolean => {
    try {
      if (!user) {
        alert("❌ Không tìm thấy thông tin user!");
        return false;
      }

      // Check required fields
      if (!user.fullName || !user.role) {
        console.error('❌ User missing required fields:', user);
        alert("❌ Thông tin user không đầy đủ!");
        return false;
      }

      // Chỉ ENG và SUPERVISOR được edit
      if (user.role !== 'ENG' && user.role !== 'SUPERVISOR') {
        alert("❌ Bạn không có quyền chỉnh sửa!");
        return false;
      }

      const logString = localStorage.getItem(`smd_logs:${logId}`);
      if (!logString) {
        alert("❌ Không tìm thấy log!");
        return false;
      }

      const log: SmdLog = JSON.parse(logString);
      
      // Cập nhật data
      log.data = sheetData;
      
      // Thêm vào edit history
      if (!log.editHistory) log.editHistory = [];
      log.editHistory.push({
        editedBy: user.fullName,
        editedByRole: user.role,
        editedAt: new Date().toISOString(),
        changes: 'Sheet data updated'
      });

      // Lưu lại
      localStorage.setItem(`smd_logs:${logId}`, JSON.stringify(log));
      
      console.log("✅ Log updated:", log);
      alert("✅ Cập nhật thành công!");
      return true;
    } catch (error) {
      console.error("Error updating log:", error);
      alert("❌ Có lỗi khi cập nhật!");
      return false;
    }
  };

  // Xóa draft
  const clearData = () => {
    localStorage.removeItem("smd_sheet_data");
    setSheetData(getInitialSheetData());
    setMetadata({});
    setCurrentLogId(null);
    setIsReadOnly(false);
    alert("Dữ liệu đã được xóa!");
  };

  return (
    <SmdSheetContext.Provider
      value={{
        sheetData,
        metadata,
        updateCheckModels,
        updateProgramChecks,
        updateStandardProduction,
        updateStandardVehicles,
        updateTimeChange,
        updatePQCChecks,
        updateSheetHeader,
        submitToLogs,
        loadFromLocalStorage,
        loadLogData,
        updateLogData,
        clearData,
        isReadOnly,
        currentLogId,
      }}
    >
      {children}
    </SmdSheetContext.Provider>
  );
}

export function useSmdSheet() {
  const context = useContext(SmdSheetContext);
  if (!context) {
    throw new Error("useSmdSheet must be used within SmdSheetProvider");
  }
  return context;
}