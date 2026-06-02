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
import ReactPaginate from "react-paginate";
import { useTranslation } from "react-i18next";

type PatrolKind = "daily" | "weekly";
type RangeMode = "7d" | "30d" | "all";
type ViewTab = "trend" | "breakdown" | "table";
type ReportReturnMode = "trend-dot" | "table";
type StatusMode = "all" | "Submitted" | "Approved";
type ShiftType = "morning" | "night";
type ShiftFilter = "both" | "morning" | "night";

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
  sheetTime: string;
  sheetTimeText: string;
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
  morning: number;
  night: number;
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
const TREND_DETAIL_PAGE_SIZE = 10;

const PAGINATE_PROPS = {
  previousLabel: "←",
  nextLabel: "→",
  marginPagesDisplayed: 1,
  pageRangeDisplayed: 3,
  containerClassName: "flex items-center justify-center gap-1 flex-wrap py-1",
  pageLinkClassName:
    "flex items-center justify-center w-8 h-8 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-medium no-underline! border border-gray-200 transition-colors",
  activeLinkClassName: "!bg-red-600 !text-white !border-red-600",
  previousLinkClassName:
    "flex items-center justify-center px-3 h-8 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-medium no-underline! border border-gray-200 transition-colors",
  nextLinkClassName:
    "flex items-center justify-center px-3 h-8 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 font-medium no-underline! border border-gray-200 transition-colors",
  breakLinkClassName:
    "flex items-center justify-center w-8 h-8 text-xs text-gray-400 no-underline",
  disabledClassName: "opacity-40 cursor-not-allowed",
};

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

function getShiftDay(value?: string | Date | null): {
  shift: ShiftType;
  key: string;
} {
  const date = parseDate(value);

  if (!date) {
    return {
      shift: "morning",
      key: "",
    };
  }

  const hour = date.getHours();
  const baseDate = new Date(date);

  if (hour < DAY_START_HOUR) {
    baseDate.setDate(baseDate.getDate() - 1);
  }

  baseDate.setHours(0, 0, 0, 0);

  return {
    shift:
      hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "morning" : "night",
    key: formatLocalDateKey(baseDate),
  };
}

function getShiftText(shift: ShiftType, t?: (key: string) => string) {
  if (!t) return shift === "morning" ? "Ca ngày" : "Ca đêm";
  return shift === "morning" ? t("shiftMorning") : t("shiftNight");
}

function getStatusText(status?: string, t?: (key: string) => string) {
  switch (String(status || "")) {
    case "Submitted":
      return t ? t("statusSubmitted") : "Đã gửi";
    case "Approved":
      return t ? t("statusApproved") : "Đã duyệt";
    case "Pending":
      return t ? t("statusPending") : "Đang chờ";
    default:
      return status || EMPTY;
  }
}

