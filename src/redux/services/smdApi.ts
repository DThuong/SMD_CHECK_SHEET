// src/redux/api/smdApi.ts
import axios from "axios";
import { store } from "../store"; // Import store trực tiếp
import { logoutUser } from "../slices/authSlice";

const BASE_URL = "https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api/";

// Tạo axios instance
const smdApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
});

// REQUEST INTERCEPTOR - Thêm token vào header
smdApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR - Xử lý 401
smdApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Xử lý lỗi 401 - Token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - Token invalid/expired');
      
      // Dùng store.dispatch thay vì hook
      await store.dispatch(logoutUser());
      
      // Xóa token
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiresAt');
      sessionStorage.removeItem('justLoggedIn');
      
      // Redirect về login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Export api functions
export const AccountApi = {
  login: (username: string, password: string, deviceInfo: string) => 
    smdApi.post('Account/login', { username, password, deviceInfo }),
};

export default smdApi;