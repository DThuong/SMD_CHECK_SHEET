/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { IoEyeSharp } from "react-icons/io5";
import { MdModeEdit } from "react-icons/md";
import {
  clearAllSubTableData,
  addCompletedTable,
  setAllSubTableData,
} from "../../redux/slices/subTableSlice";
import {
  getSheetWithFullObject,
  updateSheetStatus,
  clearError,
  type ChangeModelResponse,
} from "../../redux/slices/changeModelSlice";
import {
  getFilterState,
  getSelectedSheetId,
} from "../../utils/navigationState";

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
import NoteModal from "../general/NoteModal";
import { MdStickyNote2 } from "react-icons/md";

const SheetDetailViewer = () => {
  const id = Number(useParams().id);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy saved state từ location
  const returnPath = (location.state as any)?.returnPath;
  const returnSearch = (location.state as any)?.returnSearch;
  // Lấy data từ Redux store
  const { currentSheet, loading, error } = useAppSelector(
    (state) => state.changeModel,
  );
  const { user } = useAppSelector((state) => state.auth);
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation("sheetDetail");

  const contentRef = useRef<HTMLDivElement>(null);
  const { lcrValidation } = useAppSelector((state) => state.fileSlice);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

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
    const savedState = getFilterState();
    const savedSheetId = getSelectedSheetId();

    console.log("🔙 Navigating back with state:", { savedState, savedSheetId });

    if (returnPath) {
      const fullPath = returnSearch
        ? `${returnPath}${returnSearch}`
        : returnPath;

      navigate(fullPath, {
        state: {
          from: "sheetDetail",
          savedFilter: savedState.filter,
          savedPage: savedState.currentPage,
          highlightSheetId: savedSheetId,
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

        // LCR file giữ nguyên
        if (result.excelFileUrl && result.excelFileUrl.trim() !== "") {
          try {
            await dispatch(getLcrFileData(Number(id))).unwrap();
          } catch (error) {
            console.error("❌ Lỗi khi load LCR data:", error);
          }
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

    // Check required files cho PQCLeader (giữ nguyên logic cũ)
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

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("❌ Lỗi khi xác nhận:", error);
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
      );

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
                {/* NOTE BUTTON - CHỈ HIỆN CHO QUẢN LÝ */}
                {(user?.role === "ENG" ||
                  user?.role === "Supervisior" ||
                  user?.role === "Manager") && (
                  <button
                    onClick={() => setNoteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-95 font-semibold text-sm"
                  >
                    <MdStickyNote2 size={20} />
                    Ghi chú quản lý
                  </button>
                )}
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
      <NoteModal
        sheetId={Number(id)}
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
      />
    </div>
  );
};

export default SheetDetailViewer;
