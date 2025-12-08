// quản lý trạng thái authentication
// createSlice: hàm của redux toolkit giúp tạo Slice (gồm reducer + action)
// createAsyncThunk: hàm của redux toolkit giúp tạo action async với các tham số (payloadAction) với các trạng thái (pending, fulfilled, rejected) sinh tự động
// payloadAction: type helper cho action có payload
// axios: thư viện call api
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// định nghĩa kiểu dữ liệu khi post login api
interface LoginRequest {
  username: string;
  password: string;
}

// mô tả kiểu dữ liệu user server trả về. ? nghĩa là field đó có thể không có. response data thực tế được trả về
interface User {
  id?: string;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  token?: string;
}

// authState; lưu trạng thái authentication trong store
interface AuthState {
  user: User;
  token: string;
  loading: boolean;
  error: string;
  isAuthenticated: boolean;
}

// state ban đầu
const initialState: AuthState = {
  user: {},
  token: '',
  loading: false,
  error: '',
  isAuthenticated: false,
};

// tạo async thunk action login để gọi api login
export const loginUser = createAsyncThunk(
  'auth/login', // action type prefix
  async (credentials: LoginRequest, {rejectWithValue}) => {
    try {
      const response = await axios.post('https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api/Account/login', credentials, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        }
      );
      if(response?.data?.token){
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      if(error.response && error.response.data){
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message);
    }
    
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // action logout
    logout(state) {
      state.user = {};
      state.token = '';
      state.isAuthenticated = false;
      state.error = '';
      localStorage.removeItem('token');
    },
    //action để clear error
    clearError(state) {
      state.error = '';
    },

    //action để restore token từ localStorage khi reload trang
    restoreToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.isAuthenticated = true;
    }
  },
  extraReducers: (builder) => {
    // Xử lý các trạng thái của loginUser async thunk
    builder
      // Khi bắt đầu gọi API (pending)
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      // Khi API trả về thành công (fulfilled)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = action.payload.token || null;
        state.error = '';
      })
      // Khi API trả về lỗi (rejected)
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = {};
        state.token = '';
        state.error = action.payload as string || 'Login failed';
      });
  },
})
// export action
export const { logout, clearError, restoreToken } = authSlice.actions;
// export reducer
export default authSlice.reducer;





