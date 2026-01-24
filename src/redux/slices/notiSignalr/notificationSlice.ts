/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import smdApi from '../../services/smdApi';
import type { CheckModelData, StandardProductionData, TimeChangeModelData, StandardVehicleData, PQCCheckData } from '../subTableSlice';

export interface AccountInfo {
  id?: number;
  fullName?: string;
  userName?: string;
  phoneNumber?: string;
  role?: string;
}

export interface ChangeModelData {
  id: number;
  status?: string;
  checkModelId?: number;
  programCheckId?: number;
  standardProductionId?: number;
  timeChangeModelId?: number;
  standardVehicleId?: number;
  pqcCheckId?: number;
  account?: AccountInfo;
  accountId?: number;
  excelFileUrl?: string;
  pdfFileUrl?: string;
  createAt?: string;
  noteFile?: string;
  workerFile?: string;

  // object 
  checkModel?: CheckModelData;
  standardProduction?: StandardProductionData;
  timeChangeModel?: TimeChangeModelData;
  standardVehicle?: StandardVehicleData;
  pqcCheck?: PQCCheckData;
}

export interface NotificationData {
  // Root level fields
  id: number;
  message: string;
  userRole: string;
  isRead: boolean;
  createdAt: string;
  
  changeModel: ChangeModelData;
  changeModelId: number;

  // Mapped fields để dễ sử dụng
  sheetId: number;
  fromRole: string;
  fromUser: string;
  type: 'note_created' | 'note_updated' | 'note_deleted';
}

interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Helper function để map raw notification data
const mapNotificationData = (rawNotif: any): NotificationData => {
  return {
    // Root level fields
    id: rawNotif.id,
    message: rawNotif.message,
    userRole: rawNotif.userRole,
    isRead: rawNotif.isRead || false,
    createdAt: rawNotif.createdAt,
    changeModel: rawNotif.changeModel,
    changeModelId: rawNotif.changeModelId,
    
    sheetId: rawNotif.changeModel?.id || rawNotif.changeModelId,
    fromRole: rawNotif.changeModel?.account?.role || 'Unknown',
    fromUser: rawNotif.changeModel?.account?.fullName || 
              rawNotif.changeModel?.account?.userName || 
              'Unknown',
    type: rawNotif.message.includes('tạo') ? 'note_created' :
          rawNotif.message.includes('cập nhật') ? 'note_updated' : 
          'note_deleted'
  };
};

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await smdApi.get(`/Notification`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const mappedData = response.data.map((notif: any) => mapNotificationData(notif));
      return mappedData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Mark as read
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await smdApi.put(`/Notification/${notificationId}/read`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);


const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<NotificationData>) => {
      state.notifications.unshift(action.payload);
      state.notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      state.unreadCount += 1;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      // Data đã được map rồi
      state.notifications = action.payload.sort((a: NotificationData, b: NotificationData) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      state.unreadCount = action.payload.filter((n: NotificationData) => !n.isRead).length;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    //Mark as read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });
  }
});

export const { addNotification, clearNotifications, updateUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;