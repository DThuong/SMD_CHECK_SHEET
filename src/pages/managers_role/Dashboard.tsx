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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
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
} from "react-icons/fa";
import { AiOutlineEye } from "react-icons/ai";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchUsers } from "../../redux/slices/authSlice";
import { fetchChangeModel } from "../../redux/slices/changeModelSlice";
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
  tableRef,
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
}: {
  selectedSheets: any[];
  selectedPoint: { date: string; shift: "morning" | "night" } | null;
  selectedPointLabel: string | null;
  tableRef: React.RefObject<HTMLDivElement | null>;
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
      ref={tableRef}
      className="bg-white rounded-xl shadow-lg p-4 mb-4 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-bold text-slate-800">
          {t("tables.sheetDetails.title")}
        </h2>
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
                    className={`border-b border-slate-100 transition-all duration-500 ${
                      highlightedSheetId === sheet.id
                        ? "bg-blue-100 ring-2 ring-blue-400 shadow-md scroll-mt-24" // highlight + offset khi scrollIntoView
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
                    <td className="py-3 px-4 text-center">
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
const TimelineChart = ({
  timelineStats,
  timeRange,
  setTimeRange,
  shiftFilter,
  setShiftFilter,
  onPointClick,
  fontSize,
  t,
}: {
  timelineStats: any[];
  timeRange: "week" | "month" | "all";
  setTimeRange: (v: "week" | "month" | "all") => void;
  shiftFilter: "morning" | "night" | "both";
  setShiftFilter: (v: "morning" | "night" | "both") => void;
  onPointClick: (data: any, index: number, shift: "morning" | "night") => void;
  fontSize: number;
  t: (key: string) => string;
}) => (
  <div className="bg-white rounded-xl shadow-lg p-4 mb-4 mt-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
      <h2 className="text-xl font-bold text-slate-800">
        {t("charts.timeline.title")}
      </h2>
      <div className="flex gap-2 flex-wrap">
        {(["week", "month", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === r
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                shiftFilter === s
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
  </div>
);

// ==================== MAIN COMPONENT ====================
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, users, usersLoading } = useAppSelector((state) => state.auth);
  const { sheets, filteredSheets, loadingList } = useAppSelector(
    (state) => state.changeModel,
  );

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
  const tableRef = useRef<HTMLDivElement>(null);
  // Lưu highlighted sheetId khi back từ SheetDetail
  const [highlightedSheetId, setHighlightedSheetId] = useState<number | null>(
    null,
  );
  const [detailTablePage, setDetailTablePage] = useState(0);

  const { t } = useTranslation("dashboard");
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

  // Restore chart selection + bảng chi tiết + trang phân trang khi back từ SheetDetail / File detail
  useEffect(() => {
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
    scrollDashboardToHighlightedRow(ds.sheetId!, tableRef.current);

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
      ).map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS[status] || "#6b7280",
      })),
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
          tableRef.current?.scrollIntoView({
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
                  className={`relative ${colors.bg} ${colors.hover} p-4 rounded-xl shadow-lg border-l-4 ${colors.border} transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-left ${
                    card.isUserCard && count > 0
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

          {/* Quick Stats */}
          <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {t("roleBasedDashboard.quickStats.title")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  value: sheets?.length || 0,
                  label: t("roleBasedDashboard.quickStats.totalSheets"),
                  color: "text-blue-600",
                },
                {
                  value:
                    sheets?.filter((s) => s.status === "pending").length || 0,
                  label: t("roleBasedDashboard.quickStats.pending"),
                  color: "text-orange-300",
                },
                {
                  value:
                    sheets?.filter((s) => s.status === "KoreaManagerDone")
                      .length || 0,
                  label: t("roleBasedDashboard.quickStats.completed"),
                  color: "text-green-600",
                },
                {
                  value: `${Math.round(((sheets?.filter((s) => s.status === "KoreaManagerDone").length || 0) / (sheets?.length || 1)) * 100)}%`,
                  label: t("roleBasedDashboard.quickStats.completionRate"),
                  color: "text-purple-600",
                },
              ].map((item, i) => (
                <div key={i} className="text-center border">
                  <p
                    className={`text-3xl font-bold ${item.color} mb-0 bg-blue-50 py-2`}
                  >
                    {item.value}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 py-2">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Chart — shared component */}
          <TimelineChart
            timelineStats={timelineStats}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            shiftFilter={shiftFilter}
            setShiftFilter={setShiftFilter}
            onPointClick={handlePointClick}
            fontSize={fontSize}
            t={t}
          />

          {/* Sheet Table — shared component, key reset page khi đổi điểm */}
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
            tableRef={tableRef}
            userRole={user?.role}
            highlightedSheetId={highlightedSheetId}
            navigate={navigate}
            t={t}
            timeRange={timeRange}
            shiftFilter={shiftFilter}
            detailTablePage={detailTablePage}
            onDetailTablePageChange={setDetailTablePage}
          />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard title={t("charts.roleDistribution.title")}>
              <BarChart data={roleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize }}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  stroke="#64748b"
                />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  name={t("charts.roleDistribution.count")}
                >
                  {roleStats.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>

            <ChartCard title={t("charts.sheetStatus.title")}>
              <PieChart>
                <Pie
                  data={statusStats}
                  cx="50%"
                  cy="50%"
                  labelLine
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusStats.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
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

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {t("roleBasedDashboard.quickStats.title")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                value: sheets?.length || 0,
                label: t("roleBasedDashboard.quickStats.totalSheets"),
                color: "text-blue-600",
              },
              {
                value:
                  sheets?.filter((s) => s.status === "pending").length || 0,
                label: t("roleBasedDashboard.quickStats.pending"),
                color: "text-orange-300",
              },
              {
                value:
                  sheets?.filter((s) => s.status === "KoreaManagerDone")
                    .length || 0,
                label: t("roleBasedDashboard.quickStats.completed"),
                color: "text-green-600",
              },
              {
                value: `${completionRate}%`,
                label: t("roleBasedDashboard.quickStats.completionRate"),
                color: "text-purple-600",
              },
            ].map((item, i) => (
              <div key={i} className="text-center border">
                <p
                  className={`text-3xl font-bold ${item.color} mb-0 bg-blue-50 py-2`}
                >
                  {item.value}
                </p>
                <p className="text-sm text-gray-600 mt-1 py-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Chart */}
        <TimelineChart
          timelineStats={timelineStats}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          shiftFilter={shiftFilter}
          setShiftFilter={setShiftFilter}
          onPointClick={handlePointClick}
          fontSize={fontSize}
          t={t}
        />

        {/* Sheet Table — key reset page khi đổi điểm */}
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
          tableRef={tableRef}
          userRole={user?.role}
          highlightedSheetId={highlightedSheetId}
          navigate={navigate}
          t={t}
          timeRange={timeRange}
          shiftFilter={shiftFilter}
          detailTablePage={detailTablePage}
          onDetailTablePageChange={setDetailTablePage}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ChartCard title={t("charts.roleDistribution.title")}>
            <BarChart data={roleStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize }}
                angle={-30}
                textAnchor="end"
                height={80}
                interval={0}
                stroke="#64748b"
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                name={t("charts.roleDistribution.count")}
              >
                {roleStats.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>

          <ChartCard title={t("charts.sheetStatus.title")}>
            <PieChart>
              <Pie
                data={statusStats}
                cx="50%"
                cy="50%"
                labelLine
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: any) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {statusStats.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
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
