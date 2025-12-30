// src/router/layout/RoleBasedLayout.tsx
import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useParams, Navigate, } from "react-router-dom";
import { HiMenu, HiX, HiLogout, HiUser } from "react-icons/hi";
import logo from "../../assets/image/brand_image_3.webp";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { logoutUser } from "../../redux/slices/authSlice";
import { useTranslation } from "react-i18next";

const RoleBasedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { loading } = useAppSelector((state) => state.auth);
  const [showNoti, setShowNoti] = useState(() => {
    try {
      return sessionStorage.getItem("justLoggedIn") === "1";
    } catch {
      return false;
    }
  });
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!showNoti) return;
    try {
      sessionStorage.removeItem("justLoggedIn");
    } catch {}
    const timer = setTimeout(() => setShowNoti(false), 2000);
    return () => clearTimeout(timer);
  }, [showNoti]);

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { role } = useParams<{ role: string }>();

  const userRoleLower = user?.role?.toLowerCase();

  if (role !== userRoleLower) {
    return <Navigate to={`/${userRoleLower}/dashboard`} replace />;
  }

  const getRoleDisplayName = (roleName: string) => {
    const roleMap: Record<string, string> = {
      eng: "Engineering",
      supervisior: "Supervisor",
      manager: "Manager",
      koreamanager: "Korea Manager",
    };
    return (
      roleMap[roleName.toLowerCase()] ||
      roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
    );
  };

  const menuItems = [
    { name: t('menu.dashboard'), path: `/${role}/dashboard`, shouldReload: false },
    { name: t('menu.smdSheet'), path: `/${role}/smd-sheet-logs`, shoudReload: true },
    { name: t('menu.settings'), path: `/${role}/settings`, shouldReload: false },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    setUserMenuOpen(false);
  };

  // Đóng cả sidebar và user menu khi click overlay
  const closeAllMenus = () => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {user && isAuthenticated && showNoti && (
        <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
          <div className="noti-inner bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
            <p className="font-bold text-green-800 text-lg">
              {t('msg_success')}
            </p>
            <p className="text-green-700 text-sm mt-1">
              {t('user')}: <strong>{user?.username}</strong> - {t('role')}:{" "}
              <strong>{user?.role}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Header - Fixed top */}
      <header className="bg-white shadow-md z-40 relative flex flex-row md:flex-row">
        {/* Phần header sidebar - chỉ hiện trên desktop */}
        <div className="hidden md:block md:w-64 lg:w-full px-4 py-3 border-gray-200">
          <Link
            to={`/${role}/dashboard`}
            className="text-decoration-none lg:text-4xl md:text-2xl font-bold text-gray-800"
          >
            {getRoleDisplayName(role || "")} {t('menu.dashboard')}
          </Link>
        </div>

        {/* Phần header chính */}
        <div className="flex-1 flex items-center justify-between lg:justify-end md:justify-end px-4 py-4 min-w-0">
          {/* Mobile menu button - LUÔN HIỂN THỊ */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setUserMenuOpen(false);
            }}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <HiX className="w-6 h-6 text-gray-700" />
            ) : (
              <HiMenu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Logo/Title - ẨN KHI SIDEBAR MỞ */}
          <h1
            className={`text-lg font-bold text-blue-800 md:hidden truncate ${
              sidebarOpen ? "hidden" : "block"
            }`}
          >
            {getRoleDisplayName(role || "")} {t('menu.dashboard')}
          </h1>

          {/* User Menu - ẨN KHI SIDEBAR MỞ TRÊN MOBILE */}
          <div className={`relative ml-auto ${
            sidebarOpen ? "hidden md:block" : "block"
          }`}>
            <button
              className="flex items-center justify-center px-3 py-2 rounded hover:bg-gray-100"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setSidebarOpen(false);
              }}
            >
              <HiUser className="w-5 h-5 text-gray-700 mx-1" />
              <span className="hidden sm:inline text-gray-700 ml-2 truncate max-w-[150px]">
                {t('hello')}, {user?.username}
              </span>
            </button>

            {/* USER MENU DROPDOWN - DESKTOP */}
            {userMenuOpen && (
              <div className="hidden md:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <HiLogout className="w-4 h-4 mr-2" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main container */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - DESKTOP (Relative positioning) */}
        <aside className="hidden md:flex md:flex-col md:w-64 lg:w-96 bg-white shadow-lg">
          <nav className="flex-1 my-3 overflow-y-auto px-3 py-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                reloadDocument={item.shoudReload}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg transition-colors mb-3 text-decoration-none ${
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

        {/* SIDEBAR - MOBILE với OVERLAY */}
        {sidebarOpen && (
          <>
            {/* Sidebar panel - 70% width - Z-INDEX CAO HƠN */}
            <div
              className={`fixed inset-y-0 left-0 bg-white z-50 md:hidden flex flex-col w-[80%] 
              transform transition-transform duration-300 ease-in-out 
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
              style={{ top: "0px" }}
            >
              {/* Close button */}
              <div className="flex justify-start px-4 pt-4 pb-4">
                <button
                  onClick={closeAllMenus}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <HiX className="w-7 h-7 text-gray-700" />
                </button>
              </div>

              {/* Navigation menu */}
              <nav className="flex-1 overflow-y-auto px-4 py-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    reloadDocument={item.shouldReload}
                    onClick={closeAllMenus}
                    className={({ isActive }) =>
                      `block px-4 py-4 rounded-lg transition-colors mb-4 text-lg font-medium text-decoration-none ${
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

              {/* Logo at bottom */}
              <div className="px-4 py-6 border-t border-gray-200">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full max-w-[200px] mx-auto"
                />
              </div>
            </div>

            {/* ✅ OVERLAY MÀU XÁM - 30% còn lại - Z-INDEX THẤP HƠN */}
            <div
              className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ease-in-out ${
  sidebarOpen
    ? "bg-opacity-50 pointer-events-auto"
    : "bg-opacity-0 pointer-events-none"
}`}
              style={{ top: "0px" }}
              onClick={closeAllMenus}
              aria-label="Close sidebar"
            />
          </>
        )}

        {/* USER MENU - MOBILE FULL OVERLAY */}
        {userMenuOpen && (
          <>
            {/* User menu panel - FULL WIDTH */}
            <div
              className="fixed inset-0 bg-white z-50 md:hidden flex flex-col"
              style={{ top: "0px" }}
            >
              {/* Close button */}
              <div className="flex justify-start px-4 pt-4 pb-4">
                <button
                  onClick={closeAllMenus}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <HiX className="w-7 h-7 text-gray-700" />
                </button>
              </div>


              {/* Logout button */}
              <div className="flex-1 px-4">
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-gray-500 text-white border rounded-xl! hover:bg-red-600 transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiLogout className="w-6 h-6" />
                  {t('logout')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoleBasedLayout;