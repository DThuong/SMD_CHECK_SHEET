/* eslint-disable react-hooks/set-state-in-effect */
// File: ImagePreviewModal.tsx
import { IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { MdZoomIn, MdZoomOut, MdRefresh, MdRotateLeft, MdRotateRight } from "react-icons/md";
import { normalizeImageUrl, IMAGE_WIDTH } from "../../utils/imageUrl";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | string[];
  onClose: () => void;
  title?: string;
  initialIndex?: number;
}

/** Số lần tự thử lại trước khi hiện nút bấm thử lại thủ công. */
const MAX_AUTO_RETRY = 2;

/**
 * Sau bấy nhiêu ms mà ảnh chưa load xong thì coi như request bị treo.
 *
 * ĐÂY LÀ CHỐT CHẶN QUAN TRỌNG NHẤT của file này. Thẻ <img> KHÔNG bắn onError khi
 * request bị treo — nó chỉ bắn khi server trả lỗi hoặc kết nối đứt hẳn. Request
 * nằm chờ trong hàng đợi của trình duyệt thì thẻ img im lặng vĩnh viễn, và vì
 * nền modal màu đen nên người dùng chỉ thấy một khung ĐEN XÌ, không spinner,
 * không thông báo, không cách nào thoát ngoài F5 cả trang.
 */
const STALL_TIMEOUT_MS = 12_000;

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const SCALE_STEP = 0.25;

const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))));

