/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/Logs.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  AiOutlineEye,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCalendar,
  AiOutlineClose,
  AiOutlineLoading3Quarters,
} from "react-icons/ai";
import { MdKeyboardReturn } from "react-icons/md";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import ReactPaginate from "react-paginate";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../../redux/hooks";
import Notification from "../../components/general/Notification";
import { useSearchParams } from "react-router-dom";
import { deleteSheetById } from "../../redux/slices/changeModelSlice";
import { ConfirmModal } from "../../components/general/ConfirmModal";
import {
  saveFilterState,
  getFilterState,
  saveSelectedSheetId,
  getSelectedSheetId,
  clearSelectedSheetId,
  clearFilterState,
} from "../../utils/navigationState";
import LoadingSpinner from "../../components/general/LoadingSpinner";
import { SmartSearchBar } from "../../components/general/SmartSearchBar";

// Redux actions
import {
  fetchChangeModel,
  getSheetByFilter,
  updateSheetStatus,
  returnSheetToPending,
  getSheetStatusHistory,
} from "../../redux/slices/changeModelSlice";
import type { ChangeModelResponse } from "../../redux/slices/changeModelSlice";
import { useTranslation } from "react-i18next";

// ==================== CONSTANTS ====================
const ROLES = {
  PQC: "PQC",
  ENG: "ENG",
  SUPERVISOR: "Supervisior",
  MANAGER: "Manager",
  KOREA_MANAGER: "KoreaManager",
  PQCLEADER: "PQCLeader",
} as const;

const STATUS = {
  PENDING: "pending",
  PQC_DONE: "PQCDone",
  PQCLEADER_DONE: "PQCLeaderDone",
  ENG_DONE: "ENGDone",
  SUPERVISOR_DONE: "SupervisiorDone",
  MANAGER_DONE: "ManagerDone",
  KOREA_MANAGER_DONE: "KoreaManagerDone",
} as const;

// ==================== TYPES ====================
type SheetFilter = {
  workOrder: string;
  fromDate: string;
  toDate: string;
  status: string;
  fcode: string;
  id: number;
  createrName: string;
};

  function saveLogsSession(data: object) {
    try { sessionStorage.setItem('logs_filter_state', JSON.stringify(data)); } catch (e) { console.warn("saveLogsSession error:", e); }
  }
  function readLogsSession(): any {
    try { return JSON.parse(sessionStorage.getItem('logs_filter_state') || '{}'); } catch { return {}; }
  }
  function clearLogsSession() {
    try { sessionStorage.removeItem('logs_filter_state'); } catch (e) { console.warn("clearLogsSession error:", e); }
  }

