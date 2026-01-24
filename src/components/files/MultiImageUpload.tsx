import React from 'react';
import { FaCamera } from 'react-icons/fa';
import { IoEyeSharp } from 'react-icons/io5';

interface MultiImageUploadProps {
  label: string;
  images: string[] | undefined;
  fieldName: string; // Giữ nguyên string
  onUpload: (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>; // Support cả sync và async
  onRemove: (index: number) => void;
  onViewAll: () => void;
  onViewSingle: (imageUrl: string, title: string) => void;
  maxImages?: number;
  showDeleteButton?: boolean;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  label,
  images = [],
  fieldName,
  onUpload,
  onRemove,
  onViewAll,
  onViewSingle,
  maxImages,
  showDeleteButton = true
}) => {
  const imageCount = images?.length || 0;
  const canAddMore = !maxImages || imageCount < maxImages;

  // Handler wrapper để xử lý async
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpload(fieldName, event);
  };

  return (
    <div className="min-w-0 mb-3 mt-2">
      <label className="block text-xs font-medium mb-1">{label}</label>
      
      {/* Upload Controls - Only show if can add more */}
      {canAddMore && (
        <>
          {/* File Input */}
          <div className="">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange} // Sử dụng wrapper
              className="border border-gray-300 rounded px-3 py-2 w-full"
            />
          </div>
          
          {/* Camera Capture */}
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange} // Sử dụng wrapper
              className="hidden"
              id={`camera-capture-${fieldName}`}
            />
            <label
              htmlFor={`camera-capture-${fieldName}`}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium shadow-sm"
            >
              <div className="inline-flex items-center">
                <FaCamera size={15} />
              </div>
              <div className="inline-flex items-center mx-2">
                Chụp ảnh {label}
              </div>
            </label>
          </div>
        </>
      )}

      {/* Max images warning */}
      {maxImages && imageCount >= maxImages && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          Đã đạt giới hạn tối đa {maxImages} ảnh
        </div>
      )}
      
      {/* Preview Gallery */}
      {images && images.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">
            Đã có {images.length} ảnh{maxImages ? ` / ${maxImages}` : ''}:
          </p>
          
          {/* Grid layout */}
          <div className="grid grid-cols-2 gap-3">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative">
                <img 
                  src={imageUrl} 
                  alt={`${label} ${index + 1}`} 
                  className="w-full h-24 object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => onViewSingle(imageUrl, `${label} ${index + 1}`)} 
                  style={{ pointerEvents: 'auto' }}
                  data-view-image="true"
                />
                
                {/* Delete Button */}
                {showDeleteButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Label số thứ tự */}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
          
          {/* View All Button */}
          <button
            type="button"
            onClick={onViewAll}
            data-view-image="true"
            style={{ pointerEvents: 'auto' }}
            className="mt-3 w-full text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <IoEyeSharp size={20} />
            <span className="text-sm font-medium">Xem tất cả {images.length} ảnh</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;