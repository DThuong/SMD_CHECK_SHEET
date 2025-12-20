import { IoClose } from "react-icons/io5";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const ImagePreviewModal = ({ isOpen, imageUrl, onClose, title }: ImagePreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-5 right-5 text-white hover:text-gray-300 transition-colors"
        >
          <IoClose size={32} />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute -top-5 left-6 text-white font-semibold text-lg">
            {title}
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;