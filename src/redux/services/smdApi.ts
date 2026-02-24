// src/services/smdApi.ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://172.16.162.123:5000/api";

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('persist:auth');
  sessionStorage.clear();
  window.location.href = "/login";
};

const createSmdApi = (): AxiosInstance => {
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
      return config;
    },
    (error) => Promise.reject(error)
  );

  // RESPONSE INTERCEPTOR - Xử lý 401
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearAuthAndRedirect();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const smdApi = createSmdApi();

export default smdApi;
export { createSmdApi };