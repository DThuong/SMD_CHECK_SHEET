import { useState, useEffect } from "react";
import { Link,NavLink, Outlet } from "react-router-dom";
import { HiMenu, HiX, HiLogout, HiUser } from "react-icons/hi";
import logo from "../../assets/image/brand_image_3.webp";
import { useAuth } from "../../pages/authLoginSample/AuthContext";

const AdminLayout = () => {
  // State quản lý trạng thái mở/đóng sidebar trên mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // State quản lý trạng thái mở/đóng dropdown user menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);

    // trạng thái thông báo
    // --- Notification logic ---
    const [showNoti, setShowNoti] = useState(() => {
      try {
        return sessionStorage.getItem("justLoggedIn") === "1";
      } catch {
        return false;
      }
    });
  
   useEffect(() => {
      if (!showNoti) return;
  
      // Xóa flag ngay khi dashboard mount lần đầu
      try { sessionStorage.removeItem("justLoggedIn"); } catch {}
  
      const timer = setTimeout(() => setShowNoti(false), 4000);
      return () => clearTimeout(timer);
    }, [showNoti]);

  // useAuth 
  const { logout, user } = useAuth();

  // Danh sách menu items cho sidebar
  const menuItems = [
    { name: "Dashboard", path: "dashboard" },
    { name: "Profile", path: "profile" },
    { name: "User", path: "user" },
    { name: "Logs", path: "logs" },
    { name: "Settings", path: "settings" },
  ];

  // Hàm xử lý logout
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 ">
      {showNoti && 
      <div className="slide-noti w-full max-w-[900px] left-1/2 -translate-x-1/2">
        <div className="noti-inner bg-green-50 border-l-4 border-green-600 p-3 rounded shadow">
                  <p className="font-bold text-green-800 text-lg">Đăng nhập thành công!</p>
                  <p className="text-green-700 text-sm mt-1">
                    User: <strong>{user?.fullName}</strong> - Role: <strong>{user?.role}</strong>
                    
                  </p>
          </div>
      </div>
      }
      {/* Header - Fixed top */}
    <header className="bg-white shadow-md z-40 relative flex">
        {/* Phần header sidebar - chỉ hiện trên desktop */}
        <div className="hidden md:block w-64 lg:w-96 px-4 py-3 border-gray-200">
          <Link to="/admin/dashboard" className="text-decoration-none lg:text-4xl md:text-2xl font-bold text-gray-800!">Admin Dashboard</Link>
        </div>

        {/* Phần header chính */}
        <div className="flex-1 flex items-center justify-between lg:justify-end md:justify-end lg:px-4 md:px-4 px-3 py-3">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <HiX className="w-6 h-6 text-gray-700" />
            ) : (
              <HiMenu className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Logo/Title - Hiện trên mobile khi sidebar đóng */}
          <h1 className={`text-xl font-bold text-gray-800 ${sidebarOpen ? 'hidden' : 'block'} md:hidden`}>
            Admin Dashboard
          </h1>

          {/* User Menu - Bên phải header, ẩn khi sidebar mở trên mobile */}
          <div className={`relative ml-auto ${sidebarOpen ? 'hidden md:block' : 'block'}`}>
            <button
              className="flex items-center mx-2 px-3 py-2 rounded hover:bg-gray-100"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <HiUser className="w-5 h-5 text-gray-700" />
              <span className="hidden sm:inline text-gray-700">Welcome, {user?.fullName}</span>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                >
                  <HiLogout className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main container - Flex row cho sidebar và content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Bên trái */}
        <aside
          className={`
            fixed md:relative top-18 lg:top-0 md:top-0 left-0 z-30
            w-64 lg:w-96 bg-white shadow-lg 
            transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            transition-transform duration-300 ease-in-out
            flex flex-col
            h-[calc(100vh-56px)] md:h-full
            mt-14 md:mt-0 
          `}
        >
          {/* Navigation menu */}
          <nav className="flex-1 my-3 overflow-y-auto px-3 py-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)} // Đóng sidebar khi click trên mobile
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

          {/* Footer info trong sidebar */}
          <div className="px-4 py-3 border-t border-gray-200">
            <img src={logo} alt="" className="w-full h-full object-cover" />
          </div>
        </aside>

        {/* Overlay cho mobile khi sidebar mở */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden mt-14"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area - Bên phải */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Outlet render các page con */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;