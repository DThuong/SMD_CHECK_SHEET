import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export type PreviewCarouselItem = {
  id: string | number;
  url: string;
  title: string;
  note?: string;
};

export type PreviewCarouselState = {
  open: boolean;
  items: PreviewCarouselItem[];
  index: number;
  title: string;
};

export const EMPTY_PREVIEW_CAROUSEL: PreviewCarouselState = {
  open: false,
  items: [],
  index: 0,
  title: "",
};

export const ImagePreviewCarousel = React.memo(
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
  }
);
