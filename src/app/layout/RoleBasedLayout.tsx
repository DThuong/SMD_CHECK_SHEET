/* eslint-disable no-empty */
// src/router/layout/RoleBasedLayout.tsx
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useParams, Navigate, useNavigate, useLocation } from "react-router-dom";
import { HiMenu, HiX, HiLogout, HiChevronDown } from "react-icons/hi";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import { FaKey, FaUser, FaChartPie, FaFileAlt, FaCog, FaMicrochip } from "react-icons/fa";
import logo from "../../assets/image/brand_image_3.webp";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { PiPlantFill } from "react-icons/pi";
import { logoutUser } from "../../redux/slices/authSlice";
import { useTranslation } from "react-i18next";

const RoleBasedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPatrolOpen, setIsPatrolOpen] = useState(false);
  const [isMobilePatrolOpen, setIsMobilePatrolOpen] = useState(false);
  const patrolMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showNoti, setShowNoti] = useState(() => {
    try {
      return sessionStorage.getItem("justLoggedIn") === "1";
    } catch {
      return false;
    }
  });
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "vi");

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => setCurrentLang(lng);
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLang) return;
    try {
      await i18n.reloadResources(langCode, ["settings", "dashboard", "logs", "common", "patrol"]);
      await i18n.changeLanguage(langCode);
      localStorage.setItem("appLanguage", langCode);
      setCurrentLang(langCode);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  useEffect(() => {
    if (!showNoti) return;
    try {
      sessionStorage.removeItem("justLoggedIn");
    } catch { }
    const timer = setTimeout(() => setShowNoti(false), 2000);
    return () => clearTimeout(timer);
  }, [showNoti]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Desktop Patrol Menu
      if (patrolMenuRef.current && !patrolMenuRef.current.contains(e.target as Node)) {
        setIsPatrolOpen(false);
      }
      // User Menu
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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
      pqcleader: "PQC Leader",
    };
    return (
      roleMap[roleName.toLowerCase()] ||
      roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()
    );
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
      'bg-rose-600', 'bg-indigo-600', 'bg-cyan-600', 'bg-teal-600'
    ];
    if (!name) return colors[0];
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const menuItems = [
    { name: t('menu.dashboard'), path: `/${role}/dashboard`, icon: <FaChartPie />, shouldReload: false },
    { name: t('menu.smdSheet'), path: `/${role}/smd-sheet-logs`, icon: <FaFileAlt />, shouldReload: true },
    { name: t('menu.plan'), path: `/${role}/plan`, icon: <PiPlantFill />, shouldReload: true },
    {
      name: t('menu.patrolChecklist'),
      path: 'patrol',
      icon: <FaMicrochip />,
      isDropdown: true,
      children: [
        { name: t('menu.patrolManage'), path: `/${role}/patrol?view=manage`, shouldReload: false },
        { name: t('menu.patrolDaily'), path: `/${role}/patrol?view=list&type=daily`, shouldReload: false },
        { name: t('menu.patrolWeekly'), path: `/${role}/patrol?view=list&type=weekly`, shouldReload: false },
        { name: t('menu.patrolReport'), path: `/${role}/patrol?view=report`, shouldReload: false },
      ],
    },
    { name: t('menu.settings'), path: `/${role}/settings`, icon: <FaCog />, shouldReload: false },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    setUserMenuOpen(false);
  };

  const handleChangePassword = () => {
    setUserMenuOpen(false);
    setSidebarOpen(false);
    navigate(`/${role}/change-password`);
  };

  // Đóng cả sidebar và user menu khi click overlay
  const closeAllMenus = () => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {user && isAuthenticated && showNoti && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down px-2 whitespace-nowrap flex-nowrap">
          <div className="bg-green-50 border border-green-200 rounded-full shadow-lg flex flex-row items-center gap-3 py-2 px-4 flex-nowrap">
            <span className="flex items-center justify-center w-5 h-5 bg-green-500 text-white rounded-full text-xs shrink-0">✓</span>
            <span className="font-bold text-green-800 text-sm shrink-0">
              {t('msg_success')}
            </span>
            <div className="h-4 w-px bg-green-300 shrink-0" />
            <div className="text-green-700 text-xs font-medium flex flex-row items-center gap-1 shrink-0 flex-nowrap">
              <span>{t('user')}: <strong className="text-green-900">{user?.username}</strong></span>
              <span className="mx-1 text-green-300">|</span>
              <span>{t('role')}: <strong className="text-green-900">{user?.role}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR - DESKTOP */}
      <aside
        className={`hidden md:flex flex-col bg-white flex-shrink-0 transition-all duration-300 ease-in-out z-40 ${isSidebarCollapsed ? 'w-20' : 'w-64 lg:w-96'
          }`}
      >
        {/* Sidebar Title */}
        <div className="h-20 flex items-center shrink-0 overflow-hidden">
          {!isSidebarCollapsed && (
            <h1 className="text-[30px]! font-bold text-gray-800 truncate px-10 ml-4!">
              {getRoleDisplayName(role || "")} {t('menu.dashboard')}
            </h1>
          )}
          {isSidebarCollapsed && (
            <div className="w-full flex justify-center text-gray-800 font-bold text-2xl">
              {getRoleDisplayName(role || "").charAt(0)}
            </div>
          )}
        </div>

        <nav
          className="flex-1 my-3 overflow-y-auto px-3 py-2 w-full custom-scrollbar"
        >
          {menuItems.map((item) => {
            if (item.isDropdown) {
              const isDropdownActive = location.pathname.includes('patrol');
              return (
                <div key={item.path} ref={patrolMenuRef} className={`mb-3 transition-all w-full rounded-lg overflow-hidden ${isPatrolOpen ? 'bg-gray-700 shadow-md' : ''}`}>
                  <button
                    onClick={() => !isSidebarCollapsed && setIsPatrolOpen(!isPatrolOpen)}
                    className={`w-full h-11 transition-colors flex items-center gap-2 rounded-lg ${isSidebarCollapsed
                      ? "justify-center py-4 text-gray-600! hover:text-gray-900!"
                      : `px-4 py-3 justify-between ${isDropdownActive ? 'bg-gray-500 text-white font-semibold' : 'bg-gray-700 text-white hover:bg-gray-600'}`
                      }`}
                    title={isSidebarCollapsed ? item.name : ''}
                  >
                    <span className="text-xl! shrink-0">{item.icon}</span>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium text-sm ml-4">{item.name}</span>
                        <HiChevronDown className={`w-4 h-4 transform transition-transform ${isPatrolOpen ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {!isSidebarCollapsed && (
                    <div className={`grid transition-all duration-300 ease-in-out ${isPatrolOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden space-y-1">
                        {item.children?.map((child) => {
                          const [childPath] = child.path.split('?');
                          const currentSearch = window.location.search || "";
                          const isChildActive = child.path.includes('?')
                            ? window.location.href.includes(child.path)
                            : window.location.pathname === childPath && !currentSearch;

                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center h-11 px-4 !text-white transition-all text-sm text-decoration-none ${isChildActive
                                ? 'bg-gray-500 text-white font-semibold'
                                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            const isActive = location.pathname === item.path && !location.pathname.includes('patrol');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                reloadDocument={item.shouldReload}
                className={`flex items-center h-11 transition-colors mb-3 text-decoration-none gap-2 w-full rounded-lg ${isSidebarCollapsed
                  ? "justify-center py-4 text-gray-600! hover:text-gray-900!"
                  : `px-4 py-3 ${isActive ? "bg-gray-500 text-white font-semibold" : "bg-gray-700 text-white hover:bg-gray-600"}`
                  }`}
                title={isSidebarCollapsed ? item.name : ''}
              >
                <span className="text-xl! shrink-0">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="font-medium text-sm ml-4">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {!isSidebarCollapsed && (
          <div className="px-4 py-3 shrink-0">
            <img src={logo} alt="Logo" className="w-full h-auto object-contain opacity-80" />
          </div>
        )}
      </aside>

      {/* Main container Area */}
      <div
        className="flex-1 flex flex-col min-w-0 relative"
        style={{ '--sidebar-width': isSidebarCollapsed ? '80px' : '384px' } as React.CSSProperties}
      >
        {/* Header */}
        <header className="bg-white z-40 relative flex h-20 shrink-0 items-center px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Sidebar Toggle Button (Desktop) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-2 rounded hover:bg-gray-100 text-gray-700"
            >
              {isSidebarCollapsed ? <FaAnglesRight className="w-6 h-6" /> : <FaAnglesLeft className="w-6 h-6" />}
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <HiX className="w-6 h-6 text-gray-700" /> : <HiMenu className="w-6 h-6 text-gray-700" />}
            </button>

            {/* Mobile Title */}
            <h1 className="text-lg font-bold text-gray-800! md:hidden truncate min-w-0 flex-1">
              {getRoleDisplayName(role || "")} {t('menu.dashboard')}
            </h1>
          </div>

          {/* Desktop Language Selector */}
          <div className="hidden md:flex items-center gap-1 mr-4! px-1 py-1">
            {[
              { code: "vi", label: "VN" },
              { code: "en", label: "US" },
              { code: "ko", label: "KR" },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`text-sm! font-bold px-3 py-1 rounded-full! transition-all duration-200 ${
                  currentLang === lang.code
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-200"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="relative mr-2" ref={userMenuRef}>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-95 overflow-hidden"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={`w-full h-full rounded-full ${getAvatarColor(user?.username || '')} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm`}>
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl z-50 border border-gray-100 animate-fade-in-down origin-top-right">
                <div className="px-3 border-b border-gray-100 py-2 flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-800 truncate mb-0 ml-2! py-1">{user?.username}</p>
                </div>
                <div className="">
                  <button
                    onClick={handleChangePassword}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FaKey className="w-4 h-4 text-gray-400" />
                    {t('changePassword')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
                  >
                    <HiLogout className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="p-6! md:p-6 lg:p-8 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MOBILE SIDEBAR (Drawer) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={closeAllMenus}
      />
      <div className={`fixed inset-y-0 left-0 bg-white z-50 md:hidden flex flex-col w-[80%] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex justify-start px-4 pt-4 pb-2">
          <button onClick={closeAllMenus} className="p-2 rounded hover:bg-gray-100">
            <HiX className="w-7 h-7 text-gray-700" />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col items-center border-gray-100">
          <img src={logo} alt="Logo" className="w-32 h-auto" />
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2">
          {menuItems.map((item) => (
            item.isDropdown ? (
              <div key={item.path} className="mb-3 overflow-hidden rounded-lg bg-gray-700">
                <button
                  onClick={() => setIsMobilePatrolOpen(!isMobilePatrolOpen)}
                  className={`w-full text-left px-4 py-4 text-white font-medium flex justify-between items-center transition-colors ${location.pathname.includes('patrol') ? 'bg-gray-500' : 'hover:bg-gray-600'}`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.name}
                  </span>
                  <span className={`transform transition-transform ${isMobilePatrolOpen ? 'rotate-180' : ''}`}>▲</span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isMobilePatrolOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    {item.children?.map((child) => {
                      const isChildActive = location.pathname === child.path.split('?')[0] &&
                        (child.path.includes('?') ? window.location.href.includes(child.path) : !window.location.search);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={closeAllMenus}
                          className={`flex items-center h-11 px-4 text-white text-sm transition-all text-decoration-none ${isChildActive ? 'bg-gray-600 font-bold' : 'hover:bg-gray-600'}`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeAllMenus}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-4 rounded-lg transition-colors mb-4 text-lg font-medium text-decoration-none ${isActive ? "bg-gray-500 text-white font-semibold" : "bg-gray-700 text-white"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            )
          ))}
        </nav>
        <div className="px-4 py-6 border-t border-gray-200">
          <img src={logo} alt="Logo" className="w-full max-w-[200px] mx-auto" />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media (min-width: 768px) {
          .patrol-action-bar {
            left: calc(var(--sidebar-width, 0px) + 1.5rem) !important;
            right: 1.5rem !important;
            bottom: 0px !important;
            transition: left 0.3s ease-in-out;
          }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default RoleBasedLayout;