const ImagePreviewModal = ({
  isOpen,
  imageUrl,
  onClose,
  title,
  initialIndex = 0,
}: ImagePreviewModalProps) => {
  // Chuẩn hoá URL MỘT LẦN theo prop, không gọi lại normalizeImageUrl ở mỗi render
  // (trước đây mỗi lần kéo chuột là tính lại cho toàn bộ thumbnail).
  // Ba danh sách URL cho ba mục đích khác nhau:
  //   previewImages — bản 800px, hiện NGAY (gallery đã tải sẵn nên có cache)
  //   fullImages    — bản 1600px, tải ngầm rồi thay vào cho nét
  //   thumbImages   — bản 200px cho dải thumbnail 64x64
  //
  // TRƯỚC ĐÂY cả hai đều trỏ vào ẢNH GỐC. Một dải 5 thumbnail là 5 request nặng
  // ~1.8 MB chạy song song, chiếm gần hết 6 khe kết nối của host, đẩy request
  // ảnh chính xuống cuối hàng đợi. Nay dải thumbnail chỉ còn ~40 KB cho cả 5 tấm.
  const rawUrls = useMemo(() => {
    const list = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
    return list.filter(Boolean);
  }, [imageUrl]);

  /**
   * Bản 800px — ĐÚNG bản mà gallery của sheet đã tải, nên gần như luôn có sẵn
   * trong cache trình duyệt. Đây là ảnh hiện ra NGAY khi mở modal.
   */
  const previewImages = useMemo(
    () => rawUrls.map((url) => normalizeImageUrl(url, IMAGE_WIDTH.gallery)),
    [rawUrls],
  );

  /** Bản 1600px — tải ngầm phía sau rồi mới thay vào, để xem nét khi phóng to. */
  const fullImages = useMemo(
    () => rawUrls.map((url) => normalizeImageUrl(url, IMAGE_WIDTH.full)),
    [rawUrls],
  );

  const thumbImages = useMemo(
    () => rawUrls.map((url) => normalizeImageUrl(url, IMAGE_WIDTH.thumb)),
    [rawUrls],
  );

  const totalImages = rawUrls.length;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  /**
   * Trạng thái của bản nét cao: idle = đang tải ngầm, done = đã thay vào,
   * failed = tải không được (cứ giữ bản 800px, KHÔNG báo lỗi cho người dùng).
   */
  const [hiRes, setHiRes] = useState<"idle" | "done" | "failed">("idle");

  /**
   * Kích thước THẬT của bản 800px, chốt lại ngay khi nó tải xong.
   *
   * NGUYÊN NHÂN BUG "xem hình nháy một cái rồi tự resize": thẻ img chỉ có
   * `max-w-full max-h-full`, nghĩa là KHUNG của nó do kích thước pixel thật của
   * tấm ảnh quyết định. Bản 800px và bản 1600px có kích thước thật khác nhau,
   * nên đúng lúc thay ảnh là khung bị tính lại -> ảnh nhảy sang cỡ khác ngay
   * trước mắt người dùng.
   *
   * Chốt max-width/max-height theo bản 800px và KHÔNG cập nhật lại khi bản
   * 1600px vào, nên bản nét cao được vẽ vừa khít đúng cái khung cũ: y nguyên vị
   * trí, y nguyên kích thước, chỉ nét hơn.
   */
  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);
  /**
   * Giữ đối tượng Image đã nạp sẵn để trình duyệt không thu hồi bitmap vừa giải
   * mã — nhờ vậy lúc thay src là vẽ được ngay, không nháy một khung trống.
   */
  const hiResImgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Vị trí kéo (pan) giữ trong ref, KHÔNG giữ trong state.
   *
   * TRƯỚC ĐÂY onMouseMove gọi setPosition -> mỗi lần nhích chuột là React render
   * lại toàn bộ modal (kể cả map lại danh sách thumbnail và tạo lại object style).
   * Ảnh AOI cỡ lớn cộng với vài chục render mỗi giây là nguyên nhân kéo ảnh bị
   * giật trên máy trạm yếu. Nay chỉ ghi thẳng transform vào DOM trong rAF.
   */
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, pointerId: -1, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const rafRef = useRef<number | null>(null);
  // Mirror của scale/rotation để applyTransform đọc được mà không cần vào deps.
  const scaleRef = useRef(1);
  const rotationRef = useRef(0);

  /**
   * ẢNH ĐANG HIỂN THỊ: mặc định là bản 800px, đổi sang 1600px khi bản nét cao
   * đã tải xong hoàn toàn.
   *
   * TRƯỚC ĐÂY modal xin thẳng bản 1600px. Bản này KHÁC url với bản 800px mà
   * gallery đã tải, nên mỗi lần mở modal là một request mới toanh: server phải
   * resize lại từ file gốc 1.8 MB, và nếu hàng đợi ảnh đang tắc thì người dùng
   * ngồi nhìn khung đen cho tới lúc quá 12 giây rồi báo lỗi. Nay bản 800px lấy
   * từ cache nên ảnh hiện gần như tức thì, còn bản nét cao tới lúc nào thay lúc
   * đó — hỏng cũng không sao vì đã có ảnh để xem.
   *
   * Thêm _r khi thử lại để chắc chắn tạo request MỚI, không dùng lại request
   * đang treo hay bản lỗi trong cache.
   */
  const src = useMemo(() => {
    const list = hiRes === "done" ? fullImages : previewImages;
    const base = list[currentIndex] ?? list[0] ?? "";
    if (!base || attempt === 0) return base;
    return `${base}${base.includes("?") ? "&" : "?"}_r=${attempt}`;
  }, [previewImages, fullImages, hiRes, currentIndex, attempt]);

  const applyTransform = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const { x, y } = panRef.current;
    // translate3d để trình duyệt chạy trên GPU thay vì repaint trên CPU.
    el.style.transform =
      `translate3d(${x}px, ${y}px, 0) scale(${scaleRef.current}) rotate(${rotationRef.current}deg)`;
  }, []);

  const scheduleTransform = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  const resetView = useCallback(() => {
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    rotationRef.current = 0;
    setScale(1);
    setRotation(0);
    applyTransform();
  }, [applyTransform]);

  const clearTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  // scale/rotation đổi (bấm nút, lăn chuột) -> đồng bộ mirror ref rồi vẽ lại.
  useEffect(() => {
    scaleRef.current = scale;
    rotationRef.current = rotation;
    if (scale <= 1) panRef.current = { x: 0, y: 0 };
    applyTransform();
  }, [scale, rotation, applyTransform]);

  // Mở modal: nhận đúng initialIndex.
  // TRƯỚC ĐÂY currentIndex chỉ lấy initialIndex ở lần mount ĐẦU TIÊN
  // (useState(initialIndex)) — modal luôn nằm trong cây React nên từ lần mở thứ
  // hai trở đi initialIndex bị bỏ qua hoàn toàn.
  useEffect(() => {
    if (!isOpen) return;
    const safeIndex = Math.min(Math.max(initialIndex, 0), Math.max(totalImages - 1, 0));
    setCurrentIndex(safeIndex);
    // Reset cả trạng thái tải: mở lại modal sau một lần lỗi thì phải thử lại,
    // không hiện luôn màn hình lỗi cũ.
    setStatus("loading");
    setAttempt(0);
    setHiRes("idle");
    setBaseSize(null);
    resetView();
  }, [isOpen, initialIndex, totalImages, resetView]);

  // Đổi ảnh -> về trạng thái xem mặc định và bắt đầu đếm lại chu kỳ tải.
  useEffect(() => {
    if (!isOpen) return;
    clearTimers();
    setStatus("loading");
    setAttempt(0);
    setHiRes("idle");
    setBaseSize(null);
    resetView();
  }, [currentIndex, isOpen, clearTimers, resetView]);

  /**
   * Bản nét cao CHỈ tải khi người dùng thật sự phóng to (scale > 1).
   *
   * Xem ở 100% thì bản 800px đã phủ kín khung 95vh rồi — tải thêm bản 1600px
   * chẳng nét hơn được chút nào mà tốn đúng số byte vừa tiết kiệm được, lại
   * thêm một lần thay ảnh không ai cần. Phóng to mới là lúc thiếu pixel thật.
   *
   * Vẫn chờ bản 800px hiện xong mới tải: HTTP/1.1 chỉ cho 6 kết nối mỗi host,
   * xin bản nét cao quá sớm là cướp khe của chính ảnh đang cần hiện.
   */
  useEffect(() => {
    if (!isOpen || status !== "ok" || hiRes !== "idle" || scale <= 1) return;
    const target = fullImages[currentIndex];
    if (!target) return;

    let cancelled = false;
    const pre = new Image();
    pre.decoding = "async";
    pre.onload = () => {
      if (cancelled) return;
      // Giữ tham chiếu để bitmap đã giải mã không bị thu hồi trước lúc thay src.
      hiResImgRef.current = pre;
      setHiRes("done");
    };
    pre.onerror = () => { if (!cancelled) setHiRes("failed"); };
    pre.src = target;

    return () => {
      cancelled = true;
      // Hủy request còn dở khi người dùng đổi ảnh/đóng modal, đừng để nó tiếp
      // tục chiếm khe kết nối của ảnh kế tiếp.
      if (!pre.complete) pre.src = "";
    };
  }, [isOpen, status, hiRes, scale, currentIndex, fullImages]);

  // Canh request treo: hết STALL_TIMEOUT_MS mà chưa load xong thì chuyển sang
  // trạng thái lỗi để người dùng có nút bấm tải lại, thay vì ngồi nhìn khung đen.
  useEffect(() => {
    if (!isOpen || status !== "loading") return;
    stallTimerRef.current = setTimeout(() => setStatus("error"), STALL_TIMEOUT_MS);
    return () => {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    };
  }, [isOpen, status, attempt, currentIndex]);

  /**
   * Ảnh nằm sẵn trong cache có thể load xong TRƯỚC khi React gắn onLoad — khi đó
   * onLoad không bao giờ bắn và spinner quay mãi dù ảnh đã sẵn sàng. Kiểm tra
   * thẳng cờ .complete của thẻ img sau mỗi lần render.
   */
  useEffect(() => {
    if (!isOpen || status !== "loading") return;
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      clearTimers();
      setBaseSize((prev) => prev ?? { w: el.naturalWidth, h: el.naturalHeight });
      setStatus("ok");
    }
  }, [isOpen, status, src, clearTimers]);

  // Dọn timer + rAF khi unmount.
  useEffect(
    () => () => {
      clearTimers();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [clearTimers],
  );

  /**
   * HỦY request ảnh còn dở khi đóng modal hoặc đổi ảnh.
   *
   * Gỡ một thẻ <img> khỏi DOM KHÔNG hủy request của nó — trình duyệt vẫn giữ
   * kết nối cho tới khi server trả lời. Đóng modal rồi mở ảnh khác liên tục là
   * cách nhanh nhất để lấp đầy 6 khe kết nối bằng những ảnh không ai còn xem.
   * Gán src="" là cách hủy được hỗ trợ trên mọi trình duyệt.
   *
   * Chụp phần tử vào biến ngay khi effect chạy, không đọc imgRef trong hàm dọn
   * dẹp: lúc unmount React đã gỡ ref về null rồi.
   */
  useEffect(() => {
    const el = imgRef.current;
    return () => {
      if (el && !el.complete) el.src = "";
    };
  }, [src]);

  // Khoá cuộn trang phía sau trong lúc modal mở.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  const handleClose = useCallback(() => {
    clearTimers();
    resetView();
    setCurrentIndex(0);
    onClose();
  }, [onClose, resetView, clearTimers]);

  // Bàn phím
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft": handlePrevious(); break;
        case "ArrowRight": handleNext(); break;
        case "Escape": handleClose(); break;
        case "+": case "=": setScale((p) => clampScale(p + SCALE_STEP)); break;
        case "-": case "_": setScale((p) => clampScale(p - SCALE_STEP)); break;
        case "0": resetView(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, handleClose, resetView]);

  /**
   * Lăn chuột để zoom — phải đăng ký tay với { passive: false }.
   *
   * TRƯỚC ĐÂY dùng onWheel của React rồi gọi e.preventDefault(). React gắn wheel
   * ở root dưới dạng PASSIVE, nên preventDefault không có tác dụng: zoom thì vẫn
   * zoom nhưng trang phía sau cuộn theo, và Chrome còn log cảnh báo mỗi lần lăn.
   */
  useEffect(() => {
    if (!isOpen) return;
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => clampScale(prev + (e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  /**
   * Nạp sẵn ảnh kề (trước/sau) SAU KHI ảnh chính đã xong.
   *
   * Quan trọng là thứ tự: nạp sẵn trước khi ảnh chính load xong sẽ chiếm mất
   * khe kết nối của chính nó (HTTP/1.1 chỉ cho 6 kết nối đồng thời mỗi host).
   * Chỉ nạp sẵn bản 800px, không nạp bản 1600px.
   */
  useEffect(() => {
    if (!isOpen || status !== "ok" || totalImages < 2) return;
    const neighbours = [
      (currentIndex + 1) % totalImages,
      (currentIndex - 1 + totalImages) % totalImages,
    ];
    const preloaded = neighbours.map((i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = previewImages[i];
      return img;
    });
    return () => {
      // Hủy request còn dở khi người dùng đổi ảnh/đóng modal.
      preloaded.forEach((img) => { img.src = ""; });
    };
  }, [isOpen, status, currentIndex, previewImages, totalImages]);

  if (!isOpen || totalImages === 0) return null;

  const handleLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    clearTimers();
    // Chốt khung theo tấm ĐẦU TIÊN tải xong (bản 800px) và không bao giờ đổi
    // nữa. Nhờ vậy lúc bản 1600px thay vào, khung không bị tính lại -> ảnh
    // không nhảy cỡ trước mắt người dùng.
    const el = e.currentTarget;
    if (el.naturalWidth > 0) {
      setBaseSize((prev) => prev ?? { w: el.naturalWidth, h: el.naturalHeight });
    }
    setStatus("ok");
  };

  const handleError = () => {
    if (attempt < MAX_AUTO_RETRY) {
      // Chờ tăng dần rồi thử lại: 600ms, 1200ms
      retryTimerRef.current = setTimeout(
        () => setAttempt((a) => a + 1),
        600 * (attempt + 1),
      );
    } else {
      setStatus("error");
    }
  };

  const handleManualRetry = () => {
    clearTimers();
    setAttempt((a) => a + 1);
    setStatus("loading");
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scaleRef.current <= 1) return;
    if ((e.target as HTMLElement).closest("button")) return;
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: panRef.current.x,
      baseY: panRef.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    panRef.current = {
      x: drag.baseX + e.clientX - drag.startX,
      y: drag.baseY + e.clientY - drag.startY,
    };
    scheduleTransform();
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current = { active: false, pointerId: -1, startX: 0, startY: 0, baseX: 0, baseY: 0 };
    setIsDragging(false);
  };

  const canPan = scale > 1;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90"
      onClick={handleClose}
      style={{ isolation: "isolate" }}
      data-close-modal="true"
      data-image-modal="true"
    >
      <div
        className="relative w-[95vw] h-[95vh] flex items-center justify-center overflow-hidden z-9999!"
        onClick={(e) => e.stopPropagation()}
        style={{ isolation: "isolate", zIndex: 99999 }}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2 z-9999 pointer-events-auto"
          aria-label="Close"
          data-modal-close-btn="true"
        >
          <IoClose size={32} />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 text-white font-semibold text-lg bg-black/50 px-4 py-2 rounded-lg z-9999">
            {title}
            {totalImages > 1 && (
              <span className="ml-2 text-sm text-gray-300">({currentIndex + 1}/{totalImages})</span>
            )}
            <span className="ml-2 text-sm text-gray-400">{Math.round(scale * 100)}%</span>
          </div>
        )}

        {/* Navigation Buttons */}
        {totalImages > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-opacity-70 z-9999!"
              aria-label="Previous image"
            >
              <IoChevronBack size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-opacity-70 z-9999!"
              aria-label="Next image"
            >
              <IoChevronForward size={32} />
            </button>
          </>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-black/50 rounded-lg p-2 z-9999">
          <button onClick={(e) => { e.stopPropagation(); setScale((p) => clampScale(p + SCALE_STEP)); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto" aria-label="Zoom in"><MdZoomIn size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); setScale((p) => clampScale(p - SCALE_STEP)); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto" aria-label="Zoom out"><MdZoomOut size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); resetView(); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto" aria-label="Reset"><MdRefresh size={24} /></button>
          <div className="border-t border-gray-600 my-1"></div>
          <button onClick={(e) => { e.stopPropagation(); setRotation((p) => p - 90); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto" aria-label="Rotate left"><MdRotateLeft size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); setRotation((p) => p + 90); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto" aria-label="Rotate right"><MdRotateRight size={24} /></button>
        </div>

        {/*
          Thumbnail CHỈ render sau khi ảnh chính đã tải xong (hoặc lỗi).

          TRƯỚC ĐÂY mỗi thumbnail là một <img> trỏ vào ẢNH GỐC cỡ đầy đủ — khung
          64x64 nhưng vẫn tải về cả mấy MB. Mở một bộ 5 ảnh AOI là 5 request nặng
          chạy song song, chiếm gần hết 6 khe kết nối của host, nên request ảnh
          CHÍNH bị đẩy xuống cuối hàng đợi. Đó là lý do khung ảnh chính đen thật
          lâu rồi mới hiện, hoặc không hiện nổi trên máy mạng yếu.
        */}
        {totalImages > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto z-9999!">
            {status === "loading"
              ? previewImages.map((_, index) => (
                  <div
                    key={index}
                    className={`shrink-0 w-16 h-16 rounded border-2 bg-white/5 ${
                      index === currentIndex ? "border-blue-500" : "border-gray-600"
                    }`}
                  />
                ))
              : thumbImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                    className={`shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                      index === currentIndex ? "border-blue-500 scale-110" : "border-gray-500 hover:border-white"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${index + 1}`}
                      className="w-full h-full object-cover bg-white/5"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      draggable={false}
                    />
                  </button>
                ))}
          </div>
        )}

        {/* Khung ảnh */}
        <div
          ref={stageRef}
          className="w-full h-full flex items-center justify-center touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onDoubleClick={resetView}
          style={{
            cursor: canPan ? (isDragging ? "grabbing" : "grab") : "default",
            zIndex: 1,
          }}
        >
          {/* Đang tải: spinner + nhắc rõ đang chờ, KHÔNG để khung đen câm lặng. */}
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 pointer-events-none">
              <div className="w-10 h-10 border-[3px] border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Đang tải ảnh...</span>
            </div>
          )}

          {/* Treo hoặc lỗi: cho người dùng tải lại ngay trong modal, khỏi F5 cả trang. */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="text-sm font-semibold text-amber-300">
                Ảnh chưa tải được
              </span>
              <span className="max-w-md text-xs text-white/60">
                Mạng đang chậm hoặc server chưa phục vụ kịp. Bấm tải lại — không cần
                làm mới cả trang.
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleManualRetry(); }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400 pointer-events-auto"
              >
                Tải lại ảnh
              </button>
            </div>
          )}

          <img
            /*
              key KHÔNG gắn theo src.
              Đổi ảnh hoặc bấm thử lại thì cần một thẻ img mới tinh (key đổi).
              Nhưng lúc thay bản 800px bằng bản 1600px thì src đổi mà key giữ
              nguyên, nên React chỉ sửa thuộc tính src trên đúng thẻ đó — ảnh cũ
              còn nguyên trên màn hình tới khi ảnh mới vẽ xong, không nháy trắng.
            */
            key={`${currentIndex}-${attempt}`}
            ref={imgRef}
            src={src}
            alt={title || "Preview"}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            style={{
              // Chỉ animate khi KHÔNG kéo: lúc kéo, transform đã được ghi trực
              // tiếp vào DOM từng frame nên thêm transition chỉ làm trễ theo tay.
              transition: isDragging ? "none" : "transform 160ms ease-out",
              willChange: "transform",
              // Ẩn ảnh lỗi/chưa xong để không nhá một khung trống nửa vời.
              visibility: status === "ok" ? "visible" : "hidden",
              // KHUNG ĐÃ CHỐT theo tấm đầu tiên tải xong.
              //
              // Không có hai dòng này thì khung do kích thước pixel thật của ảnh
              // quyết định, nên thay bản 800px bằng bản 1600px là ảnh nhảy cỡ.
              // Chốt lại: khung vẫn co theo cửa sổ nhờ max-w-full/max-h-full của
              // Tailwind (max-width ở đây tính theo px, cái nào nhỏ hơn thắng),
              // và object-contain lo phần vẽ vừa khít bên trong. Bản nét cao vào
              // đúng vị trí, đúng kích thước, chỉ nét hơn.
              ...(baseSize
                ? { maxWidth: `min(100%, ${baseSize.w}px)`, maxHeight: `min(100%, ${baseSize.h}px)` }
                : null),
            }}
            decoding="async"
            fetchPriority="high"
            draggable={false}
            onLoad={handleLoaded}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
