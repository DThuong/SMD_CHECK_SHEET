import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { useState } from 'react';
import type { NotificationType } from '../components/Notification';

//type cho notification
interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message?: string;
}

// custome hooks với type đã được định nghĩa
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


// hook để quản lý notification
export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showNotification = (
    type: NotificationType,
    title: string,
    message?: string
  ) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
};
