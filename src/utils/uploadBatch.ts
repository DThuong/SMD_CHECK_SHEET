import type { NotificationType } from '../components/general/Notification';

/**
 * Thông tin "lô" ảnh khi người dùng chọn nhiều ảnh một lúc.
 * MultiImageUpload upload lần lượt từng ảnh và truyền kèm vị trí của ảnh trong lô.
 */
export interface UploadBatchInfo {
  /** Vị trí ảnh hiện tại trong lô, bắt đầu từ 0 */
  index: number;
  /** Tổng số ảnh trong lô */
  total: number;
}

export interface UploadBatchTracker {
  success: number;
  fail: number;
  /** Câu thông báo thành công của lần upload gần nhất (vd: "Upload hình ảnh SPI thành công") */
  message: string;
}

export const createUploadBatchTracker = (): UploadBatchTracker => ({
  success: 0,
  fail: 0,
  message: '',
});

/** Gọi ở đầu mỗi lần upload: ảnh đầu tiên của lô (hoặc upload lẻ) thì đếm lại từ 0. */
export const beginUploadBatch = (
  tracker: UploadBatchTracker,
  batch?: UploadBatchInfo,
): UploadBatchTracker => {
  if (!batch || batch.index === 0) {
    tracker.success = 0;
    tracker.fail = 0;
    tracker.message = '';
  }
  return tracker;
};

/**
 * Gọi ở cuối mỗi lần upload. Chỉ hiện thông báo khi đã xong ẢNH CUỐI của lô,
 * nên chọn 5 ảnh chỉ hiện MỘT thông báo tổng thay vì 5 thông báo.
 * Upload lẻ (không có batch hoặc total = 1) thì hiện y như trước.
 */
export const reportUploadBatch = (
  tracker: UploadBatchTracker,
  batch: UploadBatchInfo | undefined,
  showNotification: (type: NotificationType, title: string, message?: string) => void,
) => {
  if (batch && batch.index < batch.total - 1) return; // chưa tới ảnh cuối

  const { success, fail } = tracker;
  if (success === 0 && fail === 0) return;

  const total = success + fail;
  const successMessage = tracker.message || 'Upload hình ảnh thành công';

  if (fail === 0) {
    showNotification(
      'success',
      'Thành công',
      total > 1 ? `${successMessage} (${success} ảnh)` : successMessage,
    );
  } else if (success === 0) {
    showNotification(
      'error',
      'Lỗi upload',
      total > 1
        ? `Upload thất bại cả ${fail} ảnh`
        : 'Có lỗi xảy ra khi upload hình ảnh',
    );
  } else {
    showNotification(
      'warning',
      'Upload chưa hoàn tất',
      `Thành công ${success}/${total} ảnh, lỗi ${fail} ảnh. Vui lòng upload lại các ảnh bị lỗi.`,
    );
  }
};
