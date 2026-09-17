// src/components/Notification.tsx
import { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  show: boolean;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

/**
 * Thời gian hiện toast, TÍNH THEO LOẠI.
 *
 * TRƯỚC ĐÂY mọi toast đều 2000ms. Với báo thành công thì hợp lý, nhưng một toast
 * lỗi kèm chẩn đoán vài dòng thì 2 giây chưa đọc hết dòng đầu — người dùng chỉ
 * kịp thấy "có gì đó màu đỏ nhoáng qua" rồi lại báo lên là "hệ thống lỗi" mà
 * không nói được lỗi gì. Lỗi ở lại lâu và luôn có nút đóng để tự tắt sớm.
 */
const DEFAULT_DURATION: Record<NotificationType, number> = {
  success: 2000,
  info: 3000,
  warning: 8000,
  error: 15000,
};

const Notification: React.FC<NotificationProps> = ({
  show,
  type,
  title,
  message,
  duration,
  onClose
}) => {
  const visibleFor = duration ?? DEFAULT_DURATION[type];

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, visibleFor);
      return () => clearTimeout(timer);
    }
  }, [show, visibleFor, onClose]);

  if (!show) return null;

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-600!',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700',
      icon: '✅'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400!',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700',
      icon: '❌'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-600!',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-600!',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700',
      icon: 'ℹ️'
    }
  };

  const style = styles[type];

  /**
   * Thông báo chẩn đoán được ghép bằng '\n' (xem utils/apiError). Thẻ <p> mặc
   * định gộp mọi xuống dòng thành một khối liền — phải có whitespace-pre-line
   * thì các gạch đầu dòng "• ..." mới hiện đúng. Kèm giới hạn chiều cao và cho
   * cuộn, để một thông báo dài không che mất cả màn hình.
   */
  return (
    <div className="slide-noti w-full max-w-[900px] left-1/2 z-99999 -translate-x-1/2" style={{ zIndex: 99999 }}>
      <div className={`noti-inner ${style.bg} border-l-4 ${style.border} p-3 rounded shadow`}>
        <div className="flex items-start gap-2">
          <p className={`font-bold ${style.titleColor} mb-0 flex-1 min-w-0`}>
            {style.icon} {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thông báo"
            className={`${style.titleColor} shrink-0 px-2 leading-none text-lg font-bold opacity-60 hover:opacity-100 cursor-pointer`}
          >
            ×
          </button>
        </div>
        {message && (
          <p
            className={`${style.messageColor} text-sm mt-1 mb-0 whitespace-pre-line break-words max-h-60 overflow-y-auto`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Notification;
