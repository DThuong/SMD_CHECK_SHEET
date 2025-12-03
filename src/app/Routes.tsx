//layout
import UserLayout from './layout/UserLayout'
import AdminLayout from './layout/AdminLayout';
// router
import { Route, Routes, Navigate } from 'react-router-dom';
// user pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import ErrorPage from '../pages/ErrorPage';
// admin pages
import Dashboard from '../pages/admin/Dashboard';
import Profile from '../pages/admin/Profile';
import User from '../pages/admin/User';
import Settings from '../pages/admin/Settings';
import Logs from '../pages/admin/Logs';
// useAuth
import { useAuth } from '../pages/authLoginSample/AuthContext';

// Component bảo vệ route cho PQC (chỉ cho phép PQC vào)
const PQCRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // Chưa login -> redirect về /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Đã login nhưng không phải PQC -> redirect về /admin/dashboard
  if (user.role !== 'PQC') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Đúng role PQC -> cho vào
  return <>{children}</>;
};

// Component bảo vệ route cho Admin (ENG, SUPERVISOR, MANAGER, MANAGER_KOREA)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // Chưa login -> redirect về /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Đã login nhưng là PQC -> redirect về /
  if (user.role === 'PQC') {
    return <Navigate to="/" replace />;
  }

  // Đúng role Admin -> cho vào
  return <>{children}</>;
};

// Component cho trang Login (nếu đã login thì redirect về trang tương ứng)
const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // Nếu đã login
  if (user) {
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
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/profile" element={<Profile />} />
        <Route path="/admin/user" element={<User />} />
        <Route path="/admin/logs" element={<Logs />} />
        <Route path="/admin/settings" element={<Settings />} />
        
        {/* Default admin route */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default App;