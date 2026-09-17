/**
 * BỀ RỘNG ẢNH DÙNG TRONG APP.
 *
 * Backend nhận query `?w=` trên mọi endpoint lấy ảnh theo fileName và trả về bản
 * đã resize (giới hạn 5–2300 px). Dùng đúng ba mốc này ở mọi nơi thay vì tính
 * theo kích thước phần tử: mỗi giá trị w sinh một bản cache riêng trên server,
 * nên số mốc càng ít thì cache càng hiệu quả.
 *
 * Vì sao phải làm: ảnh gốc là 1920×2560, nặng ~1.8 MB và chiếm ~18.75 MB RAM sau
 * khi trình duyệt giải nén (rộng × cao × 4 byte). Một trang chi tiết sheet có
 * tới 15 ảnh — gần 27 MB tải về và ~280 MB RAM. Đó là lý do khung ảnh bị đen
 * trên máy trạm ít RAM và mạng yếu.
 */
export const IMAGE_WIDTH = {
  /** Thumbnail 64px trong modal xem ảnh. */
  thumb: 200,
  /** Ô ảnh ~128px trong gallery của sheet. */
  gallery: 800,
  /** Ảnh chính trong modal xem chi tiết. */
  full: 1600,
} as const;

export type ImageWidth = (typeof IMAGE_WIDTH)[keyof typeof IMAGE_WIDTH];

/** Gắn (hoặc thay) query `w` vào một URL ảnh. */
const withWidth = (url: string, width?: number): string => {
  if (!width || !url) return url;
  return `${url}${url.includes('?') ? '&' : '?'}w=${width}`;
};

/**
 * Normalize image URL - Đảm bảo URL không bị duplicate base URL.
 *
 * Truyền `width` để lấy bản đã resize. Bỏ trống thì nhận ảnh gốc — chỉ nên dùng
 * khi người dùng zoom vượt 100% và thật sự cần từng pixel.
 */
export const normalizeImageUrl = (
  url: string | undefined,
  width?: number,
): string => {
  if (!url) return '';

  // Nếu URL đã có protocol (http:// hoặc https://) thì return nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return withWidth(url, width);
  }

  // Nếu là relative path thì concat với base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://172.16.162.103:5000/api';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return withWidth(`${baseUrl}${cleanUrl}`, width);
};

/**
 * Kiểm tra xem URL có phải là full URL không
 */
export const isFullUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Extract filename from full URL or path
 * Input: "http://172.16.162.103:5001/api/CheckModel/image-issue/13337/d66908d3-9e16-4644-a05e-f5aaeb3d3ccd.png"
 * Output: "d66908d3-9e16-4644-a05e-f5aaeb3d3ccd.png"
 */
export const extractFileName = (url: string): string => {
  if (!url) return '';
  
  // Split by '/' and get last part
  const parts = url.split('/');
  return parts[parts.length - 1];
};

/**
 * Extract filename without extension
 * Input: "d66908d3-9e16-4644-a05e-f5aaeb3d3ccd.png"
 * Output: "d66908d3-9e16-4644-a05e-f5aaeb3d3ccd"
 */
export const extractFileNameWithoutExt = (url: string): string => {
  const fileName = extractFileName(url);
  return fileName.split('.')[0];
};
