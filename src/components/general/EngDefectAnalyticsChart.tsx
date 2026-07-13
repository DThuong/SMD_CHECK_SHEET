/* eslint-disable react-hooks/exhaustive-deps */
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
  FaUndo,
  FaLayerGroup,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineTableChart } from "react-icons/md";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import {
  fetchEngSessionsBySheetType,
  fetchEngMachines,
  fetchEngCategoriesBySheetType,
  fetchEngCheckLists,
  fetchEngLines,
  fetchEngCheckListResults,
  fetchEngImagesBySession,
} from "../../redux/slices/engSlice";
import type { EngSharedProps } from "../../pages/managers_role/EngCheckSheet";
import ReactPaginate from "react-paginate";
import { useTranslation } from "react-i18next";

type EngTab = "daily" | "weekly";
type RangeMode = "1d" | "7d" | "30d" | "all";
type ViewTab = "trend" | "breakdown" | "table";
type ReportReturnMode = "trend-dot" | "table";
type StatusMode = "all" | "Submitted" | "Approved";
type ShiftType = "morning" | "night";
type ShiftFilter = "both" | "morning" | "night";

const IMAGE_TYPES = ["Before", "After", "Evidence"] as const;
type ImageTypeKey = (typeof IMAGE_TYPES)[number];

function normalizeImageType(value?: string): ImageTypeKey {
  const v = String(value || "").toLowerCase();
  if (v === "before") return "Before";
  if (v === "after") return "After";
  return "Evidence";
}

interface NGErrorItem {
  id: string;
  resultId: number;
  sessionId: number;
  checkListId: number;
  machineName: string;
  categoryName: string;
  questionCheck: string;
  actualValue: string;
  note: string;
  checkAt: string;
  checkAtText: string;
  shift: ShiftType;
  images: EngImageView[];
  imageCount: number;
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
  errors: NGErrorItem[];
  images: EngImageView[];
  imageCount: number;
  firstQuestionCheck: string;
  machineSummary: string;
  categorySummary: string;
  hasImages: boolean;
}

interface EngImageView {
  id: number;
  url: string;
  filename: string;
  note: string;
  typeImage: ImageTypeKey;
}

