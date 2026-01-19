/* eslint-disable react-hooks/set-state-in-effect */
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

  // ✅ FIX: Reset khi đổi ảnh - GỌI TRỰC TIẾP
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, [currentIndex]);

  // ✅ FIX: Reset index khi mở modal - GỌI TRỰC TIẾP
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Navigation functions
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  // ✅ FIX: handleReset - GỌI TRỰC TIẾP
  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // ✅ FIX: handleClose - GỌI TRỰC TIẾP
  const handleClose = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setCurrentIndex(0);
    onClose();
  }, [onClose]);

  // ✅ Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          handleClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, handleClose]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  // Rotate functions
  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  // Zoom functions
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  // Drag functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="relative w-[95vw] h-[95vh] flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Close"
        >
          <IoClose size={32} />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 text-white font-semibold text-lg bg-black bg-opacity-50 px-4 py-2 rounded-lg">
            {title}
            {totalImages > 1 && (
              <span className="ml-2 text-sm text-gray-300">
                ({currentIndex + 1}/{totalImages})
              </span>
            )}
          </div>
        )}

        {/* Navigation */}
        {totalImages > 1 && (
          <>
            <button onClick={handlePrevious} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 z-10" aria-label="Previous">
              <IoChevronBack size={32} />
            </button>
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 z-10" aria-label="Next">
              <IoChevronForward size={32} />
            </button>
          </>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-black bg-opacity-50 rounded-lg p-2 z-10">
          <button onClick={handleZoomIn} className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded" aria-label="Zoom In"><MdZoomIn size={24} /></button>
          <button onClick={handleZoomOut} className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded" aria-label="Zoom Out"><MdZoomOut size={24} /></button>
          <button onClick={handleReset} className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded" aria-label="Reset"><MdRefresh size={24} /></button>
          <div className="border-t border-gray-600 my-1"></div>
          <button onClick={handleRotateLeft} className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded" aria-label="Rotate Left"><MdRotateLeft size={24} /></button>
          <button onClick={handleRotateRight} className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded" aria-label="Rotate Right"><MdRotateRight size={24} /></button>
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm z-10">
          {Math.round(scale * 100)}%
        </div>

        {/* Thumbnails */}
        {totalImages > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 rounded-lg p-2 max-w-[90vw] overflow-x-auto z-10">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                  index === currentIndex ? 'border-blue-500 scale-110' : 'border-gray-500 hover:border-white'
                }`}
              >
                <img src={normalizeImageUrl(img)} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Image */}
        <div
          className="w-full h-full flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;