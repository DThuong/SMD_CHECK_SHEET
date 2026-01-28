import React from 'react';
import { useTranslation } from 'react-i18next';
import { IoEyeSharp } from 'react-icons/io5';

interface ImageViewIconProps {
  imageUrl: string | string[] | undefined;
  title: string;
  onView: (imageUrl: string | string[], title: string, initialIndex?: number) => void;
  showCount?: boolean;
}

const ImageViewIcon: React.FC<ImageViewIconProps> = ({ 
  imageUrl, 
  title, 
  onView,
  showCount = true 
}) => {
  const {t: t2} = useTranslation('common');
  
  // Handler với stopPropagation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn event bubble lên parent
    
    if (Array.isArray(imageUrl)) {
      onView(imageUrl, title, 0);
    } else if (imageUrl) {
      onView(imageUrl, title);
    }
  };

  // Không có ảnh
  if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
    return (
      <span className="text-gray-400 text-sm min-h-5">
        {t2('noImg')}
      </span>
    );
  }

  // Array images
  if (Array.isArray(imageUrl)) {
    const imageCount = imageUrl.length;
    
    return (
      <button
        type="button"
        onClick={handleClick}
        data-view-image="true"
        className="flex items-center gap-2 px-3 rounded-lg transition-colors"
      >
        <IoEyeSharp size={20} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          {showCount ? `${imageCount}` : 'Xem ảnh'}
        </span>
      </button>
    );
  }

  // Single image
  return (
    <button
      type="button"
      onClick={handleClick}
      data-view-image="true"
      className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors min-h-11"
    >
      <IoEyeSharp size={20} className="text-blue-600" />
      <span className="text-sm font-medium text-blue-700">Xem ảnh</span>
    </button>
  );
};

export default ImageViewIcon;