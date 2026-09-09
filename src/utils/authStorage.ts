// src/utils/authStorage.ts
/**
 * Xóa dữ liệu phiên đăng nhập khỏi trình duyệt.
 *
 * TRƯỚC ĐÂY mọi chỗ đăng xuất đều gọi thẳng localStorage.clear() — xóa sạch cả
 * những thiết lập không liên quan tới đăng nhập, đáng chú ý nhất là 'appLanguage',
 * nên cứ hết phiên là giao diện tự nhảy về tiếng Việt.
 *
 * Nay chỉ xóa những gì thuộc về phiên, giữ lại các thiết lập của máy trạm.
 */
const PRESERVED_KEYS = [
  'smd_device_id',        // ID thiết bị — bắt buộc giữ
  'appLanguage',          // ngôn ngữ người dùng đã chọn
  'admin-theme',          // giao diện sáng/tối
  'sidebar_collapsed',
  'admin_sidebar_collapsed',
];

export const clearAuthStorage = (): void => {
  try {
    const preserved: Array<[string, string]> = [];
    for (const key of PRESERVED_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) preserved.push([key, value]);
    }

    localStorage.clear();

    for (const [key, value] of preserved) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn('clearAuthStorage: không xóa được localStorage', error);
  }

  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn('clearAuthStorage: không xóa được sessionStorage', error);
  }
};
