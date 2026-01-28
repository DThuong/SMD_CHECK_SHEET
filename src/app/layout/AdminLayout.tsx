/* eslint-disable no-empty */
import { useState, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { HiMenu, HiX, HiLogout, HiUser } from "react-icons/hi";
import logo from "../../assets/image/brand_image_3.webp";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { logoutUser } from "../../redux/slices/authSlice";
import NotificationBell from "../../components/general/NotificationBell";

const AdminLayout = () => {
  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Redux
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  // Login notification
  const [showNoti, setShowNoti] = useState(() => {
    try {
      return sessionStorage.getItem("justLoggedIn") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showNoti) return;
    try { sessionStorage.removeItem("justLoggedIn"); } catch {}
    const timer = setTimeout(() => setShowNoti(false), 2000);
    return () => clearTimeout(timer);
  }, [showNoti]);

  // Menu items
  const menuItems = [
    { name: "Dashboard", path: "dashboard" },
    { name: "User", path: "user" },
    { name: "SMD SHEET", path: "smd-sheet-logs" },
    { name: "Settings", path: "settings" },
  ];

  // Handlers
  const handleLogout = () => {
    dispatch(logoutUser());
    setUserMenuOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Login Success Notification */}
      {showNoti && user && isAuthenticated && (
        <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
          <div className="noti-inner bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800 text-lg">Đăng nhập thành công!</p>
            <p className="text-green-700 text-sm mt-1">
              User: <strong>{user?.username}</strong> - Role: <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-md z-40 relative flex">
        {/* Desktop Sidebar Header */}
        <div className="hidden md:block w-64 lg:w-96 px-4 py-3 border-r border-gray-200">
          <Link 
            to="/admin/dashboard" 
            className="text-decoration-none lg:text-4xl md:text-2xl font-bold text-gray-800"
          >
            {user?.role} Dashboard
          </Link>
        </div>

        {/* Main Header */}
        <div className="flex-1 flex items-center justify-between lg:justify-end md:justify-end px-3 lg:px-4 py-3">
          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <HiX className="w-6 h-6 text-gray-700" />
            ) : (
              <HiMenu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Mobile Title - Chỉ hiện khi sidebar đóng */}
          <h1 className={`text-xl font-bold text-blue-800 ${sidebarOpen ? 'hidden' : 'block'} md:hidden`}>
            {user?.role} Dashboard
          </h1>

          {/* Right Side: Notification + User Menu */}
          <div className={`relative ml-auto ${sidebarOpen ? 'hidden md:flex' : 'flex'} items-center gap-2`}>
            <NotificationBell />
            
            <button
              className="flex items-center px-3 py-2 rounded hover:bg-gray-100 transition"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <HiUser className="w-5 h-5 text-gray-700" />
              <span className="hidden sm:inline ml-2 text-gray-700">
                Welcome, {user?.username}
              </span>
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  <HiLogout className="w-4 h-4 mr-2" />
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:relative 
            top-0 left-0 
            z-30
            w-64 lg:w-96 
            bg-white shadow-lg 
            transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            transition-transform duration-300 ease-in-out
            flex flex-col
            h-[calc(100vh-56px)] md:h-full
            mt-14 md:mt-0
          `}
        >
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg transition-colors mb-2 text-decoration-none ${
                    isActive
                      ? "bg-gray-500 text-white font-semibold"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
        </aside>

        {/* Mobile Overlay - Click để đóng sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden mt-14"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;