interface PeriodBucket {
  label: string;
  dateKey: string;
  total: number;
  ok: number;
  ng: number;
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
const DETAIL_TABLE_PAGE_SIZE = 20;

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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

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

function normalizeDateTimeLocalByDefaultTime(
  value: string,
  defaultTime: "08:00" | "07:59",
  previousValue: string,
) {
  if (!value) return "";

  const [nextDate, nextTimeRaw] = value.split("T");
  const [, previousTimeRaw] = previousValue.split("T");

  const nextTime = nextTimeRaw?.slice(0, 5);
  const previousTime = previousTimeRaw?.slice(0, 5);

  if (!nextDate) return "";

  // Khi browser chỉ đổi ngày, thường nó giữ lại giờ cũ nếu đã có.
  // Nếu chưa có giờ cũ thì set giờ mặc định theo ca.
  if (!nextTime) {
    return `${nextDate}T${defaultTime}`;
  }

  // Nếu trước đó chưa có value, lần đầu chọn sẽ dùng giờ mặc định.
  // Trường hợp user thật sự muốn đổi giờ, lần đổi tiếp theo sẽ được giữ.
  if (!previousValue) {
    return `${nextDate}T${defaultTime}`;
  }

  // Nếu giờ đang là giờ mặc định cũ, đổi ngày thì tiếp tục giữ default.
  // Nếu user đã chỉnh giờ khác, giữ giờ user chọn.
  if (!previousTime || previousTime === defaultTime) {
    return `${nextDate}T${defaultTime}`;
  }

  return `${nextDate}T${nextTime}`;
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

  if (mode === "1d") {
    const businessDate = addDays(currentBusinessDate, -offset);
    return {
      start: startOfBusinessDate(businessDate),
      end: endOfBusinessDate(businessDate),
      startKey: formatLocalDateKey(businessDate),
      endKey: formatLocalDateKey(businessDate),
      label: fmtDateKey(formatLocalDateKey(businessDate)),
    };
  }

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

function normalizeEngTab(value?: string): EngTab | null {
  const v = String(value || "").toLowerCase();
  if (v === "1" || v === "daily") return "daily";
  if (v === "7" || v === "weekly") return "weekly";
  return null;
}

function buildImageView(img: any): EngImageView {
  return {
    id: Number(img?.id || 0),
    url: img?.imageUrl || img?.url || "",
    filename: img?.fileName || img?.filename || "",
    note: img?.note || "",
    typeImage: normalizeImageType(img?.imageType || img?.typeImage || img?.type),
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


type PreviewCarouselItem = {
  id: string | number;
  url: string;
  title: string;
  note?: string;
};

type PreviewCarouselState = {
  open: boolean;
  items: PreviewCarouselItem[];
  index: number;
  title: string;
};

const EMPTY_PREVIEW_CAROUSEL: PreviewCarouselState = {
  open: false,
  items: [],
  index: 0,
  title: "",
};

const ImagePreviewCarousel = React.memo(
  ({
    preview,
    onClose,
    accentClass = "blue",
  }: {
    preview: PreviewCarouselState;
    onClose: () => void;
    accentClass?: "blue" | "red";
  }) => {
    const [currentIndex, setCurrentIndex] = useState(preview.index || 0);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipX, setFlipX] = useState(false);
    const [flipY, setFlipY] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef({
      active: false,
      pointerId: 0,
      startX: 0,
      startY: 0,
      baseX: 0,
      baseY: 0,
    });

    const total = preview.items.length;
    const currentItem = preview.items[currentIndex];
    const activeRing =
      accentClass === "red"
        ? "border-red-400 ring-2 ring-red-400"
        : "border-blue-400 ring-2 ring-blue-400";

    const resetTransform = useCallback(() => {
      setScale(1);
      setRotation(0);
      setFlipX(false);
      setFlipY(false);
      setPosition({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
      if (!preview.open) return;
      setCurrentIndex(preview.index || 0);
      resetTransform();
    }, [preview.index, preview.open, resetTransform]);

    useEffect(() => {
      if (!preview.open) return;
      resetTransform();
    }, [currentIndex, preview.open, resetTransform]);

    useEffect(() => {
      if (!preview.open) return;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }, [preview.open]);

    const goPrev = useCallback(() => {
      if (total <= 1) return;
      setCurrentIndex((prev) => (prev - 1 + total) % total);
    }, [total]);

    const goNext = useCallback(() => {
      if (total <= 1) return;
      setCurrentIndex((prev) => (prev + 1) % total);
    }, [total]);

    const zoomIn = useCallback(() => {
      setScale((prev) => Math.min(6, Number((prev + 0.25).toFixed(2))));
    }, []);

    const zoomOut = useCallback(() => {
      setScale((prev) => {
        const next = Math.max(0.25, Number((prev - 0.25).toFixed(2)));
        if (next <= 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }, []);

    const rotateLeft = useCallback(() => {
      setRotation((prev) => prev - 90);
    }, []);

    const rotateRight = useCallback(() => {
      setRotation((prev) => prev + 90);
    }, []);

    useEffect(() => {
      if (!preview.open) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose();
        if (event.key === "ArrowLeft") goPrev();
        if (event.key === "ArrowRight") goNext();
        if (event.key === "+" || event.key === "=") zoomIn();
        if (event.key === "-" || event.key === "_") zoomOut();
        if (event.key.toLowerCase() === "r") rotateRight();
        if (event.key === "0") resetTransform();
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev, onClose, preview.open, resetTransform, rotateRight, zoomIn, zoomOut]);

    if (!preview.open || !currentItem) return null;

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;

      // Không cho vùng drag nuốt click của button, thumbnail, icon.
      if (target.closest("button")) {
        return;
      }

      event.preventDefault();

      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        baseX: position.x,
        baseY: position.y,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;
      const nextX = drag.baseX + event.clientX - drag.startX;
      const nextY = drag.baseY + event.clientY - drag.startY;
      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag.pointerId === event.pointerId) {
        dragRef.current = {
          active: false,
          pointerId: 0,
          startX: 0,
          startY: 0,
          baseX: 0,
          baseY: 0,
        };
      }
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.deltaY < 0) zoomIn();
      else zoomOut();
    };

    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-2 sm:p-4"
        onClick={onClose}
      >
        <div
          className="relative flex h-full max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-950 px-3 py-3 text-white md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold md:text-base">
                {currentItem.title || preview.title}
              </p>
              <p className="text-xs text-white/60">
                {currentIndex + 1}/{total} • Zoom {Math.round(scale * 100)}% • Rotate {((rotation % 360) + 360) % 360}°
              </p>
            </div>

            <div className="flex flex-nowrap items-center gap-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={zoomOut}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={rotateLeft}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Rotate left"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={rotateRight}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Rotate right"
              >
                ↻
              </button>
              <button
                type="button"
                onClick={() => setFlipX((prev) => !prev)}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Flip horizontal"
              >
                Flip X
              </button>
              <button
                type="button"
                onClick={() => setFlipY((prev) => !prev)}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Flip vertical"
              >
                Flip Y
              </button>
              <button
                type="button"
                onClick={resetTransform}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                title="Reset"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden bg-black"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onWheel={handleWheel}
            onDoubleClick={resetTransform}
          >
            {total > 1 ? (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              >
                <FaChevronLeft />
              </button>
            ) : null}

            <img
              key={currentItem.url}
              src={currentItem.url}
              alt={currentItem.title || preview.title || "preview"}
              draggable={false}
              className="max-h-[86%] max-w-[92%] object-contain will-change-transform"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
                transition: dragRef.current.active ? "none" : "transform 120ms ease-out",
                cursor: dragRef.current.active ? "grabbing" : "grab",
              }}
            />

            {total > 1 ? (
              <button
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              >
                <FaChevronRight />
              </button>
            ) : null}

            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/80">
              Kéo để di chuyển • Lăn chuột để zoom • Double click để reset
            </div>
          </div>

          {currentItem.note ? (
            <div className="border-t border-white/10 bg-slate-900 px-4 py-2 text-xs italic text-white/70">
              {currentItem.note}
            </div>
          ) : null}

          {total > 1 ? (
            <div className="border-t border-white/10 bg-slate-900/95 px-3 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {preview.items.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      index === currentIndex
                        ? activeRing
                        : "border-white/15 opacity-70 hover:opacity-100"
                    }`}
                    title={item.title}
                  >
                    <img
                      src={item.url}
                      alt={item.title || "thumbnail"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

const EngDefectAnalyticsChart: React.FC<
  EngSharedProps & {
    compact?: boolean;
    type?: EngTab;
  }
> = ({ type, activeTab, compact, goToView, user }) => {
  const {
    sessions,
    machines,
    categories,
    checkLists,
    lines,
    loading,
  } = useAppSelector((state: any) => state.eng);

  const patrolType: EngTab = type || activeTab || "daily";

  const [rangeMode, setRangeMode] = useState<RangeMode>("7d");
  const [offset, setOffset] = useState(0);
  // Trạng thái khởi tạo dữ liệu báo cáo (đợi sessions). true khi chưa có cache.
  const [booting, setBooting] = useState(() => !(sessions?.length));
  const isRestoringReportStateRef = useRef(false);
  const [statusMode, setStatusMode] = useState<StatusMode>("all");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("both");
  const [viewTab, setViewTab] = useState<ViewTab>("trend");
  const [keyword, setKeyword] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SheetNGRecord | null>(
    null,
  );
  const [imagePreview, setImagePreview] = useState<PreviewCarouselState>(
    EMPTY_PREVIEW_CAROUSEL,
  );
  // Chi tiết 1 câu hỏi NG (mở từ cột hành động) để xem hình của riêng câu hỏi đó
  const [errorDetail, setErrorDetail] = useState<NGErrorItem | null>(null);
  // Ảnh của câu hỏi đang xem — chỉ tải khi mở modal (lazy) để không kéo theo
  // toàn bộ ảnh khi load danh sách / báo cáo.
  const [errorImages, setErrorImages] = useState<EngImageView[]>([]);
  const [errorImagesLoading, setErrorImagesLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(0);
  const [highlightSessionId, setHighlightSessionId] = useState<number | null>(
    null,
  );
  const [drillPoint, setDrillPoint] = useState<{
    dateKey: string;
    shift: ShiftType | 'both';
    lineType?: 'total' | 'ok' | 'ng';
  } | null>(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<{
    dateKey: string;
    shift?: ShiftType | 'both';
  } | null>(null);
  const [trendDetailPage, setTrendDetailPage] = useState(0);
  const [fromDateTime, setFromDateTime] = useState("");
  const [toDateTime, setToDateTime] = useState("");
  const debouncedKeyword = useDebounce(keyword, 250);
  const debouncedFromDateTime = useDebounce(fromDateTime, 400);
  const debouncedToDateTime = useDebounce(toDateTime, 400);
  const dispatch = useAppDispatch();
  const bootstrapRequestedKeysRef = useRef(new Set<string>());
  const { t } = useTranslation("engCheckSheet");

  const pT = useCallback(
    (key: string, options?: any) => {
      if (user?.role === "PQC")
        return t(key, { ...options, lng: "vi" }) as string;
      return t(key, options) as string;
    },
    [t, user?.role],
  );

  const rangeOptions = useMemo(
    () => [
      { key: "1d" as RangeMode, label: pT("reportRange1d") },
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
      {
        key: "trend" as ViewTab,
        label: pT("reportTabTrend"),
        icon: <FaBug size={12} />,
      },
      {
        key: "breakdown" as ViewTab,
        label: pT("reportTabBreakdown"),
        icon: <FaLayerGroup size={12} />,
      },
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
      pT("action"),
    ],
    [pT],
  );

  useEffect(() => {
  const requestOnce = (
    key: string,
    hasData: boolean,
    actionCreator: () => any,
  ) => {
    if (hasData || bootstrapRequestedKeysRef.current.has(key)) return undefined;

    bootstrapRequestedKeysRef.current.add(key);
    return dispatch(actionCreator())
      .unwrap()
      .catch(() => {
        bootstrapRequestedKeysRef.current.delete(key);
      });
  };

  // Sessions & categories phụ thuộc sheetType ("1" ngày / "7" tuần) nên key
  // theo tab hiện tại — đổi tab daily/weekly sẽ dispatch lại đúng API.
  const sheetTypeParam = patrolType === "daily" ? "1" : "7";
  const sessionsReq = requestOnce(`sessions:${sheetTypeParam}`, false, () =>
    fetchEngSessionsBySheetType(sheetTypeParam),
  );
  requestOnce(`categories:${sheetTypeParam}`, false, () =>
    fetchEngCategoriesBySheetType(sheetTypeParam),
  );
  requestOnce("machines", Boolean(machines?.length), fetchEngMachines);
  requestOnce("checkLists", Boolean(checkLists?.length), fetchEngCheckLists);
  requestOnce("lines", Boolean(lines?.length), fetchEngLines);

  // Tắt trạng thái khởi tạo khi request sessions vừa khởi tạo hoàn tất (kể cả
  // khi rỗng), hoặc khi đã có sessions cache — giúp hiện spinner đúng lúc.
  if (sessionsReq) {
    setBooting(true);
    sessionsReq.finally(() => setBooting(false));
  } else if (sessions?.length) {
    setBooting(false);
  }
}, [
  dispatch,
  patrolType,
  sessions?.length,
  machines?.length,
  categories?.length,
  checkLists?.length,
  lines?.length,
]);

  // An toàn: khi sessions đã có dữ liệu thì chắc chắn tắt trạng thái khởi tạo.
  useEffect(() => {
    if (sessions?.length) setBooting(false);
  }, [sessions?.length]);
  type CheckListLookup = {
    id: number;
    categoryId: number;
    questionCheck: string;
    machineTypeId: number;
    machineTypeName: string;
    isActive?: boolean;
  };

  type CategoryLookup = {
    id: number;
    sheetType: string;
    name: string;
    isActive?: boolean;
  };

  type MachineLookup = {
    id: number;
    machineName: string;
    machineTypeId: number;
    lineId: number;
    machineTypeName: string;
  };

  type LineLookup = {
    id: number;
    areaPart?: string;
    lineName: string;
  };

  // /VehicleSheetSession có thể bỏ checkListResults => report tải toàn bộ results
  // 1 lần qua engSlice (fetchEngCheckListResults) và giữ bản sao cục bộ, tránh
  // đụng state.eng.checkListResults vốn bị EngCheckListDetail ghi đè theo sheet.
  const [reportResults, setReportResults] = useState<any[]>([]);
  // Ảnh cho report: /CheckListResult (bulk) không kèm ảnh, nên tải ảnh theo từng
  // session NG bằng /Image/session/{id} (trả ảnh gắn theo checkListResultId +
  // typeImage). Gom lại để biết số lượng ảnh và tách loại Before/After/Evidence.
  const [reportImages, setReportImages] = useState<any[]>([]);
  const loadedImageSessionRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    let cancelled = false;
    dispatch(fetchEngCheckListResults())
      .unwrap()
      .then((d: any) => {
        // Phòng trường hợp API bọc dữ liệu: [], {data:[]}, {items:[]}, {results:[]}
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d?.data)
            ? d.data
            : Array.isArray(d?.items)
              ? d.items
              : Array.isArray(d?.results)
                ? d.results
                : [];
        if (!cancelled) setReportResults(arr);
      })
      .catch(() => {
        if (!cancelled) setReportResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Ghép results theo vehicleSheetSessionId để mỗi sheet biết các câu hỏi NG của mình.
  const resultsBySession = useMemo<Map<number, any[]>>(() => {
    const map = new Map<number, any[]>();
    (reportResults || []).forEach((r: any) => {
      const sid = Number(
        r?.vehicleSheetSessionId ?? r?.VehicleSheetSessionId ?? r?.vehicleSheetSession?.id ?? 0,
      );
      if (!sid) return;
      const arr = map.get(sid);
      if (arr) arr.push(r);
      else map.set(sid, [r]);
    });
    return map;
  }, [reportResults]);

  // Map checkListResultId -> danh sách ảnh (đã build view + giữ typeImage).
  const imagesByResultId = useMemo<Map<number, EngImageView[]>>(() => {
    const map = new Map<number, EngImageView[]>();
    (reportImages || []).forEach((img: any) => {
      const rid = Number(img?.checkListResultId);
      if (!rid) return;
      const view = buildImageView(img);
      if (!view.url) return;
      const arr = map.get(rid);
      if (arr) arr.push(view);
      else map.set(rid, [view]);
    });
    return map;
  }, [reportImages]);

  // Ảnh của riêng 1 câu hỏi NG (theo resultId).
  const getErrorImages = useCallback(
    (resultId: number): EngImageView[] =>
      resultId ? imagesByResultId.get(resultId) || [] : [],
    [imagesByResultId],
  );

  // Toàn bộ ảnh của 1 sheet = gom ảnh của các câu hỏi NG trong sheet đó.
  const getSheetImages = useCallback(
    (record: SheetNGRecord): EngImageView[] => {
      const out: EngImageView[] = [];
      record.errors.forEach((err) => {
        const imgs = imagesByResultId.get(err.resultId);
        if (imgs?.length) out.push(...imgs);
      });
      return out;
    },
    [imagesByResultId],
  );

  const lineMap = useMemo<Map<number, LineLookup>>(() => {
    return new Map(
      (lines || []).map((line: any) => [
        Number(line.id),
        {
          id: Number(line.id),
          areaPart: line.areaPart || "",
          lineName: line.lineName || "",
        },
      ]),
    );
  }, [lines]);

  const machineMap = useMemo<Map<number, MachineLookup>>(() => {
    return new Map(
      (machines || []).map((m: any) => [
        Number(m.id),
        {
          id: Number(m.id),
          machineName: m.machineName || "",
          machineTypeId: Number(m.machineTypeId || 0),
          lineId: Number(m.lineId || 0),
          machineTypeName: m.machineType?.name || "",
        },
      ]),
    );
  }, [machines]);

  const categoryMap = useMemo<Map<number, CategoryLookup>>(() => {
    return new Map(
      (categories || []).map((category: any) => [
        Number(category.id),
        {
          id: Number(category.id),
          sheetType: String(category.sheetType),
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
          machineTypeId: Number(checkList.machineTypeId || 0),
          machineTypeName: checkList.machineType?.name || "",
          isActive: checkList.isActive,
        },
      ]),
    );
  }, [checkLists]);

  const getSessionImages = useCallback((session: any): EngImageView[] => {
    const collected: any[] = [];

    // Nguồn cũ: ảnh cấp session (giữ tương thích dữ liệu cũ)
    const legacy =
      (Array.isArray(session?.images) && session.images) ||
      (Array.isArray(session?.sessionImages) && session.sessionImages) ||
      [];
    collected.push(...legacy);

    // API mới: ảnh gắn theo từng câu hỏi (checkListResults[].images)
    const results = Array.isArray(session?.checkListResults)
      ? session.checkListResults
      : [];
    results.forEach((r: any) => {
      if (Array.isArray(r?.images)) collected.push(...r.images);
    });

    const views = collected
      .map(buildImageView)
      .filter((img: any) => Boolean(img.url));

    // Loại trùng theo id (fallback theo url)
    const seen = new Set<string>();
    return views.filter((img) => {
      const key = img.id ? `id:${img.id}` : `url:${img.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const getLineName = useCallback(
    (session: any) => {
      const line = lineMap.get(Number(session?.lineId));
      return (
        session?.lineName ||
        session?.line?.lineName ||
        line?.lineName ||
        EMPTY
      );
    },
    [lineMap],
  );

  // allSheetRecords
const allMappedRecords = useMemo<SheetNGRecord[]>(() => {
  const records = (sessions || [])
    .filter(
      (session: any) =>
        normalizeEngTab(session?.sheetType) === patrolType,
    )
    .filter((session: any) => {
      if (statusMode === "all") return true;
      return String(session?.status || "") === statusMode;
    })
    .map((session: any) => {
      const sessionId = Number(session?.id || 0);
      const sessionImages = getSessionImages(session);
      const fallbackImageCount = Number(
        session?.imageCount ||
          session?.imagesCount ||
          session?.totalImages ||
          session?.patrolImageCount ||
          0,
      );

      // /PatrolSession đã bỏ checkListResults (trả về []) => ưu tiên lấy từ map
      // results tải riêng. Chỉ dùng dữ liệu nhúng khi nó thực sự có phần tử,
      // vì Array.isArray([]) === true sẽ làm fallback không bao giờ chạy.
      const embeddedResults = Array.isArray(session?.checkListResults)
        ? session.checkListResults
        : [];
      const sessionResults =
        embeddedResults.length > 0
          ? embeddedResults
          : resultsBySession.get(sessionId) || [];
      const lineName = getLineName(session);

      const sheetTime = session?.createdAt || session?.createAt || "";
      const sheetShiftInfo = getShiftDay(sheetTime);

      const errors: NGErrorItem[] = sessionResults
        .filter((result: any) => isNG(result?.result))
        .map((result: any, index: number) => {
          const nestedCheckList = result?.checkList;
          const nestedCategory = nestedCheckList?.category;

          const checkList =
            checkListMap.get(Number(result?.checkListId)) ||
            (nestedCheckList
              ? {
                  id: Number(nestedCheckList.id || result?.checkListId || 0),
                  categoryId: Number(nestedCheckList.categoryId || 0),
                  questionCheck: nestedCheckList.questionCheck || "",
                  machineTypeId: Number(nestedCheckList.machineTypeId || 0),
                  machineTypeName: nestedCheckList.machineType?.name || "",
                  isActive: nestedCheckList.isActive,
                }
              : undefined);

          const category =
            (checkList ? categoryMap.get(Number(checkList.categoryId)) : undefined) ||
            (nestedCategory
              ? {
                  id: Number(nestedCategory.id || 0),
                  sheetType: String(nestedCategory.sheetType || ""),
                  name: nestedCategory.name || "",
                  isActive: nestedCategory.isActive,
                }
              : undefined);

          // Eng: mỗi result gắn trực tiếp với 1 máy (machineId). Ưu tiên tên máy,
          // fallback tên loại máy từ checkList.machineType.
          const machine =
            machineMap.get(Number(result?.machineId)) ||
            (result?.machine
              ? {
                  id: Number(result.machine.id || 0),
                  machineName: result.machine.machineName || "",
                  machineTypeId: Number(result.machine.machineTypeId || 0),
                  lineId: Number(result.machine.lineId || 0),
                  machineTypeName: result.machine.machineType?.name || "",
                }
              : undefined);

          const checkAt = result?.checkAt || sheetTime;
          const errorShiftInfo = getShiftDay(checkAt);

          return {
            id: `${sessionId}-${result?.id || result?.checkListId || index}`,
            resultId: Number(result?.id || 0),
            sessionId,
            checkListId: Number(result?.checkListId || 0),
            machineName:
              machine?.machineName || checkList?.machineTypeName || EMPTY,
            categoryName: category?.name || EMPTY,
            questionCheck:
              checkList?.questionCheck ||
              String(result?.checkListId || EMPTY),
            actualValue: result?.actualValue || EMPTY,
            note: result?.note || EMPTY,
            checkAt,
            checkAtText: fmtDateTime(checkAt),
            shift: errorShiftInfo.shift,
            // Ảnh gắn theo từng câu hỏi (API mới: checkListResult.images).
            // Nếu payload đã nhúng ảnh thì dùng luôn; nếu không thì để rỗng và
            // tải khi mở modal (xem effect bên dưới).
            images: Array.isArray(result?.images)
              ? result.images
                  .map(buildImageView)
                  .filter((img: EngImageView) => Boolean(img.url))
              : [],
            // Số ảnh để hiển thị badge mà không cần tải ảnh: ưu tiên imageCount
            // backend trả về, fallback theo độ dài mảng ảnh nhúng (nếu có).
            imageCount: Number(
              result?.imageCount ??
                result?.imagesCount ??
                (Array.isArray(result?.images) ? result.images.length : 0),
            ),
            // ✅ bỏ shiftText — tính lúc render
          };
        });

      if (!sheetShiftInfo.key) return null;

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
        patrolType: String(session?.sheetType || ""),
        sessionId,
        lineName,
        status: session?.status || EMPTY,
        detectedBy: session?.fullName || EMPTY,
        note: sheetNote || EMPTY,
        shift: sheetShift,
        // ✅ bỏ shiftText — tính lúc render
        errors,
        images: sessionImages,
        imageCount: sessionImages.length || fallbackImageCount,
        firstQuestionCheck: errors[0]?.questionCheck || EMPTY,
        machineSummary: uniqText(errors.map((x) => x.machineName)),
        categorySummary: uniqText(errors.map((x) => x.categoryName)),
        hasImages: sessionImages.length > 0 || fallbackImageCount > 0,
      } as SheetNGRecord;
    })
    .filter(Boolean) as SheetNGRecord[];

  return records;
}, [
  sessions,
  resultsBySession,
  patrolType,
  statusMode,
  getSessionImages,
  getLineName,
  checkListMap,
  categoryMap,
  machineMap,
  // ✅ KHÔNG có pT
]);

const allSheetRecords = useMemo(() => allMappedRecords.filter(r => r.errors.length > 0), [allMappedRecords]);

const getShiftLabel = useCallback(
  (shift: ShiftType | 'both') => shift === 'both' ? pT("shiftBoth") : getShiftText(shift as ShiftType, pT),
  [pT],
);

  const firstDateKey = useMemo(() => {
    return allMappedRecords
      .map((record) => record.date)
      .filter(Boolean)
      .sort()[0];
  }, [allMappedRecords]);

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
    const kw = debouncedKeyword.trim().toLowerCase();
    const customFrom = getDateTimeFilter(debouncedFromDateTime);
    const customTo = getDateTimeFilter(debouncedToDateTime);

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
        record.machineSummary,
        record.categorySummary,
        record.firstQuestionCheck,
        record.note,
        record.detectedBy,
        ...record.errors.flatMap((x) => [
          x.machineName,
          x.categoryName,
          x.questionCheck,
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
      debouncedKeyword,
      shiftFilter,
      debouncedFromDateTime,
      debouncedToDateTime,
  ]);

  const rangeMappedRecords = useMemo(() => {
    const kw = debouncedKeyword.trim().toLowerCase();
    const customFrom = getDateTimeFilter(debouncedFromDateTime);
    const customTo = getDateTimeFilter(debouncedToDateTime);

    return allMappedRecords.filter((record) => {
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
        record.machineSummary,
        record.categorySummary,
        record.firstQuestionCheck,
        record.note,
        record.detectedBy,
        ...record.errors.flatMap((x) => [
          x.machineName,
          x.categoryName,
          x.questionCheck,
          x.note,
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(kw);
    });
  }, [
      allMappedRecords,
      start,
      end,
      debouncedKeyword,
      shiftFilter,
      debouncedFromDateTime,
      debouncedToDateTime,
  ]);

  const rangeAllSessions = useMemo(() => {
    const customFrom = getDateTimeFilter(debouncedFromDateTime);
    const customTo = getDateTimeFilter(debouncedToDateTime);

    return (sessions || [])
      .filter((session: any) => normalizeEngTab(session?.sheetType) === patrolType)
      .filter((session: any) => {
        if (statusMode === "all") return true;
        return String(session?.status || "") === statusMode;
      })
      .filter((session: any) => {
        const sheetTime = session?.createdAt || session?.createAt || "";
        const sheetShiftInfo = getShiftDay(sheetTime);
        
        if (customFrom || customTo) {
          const sheetDateTime = parseDate(sheetTime);
          if (!sheetDateTime) return false;
          if (customFrom && sheetDateTime < customFrom) return false;
          if (customTo && sheetDateTime > customTo) return false;
        } else {
          const businessDate = parseDate(
            `${sheetShiftInfo.key}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00`,
          );
          const inRange = businessDate
            ? businessDate >= start && businessDate <= end
            : false;
          if (!inRange) return false;
        }

        if (shiftFilter !== "both" && sheetShiftInfo.shift !== shiftFilter) {
          return false;
        }

        return true;
      });
  }, [
    sessions,
    patrolType,
    statusMode,
    start,
    end,
    shiftFilter,
    debouncedFromDateTime,
    debouncedToDateTime,
  ]);

  const dashboardStats = useMemo(() => {
    const totalSheetCreated = rangeAllSessions.length;
    
    // Line IDs for all active lines
    const activeLines = (lines || []).filter((l: any) => l.isActive !== false);
    const totalLines = activeLines.length;

    // Get lineIds that have at least one NG sheet
    const ngLineIds = new Set<number>();
    rangeRecords.forEach((r: SheetNGRecord) => {
      const s = rangeAllSessions.find((s: any) => s.id === r.sessionId);
      if (s?.lineId) ngLineIds.add(Number(s.lineId));
    });

    // Get lineIds that have sheets
    const producedLineIds = new Set<number>();
    rangeAllSessions.forEach((s: any) => {
      if (s?.lineId) producedLineIds.add(Number(s.lineId));
    });

    const okLineIds = new Set<number>();
    producedLineIds.forEach(id => {
      if (!ngLineIds.has(id)) okLineIds.add(id);
    });

    const notProducedLineIds = new Set<number>();
    activeLines.forEach((l: any) => {
      if (!producedLineIds.has(Number(l.id))) {
        notProducedLineIds.add(Number(l.id));
      }
    });

    const getLineNameFromId = (id: number) => {
      const line = activeLines.find((l: any) => Number(l.id) === id);
      return line ? line.lineName : String(id);
    };

    return {
      totalSheetCreated,
      lineOkNames: Array.from(okLineIds).map(getLineNameFromId),
      lineNgNames: Array.from(ngLineIds).map(getLineNameFromId),
      lineNotProducedNames: Array.from(notProducedLineIds).map(getLineNameFromId),
      producedLineCount: producedLineIds.size,
      totalLines
    };
  }, [rangeAllSessions, rangeRecords, lines]);

  // Tải ảnh cho các sheet NG đang nằm trong phạm vi lọc. Mỗi session chỉ tải 1
  // lần (ref dedupe), giới hạn số request song song để không quá tải.
  useEffect(() => {
    const ids = Array.from(
      new Set(rangeRecords.map((record) => record.sessionId).filter(Boolean)),
    ).filter((id) => !loadedImageSessionRef.current.has(id));

    if (!ids.length) return;

    let cancelled = false;
    ids.forEach((id) => loadedImageSessionRef.current.add(id));

    const CONCURRENCY = 6;
    let cursor = 0;

    const runNext = async (): Promise<void> => {
      const current = cursor++;
      if (current >= ids.length || cancelled) return;
      const id = ids[current];
      try {
        const data = await dispatch(fetchEngImagesBySession(id)).unwrap();
        const arr = Array.isArray(data) ? data : [];
        if (!cancelled && arr.length) {
          setReportImages((prev) => prev.concat(arr));
        }
      } catch {
        // Cho phép thử lại session này ở lần render sau nếu lỗi tạm thời.
        loadedImageSessionRef.current.delete(id);
      }
      await runNext();
    };

    Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, ids.length) }, () =>
        runNext(),
      ),
    );

    return () => {
      cancelled = true;
    };
  }, [rangeRecords, dispatch]);

  // Ảnh hiển thị trong modal chi tiết 1 câu hỏi NG. Ưu tiên ảnh đã nạp sẵn cho
  // report; nếu chưa có thì fallback gọi API theo từng loại ảnh.
  useEffect(() => {
    if (!errorDetail) {
      setErrorImages([]);
      setErrorImagesLoading(false);
      return;
    }

    const preloaded = errorDetail.resultId
      ? imagesByResultId.get(errorDetail.resultId)
      : undefined;
    if (preloaded?.length) {
      setErrorImages(preloaded);
      setErrorImagesLoading(false);
      return;
    }

    // Nếu payload đã nhúng sẵn ảnh thì dùng luôn, khỏi gọi API.
    if (errorDetail.images.length > 0) {
      setErrorImages(errorDetail.images);
      return;
    }

    const resultId = errorDetail.resultId;
    if (!resultId) {
      setErrorImages([]);
      return;
    }

    let cancelled = false;
    setErrorImagesLoading(true);

    // Tải toàn bộ ảnh của session qua engSlice rồi lọc đúng câu hỏi này
    // (ảnh gắn theo checkListResultId, loại ảnh nằm trong imageType).
    dispatch(fetchEngImagesBySession(errorDetail.sessionId))
      .unwrap()
      .then((data: any) => {
        if (cancelled) return;
        const merged = (Array.isArray(data) ? data : [])
          .filter((img: any) => Number(img?.checkListResultId) === resultId)
          .map(buildImageView)
          .filter((img: EngImageView) => Boolean(img.url));
        setErrorImages(merged);
      })
      .catch(() => {
        if (!cancelled) setErrorImages([]);
      })
      .finally(() => {
        if (!cancelled) setErrorImagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [errorDetail, imagesByResultId, dispatch]);

  const effectiveTrendRange = useMemo(() => {
    const customFrom = getDateTimeFilter(debouncedFromDateTime);
    const customTo = getDateTimeFilter(debouncedToDateTime); 

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
  }, [debouncedFromDateTime, debouncedToDateTime, startKey, endKey]);

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
      const allRows = rangeAllSessions.filter((session: any) => {
        const sheetTime = session?.createdAt || session?.createAt || "";
        const shiftInfo = getShiftDay(sheetTime);
        return shiftInfo.key === key;
      });

      const ngRows = rangeRecords.filter((record) => record.date === key);

      const totalSheets = allRows.length;
      const ngSheets = ngRows.length;
      const okSheets = totalSheets - ngSheets;

      return {
        label: fmtShort(d),
        dateKey: key,
        total: totalSheets,
        ok: okSheets,
        ng: ngSheets,
        records: ngRows,
      };
    });
  }, [effectiveTrendRange, rangeRecords]);

  const activeRecords = useMemo(() => {
    if (!drillPoint) return rangeRecords;
    if (drillPoint.lineType === 'ok') return [];

    return rangeRecords.filter((record) => {
      const isSameDate = record.date === drillPoint.dateKey;
      if (drillPoint.shift && drillPoint.shift !== 'both') {
        return isSameDate && record.shift === drillPoint.shift;
      }
      return isSameDate;
    });
  }, [drillPoint, rangeRecords]);

  const activeMappedRecords = useMemo(() => {
    if (!drillPoint) return rangeMappedRecords;

    return rangeMappedRecords.filter((record) => {
      const isSameDate = record.date === drillPoint.dateKey;
      let shiftMatch = true;
      if (drillPoint.shift && drillPoint.shift !== 'both') {
        shiftMatch = record.shift === drillPoint.shift;
      }
      
      let lineTypeMatch = true;
      if (drillPoint.lineType === 'ok') {
        lineTypeMatch = record.errors.length === 0;
      } else if (drillPoint.lineType === 'ng') {
        lineTypeMatch = record.errors.length > 0;
      }

      return isSameDate && shiftMatch && lineTypeMatch;
    });
  }, [drillPoint, rangeMappedRecords]);

  const activeErrors = useMemo(
    () => activeRecords.flatMap((record) => record.errors),
    [activeRecords],
  );

  const lineData = useMemo(() => {
    const lineCounter = new Map<
      string,
      { name: string; value: number; sheetCount: number; records: SheetNGRecord[] }
    >();

    activeRecords.forEach((record) => {
      const name = record.lineName || EMPTY;
      const current = lineCounter.get(name) || {
        name,
        value: 0,
        sheetCount: 0,
        records: [],
      };

      // Mỗi sheet NG có thể có nhiều lỗi NG. Các sheet trùng line sẽ được cộng dồn số lỗi
      // để lọc đúng line có tổng lỗi lớn nhất, không chỉ đếm số sheet.
      current.value += record.errors.length;
      current.sheetCount += 1;
      current.records.push(record);
      lineCounter.set(name, current);
    });

    return Array.from(lineCounter.values()).sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      if (b.sheetCount !== a.sheetCount) return b.sheetCount - a.sheetCount;
      return a.name.localeCompare(b.name);
    });
  }, [activeRecords]);

