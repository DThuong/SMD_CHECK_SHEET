import { useState} from 'react';
import { FaKey, FaSave, FaTimes, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { changePasswordUser } from '../redux/slices/authSlice';
import { showNotification, hideNotification } from '../redux/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';
import Notification from '../components/general/Notification';

const ChangePassword = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading } = useAppSelector(state => state.auth);
  const notification = useAppSelector(state => state.notification);
  
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  // State để show/hide password
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);


  const handleChangePassword = async (): Promise<void> => {
    
    // Validate
    if (!currentPassword) {
      dispatch(showNotification({ type: 'error', title: 'Vui lòng nhập mật khẩu hiện tại' }));
      return;
    }
    
    if (!newPassword) {
      dispatch(showNotification({ type: 'error', title: 'Vui lòng nhập mật khẩu mới' }));
      return;
    }
    
    if (newPassword.length < 3) {
      dispatch(showNotification({ type: 'error', title: 'Mật khẩu mới phải có ít nhất 3 ký tự' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch(showNotification({ type: 'error', title: 'Mật khẩu xác nhận không khớp' }));
      return;
    }

    const result = await dispatch(changePasswordUser({
      currentPassword: currentPassword,
      newPassword: newPassword
    }));

    if (changePasswordUser.fulfilled.match(result)) {
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Dispatch notification
      dispatch(showNotification({
        type: 'success',
        title: 'Đổi mật khẩu thành công!',
        message: 'Đang chuyển hướng về trang chủ...'
      }));

      const userRole = user?.role;

      setTimeout(() => {
        if (userRole === 'PQC') {
            navigate('/');
        } else {
            const roleLower = userRole?.toLowerCase();
            navigate(`/${roleLower}/dashboard`);
        }
    }, 2000);
    } else {
      const errorMessage = result.payload as string || 'Đổi mật khẩu thất bại';
    console.log('❌ [ERROR]:', errorMessage);
      dispatch(showNotification({ type: 'error', title: errorMessage }));
    }
  };

  const handleCancel = () => {
    if (user?.role === 'PQC') {
      navigate('/');
    } else {
      const roleLower = user?.role?.toLowerCase();
      navigate(`/${roleLower}/dashboard`);
    }
  };

  return (
    <div className="p-4">
      {/* Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => dispatch(hideNotification())}
        duration={2000}
      />
      
      <div className="max-w-2xl mx-auto">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-gray-600 to-gray-700 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FaKey className="text-gray-700 text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Đổi mật khẩu</h1>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            {/* User Info */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <FaUser className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{user?.fullName}</div>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-300">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-3">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mật khẩu hiện tại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 3 ký tự)"
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${currentPassword ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span>Nhập mật khẩu hiện tại</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 3 ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span>Mật khẩu mới tối thiểu 3 ký tự</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span>Mật khẩu xác nhận phải khớp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
              >
                <FaSave />
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTimes />
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;