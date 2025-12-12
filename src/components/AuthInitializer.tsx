// AuthInitializer.tsx
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logoutUser } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, tokenExpiresAt, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );
  const [isChecking, setIsChecking] = useState(true);
  
  // CHECK INITIAL SESSION
  useEffect(() => {
    const checkInitialSession = async () => {
      if (!token || !isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        // Check token đã hết hạn chưa
        if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
          console.log('❌ Token expired');
          await dispatch(logoutUser()).unwrap();
          navigate('/login', { replace: true });
          setIsChecking(false);
          return;
        }

        // Validate role
        const validRoles = ['PQC', 'Admin', 'ENG', 'Supervisior', 'Manager', 'KoreaManager'];
        if (user?.role && !validRoles.includes(user.role)) {
          console.log('❌ Invalid role');
          await dispatch(logoutUser()).unwrap();
          navigate('/login', { replace: true });
          setIsChecking(false);
          return;
        }

        console.log('Session valid');
      } catch (error) {
        console.error('❌ Session check error:', error);
        await dispatch(logoutUser()).unwrap().catch(() => {});
        navigate('/login', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkInitialSession();
  }, []);

  // AUTO LOGOUT KHI TOKEN HẾT HẠN (PRODUCTION-READY)
  useEffect(() => {
    if (!tokenExpiresAt || !isAuthenticated || !token) return;

    const timeUntilExpiry = tokenExpiresAt - Date.now();

    // Nếu đã hết hạn
    if (timeUntilExpiry <= 0) {
      console.log('❌ Token already expired');
      dispatch(logoutUser());
      navigate('/login', { replace: true });
      return;
    }

    // SET TIMEOUT - CHỈ CHẠY 1 LẦN ĐÚNG LÚC HẾT HẠN
    console.log(`⏱Token sẽ hết hạn sau ${Math.floor(timeUntilExpiry / 1000)}s (${new Date(tokenExpiresAt).toLocaleString()})`);
    
    const logoutTimer = setTimeout(async () => {
      console.log('Token expired - Auto logout');
      await dispatch(logoutUser()).unwrap();
      navigate('/login', { replace: true });
    }, timeUntilExpiry);

    // Cleanup khi component unmount hoặc dependencies thay đổi
    return () => {
      console.log('Clearing logout timer');
      clearTimeout(logoutTimer);
    };
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