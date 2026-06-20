/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import ReactPaginate from "react-paginate";
import {
  FaPlus,
  FaTrash,
  FaChartBar,
  FaCog,
  FaEye,
  FaCheck,
} from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import type { PatrolSharedProps } from "./types";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  fetchLineAreas,
  deletePatrolSession,
  updatePatrolSessionStatus,
  filterPatrolSessions,
} from "../../redux/slices/patrolSlice";
import PatrolFilterBar, {
  type PatrolFilter,
  PATROL_FILTER_DEFAULT,
} from "../../components/general/PatrolFilterBar";
import {
  readPatrolNavState,
  clearPatrolNavState,
  savePatrolNavStateWithTimestamp,
} from "../../utils/patrolNavState";
import { useSearchParams } from "react-router-dom";
import { ConfirmModal } from "../../components/general/ConfirmModal";
import LoadingSpinner from "../../components/general/LoadingSpinner";

interface PatrolListProps extends PatrolSharedProps {
  type: "daily" | "weekly";
}

const ITEMS_PER_PAGE = 10;

const PatrolList: React.FC<PatrolListProps> = ({
  user,
  goToView,
  setSearchParams,
  type,
}) => {
  const { t } = useTranslation("patrol");
  const dispatch = useAppDispatch();
  const { filteredSessionsResult, lineAreas } = useAppSelector(
    (state) => state.patrol,
  );

  // Loading riêng cho danh sách session. Trước đây dùng chung cờ `loading` với
  // fetchLineAreas() => lineAreas tải xong trước làm tắt loading sớm, gây "nháy"
  // trạng thái rỗng trước khi danh sách kịp về. Tách riêng để tránh việc đó.
  const [listLoading, setListLoading] = useState(true);

  // Cache-first: nếu store đã có dữ liệu thì làm mới ở chế độ nền (silent) —
  // không bật spinner chặn. Chỉ hiện spinner khi chưa có gì để hiển thị (lần đầu).
  const runFilter = (params: any, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setListLoading(true);
    return dispatch(filterPatrolSessions(params))
      .unwrap()
      .catch(() => {})
      .finally(() => {
        if (!silent) setListLoading(false);
      });
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status") || "";
  const [filter, setFilter] = useState<PatrolFilter>({
    ...PATROL_FILTER_DEFAULT,
    status: statusFromUrl,
  });
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const patrolTypeCode = type === "daily" ? "1" : "7";
  const isDaily = type === "daily";

  const fullNameCandidates = useMemo(
    () => [
      ...new Set(filteredSessionsResult.map((s) => s.fullName).filter(Boolean)),
    ],
    [filteredSessionsResult],
  );

  const pT = (key: string, options?: any) => {
    if (user?.role === "PQC") return t(key, { ...options, lng: "vi" }) as any;
    return t(key, options) as any;
  };

  // ======================== INIT: restore nav state ========================

  useEffect(() => {
    dispatch(fetchLineAreas());

    const saved = readPatrolNavState();

    // Cache-first: đã có dữ liệu trong store thì hiển thị ngay, refetch chạy nền.
    const hasCache = filteredSessionsResult.length > 0;
    if (hasCache) setListLoading(false);

    if (saved && saved.type === type) {
      setCurrentPage(saved.page);

      if (saved.highlightId) {
        setHighlightId(saved.highlightId);
        highlightTimerRef.current = setTimeout(
          () => setHighlightId(null),
          2500,
        );
      }

      if (saved.filter) {
        setFilter(saved.filter);
        runFilter(
          {
            fullName: saved.filter.fullName || undefined,
            lineAreaName: saved.filter.lineAreaName || undefined,
            status: saved.filter.status || undefined,
            fromDate: parseFilterDate(saved.filter.fromDate),
            toDate: parseFilterDate(saved.filter.toDate, true),
          },
          { silent: hasCache },
        );
      } else {
        runFilter({}, { silent: hasCache });
      }
    } else {
      if (statusFromUrl) {
        setFilter((prev) => ({ ...prev, status: statusFromUrl }));
        runFilter({ status: statusFromUrl }, { silent: hasCache });
      } else {
        // Daily & weekly dùng chung filteredSessionsResult (lọc theo patrolType ở
        // client). Khi chỉ đổi tab mà store đã có dữ liệu thì không cần gọi lại API
        // => tránh phải đợi tải lại toàn bộ danh sách.
        if (filteredSessionsResult.length === 0) {
          runFilter({});
        } else {
          setListLoading(false);
        }
      }
    }

    clearPatrolNavState();

    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [dispatch, type, statusFromUrl]);

  // Scroll đến row highlight sau khi data load
  useEffect(() => {
    if (!highlightId || filteredSessionsResult.length === 0) return;

    console.log("[SCROLL DEBUG] highlightId:", highlightId);
    console.log("[SCROLL DEBUG] currentPage:", currentPage);
    console.log(
      "[SCROLL DEBUG] filteredSheets count:",
      filteredSessionsResult.length,
    );
    console.log("[SCROLL DEBUG] isMobile:", window.innerWidth < 768);

    let attempts = 0;
    const maxAttempts = 15;

    const tryScroll = () => {
      const el = document.getElementById(`patrol-row-${highlightId}`);
      console.log(
        `[SCROLL DEBUG] attempt ${attempts + 1}: element found =`,
        !!el,
      );

      if (el) {
        console.log("[SCROLL DEBUG] scrolling to element!");
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const scrollContainer = document.querySelector(
            "main.flex-1.overflow-y-auto",
          );

          console.log("[SCROLL DEBUG] rect.top:", rect.top);
          console.log(
            "[SCROLL DEBUG] scrollContainer found:",
            !!scrollContainer,
          );
          console.log(
            "[SCROLL DEBUG] scrollContainer.scrollTop:",
            scrollContainer?.scrollTop,
          );
          console.log(
            "[SCROLL DEBUG] scrollContainer.clientHeight:",
            scrollContainer?.clientHeight,
          );

          if (scrollContainer) {
            const targetTop =
              scrollContainer.scrollTop +
              rect.top -
              scrollContainer.clientHeight / 2;
            console.log("[SCROLL DEBUG] scrolling to targetTop:", targetTop);
            scrollContainer.scrollTo({
              top: targetTop,
              behavior: "smooth",
            });
          } else {
            console.log("[SCROLL DEBUG] no container, fallback scrollIntoView");
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
        return;
      }

      // Log tất cả patrol-row hiện có trong DOM
      const allRows = document.querySelectorAll('[id^="patrol-row-"]');
      console.log(
        "[SCROLL DEBUG] all patrol-row ids in DOM:",
        Array.from(allRows).map((r) => r.id),
      );

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryScroll, 200);
      } else {
        console.log("[SCROLL DEBUG] FAILED after", maxAttempts, "attempts");
      }
    };

    const initialDelay = window.innerWidth < 768 ? 500 : 200;
    const timer = setTimeout(tryScroll, initialDelay);
    return () => clearTimeout(timer);
  }, [highlightId, filteredSessionsResult, currentPage]);

  // ======================== DATA ========================

  const filteredSheets = useMemo(
    () =>
      [...filteredSessionsResult]
        .filter((s) => s.patrolType === patrolTypeCode)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [filteredSessionsResult, patrolTypeCode],
  );

  const pageCount = Math.ceil(filteredSheets.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const currentSheets = filteredSheets.slice(offset, offset + ITEMS_PER_PAGE);

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ======================== NAVIGATE TO DETAIL ========================

  const handleGoToDetail = (sheetId: number) => {
    savePatrolNavStateWithTimestamp({
      type,
      page: currentPage,
      highlightId: sheetId,
      filter,
      source: type === "weekly" ? "weekly" : "list",
    });

    goToView("detail", sheetId.toString(), type);
  };

  // ======================== FILTER HANDLERS ========================

  const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const parseFilterDate = (value: string, fallbackEndOfDay = false) => {
  if (!value) return undefined;

  let dateStr = "";

  // input type="date": YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const time = fallbackEndOfDay ? "23:59:59" : "00:00:00";
    dateStr = `${value}T${time}`;
  }
  // datetime-local: YYYY-MM-DDTHH:mm
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    dateStr = value.slice(0, 19);
  }
  else {
    const slashDate = new Date(value);
    if (!isValidDate(slashDate)) return undefined;
    // Lấy local time components
    const y = slashDate.getFullYear();
    const mo = String(slashDate.getMonth() + 1).padStart(2, "0");
    const d = String(slashDate.getDate()).padStart(2, "0");
    const h = String(slashDate.getHours()).padStart(2, "0");
    const mi = String(slashDate.getMinutes()).padStart(2, "0");
    const s = String(slashDate.getSeconds()).padStart(2, "0");
    dateStr = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  }
  return `${dateStr}`;
};

const buildFilterParams = (f: PatrolFilter) => ({
  fullName: f.fullName || undefined,
  lineAreaName: f.lineAreaName || undefined,
  status: f.status || undefined,
  fromDate: parseFilterDate(f.fromDate),
  toDate: parseFilterDate(f.toDate, true),
});

  const dispatchFilter = (f: PatrolFilter) => {
    runFilter(buildFilterParams(f));
  };

  const handleFilterChange = (key: keyof PatrolFilter, value: string) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    setCurrentPage(0);

    if (key === "fromDate" || key === "toDate") {
      const from = key === "fromDate" ? value : filter.fromDate;
      const to = key === "toDate" ? value : filter.toDate;
      if ((from && !to) || (!from && to)) return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => dispatchFilter(newFilter), 400);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    dispatchFilter(filter);
  };
  const handleReset = () => {
    setFilter(PATROL_FILTER_DEFAULT);
    setCurrentPage(0);
    runFilter({});
  };

  // ======================== ACTION HANDLERS ========================

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteTargetId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deletePatrolSession(deleteTargetId)).unwrap();
      await runFilter(buildFilterParams(filter));
      toast.success(pT("deleteSuccess"));
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err || pT("errorOccurred"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = (id: number) => {
    dispatch(updatePatrolSessionStatus({ id, status: "Approved" }))
      .unwrap()
      .then(() => toast.success(pT("statusApproved")))
      .catch((err) => toast.error(err));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Submitted":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Approved":
        return pT("statusApproved");
      case "Submitted":
        return pT("statusSubmitted");
      default:
        return pT("statusPending");
    }
  };

  const canEditOrDelete = (sheet: any) => {
    if (!user) return false;
    if (user.role === "PQCLeader") return true;
    if (
      user.role === "PQC" &&
      sheet.status === "Pending" &&
      sheet.accountId === user.id
    )
      return true;
    return false;
  };

  // ======================== RENDER ========================

  return (
    <div className="animate-fade-in space-y-4! mt-6!">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaPencil className="text-gray-600" /> {pT("mainTitle")}
          </h1>
          <p className="text-gray-500 text-sm m-0">{pT("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                toast.error(pT("msgDeviceNotSupportedForReport"));
              } else {
                goToView("report");
              }
            }}
            className="flex-1 sm:flex-none bg-gray-600 hover:opacity-70 text-white px-4 py-2 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <FaChartBar /> {pT("reportBtn")}
          </button>
          {user?.role === "PQCLeader" && (
            <button
              onClick={() => goToView("manage")}
              className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FaCog /> {pT("configBtn")}
            </button>
          )}
          {user?.role === "PQC" && (
            <button
              onClick={() => {
                savePatrolNavStateWithTimestamp({
                  type,
                  page: currentPage,
                  highlightId: null,
                  filter,
                  source: type === "weekly" ? "weekly" : "list",
                });

                goToView("detail", "new", type);
              }}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <FaPlus /> {pT("createBtn")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-gray-200">
        <button
          onClick={() => setSearchParams({ view: "list", type: "daily" })}
          className={`pb-2 pt-3 font-bold transition-all ${isDaily ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          {pT("dailyTab")}
        </button>
        <button
          onClick={() => setSearchParams({ view: "list", type: "weekly" })}
          className={`pb-2 pt-3 font-bold transition-all ${!isDaily ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          {pT("weeklyTab")}
        </button>
      </div>

      {/* Filter Bar - always visible */}
      <PatrolFilterBar
        filter={filter}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        lineAreas={lineAreas}
        fullNameCandidates={fullNameCandidates}
        totalCount={filteredSheets.length}
        loading={listLoading}
        showFullName={user?.role === "PQCLeader"}
        statusOptions={[
          { value: "", label: `${pT("colStatus")}` },
          { value: "Pending", label: pT("statusPending") },
          { value: "Submitted", label: pT("statusSubmitted") },
          { value: "Approved", label: pT("statusApproved") },
        ]}
        labels={{
          fullName: pT("colCreator"),
          lineArea: pT("colLine"),
          status: pT("colStatus"),
          fromDate: pT("fromDate"),
          toDate: pT("toDate"),
          search: pT("searchBtn"),
          searching: pT("searchingBtn"),
          reset: pT("resetBtn"),
          results: pT("colResult"),
        }}
      />

      {/* Loading state */}
      {listLoading ? (
        <div className="bg-white border border-gray-200 shadow-sm">
          <LoadingSpinner size="sm" message={pT("searchingBtn")} />
        </div>
      ) : currentSheets.length === 0 ? (
        <div className="text-center py-8 bg-white border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium m-0 p-4!">
            {isDaily ? pT("emptyDaily") : pT("emptyWeekly")}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white shadow-sm">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("colSheetId")}
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("colCreator")}
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("colLine")}
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("colTime")}
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("colStatus")}
                  </th>
                  {/* Cột mới */}
                  <th className="border border-gray-300 px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("approval")}
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {pT("colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {currentSheets.map((sheet) => {
                  const isHighlighted = highlightId === sheet.id;
                  return (
                    <tr
                      id={`patrol-row-${sheet.id}`}
                      key={sheet.id}
                      onClick={() => handleGoToDetail(sheet.id)}
                      className={`transition-all duration-500 cursor-pointer ${
                        isHighlighted
                          ? "bg-blue-50 ring-2 ring-inset ring-blue-400 shadow-sm"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="border border-gray-300 px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span
                          className={
                            isHighlighted ? "text-blue-600 font-bold" : ""
                          }
                        >
                          #{sheet.id}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sheet.fullName}
                      </td>
                      <td className="border border-gray-300 px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {lineAreas.find((l) => l.id === sheet.lineAreaId)
                            ?.lineAreaName || "N/A"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sheet.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="border border-gray-300 px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyle(sheet.status)}`}
                        >
                          {getStatusLabel(sheet.status)}
                        </span>
                      </td>

                      {/* Cột Ký Duyệt */}
                      <td
                        className="border border-gray-300 px-4 py-3 whitespace-nowrap text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user?.role === "PQCLeader" &&
                        sheet.status === "Submitted" ? (
                          <button
                            onClick={() => handleApprove(sheet.id)}
                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 !rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
                          >
                            <FaCheck className="w-3.5 h-3.5" />{" "}
                            <span>{pT("approveBtn")}</span>
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              sheet.status === "Approved"
                                ? "text-green-600 bg-green-50"
                                : sheet.status === "Submitted"
                                  ? "text-blue-500 bg-blue-50"
                                  : "text-gray-400 bg-gray-100"
                            }`}
                          >
                            {sheet.status === "Approved"
                              ? pT("statusApproved")
                              : sheet.status === "Submitted"
                                ? pT("statusSubmitted")
                                : pT("statusPending")}
                          </span>
                        )}
                      </td>

                      {/* Cột Thao Tác — chỉ Xem + Xóa */}
                      <td
                        className="border border-gray-300 px-4 py-3 whitespace-nowrap text-left text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-start gap-2">
                          <button
                            onClick={() => handleGoToDetail(sheet.id)}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 !rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
                          >
                            <FaEye className="w-3.5 h-3.5" />{" "}
                            <span>{pT("viewBtn")}</span>
                          </button>
                          {canEditOrDelete(sheet) && (
                            <button
                              onClick={() => handleDelete(sheet.id)}
                              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 !rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
                            >
                              <FaTrash className="w-3.5 h-3.5" />{" "}
                              <span>{pT("deleteBtn")}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {currentSheets.map((sheet) => {
              const isHighlighted = highlightId === sheet.id;
              return (
                <div
                  id={`patrol-row-${sheet.id}`}
                  key={sheet.id}
                  onClick={() => handleGoToDetail(sheet.id)}
                  className={`p-4 shadow-sm border transition-all duration-500 cursor-pointer ${
                    isHighlighted
                      ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                      : "bg-white border-gray-200 hover:shadow-md hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`mb-0 text-sm font-medium ${isHighlighted ? "text-blue-600 font-bold" : "text-gray-500"}`}
                        >
                          #{sheet.id}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold ${isDaily ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50"}`}
                        >
                          {isDaily ? pT("dailyTab") : pT("weeklyTab")}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-0">
                        {sheet.fullName}
                      </p>
                      <p className="text-sm font-bold text-indigo-600 mb-0">
                        {pT("lineLabel")}:{" "}
                        {lineAreas.find((l) => l.id === sheet.lineAreaId)
                          ?.lineAreaName || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusStyle(sheet.status)}`}
                    >
                      {getStatusLabel(sheet.status)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">
                    {pT("colTime")}:{" "}
                    {new Date(sheet.createdAt).toLocaleString("vi-VN")}
                  </p>

                  {/* Nút Ký Duyệt riêng */}
                  {user?.role === "PQCLeader" &&
                    sheet.status === "Submitted" && (
                      <div
                        className="mb-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleApprove(sheet.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 !rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <FaCheck className="w-3.5 h-3.5" /> {pT("approveBtn")}
                        </button>
                      </div>
                    )}

                  {/* Thao tác: Xem + Xóa */}
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleGoToDetail(sheet.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 !rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <FaEye className="w-3.5 h-3.5" /> {pT("viewDetail")}
                    </button>
                    {canEditOrDelete(sheet) && (
                      <button
                        onClick={() => handleDelete(sheet.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 !rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <FaTrash className="w-3.5 h-3.5" />{" "}
                        <span>{pT("deleteBtn")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex justify-center mt-4 pb-4">
              <ReactPaginate
                previousLabel={t("pagination.previous", {
                  defaultValue: "Trước",
                })}
                nextLabel={t("pagination.next", { defaultValue: "Sau" })}
                breakLabel="..."
                pageCount={pageCount}
                marginPagesDisplayed={1}
                pageRangeDisplayed={3}
                onPageChange={handlePageChange}
                forcePage={currentPage}
                containerClassName="flex items-center gap-1 sm:gap-2 px-2"
                pageLinkClassName="px-3 py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-blue-50 hover:ring-blue-500 transition-all text-xs sm:text-sm font-medium no-underline!"
                previousLinkClassName="px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline!"
                nextLinkClassName="px-3 py-2 sm:px-4 sm:py-2 rounded-lg block ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium no-underline!"
                breakLinkClassName="px-1 sm:px-3 py-2 text-gray-500 text-xs sm:text-sm no-underline!"
                activeLinkClassName="!bg-blue-600 !text-white !ring-blue-600 no-underline!"
                disabledClassName="opacity-50 cursor-not-allowed"
                disabledLinkClassName="!cursor-not-allowed hover:!bg-transparent no-underline!"
              />
            </div>
          )}
        </>
      )}
      <ConfirmModal
        open={deleteTargetId !== null}
        title={pT("deleteTitle")}
        message={pT("deleteConfirm")}
        confirmText={isDeleting ? pT("deletingBtn") : pT("deleteBtn")}
        cancelText={pT("cancelBtn")}
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default PatrolList;
