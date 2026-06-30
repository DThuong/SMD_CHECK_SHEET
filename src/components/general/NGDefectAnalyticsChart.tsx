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
  fetchPatrolSessions,
  fetchStages,
  fetchCategories,
  fetchCheckLists,
  fetchLineAreas,
} from "../../redux/slices/patrolSlice";
import patrolApi from "../../redux/services/patrolApi";
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
  checkListId: number;
  stageName: string;
  categoryName: string;
  errorName: string;
  actualValue: string;
  note: string;
  checkAt: string;
  checkAtText: string;
  shift: ShiftType;
  images: PatrolImageView[];
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
  images: PatrolImageView[];
  imageCount: number;
  firstErrorName: string;
  stageSummary: string;
  categorySummary: string;
  hasImages: boolean;
}

interface PatrolImageView {
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
    typeImage: normalizeImageType(img?.typeImage || img?.type),
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

const NGDefectAnalyticsChart: React.FC<
  PatrolSharedProps & {
    compact?: boolean;
    type?: PatrolKind;
  }
> = ({ type, activeTab, compact, goToView, user }) => {
  const {
    sessions,
    stages,
    categories,
    checkLists,
    lineAreas,
    loading,
  } = useAppSelector((state: any) => state.patrol);

  const patrolType: PatrolKind = type || activeTab || "daily";

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
  const [errorImages, setErrorImages] = useState<PatrolImageView[]>([]);
  const [errorImagesLoading, setErrorImagesLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(0);
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
  const debouncedKeyword = useDebounce(keyword, 250);
  const debouncedFromDateTime = useDebounce(fromDateTime, 400);
  const debouncedToDateTime = useDebounce(toDateTime, 400);
  const dispatch = useAppDispatch();
  const bootstrapRequestedKeysRef = useRef(new Set<string>());
  const { t } = useTranslation("patrol");

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

  const sessionsReq = requestOnce("sessions", Boolean(sessions?.length), fetchPatrolSessions);
  requestOnce("stages", Boolean(stages?.length), fetchStages);
  requestOnce("categories", Boolean(categories?.length), fetchCategories);
  requestOnce("checkLists", Boolean(checkLists?.length), fetchCheckLists);
  requestOnce("lineAreas", Boolean(lineAreas?.length), fetchLineAreas);

  // Tắt trạng thái khởi tạo khi đã có sessions (cache) hoặc khi request sessions
  // vừa khởi tạo hoàn tất (kể cả khi rỗng) — giúp hiện spinner đúng lúc.
  if (sessions?.length) {
    setBooting(false);
  } else if (sessionsReq) {
    sessionsReq.finally(() => setBooting(false));
  }
}, [
  dispatch,
  sessions?.length,
  stages?.length,
  categories?.length,
  checkLists?.length,
  lineAreas?.length,
]);

  // An toàn: khi sessions đã có dữ liệu thì chắc chắn tắt trạng thái khởi tạo.
  useEffect(() => {
    if (sessions?.length) setBooting(false);
  }, [sessions?.length]);
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

  // /PatrolSession đã bỏ checkListResults => report tự tải toàn bộ results 1 lần
  // (không kèm ảnh) vào state cục bộ, tránh đụng state.patrol.checkListResults
  // vốn bị PatrolDetail ghi đè theo từng sheet.
  const [reportResults, setReportResults] = useState<any[]>([]);
  // Ảnh cho report: /CheckListResult (bulk) không kèm ảnh, nên tải ảnh theo từng
  // session NG bằng /Image/session/{id} (trả ảnh gắn theo checkListResultId +
  // typeImage). Gom lại để biết số lượng ảnh và tách loại Before/After/Evidence.
  const [reportImages, setReportImages] = useState<any[]>([]);
  const loadedImageSessionRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    let cancelled = false;
    patrolApi
      .get("/CheckListResult")
      .then((res) => {
        const d = res?.data;
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
        console.log("[Report] /CheckListResult count:", arr.length, arr[0]);
        if (!cancelled) setReportResults(arr);
      })
      .catch((err) => {
        console.error("[Report] /CheckListResult error:", err);
        if (!cancelled) setReportResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    console.log("[Report] sessions:", sessions?.length);
    console.log("[Report] FIRST SESSION OBJECT:", sessions?.[0]);
    console.log(
      "[Report] session.id values sample:",
      (sessions || []).slice(0, 5).map((s: any) => s?.id),
    );
  }, [sessions]);

  // DEBUG: xác định có NG không và ID có khớp giữa sessions và results không
  useEffect(() => {
    if (!reportResults.length) return;
    const ng = reportResults.filter(
      (r: any) => String(r?.result || "").trim().toUpperCase() === "NG",
    );
    const sessIds = new Set((sessions || []).map((s: any) => Number(s.id)));
    const ngInSessions = ng.filter((r: any) =>
      sessIds.has(Number(r?.patrolSessionId)),
    );
    console.log(
      "[Report] NG total:",
      ng.length,
      "| NG within loaded sessions:",
      ngInSessions.length,
      "| sample NG:",
      ng[0],
    );
    console.log(
      "[Report] session id sample:",
      [...sessIds].slice(0, 5),
      "| result sessionId sample:",
      [
        ...new Set(reportResults.map((r: any) => Number(r?.patrolSessionId))),
      ].slice(0, 5),
    );
  }, [reportResults, sessions]);