const Logs = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const {
    filteredSheets,
    loadingList,
    error: sheetError,
  } = useAppSelector((state) => state.changeModel);

  // ==================== STATE ====================
  const resultsRef = useRef<HTMLDivElement>(null);
  const pendingRestoreHighlightRef = useRef<number | null>(null);
  const isNavigatingToDetailRef = useRef(false);
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [searchParams] = useSearchParams();
  // const statusFromUrl = searchParams.get('status');
  const { t } = useTranslation("logs");
  const { t: t2 } = useTranslation("sheetDetail");
  const { lcrValidation } = useAppSelector((state) => state.fileSlice);

  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [deletingSheetId, setDeletingSheetId] = useState<number | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    open: boolean;
    sheet: ChangeModelResponse | null;
  }>({
    open: false,
    sheet: null,
  });
  const [confirmReturnModal, setConfirmReturnModal] = useState<{
    open: boolean;
    sheet: ChangeModelResponse | null;
  }>({ open: false, sheet: null });

  // Filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: "",
    fromDate: "",
    toDate: "",
    fcode: "",
    id: 0,
    status: "all",
    createrName: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;
  const [confirmingSheetId, setConfirmingSheetId] = useState<number | null>(
    null,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Candidates cho FuzzySearchInput
  const candidatesRef = useRef<{
    fcode: string[];
    workOrder: string[];
    createrName: string[];
    id: string[];
  }>({ fcode: [], workOrder: [], createrName: [], id: [] });
  const [, setCandidatesTick] = useState(0);

  // Load sheets với filter được truyền vào (không dùng state)
  const loadSheetsWithFilter = async (filterToUse: SheetFilter) => {
    try {
      const hasWorkOrder = filterToUse.workOrder.trim() !== "";
      const hasDateRange =
        filterToUse.fromDate !== "" && filterToUse.toDate !== "";
      const hasStatus =
        filterToUse.status !== "" && filterToUse.status !== "all";
      const hasFcode = filterToUse.fcode.trim() !== "";
      const hasId = filterToUse.id && filterToUse.id > 0;
      const hasCreaterName = filterToUse.createrName?.trim() !== '';

      if (hasWorkOrder || hasDateRange || hasStatus || hasFcode || hasId || hasCreaterName) {
        const filterParams: any = {
          workOrder: hasWorkOrder ? filterToUse.workOrder.trim() : undefined,
          fromDate: hasDateRange
            ? formatDateTimeForAPI(filterToUse.fromDate)
            : undefined,
          toDate: hasDateRange
            ? formatDateTimeForAPI(filterToUse.toDate)
            : undefined,
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

      await dispatch(fetchChangeModel()).unwrap();
    } catch (error: any) {
      console.error("❌ Lỗi khi tải sheets:", error);
      if (error?.message) {
        alert(`Lỗi: ${error.message}`);
      }
    }
  };

  // EFFECT 1: Load initial data hoặc restore saved state
  useEffect(() => {
    const savedState = getFilterState();
    const navigationState = (location.state as any) || {};
    const comingFromSheetDetail = navigationState?.from === "sheetDetail";

    const highlightFromState = Number(navigationState?.highlightSheetId || 0);
    const savedSheetId = highlightFromState || getSelectedSheetId();

    // Restore highlight nếu có. Khi back từ SheetDetail, chỉ đánh dấu pending để effect
    // bên dưới tự tìm đúng page + scroll sau khi table render xong.
    if (savedSheetId) {
      setSelectedSheetId(Number(savedSheetId));
      pendingRestoreHighlightRef.current = Number(savedSheetId);
    }

    // Kiểm tra xem có status và workOrder từ URL không
    const statusFromUrl = searchParams.get("status");
    const workOrderFromUrl = searchParams.get("workOrder");

    // Priority 1: workOrder URL param
    if (workOrderFromUrl && !comingFromSheetDetail) {
      const newFilter = { ...filter, workOrder: workOrderFromUrl };
      setFilter(newFilter);
      setCurrentPage(0);
      setTimeout(() => {
        dispatch(getSheetByFilter({ workOrder: workOrderFromUrl })).unwrap();
      }, 100);
      return;
    }

    // Priority 2: URL params từ Dashboard
    if (statusFromUrl && !comingFromSheetDetail) {
      const newFilter = {
        ...filter,
        status: statusFromUrl,
        workOrder: "",
        fromDate: "",
        toDate: "",
        fcode: "",
        id: 0,
      };

      setFilter(newFilter);
      setCurrentPage(0);

      setTimeout(() => {
        dispatch(getSheetByFilter({ status: statusFromUrl }))
          .unwrap()
          .then(() => {
            saveFilterState(newFilter, 0);
          })
          .catch((error: any) => {
            console.error("❌ Lỗi khi fetch sheets:", error);
            showNotification(
              "error",
              "Lỗi",
              error.message || t("error.cannotLoadSheets"),
            );
          });
      }, 100);

      return;
    }

    // Priority 3: Back từ SheetDetail
    if (comingFromSheetDetail) {
      const restoreFilter = savedState.filter || navigationState?.savedFilter;
      const restorePage =
        typeof savedState.currentPage === "number"
          ? savedState.currentPage
          : typeof navigationState?.savedPage === "number"
            ? navigationState.savedPage
            : 0;

      if (restoreFilter) {
        console.log("🔄 Restoring from SheetDetail:", {
          filter: restoreFilter,
          currentPage: restorePage,
          highlightSheetId: savedSheetId,
        });

        setFilter(restoreFilter);
        setCurrentPage(restorePage);
        // Dữ liệu danh sách vẫn còn trong Redux store khi quay lại từ SheetDetail.
        // Với ~4000 sheet, gọi lại API rất chậm => chỉ fetch khi store rỗng.
        // Effect highlight/scroll bên dưới tự chạy dựa trên dữ liệu sẵn có.
        if (!filteredSheets || filteredSheets.length === 0) {
          setTimeout(() => {
            loadSheetsWithFilter(restoreFilter);
          }, 100);
        }
        return;
      }
    }

    // Priority 4: Reload trang (F5)
    const hasSavedState =
      savedState.filter && Object.keys(savedState.filter).length > 0;

    if (hasSavedState) {
      console.log("🔄 Restoring from reload:", savedState);

      setFilter(savedState.filter);
      setCurrentPage(savedState.currentPage || 0);

      setTimeout(() => {
        loadSheetsWithFilter(savedState.filter);
      }, 100);

      return;
    }

    // Priority 5: restore session khi user quay lại Logs bình thường
    const logsSession = readLogsSession();
    if (logsSession.filter && Object.keys(logsSession.filter).length > 0) {
      setFilter(logsSession.filter);
      setCurrentPage(logsSession.currentPage || 0);
      setTimeout(() => loadSheetsWithFilter(logsSession.filter), 100);
      return;
    }

    // Priority 6: Load all
    loadSheets();
  }, []);

  // clear state khi reload hoặc close tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearFilterState();
      clearSelectedSheetId();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Clear state khi unmount (chuyển tab khác)
  useEffect(() => {
    return () => {
      // Chỉ giữ lại nếu đang navigate đến SheetDetail hoặc Files
      const keepStateRoutes = ["/sheet-detail", "/files"];
      const shouldKeepState = keepStateRoutes.some((route) =>
        window.location.pathname.includes(route),
      );

      if (!isNavigatingToDetailRef.current && !shouldKeepState) {
        clearFilterState();
        clearSelectedSheetId();
      }
    };
  }, []);


  // Cập nhật candidates từ filteredSheets (chỉ khi không có text filter)
  useEffect(() => {
    if (!filteredSheets || filteredSheets.length === 0) return;
    const hasTextFilter = filter.workOrder.trim() || filter.fcode.trim() || filter.createrName.trim();
    if (hasTextFilter) return;

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

  // Auto save session khi filter/page thay đổi
  useEffect(() => {
    saveLogsSession({ filter, currentPage });
  }, [filter, currentPage]);

  // ==================== LOAD SHEETS ====================
  const loadSheets = async () => {
    await loadSheetsWithFilter(filter);
  };

  const resetFilter = async () => {
    clearLogsSession();
    candidatesRef.current = { fcode: [], workOrder: [], createrName: [], id: [] };
    setCandidatesTick(0);
    setFilter({
      workOrder: "",
      fromDate: "",
      toDate: "",
      id: 0,
      fcode: "",
      status: "all",
      createrName: "",
    });
    try {
      await dispatch(fetchChangeModel()).unwrap();
      setCurrentPage(0);
    } catch (error) {
      console.error("❌ Lỗi khi reset filter:", error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    let parsedValue = value;
    if (key === 'id') {
      parsedValue = value === '' ? 0 : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
    }
    const newFilter = { ...filter, [key]: parsedValue };
    setFilter(newFilter);
    setCurrentPage(0);
    saveLogsSession({ filter: newFilter, currentPage: 0 });

    // Validate date range — chỉ call API khi cả 2 ngày hợp lệ hoặc không có ngày nào
    if (key === 'fromDate' || key === 'toDate') {
      const from = key === 'fromDate' ? parsedValue : filter.fromDate;
      const to = key === 'toDate' ? parsedValue : filter.toDate;
      if ((from && !to) || (!from && to)) return; // Chờ nhập đủ cả 2
      if (from && to && new Date(from) > new Date(to)) {
        showNotification("warning", t("warning.invalidDateRange"));
        return;
      }
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadSheetsWithFilter(newFilter);
    }, 400);
  };

  // ==================== VIEW HANDLERS ====================
  // Cập nhật handleViewDetail để save navigation và chuyển trang trực tiếp
  const handleViewDetail = (sheet: ChangeModelResponse) => {
    isNavigatingToDetailRef.current = true;

    // Save current state TRƯỚC KHI navigate
    saveFilterState(filter, currentPage);
    saveSelectedSheetId(sheet.id);

    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const roleLower = user?.role?.toLowerCase();
    navigate(`/${roleLower}/sheet-detail/${sheet.id}`, {
      state: {
        from: "logs",
        returnPath: currentPath,
        returnSearch: currentSearch,
      },
    });
  };

  // ==================== CONFIRMATION LOGIC ====================
  const canConfirmAtStep = (
    sheet: ChangeModelResponse,
    role: string,
  ): boolean => {
    if (!user || user.role !== role) return false;
    const status = sheet.status?.toLowerCase();

    switch (role) {
      case ROLES.PQC:
        // PQC chỉ được ký sheet do chính mình tạo (so khớp người tạo).
        return (
          status === STATUS.PENDING.toLowerCase() &&
          (sheet.account?.id === user.id ||
            sheet.account?.userName === user.username)
        ); // PQC ký khi Pending của chính mình

      case ROLES.PQCLEADER:
        return status === STATUS.PQC_DONE.toLowerCase(); // PQCLeader ký sau PQC
      case ROLES.ENG:
        return status === STATUS.PQCLEADER_DONE.toLowerCase(); // ENG ký sau PQCLeader
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

  const checkRequiredFiles = (
    sheet: ChangeModelResponse,
  ): { hasLCR: boolean; hasReflow: boolean } => {
    return {
      hasLCR: !!(sheet.excelFileUrl && sheet.excelFileUrl.trim() !== ""),
      hasReflow: !!(sheet.pdfFileUrl && sheet.pdfFileUrl.trim() !== ""),
    };
  };

  const handleConfirmStep = async (
    sheetId: number,
    role:
      | typeof ROLES.PQC
      | typeof ROLES.PQCLEADER
      | typeof ROLES.ENG
      | typeof ROLES.SUPERVISOR
      | typeof ROLES.MANAGER
      | typeof ROLES.KOREA_MANAGER,
  ) => {
    if (confirmingSheetId === sheetId) return;

    try {
      setConfirmingSheetId(sheetId);
      setSelectedSheetId(null);
      clearSelectedSheetId();

      if (!user) {
        showNotification("error", t("error.invalidUser"));
        return;
      }

      const sheet = filteredSheets?.find((s) => s.id === sheetId);
      if (!sheet) return;

      if (!canConfirmAtStep(sheet, role)) {
        showNotification("error", t("error.noPermission"));
        return;
      }

      if (role === ROLES.PQCLEADER) {
        const { hasLCR, hasReflow } = checkRequiredFiles(sheet);

        if (!hasLCR || !hasReflow) {
          showNotification(
            "warning",
            "Thiếu File Bắt Buộc",
            "Vui lòng upload đầy đủ các file: lcr file, reflow file trước khi ký xác nhận.",
          );
          return;
        }

        if (!lcrValidation || !lcrValidation.isValid) {
          const errorDetail = lcrValidation?.stats
            ? `\n\nChi tiết: OK=${lcrValidation.stats.ok}, NG=${lcrValidation.stats.ng}, SKIP=${lcrValidation.stats.skip}`
            : "";

          showNotification(
            "error",
            "LCR File Không Hợp Lệ",
            `${lcrValidation?.errorMessage || "File LCR phải có 100% kết quả OK"}${errorDetail}\n\nVui lòng xem chi tiết và upload lại file.`,
          );
          return;
        }
      }

      await dispatch(updateSheetStatus(sheetId)).unwrap();

      const roleNames: Record<string, string> = {
        [ROLES.PQCLEADER]: "PQC Leader",
        [ROLES.ENG]: "Engineering",
        [ROLES.SUPERVISOR]: "Supervisor",
        [ROLES.MANAGER]: "Manager",
        [ROLES.KOREA_MANAGER]: "Korea Manager",
      };
      showNotification("success", `${t("success.confirmed")} ${roleNames[role]}!`);

      // Reload history và list — selectedSheet sẽ tự sync qua useEffect
      await dispatch(getSheetStatusHistory(sheetId)).unwrap();
      await loadSheets();

    } catch (error: any) {
      console.error("Error confirming sheet:", error);
      showNotification(
        "error",
        t("error.loadSheetsFailed"),
        error || t("error.confirmFailed"),
      );
    } finally {
      setConfirmingSheetId(null);
    }
  };

  // ==================== UTILITIES ====================
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTimeForAPI = (datetimeLocal: string): string => {
    if (!datetimeLocal) return "";

    const date = new Date(datetimeLocal);

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${month}-${day}-${year} ${hours}:${minutes}`;
  };


  const canDelete = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;
    // Chỉ PQCLeader mới có quyền xóa
    if (user.role !== ROLES.PQCLEADER) return false;
    const status = sheet.status?.toLowerCase();
    // Chỉ được xóa khi status là PQCDone (PQC đã ký xong, nhưng PQCLeader chưa ký)
    return status === STATUS.PQC_DONE.toLowerCase() || status === STATUS.PENDING.toLowerCase();
  };

  const canReturnToPending = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;
    if (user.role !== ROLES.PQCLEADER) return false;
    return sheet.status?.toLowerCase() === STATUS.PQC_DONE.toLowerCase();
  };

  const handleReturnToPending = async (sheet: ChangeModelResponse) => {
    try {
      setConfirmingSheetId(sheet.id);
      await dispatch(returnSheetToPending({ sheetId: sheet.id })).unwrap();
      showNotification("success", `Sheet #${sheet.id} đã được trả về Pending`);
      await loadSheets();
    } catch (error: any) {
      showNotification("error", "Lỗi", error || "Không thể trả sheet về Pending");
    } finally {
      setConfirmingSheetId(null);
    }
  };

  const handleDeleteSheet = async () => {
    if (!confirmDeleteModal.sheet) return;
    const sheetId = confirmDeleteModal.sheet.id;

    try {
      setDeletingSheetId(sheetId); // Set loading state

      await dispatch(deleteSheetById(sheetId)).unwrap();

      showNotification("success", `Bạn đã xóa sheet: ${sheetId}`);

      // Đóng modal
      setConfirmDeleteModal({ open: false, sheet: null });

      // Reload lại danh sách sau khi xóa
      await loadSheets();

      // Reset về trang đầu nếu trang hiện tại không còn items
      const remainingItems = sortedSheets.length - 1;
      const newPageCount = Math.ceil(remainingItems / itemsPerPage);
      if (currentPage >= newPageCount && newPageCount > 0) {
        setCurrentPage(newPageCount - 1);
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi xóa sheet:", error);
      showNotification(
        "error",
        t("error.title"),
        error || t("error.deleteSheetFailed"),
      );
    } finally {
      setDeletingSheetId(null); // Clear loading state
    }
  };

  // Handler mở modal xác nhận
  const openDeleteConfirm = (sheet: ChangeModelResponse) => {
    setConfirmDeleteModal({
      open: true,
      sheet: sheet,
    });
  };

  // Handler đóng modal
  const closeDeleteConfirm = () => {
    setConfirmDeleteModal({ open: false, sheet: null });
  };

  const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();

    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string; icon: string }
    > = {
      [STATUS.PENDING.toLowerCase()]: {
        bg: "bg-yellow-100",
        text: "text-yellow-600",
        label: "Pending",
        icon: "",
      },
      [STATUS.PQC_DONE.toLowerCase()]: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "PQC Done",
        icon: "✓",
      },
      [STATUS.PQCLEADER_DONE.toLowerCase()]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "PQC Leader Done",
        icon: "✓",
      },
      [STATUS.ENG_DONE.toLowerCase()]: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "ENG Done",
        icon: "✓",
      },
      [STATUS.SUPERVISOR_DONE.toLowerCase()]: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "SUP Done",
        icon: "✓",
      },
      [STATUS.MANAGER_DONE.toLowerCase()]: {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "MGR Done",
        icon: "✓",
      },
      [STATUS.KOREA_MANAGER_DONE.toLowerCase()]: {
        bg: "bg-teal-100",
        text: "text-teal-700",
        label: "KMGR Done",
        icon: "✓",
      },
    };

    const config = statusConfig[status || STATUS.PENDING.toLowerCase()] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: status || "Unknown",
      icon: "❓",
    };

    return (
      <div
        className={`inline-flex items-center gap-1 ${config.bg} ${config.text} rounded-full px-3 py-1 text-xs font-semibold`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  const canUserSignSheet = (sheet: ChangeModelResponse): boolean => {
    if (!user || !user.role) return false;
    return canConfirmAtStep(sheet, user.role);
  };

  // ==================== PAGINATION ====================
  // Chuẩn hóa status để so sánh (xử lý cả typo lịch sử "PQCLeaderLDone").
  const normalizeStatus = (s?: string) =>
    (s || "").toLowerCase().replace("pqcleaderldone", "pqcleaderdone");

  const sortedSheets = useMemo(() => {
    let list = [...(filteredSheets || [])];

    // Khi đang lọc theo 1 status cụ thể, ẩn các sheet mà status hiện tại
    // KHÔNG còn khớp với bộ lọc. Cần thiết vì khi quay lại từ trang chi tiết,
    // danh sách KHÔNG được gọi lại API (để tối ưu cho ~4000 sheet) mà chỉ
    // được merge status mới vào cache trong Redux. Nếu không lọc lại ở client,
    // một sheet vừa được ký (ví dụ PQCDone -> PQCLeaderDone) vẫn còn nằm trong
    // cache và sẽ tiếp tục hiển thị dưới bộ lọc PQCDone. Lọc client-side ở đây
    // giúp sheet đó biến mất ngay khi trạng thái thay đổi.
    if (filter.status && filter.status !== "all") {
      const want = normalizeStatus(filter.status);
      list = list.filter((s) => normalizeStatus(s.status) === want);
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.createAt || 0).getTime();
      const dateB = new Date(b.createAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredSheets, filter.status]);

  const pageCount = Math.ceil(sortedSheets.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentSheets = sortedSheets.slice(offset, offset + itemsPerPage);

  // Restore highlight sau khi back từ SheetDetailViewer.
  // Chỉ chạy một lần, sau khi list đã load và DOM đã render đúng page.
  useEffect(() => {
    const targetId = pendingRestoreHighlightRef.current;
    if (!targetId || loadingList || sortedSheets.length === 0) return;

    const targetIndex = sortedSheets.findIndex(
      (sheet) => Number(sheet.id) === Number(targetId),
    );

    if (targetIndex === -1) return;

    const targetPage = Math.floor(targetIndex / itemsPerPage);

    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      return;
    }

    let attempt = 0;
    const maxAttempts = 30;
    let timer: number | null = null;

    const tryScroll = () => {
      const row = document.getElementById(`sheet-row-${targetId}`);

      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });

        // Tắt restore ngay sau khi scroll xong để pagination hoạt động bình thường.
        pendingRestoreHighlightRef.current = null;

        window.setTimeout(() => {
          setSelectedSheetId(null);
          clearSelectedSheetId();
        }, 2500);

        return;
      }

      attempt += 1;
      if (attempt < maxAttempts) {
        timer = window.setTimeout(tryScroll, 80);
      } else {
        pendingRestoreHighlightRef.current = null;
      }
    };

    timer = window.setTimeout(tryScroll, 80);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [loadingList, sortedSheets, currentPage]);

  const handlePageChange = (selectedItem: { selected: number }) => {
    // User tự chuyển page thì dừng restore highlight, tránh bị ép quay lại page cũ.
    pendingRestoreHighlightRef.current = null;
    setSelectedSheetId(null);
    clearSelectedSheetId();

    setCurrentPage(selectedItem.selected);

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };





  // ==================== LIST VIEW ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 text-center!">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {t("title")}
            </h1>
            <div className="text-sm text-gray-600">
              {t("role")}: <span className="font-semibold">{user?.role}</span>
            </div>
          </div>

          {/* Info banner */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800 text-center mb-0">
              {user?.role === ROLES.PQCLEADER &&
                "Bạn có thể xem và ký xác nhận sheet khi PQC đã hoàn thành"}
              {user?.role === ROLES.ENG && t("info.eng")}
              {user?.role === ROLES.SUPERVISOR && t("info.supervisor")}
              {user?.role === ROLES.MANAGER && t("info.manager")}
              {user?.role === ROLES.KOREA_MANAGER && t("info.koreaManager")}
              {user?.role === "Admin" && t("info.admin")}
            </p>
          </div>

          {/* SEARCH FILTERS */}
          <SmartSearchBar
            fields={[
              { key: 'id', label: t("search.id"), placeholder: t("search.placeholder.id"), candidates: candidatesRef.current.id },
              { key: 'fcode', label: t("search.fcode"), placeholder: t("search.placeholder.fcode"), candidates: candidatesRef.current.fcode },
              { key: 'workOrder', label: t("search.workOrder"), placeholder: t("search.placeholder.workOrder"), candidates: candidatesRef.current.workOrder },
              { key: 'createrName', label: t("search.createrName"), placeholder: t("search.placeholder.createrName"), candidates: candidatesRef.current.createrName },
              {
                key: 'status', label: t("search.status"), type: 'select' as const,
                options: [
                  { value: 'all', label: t("status.all") },
                  { value: STATUS.PENDING, label: t("status.pending") },
                  { value: STATUS.PQC_DONE, label: t("status.pqcDone") },
                  { value: STATUS.PQCLEADER_DONE, label: t("status.pqcLeaderDone") },
                  { value: STATUS.ENG_DONE, label: t("status.engDone") },
                  { value: STATUS.SUPERVISOR_DONE, label: t("status.supervisorDone") },
                  { value: STATUS.MANAGER_DONE, label: t("status.managerDone") },
                  { value: STATUS.KOREA_MANAGER_DONE, label: t("status.koreaManagerDone") },
                ],
              },
              { key: 'fromDate', label: t("search.fromDate"), type: 'datetime-local' as const },
              { key: 'toDate', label: t("search.toDate"), type: 'datetime-local' as const },
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

          {/* Error Message */}
          {sheetError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700 text-sm">❌ {sheetError}</p>
            </div>
          )}

          {/* Results */}
          {loadingList ? (
            <LoadingSpinner size="sm" message={t("search.button.searching")} />
          ) : currentSheets.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineClockCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {sortedSheets.length === 0 ? "" : t("empty.noSheets")}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {sortedSheets.length === 0
                  ? user?.role === ROLES.PQC
                    ? t("empty.createNew")
                    : t("empty.waitPQC")
                  : t("empty.changeFilter")}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        STT
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        {t("table.sheetId")}
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        WorkOrder
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        {t("table.createdBy")}
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                        {t("table.createTime")}
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">
                        {t("table.status")}
                      </th>
                      <th
                        onMouseDown={(e) => e.preventDefault()}
                        className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 select-none"
                      >
                        {t("button.signConfirm")}
                      </th>
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">
                        {t("table.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheets.map((sheet, index) => (
                      <tr
                        key={sheet.id}
                        id={`sheet-row-${sheet.id}`}
                        onClick={() => handleViewDetail(sheet)}
                        className={`cursor-pointer transition-all duration-500 ${selectedSheetId === sheet.id
                          ? "bg-blue-100 border-2 border-blue-400! shadow-lg" // Highlight style
                          : "hover:bg-gray-50 border-transparent"
                          }`}
                      >
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 text-center">
                          {offset + index + 1}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          <span className="font-semibold text-blue-600">
                            #{sheet.id}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          <span
                            className={`font-semibold ${sheet.checkModel?.workOrder ? "text-blue-600" : "text-gray-400"}`}
                          >
                            {sheet.checkModel?.workOrder || t2("noWorkOrder")}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {sheet.account?.fullName ||
                                sheet.account?.userName}
                            </span>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              ({sheet.account?.role})
                            </span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                          {formatDateTime(sheet.createAt)}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center">
                          {getStatusBadge(sheet)}
                        </td>
                        <td
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.preventDefault()}
                          className="border border-gray-300 px-2 sm:px-4 py-3 text-center select-none"
                        >
                          {canUserSignSheet(sheet) ? (
                            <button
                              onClick={() => {
                                if (user?.role) {
                                  handleConfirmStep(sheet.id, user.role as any);
                                }
                              }}
                              disabled={confirmingSheetId === sheet.id}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-orange-400 
           text-white rounded hover:bg-orange-300 transition-colors text-xs 
           font-semibold whitespace-nowrap shadow-md hover:shadow-lg
           disabled:opacity-60 disabled:cursor-not-allowed"
                              title="Ký xác nhận sheet này"
                            >
                              {confirmingSheetId === sheet.id ? (
                                <>
                                  <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                                  <span>Signing...</span>
                                </>
                              ) : (
                                <>
                                  <AiOutlineCheckCircle className="w-4 h-4" />
                                  <span>{t("button.sign")}</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {t("button.signFailed")}
                            </span>
                          )}
                        </td>
                        <td 
                          onClick={(e) => e.stopPropagation()}
                          className="border border-gray-300 px-2 sm:px-4 py-3 text-center select-none"
                        >
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={() => handleViewDetail(sheet)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                              <AiOutlineEye className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{t("button.view")}</span>
                            </button>


                            {canDelete(sheet) && (
                              <button
                                onClick={() => openDeleteConfirm(sheet)}
                                className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium whitespace-nowrap"
                                title="Xóa Sheet"
                              >
                                <AiOutlineClose className="w-3 h-3" />
                                <span>Xóa Sheet</span>
                              </button>
                            )}

                            {canReturnToPending(sheet) && (
                              <button
                                onClick={() => setConfirmReturnModal({ open: true, sheet })}
                                className="inline-flex items-center justify-center gap-1 px-2 py-2 
                                  bg-amber-500 text-white rounded hover:bg-amber-600 
                                  transition-colors text-xs font-medium whitespace-nowrap"
                                title="Trả sheet về Pending để PQC chỉnh sửa lại"
                              >
                                <MdKeyboardReturn className="w-4 h-4" />
                                <span>Trả về</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden my-4">
                {currentSheets.map((sheet, index) => (
                  <div
                    key={sheet.id}
                    id={`sheet-row-${sheet.id}`} // Thêm ID để scroll
                    onClick={() => handleViewDetail(sheet)}
                    className={`cursor-pointer border border-gray-200 rounded-lg shadow-sm p-4 mb-4 transition-all duration-500 ${selectedSheetId === sheet.id
                      ? "bg-yellow-50 border-yellow-400 shadow-xl ring-2 ring-yellow-300" // Mobile highlight
                      : "bg-white"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">
                          #{offset + index + 1}
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          Sheet #{sheet.id}
                        </span>
                      </div>
                      <div>{getStatusBadge(sheet)}</div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-200 flex items-center flex-row gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">
                          {t("table.createdBy")}:
                        </span>
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

                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AiOutlineCalendar className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">
                          {t("table.createTime")}
                        </span>
                      </div>
                      <div className="pl-6 text-sm text-gray-900">
                        {formatDateTime(sheet.createAt)}
                      </div>
                    </div>

                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="flex lg:flex-row md:flex-row flex-col gap-2 select-none"
                    >
                      <button
                        onClick={() => handleViewDetail(sheet)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <AiOutlineEye className="w-4 h-4" />
                        <span>{t("button.view")}</span>
                      </button>
                      {canUserSignSheet(sheet) && (
                        <button
                          onClick={() => {
                            if (user?.role) {
                              handleConfirmStep(sheet.id, user.role as any);
                            }
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          disabled={confirmingSheetId === sheet.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 select-none
                          bg-orange-600 text-white rounded-lg hover:bg-orange-700 
                          transition-colors text-sm font-semibold shadow-md
                          disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {confirmingSheetId === sheet.id ? (
                            <>
                              <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                              <span>Signing...</span>
                            </>
                          ) : (
                            <>
                              <AiOutlineCheckCircle className="w-4 h-4" />
                              <span>{t("button.sign")}</span>
                            </>
                          )}
                        </button>
                      )}


                      {canDelete(sheet) && (
                        <button
                          onClick={() => openDeleteConfirm(sheet)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-medium whitespace-nowrap"
                          title="Xóa Sheet"
                        >
                          <AiOutlineClose className="w-4 h-4" />
                          <span>Xóa Sheet</span>
                        </button>
                      )}

                      {canReturnToPending(sheet) && (
                        <button
                          onClick={() => setConfirmReturnModal({ open: true, sheet })}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 
                            bg-amber-500 text-white rounded-lg hover:bg-amber-600 
                            transition-colors text-sm font-semibold"
                        >
                          <MdKeyboardReturn className="w-4 h-4" />
                          <span>Trả về</span>
                        </button>
                      )}                
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
                        previousLabel={t("pagination.previous")}
                        nextLabel={t("pagination.next")}
                        breakLabel={"..."}
                        pageCount={pageCount}
                        marginPagesDisplayed={1}
                        pageRangeDisplayed={2}
                        onPageChange={handlePageChange}
                        forcePage={currentPage}
                        containerClassName={
                          "flex items-center lg:justify-center md:justify-center gap-1 sm:gap-2 px-2 min-w-max sm:px-0"
                        }
                        pageLinkClassName={
                          "px-3 py-2 sm:px-3 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-blue-50 hover:ring-blue-500 transition-all text-xs sm:text-sm font-medium no-underline!"
                        }
                        previousLinkClassName={
                          "px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline!"
                        }
                        nextLinkClassName={
                          "px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline!"
                        }
                        breakLinkClassName={
                          "px-1 sm:px-3 py-1.5 sm:py-2 text-gray-500 text-xs sm:text-sm no-underline"
                        }
                        activeLinkClassName={
                          "!bg-blue-600 !text-white !ring-blue-600 no-underline"
                        }
                        disabledClassName={"opacity-50 cursor-not-allowed"}
                        disabledLinkClassName={
                          "!cursor-not-allowed hover:!bg-transparent no-underline"
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteModal.open}
        title="Xác nhận xóa Sheet"
        message={
          confirmDeleteModal.sheet
            ? `Bạn có chắc muốn xóa Sheet #${confirmDeleteModal.sheet.id}?\n\n` +
            `WorkOrder: ${confirmDeleteModal.sheet.checkModel?.workOrder || "N/A"}\n` +
            `hành động này sẽ không thể hoàn tác !!!`
            : ""
        }
        confirmText={deletingSheetId ? "Đang Xóa" : "Xóa"}
        cancelText="Hủy"
        onConfirm={handleDeleteSheet}
        onCancel={closeDeleteConfirm}
        type="danger"
      />

      <ConfirmModal
        open={confirmReturnModal.open}
        title="Trả sheet về Pending"
        message={
          confirmReturnModal.sheet
            ? `Trả Sheet #${confirmReturnModal.sheet.id} về Pending?\n\n` +
              `WorkOrder: ${confirmReturnModal.sheet.checkModel?.workOrder || "N/A"}\n` +
              `PQC sẽ cần ký lại từ đầu.`
            : ""
        }
        confirmText="Trả về"
        cancelText="Hủy"
        onConfirm={() => {
          if (confirmReturnModal.sheet) {
            handleReturnToPending(confirmReturnModal.sheet);
            setConfirmReturnModal({ open: false, sheet: null });
          }
        }}
        onCancel={() => setConfirmReturnModal({ open: false, sheet: null })}
        type="warning"
      />
    </div>
  );
};

export default Logs;