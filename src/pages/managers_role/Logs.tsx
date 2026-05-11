/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/Logs.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  AiOutlineEye,
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineCalendar,
  AiOutlineEdit,
  AiOutlineClose,
  AiOutlineHistory,
  AiOutlineLoading3Quarters,
} from "react-icons/ai";
import { MdKeyboardReturn } from "react-icons/md";
import { FaRegUserCircle } from "react-icons/fa";
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
  clearStatusHistory,
} from "../../redux/slices/changeModelSlice";
import type { ChangeModelResponse } from "../../redux/slices/changeModelSlice";
import { useTranslation } from "react-i18next";
import { getLcrFileData, clearLcrFile } from "../../redux/slices/FileSlice";

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
    try { sessionStorage.setItem('logs_filter_state', JSON.stringify(data)); } catch { }
  }
  function readLogsSession(): any {
    try { return JSON.parse(sessionStorage.getItem('logs_filter_state') || '{}'); } catch { return {}; }
  }
  function clearLogsSession() {
    try { sessionStorage.removeItem('logs_filter_state'); } catch { }
  }

const Logs = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const {
    filteredSheets,
    loadingList,
    statusHistory,
    loadingHistory,
    error: sheetError,
  } = useAppSelector((state) => state.changeModel);

  // ==================== STATE ====================
  const [selectedSheet, setSelectedSheet] =
    useState<ChangeModelResponse | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
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
    const savedSheetId = getSelectedSheetId();

    // Restore highlight nếu có
    if (savedSheetId) {
      setSelectedSheetId(savedSheetId);
    }

    // Kiểm tra xem có status và workOrder từ URL không
    const statusFromUrl = searchParams.get("status");
    const workOrderFromUrl = searchParams.get('workOrder')

    // CHECK navigation state
    const navigationState = (location.state as any) || {};
    const comingFromSheetDetail = navigationState?.from === "sheetDetail";

    // check workOrder
    if (workOrderFromUrl && !comingFromSheetDetail) {
      const newFilter = { ...filter, workOrder: workOrderFromUrl }
      setFilter(newFilter)
      setCurrentPage(0)
      setTimeout(() => {
        dispatch(getSheetByFilter({ workOrder: workOrderFromUrl })).unwrap()
      }, 100)
      return
    }

    // Priority 1: URL params (từ Dashboard)
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

            if (savedSheetId) {
              setTimeout(() => {
                const row = document.getElementById(
                  `sheet-row-${savedSheetId}`,
                );
                if (row) {
                  row.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }, 300);
            }
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

    // Priority 2: Back từ SheetDetail (QUAN TRỌNG)
    if (comingFromSheetDetail && savedState.filter) {
      console.log("🔄 Restoring from SheetDetail:", savedState);

      setFilter(savedState.filter);
      setCurrentPage(savedState.currentPage);

      setTimeout(() => {
        loadSheetsWithFilter(savedState.filter);

        // Highlight và scroll đến sheet
        if (savedSheetId) {
          setTimeout(() => {
            const row = document.getElementById(`sheet-row-${savedSheetId}`);
            if (row) {
              row.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 500);
        }
      }, 100);

      return;
    }

    // Priority 3: Reload trang (F5)
    const hasSavedState =
      savedState.filter && Object.keys(savedState.filter).length > 0;

    if (hasSavedState) {
      console.log("🔄 Restoring from reload:", savedState);

      setFilter(savedState.filter);
      setCurrentPage(savedState.currentPage);

      setTimeout(() => {
        loadSheetsWithFilter(savedState.filter);

        if (savedSheetId) {
          setTimeout(() => {
            const row = document.getElementById(`sheet-row-${savedSheetId}`);
            if (row) {
              row.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 500);
        }
      }, 100);

      return;
    }

    // Priority 4: check workOrder
    const logsSession = readLogsSession();
    if (logsSession.filter && Object.keys(logsSession.filter).length > 0) {
      setFilter(logsSession.filter);
      setCurrentPage(logsSession.currentPage || 0);
      setTimeout(() => loadSheetsWithFilter(logsSession.filter), 100);
      return;
    }

    // Priority 5: Load all
    loadSheets();

    if (savedSheetId) {
      setTimeout(() => {
        const row = document.getElementById(`sheet-row-${savedSheetId}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }

    // Clear highlight sau 2 giây
    if (savedSheetId) {
      const timer = setTimeout(() => {
        setSelectedSheetId(null);
        clearSelectedSheetId();
      }, 2000);
      return () => clearTimeout(timer);
    }
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

      if (!shouldKeepState) {
        clearFilterState();
        clearSelectedSheetId();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedSheet && filteredSheets?.length) {
      const updated = filteredSheets.find((s) => s.id === selectedSheet.id);
      if (updated && updated.status !== selectedSheet.status) {
        setSelectedSheet(updated);
      }
    }
  }, [filteredSheets]);

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
  // Cập nhật handleViewDetail để save navigation
  const handleViewDetail = async (sheet: ChangeModelResponse) => {
    // Save current state TRƯỚC KHI navigate
    saveFilterState(filter, currentPage);
    saveSelectedSheetId(sheet.id);

    setSelectedSheet(sheet);
    setShowDetail(true);

    try {
      await dispatch(getSheetStatusHistory(sheet.id)).unwrap();
      if (sheet.excelFileUrl && sheet.excelFileUrl.trim() !== "") {
        await dispatch(getLcrFileData(sheet.id)).unwrap();
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải history:", error);
    }
  };

  // Cập nhật handleCloseDetail
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedSheet(null);
    dispatch(clearStatusHistory());
    dispatch(clearLcrFile());
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
        return status === STATUS.PENDING.toLowerCase(); // PQC ký khi Pending
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

      await dispatch(
        updateSheetStatus({
          sheetId,
          currentStatus: sheet.status || STATUS.PENDING,
          userRole: role,
        }),
      ).unwrap();

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

  const canEdit = (sheet: ChangeModelResponse): boolean => {
    if (!user) return false;

    const status = sheet.status?.toLowerCase();

    // Chỉ check từng role riêng lẻ, không cần check !== các role khác
    if (user.role === ROLES.PQC && status === STATUS.PENDING.toLowerCase()) {
      return true;
    }

    // PQCLeader chỉ edit khi PQCDone
    if (
      user.role === ROLES.PQCLEADER &&
      status === STATUS.PQC_DONE.toLowerCase()
    ) {
      return true;
    }

    // ENG chỉ edit khi PQCLeaderDone
    if (
      user.role === ROLES.ENG &&
      status === STATUS.PQCLEADER_DONE.toLowerCase()
    ) {
      return true;
    }

    // SUPERVISOR chỉ edit khi ENGDone
    if (
      user.role === ROLES.SUPERVISOR &&
      status === STATUS.ENG_DONE.toLowerCase()
    ) {
      return true;
    }

    return false;
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
  const sortedSheets = useMemo(() => {
    return [...(filteredSheets || [])].sort((a, b) => {
      const dateA = new Date(a.createAt || 0).getTime();
      const dateB = new Date(b.createAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredSheets]);

  const pageCount = Math.ceil(sortedSheets.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentSheets = sortedSheets.slice(offset, offset + itemsPerPage);

  const handlePageChange = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ==================== DETAIL VIEW ====================
  if (showDetail && selectedSheet) {
    const getSignerInfo = (role: string) => {
      const history = Array.isArray(statusHistory) ? statusHistory : [];
      const historyItem = history?.find((item) => {
        const status = item.status?.toLowerCase();
        switch (role) {
          case ROLES.PQC:
            return status === STATUS.PQC_DONE.toLowerCase();
          case ROLES.PQCLEADER:
            return status === STATUS.PQCLEADER_DONE.toLowerCase();
          case ROLES.ENG:
            return status === STATUS.ENG_DONE.toLowerCase();
          case ROLES.SUPERVISOR:
            return status === STATUS.SUPERVISOR_DONE.toLowerCase();
          case ROLES.MANAGER:
            return status === STATUS.MANAGER_DONE.toLowerCase();
          case ROLES.KOREA_MANAGER:
            return status === STATUS.KOREA_MANAGER_DONE.toLowerCase();
          default:
            return false;
        }
      });
      return historyItem || null;
    };

    const roles = [
      { key: ROLES.PQC, label: "PQC" },
      { key: ROLES.PQCLEADER, label: "PQC Leader" },
      { key: ROLES.ENG, label: "Engineering" },
      { key: ROLES.SUPERVISOR, label: "Supervisor" },
      { key: ROLES.MANAGER, label: "Manager" },
      { key: ROLES.KOREA_MANAGER, label: "Korea Manager" },
    ];
    {
      /** DETAIL VIEW */
    }
    return (
      <div className="min-h-screen bg-gray-50 select-none">
        <Notification
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={hideNotification}
        />

        <div className="max-w-8xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col items-center mb-4 gap-2">
              <div className="text-3xl font-bold text-gray-800">
                {t("detail.title")}: #{selectedSheet.id}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <FaRegUserCircle className="w-5 h-5" />
                  <span className="text-sm text-gray-700">
                    <strong>{t("detail.createdBy")}:</strong>{" "}
                    {selectedSheet.account?.fullName ||
                      selectedSheet.account?.userName}{" "}
                    ({selectedSheet.account?.role})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AiOutlineCalendar className="w-5 h-5" />
                  <span className="text-sm text-gray-700">
                    <strong>{t("detail.time")}:</strong>{" "}
                    {formatDateTime(selectedSheet.createAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSheet)}
                </div>
              </div>

              {/* Tiến trình ký xác nhận - CẬP NHẬT PHẦN NÀY */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <strong className="text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <AiOutlineHistory className="w-5 h-5" />
                  {t("detail.signatureProgress")}:
                </strong>

                {loadingHistory ? (
                  <LoadingSpinner size="sm" message={t("detail.loading")} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {roles.map((role) => {
                      const signerInfo = getSignerInfo(role.key);
                      const isConfirmed = !!signerInfo;
                      const canConfirm = canConfirmAtStep(
                        selectedSheet,
                        role.key,
                      );

                      return (
                        <div
                          key={role.key}
                          className={`p-3 rounded-lg border-2 h-32 ${isConfirmed
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-300"
                            }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {isConfirmed ? (
                              <AiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AiOutlineClockCircle className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="font-semibold text-xs">
                              {role.label}
                            </span>
                          </div>

                          {isConfirmed && signerInfo ? (
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="text-green-700 font-medium">
                                ✓ {t("detail.confirmed")}
                              </div>
                              {/* HIỂN THỊ TÊN NGƯỜI KÝ */}
                              <div className="text-gray-700">
                                <strong>{t("detail.signer")}:</strong>
                                <br />
                                {signerInfo.account?.fullName ||
                                  signerInfo.account?.userName ||
                                  "N/A"}
                              </div>
                              {/* HIỂN THỊ THỜI GIAN KÝ */}
                              <div className="text-gray-500">
                                {formatDateTime(signerInfo.changedAt)}
                              </div>
                            </div>
                          ) : canConfirm ? (
                            <button
                              onClick={() => handleConfirmStep(selectedSheet.id, role.key)}
                              disabled={confirmingSheetId === selectedSheet.id}
                              className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded text-xs 
                                        font-medium hover:bg-blue-700 transition-colors
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                        inline-flex items-center justify-center gap-1">
                              {confirmingSheetId === selectedSheet.id ? (
                                <>
                                  <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
                                  <span>Signing...</span>
                                </>
                              ) : (
                                t("detail.signButton")
                              )}
                            </button>
                          ) : (
                            <div className="text-xs text-gray-400">
                              {t("detail.notConfirmed")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Nút xem toàn bộ sheet */}
            <div className="mt-4">
              <div className="text-center mb-4 flex items-start gap-3 justify-start">
                <button
                  onClick={handleCloseDetail}
                  className="px-4 py-3 bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                >
                  {t("button.back")}
                </button>
                <button
                  onClick={() => {
                    const currentPath = window.location.pathname;
                    const currentSearch = window.location.search;
                    const roleLower = user?.role?.toLowerCase();
                    saveFilterState(filter, currentPage);
                    saveSelectedSheetId(selectedSheet.id);
                    navigate(`/${roleLower}/sheet-detail/${selectedSheet.id}`, {
                      state: {
                        from: "logs",
                        returnPath: currentPath,
                        returnSearch: currentSearch,
                      },
                    });
                  }}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {t("button.viewFullSheet")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



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
                      <th className="border border-gray-300 px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold text-gray-700">
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
                        className={`transition-all duration-500 ${selectedSheetId === sheet.id
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
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center select-none">
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
                        <td className="border border-gray-300 px-2 sm:px-4 py-3 text-center select-none">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={() => handleViewDetail(sheet)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                              <AiOutlineEye className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{t("button.view")}</span>
                            </button>
                            {canEdit(sheet) && (
                              <button
                                onClick={() => {
                                  const currentPath = window.location.pathname;
                                  const currentSearch = window.location.search;
                                  const roleLower = user?.role?.toLowerCase();
                                  // Save state TRƯỚC KHI navigate
                                  saveFilterState(filter, currentPage);
                                  saveSelectedSheetId(sheet.id);
                                  navigate(
                                    `/${roleLower}/sheet-detail/${sheet.id}`,
                                    {
                                      state: {
                                        from: "logs",
                                        returnPath: currentPath,
                                        returnSearch: currentSearch,
                                      },
                                    },
                                  );
                                }}
                                className="inline-flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
                              >
                                <AiOutlineEdit className="w-4 h-4" />
                                <span>{t("button.edit")}</span>
                              </button>
                            )}

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
                    className={`border border-gray-200 rounded-lg shadow-sm p-4 mb-4 transition-all duration-500 ${selectedSheetId === sheet.id
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

                    <div className="flex lg:flex-row md:flex-row flex-col gap-2 select-none">
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
                          disabled={confirmingSheetId === sheet.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 
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
                      {canEdit(sheet) && (
                        <button
                          onClick={() => {
                            const currentPath = window.location.pathname;
                            const currentSearch = window.location.search;
                            const roleLower = user?.role?.toLowerCase();
                            saveSelectedSheetId(sheet.id);
                            navigate(`/${roleLower}/sheet-detail/${sheet.id}`, {
                              state: {
                                from: "logs",
                                returnPath: currentPath,
                                returnSearch: currentSearch,
                              }, // Truyền state
                            });
                          }}
                          className="inline-flex items-center justify-center gap-1 px-2 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
                        >
                          <AiOutlineEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{t("button.edit")}</span>
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
