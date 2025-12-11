// src/components/AuthInitializer.tsx
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

// Session timeout: 24 giờ
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, lastActivity, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Nếu không có token hoặc chưa authenticated
      if (!token || !isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        // Kiểm tra session timeout
        if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT) {
          console.log('❌ Session expired due to inactivity');
          dispatch(logout());
          navigate('/login', { replace: true });
          setIsChecking(false);
          return;
        }

        // Validate role
        const validRoles = ['PQC', 'Admin', 'ENG', 'Supervisior', 'Manager', 'KoreaManager'];
        if (user?.role && !validRoles.includes(user.role)) {
          console.log('❌ Invalid role detected');
          dispatch(logout());
          navigate('/login', { replace: true });
          setIsChecking(false);
          return;
        }

        // Kiểm tra token format (optional - tùy backend)
        if (!token.includes('.')) {
          console.log('❌ Invalid token format');
          dispatch(logout());
          navigate('/login', { replace: true });
          setIsChecking(false);
          return;
        }

        console.log('✅ Session validated');
      } catch (error) {
        console.error('Error during session check:', error);
        dispatch(logout());
        navigate('/login', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [dispatch, token, lastActivity, isAuthenticated, user, navigate]);

  // Hiển thị loading trong lúc check session
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;