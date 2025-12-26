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