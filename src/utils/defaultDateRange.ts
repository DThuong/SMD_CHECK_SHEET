// src/utils/defaultDateRange.ts
/**
 * Khoảng ngày mặc định cho các màn hình danh sách sheet.
 *
 * LÝ DO: backend hiện chưa phân trang — GET /ChangeModel trả về TOÀN BỘ sheet
 * kèm 5 bảng con lồng nhau (~4000 bản ghi và tăng dần mỗi ngày). Mở trang mặc
 * định mà tải tất cả thì càng ngày càng chậm.
 *
 * Nên mặc định chỉ tải 30 ngày gần nhất — đủ cho toàn bộ công việc ký hằng ngày —
 * và luôn có nút "Xem tất cả" để lấy đầy đủ khi cần tra cứu lịch sử.
 *
 * Khi backend phân trang xong thì bỏ file này và chuyển sang page/pageSize.
 */
export const DEFAULT_RANGE_DAYS = 30;

/** Định dạng Date thành chuỗi input datetime-local: YYYY-MM-DDTHH:mm */
const toDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

/** Khoảng mặc định: từ 00:00 của N ngày trước tới 23:59 hôm nay. */
export const getDefaultDateRange = (
  days: number = DEFAULT_RANGE_DAYS,
): { fromDate: string; toDate: string } => {
  const to = new Date();
  to.setHours(23, 59, 0, 0);

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  return { fromDate: toDateTimeLocal(from), toDate: toDateTimeLocal(to) };
};

/**
 * Đổi chuỗi datetime-local (YYYY-MM-DDTHH:mm) sang định dạng backend đang dùng
 * cho ChangeModel/filterAll: MM-DD-YYYY HH:mm
 */
export const toApiDateTime = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  const date = new Date(datetimeLocal);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};

/* ==================== KHOẢNG THỜI GIAN CỦA DASHBOARD ====================
 *
 * Dashboard có 3 lựa chọn: "7 ngày" / "30 ngày" / "Tất cả".
 * Mỗi lựa chọn TẢI VỀ ĐÚNG khoảng đó, thay vì tải dư một cửa sổ cố định rồi
 * lọc lại ở client. Nhờ vậy thẻ số liệu (card) và biểu đồ luôn nói về cùng
 * một khoảng thời gian.
 *
 * TRƯỚC ĐÂY: một hằng số duy nhất DASHBOARD_RANGE_DAYS = 35 (30 + 5 ngày đệm
 * tùy ý). Cả "7 ngày" lẫn "30 ngày" đều dùng chung cửa sổ 35 ngày này, mà card
 * lại đọc thẳng state `sheets` không qua bộ lọc — nên bấm 7 hay 30 ngày card
 * vẫn hiện y hệt nhau; chỉ "Tất cả" mới đổi vì nó gọi API khác.
 *
 * LƯU Ý: 7 ngày và 30 ngày LỒNG nhau chứ không cộng dồn — 30 ngày đã bao trùm
 * 7 ngày, nên không cần cửa sổ 37 ngày.
 */
export const DASHBOARD_WEEK_DAYS = 7;
export const DASHBOARD_MONTH_DAYS = 30;

export type DashboardRange = 'week' | 'month' | 'all';

/** Số ngày ứng với lựa chọn trên thanh lọc; 'all' → null (không giới hạn). */
export const getRangeDays = (range: DashboardRange): number | null =>
  range === 'week'
    ? DASHBOARD_WEEK_DAYS
    : range === 'month'
      ? DASHBOARD_MONTH_DAYS
      : null;

/**
 * Mốc cắt dưới của khoảng đang chọn — 00:00 của N ngày trước; null nếu 'all'.
 *
 * Dùng cộng trừ NGÀY, không dùng setMonth(x - 1): setMonth bị tràn tháng —
 * ngày 31/03 lùi 1 tháng ra 03/03 chứ không phải 01/03, vì tháng 2 không có
 * ngày 31.
 */
export const getRangeCutoff = (range: DashboardRange): Date | null => {
  const days = getRangeDays(range);
  if (days === null) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
};
