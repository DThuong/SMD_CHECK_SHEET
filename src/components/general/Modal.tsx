import React, {useEffect, useRef} from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave?: () => void;
  disabledSave?: boolean;
  children?: React.ReactNode;
};

export default function Modal({ open, title, onClose, onSave, disabledSave, children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef(0);
  
  // Body scroll lock khi modal mở
  useEffect(() => {
    if (open) {
      savedScrollY.current = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        const scrollY = savedScrollY.current;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  // iOS Input Focus Handler - ĐƠN GIẢN HÓA
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return; // ✅ Chỉ chạy trên iOS

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT'
      ) {
        // Skip checkbox/radio
        if (target.type === 'checkbox' || target.type === 'radio') return;
        
        // ✅ CHỈ scroll 1 lần, KHÔNG re-focus
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'auto', // ✅ Không dùng smooth
            block: 'center',
            inline: 'nearest'
          });
        }, 150); // ✅ Giảm delay
      }
    };

    const content = contentRef.current;
    content.addEventListener('focusin', handleFocus, { passive: true }); // ✅ Passive listener

    return () => {
      content.removeEventListener('focusin', handleFocus);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center py-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div 
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg p-4 mb-4"
        style={{
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{title ?? "Chi tiết"}</h3>
          <button 
            onClick={onClose} 
            aria-label="close"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            ✕
          </button>
        </div>

        <div 
          ref={contentRef}
          className="overflow-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>

        <div className="mt-4 flex gap-2 mb-4">
          <button 
            type="button" 
            onClick={onSave} 
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded" 
            disabled={disabledSave}
            style={{ minHeight: '44px' }}
          >
            Lưu
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-3 py-2 border rounded"
            style={{ minHeight: '44px' }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}