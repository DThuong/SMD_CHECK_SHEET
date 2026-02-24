/* eslint-disable no-empty */
import { useState, useEffect, useRef } from "react";
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
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Redux
  const { user, loading } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  // Close user menu when clicking outside (desktop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

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
    setSidebarOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md z-40 relative flex h-14 shrink-0">
        {/* Desktop Sidebar Header - logo/title area aligned with sidebar width */}
        <div className="hidden md:flex items-center w-64 lg:w-96 px-4 border-r border-gray-200 shrink-0">
          <Link
            to="/admin/dashboard"
            className="text-decoration-none lg:text-2xl md:text-xl font-bold text-gray-800 truncate"
          >
            {user?.role} Dashboard
          </Link>
        </div>

        {/* Main Header */}
        <div className="flex-1 flex items-center justify-between px-3 lg:px-4">
          {/* Mobile: Hamburger on left */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen
              ? <HiX className="w-6 h-6 text-gray-700" />
              : <HiMenu className="w-6 h-6 text-gray-700" />
            }
          </button>

          {/* Mobile: Page title center */}
          <h1 className="text-base font-bold text-blue-800 md:hidden">
            {user?.role} Dashboard
          </h1>

          <div className="md:hidden">
            <NotificationBell />
          </div>


          {/* Desktop Right Side: Notification + User Menu */}
          <div className="w-full hidden md:flex items-center justify-end gap-2">
            <NotificationBell />
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center px-3 py-2 rounded hover:bg-gray-100 transition"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <HiUser className="w-5 h-5 text-gray-700" />
                <span className="hidden sm:inline mx-2 text-gray-700 text-sm">
                  Welcome, {user?.username}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
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

          {/* Mobile placeholder */}
          <div className="md:hidden w-10" />
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===================== DESKTOP SIDEBAR ===================== */}
        <aside className="hidden md:flex flex-col w-64 lg:w-96 bg-white shadow-lg shrink-0 h-full">
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
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

          <div className="px-4 py-3 border-t border-gray-200">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </aside>

        {/* ===================== MOBILE SIDEBAR OVERLAY ===================== */}
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Mobile Drawer - slides in from left, starts below header */}
        <aside
          className={`
            fixed top-14 left-0 bottom-0
            w-72 max-w-[85vw]
            bg-white shadow-xl
            z-30 md:hidden
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* User Info */}
          <div className="px-4 py-4 bg-gray-700 text-white flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center shrink-0">
              <HiUser className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate mb-0">{user?.username}</p>
              <p className="text-xs text-gray-300 truncate mb-0">{user?.role}</p>
            </div>
          </div>

          {/* Nav Menu Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
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

          {/* Logout Button */}
          <div className="px-4 py-3 border-t border-gray-200 shrink-0">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center w-full px-4 py-3 rounded-lg text-left text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
            >
              <HiLogout className="w-5 h-5 mr-3" />
              {loading ? 'Logging out...' : 'Đăng xuất'}
            </button>
          </div>

          {/* Logo Footer */}
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <img src={logo} alt="Logo" className="w-full object-contain max-h-16" />
          </div>
        </aside>

        {/* ===================== MAIN CONTENT ===================== */}
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