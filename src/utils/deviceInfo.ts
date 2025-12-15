// src/utils/deviceInfo.ts

/**
 * ✅ TẠO DEVICE ID CỐ ĐỊNH CHO TỪNG MÁY
 * Device ID sẽ được lưu vào localStorage và KHÔNG ĐỔI giữa các lần login
 */
export const getDeviceInfo = (): string => {
  try {
    const DEVICE_ID_KEY = 'smd_device_id';
    
    // ✅ 1. Kiểm tra xem thiết bị này đã có ID chưa
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // ✅ 2. Chưa có → Tạo ID mới và lưu vĩnh viễn
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      deviceId = `device_${timestamp}_${random}`;
      
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('Device ID mới được tạo:', deviceId);
    } else {
      console.log('Device ID đã tồn tại:', deviceId);
    }
    
    // ✅ 3. Thêm thông tin mô tả (không ảnh hưởng đến uniqueness)
    const deviceDesc = getDetailedDeviceInfo();
    
    return `${deviceId}|${deviceDesc}`;
    
  } catch (error) {
    console.error('❌ Error getting device info:', error);
    // Fallback: tạo ID tạm thời
    return `device_temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
};

/**
 * Lấy thông tin thiết bị chi tiết (chỉ để mô tả, không dùng làm ID)
 */
export const getDetailedDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  let deviceType = 'Unknown';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect Browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  // Detect Device Type
  if (ua.includes('Mobile')) deviceType = 'Mobile';
  else if (ua.includes('Tablet')) deviceType = 'Tablet';
  else deviceType = 'Desktop';

  return `${deviceType}_${os}_${browser}`;
};

/**
 * ✅ FORCE CLEAR DEVICE ID (dùng khi cần reset thiết bị)
 */
export const clearDeviceId = (): void => {
  try {
    localStorage.removeItem('smd_device_id');
    console.log('Device ID đã được xóa');
  } catch (error) {
    console.error('❌ Lỗi khi xóa Device ID:', error);
  }
};