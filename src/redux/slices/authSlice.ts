// quản lý trạng thái authentication
// createSlice: hàm của redux toolkit giúp tạo Slice (gồm reducer + action)
// createAsyncThunk: hàm của redux toolkit giúp tạo action async với các tham số (payloadAction) với các trạng thái (pending, fulfilled, rejected) sinh tự động
// payloadAction: type helper cho action có payload
// axios: thư viện call api
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import smdApi from '../services/smdApi';
import axios from 'axios';

interface LoginRequest {
  username: string;
  password: string;
  deviceInfo: string;
}

export interface AuthUser {
  id?: number;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string;
  token?: string;
  isActive?: boolean;
  expiresAt?: string;
}

export interface AccountUser {
  id: number;
  username: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

export interface UpdateUserRequest {
  id: number;
  role: string;
  isActive: boolean;
  fullName: string;
  phoneNumber: string;
}

export interface ChangePasswordRequest {
  accountId: number;
  newPassword: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  tokenExpiresAt: number | null;
  users: AccountUser[];
  selectedUser: AccountUser | null;
  usersLoading: boolean;
  usersError: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  tokenExpiresAt: null,
  users: [],
  selectedUser: null,
  usersLoading: false,
  usersError: null,
};

// API login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // Clear toàn bộ storage CỦA THIẾT BỊ HIỆN TẠI trước khi login
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.error('Failed to clear storage:', error);
      }

      const response = await axios.post(
        `${import.meta.env.BASE_URL}/Account/login`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      // Lưu token mới (localStorage đã sạch)
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      // Set flag notification
      try {
        sessionStorage.setItem("justLoggedIn", "1");
      } catch (error) {
        console.error('Failed to set session storage:', error);
      }
      
      return response.data;
    } catch (error: any) {
      // Nếu login thất bại, cũng clear storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Failed to clear storage on error:', e);

        
      }

      if (error.response && error.response.data) {
        const errorData = error.response.data;
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
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const response = await smdApi.post('/Account/logout');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Logout failed');
  }
});

// API danh sách người dùng (dùng cho admin)
export const fetchUsers = createAsyncThunk(
  'auth/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await smdApi.get('/Account');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }
);

// API lấy người dùng theo id (dùng cho admin)
export const fetchUserById = createAsyncThunk(
  'auth/fetchUserById',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`/Account/${userId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user');
    }
  }
);

// API cập nhật người dùng (dùng cho admin)
export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (userData: UpdateUserRequest, { rejectWithValue }) => {
    try {
      // Chuẩn bị data theo format API yêu cầu
      const updateData = {
        role: userData.role,
        isActive: userData.isActive,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber
      };
      
      const response = await smdApi.put(`/Account/${userData.id}`, updateData);
      return { ...response.data, id: userData.id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update user');
    }
  }
);

// API xóa người dùng theo id (dùng cho admin)
export const deleteUser = createAsyncThunk(
  'auth/deleteUser',  
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.delete(`/Account/${userId}`);
      return { userId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete user');
    }
  }
);

// API thay đổi mật khẩu người dùng (dùng cho admin)
export const changePasswordByAdmin = createAsyncThunk(
  'auth/changePasswordByAdmin',
  async (passwordData: ChangePasswordRequest, { rejectWithValue }) => {
    try {
      const response = await smdApi.put('/Account/change-password-by-admin', passwordData);
      return { accountId: passwordData.accountId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to change password');
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
      state.tokenExpiresAt = null;
      state.users = [];
      state.selectedUser = null;
      // xóa token khỏi localStorage
      try {
        // Lưu device ID trước khi clear
        const deviceId = localStorage.getItem('smd_device_id');
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Khôi phục device ID
        if (deviceId) {
          localStorage.setItem('smd_device_id', deviceId);
        }
      } catch (error) {
        console.error('Failed to clear storage:', error);
      }
    },
    
    clearError(state) {
      state.error = null;
      state.usersError = null;
    },

    clearSelectedUser(state) {
      state.selectedUser = null;
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
        
        // Lưu token (localStorage đã được clear trong thunk)
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('tokenExpiresAt', expiresAtTimestamp.toString());
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string || 'Login failed';
        state.tokenExpiresAt = null;
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiresAt');
        } catch(error) {
          console.error('Failed to remove storage:', error);
        }
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.tokenExpiresAt = null;
        state.users = [];
        state.selectedUser = null;
        // Xóa token khỏi localStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
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
        state.tokenExpiresAt = null;
        state.users = [];
        state.selectedUser = null;
        state.error = action.payload as string || 'Logout failed';
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiresAt');
          sessionStorage.removeItem("justLoggedIn");
          localStorage.removeItem('persist:auth');
        } catch (error) {
          console.error('Failed to remove storage:', error);
        }
      })

      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
        state.usersError = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string || 'Failed to fetch users';
      })

      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.selectedUser = action.payload;
        state.usersError = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.usersLoading = false;
        state.selectedUser = null;
        state.usersError = action.payload as string || 'Failed to fetch user';
      })

      // Update User
      .addCase(updateUser.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.usersLoading = false;
        // Cập nhật user trong danh sách
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        // Cập nhật selectedUser nếu đang xem user này
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = { ...state.selectedUser, ...action.payload };
        }
        state.usersError = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string || 'Failed to update user';
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.usersLoading = false;
        // Xóa user khỏi danh sách
        state.users = state.users.filter(u => u.id !== action.payload.userId);
        // Clear selectedUser nếu đang xem user bị xóa
        if (state.selectedUser?.id === action.payload.userId) {
          state.selectedUser = null;
        }
        state.usersError = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string || 'Failed to delete user';
      })

      // Change Password By Admin
      .addCase(changePasswordByAdmin.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(changePasswordByAdmin.fulfilled, (state) => {
        state.usersLoading = false;
        state.usersError = null;
      })
      .addCase(changePasswordByAdmin.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string || 'Failed to change password';
      });
  },
});

export const { logout, clearError, clearSelectedUser } = authSlice.actions;
export default authSlice.reducer;