  const errorData = useMemo(
    () => topCount(activeErrors, (x) => x.questionCheck, 10),
    [activeErrors],
  );
  const stageData = useMemo(
    () => topCount(activeErrors, (x) => x.machineName, 8),
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
        row[line.key] =
          byLine[line.name]?.reduce(
            (sum, record) => sum + record.errors.length,
            0,
          ) || 0;
      });

      return row;
    });
  }, [trendBuckets, topLineKeys]);

  const detailTablePageSize = compact ? 20 : DETAIL_TABLE_PAGE_SIZE;

  const sortedDetailRecords = useMemo(() => {
    return [...activeRecords].sort((a, b) => {
      const timeA = parseDate(a.sheetTime)?.getTime() || 0;
      const timeB = parseDate(b.sheetTime)?.getTime() || 0;

      // Ngày mới nhất / giờ mới nhất lên đầu
      return timeB - timeA;
    });
  }, [activeRecords]);

  const detailPageCount = useMemo(() => {
    return Math.ceil(sortedDetailRecords.length / detailTablePageSize);
  }, [sortedDetailRecords.length, detailTablePageSize]);

  const detailRows = useMemo(() => {
    const safePage =
      detailPageCount > 0 ? Math.min(detailPage, detailPageCount - 1) : 0;

    const startIndex = safePage * detailTablePageSize;

    return sortedDetailRecords.slice(
      startIndex,
      startIndex + detailTablePageSize,
    );
  }, [sortedDetailRecords, detailPage, detailPageCount, detailTablePageSize]);

  const trendSelectedRows = useMemo(() => {
    if (!drillPoint) return [];
    const startIndex = trendDetailPage * TREND_DETAIL_PAGE_SIZE;
    return activeMappedRecords.slice(startIndex, startIndex + TREND_DETAIL_PAGE_SIZE);
  }, [activeMappedRecords, drillPoint, trendDetailPage]);

  const trendDetailPageCount = useMemo(() => {
    if (!drillPoint) return 0;
    return Math.ceil(activeMappedRecords.length / TREND_DETAIL_PAGE_SIZE);
  }, [activeMappedRecords.length, drillPoint]);

  const trendSelectedLabel = useMemo(() => {
    if (!drillPoint) return "";
    const shiftLabel = drillPoint.shift && drillPoint.shift !== 'both' 
      ? ` - ${getShiftLabel(drillPoint.shift)}` 
      : (shiftFilter !== 'both' ? ` - ${getShiftLabel(shiftFilter)}` : '');
    return `${fmtDateKey(drillPoint.dateKey)}${shiftLabel}`;
  }, [drillPoint, getShiftLabel, shiftFilter]);

  const openImage = useCallback(
    (img: EngImageView, title: string, imageList?: EngImageView[]) => {
      if (!img.url) return;

      const sourceImages = imageList?.length ? imageList : [img];
      const items = sourceImages
        .filter((item) => Boolean(item.url))
        .map((item, index) => ({
          id: item.id || `${item.url}-${index}`,
          url: item.url,
          title: `${title} - ${pT("imageSection")} ${index + 1}`,
          note: item.note || item.filename || "",
        }));

      if (!items.length) return;

      const selectedIndex = Math.max(
        0,
        items.findIndex((item) => item.url === img.url),
      );

      setImagePreview({
        open: true,
        items,
        index: selectedIndex,
        title,
      });
    },
    [pT],
  );

  const buildReportState = useCallback(
    (
      override?: Partial<{
        highlightId: number | null;
        returnMode: ReportReturnMode;
        reportTab: ViewTab;
      }>,
    ) => {
      return {
        source: "report",
        returnPath: `${window.location.pathname}${window.location.search}`,
        highlightId: override?.highlightId ?? null,
        type: patrolType,
        reportTab: override?.reportTab ?? viewTab,
        returnMode: override?.returnMode ?? "table",
        drillPoint,
        trendDetailPage,
        detailPage,
        rangeMode,
        offset,
        statusMode,
        shiftFilter,
        keyword,
        fromDateTime,
        toDateTime,
        savedAt: Date.now(),
      };
    },
    [
      patrolType,
      viewTab,
      drillPoint,
      trendDetailPage,
      detailPage,
      rangeMode,
      offset,
      statusMode,
      shiftFilter,
      keyword,
      fromDateTime,
      toDateTime,
    ],
  );

  const isFreshReportReturnState = (savedAt?: number) => {
    if (!savedAt) return false;
    return Date.now() - Number(savedAt) < 30 * 60 * 1000;
  };

  useEffect(() => {
    if (isRestoringReportStateRef.current) return;

    const oldRaw = localStorage.getItem("engReportReturnState");

    let oldState: any = null;

    try {
      oldState = oldRaw ? JSON.parse(oldRaw) : null;
    } catch {
      oldState = null;
    }

    const hasPendingReturnState =
      oldState?.source === "report" &&
      oldState?.highlightId &&
      isFreshReportReturnState(oldState?.savedAt);

    if (hasPendingReturnState) return;

    const currentState = buildReportState();

    localStorage.setItem(
      "engReportReturnState",
      JSON.stringify({
        ...currentState,
        highlightId: null,
        returnMode: currentState.returnMode,
        reportTab: currentState.reportTab,
      }),
    );
  }, [buildReportState]);

  const goToSheetDetailFromReport = useCallback(
    (row: SheetNGRecord, returnMode: ReportReturnMode = "table") => {
      const state = buildReportState({
        highlightId: row.sessionId,
        returnMode,
        reportTab: returnMode === "trend-dot" ? "trend" : "table",
      });

      localStorage.setItem("engReportReturnState", JSON.stringify(state));
      goToView?.("detail", String(row.sessionId), patrolType);
    },
    [buildReportState, goToView, patrolType],
  );

  const handleShiftDotClick = useCallback((payload: any, shiftFilterValue: ShiftFilter, lineType: 'total' | 'ok' | 'ng') => {
    if (!payload?.dateKey) return;

    setDrillPoint((prev) => {
      const isSame = prev?.dateKey === payload.dateKey && prev?.lineType === lineType;

      return isSame ? null : { dateKey: payload.dateKey, shift: shiftFilterValue, lineType };
    });
    setTrendDetailPage(0);
  }, []);

  const handleResetFilters = useCallback(() => {
    setKeyword("");
    setFromDateTime("");
    setToDateTime("");
    setStatusMode("all");
    setShiftFilter("both");
    setRangeMode("7d");
    setOffset(0);
    setDrillPoint(null);
    setHoveredTrendPoint(null);
    setTrendDetailPage(0);
    setDetailPage(0);
    setSelectedRecord(null);
    setHighlightSessionId(null);

    localStorage.removeItem("engReportReturnState");
  }, []);

  useEffect(() => {
    if (isRestoringReportStateRef.current) return;

    setTrendDetailPage(0);
    setDetailPage(0);
  }, [
  drillPoint,
  debouncedKeyword,      
  statusMode,
  rangeMode,
  offset,
  shiftFilter,
  debouncedFromDateTime, 
  debouncedToDateTime,  
  patrolType,
]);

  useEffect(() => {
    if (detailPageCount > 0 && detailPage > detailPageCount - 1) {
      setDetailPage(detailPageCount - 1);
    }

    if (detailPageCount === 0 && detailPage !== 0) {
      setDetailPage(0);
    }
  }, [detailPage, detailPageCount]);

  useEffect(() => {
    if (!selectedRecord) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRecord(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRecord]);

  useEffect(() => {
  if (!selectedRecord) return;

  const latestRecord = activeRecords.find(
    (record) => record.sessionId === selectedRecord.sessionId,
  );

  if (!latestRecord) return;

  if (latestRecord === selectedRecord) return;

  const hasChanged =
    latestRecord.imageCount !== selectedRecord.imageCount ||
    latestRecord.images.length !== selectedRecord.images.length ||
    latestRecord.errors.length !== selectedRecord.errors.length;

  if (hasChanged) {
    setSelectedRecord(latestRecord);
  }
}, [activeRecords]);

  useEffect(() => {
    const raw = localStorage.getItem("engReportReturnState");
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);

      const canRestore =
        saved?.source === "report" &&
        saved?.highlightId &&
        isFreshReportReturnState(saved?.savedAt) &&
        (!saved.type || saved.type === patrolType);

      if (!canRestore) {
        isRestoringReportStateRef.current = false;
        return;
      }

      isRestoringReportStateRef.current = true;

      setViewTab(saved.reportTab || "table");
      setHighlightSessionId(Number(saved.highlightId));

      if (saved.rangeMode) setRangeMode(saved.rangeMode);
      if (typeof saved.offset === "number") setOffset(saved.offset);
      if (saved.statusMode) setStatusMode(saved.statusMode);
      if (saved.shiftFilter) setShiftFilter(saved.shiftFilter);
      if (typeof saved.keyword === "string") setKeyword(saved.keyword);
      if (typeof saved.fromDateTime === "string")
        setFromDateTime(saved.fromDateTime);
      if (typeof saved.toDateTime === "string") setToDateTime(saved.toDateTime);

      if (saved.drillPoint) {
        setDrillPoint(saved.drillPoint);
      }

      if (saved.returnMode === "trend-dot") {
        setTrendDetailPage(Number(saved.trendDetailPage || 0));
      }

      if (typeof saved.detailPage === "number") {
        setDetailPage(saved.detailPage);
      }
      window.setTimeout(() => {
        isRestoringReportStateRef.current = false;
      }, 300);

      let retryCount = 0;

      const timer = window.setInterval(() => {
        const rowId =
          saved.returnMode === "trend-dot"
            ? `eng-report-trend-row-${Number(saved.highlightId)}`
            : `eng-report-row-${Number(saved.highlightId)}`;

        const el = document.getElementById(rowId);

        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          window.clearInterval(timer);
          return;
        }

        retryCount += 1;

        if (retryCount >= 20) {
          window.clearInterval(timer);
        }
      }, 250);

      const clearTimer = window.setTimeout(() => {
        setHighlightSessionId(null);
        localStorage.removeItem("engReportReturnState");
      }, 5000);

      return () => {
        window.clearInterval(timer);
        window.clearTimeout(clearTimer);
      };
    } catch {
      localStorage.removeItem("engReportReturnState");
    }
  }, [patrolType]);


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
                  type:
                    patrolType === "daily"
                      ? pT("dailyPatrol")
                      : pT("weeklyPatrol"),
                })}
              </h3>
              <p className="text-xs text-slate-400">
                {rangeLabel} • {pT("businessDayTimeNote")}
                {drillPoint ? (
                  <span className="ml-2 text-amber-300">
                    • {pT("reportFiltering")}: {fmtDateKey(drillPoint.dateKey)}{" "}
                    - {getShiftLabel(drillPoint.shift)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
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
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={rangeMode === "all"}
                onClick={() => setOffset((x) => x + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <FaChevronLeft size={10} />
              </button>

              <div className="flex h-8 min-w-[120px] items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-bold text-amber-300">
                {rangeLabel}
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
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportTotalSheetCreated")}</p>
            <p className="mt-1 text-lg font-bold leading-tight text-blue-400">
              {dashboardStats.totalSheetCreated}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportLineOK")}</p>
            <p className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-emerald-400" title={dashboardStats.lineOkNames.join(', ')}>
              {dashboardStats.lineOkNames.length > 0 ? dashboardStats.lineOkNames.join(', ') : '0'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportLineNG")}</p>
            <p className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-red-400" title={dashboardStats.lineNgNames.join(', ')}>
              {dashboardStats.lineNgNames.length > 0 ? dashboardStats.lineNgNames.join(', ') : '0'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportLineNotProduced")}</p>
            <p className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-slate-400" title={dashboardStats.lineNotProducedNames.join(', ')}>
              {dashboardStats.lineNotProducedNames.length > 0 ? dashboardStats.lineNotProducedNames.join(', ') : '0'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{pT("reportTotalLineProduced")}</p>
            <p className="mt-1 text-lg font-bold leading-tight text-amber-300">
              {dashboardStats.producedLineCount}/{dashboardStats.totalLines}
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

             <div className="flex gap-2 items-center justify-center">
                  <div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
                    >
                      <FaUndo size={12} />
                      Reset
                    </button>
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
                    setFromDateTime((prev) =>
                      normalizeDateTimeLocalByDefaultTime(e.target.value, "08:00", prev),
                    );
                    setOffset(0);
                    setDrillPoint(null);
                    setTrendDetailPage(0);
                    setDetailPage(0);
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
                    setToDateTime((prev) =>
                      normalizeDateTimeLocalByDefaultTime(e.target.value, "07:59", prev),
                    );
                    setOffset(0);
                    setDrillPoint(null);
                    setTrendDetailPage(0);
                    setDetailPage(0);
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
        {booting || loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-50 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
            <span className="text-sm text-slate-500">{pT("loading")}</span>
          </div>
        ) : null}

        {!booting && !loading && viewTab === "trend" ? (
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

                    <Line
                      type="monotone"
                      dataKey="total"
                      name={pT("reportTotalSheetCreated", "Tổng sheet tạo")}
                      stroke="#3b82f6" // blue-500
                      strokeWidth={3}
                      activeDot={false}
                      dot={(props: any) => {
                        const { cx, cy, payload, value } = props;
                        if (value == null) return null;

                        const isSelected = drillPoint?.dateKey === payload.dateKey;
                        const isHovered = hoveredTrendPoint?.dateKey === payload.dateKey;

                        return (
                          <circle
                            focusable="false"
                            tabIndex={-1}
                            cx={cx}
                            cy={cy}
                            r={isSelected || isHovered ? 7 : 4}
                            fill="#3b82f6"
                            stroke="#fff"
                            strokeWidth={isSelected || isHovered ? 3 : 2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() =>
                              setHoveredTrendPoint({ dateKey: payload.dateKey })
                            }
                            onMouseLeave={() => setHoveredTrendPoint(null)}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleShiftDotClick(payload, shiftFilter, 'total');
                            }}
                          />
                        );
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="ok"
                      name={pT("reportLineOK", "Sheet OK")}
                      stroke="#10b981" // emerald-500
                      strokeWidth={3}
                      activeDot={false}
                      dot={(props: any) => {
                        const { cx, cy, payload, value } = props;
                        if (value == null) return null;

                        const isSelected = drillPoint?.dateKey === payload.dateKey;
                        const isHovered = hoveredTrendPoint?.dateKey === payload.dateKey;

                        return (
                          <circle
                            focusable="false"
                            tabIndex={-1}
                            cx={cx}
                            cy={cy}
                            r={isSelected || isHovered ? 7 : 4}
                            fill="#10b981"
                            stroke="#fff"
                            strokeWidth={isSelected || isHovered ? 3 : 2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() =>
                              setHoveredTrendPoint({ dateKey: payload.dateKey })
                            }
                            onMouseLeave={() => setHoveredTrendPoint(null)}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleShiftDotClick(payload, shiftFilter, 'ok');
                            }}
                          />
                        );
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="ng"
                      name={pT("reportLineNG", "Sheet NG")}
                      stroke="#ef4444" // red-500
                      strokeWidth={3}
                      activeDot={false}
                      dot={(props: any) => {
                        const { cx, cy, payload, value } = props;
                        if (value == null) return null;

                        const isSelected = drillPoint?.dateKey === payload.dateKey;
                        const isHovered = hoveredTrendPoint?.dateKey === payload.dateKey;

                        return (
                          <circle
                            focusable="false"
                            tabIndex={-1}
                            cx={cx}
                            cy={cy}
                            r={isSelected || isHovered ? 7 : 4}
                            fill="#ef4444"
                            stroke="#fff"
                            strokeWidth={isSelected || isHovered ? 3 : 2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() =>
                              setHoveredTrendPoint({ dateKey: payload.dateKey })
                            }
                            onMouseLeave={() => setHoveredTrendPoint(null)}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleShiftDotClick(payload, shiftFilter, 'ng');
                            }}
                          />
                        );
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {drillPoint ? (
              <div className="rounded-xl border border-slate-100 p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {pT("reportSelectedSheets", {
                        label: trendSelectedLabel,
                      })}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {pT("reportShowingTrendSheets", {
                        pageSize: TREND_DETAIL_PAGE_SIZE,
                        count: activeMappedRecords.length,
                      })}
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
                          id={`eng-report-trend-row-${row.sessionId}`}
                          onClick={() =>
                            goToSheetDetailFromReport(row, "trend-dot")
                          }
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
                              {getShiftLabel(row.shift)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-900">
                            #{row.sessionId}
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-900">
                            {row.lineName}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedRecord(row);
                              }}
                              className={`rounded-lg px-2 py-1 text-left font-bold hover:underline ${
                                row.errors.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {pT("reportErrorUnit", {
                                count: row.errors.length,
                              })}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-left">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedRecord(row);
                              }}
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              title={pT("reportOpenDetail")}
                            >
                              <FaEye size={13} />
                              {getSheetImages(row).length > 0 ? (
                                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                                  {getSheetImages(row).length}
                                </span>
                              ) : null}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {trendSelectedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-10 text-center text-sm text-slate-400"
                          >
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
                      id={`eng-report-trend-row-${row.sessionId}`}
                      onClick={() =>
                        goToSheetDetailFromReport(row, "trend-dot")
                      }
                      className={`rounded-xl border border-slate-200 p-3 shadow-sm ${
                        highlightSessionId === row.sessionId
                          ? "bg-red-50 ring-2 ring-red-300 ring-inset"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            {row.dateText} • {row.sheetTimeText} •{" "}
                            {getShiftLabel(row.shift)}
                          </p>
                          <h4 className="mt-1 text-sm font-extrabold text-slate-900">
                            Sheet #{row.sessionId} • {row.lineName}
                          </h4>
                          <p className={`mt-1 text-sm font-bold ${row.errors.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {pT("reportErrorUnit", {
                              count: row.errors.length,
                            })}
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
                      onPageChange={({ selected }) =>
                        setTrendDetailPage(selected)
                      }
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

        {!booting && !loading && viewTab === "breakdown" ? (
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
                  <PieChart
                    accessibilityLayer={false}
                    style={{ outline: "none" }}
                  >
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

        {!booting && !loading && viewTab === "table" ? (
          <div id="eng-report-detail-table" className="space-y-4!">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {pT("reportShowingDetailSheets", {
                  shown: detailRows.length,
                  total: sortedDetailRecords.length,
                })}
                {activeRecords.length > 0 ? (
                  <span className="ml-1! text-slate-400">
                    ({pT("page") || "Trang"} {detailPage + 1}/
                    {Math.max(detailPageCount, 1)})
                  </span>
                ) : null}
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
                      id={`eng-report-row-${row.sessionId}`}
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
                          {getShiftLabel(row.shift)}
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
                          title={row.machineSummary}
                        >
                          {row.machineSummary}
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
                          title={row.firstQuestionCheck}
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
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          title={pT("reportOpenDetail")}
                        >
                          <FaEye size={13} />
                          {getSheetImages(row).length > 0 ? (
                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                              {getSheetImages(row).length}
                            </span>
                          ) : null}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {detailRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
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
                  id={`eng-report-row-${row.sessionId}`}
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
                        {row.dateText} • {row.sheetTimeText} • {getShiftLabel(row.shift)}
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
                        {row.machineSummary}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-slate-400">
                        {pT("reportColCategory")}
                      </p>
                      <p className="font-bold text-slate-700">
                        {row.categorySummary}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const sheetImages = getSheetImages(row);
                    if (!sheetImages.length) return null;
                    return (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {sheetImages.slice(0, 4).map((img, index) => (
                          <button
                            key={`${row.id}-${img.id}-${index}`}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openImage(
                                img,
                                `${row.lineName} - Sheet #${row.sessionId}`,
                                sheetImages,
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
                    );
                  })()}
                </div>
              ))}

              {detailRows.length === 0 ? (
                <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-400">
                  {pT("reportNoNGSheetInFilter")}
                </div>
              ) : null}
            </div>

            {detailPageCount > 1 ? (
              <div className="mt-4 flex justify-center border-t border-slate-100 pt-4">
                <div className="w-full max-w-full overflow-x-auto">
                  <ReactPaginate
                    {...PAGINATE_PROPS}
                    pageCount={detailPageCount}
                    forcePage={detailPage}
                    onPageChange={({ selected }) => {
                      setDetailPage(selected);

                      const el = document.getElementById(
                        "eng-report-detail-table",
                      );
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ImagePreviewCarousel
        preview={imagePreview}
        onClose={() => setImagePreview(EMPTY_PREVIEW_CAROUSEL)}
        accentClass="red"
      />

      {selectedRecord ? (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                  {pT("reportSheetNGDetail")}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Sheet ID #{selectedRecord.sessionId}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRecord.dateText} • {selectedRecord.sheetTimeText} •{" "}
                  {getShiftLabel(selectedRecord.shift)} • {selectedRecord.lineName} •{" "}
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

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    {pT("reportColProductionDate")}
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedRecord.dateText}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {pT("reportCreatedAt")} {selectedRecord.sheetTimeText}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    {pT("reportColShift")}
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {getShiftLabel(selectedRecord.shift)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    {pT("reportColLine")}
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedRecord.lineName}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    {pT("reportSheetStatus")}
                  </p>
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
                        viewTab === "trend" && drillPoint
                          ? "trend-dot"
                          : "table",
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
                            {getShiftLabel(error.shift)}
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-800">
                            {error.machineName}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {error.categoryName}
                          </td>
                          <td className="min-w-[260px] px-3 py-3 font-bold text-red-600">
                            {error.questionCheck}
                          </td>
                          <td className="min-w-[180px] px-3 py-3 text-slate-600">
                            {error.note || EMPTY}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setErrorDetail(error)}
                              title={pT("reportOpenDetail")}
                              className="relative inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                            >
                              <FaEye size={13} />
                              {getErrorImages(error.resultId).length > 0 && (
                                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                                  {getErrorImages(error.resultId).length}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal chi tiết 1 câu hỏi NG: xem ghi chú + hình của riêng câu hỏi đó */}
      {errorDetail ? (
        <div
          className="fixed inset-0 z-99990 flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4"
          onClick={() => setErrorDetail(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-800 p-4 text-white">
              <div className="min-w-0 space-y-2!">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  {pT("reportErrorDetailTitle")}
                </p>
                <h3 className="text-sm font-bold leading-relaxed sm:text-base">
                  {errorDetail.questionCheck}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setErrorDetail(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 space-y-4! overflow-y-auto p-4!">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2! rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">{pT("reportColStage")}</p>
                  <p className="font-semibold text-slate-800">
                    {errorDetail.machineName}
                  </p>
                </div>
                <div className="space-y-2! rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    {pT("reportColCategory")}
                  </p>
                  <p className="font-semibold text-slate-800">
                    {errorDetail.categoryName}
                  </p>
                </div>
              </div>

              <div className="space-y-2! rounded-lg bg-red-50 p-4">
                <p className="text-xs font-bold text-red-400">
                  {pT("colNote")}
                </p>
                <p className="whitespace-pre-wrap text-sm font-semibold text-red-700">
                  {errorDetail.note || EMPTY}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  {pT("imageSection")} ({errorImages.length})
                </p>
                {errorImagesLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                    {pT("loading")}
                  </div>
                ) : errorImages.length > 0 ? (
                  <div className="space-y-4!">
                    {IMAGE_TYPES.map((type) => {
                      const typeImages = errorImages.filter(
                        (img) => img.typeImage === type,
                      );
                      if (!typeImages.length) return null;

                      const typeLabel =
                        type === "Before"
                          ? pT("imageTypeBefore")
                          : type === "After"
                            ? pT("imageTypeAfter")
                            : pT("imageTypeEvidence");

                      const badgeClass =
                        type === "Before"
                          ? "bg-amber-100 text-amber-700"
                          : type === "After"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700";

                      return (
                        <div key={type} className="space-y-2!">
                          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                            >
                              {typeLabel}
                            </span>
                            <span className="text-slate-400">
                              ({typeImages.length})
                            </span>
                          </p>
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {typeImages.map((img, index) => (
                              <button
                                key={`${errorDetail.id}-${type}-img-${img.id}-${index}`}
                                type="button"
                                onClick={() =>
                                  openImage(
                                    img,
                                    `${errorDetail.questionCheck} - ${typeLabel}`,
                                    typeImages,
                                  )
                                }
                                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left"
                              >
                                <img
                                  src={img.url}
                                  alt={
                                    img.note || img.filename || "patrol error"
                                  }
                                  className="h-32 w-full object-cover"
                                />
                                {img.note ? (
                                  <p className="mb-0 truncate border-t border-slate-100 bg-white px-3 py-2 text-[11px] italic text-slate-600">
                                    {img.note}
                                  </p>
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
                    {pT("reportNoImageForSheet")}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setErrorDetail(null)}
                className="w-full rounded-lg bg-slate-600 p-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {pT("closeBtn")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EngDefectAnalyticsChart;
