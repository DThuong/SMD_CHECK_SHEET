// quản lý trạng thái authentication
// createSlice: hàm của redux toolkit giúp tạo Slice (gồm reducer + action)
// createAsyncThunk: hàm của redux toolkit giúp tạo action async với các tham số (payloadAction) với các trạng thái (pending, fulfilled, rejected) sinh tự động
// payloadAction: type helper cho action có payload
// axios: thư viện call api
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface LoginRequest {
  username: string;
  password: string;
  deviceInfo: string;
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
  tokenExpiresAt: number | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  lastActivity: null,
  tokenExpiresAt: null,
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
        const errorData = error.response.data;
        
        // Nếu error là object, lấy message hoặc title
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : errorData.title || errorData.message || 'Đăng nhập thất bại';
        
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

// API logout
export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  try {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token || localStorage.getItem('token');
    const response = await axios.post(
      'https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api/Account/logout',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    return error.message;
  }
})


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
      state.tokenExpiresAt = null;
      // xóa token khỏi localStorage
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
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

        const expiresAtTimestamp = new Date(action.payload.expiresAt).getTime();
        state.tokenExpiresAt = expiresAtTimestamp;
        state.lastActivity = Date.now();
        // backup lưu token vào localstorage
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('tokenExpiresAt', expiresAtTimestamp.toString()); // LƯU THỜI GIAN HẾT HẠN
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string || 'Login failed';
        state.lastActivity = null;
        state.tokenExpiresAt = null;
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiresAt');
        } catch(error) {
          console.error('Failed to remove storage:', error);
        }
      })
      
      //logout
    .addCase(logoutUser.pending, (state) => {
      state.loading = true;
    })
    .addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.lastActivity = null;
      state.tokenExpiresAt = null;
      // Xóa token khỏi localStorage
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt'); 
        sessionStorage.removeItem("justLoggedIn");
      } catch (error) {
        console.error('Failed to remove storage:', error);
      }
    })
    .addCase(logoutUser.rejected, (state, action) => {
      state.loading = false;
      // Vẫn logout ở client dù API failed
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.lastActivity = null;
      state.tokenExpiresAt = null;
      state.error = action.payload as string || 'Logout failed';
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        sessionStorage.removeItem("justLoggedIn");
      } catch (error) {
        console.error('Failed to remove storage:', error);
      }
    });
  },
});

export const { logout, clearError, updateActivity } = authSlice.actions;
export default authSlice.reducer;





