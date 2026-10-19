/**
 * Nút "Upload X-ray" nằm ở SheetHeader (cạnh LCR / Reflow) nhưng ô upload X-ray
 * lại nằm trong modal của StandardVehicles. Hai component không có quan hệ
 * cha-con, nên dùng một sự kiện trình duyệt để nói chuyện với nhau:
 *   SheetHeader  --(requestOpenXrayUpload)-->  StandardVehicles mở modal + cuộn tới ô X-ray
 */
export const OPEN_XRAY_UPLOAD_EVENT = "smd:open-xray-upload";

export const requestOpenXrayUpload = () => {
  window.dispatchEvent(new CustomEvent(OPEN_XRAY_UPLOAD_EVENT));
};
