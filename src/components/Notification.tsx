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

const Notification: React.FC<NotificationProps> = ({
  show,
  type,
  title,
  message,
  duration = 2000,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

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

  return (
    <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
      <div className={`noti-inner ${style.bg} border-l-4 ${style.border} p-3 rounded shadow`}>
        <p className={`font-bold ${style.titleColor} mb-0`}>
          {style.icon} {title}
        </p>
        {message && (
          <p className={`${style.messageColor} text-sm mt-1 mb-0`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Notification;