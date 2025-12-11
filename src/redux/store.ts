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
import storage from 'redux-persist/lib/storage'; // localStorage

// Import các reducers
import authReducer from "./slices/authSlice";
import changeModelSlice from "./slices/changeModelSlice";
import subTableSlice from "./slices/subTableSlice";

// Cấu hình persist - CHỈ persist auth slice
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth'], // CHỈ lưu auth vào localStorage
  // blacklist: ['changeModel', 'subTable'], // Không lưu 2 slice này
};

// Combine tất cả reducers
const rootReducer = combineReducers({
  auth: authReducer,
  changeModel: changeModelSlice,
  subTable: subTableSlice,
});

// Tạo persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Tạo store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore các action của redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Tạo persistor
export const persistor = persistStore(store);

// Định nghĩa RootState và AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;