// quản lý trạng thái authentication
// createSlice: hàm của redux toolkit giúp tạo Slice (gồm reducer + action)
// createAsyncThunk: hàm của redux toolkit giúp tạo action async với các tham số (payloadAction) với các trạng thái (pending, fulfilled, rejected) sinh tự động
// payloadAction: type helper cho action có payload
// axios: thư viện call api
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  id?: string;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  lastActivity: number | null; // Track thời gian hoạt động cuối
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  lastActivity: null,
};

// API login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        'https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api/Account/login',
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      // Set flag để hiển thị notification
      try {
        sessionStorage.setItem("justLoggedIn", "1");
      } catch (error) {
        console.error('Failed to set session storage:', error);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        // Xử lý error message từ server
        const errorMessage = error.response.data.message || error.response.data;
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.lastActivity = null;
      // xóa token khỏi localStorage
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem("justLoggedIn");
      } catch (error) {
        console.error('Failed to remove storage:', error);
      }
    },
    
    clearError(state) {
      state.error = null;
    },

    // Update activity timestamp
    updateActivity(state) {
      state.lastActivity = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = action.payload.token || null;
        state.error = null;
        state.lastActivity = Date.now();
        // backup lưu token vào localstorage
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string || 'Login failed';
        state.lastActivity = null;
        try {
          localStorage.removeItem('token');
        } catch(error) {
          console.error('Failed to remove storage:', error);
        }
      })
      
  },
});

export const { logout, clearError, updateActivity } = authSlice.actions;
export default authSlice.reducer;





