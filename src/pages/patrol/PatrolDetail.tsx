/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FaArrowLeft,
  FaCheck,
  FaPen,
  FaTrash,
  FaPlus,
  FaUpload,
  FaHistory,
  FaUndo,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import type { PatrolSharedProps } from "./types";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  createPatrolSession,
  updatePatrolSessionStatus,
  rejectPatrolSessionStatus,
  fetchStages,
  fetchCategories,
  fetchCheckLists,
  fetchLineAreas,
  createCheckListResult,
  updateCheckListResult,
  uploadImage,
  deleteImage,
  fetchImagesBySession,
  fetchPatrolSessionById,
  fetchStatusHistoryBySession,
  type StatusHistory,
  type ImageModel,
  type CheckList,
  clearCurrentPatrolSession,
} from "../../redux/slices/patrolSlice";
import {
  clearPatrolNavState,
  readPatrolNavState,
  savePatrolDashboardState,
  savePatrolNavState,
} from "../../utils/patrolNavState";
import { FaCamera } from "react-icons/fa6";

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
        className="fixed inset-0 z-99999 flex items-center justify-center bg-black/85 p-2 sm:p-4"
        onClick={onClose}
      >
        <div
          className="relative flex h-full max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-950 px-3 py-3 text-white md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold md:text-base">
                {currentItem.title || preview.title}
              </p>
              <p className="text-xs text-white/60">
                {currentIndex + 1}/{total} • Zoom {Math.round(scale * 100)}% • Rotate {((rotation % 360) + 360) % 360}°
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

type ImgTypeKey = "Before" | "After" | "Evidence";

type QuestionImageModalProps = {
  open: boolean;
  item: CheckList | null;
  canEditResults: boolean;
  canEditImages: boolean;
  uploadingType: ImgTypeKey | null;
  note: string;
  imagesByType: Record<ImgTypeKey, ImageModel[]>;
  imageTypes: readonly ImgTypeKey[];
  imageTypeLabel: (type: ImgTypeKey) => string;
  getImageUrl: (img: ImageModel) => string;
  pT: (key: string, options?: any) => any;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onNoteBlur: () => void;
  onPickFiles: (files: File[], type: ImgTypeKey) => void;
  onPreview: (imgs: ImageModel[], index: number, title: string) => void;
  onRemove: (imgId: number) => void;
};

const TYPE_ACCENT: Record<ImgTypeKey, string> = {
  Before: "border-amber-200 bg-amber-50",
  After: "border-emerald-200 bg-emerald-50",
  Evidence: "border-blue-200 bg-blue-50",
};

const TYPE_BADGE: Record<ImgTypeKey, string> = {
  Before: "bg-amber-100 text-amber-700",
  After: "bg-emerald-100 text-emerald-700",
  Evidence: "bg-blue-100 text-blue-700",
};

