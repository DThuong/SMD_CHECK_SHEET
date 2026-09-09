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

/** Khoảng mặc định của Dashboard — rộng hơn Logs/Home một chút để biểu đồ
 *  "30 ngày" không bị cắt ở rìa. */
export const DASHBOARD_RANGE_DAYS = 35;
