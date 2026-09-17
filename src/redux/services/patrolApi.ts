// src/services/patrolApi.ts
import axios from "axios";
import type { AxiosInstance } from "axios";
import { clearAuthStorage } from "../../utils/authStorage";
import { attachDiagnostics, logSlowResponse, markRequestStart, pickTimeout } from "../../utils/apiError";

const BASE_URL = import.meta.env.VITE_API_PATROL;

const clearAuthAndRedirect = () => {
  clearAuthStorage();
  window.location.href = "/login";
};

const createPatrolApi = (): AxiosInstance => {
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
  });

  // REQUEST INTERCEPTOR
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      // TIMEOUT NGẮN THEO MẶC ĐỊNH, tự nới cho upload/tải file/parse Excel.
      //
      // TRƯỚC ĐÂY không đặt timeout, mà mặc định của axios là 0 = CHỜ VÔ HẠN.
      // Một request không bao giờ được trả lời sẽ để cờ loading bật mãi — người
      // dùng thấy trang "quay loading" không hồi kết và không có cách nào thoát
      // ngoài rời trang rồi vào lại. Nay chạm mốc là thunk rejected, spinner
      // tắt, toast nói rõ nguyên nhân. Xem pickTimeout trong utils/apiError.
      config.timeout = pickTimeout(config);
      markRequestStart(config);

      return config;
    },
    (error) => Promise.reject(error)
  );

  // RESPONSE INTERCEPTOR - Xử lý 401
  api.interceptors.response.use(
    (response) => {
      // Request trả về được nhưng chậm bất thường vẫn cần được ghi lại — nó là
      // cảnh báo sớm, trước khi chạm timeout và thành lỗi thật.
      logSlowResponse(response);
      return response;
    },
    (error) => {
      // Biến lỗi thành thông báo NÓI RÕ NGUYÊN NHÂN trước khi ném lên thunk.
      // Nhờ vậy mọi `error.response?.data?.message` sẵn có trong các slice đều
      // nhận được chẩn đoán, không phải sửa từng thunk một.
      attachDiagnostics(error);

      if (error.response?.status === 401) {
        clearAuthAndRedirect();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const patrolApi = createPatrolApi();

export default patrolApi;
export { createPatrolApi };