/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { getDeviceInfo } from '../utils/deviceInfo';
import { useTranslation } from 'react-i18next';
import Footer from '../components/general/Footer';

const inputClass = "w-full px-4 py-3 border rounded-lg outline-none transition focus:border-blue-500 focus:shadow";

const Login = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { i18n } = useTranslation();

  useEffect(() => {
    //Chỉ clear token, KHÔNG XÓA device ID
    try {
      const currentPath = window.location.pathname;
      if (currentPath === '/login') {
        // Lưu device ID trước khi clear
        const deviceId = localStorage.getItem('smd_device_id');
        localStorage.clear();
        sessionStorage.clear();
        
        // Khôi phục device ID
        if (deviceId) {
          localStorage.setItem('smd_device_id', deviceId);
        }
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }

    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deviceInfo = getDeviceInfo();
      
      const resultAction = await dispatch(loginUser({
        username, 
        password,
        deviceInfo
      })).unwrap();

      // Set Korean cho KoreaManager ngay sau khi login thành công
      if (resultAction?.role === 'KoreaManager') {
        await i18n.changeLanguage('ko');
        localStorage.setItem('appLanguage', 'ko');
      } else {
        // Role khác: set Vietnamese (hoặc giữ default)
        await i18n.changeLanguage('vi');
        localStorage.setItem('appLanguage', 'vi');
      }
    } catch (error) {
      console.error('Login failed: ', error);
    }
  };

  useEffect(() => {
    if(error){
      setTimeout(() => {
        dispatch(clearError());
      }, 2000)
    }
  }, [error, dispatch]);

  // Helper function để format error
  const formatError = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.title) return error.title;
    if (error?.message) return error.message;
    return 'Đăng nhập thất bại';
  };

  return (
    <>
    <div className="min-h-[50vh] flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow my-4 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700!">Welcome Back</h1>
          <p className="text-xs text-gray-700!">Please login to your account</p>
        </div>

        <div className="my-3 px-4 flex flex-col gap-3">
          <input
            aria-label="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            placeholder="Username"
            className={inputClass}
          />

          <input
            aria-label="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="Password"
            className={inputClass}
          />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center justify-between gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-gray-600">Remember me</span>
            </div>

            <div>
              <a href="/forgot-password" className="text-blue-400 text-decoration-none font-semibold">
                Forgot password?
              </a>
            </div>
          </div>
        </div>

        <div className='px-4'>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-500 focus:ring-4 focus:ring-blue-200 transition py-3 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đăng nhập...' : 'Login'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="#support" className="text-blue-500 font-semibold text-decoration-none">
              Contact IT
            </a>
          </p>
        </div>

        {/* Fix hiển thị error */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">
            {formatError(error)}
          </div>
        )}
      </form>
    </div>
    <Footer />
    </>
  );
};

export default Login;