const QuestionImageModal = React.memo(
  ({
    open,
    item,
    canEditResults,
    canEditImages,
    uploadingType,
    note,
    imagesByType,
    imageTypes,
    imageTypeLabel,
    getImageUrl,
    pT,
    onClose,
    onNoteChange,
    onNoteBlur,
    onPickFiles,
    onPreview,
    onRemove,
  }: QuestionImageModalProps) => {
    useEffect(() => {
      if (!open) return;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKey);
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", handleKey);
      };
    }, [open, onClose]);

    if (!open || !item) return null;

    const totalImages = imageTypes.reduce(
      (sum, type) => sum + (imagesByType[type]?.length || 0),
      0,
    );

    return (
      <div
        className="fixed inset-0 z-9999 flex items-end justify-center bg-black/50 px-3 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gray-800 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                {pT("detailModalTitle")}
              </p>
              <h3 className="mt-0.5 text-sm font-bold leading-snug sm:text-base wrap-break-words">
                {item.questionCheck}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="close"
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-4! overflow-y-auto p-4!">
            {/* Ghi chú */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                {pT("colNote")}
              </label>
              {canEditResults ? (
                <textarea
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  onBlur={onNoteBlur}
                  rows={2}
                  placeholder={pT("placeholderNote")}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm italic text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="min-h-10 whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm italic text-gray-600">
                  {note || pT("noNote")}
                </p>
              )}
            </div>

            {/* Hình ảnh theo loại */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {pT("imageSection")} ({totalImages})
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {imageTypes.map((type) => {
                  const imgs = imagesByType[type] || [];
                  const isUploading = uploadingType === type;
                  return (
                    <div
                      key={type}
                      className={`flex flex-col rounded-xl border ${TYPE_ACCENT[type]} p-3`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TYPE_BADGE[type]}`}
                        >
                          {imageTypeLabel(type)}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {imgs.length}
                        </span>
                      </div>

                      {canEditImages && (
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-2 text-[11px] font-bold text-white ${
                              isUploading
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer active:scale-[0.98]"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <FaCamera size={10} />
                              <span>{pT("captureBtn")}</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => {
                                onPickFiles(
                                  Array.from(e.target.files || []),
                                  type,
                                );
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <label
                            className={`flex items-center justify-center gap-1 rounded-lg bg-slate-700 px-2 py-2 text-[11px] font-bold text-white ${
                              isUploading
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer active:scale-[0.98]"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <FaUpload size={10} />
                              <span>{pT("uploadShortBtn")}</span>
                            </div>

                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => {
                                onPickFiles(
                                  Array.from(e.target.files || []),
                                  type,
                                );
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {isUploading && (
                        <p className="mb-2 text-center text-[11px] font-semibold italic text-blue-600">
                          {pT("uploadingLabel")}
                        </p>
                      )}

                      {imgs.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {imgs.map((img, idx) => (
                            <div
                              key={img.id}
                              className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
                            >
                              <div className="relative h-28 sm:h-32">
                                <img
                                  src={getImageUrl(img)}
                                  alt={imageTypeLabel(type)}
                                  loading="lazy"
                                  className="h-full w-full cursor-pointer bg-gray-100 object-cover"
                                  onClick={() =>
                                    onPreview(imgs, idx, imageTypeLabel(type))
                                  }
                                />
                                {canEditImages && (
                                  <button
                                    type="button"
                                    onClick={() => onRemove(img.id)}
                                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                                    aria-label="delete"
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                )}
                              </div>
                              {img.note ? (
                                <p className="mb-0 border-t border-gray-100 bg-gray-50 px-1 py-1 text-[10px] italic leading-snug text-gray-600 wrap-break-words">
                                  {img.note}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-3 text-center text-[11px] italic text-gray-400">
                          {pT("noImageYet")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-gray-600 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700"
            >
              {pT("closeBtn")}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

const PatrolDetail: React.FC<PatrolSharedProps> = ({
  user,
  goToView,
}) => {
  const { t } = useTranslation("patrol");
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const sheetId = searchParams.get("id");
  const navigate = useNavigate();
  const isNew = sheetId === "new";

  // Force Vietnamese for PQC role
  const pT = (key: string, options?: any) => {
    if (user?.role === "PQC") return t(key, { ...options, lng: "vi" }) as any;
    return t(key, options) as any;
  };

  const {
    stages,
    categories,
    currentSession,
    checkLists,
    lineAreas,
    checkListResults,
    images,
    loading,
    statusHistories,
  } = useAppSelector((state) => state.patrol);
  const getImageUrl = (img: ImageModel) => img.imageUrl || "";

  // Các loại ảnh gắn theo từng câu hỏi
  const IMAGE_TYPES = ["Before", "After", "Evidence"] as const;
  type ImgType = (typeof IMAGE_TYPES)[number];

  const normalizeImageType = (value?: string): ImgType => {
    const v = String(value || "").toLowerCase();
    if (v === "before") return "Before";
    if (v === "after") return "After";
    return "Evidence";
  };

  const imageTypeLabel = (type: ImgType) => {
    if (type === "Before") return pT("imageTypeBefore");
    if (type === "After") return pT("imageTypeAfter");
    return pT("imageTypeEvidence");
  };

  // Map checkListResultId -> danh sách ảnh (API mới gắn ảnh theo câu hỏi)
  const imagesByResultId = useMemo(() => {
    const map: Record<number, ImageModel[]> = {};
    (images || []).forEach((img) => {
      const rid = Number(img.checkListResultId);
      if (!rid) return;
      if (!map[rid]) map[rid] = [];
      map[rid].push(img);
    });
    return map;
  }, [images]);

  const [imagePreview, setImagePreview] = useState<PreviewCarouselState>(
    EMPTY_PREVIEW_CAROUSEL,
  );

  const openImagesPreview = useCallback(
    (imgs: ImageModel[], startIndex: number, title: string) => {
      const items = imgs
        .map((img, index) => ({
          id: img.id || index,
          url: getImageUrl(img),
          title: `${title} ${index + 1}`,
          note: img.note || "",
        }))
        .filter((item) => Boolean(item.url));

      if (!items.length) return;

      setImagePreview({
        open: true,
        items,
        index: Math.max(0, Math.min(startIndex, items.length - 1)),
        title,
      });
    },
    [],
  );

  const [formResults, setFormResults] = useState<
    Record<
      number,
      { id?: number; result: string; actualValue: string; note: string }
    >
  >({});
  // Ref đồng bộ formResults để dùng trong các callback bất đồng bộ (ensureResultId, getResultId)
  const formResultsRef = useRef(formResults);
  useEffect(() => {
    formResultsRef.current = formResults;
  }, [formResults]);
  // Lấy result id của 1 câu hỏi (nếu đã có kết quả lưu trên server)
  const getResultId = useCallback(
    (checkListId: number) => formResultsRef.current[checkListId]?.id,
    [],
  );
  const [formLineId, setFormLineId] = useState<number>(0);
  const [formPatrolType, setFormPatrolType] = useState<string>(() => {
    if (isNew) {
      const saved = readPatrolNavState();
      return saved?.type === "weekly" ? "7" : "1";
    }
    return "1";
  }); // "1": Daily, "7": Weekly
  const [isLineSelectOpen, setIsLineSelectOpen] = useState(false);
  const lineSelectRef = useRef<HTMLDivElement>(null);

  // Modal xem/quản lý ghi chú + hình ảnh theo từng câu hỏi
  const [qModal, setQModal] = useState<{
    open: boolean;
    checkListId: number | null;
  }>({ open: false, checkListId: null });
  // Loại ảnh đang được upload (để hiển thị trạng thái "đang tải" ngay trong modal)
  const [uploadingType, setUploadingType] = useState<ImgType | null>(null);
  // Modal nhập ghi chú cho từng tấm hình trước khi upload
  const [imgNoteModal, setImgNoteModal] = useState<{
    open: boolean;
    checkListId: number | null;
    typeImage: ImgType;
    queue: File[];
    note: string;
    index: number;
    total: number;
    uploading: boolean;
  }>({
    open: false,
    checkListId: null,
    typeImage: "Evidence",
    queue: [],
    note: "",
    index: 0,
    total: 0,
    uploading: false,
  });
  const [collapsedStages, setCollapsedStages] = useState<
    Record<string, boolean>
  >({});
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  // Chỉ số công đoạn (stage) đang xem — dùng cho điều hướng next/prev/select.
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  // Ref tới thanh điều hướng công đoạn để cuộn tới khi đổi trang.
  const stageNavRef = useRef<HTMLDivElement>(null);

  // === Cảnh báo câu hỏi chưa kiểm tra khi PQC ký phiếu ===
  // Bật sau lần đầu PQC bấm ký mà còn câu chưa check (để không gây nhiễu trước đó).
  const [signAttempted, setSignAttempted] = useState(false);
  // Câu hỏi đang được tô vàng nổi bật (đi từng câu một).
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(
    null,
  );
  // Yêu cầu cuộn tới 1 câu hỏi sau khi đã chuyển đúng công đoạn/mở nhóm.
  // token đảm bảo effect chạy lại kể cả khi cùng id.
  const [pendingScroll, setPendingScroll] = useState<{
    id: number;
    token: number;
  } | null>(null);
  // Giữ timer tô sáng để dọn dẹp, tránh các lần highlight đè lên nhau.
  const highlightTimerRef = useRef<number | null>(null);
  const session = isNew ? null : currentSession;

  useEffect(() => {
    if (stages.length === 0) {
      dispatch(fetchStages());
    }

    if (categories.length === 0) {
      dispatch(fetchCategories());
    }

    if (checkLists.length === 0) {
      dispatch(fetchCheckLists());
    }

    if (lineAreas.length === 0) {
      dispatch(fetchLineAreas());
    }
  }, [
    dispatch,
    stages.length,
    categories.length,
    checkLists.length,
    lineAreas.length,
  ]);

  useEffect(() => {
    if (isNew || !sheetId) return;

    const id = Number(sheetId);

    dispatch(fetchPatrolSessionById(id));
    dispatch(fetchImagesBySession(id));
    dispatch(fetchStatusHistoryBySession(id));

    return () => {
      dispatch(clearCurrentPatrolSession());
    };
  }, [dispatch, sheetId, isNew]);

  useEffect(() => {
    if (session) {
      setTimeout(() => {
        setFormLineId(session.lineAreaId);
        setFormPatrolType(session.patrolType);
      }, 0);
    }
  }, [session]);

  useEffect(() => {
    const resultsMap: Record<
      number,
      { id?: number; result: string; actualValue: string; note: string }
    > = {};
    checkListResults.forEach((r) => {
      resultsMap[r.checkListId] = {
        id: r.id,
        result: r.result,
        actualValue: r.actualValue,
        note: r.note,
      };
    });
    setTimeout(() => {
      setFormResults(resultsMap);
    }, 0);
  }, [checkListResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        lineSelectRef.current &&
        !lineSelectRef.current.contains(e.target as Node)
      ) {
        setIsLineSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedRole = String(user?.role || "").trim().toLowerCase();

  const isPQC = normalizedRole === "pqc";
  const isPQCLeader = normalizedRole === "pqcleader";

  const formatImageTimestamp = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");

    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Không thể đọc ảnh để đóng timestamp."));
      };

      image.src = objectUrl;
    });
  };

  const drawTimestampOnImage = async (
    file: File,
    timestampText: string,
  ): Promise<File> => {
    const image = await loadImageFromFile(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Không thể khởi tạo canvas.");
    }

    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const fontSize = Math.max(22, Math.round(canvas.width * 0.028));
    const paddingX = Math.round(fontSize * 0.7);
    const paddingY = Math.round(fontSize * 0.45);
    const margin = Math.round(fontSize * 0.8);

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";

    const textWidth = ctx.measureText(timestampText).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;
    const x = Math.max(margin, canvas.width - boxWidth - margin);
    const y = Math.max(margin, canvas.height - boxHeight - margin);

    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(x, y, boxWidth, boxHeight);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.06));
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(timestampText, x + paddingX, y + paddingY);

    const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const stampedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Không thể tạo ảnh sau khi đóng timestamp."));
        },
        mimeType,
        0.92,
      );
    });

    return new File([stampedBlob], file.name, {
      type: stampedBlob.type || mimeType,
      lastModified: Date.now(),
    });
  };

  const isOwner =
    !!session && !!user?.id && Number(session.accountId) === Number(user.id);

  const isPending = session?.status === "Pending";
const isSubmitted = session?.status === "Submitted";

/**
 * Quyền sửa checklist:
 * - PQC: chỉ sửa phiếu Pending của chính mình
 * - PQCLeader: sửa được Pending + Submitted
 */
const canEditResults =
  isNew ||
  (isPQC && isOwner && isPending) ||
  (isPQCLeader && (isPending || isSubmitted));

  /**
   * Quyền sửa hình:
   * - PQC: chỉ upload/xoá hình phiếu Pending của chính mình
   * - PQCLeader: upload/xoá hình của BẤT KỲ sheet nào (do bất kỳ PQC tạo)
   *   khi đang ở trạng thái Pending hoặc Submitted (lúc đi duyệt).
   */
  const canEditImages =
    !isNew &&
    ((isPQC && isOwner && isPending) ||
      (isPQCLeader && (isPending || isSubmitted)));

  const canApprove = isSubmitted && isPQCLeader;

  // Cập nhật UI cục bộ ngay lập tức
  const handleLocalChange = (
    checkListId: number,
    field: "result" | "actualValue" | "note",
    value: string,
  ) => {
    setFormResults((prev) => ({
      ...prev,
      [checkListId]: {
        ...prev[checkListId],
        [field]: value,
      },
    }));
  };

  // Đồng bộ với Server
  const handleSyncResult = async (checkListId: number) => {
    if (!canEditResults || isNew) return;

    const data = formResults[checkListId];
    if (!data) return;

    if (data.id) {
      await dispatch(
        updateCheckListResult({
          id: data.id,
          data: {
            result: data.result,
            actualValue: data.actualValue,
            note: data.note || "",
            checkAt: new Date().toISOString(),
          },
        }),
      ).unwrap();
    } else {
      await dispatch(
        createCheckListResult({
          patrolSessionId: Number(sheetId),
          checkListId,
          result: data.result,
          actualValue: data.actualValue,
          note: data.note || "",
          checkAt: new Date().toISOString(),
        }),
      ).unwrap();
    }
  };

  // Xử lý khi nhấn OK/NG (Cập nhật UI + Sync luôn)
  const handleResultButtonClick = async (
    checkListId: number,
    value: string,
  ) => {
    if (!canEditResults) return;
    handleLocalChange(checkListId, "result", value);
    if (!isNew) {
      // Đợi local state cập nhật xong hoặc truyền giá trị trực tiếp vào sync
      const current = formResults[checkListId];
      if (current?.id) {
        await dispatch(
          updateCheckListResult({
            id: current.id,
            data: {
              result: value,
              actualValue: current.actualValue,
              note: current.note || "",
              checkAt: new Date().toISOString(),
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createCheckListResult({
            patrolSessionId: Number(sheetId),
            checkListId,
            result: value,
            actualValue: current?.actualValue || "",
            note: current?.note || "",
            checkAt: new Date().toISOString(),
          }),
        ).unwrap();
      }
    }
  };

  // Đảm bảo câu hỏi đã có checkListResult (tạo mới nếu chưa) để gắn ảnh theo result.
  const ensureResultId = async (checkListId: number): Promise<number | null> => {
    const existing = formResultsRef.current[checkListId];
    if (existing?.id) return existing.id;
    if (isNew || !sheetId) return null;

    try {
      const created = await dispatch(
        createCheckListResult({
          patrolSessionId: Number(sheetId),
          checkListId,
          result: existing?.result || "",
          actualValue: existing?.actualValue || "",
          note: existing?.note || "",
          checkAt: new Date().toISOString(),
        }),
      ).unwrap();

      setFormResults((prev) => ({
        ...prev,
        [checkListId]: {
          ...prev[checkListId],
          id: created.id,
          result: created.result ?? prev[checkListId]?.result ?? "",
          actualValue:
            created.actualValue ?? prev[checkListId]?.actualValue ?? "",
          note: created.note ?? prev[checkListId]?.note ?? "",
        },
      }));

      return created.id;
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
      return null;
    }
  };

  // Loại ảnh đã xác định theo cột (Trước / Sau / Minh chứng). Mở modal nhập
  // ghi chú cho TỪNG tấm hình trước khi upload (ghi chú gửi kèm trong request).
  const handleQuestionUpload = (
    checkListId: number,
    typeImage: ImgType,
    files: File[],
  ) => {
    if (!canEditImages || !sheetId || !checkListId) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setImgNoteModal({
      open: true,
      checkListId,
      typeImage,
      queue: imageFiles,
      note: "",
      index: 0,
      total: imageFiles.length,
      uploading: false,
    });
  };

  // Xác nhận ghi chú & upload tấm hình hiện tại; nếu còn ảnh trong hàng đợi thì
  // tiếp tục hỏi ghi chú cho tấm kế tiếp.
  const handleConfirmImageNote = async () => {
    const { checkListId, typeImage, queue, note } = imgNoteModal;
    const file = queue[0];
    if (!file || !checkListId || !sheetId) return;

    setImgNoteModal((prev) => ({ ...prev, uploading: true }));
    setUploadingType(typeImage);
    try {
      const resultId = await ensureResultId(checkListId);
      if (!resultId) {
        toast.error(pT("errorOccurred"));
        setImgNoteModal((prev) => ({ ...prev, open: false, uploading: false }));
        return;
      }

      const stampedFile = await drawTimestampOnImage(
        file,
        formatImageTimestamp(new Date()),
      );

      const formData = new FormData();
      formData.append("image", stampedFile);
      formData.append("note", note || "");

      await dispatch(
        uploadImage({ checkListResultId: resultId, typeImage, formData }),
      ).unwrap();

      await dispatch(fetchImagesBySession(Number(sheetId)));

      const rest = queue.slice(1);
      if (rest.length) {
        setImgNoteModal((prev) => ({
          ...prev,
          queue: rest,
          note: "",
          index: prev.index + 1,
          uploading: false,
        }));
      } else {
        setImgNoteModal((prev) => ({
          ...prev,
          open: false,
          queue: [],
          note: "",
          uploading: false,
        }));
        toast.success(pT("msgUploadSuccess"));
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
      setImgNoteModal((prev) => ({ ...prev, uploading: false }));
    } finally {
      setUploadingType(null);
    }
  };

  const cancelImageNote = () =>
    setImgNoteModal((prev) => ({
      ...prev,
      open: false,
      queue: [],
      note: "",
      uploading: false,
    }));

  const handleRemoveImage = async (imgId: number) => {
    if (!canEditImages || !sheetId) return;

    try {
      await dispatch(deleteImage(imgId)).unwrap();
      await dispatch(fetchImagesBySession(Number(sheetId)));
      toast.success(pT("msgDeleteImageSuccess"));
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  // Lấy ảnh của 1 câu hỏi (theo result id) và nhóm theo loại ảnh.
  const getQuestionImages = (checkListId: number): ImageModel[] => {
    const rid = getResultId(checkListId);
    if (!rid) return [];
    return imagesByResultId[rid] || [];
  };

  const getQuestionImagesByType = (
    checkListId: number,
  ): Record<ImgType, ImageModel[]> => {
    const imgs = getQuestionImages(checkListId);
    return {
      Before: imgs.filter((i) => normalizeImageType(i.typeImage) === "Before"),
      After: imgs.filter((i) => normalizeImageType(i.typeImage) === "After"),
      Evidence: imgs.filter(
        (i) => normalizeImageType(i.typeImage) === "Evidence",
      ),
    };
  };

  const handleCreateSession = async (status: string) => {
    if (!formLineId) {
      toast.error(pT("selectLineError"));
      return;
    }
    try {
      const res = await dispatch(
        createPatrolSession({
          patrolType: formPatrolType,
          lineAreaId: formLineId,
          status: status,
          note: "",
        }),
      ).unwrap();
      toast.success(pT("createSuccess"));
      goToView("detail", res.id.toString());
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err));
    }
  };

  const extractErrorMessage = (err: any): string => {
    if (typeof err === "string") return err;
    if (err?.message) return err.message;
    if (err?.detail) return err.detail;
    return "Đã xảy ra lỗi, vui lòng thử lại.";
  };

  const handleUpdateStatus = async (status: string) => {
    if (!sheetId) return;
    try {
      await dispatch(
        updatePatrolSessionStatus({ id: Number(sheetId), status }),
      ).unwrap();
      toast.success(pT("statusUpdated"));
      // Reload current sheet
      dispatch(fetchPatrolSessionById(Number(sheetId)));
      dispatch(fetchStatusHistoryBySession(Number(sheetId)));
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 3000 });
    }
  };

  const handleRejectStatus = async () => {
    if (!sheetId) return;
    try {
      await dispatch(
        rejectPatrolSessionStatus({ id: Number(sheetId) }),
      ).unwrap();
      toast.success(pT("statusRejected"));
      // Reload current sheet
      dispatch(fetchPatrolSessionById(Number(sheetId)));
      dispatch(fetchStatusHistoryBySession(Number(sheetId)));
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 3000 });
    }
  };

  const isFreshReturnState = (savedAt?: number) => {
    if (!savedAt) return false;
    return Date.now() - Number(savedAt) < 30 * 60 * 1000;
  };

  const handleBackToSource = () => {
    if (!sheetId) {
      goToView("list");
      return;
    }

    const currentId = Number(sheetId);

    const rawReportState = localStorage.getItem("patrolReportReturnState");

    if (rawReportState) {
      try {
        const saved = JSON.parse(rawReportState);

        const isReportState =
          saved?.source === "report" &&
          Number(saved.highlightId) === currentId &&
          saved.returnPath &&
          isFreshReturnState(saved.savedAt);

        if (isReportState) {
          navigate(saved.returnPath, {
            state: {
              from: "sheetDetail",
              reportState: {
                sheetId: saved.highlightId,
                type: saved.type || "daily",
                reportTab: saved.reportTab || "table",
                returnMode: saved.returnMode,
                drillPoint: saved.drillPoint,
                trendDetailPage: saved.trendDetailPage,
                detailPage: saved.detailPage,
                rangeMode: saved.rangeMode,
                offset: saved.offset,
                statusMode: saved.statusMode,
                shiftFilter: saved.shiftFilter,
                keyword: saved.keyword,
                fromDateTime: saved.fromDateTime,
                toDateTime: saved.toDateTime,
              },
            },
          });
          return;
        }

        localStorage.removeItem("patrolReportReturnState");
      } catch {
        localStorage.removeItem("patrolReportReturnState");
      }
    }

    const saved = readPatrolNavState();
    const source = saved?.source;
    const savedType = saved?.type === "weekly" ? "weekly" : "daily";

    if (
      source === "dashboard" &&
      saved?.dashboardReturnPath &&
      isFreshReturnState(saved.savedAt)
    ) {
      savePatrolDashboardState({
        date: saved.dashboardDate || "",
        shift: saved.dashboardShift,
        page: saved.page || 0,
        highlightId: currentId,
      });

      clearPatrolNavState();

      navigate(saved.dashboardReturnPath, {
        state: {
          from: "patrolDetail",
          dashboardState: {
            sheetId: currentId,
            date: saved.dashboardDate,
            fullDate: saved.dashboardDate,
            shift: saved.dashboardShift,
            detailTablePage: saved.page || 0,
          },
        },
      });

      return;
    }

    savePatrolNavState({
      ...(saved || {}),
      source: source || "list",
      type: savedType,
      page: saved?.page || 0,
      highlightId: currentId,
      filter: saved?.filter,
      savedAt: Date.now(),
    });

    goToView("list", null, savedType);
  };

  const activeStages = useMemo(
    () => stages.filter((s) => s.patrolType === formPatrolType && s.isActive),
    [stages, formPatrolType],
  );

  // Đánh dấu công đoạn nào đang chứa câu hỏi NG để highlight trên thanh điều hướng.
  const stageNgMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    activeStages.forEach((stage) => {
      const categoryIds = categories
        .filter((c) => c.stageId === stage.id)
        .map((c) => c.id);
      map[stage.id] = checkLists.some(
        (cl) =>
          categoryIds.includes(cl.categoryId) &&
          formResults[cl.id]?.result === "NG",
      );
    });
    return map;
  }, [activeStages, categories, checkLists, formResults]);

  // 1 câu hỏi được coi là "đã kiểm tra" khi: dạng input có giá trị, dạng OK/NG
  // đã chọn OK hoặc NG.
  const isQuestionAnswered = useCallback(
    (item: { id: number; specType?: string }) => {
      const r = formResults[item.id];
      if (!r) return false;
      if (item.specType === "input") return (r.actualValue || "").trim() !== "";
      return r.result === "OK" || r.result === "NG";
    },
    [formResults],
  );

  // Danh sách câu hỏi theo đúng thứ tự hiển thị (stage -> category -> checklist),
  // kèm vị trí công đoạn để có thể nhảy tới đúng trang. Chỉ phụ thuộc cấu trúc
  // (không phụ thuộc formResults) nên không tính lại khi user tích từng câu.
  const orderedQuestions = useMemo(() => {
    const out: {
      id: number;
      specType?: string;
      stageIndex: number;
      stageId: number;
      categoryId: number;
    }[] = [];
    activeStages.forEach((stage, stageIndex) => {
      categories
        .filter((c) => c.stageId === stage.id)
        .forEach((cat) => {
          checkLists
            .filter((cl) => cl.categoryId === cat.id)
            .forEach((cl) => {
              out.push({
                id: cl.id,
                specType: cl.specType,
                stageIndex,
                stageId: stage.id,
                categoryId: cat.id,
              });
            });
        });
    });
    return out;
  }, [activeStages, categories, checkLists]);

  const questionMeta = useMemo(() => {
    const m = new Map<
      number,
      { stageIndex: number; stageId: number; categoryId: number }
    >();
    orderedQuestions.forEach((q) =>
      m.set(q.id, {
        stageIndex: q.stageIndex,
        stageId: q.stageId,
        categoryId: q.categoryId,
      }),
    );
    return m;
  }, [orderedQuestions]);

  // Các câu chưa kiểm tra, giữ đúng thứ tự để "đi từng câu một".
  const uncheckedQuestionIds = useMemo(
    () =>
      orderedQuestions.filter((q) => !isQuestionAnswered(q)).map((q) => q.id),
    [orderedQuestions, isQuestionAnswered],
  );
  const uncheckedSet = useMemo(
    () => new Set(uncheckedQuestionIds),
    [uncheckedQuestionIds],
  );

  // Số câu chưa kiểm tra theo từng công đoạn (để chấm dấu trên thanh điều hướng).
  const stageUncheckedMap = useMemo(() => {
    const map: Record<number, number> = {};
    orderedQuestions.forEach((q) => {
      if (uncheckedSet.has(q.id))
        map[q.stageId] = (map[q.stageId] || 0) + 1;
    });
    return map;
  }, [orderedQuestions, uncheckedSet]);

  // Nhảy tới đúng câu hỏi: chuyển công đoạn, mở nhóm/công đoạn nếu đang thu gọn,
  // rồi đặt yêu cầu cuộn (effect bên dưới xử lý sau khi DOM render xong).
  const jumpToQuestion = useCallback(
    (checkListId: number) => {
      const meta = questionMeta.get(checkListId);
      if (!meta) return;
      setCurrentStageIndex(meta.stageIndex);
      setCollapsedStages((prev) =>
        prev[String(meta.stageId)]
          ? { ...prev, [String(meta.stageId)]: false }
          : prev,
      );
      setCollapsedCategories((prev) =>
        prev[String(meta.categoryId)]
          ? { ...prev, [String(meta.categoryId)]: false }
          : prev,
      );
      setPendingScroll({ id: checkListId, token: Date.now() });
    },
    [questionMeta],
  );

  // Cuộn + tô sáng câu hỏi sau khi công đoạn/nhóm đã render. Dùng 2 frame để
  // chắc chắn DOM đã cập nhật, và token để mỗi yêu cầu chạy độc lập (không đè).
  useEffect(() => {
    if (!pendingScroll) return;
    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        const els = Array.from(
          document.querySelectorAll(`[data-qid="${pendingScroll.id}"]`),
        ) as HTMLElement[];
        // Chỉ lấy phần tử đang hiển thị (mobile/desktop dùng 2 layout khác nhau).
        const el = els.find((e) => e.offsetParent !== null) || els[0];
        if (el)
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightQuestionId(pendingScroll.id);
        if (highlightTimerRef.current)
          window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = window.setTimeout(() => {
          setHighlightQuestionId((cur) =>
            cur === pendingScroll.id ? null : cur,
          );
          highlightTimerRef.current = null;
        }, 2800);
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [pendingScroll]);

  // Dọn timer khi unmount.
  useEffect(
    () => () => {
      if (highlightTimerRef.current)
        window.clearTimeout(highlightTimerRef.current);
    },
    [],
  );

  // Class tô sáng cho 1 dòng câu hỏi: vàng đậm nếu đang được nhắm tới, vàng nhạt
  // nếu là câu chưa kiểm tra (sau khi PQC đã bấm ký lần đầu).
  const getQuestionHighlightClass = useCallback(
    (id: number) => {
      if (highlightQuestionId === id)
        return " bg-yellow-100 shadow-[inset_0_0_0_2px_#facc15] transition-colors duration-300";
      if (signAttempted && uncheckedSet.has(id)) return " bg-amber-50";
      return "";
    },
    [highlightQuestionId, signAttempted, uncheckedSet],
  );

  // PQC ký phiếu: nếu còn câu chưa kiểm tra thì chặn gửi, nhảy tới câu chưa
  // check kế tiếp (đi vòng) và tô vàng để PQC kiểm tra từng câu, tránh bỏ sót.
  const handleSignSheet = useCallback(() => {
    const list = uncheckedQuestionIds;
    if (list.length === 0) {
      handleUpdateStatus("Submitted");
      return;
    }
    setSignAttempted(true);
    const curPos =
      highlightQuestionId != null ? list.indexOf(highlightQuestionId) : -1;
    const nextId = list[(curPos + 1) % list.length];
    jumpToQuestion(nextId);
    toast.error(pT("signUncheckedWarning", { remaining: list.length }), {
      duration: 2500,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uncheckedQuestionIds, highlightQuestionId, jumpToQuestion, pT]);

  const currentStage = activeStages[currentStageIndex] || null;
  const stagesToRender = currentStage ? [currentStage] : [];

  // Pagination rút gọn: trang đầu, trang cuối, current ± 1, chèn "..." khi cách quãng.
  const visibleStagePages = useMemo(() => {
    const total = activeStages.length;
    if (total === 0) return [] as (number | "ellipsis")[];
    const wanted = new Set<number>([0, total - 1, currentStageIndex]);
    if (currentStageIndex - 1 >= 0) wanted.add(currentStageIndex - 1);
    if (currentStageIndex + 1 < total) wanted.add(currentStageIndex + 1);
    const sorted = [...wanted]
      .filter((n) => n >= 0 && n < total)
      .sort((a, b) => a - b);
    const out: (number | "ellipsis")[] = [];
    let prev = -1;
    for (const idx of sorted) {
      if (prev !== -1 && idx - prev > 1) out.push("ellipsis");
      out.push(idx);
      prev = idx;
    }
    return out;
  }, [activeStages.length, currentStageIndex]);

  // Đổi loại phiếu (ngày/tuần) => quay về công đoạn đầu.
  useEffect(() => {
    setCurrentStageIndex(0);
  }, [formPatrolType]);

  // Giữ index hợp lệ khi số lượng công đoạn thay đổi.
  useEffect(() => {
    if (currentStageIndex > activeStages.length - 1) {
      setCurrentStageIndex(0);
    }
  }, [activeStages.length]);

  // Cuộn tới thanh điều hướng công đoạn (đầu nội dung công đoạn).
  const scrollToStageNav = () => {
    requestAnimationFrame(() => {
      stageNavRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const goToStage = (index: number) => {
    const clamped = Math.max(0, Math.min(activeStages.length - 1, index));
    setCurrentStageIndex(clamped);
    scrollToStageNav();
  };

  const goPrevStage = () => goToStage(currentStageIndex - 1);
  const goNextStage = () => goToStage(currentStageIndex + 1);

  // Render 1 chip công đoạn (dùng chung cho bản rút gọn mobile và đầy đủ desktop).
  const renderStageChip = (i: number) => {
    const stage = activeStages[i];
    if (!stage) return null;
    const isActive = i === currentStageIndex;
    const hasNG = stageNgMap[stage.id];
    // Còn câu chưa kiểm tra ở công đoạn này (chỉ báo sau khi PQC đã bấm ký).
    const hasUnchecked = signAttempted && (stageUncheckedMap[stage.id] || 0) > 0;
    return (
      <button
        key={stage.id}
        type="button"
        onClick={() => goToStage(i)}
        title={stage.name}
        className={`relative shrink-0 min-w-9 h-9 px-2 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${
          isActive
            ? "bg-gray-800 text-white border-gray-800"
            : hasNG
              ? "bg-red-50 text-red-700 border-red-300"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        } ${hasNG && !isActive ? "ring-1 ring-red-200" : ""} ${hasUnchecked && !isActive ? "ring-1 ring-amber-300" : ""}`}
      >
        {i + 1}
        {hasNG ? " ⚠" : ""}
        {hasUnchecked ? (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
        ) : null}
      </button>
    );
  };

  const toggleStage = (stageId: string) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
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
  return (
    <>
      <ImagePreviewCarousel
        preview={imagePreview}
        onClose={() => setImagePreview(EMPTY_PREVIEW_CAROUSEL)}
      />

      <QuestionImageModal
        open={qModal.open}
        item={
          qModal.checkListId
            ? checkLists.find((c) => c.id === qModal.checkListId) || null
            : null
        }
        canEditResults={canEditResults}
        canEditImages={canEditImages}
        uploadingType={uploadingType}
        note={
          qModal.checkListId
            ? formResults[qModal.checkListId]?.note || ""
            : ""
        }
        imagesByType={
          qModal.checkListId
            ? getQuestionImagesByType(qModal.checkListId)
            : { Before: [], After: [], Evidence: [] }
        }
        imageTypes={IMAGE_TYPES}
        imageTypeLabel={imageTypeLabel}
        getImageUrl={getImageUrl}
        pT={pT}
        onClose={() => setQModal({ open: false, checkListId: null })}
        onNoteChange={(value) => {
          if (qModal.checkListId)
            handleLocalChange(qModal.checkListId, "note", value);
        }}
        onNoteBlur={() => {
          if (qModal.checkListId) handleSyncResult(qModal.checkListId);
        }}
        onPickFiles={(files, type) => {
          if (qModal.checkListId)
            handleQuestionUpload(qModal.checkListId, type, files);
        }}
        onPreview={(imgs, index, title) =>
          openImagesPreview(imgs, index, title)
        }
        onRemove={(imgId) => handleRemoveImage(imgId)}
      />

      {/* Modal nhập ghi chú cho từng tấm hình (đặt trên QuestionImageModal) */}
      {imgNoteModal.open && (
        <div
          className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
          onClick={imgNoteModal.uploading ? undefined : cancelImageNote}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-base font-bold text-gray-800">
                {pT("imageNoteTitle")}
              </h3>
              <button
                type="button"
                onClick={cancelImageNote}
                disabled={imgNoteModal.uploading}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                aria-label="close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TYPE_BADGE[imgNoteModal.typeImage]}`}
                >
                  {imageTypeLabel(imgNoteModal.typeImage)}
                </span>
                {imgNoteModal.total > 1 && (
                  <span className="text-xs font-semibold text-gray-400">
                    {imgNoteModal.index + 1}/{imgNoteModal.total}
                  </span>
                )}
              </div>

              <p className="truncate text-sm text-gray-500">
                File:{" "}
                <span className="font-medium text-gray-700">
                  {imgNoteModal.queue[0]?.name}
                </span>
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {pT("imageNote")}{" "}
                  <span className="font-normal text-gray-400">
                    {pT("optional")}
                  </span>
                </label>
                <input
                  type="text"
                  value={imgNoteModal.note}
                  onChange={(e) =>
                    setImgNoteModal((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !imgNoteModal.uploading)
                      handleConfirmImageNote();
                  }}
                  placeholder={pT("placeholderImageNote")}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-3">
              <button
                type="button"
                onClick={handleConfirmImageNote}
                disabled={imgNoteModal.uploading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {imgNoteModal.uploading
                  ? pT("uploadingLabel")
                  : pT("saveUploadBtn")}
              </button>
              <button
                type="button"
                onClick={cancelImageNote}
                disabled={imgNoteModal.uploading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {pT("cancelBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in space-y-4! mt-6! pb-20!">
        <div className="flex flex-row items-center justify-between mb-4 bg-white py-3 px-3 shadow-sm border border-gray-200 gap-3">
          <div className="flex items-center justify-start gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {isNew ? pT("createBtn") : `${pT("detailTitle")} #${sheetId}`}
            </h2>
          </div>
          {!isNew && session && (
            <span
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(session.status)}`}
            >
              {getStatusLabel(session.status)}
            </span>
          )}
        </div>

        {isNew ? (
          <div className="bg-white shadow-sm border border-gray-200 p-4 space-y-4!">
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                {pT("selectType")} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormPatrolType("1")}
                  className={`flex-1 py-3 border font-bold transition-all ${formPatrolType === "1" ? "bg-gray-600 text-white border-gray-600 shadow-sm" : "bg-white border-gray-200 text-gray-500"}`}
                >
                  {pT("dailyTab")}
                </button>
                <button
                  onClick={() => setFormPatrolType("7")}
                  className={`flex-1 py-3 border font-bold transition-all ${formPatrolType === "7" ? "bg-gray-600 text-white border-gray-600 shadow-sm" : "bg-white border-gray-200 text-gray-500"}`}
                >
                  {pT("weeklyTab")}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                {pT("colLine")} <span className="text-red-500">*</span>
              </label>
              <div className="relative w-full" ref={lineSelectRef}>
                <button
                  type="button"
                  onClick={() => setIsLineSelectOpen(!isLineSelectOpen)}
                  className="w-full border border-gray-200 px-4 py-2 bg-gray-50 text-left flex justify-between items-center focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                >
                  <span
                    className={formLineId ? "text-gray-800" : "text-gray-400"}
                  >
                    {formLineId
                      ? lineAreas.find((l) => l.id === formLineId)?.lineAreaName
                      : `-- ${pT("colLine")} --`}
                  </span>
                  <svg
                    className={`fill-current h-4 w-4 text-gray-500 transition-transform ${isLineSelectOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </button>

                {isLineSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-lg z-50 overflow-hidden">
                    {lineAreas.map((line) => (
                      <div
                        key={line.id}
                        className={`px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${formLineId === line.id ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700"}`}
                        onClick={() => {
                          setFormLineId(line.id);
                          setIsLineSelectOpen(false);
                        }}
                      >
                        {line.lineAreaName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleCreateSession("Pending")}
              disabled={loading || !formLineId}
              className="my-4! cursor-pointer w-full bg-blue-700 text-white py-3 font-bold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50"
            >
              <FaPlus /> {pT("createBtn")}
            </button>
          </div>
        ) : (
          <>
            {/* Status History */}
            {!isNew && statusHistories.length > 0 && (
              <div className="bg-white shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                  <FaHistory className="text-gray-600 text-sm" />{" "}
                  {pT("signHistory")}
                </h3>
                <div className="space-y-2!">
                  {statusHistories.map((h: StatusHistory) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-3 py-3 px-3 bg-gray-50 border border-gray-100 rounded text-sm min-h-14"
                    >
                      {/* Badge status */}
                      <span
                        className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                          h.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : h.status === "Submitted"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {getStatusLabel(h.status)}
                      </span>
                      {/* Tên + role + thời gian xếp dọc */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-gray-800 font-semibold truncate">
                          {h.fullName}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-gray-400 text-xs">
                            ({h.role})
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(h.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-4!">
              {/* Thanh điều hướng công đoạn: next/prev + chọn nhanh + highlight NG */}
              {activeStages.length > 0 && (
                <div
                  ref={stageNavRef}
                  className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 space-y-2 scroll-mt-4"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goPrevStage}
                      disabled={currentStageIndex === 0}
                      className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FaChevronLeft size={12} />
                      <span>{pT("prevPage")}</span>
                    </button>

                    <select
                      value={currentStageIndex}
                      onChange={(e) => goToStage(Number(e.target.value))}
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {activeStages.map((s, i) => (
                        <option key={s.id} value={i}>
                          {`${i + 1}/${activeStages.length} - ${s.name}${stageNgMap[s.id] ? "  ⚠ NG" : ""}`}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={goNextStage}
                      disabled={currentStageIndex >= activeStages.length - 1}
                      className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{pT("nextPage")}</span>
                      <FaChevronRight size={12} />
                    </button>
                  </div>

                  {/* Mobile: pagination rút gọn 1 … 7 8 9 … 12 */}
                  <div className="flex md:hidden items-center justify-center gap-1.5 flex-wrap mt-4!">
                    {visibleStagePages.map((item, idx) =>
                      item === "ellipsis" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-gray-400 text-sm select-none"
                        >
                          …
                        </span>
                      ) : (
                        renderStageChip(item)
                      ),
                    )}
                  </div>

                  {/* Desktop: hiển thị đầy đủ tất cả công đoạn */}
                  <div className="hidden md:flex items-center justify-center gap-1.5 flex-wrap mt-4!">
                    {activeStages.map((_, i) => renderStageChip(i))}
                  </div>
                </div>
              )}

              {stagesToRender.map((stage) => {
                const stageKey = stage.id.toString();
                const isStageCollapsed = !!collapsedStages[stageKey];

                return (
                  <div
                    key={stage.id}
                    className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-lg"
                  >
                    <button
                      type="button"
                      onClick={() => toggleStage(stageKey)}
                      className="w-full bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-3 text-left hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-white/80 shrink-0">
                          {isStageCollapsed ? (
                            <FaChevronRight size={14} />
                          ) : (
                            <FaChevronDown size={14} />
                          )}
                        </span>
                        <h3 className="font-bold text-lg text-white mb-0 wrap-break-words">
                          {stage.name}
                        </h3>
                      </div>
                    </button>

                    {!isStageCollapsed && (
                      <div className="p-3 sm:p-4 space-y-4!">
                        {categories
                          .filter((c) => c.stageId === stage.id)
                          .map((cat) => {
                            const categoryKey = cat.id.toString();
                            const isCategoryCollapsed =
                              !!collapsedCategories[categoryKey];

                            return (
                              <div
                                key={cat.id}
                                className="border border-gray-200 overflow-hidden rounded-lg"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(categoryKey)}
                                  className="w-full bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-3 text-left hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-gray-500 shrink-0">
                                      {isCategoryCollapsed ? (
                                        <FaChevronRight size={13} />
                                      ) : (
                                        <FaChevronDown size={13} />
                                      )}
                                    </span>
                                    <h4 className="font-semibold text-gray-700 mb-0 wrap-break-words">
                                      {cat.name}
                                    </h4>
                                  </div>
                                </button>

                                {!isCategoryCollapsed && (
                                  <>
                                    <div className="md:hidden divide-y divide-gray-100">
                                      {checkLists
                                        .filter(
                                          (cl) => cl.categoryId === cat.id,
                                        )
                                        .map((item) => (
                                          <div
                                            key={item.id}
                                            data-qid={item.id}
                                            className={`p-4 flex flex-col gap-4 hover:bg-gray-50 transition-colors${getQuestionHighlightClass(item.id)}`}
                                          >
                                            {/* 1. Câu hỏi */}
                                            <div>
                                              <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                                {item.questionCheck}
                                              </p>
                                            </div>

                                            {/* 2. Tiêu chuẩn */}
                                            <div className="flex items-center gap-2">
                                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {pT("colStandard")}:
                                              </span>
                                              <div
                                                className={`text-xs px-2 py-1 rounded border font-medium italic w-fit ${item.spec ? "text-blue-700 bg-blue-50 border-blue-100" : "text-gray-400 bg-gray-50 border-gray-200"}`}
                                              >
                                                {item.spec || pT("noStandard")}
                                              </div>
                                            </div>

                                            {/* 3. Kết quả */}
                                            <div className="flex flex-col gap-2">
                                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                                {pT("colResult")}
                                              </span>
                                              {item.specType !== "input" ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                  <button
                                                    onClick={() =>
                                                      handleResultButtonClick(
                                                        item.id,
                                                        "OK",
                                                      )
                                                    }
                                                    disabled={!canEditResults}
                                                    className={`py-3 text-sm font-bold border transition-all rounded-lg flex items-center justify-center ${
                                                      formResults[item.id]
                                                        ?.result === "OK"
                                                        ? "bg-green-600 text-white border-green-600 shadow-md scale-[1.02]"
                                                        : "bg-white text-gray-500 border-gray-300 active:bg-gray-100"
                                                    }`}
                                                  >
                                                    OK
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleResultButtonClick(
                                                        item.id,
                                                        "NG",
                                                      )
                                                    }
                                                    disabled={!canEditResults}
                                                    className={`py-3 text-sm font-bold border transition-all rounded-lg flex items-center justify-center ${
                                                      formResults[item.id]
                                                        ?.result === "NG"
                                                        ? "bg-red-600 text-white border-red-600 shadow-md scale-[1.02]"
                                                        : "bg-white text-gray-500 border-gray-300 active:bg-gray-100"
                                                    }`}
                                                  >
                                                    NG
                                                  </button>
                                                </div>
                                              ) : (
                                                <input
                                                  type="text"
                                                  value={
                                                    formResults[item.id]
                                                      ?.actualValue || ""
                                                  }
                                                  onChange={(e) =>
                                                    handleLocalChange(
                                                      item.id,
                                                      "actualValue",
                                                      e.target.value,
                                                    )
                                                  }
                                                  onBlur={() =>
                                                    handleSyncResult(item.id)
                                                  }
                                                  disabled={!canEditResults}
                                                  placeholder={pT("typeInput")}
                                                  className="w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none p-3 bg-gray-50"
                                                />
                                              )}
                                            </div>

                                            {/* 4. Hành động (xem ghi chú + hình ảnh) */}
                                            <div className="flex flex-col gap-1">
                                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                                {pT("colAction")}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setQModal({
                                                    open: true,
                                                    checkListId: item.id,
                                                  })
                                                }
                                                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-700 active:bg-gray-100"
                                              >
                                                {canEditImages ? (
                                                  <FaCamera className="text-blue-600" />
                                                ) : (
                                                  <FaEye className="text-blue-600" />
                                                )}
                                                <span>
                                                  {canEditImages
                                                    ? pT("manageImageBtn")
                                                    : pT("viewNoteImageBtn")}
                                                </span>
                                                {getQuestionImages(item.id)
                                                  .length > 0 && (
                                                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                                                    {
                                                      getQuestionImages(item.id)
                                                        .length
                                                    }
                                                  </span>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[40%]">
                                              {pT("colQuestion")}
                                            </th>
                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[15%]">
                                              {pT("colStandard")}
                                            </th>
                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[25%]">
                                              {pT("colResult")}
                                            </th>
                                            <th className="p-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">
                                              {pT("colAction")}
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {checkLists
                                            .filter(
                                              (cl) => cl.categoryId === cat.id,
                                            )
                                            .map((item) => (
                                              <tr
                                                key={item.id}
                                                data-qid={item.id}
                                                className={`hover:bg-gray-50 transition-colors${getQuestionHighlightClass(item.id)}`}
                                              >
                                                <td className="p-3 text-sm text-gray-800">
                                                  {item.questionCheck}
                                                </td>
                                                <td className="p-3 text-sm text-gray-600">
                                                  <span
                                                    className={`px-2 py-1 rounded text-xs border font-medium ${item.spec ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-400 border-gray-200"}`}
                                                  >
                                                    {item.spec ||
                                                      pT("noStandard")}
                                                  </span>
                                                </td>
                                                <td className="p-3">
                                                  {item.specType !== "input" ? (
                                                    <div className="flex gap-1.5">
                                                      <button
                                                        onClick={() =>
                                                          handleResultButtonClick(
                                                            item.id,
                                                            "OK",
                                                          )
                                                        }
                                                        disabled={
                                                          !canEditResults
                                                        }
                                                        className={`px-3 py-1 text-xs font-bold border transition-all rounded ${
                                                          formResults[item.id]
                                                            ?.result === "OK"
                                                            ? "bg-green-600 text-white border-green-600 shadow-sm"
                                                            : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                      >
                                                        OK
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleResultButtonClick(
                                                            item.id,
                                                            "NG",
                                                          )
                                                        }
                                                        disabled={
                                                          !canEditResults
                                                        }
                                                        className={`px-3 py-1 text-xs font-bold border transition-all rounded ${
                                                          formResults[item.id]
                                                            ?.result === "NG"
                                                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                                                            : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                      >
                                                        NG
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <input
                                                      type="text"
                                                      value={
                                                        formResults[item.id]
                                                          ?.actualValue || ""
                                                      }
                                                      onChange={(e) =>
                                                        handleLocalChange(
                                                          item.id,
                                                          "actualValue",
                                                          e.target.value,
                                                        )
                                                      }
                                                      onBlur={() =>
                                                        handleSyncResult(
                                                          item.id,
                                                        )
                                                      }
                                                      disabled={!canEditResults}
                                                      placeholder={pT(
                                                        "typeInput",
                                                      )}
                                                      className="w-full text-xs border-b border-gray-300 focus:border-blue-500 outline-none py-1"
                                                    />
                                                  )}
                                                </td>
                                                <td className="p-3">
                                                  <div className="flex items-center justify-center">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        setQModal({
                                                          open: true,
                                                          checkListId: item.id,
                                                        })
                                                      }
                                                      title={
                                                        canEditImages
                                                          ? pT("manageImageBtn")
                                                          : pT(
                                                              "viewNoteImageBtn",
                                                            )
                                                      }
                                                      className="relative inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                                    >
                                                      {canEditImages ? (
                                                        <FaCamera className="text-blue-600" />
                                                      ) : (
                                                        <FaEye className="text-blue-600" />
                                                      )}
                                                      <span className="hidden lg:inline">
                                                        {canEditImages
                                                          ? pT("manageImageBtn")
                                                          : pT(
                                                              "viewNoteImageBtn",
                                                            )}
                                                      </span>
                                                      {getQuestionImages(
                                                        item.id,
                                                      ).length > 0 && (
                                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                                          {
                                                            getQuestionImages(
                                                              item.id,
                                                            ).length
                                                          }
                                                        </span>
                                                      )}
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Điều hướng cuối công đoạn: Trước / Sau + tự cuộn lên đầu */}
              {activeStages.length > 0 && currentStage && (
                <div className="flex items-center gap-2 bg-white shadow-sm border border-gray-200 rounded-lg p-3">
                  <button
                    type="button"
                    onClick={goPrevStage}
                    disabled={currentStageIndex === 0}
                    className="flex flex-1 items-center justify-center gap-1 px-3 py-3 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft size={12} /> {pT("prevPage")}
                  </button>
                  <span className="shrink-0 text-xs font-semibold text-gray-500 whitespace-nowrap">
                    {currentStageIndex + 1}/{activeStages.length}
                  </span>
                  <button
                    type="button"
                    onClick={goNextStage}
                    disabled={currentStageIndex >= activeStages.length - 1}
                    className="flex flex-1 items-center justify-center gap-1 px-3 py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pT("nextPage")} <FaChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Ảnh minh chứng đã chuyển sang quản lý theo từng câu hỏi
                (xem/Upload trong modal mở từ cột "Hành động"). */}

            {/* Action Bar */}

            {!isNew && (
              <div className="patrol-action-bar fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 px-4 py-3">
                <div className="flex flex-row gap-3 w-full">
                  {/* Back — luôn hiển thị */}
                  <button
                    onClick={handleBackToSource}
                    className="flex-1! px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaArrowLeft /> {pT("backBtn") || "Quay lại"}
                  </button>

                  {/* Gửi phiếu */}
                  {canEditResults &&
                    session?.status === "Pending" &&
                    user?.role === "PQC" && (
                      <button
                        onClick={handleSignSheet}
                        disabled={loading}
                        className="flex-1! px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FaPen /> {pT("submitBtn")}
                        {signAttempted && uncheckedQuestionIds.length > 0 ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-amber-900">
                            {uncheckedQuestionIds.length}
                          </span>
                        ) : null}
                      </button>
                    )}

                  {/* Duyệt */}
                  {canApprove && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus("Approved")}
                        disabled={loading}
                        className="flex-1! px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FaCheck /> {pT("approveBtn")}
                      </button>
                      <button
                        onClick={handleRejectStatus}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FaUndo /> {pT("rejectBtn")}
                      </button>
                    </>
                  )}

                  {/* Không thể thao tác */}
                  {!canEditResults && !canApprove && (
                    <div className="flex-1! px-6 py-3 bg-gray-100 text-gray-500 font-semibold text-sm flex items-center justify-center gap-2 border border-gray-200">
                      🔒{" "}
                      {session?.status === "Approved"
                        ? pT("statusApproved")
                        : pT("statusSubmitted")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PatrolDetail;
