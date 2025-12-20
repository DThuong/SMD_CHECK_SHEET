// src/services/smdApi.ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const BASE_URL = "https://172.16.162.103:5000/api";

// ✅ Tạo axios instance cơ bản
const createSmdApi = (): AxiosInstance => {
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
  });

  // REQUEST INTERCEPTOR - Chỉ thêm token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Tự động xử lý FormData
      if (config.data instanceof FormData) {
        // Xóa Content-Type để axios tự set multipart/form-data với boundary
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return api;
};

// Export instance mặc định (chưa có 401 handler)
const smdApi = createSmdApi();

export default smdApi;
export { createSmdApi };