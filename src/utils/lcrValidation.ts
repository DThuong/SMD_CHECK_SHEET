// src/utils/lcrValidation.ts
import type { LcrFileData, LcrDataItem } from '../redux/slices/FileSlice';

export interface LcrValidationResult {
  isValid: boolean;
  errorMessage?: string;
  /** Danh sách lỗi chi tiết (mỗi dòng 1 lỗi) */
  errors: string[];
  stats: {
    total: number;       // Tổng item hợp lệ (giống "Total" trên LCR Full View)
    ok: number;
    ng: number;
    skip: number;        // Tổng Decide = SKIP (kể cả có/không có Measure)
    skipNoMeasure: number; // Decide = SKIP và Measure rỗng
    notMeasured: number; // Measure rỗng (chưa đo)
    passRate: number;    // ok / total * 100
  };
}

const norm = (v: unknown) => String(v ?? '').trim();
const isEmptyVal = (v: unknown) => {
  const s = norm(v);
  return s === '' || s === '-';
};

/**
 * Item được tính vào thống kê — PHẢI giống hệt filter trong LCRFullTable
 * để Pass Rate trên màn hình và khi ký là một.
 */
export const isLcrItemCounted = (item: LcrDataItem): boolean => {
  const range = norm(item.range);
  const lcrSkip = norm(item.lcrSkip).toLowerCase();
  return range !== '' && range !== '0.0~0.0' && lcrSkip !== 'skip';
};

const formatLocs = (items: LcrDataItem[], max = 10) => {
  const locs = items.map(i => norm(i.loc) || '?');
  return locs.length > max
    ? `${locs.slice(0, max).join(', ')}, ... (+${locs.length - max})`
    : locs.join(', ');
};

const EMPTY_STATS = { total: 0, ok: 0, ng: 0, skip: 0, skipNoMeasure: 0, notMeasured: 0, passRate: 0 };

/**
 * Điều kiện tiên quyết: Pass Rate = 100% (tất cả item có Measure và Decide khác SKIP/NG/rỗng).
 * Bất kỳ item nào không đạt => file không hợp lệ, PQCLeader KHÔNG được ký.
 */
export const validateLcrFile = (lcrData: LcrFileData | null): LcrValidationResult => {
  if (!lcrData || !Array.isArray(lcrData.data)) {
    const msg = 'Không tìm thấy dữ liệu LCR';
    return { isValid: false, errorMessage: msg, errors: [msg], stats: { ...EMPTY_STATS } };
  }

  // 1. Lấy item hợp lệ (KHÔNG lọc bỏ item chưa đo nữa — đó là lỗ hổng cũ)
  const validData = lcrData.data.filter(isLcrItemCounted);
  const total = validData.length;

  const decideOf = (i: LcrDataItem) => norm(i.decide).toUpperCase();
  const noMeasure = (i: LcrDataItem) => isEmptyVal(i.measure);

  // Item PASS: Measure có giá trị VÀ Decide khác SKIP / NG / rỗng
  const isPass = (i: LcrDataItem) => {
    const d = decideOf(i);
    return !noMeasure(i) && d !== '' && d !== '-' && d !== 'SKIP' && d !== 'NG';
  };
  const okItems = validData.filter(isPass);
  const ngItems = validData.filter(i => decideOf(i) === 'NG');
  const skipItems = validData.filter(i => decideOf(i) === 'SKIP');
  // Case 1: Decide = SKIP và Measure rỗng
  const skipNoMeasureItems = skipItems.filter(noMeasure);
  // Case 2: Chưa đo — Measure rỗng (không xét cột LCR Skip)
  const notMeasuredItems = validData.filter(noMeasure);
  const notMeasuredOnlyItems = notMeasuredItems.filter(i => decideOf(i) !== 'SKIP' && decideOf(i) !== 'NG');

  const ok = okItems.length;
  const passRate = total > 0 ? (ok / total) * 100 : 0;

  const stats = {
    total,
    ok,
    ng: ngItems.length,
    skip: skipItems.length,
    skipNoMeasure: skipNoMeasureItems.length,
    notMeasured: notMeasuredItems.length,
    passRate: Math.round(passRate * 10) / 10,
  };

  // 2. Log lỗi
  const errors: string[] = [];

  if (total === 0) {
    errors.push('File LCR không có dữ liệu hợp lệ để kiểm tra.');
  }
  if (skipNoMeasureItems.length > 0) {
    errors.push(`${skipNoMeasureItems.length} item Decide = SKIP nhưng chưa có Measure: ${formatLocs(skipNoMeasureItems)}`);
  }
  const skipWithMeasure = skipItems.length - skipNoMeasureItems.length;
  if (skipWithMeasure > 0) {
    errors.push(`${skipWithMeasure} item có kết quả SKIP: ${formatLocs(skipItems.filter(i => !noMeasure(i)))}`);
  }
  if (notMeasuredOnlyItems.length > 0) {
    errors.push(`${notMeasuredOnlyItems.length} item chưa đo (Measure rỗng, Decide rỗng): ${formatLocs(notMeasuredOnlyItems)}`);
  }
  if (ngItems.length > 0) {
    errors.push(`${ngItems.length} kết quả NG: ${formatLocs(ngItems)}`);
  }

  // 3. Điều kiện tiên quyết: Pass Rate phải = 100%.
  //    Nếu chưa đạt mà không rơi vào các case trên => lỗi chung.
  if (total > 0 && ok !== total && errors.length === 0) {
    const others = validData.filter(i => !okItems.includes(i));
    errors.push(`Vui lòng kiểm tra LCR file có dữ liệu chưa hợp lệ (${others.length} item): ${formatLocs(others)}`);
  }

  if (errors.length > 0 || ok !== total || total === 0) {
    return {
      isValid: false,
      errorMessage: `File LCR không hợp lệ — Pass Rate ${stats.passRate.toFixed(1)}% (yêu cầu 100%).\n- ${errors.join('\n- ')}`,
      errors,
      stats,
    };
  }

  return { isValid: true, errors: [], stats };
};
