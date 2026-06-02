/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaBug,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaEye,
  FaImage,
  FaLayerGroup,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineTableChart } from "react-icons/md";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import {
  fetchImagesBySession,
  fetchPatrolSessions,
  fetchStages,
  fetchCategories,
  fetchCheckLists,
  fetchLineAreas,
  fetchCheckListResults,
} from "../../redux/slices/patrolSlice";
import type { PatrolSharedProps } from "../../pages/patrol/types";

type PatrolKind = "daily" | "weekly";
type RangeMode = "7d" | "30d" | "all";
type ViewTab = "trend" | "breakdown" | "table";
type StatusMode = "all" | "Submitted" | "Approved";
type ShiftType = "day" | "night";

interface NGErrorItem {
  id: string;
  resultId: number;
  checkListId: number;
  stageName: string;
  categoryName: string;
  errorName: string;
  actualValue: string;
  note: string;
  checkAt: string;
  checkAtText: string;
  shift: ShiftType;
  shiftText: string;
}

interface SheetNGRecord {
  id: string;
  date: string;
  dateText: string;
  patrolType: string;
  sessionId: number;
  lineName: string;
  status: string;
  detectedBy: string;
  note: string;
  shift: ShiftType;
  shiftText: string;
  errors: NGErrorItem[];
  images: PatrolImageView[];
  imageCount: number;
  firstErrorName: string;
  stageSummary: string;
  categorySummary: string;
}

interface PatrolImageView {
  id: number;
  url: string;
  filename: string;
  note: string;
}

interface PeriodBucket {
  label: string;
  dateKey: string;
  total: number;
  records: SheetNGRecord[];
}

const COLORS = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#0369a1",
  "#0891b2",
  "#059669",
  "#4f46e5",
  "#9333ea",
];
const EMPTY = "—";
const DAY_START_HOUR = 8;
const NIGHT_START_HOUR = 20;

