// Tạo device fingerprint dựa trên thông tin trình duyệt
export const getDeviceInfo = (): string => {
  try {
    const navigator = window.navigator;
    const screen = window.screen;
    
    // Thu thập các thông tin có sẵn
    const deviceData = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().getTime()
    };

    // Tạo một chuỗi mô tả thiết bị
    const deviceString = `${deviceData.platform}_${deviceData.screenResolution}_${deviceData.userAgent}`;
    
    // Hoặc tạo một hash đơn giản ngắn gọn
    const deviceHash = simpleHash(deviceString);
    
    return `Device_${deviceHash}_${deviceData.platform}`;
  } catch (error) {
    console.error('Error getting device info:', error);
    return `Device_Unknown_${new Date().getTime()}`;
  }
};

// Hàm hash
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Lấy thông tin thiết bị chi tiết hơn (tùy chọn)
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

  return `${deviceType}_${os}_${browser}_${new Date().getTime()}`;
};