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
  };
}

export const validateLcrFile = (lcrData: LcrFileData | null): LcrValidationResult => {
  if (!lcrData || !lcrData.data) {
    return {
      isValid: false,
      errorMessage: 'Không tìm thấy dữ liệu LCR',
      stats: { total: 0, ok: 0, ng: 0, skip: 0 }
    };
  }

  // 1. Chỉ lấy item đã đo (measure có dữ liệu)
  const validData = lcrData.data.filter(item => {
    const measure = item.measure?.trim() || '';
    return measure !== '';
  });

  // 2. Tính toán stats
  const total = validData.length;
  const ok = validData.filter(item => item.decide === 'OK').length;
  const ng = validData.filter(item => item.decide === 'NG').length;
  const skip = validData.filter(item => item.decide === 'SKIP').length;

  const stats = { total, ok, ng, skip };

  // 3. Kiểm tra các lỗi
  const errorParts: string[] = [];

  if (ng > 0) {
    errorParts.push(`${ng} kết quả NG`);
  }

  if (skip > 0) {
    errorParts.push(`${skip} kết quả SKIP`);
  }

  if (errorParts.length > 0) {
    return {
      isValid: false,
      errorMessage: `File LCR không hợp lệ: ${errorParts.join(', ')}.`,
      stats
    };
  }

  return {
    isValid: true,
    stats
  };
};