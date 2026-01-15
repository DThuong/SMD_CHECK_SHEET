import { IoClose } from "react-icons/io5";
import { MdZoomIn, MdZoomOut, MdRefresh, MdRotateLeft, MdRotateRight } from "react-icons/md";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { useState, useRef } from "react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const ImagePreviewModal = ({ isOpen, imageUrl, onClose, title }: ImagePreviewModalProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  if (!isOpen) return null;

  const finalImageUrl = normalizeImageUrl(imageUrl);

  // rotate
  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };


  // Zoom functions
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5)); // Max 5x zoom
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
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

  // Touch support for mobile
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

  // Reset when closing
  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleClose}
      data-close-modal="true"
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="relative w-[95vw] h-[95vh] flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          data-close-modal="true"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full! p-2"
          style={{ pointerEvents: 'auto' }}
        >
          <IoClose size={32} />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 text-white font-semibold text-lg bg-black bg-opacity-50 px-4 py-2 rounded-lg">
            {title}
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-black bg-opacity-50 rounded-lg p-2">
          <button
            onClick={handleZoomIn}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Zoom In"
          >
            <MdZoomIn size={24} />
          </button>
          <button
            onClick={handleZoomOut}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Zoom Out"
          >
            <MdZoomOut size={24} />
          </button>
          <button
            onClick={handleReset}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Reset"
          >
            <MdRefresh size={24} />
          </button>
          <div className="border-t border-gray-600 my-1"></div>
          <button
            onClick={handleRotateLeft}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Rotate Left"
          >
            <MdRotateLeft size={24} />
          </button>
          <button
            onClick={handleRotateRight}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Rotate Right"
          >
            <MdRotateRight size={24} />
          </button>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm">
          {Math.round(scale * 100)}%
        </div>

        {/* Image with zoom and pan */}
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
          style={{ 
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          <img
            ref={imageRef}
            src={finalImageUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              pointerEvents: 'auto'
            }}
            onError={(e) => {
              console.error('❌ Failed to load image:', finalImageUrl);
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