/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FaArrowLeft,
  FaCheck,
  FaImage,
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
} from "react-icons/fa";
import MultiImageUpload from "../../components/files/MultiImageUpload";
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
  clearCurrentPatrolSession,
} from "../../redux/slices/patrolSlice";
import Modal from "../../components/general/Modal";
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
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-2 sm:p-4"
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

  const currentSheetId = Number(sheetId || 0);

  const sessionImages = useMemo(() => {
    if (!currentSheetId) return [];

    return (images || []).filter(
      (img) => Number(img.patrolSessionId) === currentSheetId,
    );
  }, [images, currentSheetId]);

  const [imagePreview, setImagePreview] = useState<PreviewCarouselState>(
    EMPTY_PREVIEW_CAROUSEL,
  );

  const openSessionImagePreview = useCallback(
    (startIndex: number) => {
      const items = sessionImages
        .map((img, index) => ({
          id: img.id || index,
          url: getImageUrl(img),
          title: `${pT("imageSection")} ${index + 1}`,
          note: img.note || "",
        }))
        .filter((item) => Boolean(item.url));

      if (!items.length) return;

      setImagePreview({
        open: true,
        items,
        index: Math.max(0, Math.min(startIndex, items.length - 1)),
        title: pT("imageSection") as string,
      });
    },
    [sessionImages],
  );

  const [formResults, setFormResults] = useState<
    Record<
      number,
      { id?: number; result: string; actualValue: string; note: string }
    >
  >({});
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
  type PendingUploadImage = {
    file: File;
    capturedAt: string;
  };

  const [noteModal, setNoteModal] = useState<{
    open: boolean;
    file: PendingUploadImage | null;
    queue: PendingUploadImage[];
  }>({ open: false, file: null, queue: [] });
  const [pendingNote, setPendingNote] = useState("");
  const [collapsedStages, setCollapsedStages] = useState<
    Record<string, boolean>
  >({});
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
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

  const buildPendingUploadImages = (files: File[]): PendingUploadImage[] => {
    const baseTime = Date.now();

    return files
      .filter((file) => file.type.startsWith("image/"))
      .map((file, index) => ({
        file,
        capturedAt: new Date(baseTime + index).toISOString(),
      }));
  };

  const openImageNoteModal = (files: File[]) => {
    if (!canEditImages || !sheetId) return;

    const uploadImages = buildPendingUploadImages(files);
    if (uploadImages.length === 0) return;

    setPendingNote("");
    setNoteModal({
      open: true,
      file: uploadImages[0],
      queue: uploadImages.slice(1),
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
   * - PQCLeader: upload/xoá hình sheet Pending
   *
   * Nếu muốn PQCLeader sửa hình cả Submitted thì đổi:
   * isPQCLeader && isPending
   * thành:
   * isPQCLeader && (isPending || isSubmitted)
   */
  const canEditImages =
    !isNew &&
    ((isPQC && isOwner && isPending) || (isPQCLeader && isPending));

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

  const handleImageUpload = async (
    _fieldName: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    openImageNoteModal(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const handleConfirmUpload = async () => {
    const currentUpload = noteModal.file;
    if (!currentUpload || !sheetId) return;

    try {
      const stampedFile = await drawTimestampOnImage(
        currentUpload.file,
        formatImageTimestamp(new Date(currentUpload.capturedAt)),
      );

      const formData = new FormData();
      formData.append("image", stampedFile);
      formData.append("note", pendingNote || "");

      await dispatch(
        uploadImage({ sessionId: Number(sheetId), formData }),
      ).unwrap();

      await dispatch(fetchImagesBySession(Number(sheetId)));

      const nextFile = noteModal.queue[0];

      if (nextFile) {
        setPendingNote("");
        setNoteModal({
          open: true,
          file: nextFile,
          queue: noteModal.queue.slice(1),
        });
      } else {
        setNoteModal({ open: false, file: null, queue: [] });
        toast.success(pT("msgUploadSuccess"));
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleRemoveImage = async (imgId: number) => {
    if (!canEditImages || !sheetId) return;

    try {
      await dispatch(deleteImage(imgId)).unwrap();
      await dispatch(fetchImagesBySession(Number(sheetId)));
      toast.success("Đã xoá hình thành công.");
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
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

  const activeStages = stages.filter(
    (s) => s.patrolType === formPatrolType && s.isActive,
  );

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

      <Modal
        open={noteModal.open}
        title={pT("imageNoteTitle")}
        onClose={() => setNoteModal({ open: false, file: null, queue: [] })}
        onSave={handleConfirmUpload}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            File:{" "}
            <span className="font-medium text-gray-700">
              {noteModal.file?.file.name}
            </span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {pT("imageNote")}{" "}
              <span className="text-gray-400 font-normal">
                {pT("optional")}
              </span>
            </label>
            <input
              type="text"
              value={pendingNote}
              onChange={(e) => setPendingNote(e.target.value)}
              placeholder={pT("placeholderImageNote")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
          </div>
        </div>
      </Modal>
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
              {activeStages.map((stage) => {
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
                                            className="p-4 flex flex-col gap-4 hover:bg-gray-50 transition-colors"
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

                                            {/* 4. Ghi chú */}
                                            <div className="flex flex-col gap-1">
                                              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                                {pT("colNote")}
                                              </span>
                                              <input
                                                type="text"
                                                value={
                                                  formResults[item.id]?.note ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  handleLocalChange(
                                                    item.id,
                                                    "note",
                                                    e.target.value,
                                                  )
                                                }
                                                onBlur={() =>
                                                  handleSyncResult(item.id)
                                                }
                                                disabled={!canEditResults}
                                                placeholder={pT(
                                                  "placeholderNote",
                                                )}
                                                className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-2 italic text-gray-600"
                                              />
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
                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">
                                              {pT("colResult")}
                                            </th>
                                            <th className="p-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-[25%]">
                                              {pT("colNote")}
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
                                                className="hover:bg-gray-50 transition-colors"
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
                                                  <input
                                                    type="text"
                                                    value={
                                                      formResults[item.id]
                                                        ?.note || ""
                                                    }
                                                    onChange={(e) =>
                                                      handleLocalChange(
                                                        item.id,
                                                        "note",
                                                        e.target.value,
                                                      )
                                                    }
                                                    onBlur={() =>
                                                      handleSyncResult(item.id)
                                                    }
                                                    disabled={!canEditResults}
                                                    placeholder={pT(
                                                      "placeholderNote",
                                                    )}
                                                    className="w-full text-xs border-b border-gray-300 focus:border-blue-500 outline-none py-1 italic"
                                                  />
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
            </div>

            <div className="bg-white shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                <FaImage className="text-blue-500" /> {pT("imageSection")} (
                {sessionImages.length})
              </h3>

              {canEditImages && (
                <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-bold text-white active:scale-[0.98]">
                    <div className="flex items-center justify-center gap-1">
                      <FaCamera size={10} />
                      <p className="text-sm font-medium mb-0">Chụp ảnh</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        openImageNoteModal(Array.from(e.target.files || []))
                      }
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-800 px-3 py-3 text-sm font-bold text-white active:scale-[0.98]">
                    <div className="flex items-center justify-center gap-1">
                      <FaUpload size={10} />
                      <p className="text-sm font-medium mb-0">
                        Tải từ thư viện
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        openImageNoteModal(Array.from(e.target.files || []))
                      }
                    />
                  </label>
                </div>
              )}

              {canEditImages && (
                <MultiImageUpload
                  label={pT("uploadLabel")}
                  fieldName="patrolImages"
                  images={sessionImages.map((img) => getImageUrl(img))}
                  notes={sessionImages.map((img) => img.note || "")}
                  onUpload={handleImageUpload}
                  onRemove={(idx) => handleRemoveImage(sessionImages[idx].id)}
                  onViewAll={() => {}}
                  onViewSingle={(url) => {
                    const index = sessionImages.findIndex(
                      (img) => getImageUrl(img) === url,
                    );
                    openSessionImagePreview(index >= 0 ? index : 0);
                  }}
                  maxImages={20}
                />
              )}

              {sessionImages.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    {sessionImages.map((img, index) => (
                      <div
                        key={img.id}
                        className="border border-gray-200 overflow-hidden flex flex-col relative group"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt="Current state"
                          className="w-full h-48 object-cover cursor-pointer bg-gray-100"
                          onClick={() => openSessionImagePreview(index)}
                        />
                        {img.note && (
                          <div className="text-xs text-gray-600 px-3 py-2 bg-gray-50 border-t border-gray-200 italic">
                            {img.note}
                          </div>
                        )}
                        {canEditImages && (
                          <button
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>

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
                        onClick={() => handleUpdateStatus("Submitted")}
                        disabled={loading}
                        className="flex-1! px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FaPen /> {pT("submitBtn")}
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