  // Ghép results theo patrolSessionId để mỗi sheet biết các câu hỏi NG của mình.
  const resultsBySession = useMemo<Map<number, any[]>>(() => {
    const map = new Map<number, any[]>();
    (reportResults || []).forEach((r: any) => {
      const sid = Number(
        r?.patrolSessionId ?? r?.PatrolSessionId ?? r?.patrolSession?.id ?? 0,
      );
      if (!sid) return;
      const arr = map.get(sid);
      if (arr) arr.push(r);
      else map.set(sid, [r]);
    });
    console.log("[Report] resultsBySession sheets:", map.size);
    return map;
  }, [reportResults]);

  // Map checkListResultId -> danh sách ảnh (đã build view + giữ typeImage).
  const imagesByResultId = useMemo<Map<number, PatrolImageView[]>>(() => {
    const map = new Map<number, PatrolImageView[]>();
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
    (resultId: number): PatrolImageView[] =>
      resultId ? imagesByResultId.get(resultId) || [] : [],
    [imagesByResultId],
  );

  // Toàn bộ ảnh của 1 sheet = gom ảnh của các câu hỏi NG trong sheet đó.
  const getSheetImages = useCallback(
    (record: SheetNGRecord): PatrolImageView[] => {
      const out: PatrolImageView[] = [];
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

  const getSessionImages = useCallback((session: any): PatrolImageView[] => {
    const collected: any[] = [];

    // Nguồn cũ: ảnh cấp session (giữ tương thích dữ liệu cũ)
    const legacy =
      (Array.isArray(session?.images) && session.images) ||
      (Array.isArray(session?.patrolImages) && session.patrolImages) ||
      (Array.isArray(session?.sessionImages) && session.sessionImages) ||
      (Array.isArray(session?.patrolSessionImages) &&
        session.patrolSessionImages) ||
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
      const line = lineMap.get(Number(session?.lineAreaId));
      return (
        session?.lineArea?.lineAreaName ||
        session?.lineAreaName ||
        session?.lineName ||
        line?.lineAreaName ||
        EMPTY
      );
    },
    [lineMap],
  );

  // allSheetRecords
const allSheetRecords = useMemo<SheetNGRecord[]>(() => {
  const records = (sessions || [])
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
          const nestedStage = nestedCategory?.stage;

          const checkList =
            checkListMap.get(Number(result?.checkListId)) ||
            (nestedCheckList
              ? {
                  id: Number(nestedCheckList.id || result?.checkListId || 0),
                  categoryId: Number(nestedCheckList.categoryId || 0),
                  questionCheck: nestedCheckList.questionCheck || "",
                  spec: nestedCheckList.spec || "",
                  specType: nestedCheckList.specType,
                  isActive: nestedCheckList.isActive,
                }
              : undefined);

          const category =
            (checkList ? categoryMap.get(Number(checkList.categoryId)) : undefined) ||
            (nestedCategory
              ? {
                  id: Number(nestedCategory.id || 0),
                  stageId: Number(nestedCategory.stageId || 0),
                  name: nestedCategory.name || "",
                  isActive: nestedCategory.isActive,
                }
              : undefined);

          const stage =
            (category ? stageMap.get(Number(category.stageId)) : undefined) ||
            (nestedStage
              ? {
                  id: Number(nestedStage.id || 0),
                  name: nestedStage.name || "",
                  patrolType: String(nestedStage.patrolType || ""),
                  isActive: nestedStage.isActive,
                }
              : undefined);

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
            // Ảnh gắn theo từng câu hỏi (API mới: checkListResult.images).
            // Nếu payload đã nhúng ảnh thì dùng luôn; nếu không thì để rỗng và
            // tải khi mở modal (xem effect bên dưới).
            images: Array.isArray(result?.images)
              ? result.images
                  .map(buildImageView)
                  .filter((img: PatrolImageView) => Boolean(img.url))
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
        lineName,
        status: session?.status || EMPTY,
        detectedBy: session?.fullName || EMPTY,
        note: sheetNote || EMPTY,
        shift: sheetShift,
        // ✅ bỏ shiftText — tính lúc render
        errors,
        images: sessionImages,
        imageCount: sessionImages.length || fallbackImageCount,
        firstErrorName: errors[0]?.errorName || EMPTY,
        stageSummary: uniqText(errors.map((x) => x.stageName)),
        categorySummary: uniqText(errors.map((x) => x.categoryName)),
        hasImages: sessionImages.length > 0 || fallbackImageCount > 0,
      } as SheetNGRecord;
    })
    .filter(Boolean) as SheetNGRecord[];

  console.log(
    `[Report] allSheetRecords (NG sheets, type=${patrolType}):`,
    records.length,
    "| dates:",
    records.map((r) => r.date).slice(0, 10),
  );
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
  stageMap,
  // ✅ KHÔNG có pT
]);

const getShiftLabel = useCallback(
  (shift: ShiftType) => getShiftText(shift, pT),
  [pT],
);

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
      debouncedKeyword,
      shiftFilter,
      debouncedFromDateTime,
      debouncedToDateTime,
  ]);

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
        const res = await patrolApi.get(`/Image/session/${id}`);
        const arr = Array.isArray(res?.data) ? res.data : [];
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
  }, [rangeRecords]);

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

    // Lấy ảnh theo từng loại (Before/After/Evidence) cho đúng câu hỏi này, đồng
    // thời gắn nhãn typeImage để modal tách nhóm đúng loại.
    Promise.all(
      IMAGE_TYPES.map((type) =>
        patrolApi
          .get(`/Image/checklistresult/${resultId}/type/${type}`)
          .then((res) =>
            (Array.isArray(res.data) ? res.data : []).map((img: any) => ({
              ...img,
              typeImage: type,
            })),
          )
          .catch(() => []),
      ),
    )
      .then((lists) => {
        if (cancelled) return;
        const merged = ([] as any[])
          .concat(...lists)
          .map(buildImageView)
          .filter((img: PatrolImageView) => Boolean(img.url));
        setErrorImages(merged);
      })
      .finally(() => {
        if (!cancelled) setErrorImagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [errorDetail, imagesByResultId]);

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
    return activeRecords.slice(startIndex, startIndex + TREND_DETAIL_PAGE_SIZE);
  }, [activeRecords, drillPoint, trendDetailPage]);

  const trendDetailPageCount = useMemo(() => {
    if (!drillPoint) return 0;
    return Math.ceil(activeRecords.length / TREND_DETAIL_PAGE_SIZE);
  }, [activeRecords.length, drillPoint]);

  const trendSelectedLabel = useMemo(() => {
    if (!drillPoint) return "";
    return `${fmtDateKey(drillPoint.dateKey)} - ${getShiftLabel(drillPoint.shift)}`;
  }, [drillPoint, getShiftLabel]);

  const totalSheetNG = activeRecords.length;
  const totalErrorNG = activeErrors.length;
  const topLine = lineData[0]?.name || EMPTY;
  // Sheet có hình = sheet mà câu hỏi NG của nó có ít nhất 1 ảnh (tính theo ảnh
  // đã tải về, gắn theo checkListResultId).
  const imageLinkedCount = useMemo(
    () => activeRecords.filter((record) => getSheetImages(record).length > 0).length,
    [activeRecords, getSheetImages],
  );

  const openImage = useCallback(
    (img: PatrolImageView, title: string, imageList?: PatrolImageView[]) => {
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

    const oldRaw = localStorage.getItem("patrolReportReturnState");

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
      "patrolReportReturnState",
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

      localStorage.setItem("patrolReportReturnState", JSON.stringify(state));
      goToView?.("detail", String(row.sessionId), patrolType);
    },
    [buildReportState, goToView, patrolType],
  );

  const handleShiftDotClick = useCallback((payload: any, shift: ShiftType) => {
    if (!payload?.dateKey) return;

    // Không đổi shiftFilter ở đây. Nếu đang chọn "Cả 2 ca", cả 2 line phải luôn hiển thị.
    // Dot chỉ dùng để drill xuống danh sách sheet NG của đúng ngày + đúng ca.
    setDrillPoint((prev) => {
      const isSame = prev?.dateKey === payload.dateKey && prev?.shift === shift;

      return isSame ? null : { dateKey: payload.dateKey, shift };
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

    localStorage.removeItem("patrolReportReturnState");
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
    const raw = localStorage.getItem("patrolReportReturnState");
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
            ? `patrol-report-trend-row-${Number(saved.highlightId)}`
            : `patrol-report-row-${Number(saved.highlightId)}`;

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
        localStorage.removeItem("patrolReportReturnState");
      }, 5000);

      return () => {
        window.clearInterval(timer);
        window.clearTimeout(clearTimer);
      };
    } catch {
      localStorage.removeItem("patrolReportReturnState");
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
                      {pT("reportSelectedSheets", {
                        label: trendSelectedLabel,
                      })}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {pT("reportShowingTrendSheets", {
                        pageSize: TREND_DETAIL_PAGE_SIZE,
                        count: activeRecords.length,
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
                          id={`patrol-report-trend-row-${row.sessionId}`}
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
                          <td className="px-3 py-3 text-slate-600">
                            <span
                              className="block max-w-40 truncate"
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
                            colSpan={8}
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
                      id={`patrol-report-trend-row-${row.sessionId}`}
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
                          <p className="mt-1 text-sm font-bold text-red-600">
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
          <div id="patrol-report-detail-table" className="space-y-4!">
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
                        {row.stageSummary}
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
                        "patrol-report-detail-table",
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
                  Patrol Sheet ID #{selectedRecord.sessionId}
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
                  {errorDetail.errorName}
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
                    {errorDetail.stageName}
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
                                    `${errorDetail.errorName} - ${typeLabel}`,
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

export default NGDefectAnalyticsChart;
