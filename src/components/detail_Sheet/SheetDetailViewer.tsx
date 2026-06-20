/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { IoEyeSharp } from "react-icons/io5";
import { MdKeyboardReturn, MdModeEdit } from "react-icons/md";
import {
  clearAllSubTableData,
  addCompletedTable,
  setAllSubTableData,
} from "../../redux/slices/subTableSlice";
import {
  getSheetWithFullObject,
  updateSheetStatus,
  returnSheetToPending,
  clearError,
  type ChangeModelResponse,
  getSheetStatusHistory,
  clearStatusHistory,
  clearSheet,
} from "../../redux/slices/changeModelSlice";
import {
  getFilterState,
  getSelectedSheetId,
} from "../../utils/navigationState";
import {
  AiOutlineCheckCircle,
  AiOutlineClockCircle,
  AiOutlineHistory,
  AiOutlineLoading3Quarters,
} from "react-icons/ai";
import LoadingSpinner from "../general/LoadingSpinner";


// Import các sub-components
import CheckModels from "../smd_Sheet/CheckModels";
import PQCChecks from "../smd_Sheet/PQCChecks";
import SheetHeader from "../smd_Sheet/SheetHeader";
import StandardProductionSection from "../smd_Sheet/StandardProductions";
import StandardVehicles from "../smd_Sheet/StandardVehicles";
import TimeChangeModels from "../smd_Sheet/TimeChangeModels";
import { FaRegClock } from "react-icons/fa6";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { ConfirmModal } from "../general/ConfirmModal";
import {
  REQUIRED_FIELDS_CONFIG,
  hasAllRequiredData,
  getMissingFields,
} from "../../utils/requiredFieldsConfig";
import { useTranslation } from "react-i18next";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { clearLcrFile, getLcrFileData } from "../../redux/slices/FileSlice";
// import { saveFilterState } from '../../utils/navigationState';


