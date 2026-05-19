/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FaUsers,
  FaFileAlt,
  FaChartLine,
  FaCheckCircle,
  FaMicrochip,
} from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUsers } from "../../redux/slices/authSlice";
import { fetchChangeModel } from "../../redux/slices/changeModelSlice";
import { fetchPatrolSessions, fetchLineAreas } from "../../redux/slices/patrolSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  clearFilterState,
  saveDashboardReturnContext,
  getDashboardReturnContext,
  clearDashboardReturnContext,
} from "../../utils/navigationState";
import ReactPaginate from "react-paginate";
import LoadingSpinner from "../../components/general/LoadingSpinner";
import {
  savePatrolNavState,
  readPatrolDashboardState,
  clearPatrolDashboardState,
} from "../../utils/patrolNavState";

// ==================== CONSTANTS ====================
const DETAIL_PAGE_SIZE = 10;

/** Cuộn tới bảng chi tiết rồi tới đúng hàng (retry vì state/pagination render sau). */
function scrollDashboardToHighlightedRow(
  sheetId: number,
  tableEl: HTMLDivElement | null,
) {
  const rowId = `dashboard-sheet-row-${sheetId}`;

  tableEl?.scrollIntoView({ behavior: "smooth", block: "start" });

  let attempt = 0;
  const maxAttempts = 40;
  const intervalMs = 75;

  const tryRow = () => {
    const row = document.getElementById(rowId);
    if (row) {
      row.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      return;
    }
    attempt += 1;
    if (attempt < maxAttempts) {
      window.setTimeout(tryRow, intervalMs);
    } else {
      tableEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(tryRow, 50);
    });
  });
}

// Fix pagination styling: thêm padding, border, min-width đồng đều
const PAGINATE_PROPS = {
  previousLabel: "←",
  nextLabel: "→",
  marginPagesDisplayed: 1,
  pageRangeDisplayed: 3,
  containerClassName: "flex items-center justify-center gap-1 flex-wrap py-1",
  pageLinkClassName:
    "flex items-center justify-center w-8 h-8 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-medium no-underline! border border-gray-200 transition-colors",
  activeLinkClassName: "!bg-blue-500 !text-white !border-blue-500",
  previousLinkClassName:
    "flex items-center justify-center px-3 h-8 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-medium no-underline! border border-gray-200 transition-colors",
  nextLinkClassName:
    "flex items-center justify-center px-3 h-8 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-medium no-underline! border border-gray-200 transition-colors",
  breakLinkClassName:
    "flex items-center justify-center w-8 h-8 text-xs text-gray-400 no-underline",
  disabledClassName: "opacity-40 cursor-not-allowed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  PQCDone: "#3b82f6",
  PQCLeaderDone: "#2563eb",
  ENGDone: "#10b981",
  SupervisiorDone: "#f59e0b",
  ManagerDone: "#ef4444",
  KoreaManagerDone: "#8b5cf6",
};

const ROLE_COLORS: Record<string, string> = {
  PQC: "#3b82f6",
  PQCLeader: "#2563eb",
  ENG: "#10b981",
  Supervisior: "#f59e0b",
  Manager: "#ef4444",
  KoreaManager: "#8b5cf6",
};

// ==================== SHARED COMPONENTS ====================

