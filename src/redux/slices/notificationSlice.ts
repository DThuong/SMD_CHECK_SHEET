import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { NotificationType } from '../../components/general/Notification';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message?: string;
}

const initialState: NotificationState = {
  show: false,
  type: 'info',
  title: '',
  message: ''
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification: (
      state,
      action: PayloadAction<{ type: NotificationType; title: string; message?: string }>
    ) => {
      state.show = true;
      state.type = action.payload.type;
      state.title = action.payload.title;
      state.message = action.payload.message;
    },
    hideNotification: (state) => {
      state.show = false;
    }
  }
});

export const { showNotification, hideNotification } = notificationSlice.actions;
export default notificationSlice.reducer;