/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect } from 'react';

export const useIOSInputFix = () => {
  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    // Detect iOS version
    const match = navigator.userAgent.match(/iPhone OS (\d+)_(\d+)/);
    const isIOS18Plus = match && parseInt(match[1]) >= 18;

    let focusedElement: HTMLElement | null = null;
    let initialScrollY = 0;
    let initialViewportHeight = window.innerHeight;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        focusedElement = target;
        initialScrollY = window.scrollY;
        initialViewportHeight = window.innerHeight;

        // Method 1: Immediate scroll với delay ngắn
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 100);

        // Method 2: Backup scroll sau khi keyboard xuất hiện
        // iOS 18.2+ cần delay lâu hơn
        const delay = isIOS18Plus ? 400 : 300;
        
        setTimeout(() => {
          const currentScrollY = window.scrollY;
          const viewportHeightChange = initialViewportHeight - window.innerHeight;
          
          // Nếu keyboard đã xuất hiện nhưng không scroll
          if (viewportHeightChange > 100 && Math.abs(currentScrollY - initialScrollY) < 50) {
            // iOS 18.2 bug detected - force scroll
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
            
            // Compensate thêm để input không bị che
            setTimeout(() => {
              window.scrollBy({
                top: -120, // Điều chỉnh giá trị này nếu cần
                behavior: 'smooth'
              });
            }, 50);
          }
        }, delay);
      }
    };

    const handleBlur = () => {
      focusedElement = null;
    };

    // Use capture phase để catch events sớm
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);
};