function fmtTime(value?: string | Date | null) {
  const d = parseDate(value);
  if (!d) return EMPTY;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getDateTimeFilter(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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
  const parsedFirst = firstDateKey
    ? parseDate(`${firstDateKey}T00:00:00`)
    : null;
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
  return (
    String(value || "")
      .trim()
      .toUpperCase() === "NG"
  );
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

const NGDefectAnalyticsChart: React.FC<
  PatrolSharedProps & {
    compact?: boolean;
    type?: PatrolKind;
  }
> = ({ type, activeTab, compact, goToView, setPreviewImage, user }) => {
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
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("both");
  const [viewTab, setViewTab] = useState<ViewTab>("trend");
  const [keyword, setKeyword] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SheetNGRecord | null>(
    null,
  );
  const [highlightSessionId, setHighlightSessionId] = useState<number | null>(
    null,
  );
  const [drillPoint, setDrillPoint] = useState<{
    dateKey: string;
    shift: ShiftType;
  } | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<{
    dateKey: string;
    shift: ShiftType;
  } | null>(null);
  const [trendDetailPage, setTrendDetailPage] = useState(0);
  const [fromDateTime, setFromDateTime] = useState("");
  const [toDateTime, setToDateTime] = useState("");
  const dispatch = useAppDispatch();
  const { t } = useTranslation("patrol");

  const pT = useCallback(
    (key: string, options?: any) => {
      if (user?.role === "PQC") return t(key, { ...options, lng: "vi" }) as string;
      return t(key, options) as string;
    },
    [t, user?.role],
  );

  const rangeOptions = useMemo(
    () => [
      { key: "7d" as RangeMode, label: pT("reportRange7d") },
      { key: "30d" as RangeMode, label: pT("reportRange30d") },
      { key: "all" as RangeMode, label: pT("all") },
    ],
    [pT],
  );

  const statusOptions = useMemo(
    () => [
      { key: "all" as StatusMode, label: pT("all") },
      { key: "Submitted" as StatusMode, label: pT("statusSubmitted") },
      { key: "Approved" as StatusMode, label: pT("statusApproved") },
    ],
    [pT],
  );

  const chartTabs = useMemo(
    () => [
      { key: "trend" as ViewTab, label: pT("reportTabTrend"), icon: <FaBug size={12} /> },
      { key: "breakdown" as ViewTab, label: pT("reportTabBreakdown"), icon: <FaLayerGroup size={12} /> },
      {
        key: "table" as ViewTab,
        label: pT("reportTabTable"),
        icon: <MdOutlineTableChart size={14} />,
      },
    ],
    [pT],
  );

  const trendTableColumns = useMemo(
    () => [
      pT("reportColProductionDate"),
      pT("reportColShift"),
      pT("reportColSheetId"),
      pT("reportColLine"),
      pT("reportColStage"),
      pT("reportColCategory"),
      pT("reportColErrorCount"),
      pT("reportColView"),
    ],
    [pT],
  );

  const detailTableColumns = useMemo(
    () => [
      pT("reportColProductionDate"),
      pT("reportColShift"),
      pT("reportColSheetId"),
      pT("reportColLine"),
      pT("reportColStage"),
      pT("reportColCategory"),
      pT("reportColErrorCount"),
      pT("reportColImage"),
      pT("reportColView"),
    ],
    [pT],
  );

  const modalErrorColumns = useMemo(
    () => [
      "#",
      pT("reportColCheckTime"),
      pT("reportColShift"),
      pT("reportColStage"),
      pT("reportColCategory"),
      pT("reportColErrorContent"),
      pT("colNote"),
    ],
    [pT],
  );

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

        // Report phải gom sheet theo thời gian tạo sheet/session giống Dashboard.
        // Không dùng checkAt của từng lỗi để tính ngày/ca vì checkAt có thể lệch thời điểm nhập kết quả.
        const sheetTime = session?.createdAt || session?.createAt || "";
        const sheetShiftInfo = getShiftDay(sheetTime);

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

            const checkAt = result?.checkAt || sheetTime;
            const errorShiftInfo = getShiftDay(checkAt);

            return {
              id: `${sessionId}-${result?.id || result?.checkListId || index}`,
              resultId: Number(result?.id || 0),
              checkListId: Number(result?.checkListId || 0),
              stageName: stage?.name || EMPTY,
              categoryName: category?.name || EMPTY,
              errorName:
                checkList?.questionCheck ||
                String(result?.checkListId || EMPTY),
              actualValue: result?.actualValue || EMPTY,
              note: result?.note || EMPTY,
              checkAt,
              checkAtText: fmtDateTime(checkAt),
              shift: errorShiftInfo.shift,
              shiftText: getShiftText(errorShiftInfo.shift, pT),
            };
          });

        if (!errors.length || !sheetShiftInfo.key) return null;

        const dateKey = sheetShiftInfo.key;
        const sheetShift = sheetShiftInfo.shift;
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
          sheetTime,
          sheetTimeText: fmtTime(sheetTime),
          patrolType: session?.patrolType || "",
          sessionId,
          lineName: line?.lineAreaName || EMPTY,
          status: session?.status || EMPTY,
          detectedBy: session?.fullName || EMPTY,
          note: sheetNote || EMPTY,
          shift: sheetShift,
          shiftText: getShiftText(sheetShift, pT),
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
    pT,
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
    const customFrom = getDateTimeFilter(fromDateTime);
    const customTo = getDateTimeFilter(toDateTime);

    return allSheetRecords.filter((record) => {
      if (customFrom || customTo) {
        const sheetDateTime = parseDate(record.sheetTime);
        if (!sheetDateTime) return false;
        if (customFrom && sheetDateTime < customFrom) return false;
        if (customTo && sheetDateTime > customTo) return false;
      } else {
        const businessDate = parseDate(
          `${record.date}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00`,
        );
        const inRange = businessDate
          ? businessDate >= start && businessDate <= end
          : false;
        if (!inRange) return false;
      }

      if (shiftFilter !== "both" && record.shift !== shiftFilter) {
        return false;
      }

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
  }, [
    allSheetRecords,
    start,
    end,
    keyword,
    shiftFilter,
    fromDateTime,
    toDateTime,
  ]);

  const effectiveTrendRange = useMemo(() => {
    const customFrom = getDateTimeFilter(fromDateTime);
    const customTo = getDateTimeFilter(toDateTime);

    if (!customFrom && !customTo) {
      return { startKey, endKey };
    }

    const fallbackStart = customFrom || customTo || new Date();
    const fallbackEnd = customTo || customFrom || new Date();

    const fromBusiness = getBusinessDate(fallbackStart) || fallbackStart;
    const toBusiness = getBusinessDate(fallbackEnd) || fallbackEnd;

    return {
      startKey: formatLocalDateKey(fromBusiness),
      endKey: formatLocalDateKey(toBusiness),
    };
  }, [fromDateTime, toDateTime, startKey, endKey]);

  const trendBuckets = useMemo<PeriodBucket[]>(() => {
    const fromKey = effectiveTrendRange.startKey;
    const toKey = effectiveTrendRange.endKey;

    const days =
      Math.round(
        ((parseDate(`${toKey}T00:00:00`)?.getTime() || 0) -
          (parseDate(`${fromKey}T00:00:00`)?.getTime() || 0)) /
          86400000,
      ) + 1;

    return Array.from({ length: Math.max(days, 0) }, (_, index) => {
      const d = addDays(parseDate(`${fromKey}T00:00:00`) || new Date(), index);
      const key = formatLocalDateKey(d);
      const rows = rangeRecords.filter((record) => record.date === key);
      const morningRows = rows.filter((record) => record.shift === "morning");
      const nightRows = rows.filter((record) => record.shift === "night");

      return {
        label: fmtShort(d),
        dateKey: key,
        total: rows.length,
        morning: morningRows.length,
        night: nightRows.length,
        records: rows,
      };
    });
  }, [effectiveTrendRange, rangeRecords]);

  const activeRecords = useMemo(() => {
    if (!drillPoint) return rangeRecords;

    return rangeRecords.filter(
      (record) =>
        record.date === drillPoint.dateKey && record.shift === drillPoint.shift,
    );
  }, [drillPoint, rangeRecords]);

  const activeErrors = useMemo(
    () => activeRecords.flatMap((record) => record.errors),
    [activeRecords],
  );

  const lineData = useMemo(() => {
    return Object.entries(groupBy(activeRecords, (x) => x.lineName))
      .map(([name, rows]) => ({
        name,
        value: rows.length,
        records: rows,
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeRecords]);

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

  const trendSelectedRows = useMemo(() => {
    if (!drillPoint) return [];
    const startIndex = trendDetailPage * TREND_DETAIL_PAGE_SIZE;
    return activeRecords.slice(startIndex, startIndex + TREND_DETAIL_PAGE_SIZE);
  }, [activeRecords, drillPoint, trendDetailPage]);

  const trendDetailPageCount = useMemo(() => {
    if (!drillPoint) return 0;
    return Math.ceil(activeRecords.length / TREND_DETAIL_PAGE_SIZE);
  }, [activeRecords.length, drillPoint]);

  const trendSelectedLabel = useMemo(() => {
    if (!drillPoint) return "";
    return `${fmtDateKey(drillPoint.dateKey)} - ${getShiftText(drillPoint.shift, pT)}`;
  }, [drillPoint, pT]);

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
    (row: SheetNGRecord, returnMode: ReportReturnMode = "table") => {
      const state = {
        source: "report",
        returnPath: `${window.location.pathname}${window.location.search}`,
        highlightId: row.sessionId,
        type: patrolType,
        reportTab: returnMode === "trend-dot" ? "trend" : "table",
        returnMode,
        drillPoint,
        trendDetailPage,
        rangeMode,
        offset,
        statusMode,
        shiftFilter,
        keyword,
        fromDateTime,
        toDateTime,
        savedAt: Date.now(),
      };

      localStorage.setItem("patrolReportReturnState", JSON.stringify(state));
      goToView?.("detail", String(row.sessionId), patrolType);
    },
    [
      goToView,
      patrolType,
      drillPoint,
      trendDetailPage,
      rangeMode,
      offset,
      statusMode,
      shiftFilter,
      keyword,
      fromDateTime,
      toDateTime,
    ],
  );

  const handleShiftDotClick = useCallback(
    (payload: any, shift: ShiftType) => {
      if (!payload?.dateKey) return;

      // Không đổi shiftFilter ở đây. Nếu đang chọn "Cả 2 ca", cả 2 line phải luôn hiển thị.
      // Dot chỉ dùng để drill xuống danh sách sheet NG của đúng ngày + đúng ca.
      setDrillPoint((prev) => {
        const isSame =
          prev?.dateKey === payload.dateKey && prev?.shift === shift;

        return isSame ? null : { dateKey: payload.dateKey, shift };
      });
      setTrendDetailPage(0);
    },
    [],
  );

  useEffect(() => {
    setTrendDetailPage(0);
  }, [drillPoint, keyword, statusMode, rangeMode, offset, shiftFilter, fromDateTime, toDateTime]);

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
      if (saved.type && saved.type !== patrolType) return;

      setViewTab(saved.reportTab || "table");
      setHighlightSessionId(Number(saved.highlightId));

      if (saved.rangeMode) setRangeMode(saved.rangeMode);
      if (typeof saved.offset === "number") setOffset(saved.offset);
      if (saved.statusMode) setStatusMode(saved.statusMode);
      if (saved.shiftFilter) setShiftFilter(saved.shiftFilter);
      if (typeof saved.keyword === "string") setKeyword(saved.keyword);
      if (typeof saved.fromDateTime === "string") setFromDateTime(saved.fromDateTime);
      if (typeof saved.toDateTime === "string") setToDateTime(saved.toDateTime);

      if (saved.returnMode === "trend-dot" && saved.drillPoint) {
        setDrillPoint(saved.drillPoint);
        setTrendDetailPage(Number(saved.trendDetailPage || 0));
      }

      const timer = window.setTimeout(() => {
        const rowId =
          saved.returnMode === "trend-dot"
            ? `patrol-report-trend-row-${Number(saved.highlightId)}`
            : `patrol-report-row-${Number(saved.highlightId)}`;

        const el = document.getElementById(rowId);

        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);

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
  }, [patrolType]);

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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-rectangle]:outline-none [&_.recharts-dot]:outline-none [&_*:focus]:outline-none">
      <div className="bg-linear-to-r from-slate-950 to-slate-800 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg">
              <FaBug size={16} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {pT("reportNGDashboardTitle", {
                  type: patrolType === "daily" ? pT("dailyPatrol") : pT("weeklyPatrol"),
                })}
              </h3>
              <p className="text-xs text-slate-400">
                {rangeLabel} • {pT("businessDayTimeNote")}
                {drillPoint ? (
                  <span className="ml-2 text-amber-300">
                    • {pT("reportFiltering")}: {fmtDateKey(drillPoint.dateKey)} -{" "}
                    {getShiftText(drillPoint.shift, pT)}
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
              {rangeOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRangeMode(item.key);
                    setOffset(0);
                    setDrillPoint(null);
                    setFromDateTime("");
                    setToDateTime("");
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    rangeMode === item.key
                      ? "bg-red-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg bg-slate-900 p-1">
              {(["both", "morning", "night"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setShiftFilter(item);
                    setDrillPoint(null);
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    shiftFilter === item
                      ? item === "morning"
                        ? "bg-red-600 text-white"
                        : item === "night"
                          ? "bg-purple-600 text-white"
                          : "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item === "both"
                    ? pT("shiftBoth")
                    : item === "morning"
                      ? pT("shiftMorning")
                      : pT("shiftNight")}
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
            <p className="text-xs text-slate-400">{pT("reportTotalSheetNG")}</p>
            <p className="mt-1 text-2xl font-extrabold text-red-400">
              {totalSheetNG}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {pT("reportTotalErrorNG")}: {totalErrorNG}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportTopLine")}</p>
            <p className="mt-1 truncate text-sm font-bold text-amber-300">
              {topLine}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportImageLinked")}</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-300">
              {imageLinkedCount}/{totalSheetNG}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white px-4 py-4 md:px-5">
        <div className="space-y-4!">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {chartTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setViewTab(tab.key)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                    viewTab === tab.key
                      ? "border-red-200 bg-red-50 text-red-600 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {drillPoint ? (
              <button
                type="button"
                onClick={() => {
                  setDrillPoint(null);
                  setTrendDetailPage(0);
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 hover:bg-amber-100"
              >
                {pT("reportClearSelectedPoint")}
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  {pT("searchBtn")}
                </label>
                <input
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setTrendDetailPage(0);
                  }}
                  placeholder={pT("reportKeywordPlaceholder")}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="xl:col-span-3">
                <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  {pT("reportFilterFromDateTime")}
                </label>
                <input
                  type="datetime-local"
                  value={fromDateTime}
                  onChange={(e) => {
                    setFromDateTime(e.target.value);
                    setOffset(0);
                    setDrillPoint(null);
                    setTrendDetailPage(0);
                  }}
                  className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="xl:col-span-3">
                <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  {pT("reportFilterToDateTime")}
                </label>
                <input
                  type="datetime-local"
                  value={toDateTime}
                  onChange={(e) => {
                    setToDateTime(e.target.value);
                    setOffset(0);
                    setDrillPoint(null);
                    setTrendDetailPage(0);
                  }}
                  className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="xl:col-span-2">
                <label className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  {pT("reportFilterStatus")}
                </label>
                <select
                  value={statusMode}
                  onChange={(e) => setStatusMode(e.target.value as StatusMode)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  {statusOptions.map((x) => (
                    <option key={x.key} value={x.key}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5">
        {loading ? (
          <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
            {pT("loading")}
          </div>
        ) : null}

        {!loading && viewTab === "trend" ? (
          <div className="space-y-4!">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {pT("reportTrendTitle")}
                  </h4>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={trendBuckets}
                    accessibilityLayer={false}
                    style={{ outline: "none" }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      cursor={false}
                      content={<CustomTooltip />}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />

                    {(shiftFilter === "morning" || shiftFilter === "both") && (
                      <Line
                        type="monotone"
                        dataKey="morning"
                        name={pT("shiftMorning")}
                        stroke="#E24B4A"
                        strokeWidth={3}
                        activeDot={false}
                        dot={(props: any) => {
                          const { cx, cy, payload, value } = props;

                          if (value == null) return null;

                          const isSelected =
                            drillPoint?.dateKey === payload.dateKey &&
                            drillPoint?.shift === "morning";

                          const isHovered =
                            hoveredTrendPoint?.dateKey === payload.dateKey &&
                            hoveredTrendPoint?.shift === "morning";

                          return (
                            <circle
                              focusable="false"
                              tabIndex={-1}
                              cx={cx}
                              cy={cy}
                              r={isSelected || isHovered ? 7 : 4}
                              fill="#E24B4A"
                              stroke="#fff"
                              strokeWidth={isSelected || isHovered ? 3 : 2}
                              style={{ cursor: "pointer" }}
                              onMouseEnter={() =>
                                setHoveredTrendPoint({
                                  dateKey: payload.dateKey,
                                  shift: "morning",
                                })
                              }
                              onMouseLeave={() => setHoveredTrendPoint(null)}
                              onClick={(e: any) => {
                                e.stopPropagation();
                                handleShiftDotClick(payload, "morning");
                              }}
                            />
                          );
                        }}
                      />
                    )}

                    {(shiftFilter === "night" || shiftFilter === "both") && (
                      <Line
                        type="monotone"
                        dataKey="night"
                        name={pT("shiftNight")}
                        stroke="#534AB7"
                        strokeWidth={3}
                        activeDot={false}
                        dot={(props: any) => {
                          const { cx, cy, payload, value } = props;

                          if (value == null) return null;

                          const isSelected =
                            drillPoint?.dateKey === payload.dateKey &&
                            drillPoint?.shift === "night";

                          const isHovered =
                            hoveredTrendPoint?.dateKey === payload.dateKey &&
                            hoveredTrendPoint?.shift === "night";

                          return (
                            <circle
                              focusable="false"
                              tabIndex={-1}
                              cx={cx}
                              cy={cy}
                              r={isSelected || isHovered ? 7 : 4}
                              fill="#534AB7"
                              stroke="#fff"
                              strokeWidth={isSelected || isHovered ? 3 : 2}
                              style={{ cursor: "pointer" }}
                              onMouseEnter={() =>
                                setHoveredTrendPoint({
                                  dateKey: payload.dateKey,
                                  shift: "night",
                                })
                              }
                              onMouseLeave={() => setHoveredTrendPoint(null)}
                              onClick={(e: any) => {
                                e.stopPropagation();
                                handleShiftDotClick(payload, "night");
                              }}
                            />
                          );
                        }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {drillPoint ? (
              <div className="rounded-xl border border-slate-100 p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {pT("reportSelectedSheets", { label: trendSelectedLabel })}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {pT("reportShowingTrendSheets", { pageSize: TREND_DETAIL_PAGE_SIZE, count: activeRecords.length })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrillPoint(null)}
                    className="self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    {pT("reportClearSelectedPoint")}
                  </button>
                </div>

                <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {trendTableColumns.map((title) => (
                          <th
                            key={title}
                            className="border-b border-slate-200 px-3 py-3 text-left font-bold text-slate-500"
                          >
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trendSelectedRows.map((row) => (
                        <tr
                          key={`trend-${row.id}`}
                          id={`patrol-report-trend-row-${row.sessionId}`}
                          onClick={() => goToSheetDetailFromReport(row, "trend-dot")}
                          className={`cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 ${
                            highlightSessionId === row.sessionId
                              ? "bg-red-50 [&>td]:border-y-2 [&>td]:border-red-300 [&>td:first-child]:border-l-2 [&>td:last-child]:border-r-2"
                              : "hover:bg-red-50/40"
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600">
                            <div className="font-semibold">{row.dateText}</div>
                            <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                              {pT("reportCreatedAt")} {row.sheetTimeText}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-bold ${row.shift === "morning" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}
                            >
                              {row.shiftText}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-900">
                            #{row.sessionId}
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-900">
                            {row.lineName}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <span className="block max-w-[160px] truncate" title={row.stageSummary}>
                              {row.stageSummary}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <span className="block max-w-[180px] truncate" title={row.categorySummary}>
                              {row.categorySummary}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedRecord(row);
                              }}
                              className="rounded-lg bg-red-50 px-2 py-1 text-left font-bold text-red-600 hover:underline"
                            >
                              {pT("reportErrorUnit", { count: row.errors.length })}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-left">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedRecord(row);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              title={pT("reportOpenDetail")}
                            >
                              <FaEye size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {trendSelectedRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-10 text-center text-sm text-slate-400">
                            {pT("reportNoData")}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 lg:hidden">
                  {trendSelectedRows.map((row) => (
                    <div
                      key={`trend-mobile-${row.id}`}
                      id={`patrol-report-trend-row-${row.sessionId}`}
                      onClick={() => goToSheetDetailFromReport(row, "trend-dot")}
                      className={`rounded-xl border border-slate-200 p-3 shadow-sm ${
                        highlightSessionId === row.sessionId ? "bg-red-50 ring-2 ring-red-300 ring-inset" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            {row.dateText} • {row.sheetTimeText} • {row.shiftText}
                          </p>
                          <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                            Sheet #{row.sessionId} • {row.lineName}
                          </h4>
                          <p className="mt-1 text-sm font-bold text-red-600">
                            {pT("reportErrorUnit", { count: row.errors.length })}
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
                          {pT("viewBtn")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {trendDetailPageCount > 1 ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ReactPaginate
                      {...PAGINATE_PROPS}
                      pageCount={trendDetailPageCount}
                      forcePage={trendDetailPage}
                      onPageChange={({ selected }) => setTrendDetailPage(selected)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {lineData.length > 0 ? (
              <div className="rounded-xl border border-slate-100 p-3">
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  {pT("reportByLine")}
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={lineTrendData}
                      accessibilityLayer={false}
                      style={{ outline: "none" }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        cursor={false}
                        content={<CustomTooltip />}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                      />
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
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4!">
            <div className="rounded-xl border border-slate-100 p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-800">
                {pT("reportLineNGTitle")}
              </h4>
              <div className="h-72 min-w-0 [&_*:focus]:outline-none">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={lineData}
                    margin={{ top: 15, right: 24, left: 0, bottom: 30 }}
                    accessibilityLayer={false}
                    style={{ outline: "none" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />

                    <YAxis allowDecimals={false} stroke="#64748b" />

                    <RechartsTooltip
                      content={<CustomTooltip />}
                      cursor={false}
                    />

                    <Bar
                      dataKey="value"
                      name={pT("reportSheetNGCount")}
                      radius={[8, 8, 0, 0]}
                      barSize={42}
                    >
                      {lineData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>

                    <Line
                      type="monotone"
                      dataKey="value"
                      name={pT("reportTrend")}
                      stroke="#94a3b8"
                      strokeWidth={3}
                      activeDot={false}
                      dot={(props: any) => {
                        const { cx, cy, value } = props;
                        if (value == null) return null;

                        return (
                          <circle
                            focusable="false"
                            tabIndex={-1}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="#ffffff"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            style={{ outline: "none" }}
                          />
                        );
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-800">
                {pT("reportStageNGTitle")}
              </h4>
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer={false} style={{ outline: "none" }}>
                    <Pie
                      data={stageData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {stageData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      cursor={false}
                      content={<CustomTooltip />}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4 xl:col-span-2">
              <h4 className="mb-3 text-sm font-bold text-slate-800">
                {pT("reportTopErrorTitle")}
              </h4>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={errorData}
                    layout="vertical"
                    margin={{ left: 20, right: 24 }}
                    accessibilityLayer={false}
                    style={{ outline: "none" }}
                  >
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={220}
                      tickFormatter={(value) => truncateText(value, 34)}
                      tick={{ fill: "#334155", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <RechartsTooltip
                      cursor={false}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      name={pT("reportNGTimes")}
                      fill="#ea580c"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={22}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4 xl:col-span-2">
              <h4 className="mb-3 text-sm font-bold text-slate-800">
                {pT("reportCreatorDetectTitle")}
              </h4>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={inspectorData}
                    accessibilityLayer={false}
                    style={{ outline: "none" }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => truncateText(value, 18)}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      cursor={false}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      name={pT("reportSheetNG")}
                      fill="#0f172a"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Trend"
                      stroke="#dc2626"
                      strokeWidth={2}
                      activeDot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && viewTab === "table" ? (
          <div className="space-y-4!">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {pT("reportShowingDetailSheets", { shown: detailRows.length, total: activeRecords.length })} 
                <span className="ml-1! text-red-500">
                  {pT("reportOneSheetOneRowNote")}
                </span>
              </p>
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {detailTableColumns.map((title) => (
                      <th
                        key={title}
                        className="border-b border-slate-200 px-3 py-3 text-left font-bold text-slate-500"
                      >
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
                      onClick={() => goToSheetDetailFromReport(row, "table")}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-red-50/40 ${
                        highlightSessionId === row.sessionId
                          ? "bg-yellow-50 [&>td]:border-y-2 [&>td]:border-yellow-300 [&>td:first-child]:border-l-2 [&>td:last-child]:border-r-2"
                          : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600">
                        <div className="font-semibold">{row.dateText}</div>
                        <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                          {pT("reportCreatedAt")} {row.sheetTimeText}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-bold ${row.shift === "morning" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}
                        >
                          {row.shiftText}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-900">
                        #{row.sessionId}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        <span
                          className="block max-w-24 truncate"
                          title={row.lineName}
                        >
                          {row.lineName}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span
                          className="block max-w-4 truncate"
                          title={row.stageSummary}
                        >
                          {row.stageSummary}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span
                          className="block max-w-[180px] truncate"
                          title={row.categorySummary}
                        >
                          {row.categorySummary}
                        </span>
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
                          {pT("reportErrorUnit", { count: row.errors.length })}
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
                                  openImage(
                                    img,
                                    `${row.lineName} - Sheet #${row.sessionId}`,
                                  );
                                }}
                                className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                title={img.note || img.filename}
                              >
                                <img
                                  src={img.url}
                                  alt={
                                    img.note || img.filename || "patrol error"
                                  }
                                  className="h-full w-full object-cover"
                                />
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
                            <FaImage size={10} /> {pT("reportNoImage")}
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
                          title={pT("reportOpenDetail")}
                        >
                          <FaEye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {detailRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-12 text-center text-sm text-slate-400"
                      >
                        {pT("reportNoNGSheetInFilter")}
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
                  onClick={() => goToSheetDetailFromReport(row, "table")}
                  className={`rounded-xl border border-slate-200 p-3 shadow-sm ${
                    highlightSessionId === row.sessionId
                      ? "bg-yellow-50 shadow-[inset_0_0_0_2px_#facc15]"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        {row.dateText} • {row.sheetTimeText} • {row.shiftText}
                      </p>
                      <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                        Sheet #{row.sessionId} • {row.lineName}
                      </h4>
                      <p className="mt-1 text-sm font-bold text-red-600">
                        {pT("reportErrorUnit", { count: row.errors.length })}
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
                      {pT("viewBtn")}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-slate-400">{pT("reportColStage")}</p>
                      <p className="font-bold text-slate-700">
                        {row.stageSummary}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-slate-400">{pT("reportColCategory")}</p>
                      <p className="font-bold text-slate-700">
                        {row.categorySummary}
                      </p>
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
                            openImage(
                              img,
                              `${row.lineName} - Sheet #${row.sessionId}`,
                            );
                          }}
                          className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt={img.note || img.filename || "patrol error"}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {detailRows.length === 0 ? (
                <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-400">
                  {pT("reportNoNGSheetInFilter")}
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
                  {pT("reportSheetNGDetail")}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Patrol Sheet ID #{selectedRecord.sessionId}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRecord.dateText} • {selectedRecord.sheetTimeText} •{" "}
                  {selectedRecord.shiftText} • {selectedRecord.lineName} •{" "}
                  {selectedRecord.detectedBy}
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
                  <p className="text-xs text-slate-400">{pT("reportColProductionDate")}</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedRecord.dateText}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {pT("reportCreatedAt")} {selectedRecord.sheetTimeText}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{pT("reportColShift")}</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedRecord.shiftText}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{pT("reportColLine")}</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedRecord.lineName}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{pT("reportSheetStatus")}</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {getStatusText(selectedRecord.status, pT)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {pT("reportErrorListInSheet")}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecord(null);
                      goToSheetDetailFromReport(
                        selectedRecord,
                        viewTab === "trend" && drillPoint ? "trend-dot" : "table",
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-600"
                  >
                    {pT("reportOpenSheet")} <FaExternalLinkAlt size={10} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {modalErrorColumns.map((title) => (
                          <th
                            key={title}
                            className="border-b border-slate-200 px-3 py-3 text-left font-bold text-slate-500"
                          >
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.errors.map((error, index) => (
                        <tr
                          key={error.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-3 py-3 font-mono text-slate-500">
                            {index + 1}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                            {error.checkAtText}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                            {error.shiftText}
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-800">
                            {error.stageName}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {error.categoryName}
                          </td>
                          <td className="min-w-[260px] px-3 py-3 font-bold text-red-600">
                            {error.errorName}
                          </td>
                          <td className="min-w-[180px] px-3 py-3 text-slate-600">
                            {error.note || EMPTY}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-red-50 p-3">
                <p className="text-xs font-bold text-red-400">
                  {pT("reportSheetErrorNote")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-red-700">
                  {selectedRecord.note || EMPTY}
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {pT("imageSection")}
                  </h4>
                </div>

                {selectedRecord.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6! pb-6!">
                    {selectedRecord.images.map((img, index) => (
                      <button
                        key={`${selectedRecord.id}-modal-${img.id}-${index}`}
                        type="button"
                        onClick={() =>
                          openImage(
                            img,
                            `${selectedRecord.lineName} - Sheet #${selectedRecord.sessionId}`,
                          )
                        }
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left"
                      >
                        <img
                          src={img.url}
                          alt={img.note || img.filename || "patrol error"}
                          className="h-32 w-full object-cover"
                        />
                        <div className="p-2">
                          <p className="truncate text-[11px] font-semibold text-slate-600">
                            {img.note || img.filename || pT("reportSheetImage")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400 p-3">
                    {pT("reportNoImageForSheet")}
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
