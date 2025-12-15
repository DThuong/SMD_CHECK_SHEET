// src/components/AuthInitializer.tsx
import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../redux/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import smdApi from '../redux/services/smdApi';

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, tokenExpiresAt, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);
  
  // ✅ INITIAL CHECK - Chạy 1 lần khi mount
  useEffect(() => {
    const checkInitialSession = async () => {
      if (hasCheckedRef.current) {
        setIsChecking(false);
        return;
      }

      // Nếu đang ở trang login → clear storage (GIỮ device ID)
      if (location.pathname === '/login') {
        try {
          const deviceId = localStorage.getItem('smd_device_id');
          localStorage.clear();
          sessionStorage.clear();
          if (deviceId) {
            localStorage.setItem('smd_device_id', deviceId);
          }
        } catch (error) {
          console.error('Failed to clear storage:', error);
        }
        setIsChecking(false);
        hasCheckedRef.current = true;
        return;
      }

      // Chưa login → skip
      if (!token || !isAuthenticated) {
        setIsChecking(false);
        hasCheckedRef.current = true;
        return;
      }

      try {
        // 1. Check token hết hạn
        if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
          console.log('❌ Token đã hết hạn');
          handleLogout();
          return;
        }

        // 2. Validate role
        const validRoles = ['PQC', 'Admin', 'ENG', 'Supervisior', 'Manager', 'KoreaManager'];
        if (user?.role && !validRoles.includes(user.role)) {
          console.log('❌ Invalid role:', user.role);
          handleLogout();
          return;
        }

        // 3. ✅ VERIFY TOKEN VỚI SERVER (chỉ 1 lần khi khởi động)
        try {
          console.log('Initial token verification...');
          await smdApi.get('/Account/verify');
          console.log('✅ Token valid');
        } catch (error: any) {
          if (error.response?.status === 401) {
            console.log('❌ Token không hợp lệ (401) - Có thể đã login ở thiết bị khác');
            handleLogout();
            return;
          }
          console.warn('⚠️ Verification failed, continuing');
        }

        console.log('✅ Session valid');
      } catch (error) {
        console.error('❌ Check error:', error);
        handleLogout();
      } finally {
        setIsChecking(false);
        hasCheckedRef.current = true;
      }
    };

    const handleLogout = () => {
      const deviceId = localStorage.getItem('smd_device_id');
      
      localStorage.clear();
      sessionStorage.clear();
      
      if (deviceId) {
        localStorage.setItem('smd_device_id', deviceId);
      }
      
      dispatch(logout());
      
      hasCheckedRef.current = true;
      setIsChecking(false);
      
      navigate('/login', { replace: true });
    };

    checkInitialSession();
  }, []);

  // ✅ AUTO LOGOUT KHI TOKEN HẾT HẠN - Dùng setTimeout
  useEffect(() => {
    if (!tokenExpiresAt || !isAuthenticated || !token) return;

    const timeUntilExpiry = tokenExpiresAt - Date.now();

    // Token đã hết hạn
    if (timeUntilExpiry <= 0) {
      console.log('❌ Token expired');
      
      const deviceId = localStorage.getItem('smd_device_id');
      localStorage.clear();
      sessionStorage.clear();
      if (deviceId) {
        localStorage.setItem('smd_device_id', deviceId);
      }
      
      dispatch(logout());
      navigate('/login', { replace: true });
      return;
    }

    console.log(`⏱️ Token expires in ${Math.floor(timeUntilExpiry / 1000)}s`);
    
    // ✅ Setup timeout để auto logout khi hết hạn
    const timer = setTimeout(() => {
      console.log('⏰ Auto logout - Token expired');
      
      const deviceId = localStorage.getItem('smd_device_id');
      localStorage.clear();
      sessionStorage.clear();
      if (deviceId) {
        localStorage.setItem('smd_device_id', deviceId);
      }
      
      dispatch(logout());
      navigate('/login', { replace: true });
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [tokenExpiresAt, isAuthenticated, token, dispatch, navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;