// src/services/patrolApi.ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const BASE_URL = import.meta.env.VITE_API_PATROL;

const clearAuthAndRedirect = () => {
  localStorage.clear();
  sessionStorage.clear();
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

const patrolApi = createPatrolApi();

export default patrolApi;
export { createPatrolApi };