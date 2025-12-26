import { IoClose } from "react-icons/io5";
import { normalizeImageUrl } from "../../utils/imageUrl";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const ImagePreviewModal = ({ isOpen, imageUrl, onClose, title }: ImagePreviewModalProps) => {
  if (!isOpen) return null;

  // Normalize URL - Đảm bảo không bị duplicate

  const finalImageUrl = normalizeImageUrl(imageUrl);

  return (
    <div 
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      data-close-modal="true"
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          data-close-modal="true"
          className="absolute -top-5 right-5 text-white hover:text-gray-300 transition-colors z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <IoClose size={32} />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute -top-5 left-6 text-white font-semibold text-lg">
            {title}
          </div>
        )}

        {/* Image with error handling */}
        <img
          src={finalImageUrl}
          alt="Preview"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          onError={(e) => {
            console.error('❌ Failed to load image:', finalImageUrl);
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
          }}
          style={{ pointerEvents: 'auto' }}
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;