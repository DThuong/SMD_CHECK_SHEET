import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import changeModelSlice from "./slices/changeModelSlice";
import subTableSlice from "./slices/subTableSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    changeModel: changeModelSlice,
    subTable: subTableSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // tắt warning 
    }),
});

// định nghĩa RootState và AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;