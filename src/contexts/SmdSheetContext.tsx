import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../pages/authLoginSample/AuthContext';

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
    screenSprintSetting?: string;
    screenSprintSpec?: string;
    screenSprintActual?: string;
    pressureSpec?: string;
    pressureActual?: string;
    scanSpeedSpec?: string;
    scanSpeedActual?: string;
    separationSpeedSpec?: string;
    separationSpeedActual?: string;
    wipeCountSpec?: string;
    wipeCountActual?: string;
    bladeUsedSpec?: string;
    bladeUsedActual?: string;
    vacuumBlockOk: boolean;
    vacuumBlockNote?: string;
  };
  spi: {
    inspectionCheck?: string;
    inspectionSettingOk: boolean;
    inspectionSettingNote?: string;
  };
  mount: {
    firstThreeBoardsOk: boolean;
    firstThreeBoardsNote?: string;
    bottomBoardOk: boolean;
    bottomBoardNote?: string;
  };
  reflow: {
    conveyorWidthOk: boolean;
    conveyorWidthNote?: string;
    railSettingValue?: string;
    railActualValue?: string;
    railCheckOk: boolean;
    railCheckNote?: string;
  };
  aoi: {
    xrayThreeBoardsOk: boolean;
    xrayInspector?: string;
  };
  output: {
    magazineDistanceOk: boolean;
    magazineInspector?: string;
    settingModel?: string;
    settingPitch?: string;
  };
  worker: {
    opName?: string;
    opNote?: string;
    aoiName?: string;
    aoiNote?: string;
  };
  sampleInspection: {
    errorName1?: string;
    errorCount1?: string;
    repairStatus1?: string;
    errorName2?: string;
    errorCount2?: string;
    repairStatus2?: string;
  };
};

// timeChangeData
type TimeChangeData = {
  resultStart?: string;
  resultEnd?: string;
  resultMinutes?: number;
  resultHistory?: string;
  qcStart?: string;
  qcEnd?: string;
  qcMinutes?: number;
  qcHistory?: string;
};

// pqcChecks
type PQCChecksData = {
  icPlan?: string;
  realChecksum?: string;
  checksumConfirmed?: boolean;
  acceptedChecksum?: string;
  tuner?: string;
  processStage?: string;
  startTimeLCR?: string;
  endTimeLCR?: string;
  pqcName?: string;
  resultLCROk?: boolean;
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

// ✅ Định nghĩa kiểu cho Log
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
    reflow: { conveyorWidthOk: false, railCheckOk: false },
    aoi: { xrayThreeBoardsOk: false },
    output: { magazineDistanceOk: false },
    worker: {},
    sampleInspection: {},
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
  
  const { user } = useAuth();

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

//   // Lưu tạm (Draft) - CHỈ PQC dùng
//   const saveToLocalStorage = () => {
//     try {
//       const dataToSave = {
//         sheetData,
//         metadata: {
//           ...metadata,
//           submittedBy: user?.fullName || 'Unknown User',
//           submittedAt: new Date().toISOString(),
//           role: user?.role || 'Unknown Role',
//         },
//       };

//       localStorage.setItem("smd_sheet_data", JSON.stringify(dataToSave));
//       setMetadata(dataToSave.metadata);

//       alert("✅ Dữ liệu đã được lưu tạm thành công!");
//       console.log("Draft saved:", dataToSave);
//     } catch (error) {
//       console.error("Error saving to localStorage:", error);
//       alert("❌ Có lỗi khi lưu dữ liệu!");
//     }
//   };

  // ✅ Submit sheet vào logs (PQC gửi lần đầu)
  const submitToLogs = (): boolean => {
    try {
      if (!user) {
        alert("❌ Không tìm thấy thông tin user!");
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
      const logString = localStorage.getItem(`smd_logs:${logId}`);
      if (!logString) {
        alert("❌ Không tìm thấy log!");
        return;
      }

      const log: SmdLog = JSON.parse(logString);
      setSheetData(log.data);
      setCurrentLogId(logId);
      
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
        // saveToLocalStorage,
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