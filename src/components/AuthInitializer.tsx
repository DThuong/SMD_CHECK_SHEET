import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../redux/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import smdApi from '../redux/services/smdApi';
import { PURGE } from 'redux-persist';

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, tokenExpiresAt, isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);
  
  useEffect(() => {
    const checkInitialSession = async () => {
      if (hasCheckedRef.current) {
        setIsChecking(false);
        return;
      }

      if (location.pathname === '/login') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (error) {
          console.error('Failed to clear storage:', error);
        }
        setIsChecking(false);
        hasCheckedRef.current = true;
        return;
      }

      if (!token || !isAuthenticated) {
        setIsChecking(false);
        hasCheckedRef.current = true;
        return;
      }

      try {
        // Check expiry
        if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
          console.log('❌ Token expired');
          handleLogout();
          return;
        }

        // Validate role
        const validRoles = ['PQC', 'Admin', 'ENG', 'Supervisior', 'Manager', 'KoreaManager'];
        if (user?.role && !validRoles.includes(user.role)) {
          console.log('❌ Invalid role');
          handleLogout();
          return;
        }

        // Verify với server
        try {
          console.log(' Verifying token...');
          await smdApi.get('Account/verify');
          console.log('Token valid');
        } catch (error: any) {
          if (error.response?.status === 401) {
            console.log('❌ Token invalidated');
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
      localStorage.clear();
      sessionStorage.clear();
      
      // ✅ Purge với key 'auth'
      dispatch({ type: PURGE, key: 'auth', result: () => null });
      dispatch(logout());
      
      hasCheckedRef.current = true;
      setIsChecking(false);
      
      navigate('/login', { replace: true });
    };

    checkInitialSession();
  }, []);

  // AUTO LOGOUT
  useEffect(() => {
    if (!tokenExpiresAt || !isAuthenticated || !token) return;

    const timeUntilExpiry = tokenExpiresAt - Date.now();

    if (timeUntilExpiry <= 0) {
      console.log('❌ Expired');
      localStorage.clear();
      sessionStorage.clear();
      dispatch({ type: PURGE, key: 'auth', result: () => null });
      dispatch(logout());
      navigate('/login', { replace: true });
      return;
    }

    console.log(`⏱ Expires in ${Math.floor(timeUntilExpiry / 1000)}s`);
    
    const timer = setTimeout(() => {
      console.log('Auto logout');
      localStorage.clear();
      sessionStorage.clear();
      dispatch({ type: PURGE, key: 'auth', result: () => null });
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