function truncateText(value: any, max = 28) {
  const text = String(value || EMPTY)
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function parseDate(value?: string | Date | null) {
  const d = value ? new Date(value) : new Date("");
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtDateKey(key: string) {
  if (!key) return EMPTY;
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

function fmtShort(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDateTime(value?: string) {
  const d = parseDate(value);
  if (!d) return EMPTY;
  return `${fmtShort(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getBusinessDate(value?: string | Date | null) {
  const d = parseDate(value);
  if (!d) return null;

  const businessDate = new Date(d);
  if (businessDate.getHours() < DAY_START_HOUR) {
    businessDate.setDate(businessDate.getDate() - 1);
  }
  businessDate.setHours(0, 0, 0, 0);

  return businessDate;
}

function getBusinessDateKey(value?: string | Date | null) {
  const d = getBusinessDate(value);
  return d ? formatLocalDateKey(d) : "";
}

function getShift(value?: string | Date | null): ShiftType {
  const d = parseDate(value);
  if (!d) return "day";
  const hour = d.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "day" : "night";
}

function getShiftText(shift: ShiftType) {
  return shift === "day" ? "Ca ngày" : "Ca đêm";
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfBusinessDate(date: Date) {
  const d = new Date(date);
  d.setHours(DAY_START_HOUR, 0, 0, 0);
  return d;
}

function endOfBusinessDate(date: Date) {
  const d = addDays(date, 1);
  d.setHours(DAY_START_HOUR - 1, 59, 59, 999);
  return d;
}

function getRange(mode: RangeMode, offset: number, firstDateKey?: string) {
  const now = new Date();
  const currentBusinessDate = getBusinessDate(now) || new Date();

  if (mode === "7d") {
    const endBusiness = addDays(currentBusinessDate, -offset * 7);
    const startBusiness = addDays(endBusiness, -6);
    return {
      start: startOfBusinessDate(startBusiness),
      end: endOfBusinessDate(endBusiness),
      startKey: formatLocalDateKey(startBusiness),
      endKey: formatLocalDateKey(endBusiness),
      label: `${fmtShort(startBusiness)} - ${fmtShort(endBusiness)}`,
    };
  }

  if (mode === "30d") {
    const endBusiness = addDays(currentBusinessDate, -offset * 30);
    const startBusiness = addDays(endBusiness, -29);
    return {
      start: startOfBusinessDate(startBusiness),
      end: endOfBusinessDate(endBusiness),
      startKey: formatLocalDateKey(startBusiness),
      endKey: formatLocalDateKey(endBusiness),
      label: `${fmtShort(startBusiness)} - ${fmtShort(endBusiness)}`,
    };
  }

  const fallbackStart = addDays(currentBusinessDate, -29);
  const parsedFirst = firstDateKey ? parseDate(`${firstDateKey}T00:00:00`) : null;
  const startBusiness = parsedFirst || fallbackStart;

  return {
    start: startOfBusinessDate(startBusiness),
    end: endOfBusinessDate(currentBusinessDate),
    startKey: formatLocalDateKey(startBusiness),
    endKey: formatLocalDateKey(currentBusinessDate),
    label: `Tất cả: ${fmtShort(startBusiness)} - ${fmtShort(currentBusinessDate)}`,
  };
}

function groupBy<T>(arr: T[], getKey: (item: T) => string) {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item) || EMPTY;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

function uniqText(values: string[], limit = 3) {
  const arr = Array.from(new Set(values.filter((x) => x && x !== EMPTY)));
  if (!arr.length) return EMPTY;
  if (arr.length <= limit) return arr.join(", ");
  return `${arr.slice(0, limit).join(", ")} +${arr.length - limit}`;
}

function topCount<T>(records: T[], getKey: (item: T) => string, limit = 10) {
  return Object.entries(groupBy(records, getKey))
    .map(([name, rows]) => ({ name, value: rows.length, records: rows }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function isNG(value?: string) {
  return String(value || "").trim().toUpperCase() === "NG";
}

function normalizePatrolKind(value?: string): PatrolKind | null {
  const v = String(value || "").toLowerCase();
  if (v === "1" || v === "daily") return "daily";
  if (v === "7" || v === "weekly") return "weekly";
  return null;
}

function buildImageView(img: any): PatrolImageView {
  return {
    id: Number(img?.id || 0),
    url: img?.imageUrl || img?.url || "",
    filename: img?.fileName || img?.filename || "",
    note: img?.note || "",
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-bold text-slate-500">{label}</p>
      {payload.map((item: any, index: number) => {
        if (item.value === 0 || item.value == null) return null;
        return (
          <div
            key={index}
            className="flex items-center justify-between gap-5 py-0.5 text-xs"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.name}
            </span>
            <span className="font-bold text-slate-900">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const RANGE_OPTIONS: { key: RangeMode; label: string }[] = [
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "all", label: "Tất cả" },
];

const STATUS_OPTIONS: { key: StatusMode; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "Submitted", label: "Submitted" },
  { key: "Approved", label: "Approved" },
];

const TABS: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
  { key: "trend", label: "Biểu đồ", icon: <FaBug size={12} /> },
  { key: "breakdown", label: "Phân tích", icon: <FaLayerGroup size={12} /> },
  {
    key: "table",
    label: "Chi tiết lỗi",
    icon: <MdOutlineTableChart size={14} />,
  },
];

const NGDefectAnalyticsChart: React.FC<
  PatrolSharedProps & {
    compact?: boolean;
    type?: PatrolKind;
  }
> = ({ type, activeTab, compact, goToView, setPreviewImage }) => {
  const {
    sessions,
    stages,
    categories,
    checkLists,
    checkListResults,
    lineAreas,
    images,
    loading,
    loadedImageSessionIds,
  } = useAppSelector((state: any) => state.patrol);

  const patrolType: PatrolKind = type || activeTab || "daily";

  const [rangeMode, setRangeMode] = useState<RangeMode>("7d");
  const [offset, setOffset] = useState(0);
  const [statusMode, setStatusMode] = useState<StatusMode>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("trend");
  const [drillDate, setDrillDate] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SheetNGRecord | null>(
    null,
  );
  const [highlightSessionId, setHighlightSessionId] = useState<number | null>(
    null,
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!sessions?.length) dispatch(fetchPatrolSessions());
    if (!stages?.length) dispatch(fetchStages());
    if (!categories?.length) dispatch(fetchCategories());
    if (!checkLists?.length) dispatch(fetchCheckLists());
    if (!lineAreas?.length) dispatch(fetchLineAreas());
    if (!checkListResults?.length) dispatch(fetchCheckListResults());
  }, [
    dispatch,
    sessions?.length,
    stages?.length,
    categories?.length,
    checkLists?.length,
    lineAreas?.length,
    checkListResults?.length,
  ]);

  type CheckListLookup = {
    id: number;
    categoryId: number;
    questionCheck: string;
    spec: string;
    specType?: string;
    isActive?: boolean;
  };

  type CategoryLookup = {
    id: number;
    stageId: number;
    name: string;
    isActive?: boolean;
  };

  type StageLookup = {
    id: number;
    name: string;
    patrolType: string;
    isActive?: boolean;
  };

  type LineLookup = {
    id: number;
    note?: string;
    lineAreaName: string;
    isActive?: boolean;
  };

  const lineMap = useMemo<Map<number, LineLookup>>(() => {
    return new Map(
      (lineAreas || []).map((line: any) => [
        Number(line.id),
        {
          id: Number(line.id),
          note: line.note || "",
          lineAreaName: line.lineAreaName || "",
          isActive: line.isActive,
        },
      ]),
    );
  }, [lineAreas]);

  const stageMap = useMemo<Map<number, StageLookup>>(() => {
    return new Map(
      (stages || []).map((stage: any) => [
        Number(stage.id),
        {
          id: Number(stage.id),
          name: stage.name || "",
          patrolType: String(stage.patrolType || ""),
          isActive: stage.isActive,
        },
      ]),
    );
  }, [stages]);

  const categoryMap = useMemo<Map<number, CategoryLookup>>(() => {
    return new Map(
      (categories || []).map((category: any) => [
        Number(category.id),
        {
          id: Number(category.id),
          stageId: Number(category.stageId),
          name: category.name || "",
          isActive: category.isActive,
        },
      ]),
    );
  }, [categories]);

  const checkListMap = useMemo<Map<number, CheckListLookup>>(() => {
    return new Map(
      (checkLists || []).map((checkList: any) => [
        Number(checkList.id),
        {
          id: Number(checkList.id),
          categoryId: Number(checkList.categoryId),
          questionCheck: checkList.questionCheck || "",
          spec: checkList.spec || "",
          specType: checkList.specType,
          isActive: checkList.isActive,
        },
      ]),
    );
  }, [checkLists]);

  const imagesBySession = useMemo(() => {
    return groupBy(images || [], (img: any) =>
      String(Number(img?.patrolSessionId || 0)),
    );
  }, [images]);

  const resultsBySession = useMemo(() => {
    return groupBy(checkListResults || [], (result: any) =>
      String(Number(result?.patrolSessionId || 0)),
    );
  }, [checkListResults]);

  const allSheetRecords = useMemo<SheetNGRecord[]>(() => {
    return (sessions || [])
      .filter(
        (session: any) =>
          normalizePatrolKind(session?.patrolType) === patrolType,
      )
      .filter((session: any) => {
        if (statusMode === "all") return true;
        return String(session?.status || "") === statusMode;
      })
      .map((session: any) => {
        const sessionId = Number(session?.id || 0);
        const line = lineMap.get(Number(session?.lineAreaId));
        const sessionImages = (imagesBySession[String(sessionId)] || []).map(
          buildImageView,
        );

        const sessionResults =
          Array.isArray(session?.checkListResults) &&
          session.checkListResults.length > 0
            ? session.checkListResults
            : resultsBySession[String(sessionId)] || [];

        const errors: NGErrorItem[] = sessionResults
          .filter((result: any) => isNG(result?.result))
          .map((result: any, index: number) => {
            const checkList = checkListMap.get(Number(result?.checkListId));
            const category = checkList
              ? categoryMap.get(Number(checkList.categoryId))
              : undefined;
            const stage = category
              ? stageMap.get(Number(category.stageId))
              : undefined;
            const checkAt = result?.checkAt || session?.createdAt || "";
            const shift = getShift(checkAt);

            return {
              id: `${sessionId}-${result?.id || result?.checkListId || index}`,
              resultId: Number(result?.id || 0),
              checkListId: Number(result?.checkListId || 0),
              stageName: stage?.name || EMPTY,
              categoryName: category?.name || EMPTY,
              errorName:
                checkList?.questionCheck || String(result?.checkListId || EMPTY),
              actualValue: result?.actualValue || EMPTY,
              note: result?.note || EMPTY,
              checkAt,
              checkAtText: fmtDateTime(checkAt),
              shift,
              shiftText: getShiftText(shift),
            };
          });

        if (!errors.length) return null;

        const firstTime =
          errors
            .map((x) => parseDate(x.checkAt))
            .filter(Boolean)
            .sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] ||
          parseDate(session?.createdAt) ||
          new Date();

        const dateKey = getBusinessDateKey(firstTime);
        const sheetShift = getShift(firstTime);
        const sheetNote = [
          session?.note,
          ...errors.map((x) => x.note).filter((x) => x && x !== EMPTY),
        ]
          .filter(Boolean)
          .join("\n");

        return {
          id: String(sessionId),
          date: dateKey,
          dateText: fmtDateKey(dateKey),
          patrolType: session?.patrolType || "",
          sessionId,
          lineName: line?.lineAreaName || EMPTY,
          status: session?.status || EMPTY,
          detectedBy: session?.fullName || EMPTY,
          note: sheetNote || EMPTY,
          shift: sheetShift,
          shiftText: getShiftText(sheetShift),
          errors,
          images: sessionImages,
          imageCount: sessionImages.length,
          firstErrorName: errors[0]?.errorName || EMPTY,
          stageSummary: uniqText(errors.map((x) => x.stageName)),
          categorySummary: uniqText(errors.map((x) => x.categoryName)),
        } as SheetNGRecord;
      })
      .filter(Boolean) as SheetNGRecord[];
  }, [
    sessions,
    patrolType,
    statusMode,
    imagesBySession,
    resultsBySession,
    lineMap,
    checkListMap,
    categoryMap,
    stageMap,
  ]);

  const firstDateKey = useMemo(() => {
    return allSheetRecords
      .map((record) => record.date)
      .filter(Boolean)
      .sort()[0];
  }, [allSheetRecords]);

  const {
    start,
    end,
    startKey,
    endKey,
    label: rangeLabel,
  } = useMemo(
    () => getRange(rangeMode, offset, firstDateKey),
    [rangeMode, offset, firstDateKey],
  );

  const rangeRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return allSheetRecords.filter((record) => {
      const businessDate = parseDate(`${record.date}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00`);
      const inRange = businessDate ? businessDate >= start && businessDate <= end : false;
      if (!inRange) return false;

      if (!kw) return true;
      return [
        record.sessionId,
        record.lineName,
        record.stageSummary,
        record.categorySummary,
        record.firstErrorName,
        record.note,
        record.detectedBy,
        ...record.errors.flatMap((x) => [
          x.stageName,
          x.categoryName,
          x.errorName,
          x.note,
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });
  }, [allSheetRecords, start, end, keyword]);

  const trendBuckets = useMemo<PeriodBucket[]>(() => {
    const days =
      Math.round(
        ((parseDate(`${endKey}T00:00:00`)?.getTime() || 0) -
          (parseDate(`${startKey}T00:00:00`)?.getTime() || 0)) /
          86400000,
      ) + 1;

    return Array.from({ length: Math.max(days, 0) }, (_, index) => {
      const d = addDays(parseDate(`${startKey}T00:00:00`) || new Date(), index);
      const key = formatLocalDateKey(d);
      const rows = rangeRecords.filter((record) => record.date === key);

      return {
        label: fmtShort(d),
        dateKey: key,
        total: rows.length,
        records: rows,
      };
    });
  }, [startKey, endKey, rangeRecords]);

  const activeRecords = useMemo(() => {
    if (!drillDate) return rangeRecords;
    return (
      trendBuckets.find((bucket) => bucket.dateKey === drillDate)?.records ||
      rangeRecords
    );
  }, [drillDate, trendBuckets, rangeRecords]);

  const activeErrors = useMemo(
    () => activeRecords.flatMap((record) => record.errors),
    [activeRecords],
  );

  const lineData = useMemo(
    () => topCount(activeRecords, (x) => x.lineName, 8),
    [activeRecords],
  );
  const errorData = useMemo(
    () => topCount(activeErrors, (x) => x.errorName, 10),
    [activeErrors],
  );
  const stageData = useMemo(
    () => topCount(activeErrors, (x) => x.stageName, 8),
    [activeErrors],
  );
  const inspectorData = useMemo(
    () => topCount(activeRecords, (x) => x.detectedBy, 8),
    [activeRecords],
  );

  const topLineKeys = useMemo(() => {
    return lineData.slice(0, 5).map((line, index) => ({
      key: `line_${index}`,
      name: line.name,
    }));
  }, [lineData]);

  const lineTrendData = useMemo(() => {
    return trendBuckets.map((bucket) => {
      const row: any = { label: bucket.label, total: bucket.total };
      const byLine = groupBy(bucket.records, (record) => record.lineName);
      topLineKeys.forEach((line) => {
        row[line.key] = byLine[line.name]?.length || 0;
      });
      return row;
    });
  }, [trendBuckets, topLineKeys]);

  const detailRows = useMemo(
    () => activeRecords.slice(0, compact ? 20 : 300),
    [activeRecords, compact],
  );

  const totalSheetNG = activeRecords.length;
  const totalErrorNG = activeErrors.length;
  const topLine = lineData[0]?.name || EMPTY;
  const imageLinkedCount = activeRecords.filter((x) => x.imageCount > 0).length;

  const openImage = useCallback(
    (img: PatrolImageView, title: string) => {
      if (!img.url) return;
      setPreviewImage?.({
        isOpen: true,
        url: img.url,
        title,
      });
    },
    [setPreviewImage],
  );

  const goToSheetDetailFromReport = useCallback(
    (row: SheetNGRecord) => {
      const state = {
      source: "report",
      returnPath: `${window.location.pathname}${window.location.search}`,
      highlightId: row.sessionId,
      type: patrolType,
      reportTab: "table",
      savedAt: Date.now(),
    };

    localStorage.setItem("patrolReportReturnState", JSON.stringify(state));
    goToView?.("detail", String(row.sessionId), patrolType);
        },
    [goToView, patrolType],
  );

  const handleBucketClick = useCallback(
    (data: any) => {
      const label = data?.activeLabel;
      const bucket = trendBuckets.find((x) => x.label === label);
      if (!bucket) return;
      setDrillDate((prev) => (prev === bucket.dateKey ? null : bucket.dateKey));
    },
    [trendBuckets],
  );

  useEffect(() => {
    if (!selectedRecord) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRecord(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRecord]);

  useEffect(() => {
  const raw = localStorage.getItem("patrolReportReturnState");
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);

    if (saved?.source !== "report" || !saved?.highlightId) return;

    setViewTab(saved.reportTab || "table");
    setHighlightSessionId(Number(saved.highlightId));

    const timer = window.setTimeout(() => {
      const el = document.getElementById(
        `patrol-report-row-${Number(saved.highlightId)}`,
      );

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 450);

    const clearTimer = window.setTimeout(() => {
      setHighlightSessionId(null);
      localStorage.removeItem("patrolReportReturnState");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  } catch {
    localStorage.removeItem("patrolReportReturnState");
  }
}, []);

  const visibleSessionIds = useMemo(() => {
    return Array.from(
      new Set(
        activeRecords.map((record) => Number(record.sessionId)).filter(Boolean),
      ),
    ).slice(0, 20);
  }, [activeRecords]);

  const imageRequestingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!visibleSessionIds.length) return;

    const loadedSet = new Set(
      (loadedImageSessionIds || []).map((id: any) => Number(id)),
    );

    visibleSessionIds.forEach((sessionId) => {
      if (!sessionId) return;
      const alreadyLoaded = loadedSet.has(sessionId);
      const alreadyRequesting = imageRequestingRef.current.has(sessionId);
      if (alreadyLoaded || alreadyRequesting) return;

      imageRequestingRef.current.add(sessionId);
      dispatch(fetchImagesBySession(sessionId))
        .unwrap()
        .catch(() => {
          imageRequestingRef.current.delete(sessionId);
        });
    });
  }, [dispatch, visibleSessionIds, loadedImageSessionIds]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-linear-to-r from-slate-950 to-slate-800 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg">
              <FaBug size={16} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Dashboard lỗi NG Patrol {patrolType === "daily" ? "Daily" : "Weekly"}
              </h3>
              <p className="text-xs text-slate-400">
                {rangeLabel} • Ngày sản xuất: 08:00 - 07:59
                {drillDate ? (
                  <span className="ml-2 text-amber-300">
                    • Đang lọc: {fmtDateKey(drillDate)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={rangeMode === "all"}
              onClick={() => setOffset((x) => x + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FaChevronLeft size={10} />
            </button>

            <div className="flex rounded-lg bg-slate-900 p-1">
              {RANGE_OPTIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRangeMode(item.key);
                    setOffset(0);
                    setDrillDate(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    rangeMode === item.key
                      ? "bg-red-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={offset === 0 || rangeMode === "all"}
              onClick={() => setOffset((x) => Math.max(0, x - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">Tổng sheet có NG</p>
            <p className="mt-1 text-2xl font-extrabold text-red-400">
              {totalSheetNG}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {totalErrorNG} lỗi chi tiết
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">Line lỗi nhiều nhất</p>
            <p className="mt-1 truncate text-sm font-bold text-amber-300">
              {topLine}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">Sheet có hình</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-300">
              {imageLinkedCount}/{totalSheetNG}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setViewTab(tab.key)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  viewTab === tab.key
                    ? "bg-red-50 text-red-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            {drillDate ? (
              <button
                type="button"
                onClick={() => setDrillDate(null)}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
              >
                Bỏ lọc ngày
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative p-3">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm sheet id, line, công đoạn, lỗi, note..."
                className="h-9 w-full rounded-lg border border-slate-200 pl-4! pr-3! text-xs outline-none focus:border-red-400 sm:w-72"
              />
            </div>

            <select
              value={statusMode}
              onChange={(e) => setStatusMode(e.target.value as StatusMode)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold outline-none focus:border-red-400"
            >
              {STATUS_OPTIONS.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5">
        {loading ? (
          <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
            Đang tải dữ liệu patrol...
          </div>
        ) : null}

        {!loading && viewTab === "trend" ? (
          <div className="space-y-4!">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Xu hướng sheet có lỗi NG
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mỗi ngày tính từ 08:00 hôm nay đến 07:59 hôm sau. Click vào cột để xem chi tiết sheet trong ngày đó.
                  </p>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendBuckets} onClick={handleBucketClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={false} content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Sheet có NG" radius={[6, 6, 0, 0]} maxBarSize={46}>
                      {trendBuckets.map((bucket) => (
                        <Cell
                          key={bucket.dateKey}
                          fill={bucket.dateKey === drillDate ? "#dc2626" : bucket.total > 0 ? "#ea580c" : "#e2e8f0"}
                          opacity={drillDate && bucket.dateKey !== drillDate ? 0.35 : 1}
                        />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="total" name="Trend" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {lineData.length > 0 ? (
              <div className="rounded-xl border border-slate-100 p-3">
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Sheet NG theo line
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={lineTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={false} content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      {topLineKeys.map((line, index) => (
                        <Bar
                          key={line.key}
                          dataKey={line.key}
                          name={line.name}
                          stackId="line"
                          fill={COLORS[index % COLORS.length]}
                          maxBarSize={42}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!loading && viewTab === "breakdown" ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-100 p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Top line phát sinh sheet NG</h4>
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lineData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={130} tickFormatter={(value) => truncateText(value, 18)} tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <RechartsTooltip cursor={false} content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Sheet NG" fill="#dc2626" radius={[0, 6, 6, 0]} maxBarSize={22} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Theo công đoạn</h4>
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={95} paddingAngle={2}>
                      {stageData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip cursor={false} content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4 xl:col-span-2">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Top nội dung lỗi</h4>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={errorData} layout="vertical" margin={{ left: 20, right: 24 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={220} tickFormatter={(value) => truncateText(value, 34)} tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <RechartsTooltip cursor={false} content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Số lần NG" fill="#ea580c" radius={[0, 6, 6, 0]} maxBarSize={22} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4 xl:col-span-2">
              <h4 className="mb-3 text-sm font-bold text-slate-800">Người tạo/phát hiện</h4>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={inspectorData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => truncateText(value, 18)} />
                    <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={false} content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Sheet NG" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={42} />
                    <Line type="monotone" dataKey="value" name="Trend" stroke="#dc2626" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && viewTab === "table" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Hiển thị {detailRows.length}/{activeRecords.length} sheet có NG.
                <span className="ml-1 text-red-500">
                  Mỗi Patrol Sheet ID chỉ hiển thị 1 dòng, lỗi chi tiết nằm trong modal.
                </span>
              </p>
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {["Ngày SX", "Ca", "Patrol Sheet ID", "Line", "Công đoạn", "Hạng mục", "Số lỗi", "Hình", "Xem"].map((title) => (
                      <th key={title} className="border-b border-slate-200 px-3 py-3 text-left font-bold text-slate-500">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => (
                    <tr
                      id={`patrol-report-row-${row.sessionId}`}
                      key={row.id}
                      onClick={() => goToSheetDetailFromReport(row)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-red-50/40 ${
                        highlightSessionId === row.sessionId ? "bg-yellow-100 ring-2 ring-yellow-400" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600">{row.dateText}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${row.shift === "day" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>
                          {row.shiftText}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-900">#{row.sessionId}</td>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        <span className="block max-w-24 truncate" title={row.lineName}>{row.lineName}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="block max-w-4 truncate" title={row.stageSummary}>{row.stageSummary}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="block max-w-[180px] truncate" title={row.categorySummary}>{row.categorySummary}</span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRecord(row);
                          }}
                          className="rounded-lg bg-red-50 px-2 py-1 text-left font-bold text-red-600 hover:underline"
                          title={row.firstErrorName}
                        >
                          {row.errors.length} lỗi
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {row.images.length > 0 ? (
                          <div className="flex max-w-[150px] gap-1 overflow-x-auto">
                            {row.images.slice(0, 3).map((img, index) => (
                              <button
                                key={`${row.id}-${img.id}-${index}`}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openImage(img, `${row.lineName} - Sheet #${row.sessionId}`);
                                }}
                                className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                title={img.note || img.filename}
                              >
                                <img src={img.url} alt={img.note || img.filename || "patrol error"} className="h-full w-full object-cover" />
                                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex">
                                  <FaImage size={13} />
                                </span>
                              </button>
                            ))}

                            {row.images.length > 3 ? (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                                +{row.images.length - 3}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-400">
                            <FaImage size={10} /> Chưa có
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-left">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedRecord(row);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          title="Xem chi tiết lỗi"
                        >
                          <FaEye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {detailRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-12 text-center text-sm text-slate-400">
                        Không có sheet NG trong bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {detailRows.map((row) => (
                <div
                  key={row.id}
                  id={`patrol-report-row-${row.sessionId}`}
                  onClick={() => goToSheetDetailFromReport(row)}
                  className={`rounded-xl border border-slate-200 p-3 shadow-sm ${
                    highlightSessionId === row.sessionId ? "bg-yellow-100 ring-2 ring-yellow-400" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        {row.dateText} • {row.shiftText}
                      </p>
                      <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                        Sheet #{row.sessionId} • {row.lineName}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-red-600">
                        {row.errors.length} lỗi NG
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedRecord(row);
                      }}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600"
                    >
                      Xem
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-slate-400">Công đoạn</p>
                      <p className="font-bold text-slate-700">{row.stageSummary}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-slate-400">Hạng mục</p>
                      <p className="font-bold text-slate-700">{row.categorySummary}</p>
                    </div>
                  </div>

                  {row.images.length > 0 ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {row.images.slice(0, 4).map((img, index) => (
                        <button
                          key={`${row.id}-${img.id}-${index}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openImage(img, `${row.lineName} - Sheet #${row.sessionId}`);
                          }}
                          className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                        >
                          <img src={img.url} alt={img.note || img.filename || "patrol error"} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {detailRows.length === 0 ? (
                <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-400">
                  Không có sheet NG trong bộ lọc hiện tại.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {selectedRecord ? (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                  Chi tiết sheet NG
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Patrol Sheet ID #{selectedRecord.sessionId}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRecord.dateText} • {selectedRecord.shiftText} • {selectedRecord.lineName} • {selectedRecord.detectedBy}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-86px)] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Ngày sản xuất</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedRecord.dateText}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Ca</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedRecord.shiftText}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Line</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedRecord.lineName}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Trạng thái sheet</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedRecord.status || EMPTY}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Danh sách lỗi trong sheet
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecord(null);
                      goToSheetDetailFromReport(selectedRecord);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-600"
                  >
                    Mở sheet <FaExternalLinkAlt size={10} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {["#", "Thời điểm", "Ca", "Công đoạn", "Hạng mục", "Nội dung lỗi", "Note"].map((title) => (
                          <th key={title} className="border-b border-slate-200 px-3 py-3 text-left font-bold text-slate-500">
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.errors.map((error, index) => (
                        <tr key={error.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-3 py-3 font-mono text-slate-500">{index + 1}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">{error.checkAtText}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">{error.shiftText}</td>
                          <td className="px-3 py-3 font-semibold text-slate-800">{error.stageName}</td>
                          <td className="px-3 py-3 text-slate-700">{error.categoryName}</td>
                          <td className="min-w-[260px] px-3 py-3 font-bold text-red-600">{error.errorName}</td>
                          <td className="min-w-[180px] px-3 py-3 text-slate-600">{error.note || EMPTY}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-red-50 p-3">
                <p className="text-xs font-bold text-red-400">Note của sheet / lỗi</p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-red-700">
                  {selectedRecord.note || EMPTY}
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Hình ảnh minh chứng
                  </h4>
                </div>

                {selectedRecord.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6! pb-6!">
                    {selectedRecord.images.map((img, index) => (
                      <button
                        key={`${selectedRecord.id}-modal-${img.id}-${index}`}
                        type="button"
                        onClick={() => openImage(img, `${selectedRecord.lineName} - Sheet #${selectedRecord.sessionId}`)}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left"
                      >
                        <img src={img.url} alt={img.note || img.filename || "patrol error"} className="h-32 w-full object-cover" />
                        <div className="p-2">
                          <p className="truncate text-[11px] font-semibold text-slate-600">
                            {img.note || img.filename || "Ảnh sheet"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400 p-3">
                    Chưa có hình ảnh cho sheet này.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NGDefectAnalyticsChart;
