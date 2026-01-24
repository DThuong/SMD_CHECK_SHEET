/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { MdNotifications } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { signalRService } from '../../redux/services/signalrService';
import { fetchNotifications, markAsRead } from '../../redux/slices/notiSignalr/notificationSlice';

const NotificationBell = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector(state => state.notiSignalr);
  const currentUserRole = useAppSelector(state => state.auth.user?.role);
  
  const [isOpen, setIsOpen] = useState(false);
  const [realtimeUnreadCount, setRealtimeUnreadCount] = useState(0);

  // SignalR handler
  useEffect(() => {
    const handler = (data: any) => {
      console.log('[SignalR] New notification received:', data);
      
      // Chỉ tăng counter
      setRealtimeUnreadCount(prev => prev + 1);

      // Browser notification
      const rawNotification = typeof data === 'string' ? JSON.parse(data) : data;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('SMD Check Sheet', {
          body: rawNotification.message
        });
      }
    };

    signalRService.start();
    signalRService.onNotification(handler);
    dispatch(fetchNotifications());

    return () => {
      signalRService.offNotification(handler);
    };
  }, [dispatch]);

  useEffect(() => {
    setRealtimeUnreadCount(unreadCount);
  }, [unreadCount]);

  const handleToggleDropdown = () => {
    if (!isOpen) {
      dispatch(fetchNotifications());
    }
    setIsOpen(!isOpen);
  };

  const formatRoleForPath = (role: string | undefined): string => {
    if (!role) return 'pqc';
    
    const roleMap: Record<string, string> = {
      'PQC': 'pqc',
      'ENG': 'eng',
      'Supervisior': 'supervisior',
      'Manager': 'manager',
      'KoreaManager': 'korea-manager'
    };
    
    return roleMap[role] || role.toLowerCase();
  };

  const handleNotificationClick = async (id: number, sheetId: number, isRead: boolean) => {
    if (!isRead) {
      await dispatch(markAsRead(id));
      setRealtimeUnreadCount(prev => Math.max(0, prev - 1));
    }

    setIsOpen(false);
    const rolePath = formatRoleForPath(currentUserRole);
    navigate(`/${rolePath}/sheet-detail/${sheetId}`);
  };

  const handleClearAll = () => {
    setRealtimeUnreadCount(0);
  };

  const totalUnread = realtimeUnreadCount;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
        disabled={loading}
      >
        <MdNotifications size={24} className="text-gray-700" />
        
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                Thông báo ({notifications.length})
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="px-4 py-4 text-center text-gray-500">
                  Đang tải...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-4 text-center text-gray-500">
                  Chưa có thông báo mới
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                      !notif.isRead 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'bg-white'
                    }`}
                    onClick={() => handleNotificationClick(notif.id, notif.changeModel.id, notif.isRead)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        )}
                        <span className={`font-semibold text-sm ${
                          !notif.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          To: {notif.fromUser} ({notif.fromRole})
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-1 ${
                      !notif.isRead 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-600'
                    }`}>
                      {notif.message}
                    </p>
                    
                    <div className="flex gap-2 items-center">
                      {/* <span className={`text-xs px-2 py-1 rounded ${
                        notif.type === 'note_created' 
                          ? 'bg-green-100 text-green-700'
                          : notif.type === 'note_updated'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {notif.type === 'note_created' ? 'Tạo mới' : 
                         notif.type === 'note_updated' ? 'Cập nhật' : 'Xóa'}
                      </span> */}
                      <span className="text-xs text-gray-500">
                        Sheet #{notif.sheetId}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;