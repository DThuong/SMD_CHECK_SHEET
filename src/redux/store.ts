// src/redux/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from "./slices/authSlice";
import subTableReducer from "./slices/subTableSlice";
import changeModelReducer from "./slices/changeModelSlice";
import FileSliceReducer from "./slices/FileSlice";
import NotificationReducer from "./slices/notificationSlice";
import noteReducer from "./slices/noteSlice";
import planWorkReducer from "./slices/planWorkSlice";
import patrolReducer from "./slices/patrolSlice";
import engReducer from "./slices/engSlice";

import smdApi from "./services/smdApi";
import { setupApiInterceptor } from "./setupApiInterceptor";

// Cấu hình persist
const authPersistConfig = {
  key: 'auth',
  version: 1,
  storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  subTable: subTableReducer, 
  changeModel: changeModelReducer,
  fileSlice: FileSliceReducer,
  planSlice: planWorkReducer,
  notification: NotificationReducer,
  note: noteReducer,
  patrol: patrolReducer,
  eng: engReducer,
});

// Tạo store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // immutableCheck & serializableCheck chỉ chạy ở môi trường dev, nhưng cả hai
      // đều DUYỆT SÂU TOÀN BỘ state ở MỖI lần dispatch. State của app này rất nặng:
      // changeModel.sheets + filteredSheets (tới ~1000 sheet, mỗi sheet kèm 5 bảng
      // con lồng nhau, lưu 2 bản), patrol.sessions, eng.sessions, planSlice.plans.
      // Để mặc định thì mỗi dispatch tốn hàng trăm ms -> import kế hoạch (4 dispatch
      // liên tiếp: upload pending/fulfilled + getPlanWorkByDate pending/fulfilled)
      // quay rất lâu khi chạy dev, dù request đã xong từ lâu.
      //
      // Tắt immutableCheck và giới hạn serializableCheck ở những nhánh nặng nhất.
      // Việc này không đổi hành vi production (RTK đã tự tắt cả hai ở bản build).
      immutableCheck: false,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: [
          'changeModel.sheets',
          'changeModel.filteredSheets',
          'patrol.sessions',
          'patrol.filteredSessionsResult',
          'eng.sessions',
          'eng.filteredSessionsResult',
          'planSlice.plans',
        ],
      },
    }),
});

// Tạo persistor
export const persistor = persistStore(store);

// Setup 401 interceptor SAU KHI store đã tạo xong
setupApiInterceptor(smdApi, store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;