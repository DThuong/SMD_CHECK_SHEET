import { IoEyeSharp } from "react-icons/io5";
import { FaEyeSlash } from "react-icons/fa";
import { normalizeImageUrl } from "../../utils/imageUrl";

// Component để hiển thị icon xem hình

const ImageViewIcon = ({ 
  imageUrl, 
  title, 
  onView,
}: { 
  imageUrl: string | undefined; 
  title: string; 
  onView: (url: string, title: string) => void;
}) => {
  if (!imageUrl) {
    return <FaEyeSlash className="text-gray-400" size={20} title="Chưa có hình ảnh" />;
  }
  const finalUrl = normalizeImageUrl(imageUrl);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onView(finalUrl, title);
      }}
      className="text-blue-600 hover:text-blue-800 transition-colors"
      data-view-image="true"
      title="Xem hình ảnh"
    >
      <IoEyeSharp size={20} />
    </button>
  );
};

export default ImageViewIcon;