const SheetDetailViewer = () => {
  const id = Number(useParams().id);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy saved state từ location
  const returnPath = (location.state as any)?.returnPath;
  // Lấy data từ Redux store
  const { currentSheet, loading, error, statusHistory, loadingHistory } = useAppSelector(
    (state) => state.changeModel,
  );
  const { user } = useAppSelector((state) => state.auth);
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation("sheetDetail");
  const { t: tLogs } = useTranslation("logs");

  const roles = [
    { key: "PQC", label: "PQC" },
    { key: "PQCLeader", label: "PQC Leader" },
    { key: "ENG", label: "Engineering" },
    { key: "Supervisior", label: "Supervisor" },
    { key: "Manager", label: "Manager" },
    { key: "KoreaManager", label: "Korea Manager" },
  ];

  const getSignerInfo = (roleKey: string) => {
    const history = Array.isArray(statusHistory) ? statusHistory : [];
    return history.find((item) => {
      const status = item.status?.toLowerCase();
      switch (roleKey) {
        case "PQC":
          return status === "pqcdone";
        case "PQCLeader":
          return status === "pqcleaderldone" || status === "pqcleaderdone";
        case "ENG":
          return status === "engdone";
        case "Supervisior":
          return status === "supervisiordone";
        case "Manager":
          return status === "managerdone";
        case "KoreaManager":
          return status === "koreamanagerdone";
        default:
          return false;
      }
    }) || null;
  };

  const canConfirmAtStep = (sheet: ChangeModelResponse, roleKey: string): boolean => {
    if (!user || user.role !== roleKey) return false;
    const status = sheet.status?.toLowerCase();
    switch (roleKey) {
      case "PQC":
        // PQC chỉ được ký sheet do chính mình tạo (so khớp người tạo).
        return (
          status === "pending" &&
          (sheet.account?.id === user.id ||
            sheet.account?.userName === user.username)
        );
      case "PQCLeader":
        return status === "pqcdone";
      case "ENG":
        return status === "pqcleaderdone";
      case "Supervisior":
        return status === "engdone";
      case "Manager":
        return status === "supervisiordone";
      case "KoreaManager":
        return status === "managerdone";
      default:
        return false;
    }
  };

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

  const contentRef = useRef<HTMLDivElement>(null);
  const { lcrValidation } = useAppSelector((state) => state.fileSlice);

  const [returningToPending, setReturningToPending] = useState(false);
  const [confirmReturnModal, setConfirmReturnModal] = useState(false);

  const canReturnToPending = (): boolean => {
    if (!user || !currentSheet) return false;
    if (user.role !== 'PQCLeader') return false;
    return currentSheet.status?.toLowerCase() === 'pqcdone';
  };

  const handleReturnToPending = async () => {
    if (!currentSheet) return;
    try {
      setReturningToPending(true);
      await dispatch(returnSheetToPending({ sheetId: currentSheet.id })).unwrap();
      showNotification('success', `Sheet #${currentSheet.id} đã được trả về Pending`);
      setConfirmReturnModal(false);
      // Reload lại sheet để UI đồng bộ
      await dispatch(getSheetWithFullObject(currentSheet.id)).unwrap();
    } catch (error: any) {
      showNotification('error', 'Lỗi', error || 'Không thể trả sheet về Pending');
    } finally {
      setReturningToPending(false);
    }
  };

  const checkLcrFileValidity = (): boolean => {
    if (
      !currentSheet?.excelFileUrl ||
      currentSheet.excelFileUrl.trim() === ""
    ) {
      return false; // Chưa có file
    }

    // Sử dụng validation result từ Redux store
    if (!lcrValidation) {
      return false; // Chưa validate được
    }

    return lcrValidation.isValid;
  };

  // PHÂN QUYỀN CHÍNH XÁC
  const canEdit = () => {
    if (!user || !currentSheet) return false;
    const userRole = user.role;
    const status = currentSheet.status?.toLowerCase();
    // PQCLeader chỉ edit khi PQCDone
    if (userRole === "PQCLeader" && status === "pqcdone") return true;

    // ENG chỉ edit khi PQCLeaderDone
    if (userRole === "ENG" && status === "pqcleaderdone") return true;

    // SUPERVISOR chỉ edit khi ENGDone
    if (userRole === "Supervisior" && status === "engdone") return true;

    return false;
  };

  const canConfirm = () => {
    if (!user || !currentSheet) return false;

    const userRole = user.role;
    const status = currentSheet.status?.toLowerCase();

    // PQCLeader phải check thêm LCR file validity
    if (userRole === "PQCLeader") {
      if (status !== "pqcdone") return false;

      // CHECK LCR FILE - Phải 100% OK
      if (!checkLcrFileValidity()) {
        return false;
      }

      return true;
    }

    switch (userRole) {
      case "PQCLeader":
        return status === "pqcdone";
      case "ENG":
        return status === "pqcleaderdone";
      case "Supervisior":
        return status === "engdone";
      case "Manager":
        return status === "supervisiordone";
      case "KoreaManager":
        return status === "managerdone";
      default:
        return false;
    }
  };

  const handleBack = () => {
  const navState = location.state as any;
  const from = navState?.from;
 
  // Back về Dashboard (từ click xem sheet trong bảng chi tiết)
  if (from === "dashboard") {
    const returnPath = navState?.returnPath || "/";
    const returnSearch = navState?.returnSearch || "";
    const dashboardState = navState?.dashboardState;
 
    navigate(`${returnPath}${returnSearch}`, {
      state: {
        from: "sheetDetail",          // Dashboard nhận key này để restore
        dashboardState,               // Chứa sheetId, date, shift để scroll/highlight
      },
    });
    return;
  }
 
  // Back về Logs (giữ nguyên logic cũ, chỉ đảm bảo luôn có highlightSheetId)
  const savedState = getFilterState();
  const savedSheetId = getSelectedSheetId();
  const highlightSheetId = Number(savedSheetId || id || 0) || null;
  const returnPath = navState?.returnPath;
  const returnSearch = navState?.returnSearch;
 
  if (returnPath) {
    const fullPath = returnSearch ? `${returnPath}${returnSearch}` : returnPath;
    navigate(fullPath, {
      state: {
        from: "sheetDetail",
        savedFilter: savedState.filter,
        savedPage: savedState.currentPage,
        highlightSheetId,
      },
    });
  } else {
    navigate(-1);
  }
};

  // Load dữ liệu sheet từ Redux action
  useEffect(() => {
    dispatch(clearAllSubTableData());
    dispatch(clearError());
    dispatch(clearLcrFile());

    const loadSheetData = async () => {
      if (!id) return;

      // Tải lịch sử ký SONG SONG với sheet (call nhẹ) — không để bị chặn
      // sau bước parse Excel LCR vốn rất chậm. Nhờ vậy phần "Tiến trình ký
      // xác nhận" hiển thị gần như ngay khi trang load xong.
      dispatch(getSheetStatusHistory(Number(id)));

      try {
        const result = await dispatch(
          getSheetWithFullObject(Number(id)),
        ).unwrap();

        // dispatch duy nhất thay vì 5 cái riêng lẻ
        dispatch(
          setAllSubTableData({
            checkModel: result.checkModel ?? null,
            standardProduction: result.standardProduction ?? null,
            timeChangeModel: result.timeChangeModel ?? null,
            standardVehicle: result.standardVehicle ?? null,
            pqcCheck: result.pqcCheck ?? null,
            loadedFromSheetId: Number(id),
          }),
        );

        // completedTables giữ nguyên logic
        const tableConfigs = [
          {
            data: result.checkModel,
            name: "CheckModel" as const,
            config: REQUIRED_FIELDS_CONFIG.CheckModel,
          },
          {
            data: result.standardProduction,
            name: "StandardProduction" as const,
            config: REQUIRED_FIELDS_CONFIG.StandardProduction,
          },
          {
            data: result.timeChangeModel,
            name: "TimeChangeModel" as const,
            config: REQUIRED_FIELDS_CONFIG.TimeChangeModel,
          },
          {
            data: result.standardVehicle,
            name: "StandardVehicle" as const,
            config: REQUIRED_FIELDS_CONFIG.StandardVehicle,
          },
          {
            data: result.pqcCheck,
            name: "PQCCheck" as const,
            config: REQUIRED_FIELDS_CONFIG.PQCCheck,
          },
        ];

        tableConfigs.forEach(({ data, name, config }) => {
          if (!data) return;
          if (hasAllRequiredData(data, config)) {
            dispatch(addCompletedTable(name));
          } else {
            console.log(
              `Missing fields for ${name}:`,
              getMissingFields(data, config),
            );
          }
        });

        // LCR file: parse Excel ở backend rất chậm => chạy nền (không await),
        // không chặn render trang cũng như phần lịch sử ký. UI dùng cờ
        // lcrLoading/lcrValidation riêng nên vẫn cập nhật đúng khi xong.
        if (result.excelFileUrl && result.excelFileUrl.trim() !== "") {
          dispatch(getLcrFileData(Number(id)))
            .unwrap()
            .catch((error) => {
              console.error("❌ Lỗi khi load LCR data:", error);
            });
        }
      } catch (error: any) {
        console.error("❌ Error loading sheet:", error);
      }
    };

    loadSheetData();

    return () => {
      dispatch(clearAllSubTableData());
      dispatch(clearError());
      dispatch(clearLcrFile());
      dispatch(clearStatusHistory());
      dispatch(clearSheet());
    };
  }, [id, dispatch]);

  const checkRequiredFiles = (
    sheet: ChangeModelResponse,
  ): { hasLCR: boolean; hasReflow: boolean } => {
    return {
      hasLCR: !!(sheet.excelFileUrl && sheet.excelFileUrl.trim() !== ""),
      hasReflow: !!(sheet.pdfFileUrl && sheet.pdfFileUrl.trim() !== ""),
    };
  };

  // XỬ LÝ KÝ XÁC NHẬN
  const handleConfirm = async () => {
    if (!canConfirm()) {
      // Thông báo cụ thể cho PQCLeader về LCR file
      if (user?.role === "PQCLeader" && !checkLcrFileValidity()) {
        const validation = lcrValidation;
        let errorDetail = "";

        if (validation?.stats) {
          errorDetail = `Total: ${validation.stats.total}\n- OK: ${validation.stats.ok}\n- NG: ${validation.stats.ng}\n- SKIP: ${validation.stats.skip}`;
        }

        showNotification(
          "error",
          "Không thể ký xác nhận",
          `File LCR không hợp lệ!\n\n${errorDetail || validation?.errorMessage || "Tất cả kết quả phải là OK"}`,
        );
        return;
      }

      showNotification("error", `${t("error.confirmError")}`);
      return;
    }

    if (!user || !currentSheet) return;

    // Check required files cho PQCLeader
    if (user.role === "PQCLeader") {
      const { hasLCR, hasReflow } = checkRequiredFiles(currentSheet);

      if (!hasLCR || !hasReflow) {
        const missingFiles = [];
        if (!hasLCR) missingFiles.push("LCR File");
        if (!hasReflow) missingFiles.push("Reflow File");

        showNotification(
          "warning",
          "Thiếu File Bắt Buộc",
          `Vui lòng upload đầy đủ các file: ${missingFiles.join(", ")} trước khi ký xác nhận.`,
        );
        return;
      }
    }

    try {
      setConfirming(true);
      await dispatch(
        updateSheetStatus({
          sheetId: currentSheet.id!,
          currentStatus: currentSheet.status!,
          userRole: user.role as string,
        }),
      ).unwrap();

      showNotification(
        "success",
        `${t("success.confirmSuccess")} ${user.role}!`,
      );

      // Reload sheet data silently via Redux — không reload cả trang
      try {
        const refreshed = await dispatch(getSheetWithFullObject(currentSheet.id!)).unwrap();
        dispatch(
          setAllSubTableData({
            checkModel: refreshed.checkModel ?? null,
            standardProduction: refreshed.standardProduction ?? null,
            timeChangeModel: refreshed.timeChangeModel ?? null,
            standardVehicle: refreshed.standardVehicle ?? null,
            pqcCheck: refreshed.pqcCheck ?? null,
            loadedFromSheetId: currentSheet.id!,
          }),
        );
        // Tải lại lịch sử ký trạng thái của sheet
        await dispatch(getSheetStatusHistory(currentSheet.id!)).unwrap();
      } catch (error: any) {
        console.error("Lỗi khi tải lại dữ liệu sau khi xác nhận:", error);
      }
    } catch (error: any) {
      console.error("Lỗi khi xác nhận:", error);
      showNotification(
        "error",
        t("error.confirmFailed"),
        error || t("error.confirmError"),
      );
    } finally {
      setConfirming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-8xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">
          {t("loading.loadingData")}
        </p>
      </div>
    );
  }

  // Error state
  if (error || !currentSheet) {
    return (
      <div className="max-w-8xl mx-auto my-4 p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            {t("error.title")}
          </h2>
          <p className="text-red-600 mb-4">
            {error || "Không tìm thấy dữ liệu"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("button.back")}
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (sheet: ChangeModelResponse) => {
    const status = sheet.status?.toLowerCase();

    // Kiểm tra xem có phải trạng thái "Done" không
    const isDone = status && status !== "pending";

    // Status label mapping (hiển thị đẹp cho user)
    const statusLabels: Record<string, string> = {
      pending: "Pending",
      pqcdone: "PQC Done",
      pqcleaderdone: "PQC Leader Done",
      engdone: "Engineer Done",
      supervisiordone: "Supervisor Done",
      managerdone: "Manager Done",
      koreamanagerdone: "Korea Manager Done",
    };

    // Lấy label đẹp
    const label =
      statusLabels[status || "pending"] || sheet.status || "Unknown";

    // Chọn màu: Pending = Vàng, Done = Xanh lá
    const bgColor = isDone ? "bg-green-100" : "bg-yellow-100";
    const textColor = isDone ? "text-green-700" : "text-yellow-700";
    const iconColor = isDone ? "#16a34a" : "#f59e0b"; // green-600 : yellow-500

    return (
      <div
        className={`flex items-center gap-1 ${bgColor} ${textColor} rounded-full px-2 py-1 text-xs font-medium`}
      >
        <FaRegClock color={iconColor} />
        <span>{label}</span>
      </div>
    );
  };

  const isEditable = canEdit();
  const isConfirmable = canConfirm();

  // EXPORT PDF với html2canvas-pro
  const handleExportPDF = async () => {
    if (!contentRef.current) {
      showNotification("error", "Lỗi", "Không tìm thấy nội dung để export");
      return;
    }

    try {
      showNotification("info", "Đang tạo PDF", "Đang xử lý từng section...");

      await new Promise((resolve) => setTimeout(resolve, 500));

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: false,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      let currentY = margin;
      let isFirstSection = true;

      const sections = Array.from(
        contentRef.current.querySelectorAll(".pdf-section"),
      ).filter((el) => !el.classList.contains("no-print"));

      if (sections.length === 0) {
        showNotification("error", "Lỗi", "Không tìm thấy sections để export");
        return;
      }

      const FONT_SCALE = 1.5;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;

        showNotification(
          "info",
          "Đang tạo PDF",
          `Đang xử lý phần ${i + 1}/${sections.length}...`,
        );

        const sectionClone = section.cloneNode(true) as HTMLElement;
        sectionClone.querySelectorAll(".no-print").forEach((el) => el.remove());

        // XỬ LÝ BORDERS CHO HEADER (div containers)
        const headerContainers = sectionClone.querySelectorAll(
          '.border, .border-gray-300, [class*="border"]',
        );
        headerContainers.forEach((container: any) => {
          // Chỉ xử lý div containers, không phải table
          if (container.tagName === "DIV") {
            container.style.cssText = `
              ${container.style.cssText}
              border: 2px solid #000000 !important;
              box-sizing: border-box !important;
            `;
          }
        });

        // CHUẨN HÓA BORDERS CHO TABLES
        const allTables = sectionClone.querySelectorAll("table");
        allTables.forEach((table: any) => {
          table.style.cssText = `
            opacity: 1 !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 2px solid #000000 !important;
            width: 100%;
          `;
        });

        // TẤT CẢ CELLS (th và td)
        const allCells = sectionClone.querySelectorAll("td, th");
        allCells.forEach((cell: any) => {
          const computedStyle = window.getComputedStyle(cell);
          const currentPaddingTop = parseFloat(computedStyle.paddingTop) || 4;
          const currentPaddingRight =
            parseFloat(computedStyle.paddingRight) || 8;

          cell.style.cssText = `
            opacity: 1 !important;
            border: 1.5px solid #000000 !important;
            box-sizing: border-box !important;
            padding: ${currentPaddingTop * FONT_SCALE}px ${currentPaddingRight * FONT_SCALE}px !important;
            color: #000000 !important;
            background-color: #ffffff !important;
            font-weight: 500 !important;
          `;
        });

        // Force styling cho tất cả elements
        const allElements = sectionClone.querySelectorAll("*");
        allElements.forEach((el: any) => {
          el.style.opacity = "1";

          const computedStyle = window.getComputedStyle(el);

          // Background
          const bgColor = computedStyle.backgroundColor;
          if (
            bgColor &&
            bgColor !== "rgba(0, 0, 0, 0)" &&
            bgColor !== "transparent"
          ) {
            el.style.backgroundColor = "#ffffff";
          }

          // Text color
          if (
            el.tagName !== "TABLE" &&
            el.tagName !== "TD" &&
            el.tagName !== "TH"
          ) {
            el.style.color = "#000000";
          }

          // Font size scaling (trừ table cells đã được xử lý)
          if (el.tagName !== "TD" && el.tagName !== "TH") {
            const currentSize = parseFloat(computedStyle.fontSize);
            if (currentSize) {
              el.style.fontSize = `${currentSize * FONT_SCALE}px`;
            }
          }
        });

        sectionClone.style.backgroundColor = "#ffffff";
        sectionClone.style.color = "#000000";

        sectionClone.style.position = "absolute";
        sectionClone.style.left = "-9999px";
        sectionClone.style.top = "0";
        sectionClone.style.width = section.offsetWidth + "px";
        document.body.appendChild(sectionClone);

        try {
          const sectionCanvas = await html2canvas(sectionClone, {
            scale: 3.5,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            imageTimeout: 0,
            removeContainer: false,
          });

          if (
            !sectionCanvas ||
            sectionCanvas.width === 0 ||
            sectionCanvas.height === 0
          ) {
            console.warn(`Section ${i} produced invalid canvas, skipping...`);
            document.body.removeChild(sectionClone);
            continue;
          }

          // Xử lý canvas để tăng độ sắc nét của borders
          const ctx = sectionCanvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              sectionCanvas.width,
              sectionCanvas.height,
            );
            const data = imageData.data;

            for (let j = 0; j < data.length; j += 4) {
              const r = data[j];
              const g = data[j + 1];
              const b = data[j + 2];
              const avg = (r + g + b) / 3;

              if (avg > 230) {
                data[j] = data[j + 1] = data[j + 2] = 255;
              } else if (avg < 100) {
                data[j] = data[j + 1] = data[j + 2] = 0;
              } else {
                const newVal = avg < 180 ? 0 : 255;
                data[j] = data[j + 1] = data[j + 2] = newVal;
              }
            }

            ctx.putImageData(imageData, 0, 0);
          }

          const imgData = sectionCanvas.toDataURL("image/png", 1.0);

          if (
            !imgData ||
            imgData === "data:," ||
            !imgData.startsWith("data:image")
          ) {
            console.warn(
              `Section ${i} produced invalid image data, skipping...`,
            );
            document.body.removeChild(sectionClone);
            continue;
          }

          const imgProps = pdf.getImageProperties(imgData);
          const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

          if (currentY + imgHeight > pdfHeight - margin && !isFirstSection) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.addImage(
            imgData,
            "PNG",
            margin,
            currentY,
            contentWidth,
            imgHeight,
            undefined,
            "FAST",
          );

          currentY += imgHeight + 5;
          isFirstSection = false;
        } catch (sectionError: any) {
          console.error(`Error processing section ${i}:`, sectionError);
        } finally {
          if (document.body.contains(sectionClone)) {
            document.body.removeChild(sectionClone);
          }
        }
      }

      const fileName = `Sheet_${currentSheet.id}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      showNotification(
        "success",
        "Thành công",
        `Đã tạo file ${fileName} thành công!`,
      );
    } catch (error: any) {
      console.error("❌ Export PDF Error:", error);
      showNotification(
        "error",
        "Lỗi",
        `Không thể tạo PDF: ${error.message || "Unknown error"}`,
      );
    }
  };
  return (
    <div className="max-w-8xl mx-auto my-4">
      {/** notification */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      <div ref={contentRef}>
        <div className="pdf-section">
          {/* Header */}
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {t("title")}: #{currentSheet.id}
                </h1>
                <h6>
                  WorkOrder:
                  {currentSheet.checkModel?.workOrder !== ""
                    ? currentSheet.checkModel?.workOrder
                    : t("noWorkOrder")}
                </h6>
                {currentSheet.createAt && (
                  <p className="text-xs text-gray-500 mt-1 mb-0">
                    {t("createdAt")}:{" "}
                    {new Date(currentSheet.createAt).toLocaleString("vi-VN")}
                  </p>
                )}
                {currentSheet.account && (
                  <p className="text-xs text-gray-500 mb-0">
                    {t("createdBy")}:{" "}
                    {currentSheet.account?.fullName ||
                      currentSheet.account.userName}{" "}
                    ({currentSheet.account.role})
                  </p>
                )}
              </div>
              {/* Status Badge + Note Button */}
              <div className="flex items-center gap-3">
                <div className="text-center flex items-center justify-start py-2">
                  {getStatusBadge(currentSheet)}
                </div>
              </div>
            </div>
          </div>

          {/* Banner phân quyền */}
          <div
            className={`mb-4 p-3 rounded-lg border no-print ${
              isEditable
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="text-sm font-semibold mb-0 text-center">
              {isEditable ? (
                <div className="flex items-center justify-center">
                  <span className="flex items-center gap-2 text-green-800">
                    <MdModeEdit size={20} />
                    {t("mode.edit")}
                  </span>
                  <span className="ml-1">- {t("mode.editDescription")}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="text-blue-800 flex gap-2">
                    <div className="">
                      <IoEyeSharp size={20} />
                    </div>
                    <p className="mb-0">
                      {t("mode.view")} - {t("mode.viewDescription")}
                    </p>
                  </div>
                  {user?.role === "Manager" || user?.role === "KoreaManager"
                    ? t("mode.noEditPermission")
                    : ""}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tiến trình ký xác nhận */}
        <div className="pdf-section no-print mb-4">
          <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <AiOutlineHistory className="w-5 h-5 text-gray-500" />
              {tLogs("detail.signatureProgress") || "Tiến trình ký xác nhận"}:
            </h3>

            {loadingHistory ? (
              <div className="py-4">
                <LoadingSpinner size="sm" message={tLogs("detail.loading") || "Đang tải tiến trình..."} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {roles.map((role) => {
                  const signerInfo = getSignerInfo(role.key);
                  const isConfirmed = !!signerInfo;
                  const canConfirm = canConfirmAtStep(currentSheet, role.key);

                  // Xác định màu sắc premium cho từng trạng thái
                  let cardBg = "bg-gray-50/50 border-gray-200 text-gray-400";
                  let roleTextColor = "text-gray-600";
                  if (isConfirmed) {
                    cardBg = "bg-emerald-50/60 border-emerald-200 text-emerald-800 shadow-sm hover:shadow transition-all";
                    roleTextColor = "text-emerald-950 font-semibold";
                  } else if (canConfirm) {
                    cardBg = "bg-blue-50/70 border-blue-300 shadow-sm hover:shadow transition-all duration-300";
                    roleTextColor = "text-blue-900 font-bold";
                  }

                  return (
                    <div
                      key={role.key}
                      className={`p-3 rounded-lg border flex flex-col justify-between h-full transition-all duration-300 ${cardBg} shadow-sm`}
                      style={{ minHeight: '140px' }}
                    >
                      {/* Tiêu đề vai trò (Header) */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200 shrink-0">
                        <span className={`text-[10px] font-bold ${roleTextColor} truncate uppercase tracking-wider`}>
                          {role.label}
                        </span>
                        {isConfirmed ? (
                          <AiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AiOutlineClockCircle className={`w-3.5 h-3.5 shrink-0 ${canConfirm ? "text-blue-500" : "text-gray-400"}`} />
                        )}
                      </div>

                      {/* Nội dung chính (Body) */}
                      <div className="flex-1 flex flex-col justify-center py-2 min-w-0">
                        {isConfirmed && signerInfo ? (
                          <div className="space-y-1">
                            {/* Tên người ký (nổi bật, rõ ràng) */}
                            <div 
                              className="text-xs font-semibold text-gray-800 truncate" 
                              title={signerInfo.account?.fullName || signerInfo.account?.userName}
                            >
                              {signerInfo.account?.fullName || signerInfo.account?.userName || "N/A"}
                            </div>
                            {/* Badge trạng thái "Đã ký" */}
                            <div className="inline-flex items-center gap-1 bg-emerald-100! text-emerald-800! text-[9px] px-2! py-1! rounded font-bold uppercase tracking-wider whitespace-nowrap">
                              <span>✓</span>
                              <span>{tLogs("detail.confirmed") || "Đã ký"}</span>
                            </div>
                          </div>
                        ) : canConfirm ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 bg-blue-100! text-blue-800! text-[9px] px-2! py-1! rounded font-bold uppercase tracking-wider whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                              <span>{tLogs("status.pending") || "Chờ ký"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center bg-gray-100! text-gray-500! text-[9px] px-2! py-1! rounded font-medium uppercase tracking-wider whitespace-nowrap">
                              <span>{tLogs("detail.notConfirmed") || "Chưa ký"}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ngày tháng hoặc Nút ký (Footer) */}
                      <div className="pt-2 border-t border-gray-200 shrink-0">
                        {isConfirmed && signerInfo ? (
                          <div className="text-[9px] text-gray-500 font-medium flex items-center justify-between gap-1">
                            <span className="opacity-80">Thời gian:</span>
                            <span className="font-semibold text-gray-600">{formatDateTime(signerInfo.changedAt)}</span>
                          </div>
                        ) : canConfirm ? (
                          <div className="relative select-none">
                            {/* Khối nền phát sáng thở nhẹ */}
                            <div className="absolute inset-0 bg-blue-500 rounded filter blur-[1px] animate-pulse opacity-60"></div>
                            <button
                              onClick={handleConfirm}
                              disabled={confirming}
                              className="relative z-10 w-full py-2! bg-blue-600 text-white rounded text-[10px] 
                                        font-bold hover:bg-blue-700 transition-all duration-300
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                        flex items-center justify-center gap-1 shadow-sm
                                        hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {confirming ? (
                                <AiOutlineLoading3Quarters className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                tLogs("button.sign") || "Ký ngay"
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-400 italic text-center">
                            Đang chờ...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hiển thị các component */}
        <div>
          <div className="pdf-section">
            <SheetHeader
              canEdit={isEditable}
              returnPath={returnPath || window.location.pathname}
            />
          </div>

          <div className="pdf-section">
            <CheckModels canEdit={isEditable} />
          </div>

          <div className="pdf-section">
            <StandardProductionSection canEdit={isEditable} />
          </div>

          <div className="pdf-section">
            <TimeChangeModels canEdit={isEditable} />
          </div>

          <div className="pdf-section page-break-before">
            <StandardVehicles canEdit={isEditable} />
          </div>

          <div className="pdf-section">
            <PQCChecks canEdit={isEditable} />
          </div>
        </div>

        {/* Buttons */}
        <div
          className="no-print w-full sticky bottom-0 bg-white border-t-2 border-l-2 border-r-2 border-gray-300 p-4 flex flex-col md:flex-row lg:flex-row items-stretch gap-3 shadow-lg mt-4 "
          style={{ zIndex: 10 }}
        >
          <button
            onClick={handleBack}
            className="w-full px-4 py-3 bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            {t("button.back")}
          </button>

          {canReturnToPending() && (
            <button
              onClick={() => setConfirmReturnModal(true)}
              disabled={returningToPending}
              className="w-full px-4 py-3 bg-amber-500 text-white text-sm font-semibold 
                        hover:bg-amber-600 transition-colors shadow-md 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2"
            >
              <MdKeyboardReturn size={18} />
              {returningToPending ? 'Đang xử lý...' : 'Trả về Pending'}
            </button>
          )}

          {isConfirmable && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full px-4 py-3 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming
                ? t("button.confirming")
                : `${t("button.confirm")} (${user?.role})`}
            </button>
          )}

          {!isConfirmable && (
            <div className="w-full px-4 py-3 bg-gray-300 text-gray-600 font-semibold text-center text-sm cursor-not-allowed">
              {user?.role === "Manager" || user?.role === "KoreaManager"
                ? `👁️ ${t("mode.viewOnly")} ${t("mode.notYourTurn")}`
                : `🔒 ${t("mode.cannotSign")}`}
            </div>
          )}

          <button
            onClick={handleExportPDF}
            className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export PDF
          </button>
        </div>

        {/* CSS để tương tác khi read-only */}
        {!isEditable && (
          <style>{`
          /* Force tất cả sáng rõ */
          .pointer-events-none,
          .pointer-events-none * {
            opacity: 1 !important;
          }

          header,
          header *,
          nav,
          nav *,
          .user-dropdown,
          .user-dropdown *,
          .user-dropdown button {
            pointer-events: auto !important;
            cursor: pointer !important;
            opacity: 1 !important;
          }

          /* ========================================
            tất cả blocking layers
            ======================================== */
          
          /* Force image viewing elements lên trên mọi overlay */
          .pointer-events-none img[data-view-image="true"],
          .pointer-events-none button[data-view-image="true"] {
            position: relative !important;
            z-index: 9999 !important; /* Cao hơn mọi overlay */
            cursor: pointer !important;
            pointer-events: auto !important;
            opacity: 1 !important;
          }

          .pointer-events-none button[data-view-image="true"] {
            background-color: transparent !important;
            color: #3b82f6 !important;
            border: 1px solid #93c5fd !important;
          }

          .pointer-events-none button[data-view-image="true"]:hover {
            background-color: #dbeafe !important;
            border-color: #3b82f6 !important;
          }

          /* Modal buttons */
          .pointer-events-none [data-close-modal="true"],
          .pointer-events-none [data-close-modal="true"] button,
          .pointer-events-none [data-close-modal="true"] * {
            pointer-events: auto !important;
            cursor: pointer !important;
            opacity: 1 !important;
            z-index: 9999 !important; /* Thêm z-index */
          }

          /* File view detail buttons */
          .pointer-events-none button[data-view-detail="true"] {
            cursor: pointer !important;
            background-color: #3b82f6 !important;
            color: #ffffff !important;
            border-color: #2563eb !important;
            pointer-events: auto !important;
            opacity: 1 !important;
            z-index: 9999 !important; /* Thêm z-index */
          }
          
          .pointer-events-none button[data-view-detail="true"]:hover {
            background-color: #2563eb !important;
          }

          /* ========================================
            ❌ BLOCKING RULES
            ======================================== */
          
          .pointer-events-none button:not([data-close-modal]):not([data-view-detail]):not([data-view-image]) {
            cursor: not-allowed !important;
            color: #6b7280 !important;
            border-color: #9ca3af !important;
            opacity: 0.7 !important;
            transition: opacity 0.25s ease-in-out !important;
            pointer-events: none !important;
          }

          .pointer-events-none button:not([data-close-modal]):not([data-view-detail]):not([data-view-image]):hover {
            opacity: 0.95 !important;
            transform: scale(1.01) !important;
          }

          /* Input */
          .pointer-events-none input:not([type="checkbox"]):not([type="radio"]),
          .pointer-events-none textarea,
          .pointer-events-none select {
            cursor: not-allowed !important;
            background-color: #ffffff !important;
            border: 1.5px solid #d1d5db !important;
            color: #000000 !important;
          }

          /* PDF Section styling */
          .pdf-section {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 10px;
          }
          
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            
            .pdf-section {
              page-break-inside: avoid;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
        )}
      </div>
      <ConfirmModal
        open={confirmReturnModal}
        title="Trả sheet về Pending"
        message={
          `Trả Sheet #${currentSheet.id} về Pending?\n\n` +
          `WorkOrder: ${currentSheet.checkModel?.workOrder || 'N/A'}\n` +
          `PQC sẽ cần ký lại từ đầu.`
        }
        confirmText={returningToPending ? 'Đang xử lý...' : 'Trả về'}
        cancelText="Hủy"
        onConfirm={handleReturnToPending}
        onCancel={() => setConfirmReturnModal(false)}
        type="warning"
      />
    </div>
  );
};

export default SheetDetailViewer;
