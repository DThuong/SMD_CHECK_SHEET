//layout
import UserLayout from './layout/UserLayout'
import AdminLayout from './layout/AdminLayout';
// router
import { Route, Routes, Navigate } from 'react-router-dom';
// user pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import ErrorPage from '../pages/ErrorPage';
// boss pages
// import Dashboard from '../pages/admin/Dashboard';
// import Profile from '../pages/admin/Profile';
// import User from '../pages/admin/User';
import Settings from '../pages/admin/Settings';
import Logs from '../pages/admin/Logs';

// Import Redux hooks
import { useAppSelector } from '../redux/hooks';
// import spinner
import LoadingSpinner from '../components/LoadingSpinner';

// ========================================
// Component bảo vệ route cho PQC (chỉ cho phép PQC vào)
// ========================================
const PQCRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.auth
  );
  // Xử lý loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  // Chưa login -> redirect về /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Thêm optional chaining cho user?.role
  // Đã login nhưng không phải PQC -> redirect về /admin/dashboard
  if (user?.role !== 'PQC') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  // Đúng role PQC -> cho vào
  return <>{children}</>;
};

// ========================================
// Component bảo vệ route cho Admin (ENG, SUPERVISOR, MANAGER, MANAGER_KOREA)
// ========================================
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.auth
  );
  // Xử lý loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  // Chưa login -> redirect về /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Thêm optional chaining
  // Đã login nhưng là PQC -> redirect về /
  if (user?.role === 'PQC') {
    return <Navigate to="/" replace />;
  }
  // Đúng role Admin -> cho vào
  return <>{children}</>;
};

// ========================================
// Component cho trang Login (nếu đã login thì redirect về trang tương ứng)
// ========================================
const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  // Dùng Redux thay vì useAuth
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.auth
  );
  // Xử lý loading state (optional cho login page)
  if (loading) {
    return <LoadingSpinner />;
  }
  // Nếu đã login
  if (isAuthenticated && user) {
    // PQC -> về /
    if (user.role === 'PQC') {
      return <Navigate to="/" replace />;
    }
    // Admin -> về /admin/dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }
  // Chưa login -> hiển thị trang Login
  return <>{children}</>;
};

// ========================================
// MAIN APP ROUTES
// ========================================
const App = () => {
  return (
    <Routes>
      {/* ========== USER ROUTES (PQC) ========== */}
      <Route element={<UserLayout />}>
        {/* Trang chính - chỉ PQC mới vào được */}
        <Route path="/" element={<PQCRoute><Home /></PQCRoute>}/>

        {/* Trang Login - nếu đã login sẽ auto redirect */}
        <Route
          path="/login"
          element={
            <LoginRoute>
              <Login />
            </LoginRoute>
          }
        />

        {/* Error page - public */}
        <Route path="*" element={<ErrorPage />} />
      </Route>

      {/* ========== ADMIN ROUTES ========== */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin/dashboard" element={<h1>Dashboard</h1>} />
        <Route path="/admin/profile" element={<h1>Profile</h1>} />
        <Route path='/admin/smd-sheet-logs' element={<Logs />} />
        <Route path="/admin/settings" element={<Settings />} />
        
        {/* Default admin route */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default App;