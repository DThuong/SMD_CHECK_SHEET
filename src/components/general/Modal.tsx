import React, { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave?: () => void;
  disabledSave?: boolean;
  children?: React.ReactNode;
};

export default function Modal({ 
  open, 
  title, 
  onClose, 
  onSave, 
  disabledSave, 
  children 
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<HTMLElement | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;

    const count = parseInt(document.body.dataset.modalCount || '0');
    document.body.dataset.modalCount = String(count + 1);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    return () => {
      const current = parseInt(document.body.dataset.modalCount || '1');
      const next = current - 1;
      document.body.dataset.modalCount = String(next);
      
      if (next <= 0) {
        document.body.style.overflow = '';
        document.body.removeAttribute('data-modal-count');
        document.body.classList.remove('modal-open');
      }
    };
  }, [open]);

  // iOS Focus Handler với scroll into view
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Skip non-text inputs
      if (
        target instanceof HTMLInputElement && 
        ['checkbox', 'radio', 'date', 'datetime-local', 'time'].includes(target.type)
      ) return;

      activeInputRef.current = target;

      // Scroll input vào view
      setTimeout(() => {
        if (target !== activeInputRef.current) return;
        
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
    };

    const handleBlur = () => {
      activeInputRef.current = null;
    };

    const content = contentRef.current;
    content.addEventListener('focusin', handleFocus, { passive: true });
    content.addEventListener('focusout', handleBlur, { passive: true });

    return () => {
      content.removeEventListener('focusin', handleFocus);
      content.removeEventListener('focusout', handleBlur);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg flex flex-col modal-container"
        style={{
          maxHeight: '85vh',
          height: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 shrink-0">
          <h3 className="text-base font-medium">{title ?? "Chi tiết"}</h3>
          <button 
            onClick={onClose} 
            aria-label="close"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto scrollbar-hide"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <div className="p-3">
            {children}
          </div>
        </div>

        {/* Footer */}
        {onSave && (
          <div className="p-3 border-t border-gray-200 flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onSave}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabledSave}
              style={{ minHeight: '44px' }}
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium"
              style={{ minHeight: '44px' }}
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}