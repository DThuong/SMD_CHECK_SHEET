// src/pages/dashboard/PatrolTrendCard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ReactPaginate from "react-paginate";
import { useNavigate } from "react-router-dom";
import type { PatrolSession, LineArea } from "../../redux/slices/patrolSlice";
import { savePatrolNavStateWithTimestamp } from "../../utils/patrolNavState";

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

export interface PatrolTimelineStat {
  date: string;
  fullDate: string;
  morning: number;
  night: number;
  count: number;
}

export interface PatrolTrendCardProps {
  patrolTimelineStats: PatrolTimelineStat[];
  patrolSessions: PatrolSession[];
  lineAreas: LineArea[];
  fontSize: number;
  userRole?: string;
  navigate: ReturnType<typeof useNavigate>;
  tPatrol: (key: string, opts?: any) => string;
  shiftFilter: "morning" | "night" | "both";
  setShiftFilter: (v: "morning" | "night" | "both") => void;
  getShiftDay: (date: Date) => { shift: "morning" | "night"; key: string };
  initialDate?: string | null;
  initialShift?: "morning" | "night" | null;
  initialPage?: number;
  initialHighlightId?: number | null;
}

const PatrolTrendCard: React.FC<PatrolTrendCardProps> = ({
  patrolTimelineStats,
  patrolSessions,
  lineAreas,
  fontSize,
  userRole,
  navigate,
  tPatrol,
  shiftFilter,
  setShiftFilter,
  getShiftDay,
  initialDate,
  initialShift,
  initialPage = 0,
  initialHighlightId,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<"morning" | "night" | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const [highlightPatrolId, setHighlightPatrolId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "weekly">("all");
  const patrolDetailRef = useRef<HTMLDivElement>(null);

  const pT = (key: string, opts?: any) => tPatrol(key, opts);

  // ── Click điểm trên chart ──
  const handleChartPointClick = (payload: any, shift: "morning" | "night") => {
    const pointData = payload?.payload ?? payload;
    if (!pointData?.fullDate) return;

    setSelectedDate(pointData.fullDate);
    setSelectedShift(shift);
    setActiveTab("all");
    setDetailPage(0);

    setTimeout(() => {
      patrolDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ── Lọc sessions theo shift-based date ──
  const daySessions = useMemo(() => {
    if (!selectedDate || !selectedShift || !patrolSessions?.length) return [];
    return patrolSessions.filter((session) => {
      if (!session.createdAt) return false;
      const { shift, key } = getShiftDay(new Date(session.createdAt));
      return key === selectedDate && shift === selectedShift;
    });
  }, [selectedDate, selectedShift, patrolSessions, getShiftDay]);

  const counts = useMemo(() => ({
    all: daySessions.length,
    daily: daySessions.filter((s) => s.patrolType === "1").length,
    weekly: daySessions.filter((s) => s.patrolType === "7").length,
  }), [daySessions]);

  const filteredSheets = useMemo(() => {
    if (activeTab === "daily") return daySessions.filter((s) => s.patrolType === "1");
    if (activeTab === "weekly") return daySessions.filter((s) => s.patrolType === "7");
    return daySessions;
  }, [daySessions, activeTab]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredSheets.length / itemsPerPage);

  const paginatedSheets = useMemo(() =>
    filteredSheets.slice(detailPage * itemsPerPage, (detailPage + 1) * itemsPerPage),
    [filteredSheets, detailPage],
  );

  // IIFE — tránh useMemo dependency pT
  const formattedDateLabel = (() => {
    if (!selectedDate) return "";
    const [, m, d] = selectedDate.split("-");
    const shiftLabel =
      selectedShift === "morning" ? pT("dayshift") :
      selectedShift === "night" ? pT("nightshift") : "";
    return `${d}/${m}${shiftLabel ? ` - ${shiftLabel}` : ""}`;
  })();

  const handleGoToDetail = (sheetId: number) => {
    const sheet = patrolSessions.find((s) => s.id === sheetId);
    const sheetType = sheet?.patrolType === "7" ? "weekly" : "daily";

    savePatrolNavStateWithTimestamp({
        type: sheetType,
        page: detailPage,
        highlightId: sheetId,
        source: "dashboard",
        fromDashboard: true,
        dashboardDate: selectedDate || "",
        dashboardShift: selectedShift ?? undefined, 
        dashboardReturnPath: window.location.pathname + window.location.search,
    });

    navigate(`/${userRole?.toLowerCase()}/patrol?view=detail&id=${sheetId}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-50 text-green-700 border border-green-200";
      case "Submitted": return "bg-blue-50 text-blue-700 border border-blue-200";
      default: return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Approved": return pT("statusApproved");
      case "Submitted": return pT("statusSubmitted");
      default: return pT("statusPending");
    }
  };

  // ── Restore state khi back từ patrol detail ──
  useEffect(() => {
    if (!initialDate) return;
    const t = setTimeout(() => {
      setSelectedDate(initialDate);
      setSelectedShift(initialShift ?? null);
      setDetailPage(initialPage);
    }, 0);
    return () => clearTimeout(t);
  }, [initialDate, initialShift, initialPage]);

  useEffect(() => {
    if (!initialHighlightId || !paginatedSheets.length) return;
    const isInPage = paginatedSheets.some((s) => s.id === initialHighlightId);
    if (!isInPage) return;

    const scrollTimer = setTimeout(() => {
      setHighlightPatrolId(initialHighlightId);
      document
        .querySelector(`[data-patrol-id="${initialHighlightId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    const clearTimer = setTimeout(() => setHighlightPatrolId(null), 2500);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [initialHighlightId, paginatedSheets]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-4 mt-6 transition-all duration-300 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{pT("patrolTrendTitle")}</h2>
          <p className="text-xs text-slate-500 mt-1">{pT("patrolTrendSubtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 animate-pulse">
            {pT("totalPatrolSheets")}:{" "}
            {patrolTimelineStats.reduce((sum, item) => sum + item.count, 0)}
          </span>

          {/* Shift filter */}
          <div className="flex gap-1 border-l pl-2">
            {(["both", "morning", "night"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShiftFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  shiftFilter === s
                    ? `text-white ${s === "morning" ? "bg-red-500" : s === "night" ? "bg-purple-600" : "bg-blue-500"}`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {s === "both" ? pT("charts.timeline.both") :
                 s === "morning" ? pT("charts.timeline.dayshift") :
                 pT("charts.timeline.nightshift")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250} className="[&_*:focus]:outline-none">
        <LineChart
          data={patrolTimelineStats}
          accessibilityLayer={false}
          style={{ outline: "none" }}
        >
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
              name={pT("charts.timeline.morningLegend")}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`pm-${payload.fullDate}`}
                    cx={cx} cy={cy} r={5}
                    fill="#E24B4A" stroke="#fff" strokeWidth={2}
                    style={{ cursor: "pointer", outline: "none" }}
                    onClick={() => handleChartPointClick(payload, "morning")}
                  />
                );
              }}
              activeDot={{
                r: 7,
                style: { cursor: "pointer", outline: "none" },
                onClick: (_: any, p: any) => handleChartPointClick(p, "morning"),
              }}
            />
          )}

          {(shiftFilter === "night" || shiftFilter === "both") && (
            <Line
              type="monotone"
              dataKey="night"
              stroke="#534AB7"
              strokeWidth={2}
              name={pT("charts.timeline.nightLegend")}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`pn-${payload.fullDate}`}
                    cx={cx} cy={cy} r={5}
                    fill="#534AB7" stroke="#fff" strokeWidth={2}
                    style={{ cursor: "pointer", outline: "none" }}
                    onClick={() => handleChartPointClick(payload, "night")}
                  />
                );
              }}
              activeDot={{
                r: 7,
                style: { cursor: "pointer", outline: "none" },
                onClick: (_: any, p: any) => handleChartPointClick(p, "night"),
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Detail table */}
      <div ref={patrolDetailRef} className="mt-6 pt-4 border-t border-slate-100 scroll-mt-6">
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center py-4 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-sm font-medium text-slate-500 m-0">{pT("clickPointToView")}</p>
          </div>
        ) : (
          <div>
            {/* Tab header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                {pT("showingPatrolSheets", { count: counts[activeTab], info: formattedDateLabel })}
              </span>
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/40">
                {(["all", "daily", "weekly"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setDetailPage(0); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      activeTab === tab
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab === "all" ? `${pT("all")} (${counts.all})` :
                     tab === "daily" ? `${pT("dailyPatrol")} (${counts.daily})` :
                     `${pT("weeklyPatrol")} (${counts.weekly})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Table / Cards */}
            <div className="overflow-x-auto min-h-[120px]">
              {paginatedSheets.length > 0 ? (
                <>
                  {/* Desktop */}
                  <div className="hidden md:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          {[pT("stt"), pT("sheetId"), pT("lineArea"), pT("creator"), pT("createdAt"), pT("status"), pT("action")]
                            .map((label, i) => (
                              <th key={i} className="py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                                {label}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSheets.map((sheet, index) => {
                          const lineName = lineAreas.find((l) => l.id === sheet.lineAreaId)?.lineAreaName || "N/A";
                          return (
                            <tr
                              key={sheet.id}
                              data-patrol-id={sheet.id}
                              onClick={() => handleGoToDetail(sheet.id)}
                              className={`border-b border-slate-100 cursor-pointer transition-all duration-500 ${
                                highlightPatrolId === sheet.id
                                  ? "bg-blue-100 ring-2 ring-inset ring-blue-400 shadow-md"
                                  : "hover:bg-slate-50/60"
                              }`}
                            >
                              <td className="py-3 px-3 text-sm text-slate-500">{detailPage * itemsPerPage + index + 1}</td>
                              <td className="py-3 px-3 text-sm font-semibold text-slate-900">#{sheet.id}</td>
                              <td className="py-3 px-3">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{lineName}</span>
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-700">{sheet.fullName}</td>
                              <td className="py-3 px-3 text-sm text-slate-500">{new Date(sheet.createdAt).toLocaleString("vi-VN")}</td>
                              <td className="py-3 px-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusStyle(sheet.status)}`}>
                                  {getStatusText(sheet.status)}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleGoToDetail(sheet.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {pT("view")}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="grid gap-3 md:hidden">
                    {paginatedSheets.map((sheet) => {
                      const lineName = lineAreas.find((l) => l.id === sheet.lineAreaId)?.lineAreaName || "N/A";
                      return (
                        <div
                          key={sheet.id}
                          data-patrol-id={sheet.id}
                          onClick={() => handleGoToDetail(sheet.id)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-500 ${
                            highlightPatrolId === sheet.id
                              ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                              : "bg-slate-50/40 border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-bold text-slate-400">#{sheet.id}</p>
                              <p className="text-sm font-bold text-slate-800">{sheet.fullName}</p>
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {pT("lineLabel")}: {lineName}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(sheet.status)}`}>
                              {getStatusText(sheet.status)}
                            </span>
                          </div>
                          <div
                            className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-slate-400">{new Date(sheet.createdAt).toLocaleString("vi-VN")}</span>
                            <button
                              onClick={() => handleGoToDetail(sheet.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg"
                            >
                              {pT("view")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-3 border-t border-slate-100 gap-3">
                      <span className="text-xs text-slate-500 font-semibold">
                        {pT("pageIndicator", { current: detailPage + 1, total: totalPages })}
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
                  <p className="text-sm font-semibold text-slate-400">{pT("noPatrolSheets")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatrolTrendCard;