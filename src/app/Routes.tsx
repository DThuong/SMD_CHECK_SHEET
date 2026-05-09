//layout
import UserLayout from './layout/UserLayout'
import AdminLayout from './layout/AdminLayout';
import RoleBasedLayout from './layout/RoleBasedLayout'; // Layout động theo role
// router
import { Route, Routes, Navigate } from 'react-router-dom';
// user pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import ErrorPage from '../pages/ErrorPage';
// admin pages (chỉ cho ADMIN)
import Dashboard from '../pages/managers_role/Dashboard';
import User from '../pages/managers_role/User';
// shared pages (dùng chung)
import Settings from '../pages/managers_role/Settings';
import Logs from '../pages/managers_role/Logs';

// Import Redux hooks
import { useAppSelector } from '../redux/hooks';
// import spinner
import LoadingSpinner from '../components/general/LoadingSpinner';
import SmdSheetDetail from '../components/detail_Sheet/SmdSheetDetail';
import AuthInitializer from '../components/auth/AuthInitializer';
import SheetDetailViewer from '../components/detail_Sheet/SheetDetailViewer';
import FileDetailViewer from '../pages/FileDetailViewer';
import ChangePassword from '../pages/ChangePassword';
import Plan from '../pages/managers_role/Plan';
import PatrolComponent from '../pages/managers_role/PatrolComponent';

// ========================================
// Component bảo vệ route cho PQC
// ========================================
const PQCRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (user?.role !== 'PQC') {
    // Redirect về route của role đó
    const roleLower = user?.role?.toLowerCase();
    return <Navigate to={`/${roleLower}/smd-sheet-logs`} replace />;
  }
  
  return <>{children}</>;
};

// ========================================
// Component bảo vệ route cho ADMIN
// ========================================
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Chỉ cho phép role ADMIN
  if (user?.role !== 'Admin') {
    // Nếu là PQC -> về trang chủ
    if (user?.role === 'PQC') return <Navigate to="/" replace />;
    // Nếu là role khác -> về route của role đó
    const roleLower = user?.role?.toLowerCase();
    return <Navigate to={`/${roleLower}/dashboard`} replace />;
  }
  
  return <>{children}</>;
};

// ========================================
// Component bảo vệ route động theo role (ENG, SUPERVISOR, MANAGER, MANAGER_KOREA)
// ========================================
const RoleBasedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Danh sách các role được phép
  const allowedRoles = ['ENG', 'Supervisior', 'Manager', 'KoreaManager', 'PQCLeader'];
  
  // Nếu là PQC -> về trang chủ
  if (user?.role === 'PQC') return <Navigate to="/" replace />;
  
  // Nếu là ADMIN -> về admin dashboard
  if (user?.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
  
  // Nếu không phải các role được phép -> về login
  if (!allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// ========================================
// Component cho trang Login
// ========================================
const LoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) return <LoadingSpinner />;
  
  if (isAuthenticated && user) {
    // PQC -> trang chủ
    if (user.role === 'PQC') return <Navigate to="/" replace />;
    // PQCLeader -> trang chủ
    if (user.role === 'PQCLeader') {
      const roleLower = 'pqcleader';
      return <Navigate to={`/${roleLower}/dashboard`} replace />;
    }
    
    // ADMIN -> admin dashboard
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    
    // ENG, SUPERVISOR, MANAGER, MANAGER_KOREA -> route theo role
    const roleLower = user?.role?.toLowerCase();
    return <Navigate to={`/${roleLower}/dashboard`} replace />;
  }
  
  return <>{children}</>;
};

// Tạo component bảo vệ cho ChangePassword route
const ChangePasswordRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Admin không được vào trang này (đã có trang User)
  if (user?.role === 'Admin') {
    return <Navigate to="/admin/user" replace />;
  }
  
  return <>{children}</>;
};

// ========================================
// MAIN APP ROUTES
// ========================================
const App = () => {
  return (
    <AuthInitializer>
      <Routes>
        {/* ========== PQC ROUTES ========== */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<PQCRoute><Home /></PQCRoute>} />
          <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />
          <Route path="/change-password" element={<ChangePasswordRoute><ChangePassword /></ChangePasswordRoute>} />
          <Route path="/pqc-sheet-detail/:id" element={<PQCRoute><SmdSheetDetail /></PQCRoute>} />
          <Route path="/pqc-files/:id/:fileType" element={<PQCRoute><FileDetailViewer /></PQCRoute>} />
          <Route path="/pqc-patrol" element={<PQCRoute><PatrolComponent /></PQCRoute>} />
          <Route path="*" element={<ErrorPage />} />
        </Route>

        {/* ========== ADMIN ROUTES ========== */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/plan" element={<Plan />} />
          <Route path="/admin/user" element={<User />} />
          <Route path="/admin/smd-sheet-logs" element={<Logs />} />
          <Route path="/admin/sheet-detail/:id" element={<SheetDetailViewer />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/patrol" element={<PatrolComponent />} />
          <Route path="/admin/files/:id/:fileType" element={<FileDetailViewer />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* ========== DYNAMIC ROLE ROUTES (ENG, SUPERVISOR, MANAGER, MANAGER_KOREA) ========== */}
        <Route path="/:role" element={<RoleBasedRoute><RoleBasedLayout /></RoleBasedRoute>}>
          <Route path="/:role/smd-sheet-logs" element={<Logs />} />
          <Route path="/:role/dashboard" element={<Dashboard />} />
          <Route path="/:role/plan" element={<Plan />}></Route>
          <Route path="/:role/settings" element={<Settings />} />
          <Route path="/:role/change-password" element={<ChangePassword />} />
          <Route path="/:role/sheet-detail/:id" element={<SheetDetailViewer />} />
          <Route path="/:role/patrol" element={<PatrolComponent />} />
          <Route path="/:role/files/:id/:fileType" element={<FileDetailViewer />} />
          <Route path="/:role" element={<RoleDynamicRedirect />} />
        </Route>
      </Routes>
    </AuthInitializer>
  );
};

// ========================================
// Component redirect động cho /:role
// ========================================
const RoleDynamicRedirect = () => {
  const { user } = useAppSelector((state) => state.auth);
  const roleLower = user?.role?.toLowerCase();
  return <Navigate to={`/${roleLower}/dashboard`} replace />;
};

export default App;