import React from 'react';
import { IoEyeSharp } from 'react-icons/io5';

interface ImageViewIconProps {
  imageUrl: string | string[] | undefined;
  title: string;
  onView: (imageUrl: string | string[], title: string, initialIndex?: number) => void;
  showCount?: boolean; // Option để hiển thị số lượng ảnh
}

const ImageViewIcon: React.FC<ImageViewIconProps> = ({ 
  imageUrl, 
  title, 
  onView,
  showCount = true 
}) => {
  // Xử lý trường hợp không có ảnh
  if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
    return (
      <span className="text-gray-400 text-xs" style={{ 
                fontSize: '16px',
                touchAction: 'manipulation'
              }}
    >Chưa có hình ảnh</span>
    );
  }

  // Xử lý array
  if (Array.isArray(imageUrl)) {
    const imageCount = imageUrl.length;
    
    return (
      <button
        type="button"
        onClick={() => onView(imageUrl, title, 0)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors"
      >
        <IoEyeSharp size={20} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          {showCount ? `Xem ${imageCount} ảnh` : 'Xem ảnh'}
        </span>
      </button>
    );
  }

  // Xử lý single image (string)
  return (
    <button
      type="button"
      onClick={() => onView(imageUrl, title)}
      className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors"
      >
      <IoEyeSharp size={20} className="text-blue-600" />
      <span className="text-sm font-medium text-blue-700">Xem ảnh</span>
    </button>
  );
};

export default ImageViewIcon;