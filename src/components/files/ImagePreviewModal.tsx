// File: ImagePreviewModal.tsx
import { IoClose, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { MdZoomIn, MdZoomOut, MdRefresh, MdRotateLeft, MdRotateRight } from "react-icons/md";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { useState, useRef, useEffect, useCallback } from "react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | string[];
  onClose: () => void;
  title?: string;
  initialIndex?: number;
}

const ImagePreviewModal = ({ 
  isOpen, 
  imageUrl, 
  onClose, 
  title,
  initialIndex = 0 
}: ImagePreviewModalProps) => {
  // States
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const imageRef = useRef<HTMLImageElement>(null);

  const images = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  const totalImages = images.length;
  const currentImageUrl = normalizeImageUrl(images[currentIndex] || images[0]);

  // Navigation functions
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    setCurrentIndex(0);
    onClose();
  }, [onClose, handleReset]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': handlePrevious(); break;
        case 'ArrowRight': handleNext(); break;
        case 'Escape': handleClose(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, handleClose]);

  // Early return
  if (!isOpen) return null;

  // Image manipulation functions
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90"
      onClick={handleClose}
      style={{ isolation: 'isolate' }}
      data-close-modal="true"
      data-image-modal="true"
    >
      <div 
        className="relative w-[95vw] h-[95vh] flex items-center justify-center overflow-hidden z-9999!"
        onClick={(e) => e.stopPropagation()}
        style={{ isolation: 'isolate', zIndex: 99999 }}
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
          <div className="absolute top-4 left-4 text-white font-semibold text-lg bg-black/50 px-4 py-2 rounded-lg">
            {title}
            {totalImages > 1 && (
              <span className="ml-2 text-sm text-gray-300">({currentIndex + 1}/{totalImages})</span>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        {totalImages > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-opacity-70 z-9999!"
            >
              <IoChevronBack size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-3 hover:bg-opacity-70 z-9999!"
            >
              <IoChevronForward size={32} />
            </button>
          </>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-black/50 rounded-lg p-2 z-9999">
          <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto"><MdZoomIn size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto"><MdZoomOut size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto"><MdRefresh size={24} /></button>
          <div className="border-t border-gray-600 my-1"></div>
          <button onClick={(e) => { e.stopPropagation(); handleRotateLeft(); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto"><MdRotateLeft size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleRotateRight(); }} className="text-white p-2 hover:bg-white/20 rounded pointer-events-auto"><MdRotateRight size={24} /></button>
        </div>

        {/* Thumbnails */}
        {totalImages > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto z-9999!">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                  index === currentIndex ? 'border-blue-500 scale-110' : 'border-gray-500 hover:border-white'
                }`}
              >
                <img src={normalizeImageUrl(img)} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* GIẢI PHÁP CHÍNH: Dùng key={currentIndex} để reset state tự động */}
        <div
          key={currentIndex} 
          className="w-full h-full flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default', zIndex: 1 }}
        >
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;