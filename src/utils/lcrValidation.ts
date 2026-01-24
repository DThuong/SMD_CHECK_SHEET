// src/utils/lcrValidation.ts
import type { LcrFileData } from '../redux/slices/FileSlice';

export interface LcrValidationResult {
  isValid: boolean;
  errorMessage?: string;
  stats: {
    total: number;
    ok: number;
    ng: number;
    skip: number;
    notMeasured: number; // Số lượng part chưa đo
  };
  notMeasuredParts?: string[]; // Danh sách part code chưa đo
}

export const validateLcrFile = (lcrData: LcrFileData | null): LcrValidationResult => {
  if (!lcrData || !lcrData.data) {
    return {
      isValid: false,
      errorMessage: 'Không tìm thấy dữ liệu LCR',
      stats: { total: 0, ok: 0, ng: 0, skip: 0, notMeasured: 0 }
    };
  }

  // 1. Filter valid data (loại bỏ hidden items - items không cần đo)
  const validData = lcrData.data.filter(item => {
    const range = item.range?.trim() || '';
    const lcrSkip = item.lcrSkip?.trim().toLowerCase() || '';
    return range !== '' && range !== '0.0~0.0' && lcrSkip !== 'skip';
  });

  // 2. Tìm các part CHƯA ĐO (measure rỗng nhưng nằm trong validData)
  const notMeasuredItems = validData.filter(item => {
    const measure = item.measure?.trim() || '';
    return measure === '';
  });

  // 3. Filter data ĐÃ ĐO (có measure)
  const measuredData = validData.filter(item => {
    const measure = item.measure?.trim() || '';
    return measure !== '';
  });

  // 4. Tính toán stats
  const total = measuredData.length;
  const ok = measuredData.filter(item => item.decide === 'OK').length;
  const ng = measuredData.filter(item => item.decide === 'NG').length;
  const skip = measuredData.filter(item => item.decide === 'SKIP').length;
  const notMeasured = notMeasuredItems.length;

  const stats = { total, ok, ng, skip, notMeasured };

  // 5. Tạo danh sách part code chưa đo (unique)
  const notMeasuredParts = Array.from(
    new Set(notMeasuredItems.map(item => item.partCode).filter(Boolean))
  );

  // 6. Kiểm tra các lỗi
  const errorParts: string[] = [];

  // LỖI 1: Có part chưa đo
  if (notMeasured > 0) {
    errorParts.push(`${notMeasured} part chưa đo`);
  }

  // LỖI 2: Có kết quả NG
  if (ng > 0) {
    errorParts.push(`${ng} kết quả NG`);
  }

  // LỖI 3: Có kết quả SKIP
  if (skip > 0) {
    errorParts.push(`${skip} kết quả SKIP`);
  }

  // Nếu có bất kỳ lỗi nào → KHÔNG hợp lệ
  if (errorParts.length > 0) {
    let errorMessage = `File LCR không hợp lệ: ${errorParts.join(', ')}.`;
    
    // Thêm chi tiết part code chưa đo nếu có
    if (notMeasuredParts.length > 0) {
      const maxDisplay = 5;
      const displayParts = notMeasuredParts.slice(0, maxDisplay);
      const remaining = notMeasuredParts.length - maxDisplay;
      
      errorMessage += `\nPart codes chưa đo: ${displayParts.join(', ')}`;
      if (remaining > 0) {
        errorMessage += ` (và ${remaining} part khác)`;
      }
    }

    return {
      isValid: false,
      errorMessage,
      stats,
      notMeasuredParts
    };
  }

  // File hợp lệ
  return {
    isValid: true,
    stats,
    notMeasuredParts: []
  };
};