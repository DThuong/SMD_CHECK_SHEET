// src/redux/setupApiInterceptor.ts
import type { AxiosInstance } from "axios";
import type { Store } from "@reduxjs/toolkit";
import { logout } from "./slices/authSlice";

// Biến flag để tránh gọi logout nhiều lần
let isLoggingOut = false;

/**
 * Setup 401 interceptor cho smdApi
 * Gọi HÀM NÀY SAU KHI store đã được tạo
 */
export const setupApiInterceptor = (api: AxiosInstance, store: Store) => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      // ✅ Chỉ xử lý 401
      if (error.response?.status === 401) {
        
        // ✅ Tránh gọi logout nhiều lần (khi nhiều API 401 cùng lúc)
        if (isLoggingOut) {
          return Promise.reject(error);
        }
        
        isLoggingOut = true;
        console.warn('🔒 401 Unauthorized - Token không hợp lệ, đang logout...');
        
        try {
          // 1. Dispatch logout (đã clear storage + persist bên trong reducer)
          store.dispatch(logout());
          
          // 2. Redirect về login
          window.location.href = '/login';
          
        } catch (logoutError) {
          console.error('❌ Lỗi khi logout:', logoutError);
        } finally {
          // Reset flag sau 1s để cho phép logout lại nếu cần
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
        
        return Promise.reject(error);
      }
      
      // Các lỗi khác (500, 404...) không xử lý
      return Promise.reject(error);
    }
  );
};