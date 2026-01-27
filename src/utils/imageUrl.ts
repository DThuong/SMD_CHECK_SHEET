/**
 * Normalize image URL - Đảm bảo URL không bị duplicate base URL
 */
export const normalizeImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // Nếu URL đã có protocol (http:// hoặc https://) thì return nguyên
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Nếu là relative path thì concat với base URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://172.16.162.103:5000/api';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
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
