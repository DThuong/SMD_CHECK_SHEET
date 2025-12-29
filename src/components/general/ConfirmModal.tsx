// components/ConfirmModal.tsx
import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!open) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
          titleColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          titleColor: 'text-yellow-600'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white',
          titleColor: 'text-blue-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-opacity-70"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4">
        {/* Icon & Title */}
        <div className="flex items-start gap-2 mb-4">
          <span className="text-3xl">{styles.icon}</span>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
              {title}
            </h3>
            <p className="text-gray-600 mt-2 mb-0 text-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center mt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${styles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};