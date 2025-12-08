import { configureStore } from '@reduxjs/toolkit';
import {useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import smdReducer from './slices/smdSlice';
import { smdApi } from './services/smdApi';

/**
 * 🏪 STORE - Kho chứa toàn bộ state của ứng dụng
 * 
 * Giải thích:
 * - configureStore: Hàm tạo store từ Redux Toolkit
 * - reducer: Các slice (phần state) của ứng dụng
 * - middleware: Thêm các middleware (như RTK Query)
 */
export const store = configureStore({
  reducer: {
    // ✅ Thêm các reducer vào đây
    auth: authReducer,           // State cho authentication
    smd: smdReducer,             // State cho SMD sheets
    [smdApi.reducerPath]: smdApi.reducer,  // RTK Query API
  },
  // ✅ Middleware cho RTK Query (auto handle caching, refetching...)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(smdApi.middleware),
});

// ✅ Export types để sử dụng với TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ✅ Custom hooks với TypeScript
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;