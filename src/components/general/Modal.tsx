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
  
  useEffect(() => {
    if (open) {
      // Save scroll position
      savedScrollY.current = window.scrollY;
      
      // Lock body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      console.log('🔒 Modal opened, body locked at:', savedScrollY.current);
      
      return () => {
        // Restore scroll
        const scrollY = savedScrollY.current;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        
        console.log('🔓 Modal closed, scroll restored to:', scrollY);
      };
    }
  }, [open]);

  // iOS Input Focus Handler với logging
  useEffect(() => {
    if (!open || !contentRef.current) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT'
      ) {
        // Skip checkbox/radio
        if (target.type === 'checkbox' || target.type === 'radio') {
          console.log('⏭️ Skipping checkbox/radio focus handler');
          return;
        }
        
        console.log('📍 Modal input focused:', target.type, target.name || target.placeholder);
        
        // Delay for iOS keyboard animation
        setTimeout(() => {
          try {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
            console.log('✅ Input scrolled into view');
          } catch (error) {
            console.error('❌ Scroll error:', error);
          }
        }, 300);
      }
    };

    const content = contentRef.current;
    content.addEventListener('focusin', handleFocus, true);

    return () => {
      content.removeEventListener('focusin', handleFocus, true);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center py-4"
      style={{
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div 
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg p-4 mb-4"
        style={{
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{title ?? "Chi tiết"}</h3>
          <button 
            onClick={onClose} 
            aria-label="close"
            data-close-modal="true"
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
            overflowY: 'auto',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
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
            data-close-modal="true"
            style={{ minHeight: '44px' }}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}