import React, {useEffect} from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave?: () => void;
  disabledSave?: boolean;
  children?: React.ReactNode;
};

export default function Modal({ open, title, onClose, onSave, disabledSave, children }: ModalProps) {
  useEffect(() => {
    if (open) {
    // Khi mở modal, ngăn scroll trang
    document.body.style.overflow = 'hidden';
  } else {
    // Khi đóng modal, cho phép scroll lại
    document.body.style.overflow = 'unset';
  }
  // Cleanup khi component unmount
  return () => {
    document.body.style.overflow = 'unset';
  };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center py-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{title ?? "Chi tiết"}</h3>
          <button onClick={onClose} aria-label="close">✕</button>
        </div>

        <div className="max-h-[80vh] overflow-auto">
          {children}
        </div>

        <div className="mt-4 flex gap-2 mb-4">
          <button type="button" onClick={onSave} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded" disabled={disabledSave}>Lưu</button>
          <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border rounded">Hủy</button>
        </div>
      </div>
    </div>
  );
}