const getStatusBadge = (sheet: any) => {
  const status = sheet.status?.toLowerCase();

  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string; icon: string }
  > = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      label: "Pending",
      icon: "",
    },
    pqcdone: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "PQC Done",
      icon: "✓",
    },
    pqcleaderdone: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "PQC Leader Done",
      icon: "✓",
    },
    engdone: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "ENG Done",
      icon: "✓",
    },
    supervisiordone: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      label: "SUP Done",
      icon: "✓",
    },
    managerdone: {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      label: "MGR Done",
      icon: "✓",
    },
    koreamanagerdone: {
      bg: "bg-teal-100",
      text: "text-teal-700",
      label: "KMGR Done",
      icon: "✓",
    },
  };

  const config = statusConfig[status || "pending"] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: status || "Unknown",
    icon: "❓",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${config.bg} ${config.text} rounded-full px-3 py-1 text-[10px] font-bold`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

/** Bảng chi tiết sheets — dùng chung cho cả Admin và Role-based dashboard */
const SheetTable = ({
  selectedSheets,
  selectedPoint,
  selectedPointLabel,
  detailTableRef,
  userRole,
  navigate,
  t,
  // Thêm selectedPointInfo để lưu vào navigation state
  selectedPointInfo,
  highlightedSheetId,
  timeRange,
  shiftFilter,
  detailTablePage,
  onDetailTablePageChange,
  isInsideCard,
}: {
  selectedSheets: any[];
  selectedPoint: { date: string; shift: "morning" | "night" } | null;
  selectedPointLabel: string | null;
  detailTableRef: React.RefObject<HTMLDivElement | null>;
  userRole?: string;
  navigate: ReturnType<typeof useNavigate>;
  t: (key: string, opts?: any) => string;
  selectedPointInfo?: {
    date: string;
    fullDate: string;
    shift: "morning" | "night";
  } | null;
  highlightedSheetId?: number | null;
  timeRange: "week" | "month" | "all";
  shiftFilter: "morning" | "night" | "both";
  detailTablePage: number;
  onDetailTablePageChange: (page: number) => void;
  isInsideCard?: boolean;
}) => {
  const page = detailTablePage;
  const setPage = onDetailTablePageChange;

  const pageCount = Math.ceil(selectedSheets.length / DETAIL_PAGE_SIZE);
  const paged = selectedSheets.slice(
    page * DETAIL_PAGE_SIZE,
    (page + 1) * DETAIL_PAGE_SIZE,
  );

  // Navigate với state đầy đủ để SheetDetailViewer có thể back về đúng Dashboard
  const handleViewSheet = (sheetId: number) => {
    const dashboardState = selectedPointInfo
      ? {
        date: selectedPointInfo.date,
        fullDate: selectedPointInfo.fullDate,
        shift: selectedPointInfo.shift,
        sheetId,
        detailTablePage: page,
        timeRange,
        shiftFilter,
      }
      : {
        sheetId,
        detailTablePage: page,
        timeRange,
        shiftFilter,
      };

    saveDashboardReturnContext(dashboardState);

    navigate(`/${userRole?.toLowerCase()}/sheet-detail/${sheetId}`, {
      state: {
        from: "dashboard",
        returnPath: window.location.pathname,
        returnSearch: window.location.search,
        dashboardState,
      },
    });
  };

  return (
    <div
      ref={detailTableRef}
      className={isInsideCard ? "transition-all duration-300" : "bg-white rounded-xl shadow-lg p-4 mb-4 transition-all duration-300"}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        {/* <h2 className="text-xl font-bold text-slate-800">
          {t("tables.sheetDetails.title")}
        </h2> */}
        {selectedPoint && (
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-fadeIn transition-all duration-300">
            {t("tables.sheetDetails.selectedInfo", {
              count: selectedSheets.length,
              info: selectedPointLabel,
            })}
          </span>
        )}
      </div>

      <div className="overflow-x-auto min-h-[120px]">
        {selectedSheets.length > 0 ? (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    t("tables.sheetDetails.stt"),
                    t("tables.sheetDetails.sheetId"),
                    t("tables.sheetDetails.workOrder"),
                    t("tables.sheetDetails.createdBy"),
                    t("tables.sheetDetails.createTime"),
                    t("tables.sheetDetails.status"),
                    t("tables.sheetDetails.action"),
                  ].map((label, i) => (
                    <th
                      key={i}
                      className={`py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider ${i === 6 ? "text-center" : "text-left"}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((sheet, index) => (
                  <tr
                    key={sheet.id}
                    id={`dashboard-sheet-row-${sheet.id}`}
                    onClick={() => handleViewSheet(sheet.id)}
                    className={`border-b border-slate-100 transition-all duration-500 cursor-pointer ${highlightedSheetId === sheet.id
                      ? "bg-blue-100 ring-2 ring-blue-400 shadow-md scroll-mt-24"
                      : "hover:bg-slate-50"
                      }`}
                  >
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {page * DETAIL_PAGE_SIZE + index + 1}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-blue-600">
                      #{sheet.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {sheet.checkModel?.workOrder || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {sheet.account?.fullName || sheet.account?.userName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({sheet.account?.role})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {sheet.createAt
                        ? new Date(sheet.createAt).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(sheet)}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewSheet(sheet.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md text-xs font-medium"
                      >
                        <AiOutlineEye className="w-4 h-4" />
                        <span>{t("tables.sheetDetails.view")}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex justify-center">
                <ReactPaginate
                  {...PAGINATE_PROPS}
                  pageCount={pageCount}
                  forcePage={page}
                  onPageChange={({ selected }) => setPage(selected)}
                />
              </div>
            )}
          </>
        ) : selectedPoint ? (
          <div className="flex flex-col items-center justify-center py-4! text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <FaFileAlt className="text-4xl mb-2 opacity-30" />
            <p className="text-sm font-medium">
              {t("tables.sheetDetails.noSheets")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4! text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <FaChartLine className="text-4xl mb-2 opacity-30" />
            <p className="text-sm font-medium">
              {t("tables.sheetDetails.noSelection")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Timeline chart — dùng chung */
const SmdTrendCard = ({
  timelineStats,
  timeRange,
  setTimeRange,
  shiftFilter,
  setShiftFilter,
  onPointClick,
  fontSize,
  t,
  selectedSheets,
  selectedPoint,
  selectedPointLabel,
  selectedPointInfo,
  detailTableRef,
  userRole,
  highlightedSheetId,
  navigate,
  detailTablePage,
  onDetailTablePageChange,
}: {
  timelineStats: any[];
  timeRange: "week" | "month" | "all";
  setTimeRange: (v: "week" | "month" | "all") => void;
  shiftFilter: "morning" | "night" | "both";
  setShiftFilter: (v: "morning" | "night" | "both") => void;
  onPointClick: (data: any, index: number, shift: "morning" | "night") => void;
  fontSize: number;
  t: (key: string, opts?: any) => string;
  selectedSheets: any[];
  selectedPoint: { date: string; shift: "morning" | "night" } | null;
  selectedPointLabel: string | null;
  selectedPointInfo?: {
    date: string;
    fullDate: string;
    shift: "morning" | "night";
  } | null;
  detailTableRef: React.RefObject<HTMLDivElement | null>;
  userRole?: string;
  highlightedSheetId?: number | null;
  navigate: ReturnType<typeof useNavigate>;
  detailTablePage: number;
  onDetailTablePageChange: (page: number) => void;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 mt-4 transition-all duration-300 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-bold text-slate-800">
          {t("charts.timeline.title")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {(["week", "month", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === r
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {t(
                `charts.timeline.${r === "week" ? "7days" : r === "month" ? "30days" : "all"}`,
              )}
            </button>
          ))}

          <div className="flex gap-1 ml-2 border-l pl-2">
            {(["both", "morning", "night"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShiftFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${shiftFilter === s
                  ? `text-white ${s === "morning" ? "bg-red-500" : s === "night" ? "bg-purple-600" : "bg-blue-500"}`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {s === "both"
                  ? t("charts.timeline.both")
                  : s === "morning"
                    ? t("charts.timeline.dayshift")
                    : t("charts.timeline.nightshift")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250} className="[&_*:focus]:outline-none">
        <LineChart data={timelineStats} accessibilityLayer={false} style={{ outline: "none" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize }}
            stroke="#64748b"
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#64748b" />
          <Tooltip
            cursor={false}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Legend />

          {(shiftFilter === "morning" || shiftFilter === "both") && (
            <Line
              type="monotone"
              dataKey="morning"
              stroke="#E24B4A"
              strokeWidth={2}
              name={t("charts.timeline.morningLegend")}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`m-${payload.fullDate}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#E24B4A"
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: "pointer", outline: "none" }}
                    onClick={() => onPointClick(payload, 0, "morning")}
                  />
                );
              }}
              activeDot={{
                r: 7,
                style: { cursor: "pointer", outline: "none" },
                onClick: (_: any, p: any) => onPointClick(p, 0, "morning"),
              }}
            />
          )}

          {(shiftFilter === "night" || shiftFilter === "both") && (
            <Line
              type="monotone"
              dataKey="night"
              stroke="#534AB7"
              strokeWidth={2}
              name={t("charts.timeline.nightLegend")}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`n-${payload.fullDate}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#534AB7"
                    stroke="#fff"
                    strokeWidth={2}
                    style={{ cursor: "pointer", outline: "none" }}
                    onClick={() => onPointClick(payload, 0, "night")}
                  />
                );
              }}
              activeDot={{
                r: 7,
                style: { cursor: "pointer", outline: "none" },
                onClick: (_: any, p: any) => onPointClick(p, 0, "night"),
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <SheetTable
          key={
            selectedPoint
              ? `${selectedPoint.date}-${selectedPoint.shift}`
              : "empty"
          }
          selectedSheets={selectedSheets}
          selectedPoint={selectedPoint}
          selectedPointLabel={selectedPointLabel}
          selectedPointInfo={selectedPointInfo}
          detailTableRef={detailTableRef}
          userRole={userRole}
          highlightedSheetId={highlightedSheetId}
          navigate={navigate}
          t={t}
          timeRange={timeRange}
          shiftFilter={shiftFilter}
          detailTablePage={detailTablePage}
          onDetailTablePageChange={onDetailTablePageChange}
          isInsideCard={true}
        />
      </div>
    </div>
  );
};

const PatrolTrendCard = ({
  patrolTimelineStats,
  patrolSessions,
  lineAreas,
  fontSize,
  userRole,
  navigate,
  tPatrol,
  initialDate,
  initialPage = 0,
  initialHighlightId,
}: {
  patrolTimelineStats: any[];
  patrolSessions: any[];
  lineAreas: any[];
  fontSize: number;
  userRole?: string;
  navigate: ReturnType<typeof useNavigate>;
  tPatrol: (key: string, opts?: any) => string;
  initialDate?: string | null;
  initialPage?: number;
  initialHighlightId?: number | null;
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const [highlightPatrolId, setHighlightPatrolId] = useState<number | null>(null);
  const [_selectedDateLabel, setSelectedDateLabel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "weekly">("all");
  const patrolDetailRef = useRef<HTMLDivElement>(null);
  const pT = (key: string, opts?: any) => tPatrol(key, opts);

  const handleChartPointClick = (payload: any) => {
    const pointData = payload?.payload ?? payload;
    if (!pointData?.fullDate) return;

    setSelectedDate(pointData.fullDate);
    setSelectedDateLabel(pointData.date);
    setActiveTab("all");
    setDetailPage(0);

    setTimeout(() => {
      patrolDetailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // 1. Lọc theo ngày được chọn
  const daySessions = useMemo(() => {
    if (!selectedDate || !patrolSessions?.length) return [];
    return patrolSessions.filter((session) => {
      if (!session.createdAt) return false;
      const date = new Date(session.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return key === selectedDate;
    });
  }, [selectedDate, patrolSessions]);

  // 2. Tính toán số lượng cho các tab
  const counts = useMemo(() => {
    return {
      all: daySessions.length,
      daily: daySessions.filter((s) => s.patrolType === "1").length,
      weekly: daySessions.filter((s) => s.patrolType === "7").length,
    };
  }, [daySessions]);

  // 3. Lọc theo tab tích cực
  const filteredSheets = useMemo(() => {
    if (activeTab === "all") return daySessions;
    if (activeTab === "daily") return daySessions.filter((s) => s.patrolType === "1");
    if (activeTab === "weekly") return daySessions.filter((s) => s.patrolType === "7");
    return daySessions;
  }, [daySessions, activeTab]);

  // 4. Phân trang
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredSheets.length / itemsPerPage);
  const paginatedSheets = useMemo(() => {
    return filteredSheets.slice(detailPage * itemsPerPage, (detailPage + 1) * itemsPerPage);
  }, [filteredSheets, detailPage]);

  // 5. Định dạng ngày hiển thị trong tiêu đề chi tiết
  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-");
    return `${d}/${m}/${y}`;
  }, [selectedDate]);

  // 6. Xử lý chuyển hướng đến trang detail patrol
  const handleGoToDetail = (sheetId: number) => {
    const sheet = patrolSessions.find((s: any) => s.id === sheetId);
    const sheetType = sheet?.patrolType === '7' ? 'weekly' : 'daily';

    savePatrolNavState({
      type: sheetType,
      page: detailPage,
      highlightId: sheetId,
      fromDashboard: true,
      dashboardDate: selectedDate || '',
      dashboardReturnPath: window.location.pathname + window.location.search,
    });

    navigate(`/${userRole?.toLowerCase()}/patrol?view=detail&id=${sheetId}`);
  };

  // Helper styles cho trạng thái
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Submitted":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Approved":
        return pT("statusApproved");
      case "Submitted":
        return pT("statusSubmitted");
      default:
        return pT("statusPending");
    }
  };


  // Fix Bug #1: Sync restore state từ Dashboard sau khi mount
  useEffect(() => {
    if (!initialDate) return;
    setSelectedDate(initialDate);
    setDetailPage(initialPage);
    // Label hiển thị
    const [y, m, d] = initialDate.split('-');
    setSelectedDateLabel(`${d}/${m}/${y}`);
  }, [initialDate, initialPage]);

  // Fix Bug #2: Scroll chỉ khi paginatedSheets đã có element cần highlight
  useEffect(() => {
    if (!initialHighlightId || !paginatedSheets.length) return;
    const isInPage = paginatedSheets.some(s => s.id === initialHighlightId);
    if (!isInPage) return;
    setHighlightPatrolId(initialHighlightId);
    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(`[data-patrol-id="${initialHighlightId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    const clearTimer = setTimeout(() => setHighlightPatrolId(null), 2500);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [initialHighlightId, paginatedSheets]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 mt-6 transition-all duration-300 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {pT("patrolTrendTitle")}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {pT("patrolTrendSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 animate-pulse">
            {pT("totalPatrolSheets")}: {patrolTimelineStats.reduce((sum, item) => sum + item.count, 0)}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250} className="[&_*:focus]:outline-none">
        <LineChart data={patrolTimelineStats} accessibilityLayer={false} style={{ outline: "none" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize }}
            stroke="#64748b"
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#64748b" />
          <Tooltip
            cursor={false}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#0d9488"
            strokeWidth={3}
            name={pT("totalPatrolSheets")}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  key={`p-${payload.fullDate}`}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="#0d9488"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: "pointer", outline: "none" }}
                  onClick={() => handleChartPointClick(payload)}
                />
              );
            }}
            activeDot={{
              r: 7,
              style: { cursor: "pointer", outline: "none" },
              onClick: (_: any, p: any) => handleChartPointClick(p),
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chi tiết Patrol Sheets theo điểm chọn */}
      <div ref={patrolDetailRef} className="mt-6 pt-4 border-t border-slate-100 scroll-mt-6">
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center py-4 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <svg
              className="w-10 h-10 text-slate-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <p className="text-sm font-medium text-slate-500 m-0">
              {pT("clickPointToView")}
            </p>
          </div>
        ) : (
          <div>
            {/* Header thông tin chi tiết */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full animate-fadeIn transition-all duration-300">
                {pT("showingPatrolSheets", {
                  count: counts[activeTab],
                  info: formattedDateLabel,
                })}
              </span>

              {/* Tabs chọn loại tuần tra */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/40">
                {(["all", "daily", "weekly"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setDetailPage(0);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === tab
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {tab === "all"
                      ? `${pT("all")} (${counts.all})`
                      : tab === "daily"
                        ? `${pT("dailyPatrol")} (${counts.daily})`
                        : `${pT("weeklyPatrol")} (${counts.weekly})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng chi tiết */}
            <div className="overflow-x-auto min-h-[120px]">
              {paginatedSheets.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 py-3">
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left w-12">
                            {pT("stt")}
                          </th>
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left w-24">
                            {pT("sheetId")}
                          </th>
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                            {pT("lineArea")}
                          </th>
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                            {pT("creator")}
                          </th>
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                            {pT("createdAt")}
                          </th>
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left w-28">
                            {pT("status")}
                          </th>
                          <th className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center w-20">
                            {pT("action")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSheets.map((sheet, index) => {
                          const sheetLineName =
                            lineAreas.find((l) => l.id === sheet.lineAreaId)?.lineAreaName || "N/A";
                          return (
                            <tr
                              key={sheet.id}
                              data-patrol-id={sheet.id}
                              onClick={() => handleGoToDetail(sheet.id)}
                              className={`border-b border-slate-100 transition-all duration-500 cursor-pointer ${highlightPatrolId === sheet.id
                                ? 'bg-blue-100 ring-2 ring-inset ring-blue-400 shadow-md'
                                : 'hover:bg-slate-50/60'
                                }`}
                            >
                              <td className="py-3 px-3 text-sm text-slate-500 font-medium">
                                {detailPage * itemsPerPage + index + 1}
                              </td>
                              <td className="py-3 px-3 text-sm font-semibold text-slate-900">
                                #{sheet.id}
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                  {sheetLineName}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-700 font-medium">
                                {sheet.fullName}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-500">
                                {new Date(sheet.createdAt).toLocaleString("vi-VN")}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block whitespace-nowrap ${getStatusStyle(sheet.status)}`}>
                                  {getStatusText(sheet.status)}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleGoToDetail(sheet.id)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span>{pT("view")}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="grid gap-3 md:hidden">
                    {paginatedSheets.map((sheet) => {
                      const sheetLineName =
                        lineAreas.find((l) => l.id === sheet.lineAreaId)?.lineAreaName || "N/A";
                      return (
                        <div
                          key={sheet.id}
                          data-patrol-id={sheet.id}
                          onClick={() => handleGoToDetail(sheet.id)}
                          className={`bg-slate-50/40 border transition-all duration-500 cursor-pointer ${highlightPatrolId === sheet.id
                            ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-bold text-slate-400 mb-0.5">#{sheet.id}</p>
                              <p className="text-sm font-bold text-slate-800 mb-1">{sheet.fullName}</p>
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {pT("lineLabel")}: {sheetLineName}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(sheet.status)}`}>
                              {getStatusText(sheet.status)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-slate-450 text-slate-400">
                              {new Date(sheet.createdAt).toLocaleString("vi-VN")}
                            </span>
                            <button
                              onClick={() => handleGoToDetail(sheet.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{pT("view")}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Phân trang */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-3 border-t border-slate-100 gap-3">
                      <span className="text-xs text-slate-500 font-semibold">
                        {pT("pageIndicator", {
                          current: detailPage + 1,
                          total: totalPages,
                        })}
                      </span>
                      <ReactPaginate
                        {...PAGINATE_PROPS}
                        previousLabel={pT("prevPage")}
                        nextLabel={pT("nextPage")}
                        activeLinkClassName="!bg-teal-600 !text-white !border-teal-600 font-bold"
                        pageCount={totalPages}
                        forcePage={detailPage}
                        onPageChange={({ selected }) => setDetailPage(selected)}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-semibold text-slate-400 m-0">
                    {pT("noPatrolSheets")}
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

// ==================== MAIN COMPONENT ====================
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, users, usersLoading } = useAppSelector((state) => state.auth);
  const { sheets, filteredSheets, loadingList } = useAppSelector(
    (state) => state.changeModel,
  );
  const { sessions: patrolSessions, lineAreas } = useAppSelector((state) => state.patrol);

  const [fontSize, setFontSize] = useState(12);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
  const [shiftFilter, setShiftFilter] = useState<"morning" | "night" | "both">(
    "both",
  );
  const [selectedSheets, setSelectedSheets] = useState<any[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{
    date: string;
    shift: "morning" | "night";
  } | null>(null);
  // Lưu thêm fullDate để pass vào SheetTable → navigation state
  const [selectedPointInfo, setSelectedPointInfo] = useState<{
    date: string;
    fullDate: string;
    shift: "morning" | "night";
  } | null>(null);
  const detailTableRef = useRef<HTMLDivElement>(null);
  // Lưu highlighted sheetId khi back từ SheetDetail
  const [highlightedSheetId, setHighlightedSheetId] = useState<number | null>(
    null,
  );
  const [detailTablePage, setDetailTablePage] = useState(0);
  const [patrolInitialDate, setPatrolInitialDate] = useState<string | null>(null);
  const [patrolInitialPage, setPatrolInitialPage] = useState(0);
  const [patrolInitialHighlight, setPatrolInitialHighlight] = useState<number | null>(null);

  const { t } = useTranslation("dashboard");
  const { t: tPatrol } = useTranslation("patrol");
  const location = useLocation();

  const displaySheets = useMemo(
    () =>
      filteredSheets && filteredSheets.length > 0 ? filteredSheets : sheets,
    [filteredSheets, sheets],
  );

  const selectedPointLabel = selectedPoint
    ? `${selectedPoint.date} - ${selectedPoint.shift === "morning" ? t("charts.timeline.dayshift") : t("charts.timeline.nightshift")}`
    : null;

  // ==================== UTILS ====================
  const getShiftDay = useCallback(
    (date: Date): { shift: "morning" | "night"; key: string } => {
      const h = date.getHours();
      const base =
        h >= 8 && h < 20
          ? date
          : (() => {
            const s = new Date(date);
            if (h < 8) s.setDate(s.getDate() - 1);
            return s;
          })();
      const key = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
      return { shift: h >= 8 && h < 20 ? "morning" : "night", key };
    },
    [],
  );

  // ==================== EFFECTS ====================
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchChangeModel());
    dispatch(fetchPatrolSessions());
    dispatch(fetchLineAreas());
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () =>
      setFontSize(
        window.innerWidth < 640 ? 8 : window.innerWidth < 1024 ? 10 : 12,
      );
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Luôn đọc patrol dashboard state TRƯỚC, bất kể from hay sheetId
    const patrolDs = readPatrolDashboardState();
    if (patrolDs?.date) {
      setPatrolInitialDate(patrolDs.date);
      setPatrolInitialPage(patrolDs.page || 0);
      setPatrolInitialHighlight(patrolDs.highlightId || null);
      clearPatrolDashboardState();
    }

    const navState = location.state as {
      from?: string;
      dashboardState?: {
        sheetId?: number;
        fullDate?: string;
        date?: string;
        shift?: "morning" | "night";
        detailTablePage?: number;
        timeRange?: "week" | "month" | "all";
        shiftFilter?: "morning" | "night" | "both";
      };
    } | null;

    if (navState?.from !== "sheetDetail" || !navState?.dashboardState?.sheetId) {
      return;
    }

    const navDs = navState.dashboardState;
    const stored = getDashboardReturnContext();
    const ds =
      stored && stored.sheetId === navDs.sheetId ? { ...stored, ...navDs } : navDs;

    const needFilter = !!(ds.fullDate && ds.shift);
    if (needFilter && (displaySheets?.length ?? 0) === 0) {
      return;
    }

    if (ds.timeRange) setTimeRange(ds.timeRange);
    if (ds.shiftFilter) setShiftFilter(ds.shiftFilter);

    let restoredRowCount = 0;
    if (ds.fullDate && ds.shift && displaySheets?.length) {
      const filtered = (displaySheets || []).filter((sheet) => {
        if (!sheet.createAt) return false;
        const { shift: s, key: k } = getShiftDay(new Date(sheet.createAt));
        return k === ds.fullDate && s === ds.shift;
      });
      restoredRowCount = filtered.length;
      setSelectedSheets(filtered);
      setSelectedPoint({
        date: ds.date || ds.fullDate || "",
        shift: ds.shift,
      });
      setSelectedPointInfo({
        date: ds.date || ds.fullDate || "",
        fullDate: ds.fullDate!,
        shift: ds.shift,
      });
    }

    const maxPage =
      restoredRowCount > 0
        ? Math.max(0, Math.ceil(restoredRowCount / DETAIL_PAGE_SIZE) - 1)
        : 0;
    const rawPage = ds.detailTablePage ?? 0;
    setDetailTablePage(Math.min(Math.max(0, rawPage), maxPage));

    setHighlightedSheetId(ds.sheetId!);
    clearDashboardReturnContext();

    navigate(`${location.pathname}${location.search || ""}`, {
      replace: true,
      state: {},
    });

    const timer = setTimeout(() => setHighlightedSheetId(null), 2500);
    scrollDashboardToHighlightedRow(ds.sheetId!, detailTableRef.current);

    return () => {
      clearTimeout(timer);
    };
  }, [
    location.state,
    location.pathname,
    location.search,
    displaySheets,
    getShiftDay,
    navigate,
  ]);

  // ==================== MEMOS ====================
  const roleStats = useMemo(
    () =>
      Object.entries(
        users.reduce(
          (acc, u) => {
            if (u.isActive) acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      ).map(([role, count]) => ({
        name: role,
        value: count,
        color: ROLE_COLORS[role] || "#6b7280",
      })),
    [users],
  );

  const statusStats = useMemo(
    () =>
      Object.entries(
        (displaySheets || []).reduce(
          (acc, sheet) => {
            const s = sheet.status || "pending";
            acc[s] = (acc[s] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      )
        .map(([status, count]) => ({
          name: status,
          value: count,
          color: STATUS_COLORS[status] || "#6b7280",
        }))
        .sort((a, b) => a.value - b.value), // Sắp xếp từ nhỏ đến lớn theo yêu cầu
    [displaySheets],
  );

  const timelineStats = useMemo(() => {
    if (!displaySheets?.length) return [];
    const now = new Date();
    let cutoff: Date | null = null;
    if (timeRange === "week") {
      cutoff = new Date();
      cutoff.setDate(now.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === "month") {
      cutoff = new Date();
      cutoff.setMonth(now.getMonth() - 1);
      cutoff.setHours(0, 0, 0, 0);
    }

    const morning: Record<string, number> = {};
    const night: Record<string, number> = {};

    displaySheets.forEach((sheet) => {
      if (!sheet.createAt) return;
      const date = new Date(sheet.createAt);
      if (cutoff && date < cutoff) return;
      const { shift, key } = getShiftDay(date);
      if (shift === "morning") morning[key] = (morning[key] || 0) + 1;
      else night[key] = (night[key] || 0) + 1;
    });

    return [...new Set([...Object.keys(morning), ...Object.keys(night)])]
      .sort()
      .map((key) => {
        const [, m, d] = key.split("-");
        return {
          date: `${parseInt(d)}/${parseInt(m)}`,
          fullDate: key,
          morning: morning[key] || 0,
          night: night[key] || 0,
        };
      });
  }, [displaySheets, timeRange, getShiftDay]);

  const patrolTimelineStats = useMemo(() => {
    if (!patrolSessions?.length) return [];
    const now = new Date();
    let cutoff: Date | null = null;
    if (timeRange === "week") {
      cutoff = new Date();
      cutoff.setDate(now.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
    } else if (timeRange === "month") {
      cutoff = new Date();
      cutoff.setMonth(now.getMonth() - 1);
      cutoff.setHours(0, 0, 0, 0);
    }

    const counts: Record<string, number> = {};

    patrolSessions.forEach((session) => {
      if (!session.createdAt) return;
      const date = new Date(session.createdAt);
      if (cutoff && date < cutoff) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.keys(counts)
      .map((key) => {
        const [, m, d] = key.split("-");
        return {
          date: `${parseInt(d)}/${parseInt(m)}`,
          fullDate: key,
          count: counts[key] || 0,
        };
      })
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [patrolSessions, timeRange]);

  const activeUsers = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users],
  );
  const completionRate = useMemo(() => {
    if (!sheets?.length) return 0;
    return Math.round(
      (sheets.filter((s) => s.status === "KoreaManagerDone").length /
        sheets.length) *
      100,
    );
  }, [sheets]);
  const pendingSheets = useMemo(
    () => sheets?.filter((s) => s.status === "pending").length || 0,
    [sheets],
  );
  const userActivityRate = useMemo(
    () => (!users.length ? 0 : Math.round((activeUsers / users.length) * 100)),
    [users, activeUsers],
  );

  // ==================== HANDLERS ====================
  const handlePointClick = useCallback(
    (data: any, _index: number, shift: "morning" | "night") => {
      const pointData = data?.payload ?? data;
      if (!pointData?.fullDate) return;

      const filtered = (displaySheets || []).filter((sheet) => {
        if (!sheet.createAt) return false;
        const { shift: s, key: k } = getShiftDay(new Date(sheet.createAt));
        return k === pointData.fullDate && s === shift;
      });

      setSelectedSheets(filtered);
      setSelectedPoint({ date: pointData.date || pointData.fullDate, shift });
      // ✅ Lưu đầy đủ info cho navigation state
      setSelectedPointInfo({
        date: pointData.date || pointData.fullDate,
        fullDate: pointData.fullDate,
        shift,
      });
      setDetailTablePage(0);
      clearDashboardReturnContext();
      setTimeout(
        () =>
          detailTableRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        100,
      );
    },
    [displaySheets, getShiftDay],
  );

  // ==================== LOADING ====================
  if (usersLoading || loadingList) {
    return <LoadingSpinner message={t("loading")} />;
  }

  // ==================== ROLE-BASED DASHBOARD ====================
  if (user?.role !== "Admin") {
    const ROLE_CARD_STATUS_ORDER = [
      "PQCDone",
      "PQCLeaderDone",
      "ENGDone",
      "SupervisiorDone",
      "ManagerDone",
      "KoreaManagerDone",
    ];
    const USER_CARD_STATUS: Record<string, string> = {
      PQCLeader: "PQCDone",
      ENG: "PQCLeaderDone",
      Supervisior: "ENGDone",
      Manager: "SupervisiorDone",
      KoreaManager: "ManagerDone",
    };
    const CARD_COLORS = ["blue", "green", "green", "purple", "orange", "teal"];
    const LABEL_KEYS = [
      "needPQCLeader",
      "needEng",
      "needSupervisor",
      "needManager",
      "needKoreaManager",
      "completed",
    ];
    const DESC_KEYS = [
      "descPQCLeader",
      "descEng",
      "descSupervisor",
      "descManager",
      "descKoreaManager",
      "descCompleted",
    ];

    const colorClasses: Record<
      string,
      { bg: string; hover: string; border: string; text: string }
    > = {
      blue: {
        bg: "bg-blue-50",
        hover: "hover:bg-blue-100",
        border: "border-blue-400",
        text: "text-blue-700",
      },
      green: {
        bg: "bg-green-50",
        hover: "hover:bg-green-100",
        border: "border-green-400",
        text: "text-green-700",
      },
      purple: {
        bg: "bg-purple-50",
        hover: "hover:bg-purple-100",
        border: "border-purple-400",
        text: "text-purple-700",
      },
      orange: {
        bg: "bg-orange-50",
        hover: "hover:bg-orange-100",
        border: "border-orange-400",
        text: "text-orange-700",
      },
      teal: {
        bg: "bg-teal-50",
        hover: "hover:bg-teal-100",
        border: "border-teal-400",
        text: "text-teal-700",
      },
    };

    const userCardStatus = USER_CARD_STATUS[user?.role || ""] || "";

    const roleCards = ROLE_CARD_STATUS_ORDER.map((status, i) => ({
      status,
      label: t(`roleBasedDashboard.statusCards.${LABEL_KEYS[i]}`),
      description: t(`roleBasedDashboard.statusCards.${DESC_KEYS[i]}`),
      color: CARD_COLORS[i],
      isUserCard: status === userCardStatus,
    }));

    return (
      <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 pb-4">
        <style>
          {`
            .recharts-wrapper:focus, 
            .recharts-surface:focus,
            .recharts-wrapper *,
            .recharts-surface * {
              outline: none !important;
              box-shadow: none !important;
              -webkit-tap-highlight-color: transparent;
            }
          `}
        </style>
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-6 pt-4">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 lg:text-left text-center">
              {t("title")} - {user?.role}
            </h1>
            <p className="text-slate-600 lg:text-left text-center">
              {t("subtitle")}
            </p>
          </div>

          {/* Status Cards */}
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mt-6! my-3">
            <FaFileAlt className="text-blue-600" /> SMD Sheets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleCards.map((card, index) => {
              const count =
                sheets?.filter((s) => s.status === card.status).length || 0;
              const colors = colorClasses[card.color];
              const ringColor = {
                blue: "ring-blue-400",
                green: "ring-green-400",
                purple: "ring-purple-400",
                orange: "ring-orange-400",
                teal: "ring-teal-400",
              }[card.color];

              return (
                <button
                  key={index}
                  onClick={() => {
                    clearFilterState();
                    navigate(
                      `/${user?.role?.toLowerCase()}/smd-sheet-logs?status=${card.status}`,
                    );
                  }}
                  className={`relative ${colors.bg} ${colors.hover} p-4 rounded-xl shadow-lg border-l-4 ${colors.border} transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-left ${card.isUserCard && count > 0
                    ? `ring-4 ring-offset-2 ring-opacity-50 ${ringColor}`
                    : ""
                    }`}
                >
                  {card.isUserCard && count > 0 && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                      {t("roleBasedDashboard.needProcess")}
                    </div>
                  )}
                  <h3 className={`text-sm font-bold ${colors.text} mb-1`}>
                    {card.label}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {card.description}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-3xl font-bold ${colors.text}`}>
                        {count}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {count === 0
                          ? t("roleBasedDashboard.noSheet")
                          : `${count} sheet${count > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <div
                      className={`p-2 ${colors.bg} rounded-lg ${card.isUserCard && count > 0 ? "animate-pulse" : ""}`}
                    >
                      <FaFileAlt className={`w-5 h-5 ${colors.text}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ==================== PATROL STATUS CARDS ==================== */}
          <div className="mt-8!">
            <h2 className="text-lg font-bold mb-4! text-slate-700 flex items-center gap-2">
              <FaMicrochip className="text-teal-600" /> PATROL Sheets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: tPatrol('dashboardStatus.pendingTitle'),
                  description: tPatrol('dashboardStatus.pendingDescription'),
                  status: 'Pending',
                  color: 'yellow',
                  count: patrolSessions.filter(s => s.status === 'Pending').length,
                  showBadge: false,
                },
                {
                  label: tPatrol('dashboardStatus.submittedTitle'),
                  description: tPatrol('dashboardStatus.submittedDescription'),
                  status: 'Submitted',
                  color: 'blue',
                  count: patrolSessions.filter(s => s.status === 'Submitted').length,
                  showBadge: true, // ← chỉ card này
                },
                {
                  label: tPatrol('dashboardStatus.approvedTitle'),
                  description: tPatrol('dashboardStatus.approvedDescription'),
                  status: 'Approved',
                  color: 'green',
                  count: patrolSessions.filter(s => s.status === 'Approved').length,
                  showBadge: false,
                },
              ].map((card, i) => {
                const colorMap: Record<string, { bg: string; hover: string; border: string; text: string }> = {
                  yellow: { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
                  blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                  green: { bg: 'bg-green-50', hover: 'hover:bg-green-100', border: 'border-green-400', text: 'text-green-700' },
                };
                const colors = colorMap[card.color];
                return (
                  <button
                    key={i}
                    onClick={() => navigate(`/${user?.role?.toLowerCase()}/patrol?view=list&type=daily&status=${card.status}`)}
                    className={`relative ${colors.bg} ${colors.hover} p-4 rounded-xl shadow-lg border-l-4 ${colors.border} transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-left`}
                  >
                    {/* Badge chỉ hiện với PQCLeader + card Submitted + count > 0 */}
                    {card.showBadge && card.count > 0 && user?.role === 'PQCLeader' && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                        {t("roleBasedDashboard.needProcess")}
                      </div>
                    )}

                    <h3 className={`text-sm font-bold ${colors.text} mb-1`}>{card.label}</h3>
                    <p className="text-xs text-gray-600 mb-3">{card.description}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-3xl font-bold ${colors.text}`}>{card.count}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {card.count === 0 ? tPatrol('noSheets') : `${card.count} ${tPatrol('sheetUnit')}`}
                        </p>
                      </div>
                      <FaMicrochip className={`w-5 h-5 ${colors.text} opacity-60`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mt-6! mb-6!">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {t("roleBasedDashboard.quickStats.title")}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={[
                  {
                    label: tPatrol('summaryTotal'),
                    smd: sheets?.length || 0,
                    patrol: patrolSessions?.length || 0,
                  },
                  {
                    label: tPatrol('summaryPending'),
                    smd: sheets?.filter(s => s.status === "pending").length || 0,
                    patrol: patrolSessions?.filter(s => s.status === "Pending").length || 0,
                  },
                  {
                    label: tPatrol('summarySubmitted'),
                    smd: sheets?.filter(s => s.status === "PQCDone").length || 0,
                    patrol: patrolSessions?.filter(s => s.status === "Submitted").length || 0,
                  },
                  {
                    label: tPatrol('summaryCompleted'),
                    smd: sheets?.filter(s => s.status === "KoreaManagerDone").length || 0,
                    patrol: patrolSessions?.filter(s => s.status === "Approved").length || 0,
                  },
                ]}
                barCategoryGap="30%"
                margin={{ top: 10, right: 40, bottom: 10, left: 10 }}
                style={{ outline: "none" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="smd"
                  orientation="left"
                  tick={{ fontSize: 11, fill: "#3b82f6" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                />
                <YAxis
                  yAxisId="patrol"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#10b981" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                  cursor={false}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Bar
                  yAxisId="smd"
                  dataKey="smd"
                  name="SMD Sheet"
                  fill="#3b82f6"
                  radius={0}
                  barSize={24}
                />
                <Line
                  yAxisId="patrol"
                  type="monotone"
                  dataKey="patrol"
                  name="PATROL Sheet"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Combined SMD Sheet Trend and Details Card */}
          <SmdTrendCard
            timelineStats={timelineStats}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            shiftFilter={shiftFilter}
            setShiftFilter={setShiftFilter}
            onPointClick={handlePointClick}
            fontSize={fontSize}
            t={t}
            selectedSheets={selectedSheets}
            selectedPoint={selectedPoint}
            selectedPointLabel={selectedPointLabel}
            selectedPointInfo={selectedPointInfo}
            detailTableRef={detailTableRef}
            userRole={user?.role}
            highlightedSheetId={highlightedSheetId}
            navigate={navigate}
            detailTablePage={detailTablePage}
            onDetailTablePageChange={setDetailTablePage}
          />

          {/* Combined PATROL Sheet Trend Card */}
          <PatrolTrendCard
            patrolTimelineStats={patrolTimelineStats}
            patrolSessions={patrolSessions}
            lineAreas={lineAreas}
            fontSize={fontSize}
            userRole={user?.role}
            navigate={navigate}
            tPatrol={tPatrol}
            initialDate={patrolInitialDate}
            initialPage={patrolInitialPage}
            initialHighlightId={patrolInitialHighlight}
          />

          {/* Charts Grid - Chuyển sang 1 cột mỗi biểu đồ 1 row (CHO NON-ADMIN) */}
          <div className="flex flex-col gap-6 mb-6">
            {/* Phân bổ Users theo Role */}
            <ChartCard title={t("charts.roleDistribution.title")}>
              <div className="h-[350px] outline-none">
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                  <ComposedChart data={roleStats} style={{ outline: 'none' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.96)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                      cursor={false}
                      formatter={(value, name) => {
                        if (name === "value" || name === "Trend") return [null, null];
                        return [value, name];
                      }}
                    />
                    <Legend verticalAlign="top" align="right" height={36} />
                    <Bar
                      dataKey="value"
                      name={t("charts.roleDistribution.count")}
                      fill="#374151"
                      radius={0} // KHÔNG BO GÓC THEO YÊU CẦU
                      barSize={45}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#94a3b8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#fff', stroke: '#94a3b8', strokeWidth: 2, cursor: 'pointer' }}
                      activeDot={{ r: 6, strokeWidth: 0, cursor: 'pointer' }}
                      legendType="none" // ẨN KHỎI LEGEND
                      tooltipType="none"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Trạng thái SMD Sheets - Đã đổi sang ComposedChart */}
            <ChartCard title={t("charts.sheetStatus.title")}>
              <div className="h-[350px] outline-none">
                <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                  <ComposedChart data={statusStats} layout="vertical" style={{ outline: 'none' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={120}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.96)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                      cursor={false} // LOẠI BỎ ĐƯỜNG KẺ NGANG
                    />
                    <Legend verticalAlign="top" align="right" height={36} />
                    <Bar
                      dataKey="value"
                      name={t("charts.sheetStatus.count")}
                      fill="#374151"
                      radius={0} // KHÔNG BO GÓC THEO YÊU CẦU
                      barSize={30}
                      style={{ cursor: 'pointer' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ADMIN DASHBOARD ====================
  // Admin thấy tất cả: status cards, quick stats, charts, tables
  const ROLE_CARD_STATUS_ORDER = [
    "PQCDone",
    "PQCLeaderDone",
    "ENGDone",
    "SupervisiorDone",
    "ManagerDone",
    "KoreaManagerDone",
  ];
  const CARD_COLORS = ["blue", "green", "green", "purple", "orange", "teal"];
  const LABEL_KEYS = [
    "needPQCLeader",
    "needEng",
    "needSupervisor",
    "needManager",
    "needKoreaManager",
    "completed",
  ];
  const DESC_KEYS = [
    "descPQCLeader",
    "descEng",
    "descSupervisor",
    "descManager",
    "descKoreaManager",
    "descCompleted",
  ];

  const colorClasses: Record<
    string,
    { bg: string; hover: string; border: string; text: string }
  > = {
    blue: {
      bg: "bg-blue-50",
      hover: "hover:bg-blue-100",
      border: "border-blue-400",
      text: "text-blue-700",
    },
    green: {
      bg: "bg-green-50",
      hover: "hover:bg-green-100",
      border: "border-green-400",
      text: "text-green-700",
    },
    purple: {
      bg: "bg-purple-50",
      hover: "hover:bg-purple-100",
      border: "border-purple-400",
      text: "text-purple-700",
    },
    orange: {
      bg: "bg-orange-50",
      hover: "hover:bg-orange-100",
      border: "border-orange-400",
      text: "text-orange-700",
    },
    teal: {
      bg: "bg-teal-50",
      hover: "hover:bg-teal-100",
      border: "border-teal-400",
      text: "text-teal-700",
    },
  };

  const adminRoleCards = ROLE_CARD_STATUS_ORDER.map((status, i) => ({
    status,
    label: t(`roleBasedDashboard.statusCards.${LABEL_KEYS[i]}`),
    description: t(`roleBasedDashboard.statusCards.${DESC_KEYS[i]}`),
    color: CARD_COLORS[i],
  }));

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 pb-4">
      <style>
        {`
          .recharts-wrapper:focus, 
          .recharts-surface:focus,
          .recharts-wrapper *,
          .recharts-surface * {
            outline: none !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
        `}
      </style>
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 lg:text-left text-center">
            {t("adminDashboard.title")}
          </h1>
          <p className="text-slate-600 lg:text-left text-center">
            {t("adminDashboard.subtitle")}
          </p>
        </div>

        {/* Admin Stats Cards — 4 overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
          {[
            {
              label: t("adminDashboard.stats.totalUsers"),
              value: users.length,
              sub: `${activeUsers} ${t("adminDashboard.stats.activeUsers")}`,
              subColor: "text-green-600",
              icon: (
                <FaUsers className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
              ),
            },
            {
              label: t("adminDashboard.stats.smdSheets"),
              value: sheets?.length || 0,
              sub: `${pendingSheets} ${t("adminDashboard.stats.pending")}`,
              subColor: "text-orange-400",
              icon: (
                <FaFileAlt className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
              ),
            },
            {
              label: t("adminDashboard.stats.activeRate"),
              value: `${userActivityRate}%`,
              sub: `${users.length - activeUsers} ${t("adminDashboard.stats.lockedAccounts")}`,
              subColor: "text-red-600",
              icon: (
                <FaChartLine className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
              ),
            },
            {
              label: t("adminDashboard.stats.completion"),
              value: `${completionRate}%`,
              sub: t("adminDashboard.stats.completion"),
              subColor: "text-green-600",
              icon: (
                <FaCheckCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-500 shrink-0 ml-2" />
              ),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-4 md:p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-gray-500"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-600 text-xs md:text-sm mb-1 truncate">
                    {item.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {item.value}
                  </p>
                  <p className={`text-xs ${item.subColor} mt-1`}>{item.sub}</p>
                </div>
                {item.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Status Cards — Admin xem tất cả, có thể click navigate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {adminRoleCards.map((card, index) => {
            const count =
              sheets?.filter((s) => s.status === card.status).length || 0;
            const colors = colorClasses[card.color];
            return (
              <button
                key={index}
                onClick={() => {
                  clearFilterState();
                  navigate(`/admin/smd-sheet-logs?status=${card.status}`);
                }}
                className={`relative ${colors.bg} ${colors.hover} p-4 rounded-xl shadow-lg border-l-4 ${colors.border} transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-left`}
              >
                <h3 className={`text-sm font-bold ${colors.text} mb-1`}>
                  {card.label}
                </h3>
                <p className="text-xs text-gray-600 mb-3">{card.description}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${colors.text}`}>
                      {count}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {count === 0
                        ? t("roleBasedDashboard.noSheet")
                        : `${count} sheet${count > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className={`p-2 ${colors.bg} rounded-lg`}>
                    <FaFileAlt className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ==================== PATROL STATUS CARDS ==================== */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <FaMicrochip className="text-teal-600" /> PATROL Sheets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: tPatrol('dashboardStatus.pendingTitle'),
                description: tPatrol('dashboardStatus.pendingDescription'),
                status: 'Pending',
                color: 'yellow',
                count: patrolSessions.filter(s => s.status === 'Pending').length,
              },
              {
                label: tPatrol('dashboardStatus.submittedTitle'),
                description: tPatrol('dashboardStatus.submittedDescription'),
                status: 'Submitted',
                color: 'blue',
                count: patrolSessions.filter(s => s.status === 'Submitted').length,
              },
              {
                label: tPatrol('dashboardStatus.approvedTitle'),
                description: tPatrol('dashboardStatus.approvedDescription'),
                status: 'Approved',
                color: 'green',
                count: patrolSessions.filter(s => s.status === 'Approved').length,
              },
            ].map((card, i) => {
              const colorMap: Record<string, { bg: string; hover: string; border: string; text: string }> = {
                yellow: { bg: 'bg-yellow-50', hover: 'hover:bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
                blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
                green: { bg: 'bg-green-50', hover: 'hover:bg-green-100', border: 'border-green-400', text: 'text-green-700' },
              };
              const colors = colorMap[card.color];
              return (
                <button
                  key={i}
                  onClick={() => navigate(`/${user?.role?.toLowerCase()}/patrol?view=list&type=daily&status=${card.status}`)}
                  className={`${colors.bg} ${colors.hover} p-4 rounded-xl shadow-lg border-l-4 ${colors.border} transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-left`}
                >
                  <h3 className={`text-sm font-bold ${colors.text} mb-1`}>{card.label}</h3>
                  <p className="text-xs text-gray-600 mb-3">{card.description}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-3xl font-bold ${colors.text}`}>{card.count}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {card.count === 0 ? tPatrol('noSheets') : `${card.count} ${tPatrol('sheetUnit')}`}
                      </p>
                    </div>
                    <FaMicrochip className={`w-5 h-5 ${colors.text} opacity-60`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mt-6! mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {t("roleBasedDashboard.quickStats.title")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={[
                {
                  label: tPatrol('summaryTotal'),
                  smd: sheets?.length || 0,
                  patrol: patrolSessions?.length || 0,
                },
                {
                  label: tPatrol('summaryPending'),
                  smd: sheets?.filter(s => s.status === "pending").length || 0,
                  patrol: patrolSessions?.filter(s => s.status === "Pending").length || 0,
                },
                {
                  label: tPatrol('summarySubmitted'),
                  smd: sheets?.filter(s => s.status === "PQCDone").length || 0,
                  patrol: patrolSessions?.filter(s => s.status === "Submitted").length || 0,
                },
                {
                  label: tPatrol('summaryCompleted'),
                  smd: sheets?.filter(s => s.status === "KoreaManagerDone").length || 0,
                  patrol: patrolSessions?.filter(s => s.status === "Approved").length || 0,
                },
              ]}
              barCategoryGap="30%"
              margin={{ top: 10, right: 40, bottom: 10, left: 10 }}
              style={{ outline: "none" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="smd"
                orientation="left"
                tick={{ fontSize: 11, fill: "#3b82f6" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
              />
              <YAxis
                yAxisId="patrol"
                orientation="right"
                tick={{ fontSize: 11, fill: "#10b981" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.96)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                cursor={false}
              />
              <Legend verticalAlign="top" align="right" height={36} />
              <Bar
                yAxisId="smd"
                dataKey="smd"
                name="SMD Sheet"
                fill="#3b82f6"
                radius={0}
                barSize={24}
              />
              <Line
                yAxisId="patrol"
                type="monotone"
                dataKey="patrol"
                name="PATROL Sheet"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Combined SMD Sheet Trend and Details Card */}
        <SmdTrendCard
          timelineStats={timelineStats}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          shiftFilter={shiftFilter}
          setShiftFilter={setShiftFilter}
          onPointClick={handlePointClick}
          fontSize={fontSize}
          t={t}
          selectedSheets={selectedSheets}
          selectedPoint={selectedPoint}
          selectedPointLabel={selectedPointLabel}
          selectedPointInfo={selectedPointInfo}
          detailTableRef={detailTableRef}
          userRole={user?.role}
          highlightedSheetId={highlightedSheetId}
          navigate={navigate}
          detailTablePage={detailTablePage}
          onDetailTablePageChange={setDetailTablePage}
        />

        {/* Combined PATROL Sheet Trend Card */}
        <PatrolTrendCard
          patrolTimelineStats={patrolTimelineStats}
          patrolSessions={patrolSessions}
          lineAreas={lineAreas}
          fontSize={fontSize}
          userRole={user?.role}
          navigate={navigate}
          tPatrol={tPatrol}
          initialDate={patrolInitialDate}
          initialPage={patrolInitialPage}
          initialHighlightId={patrolInitialHighlight}
        />

        {/* Charts Grid - Chuyển sang 1 cột mỗi biểu đồ 1 row */}
        <div className="flex flex-col gap-6 mb-6">
          {/* Phân bổ Users theo Role */}
          <ChartCard title={t("charts.roleDistribution.title")}>
            <div className="h-[350px] outline-none">
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                <ComposedChart data={roleStats} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    cursor={false}
                    formatter={(value, name) => {
                      if (name === "value" || name === "Trend") return [null, null];
                      return [value, name];
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} />
                  <Bar
                    dataKey="value"
                    name={t("charts.roleDistribution.count")}
                    fill="#374151"
                    radius={0} // KHÔNG BO GÓC THEO YÊU CẦU
                    barSize={45}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#94a3b8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#fff', stroke: '#94a3b8', strokeWidth: 2, cursor: 'pointer' }}
                    activeDot={{ r: 6, strokeWidth: 0, cursor: 'pointer' }}
                    legendType="none" // ẨN KHỎI LEGEND
                    tooltipType="none"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Trạng thái SMD Sheets - Đã đổi sang ComposedChart */}
          <ChartCard title={t("charts.sheetStatus.title")}>
            <div className="h-[350px] outline-none">
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                <ComposedChart data={statusStats} layout="vertical" style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={120}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    cursor={false} // LOẠI BỎ ĐƯỜNG KẺ NGANG
                  />
                  <Legend verticalAlign="top" align="right" height={36} />
                  <Bar
                    dataKey="value"
                    name={t("charts.sheetStatus.count")}
                    fill="#374151"
                    radius={0}
                    barSize={30}
                    style={{ cursor: 'pointer' }} // THÊM CURSOR POINTER
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================

/** Wrapper card cho chart với ResponsiveContainer */
const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
    <h2 className="text-xl font-bold text-slate-800 mb-4">{title}</h2>
    <ResponsiveContainer width="100%" height={300}>
      {children as React.ReactElement}
    </ResponsiveContainer>
  </div>
);

export default Dashboard;


