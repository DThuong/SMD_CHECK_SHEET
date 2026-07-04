/* eslint-disable no-empty */
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { HiMenu, HiX, HiLogout, HiChevronDown } from "react-icons/hi";
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import { FaUser, FaChartPie, FaFile, FaC, FaMicrochip } from "react-icons/fa6";
import { MdEngineering } from "react-icons/md";
import { PiPlantFill } from "react-icons/pi";
import logo from "../../assets/image/brand_image_3.webp";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { logoutUser } from "../../redux/slices/authSlice";
import { useTranslation } from "react-i18next";

const AdminLayout = () => {
  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Dropdown dùng chung cho các menu có submenu (patrol, engCheckSheet, ...)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { t, i18n } = useTranslation("common");
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
    await i18n.reloadResources(langCode, [
      "settings",
      "dashboard",
      "logs",
      "common",
      "patrol",
    ]);

    await i18n.changeLanguage(langCode);
    localStorage.setItem("appLanguage", langCode);
    setCurrentLang(langCode);
  } catch (error) {
    console.error("Error changing language:", error);
  }
};

  // Redux
  const { user, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown-menu]')) {
        setOpenDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Menu items
  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FaChartPie />, shouldReload: false },
    { name: "User", path: "/admin/user", icon: <FaUser />, shouldReload: false },
    { name: "SMD SHEET", path: "/admin/smd-sheet-logs", icon: <FaFile />, shouldReload: false },
    { name: "Plan", path: "/admin/plan", icon: <PiPlantFill />, shouldReload: false },
    {
      name: t('menu.engCheckSheet'),
      path: "engCheckSheet",
      icon: <MdEngineering />,
      isDropdown: true,
      children: [
        { name: t('menu.engManage'), path: "/admin/engCheckSheet?view=manage", shouldReload: false },
        { name: t('menu.engDaily'), path: "/admin/engCheckSheet?view=list&type=daily", shouldReload: false },
        { name: t('menu.engWeekly'), path: "/admin/engCheckSheet?view=list&type=weekly", shouldReload: false },
        { name: t('menu.engReport'), path: "/admin/engCheckSheet?view=report", shouldReload: false },
      ],
    },
    {
      name: "Patrol Check list",
      path: "patrol",
      icon: <FaMicrochip />,
      isDropdown: true,
      children: [
        { name: t('menu.patrolManage'), path: "/admin/patrol?view=manage", shouldReload: false },
        { name: t('menu.patrolDaily'), path: "/admin/patrol?view=list&type=daily", shouldReload: false },
        { name: t('menu.patrolWeekly'), path: "/admin/patrol?view=list&type=weekly", shouldReload: false },
        { name: t('menu.patrolReport'), path: "/admin/patrol?view=report", shouldReload: false },
      ],
    },
    { name: "Settings", path: "/admin/settings", icon: <FaC />, shouldReload: false },
  ];

  // Handlers
  const handleLogout = () => {
    dispatch(logoutUser());
    setUserMenuOpen(false);
    setSidebarOpen(false);
  };

  const closeAllMenus = () => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
      "bg-rose-600", "bg-indigo-600", "bg-cyan-600", "bg-teal-600",
    ];
    if (!name) return colors[0];
    const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside
        className={`hidden md:flex flex-col bg-white shrink-0 transition-all duration-300 ease-in-out z-40 ${isSidebarCollapsed ? "w-20" : "w-64 lg:w-96"
          }`}
      >
        {/* Sidebar Title */}
        <div className="h-20 flex items-center shrink-0 overflow-hidden px-4">
          {!isSidebarCollapsed ? (
            <h1 className="text-lg font-bold text-gray-800 truncate">
              Admin Dashboard
            </h1>
          ) : (
            <div className="w-full flex justify-center text-gray-800 font-bold text-2xl">
              A
            </div>
          )}
        </div>

        <nav
          className="flex-1 my-3 overflow-y-auto px-3 py-2 w-full custom-scrollbar"
        >
          {menuItems.map((item) => {
            if (item.isDropdown) {
              const isDropdownActive = location.pathname.includes(item.path);
              const isOpen = openDropdown === item.path;
              return (
                <div
                  key={item.path}
                  data-dropdown-menu
                  className={`mb-3 transition-all w-full rounded-lg overflow-hidden ${isOpen ? "bg-gray-700 shadow-md" : ""}`}
                >
                  <button
                    onClick={() => !isSidebarCollapsed && setOpenDropdown(isOpen ? null : item.path)}
                    className={`w-full h-11 transition-colors flex items-center gap-2 rounded-lg ${isSidebarCollapsed
                        ? "justify-center py-4 text-gray-600! hover:text-gray-900!"
                        : `px-4 py-3 justify-between ${isDropdownActive ? "bg-gray-500 text-white font-semibold" : "bg-gray-700 text-white hover:bg-gray-600"}`
                      }`}
                    title={isSidebarCollapsed ? item.name : ""}
                  >
                    <span className="text-xl! shrink-0">{item.icon}</span>
                    {!isSidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium text-sm ml-4">{item.name}</span>
                        <HiChevronDown className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </>
                    )}
                  </button>
                  {!isSidebarCollapsed && (
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden space-y-1">
                        {item.children?.map((child) => {
                          const [childPath] = child.path.split("?");
                          const currentSearch = window.location.search || "";
                          const isChildActive = child.path.includes("?")
                            ? window.location.href.includes(child.path)
                            : window.location.pathname === childPath && !currentSearch;

                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center h-11 px-4 text-white! transition-all text-sm text-decoration-none ${isChildActive
                                  ? "bg-gray-500 text-white font-semibold"
                                  : "text-gray-300 hover:bg-gray-600 hover:text-white"
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

            const isActive = location.pathname === item.path && !location.pathname.includes("patrol");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                reloadDocument={item.shouldReload}
                className={`flex items-center h-11 transition-colors mb-3 text-decoration-none gap-2 w-full rounded-lg ${isSidebarCollapsed
                    ? "justify-center py-4 text-gray-600! hover:text-gray-900!"
                    : `px-4 py-3 ${isActive ? "bg-gray-500 text-white font-semibold" : "bg-gray-700 text-white hover:bg-gray-600"}`
                  }`}
                title={isSidebarCollapsed ? item.name : ""}
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

      {/* ===================== MAIN CONTAINER ===================== */}
      <div
        className="flex-1 flex flex-col min-w-0 relative"
        style={{ '--sidebar-width': isSidebarCollapsed ? '80px' : '384px' } as React.CSSProperties}
      >

        {/* Header */}
        <header className="bg-white z-40 relative flex h-20 shrink-0 items-center px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Sidebar Toggle (Desktop) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-2 rounded hover:bg-gray-100 text-gray-700"
            >
              {isSidebarCollapsed
                ? <FaAnglesRight className="w-6 h-6" />
                : <FaAnglesLeft className="w-6 h-6" />
              }
            </button>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen
                ? <HiX className="w-6 h-6 text-gray-700" />
                : <HiMenu className="w-6 h-6 text-gray-700" />
              }
            </button>

            {/* Mobile Title */}
            <h1 className="text-lg font-bold text-gray-800! md:hidden truncate min-w-0 flex-1">
              Admin Dashboard
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
              <div
                className={`w-full h-full rounded-full ${getAvatarColor(user?.username || "")} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm`}
              >
                {(user?.username || "A").charAt(0).toUpperCase()}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl z-50 border border-gray-100 animate-fade-in-down origin-top-right">
                <div className="px-3 border-b border-gray-100 py-2 flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-800 truncate mb-0 ml-2! py-1">
                    {user?.username}
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group disabled:opacity-50"
                  >
                    <HiLogout className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                    {loading ? "Logging out..." : "Đăng xuất"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ===================== MOBILE SIDEBAR OVERLAY ===================== */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={closeAllMenus}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 bg-white z-50 md:hidden flex flex-col w-[80%] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex justify-start px-4 pt-4 pb-2">
          <button onClick={closeAllMenus} className="p-2 rounded hover:bg-gray-100">
            <HiX className="w-7 h-7 text-gray-700" />
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col items-center border-gray-100">
          <img src={logo} alt="Logo" className="w-32 h-auto" />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2">
          {menuItems.map((item) =>
            item.isDropdown ? (
              <div key={item.path} className="mb-3 overflow-hidden rounded-lg bg-gray-700">
                <button
                  onClick={() => setMobileOpenDropdown(mobileOpenDropdown === item.path ? null : item.path)}
                  className={`w-full text-left px-4 py-4 text-white font-medium flex justify-between items-center transition-colors ${location.pathname.includes(item.path) ? "bg-gray-500" : "hover:bg-gray-600"
                    }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.name}
                  </span>
                  <span className={`transform transition-transform ${mobileOpenDropdown === item.path ? "rotate-180" : ""}`}>▲</span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${mobileOpenDropdown === item.path ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                  <div className="overflow-hidden">
                    {item.children?.map((child) => {
                      const isChildActive =
                        location.pathname === child.path.split("?")[0] &&
                        (child.path.includes("?")
                          ? window.location.href.includes(child.path)
                          : !window.location.search);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={closeAllMenus}
                          className={`flex items-center h-11 px-4 text-white text-sm transition-all text-decoration-none ${isChildActive ? "bg-gray-600 font-bold" : "hover:bg-gray-600"
                            }`}
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
          )}
        </nav>

        <div className="px-4 py-6 border-t border-gray-200">
          <img src={logo} alt="Logo" className="w-full max-w-[200px] mx-auto" />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
        @media (min-width: 768px) {
          .patrol-action-bar,
          .eng-action-bar {
            left: calc(var(--sidebar-width, 0px) + 1.5rem) !important;
            right: 1.5rem !important;
            bottom: 0px !important;
            transition: left 0.3s ease-in-out;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;