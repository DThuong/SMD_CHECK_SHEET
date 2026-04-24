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
import NotificationReducer from "./slices/notificationSlice"; // thông báo của UI
import noteReducer from "./slices/noteSlice";
import planWorkReducer from "./slices/planWorkSlice";

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
});

// Tạo store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Tạo persistor
export const persistor = persistStore(store);

// Setup 401 interceptor SAU KHI store đã tạo xong
setupApiInterceptor(smdApi, store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;