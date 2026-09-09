import React from 'react';
import { FaCamera } from 'react-icons/fa';
import { IoEyeSharp } from 'react-icons/io5';
import { normalizeImageUrl } from '../../utils/imageUrl';

interface MultiImageUploadProps {
  label: string;
  images: string[] | undefined;
  fieldName: string; // Giữ nguyên string
  onUpload: (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>; // Support cả sync và async
  onRemove: (index: number) => void;
  onViewAll: () => void;
  notes?: string[];
  onViewSingle: (imageUrl: string, title: string) => void;
  maxImages?: number;
  showDeleteButton?: boolean;
}

/**
 * Kích thước tối đa (cạnh dài nhất) của ảnh sau khi đóng dấu thời gian.
 *
 * Ảnh từ camera điện thoại thường 4000x3000 (12MP). Một canvas cỡ đó chiếm
 * ~48 MB RAM. Mở tab lâu + upload nhiều tấm là Chrome hết ngân sách bộ nhớ
 * canvas và trả về ảnh TRẮNG mà KHÔNG báo lỗi gì.
 *
 * 2560px vẫn dư nét cho ảnh check sheet nhưng giảm bộ nhớ canvas hơn 2 lần.
 * Muốn giữ nguyên độ phân giải gốc thì đổi thành Infinity.
 */
const MAX_IMAGE_DIMENSION = 2560;
const JPEG_QUALITY = 0.92;

/** Ảnh load lâu quá thì bỏ đóng dấu, dùng ảnh gốc — không để người dùng chờ vô hạn. */
const IMAGE_LOAD_TIMEOUT_MS = 20000;

/**
 * Kiểm tra canvas có bị trắng hoàn toàn không.
 *
 * Khi Chrome không cấp đủ bộ nhớ cho canvas, drawImage() im lặng không vẽ gì và
 * toBlob() trả về một tấm ảnh trắng trơn — đúng hiện tượng người dùng gặp phải.
 * Lấy mẫu vài chục điểm rải đều: nếu TẤT CẢ đều trắng tinh thì coi như hỏng.
 */
const isCanvasBlank = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean => {
  const STEPS = 6; // 6x6 = 36 điểm mẫu
  try {
    for (let i = 1; i <= STEPS; i++) {
      for (let j = 1; j <= STEPS; j++) {
        const x = Math.floor((width * i) / (STEPS + 1));
        const y = Math.floor((height * j) / (STEPS + 1));
        const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
        // Chỉ cần MỘT điểm không phải trắng tinh là canvas có nội dung thật
        if (r < 250 || g < 250 || b < 250) return false;
      }
    }
  } catch {
    // getImageData có thể ném lỗi (tainted canvas) — coi như không rỗng
    return false;
  }
  return true;
};

const addTimestampToImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    let settled = false;
    /** Chỉ giải quyết Promise đúng MỘT lần, và luôn thu hồi blob URL. */
    const finish = (result: File) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      console.warn('[upload] Ảnh load quá lâu — dùng ảnh gốc, bỏ đóng dấu thời gian.');
      finish(file);
    }, IMAGE_LOAD_TIMEOUT_MS);

    // TRƯỚC ĐÂY KHÔNG CÓ onerror: ảnh lỗi là Promise treo vĩnh viễn,
    // người dùng bấm upload mà không thấy gì xảy ra.
    img.onerror = () => {
      clearTimeout(timeoutId);
      console.warn('[upload] Không đọc được ảnh — dùng ảnh gốc.');
      finish(file);
    };

    img.onload = async () => {
      clearTimeout(timeoutId);
      let canvas: HTMLCanvasElement | null = null;

      /** Trả bộ nhớ canvas ngay thay vì chờ garbage collector. */
      const releaseCanvas = () => {
        if (!canvas) return;
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      };

      try {
        // NGUYÊN NHÂN CHÍNH của lỗi "upload lên bị trắng hình":
        // onload chỉ báo ảnh đã TẢI xong, KHÔNG bảo đảm đã GIẢI MÃ xong.
        // Với ảnh lớn, drawImage() ngay lúc đó có thể vẽ ra một tấm trắng.
        // decode() chờ tới khi pixel thật sự sẵn sàng. Đây cũng là lý do
        // "xóa đi upload lại thì OK" — lần sau ảnh đã được giải mã rồi.
        if (typeof img.decode === 'function') {
          try {
            await img.decode();
          } catch {
            /* decode lỗi thì vẫn thử vẽ bên dưới */
          }
        }

        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        if (!srcW || !srcH) return finish(file);

        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(srcW, srcH));
        const w = Math.max(1, Math.round(srcW * scale));
        const h = Math.max(1, Math.round(srcH * scale));

        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          releaseCanvas();
          return finish(file);
        }

        // Nền trắng: ảnh PNG có vùng trong suốt khi xuất ra JPEG sẽ thành đen
        // nếu không tô nền trước.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        // Kiểm tra TRƯỚC khi vẽ timestamp: nếu canvas trắng trơn nghĩa là
        // drawImage thất bại -> trả ảnh gốc thay vì upload một tấm trắng.
        if (isCanvasBlank(ctx, w, h)) {
          console.warn('[upload] Canvas ra ảnh trắng — dùng ảnh gốc thay thế.');
          releaseCanvas();
          return finish(file);
        }

        // ----- Vẽ dấu thời gian -----
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timestamp =
          `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ` +
          `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const fontSize = Math.max(24, Math.floor(w * 0.035));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textBaseline = 'bottom';

        const textWidth = ctx.measureText(timestamp).width;
        const padding = 10;
        const x = w - textWidth - padding * 2;
        const y = h - padding;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 1.5);

        ctx.fillStyle = '#FFD600';
        ctx.fillText(timestamp, x, y);

        canvas.toBlob(
          (blob) => {
            releaseCanvas();
            if (blob && blob.size > 0) {
              const name = file.name.replace(/\.[^.]+$/, '') || 'photo';
              finish(new File([blob], `${name}.jpg`, { type: 'image/jpeg' }));
            } else {
              console.warn('[upload] toBlob trả về rỗng — dùng ảnh gốc.');
              finish(file);
            }
          },
          'image/jpeg',
          JPEG_QUALITY,
        );
      } catch (error) {
        console.error('[upload] Lỗi khi đóng dấu thời gian:', error);
        releaseCanvas();
        finish(file);
      }
    };

    img.src = url;
  });
};

/**
 * Ảnh trong gallery, có tự thử tải lại khi thất bại.
 *
 * TRƯỚC ĐÂY dùng <img src={...}> trần: nếu request ảnh hỏng giữa chừng (server
 * vừa ghi file xong chưa phục vụ kịp, mạng nhà máy chớp một nhịp), thẻ img hiện
 * một ô TRẮNG và không có cách nào biết — người dùng tưởng ảnh upload lên bị lỗi
 * nên phải xóa đi upload lại.
 *
 * Nay: tự thử lại 2 lần (có cache-busting), rồi mới hiện nút bấm thử lại thủ công.
 * Không bao giờ để lại một ô trắng câm lặng nữa.
 */
const MAX_AUTO_RETRY = 2;

const ImageWithRetry: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt, className, onClick }) => {
  const [attempt, setAttempt] = React.useState(0);
  const [status, setStatus] = React.useState<'loading' | 'ok' | 'error'>('loading');

  React.useEffect(() => {
    setAttempt(0);
    setStatus('loading');
  }, [src]);

  const url = attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}_r=${attempt}`;

  const handleError = () => {
    if (attempt < MAX_AUTO_RETRY) {
      // Chờ tăng dần rồi thử lại: 600ms, 1200ms
      const delay = 600 * (attempt + 1);
      setTimeout(() => setAttempt((a) => a + 1), delay);
    } else {
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => {
          setAttempt((a) => a + 1);
          setStatus('loading');
        }}
        className="w-full h-32 flex flex-col items-center justify-center gap-1 bg-amber-50 border border-amber-300 text-amber-800 text-xs px-2 text-center"
      >
        <span className="font-semibold">Ảnh chưa tải được</span>
        <span>Bấm để thử lại</span>
      </button>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        key={url}
        src={url}
        alt={alt}
        className={className}
        onClick={onClick}
        onLoad={() => setStatus('ok')}
        onError={handleError}
        style={{ pointerEvents: 'auto' }}
        data-view-image="true"
      />
    </>
  );
};

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  label,
  images = [],
  fieldName,
  onUpload,
  onRemove,
  notes,
  onViewAll,
  onViewSingle,
  maxImages,
  showDeleteButton = true
}) => {
  const imageCount = images?.length || 0;
  const canAddMore = !maxImages || imageCount < maxImages;

  // Handler wrapper để xử lý async
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Giữ tham chiếu tới thẻ input NGAY, vì sau await thì event.target có thể
    // không còn dùng được.
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;

    // Chặn bấm upload chồng nhau — hai canvas lớn chạy song song là một trong
    // những nguyên nhân làm Chrome hết bộ nhớ và trả về ảnh trắng.
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const stampedFile = await addTimestampToImage(file);

      // Tạo synthetic event với file đã có timestamp
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(stampedFile);
      const syntheticEvent = {
        ...event,
        target: { ...inputEl, files: dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await onUpload(fieldName, syntheticEvent);
    } finally {
      setIsProcessing(false);
      // Xóa giá trị input: nếu không, chọn LẠI ĐÚNG file vừa rồi sẽ không kích
      // hoạt onChange (giá trị không đổi) -> người dùng tưởng hệ thống treo.
      // Đây chính là tình huống "xóa ảnh trắng rồi chọn lại đúng file đó".
      try { inputEl.value = ''; } catch { /* bỏ qua */ }
    }
  };

  return (
    <div className="min-w-0 mb-3 mt-2">
      <label className="block text-xs font-medium mb-1">{label}</label>

      {/* Upload Controls - Only show if can add more */}
      {canAddMore && (
        <>
          {/* File Input */}
          <div className="">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange} // Sử dụng wrapper
              disabled={isProcessing}
              className="border border-gray-300 rounded px-3 py-2 w-full disabled:opacity-50"
            />
          </div>

          {/* Camera Capture */}
          <div className="flex justify-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
              id={`camera-capture-${fieldName}`}
            />
            <label
              htmlFor={`camera-capture-${fieldName}`}
              className={`mt-2 w-full text-white px-4 py-3 rounded-lg flex! items-center! justify-center! gap-2 transition-colors font-medium shadow-sm ${
                isProcessing
                  ? 'bg-blue-400 cursor-wait pointer-events-none'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`}
            >
              <FaCamera size={15} />
              {isProcessing ? 'Đang xử lý ảnh...' : 'Chụp ảnh'}
            </label>
          </div>
        </>
      )}

      {/* Max images warning */}
      {maxImages && imageCount >= maxImages && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          Đã đạt giới hạn tối đa {maxImages} ảnh
        </div>
      )}

      {/* Preview Gallery */}
      {images && images.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            Đã có {images.length} ảnh{maxImages ? ` / ${maxImages}` : ''}:
          </p>

          {/* Grid layout */}
          <div className="grid grid-cols-2 gap-3">
            {images.map((imageUrl, index) => (
              <div key={index} className="flex flex-col rounded-lg overflow-hidden border border-blue-500">

                {/* Phần ảnh + nút xóa + số thứ tự */}
                <div className="relative">
                  {/* Chuẩn hoá URL trước khi hiển thị.
                      TRƯỚC ĐÂY gallery dùng thẳng imageUrl còn ImagePreviewModal lại
                      gọi normalizeImageUrl. Nếu API trả về đường dẫn TƯƠNG ĐỐI
                      (ví dụ "/api/StandardVehicle/image-spi/123/abc.png"), thẻ img
                      trong gallery sẽ ghép vào origin của frontend -> nginx trả về
                      index.html -> ảnh KHÔNG hiện, thành một ô TRẮNG, trong khi bấm
                      vào xem phóng to thì lại có hình.
                      Lưu ý: chỉ chuẩn hoá để HIỂN THỊ. Các callback bên dưới vẫn nhận
                      imageUrl gốc vì API xoá ảnh cần đúng giá trị server đã trả về. */}
                  <ImageWithRetry
                    src={normalizeImageUrl(imageUrl)}
                    alt={`${label} ${index + 1}`}
                    className="w-full h-auto object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onViewSingle(imageUrl, `${label} ${index + 1}`)}
                  />
                  {showDeleteButton && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                    #{index + 1}
                  </div>
                </div>

                {/* Note gắn với ảnh này */}
                {notes?.[index] && (
                  <div className="text-xs text-gray-600 px-2 py-1 bg-white border-t border-gray-200 italic truncate">
                    {notes[index]}
                  </div>
                )}

              </div>
            ))}
          </div>
          {/* View All Button */}
          <button
            type="button"
            onClick={onViewAll}
            data-view-image="true"
            style={{ pointerEvents: 'auto' }}
            className="mt-3 w-full text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <IoEyeSharp size={20} />
            <span className="text-sm font-medium">Xem tất cả {images.length} ảnh</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;