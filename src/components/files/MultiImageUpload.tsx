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
  notes?: string[];
  onViewSingle: (imageUrl: string, title: string) => void;
  maxImages?: number;
  showDeleteButton?: boolean;
}

const addTimestampToImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      // Vẽ ảnh gốc
      ctx.drawImage(img, 0, 0);

      // Format timestamp: DD/MM/YYYY HH:mm:ss
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const timestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // Style chữ
      const fontSize = Math.max(24, Math.floor(img.width * 0.035));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textBaseline = "bottom";

      // Đo width để tính vị trí
      const textWidth = ctx.measureText(timestamp).width;
      const padding = 10;
      const x = img.width - textWidth - padding * 2;
      const y = img.height - padding;

      // Nền mờ phía sau chữ
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 1.5);

      // Chữ màu vàng
      ctx.fillStyle = "#FFD600";
      ctx.fillText(timestamp, x, y);

      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file); // fallback
          }
        },
        "image/jpeg",
        0.92,
      );
    };
    img.src = url;
  });
};

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  label,
  images = [],
  fieldName,
  onUpload,
  onRemove,
  notes,
  onViewAll,
  onViewSingle,
  maxImages,
  showDeleteButton = true
}) => {
  const imageCount = images?.length || 0;
  const canAddMore = !maxImages || imageCount < maxImages;

  // Handler wrapper để xử lý async
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const stampedFile = await addTimestampToImage(file);

    // Tạo synthetic event với file đã có timestamp
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(stampedFile);
    const syntheticEvent = {
      ...event,
      target: { ...event.target, files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>;

    onUpload(fieldName, syntheticEvent);
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
          <div className="flex justify-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id={`camera-capture-${fieldName}`}
            />
            <label
              htmlFor={`camera-capture-${fieldName}`}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex! items-center! justify-center! gap-2 cursor-pointer transition-colors font-medium shadow-sm"
            >
              <FaCamera size={15} />
              Chụp ảnh
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
              <div key={index} className="flex flex-col rounded-lg overflow-hidden border border-blue-500">

                {/* Phần ảnh + nút xóa + số thứ tự */}
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={`${label} ${index + 1}`}
                    className="w-full h-auto object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onViewSingle(imageUrl, `${label} ${index + 1}`)}
                    style={{ pointerEvents: 'auto' }}
                    data-view-image="true"
                  />
                  {showDeleteButton && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                    #{index + 1}
                  </div>
                </div>

                {/* Note gắn với ảnh này */}
                {notes?.[index] && (
                  <div className="text-xs text-gray-600 px-2 py-1 bg-white border-t border-gray-200 italic truncate">
                    {notes[index]}
                  </div>
                )}

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