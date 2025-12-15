// src/redux/setupApiInterceptor.ts
import type { AxiosInstance } from "axios";
import type { Store } from "@reduxjs/toolkit";
import { logout } from "./slices/authSlice";

let isLoggingOut = false;

export const setupApiInterceptor = (api: AxiosInstance, store: Store) => {
  
  // ✅ REQUEST INTERCEPTOR - Check mỗi khi gọi API
  api.interceptors.request.use(
    (config) => {
      const state = store.getState() as { auth: any };
      const reduxToken = state.auth.token;
      const localToken = localStorage.getItem('token');
      
      // ✅ CRITICAL CHECK: Token mismatch
      if (reduxToken && localToken && reduxToken !== localToken) {
        console.warn('⚠️ REQUEST INTERCEPTOR: Token mismatch detected!');
        console.log('Redux token:', reduxToken.substring(0, 20) + '...');
        console.log('Local token:', localToken.substring(0, 20) + '...');
        
        if (!isLoggingOut) {
          isLoggingOut = true;
          
          const deviceId = localStorage.getItem('smd_device_id');
          localStorage.clear();
          sessionStorage.clear();
          if (deviceId) {
            localStorage.setItem('smd_device_id', deviceId);
          }
          
          store.dispatch(logout());
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        
        return Promise.reject(new Error('Token mismatch - Logged out'));
      }
      
      // Thêm token vào header
      if (localToken) {
        config.headers.Authorization = `Bearer ${localToken}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ✅ RESPONSE INTERCEPTOR - Xử lý 401
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.warn('🔒 RESPONSE INTERCEPTOR: 401 Unauthorized - Token không hợp lệ');
        
        if (isLoggingOut) {
          return Promise.reject(error);
        }
        
        isLoggingOut = true;
        
        try {
          const deviceId = localStorage.getItem('smd_device_id');
          localStorage.clear();
          sessionStorage.clear();
          if (deviceId) {
            localStorage.setItem('smd_device_id', deviceId);
          }
          
          store.dispatch(logout());
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        } catch (logoutError) {
          console.error('❌ Logout error:', logoutError);
        } finally {
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
        
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );
};