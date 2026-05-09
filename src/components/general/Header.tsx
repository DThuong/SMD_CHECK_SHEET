import { useState, useEffect } from 'react';
import logo from '../../assets/image/brand_image_3.webp';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logoutUser } from '../../redux/slices/authSlice';
import { FaKey, FaListUl, FaChartPie, FaMicrochip, FaPencil } from 'react-icons/fa6';
import { TbLogout } from "react-icons/tb";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPatrolOpen, setIsPatrolOpen] = useState(false);
  const [isMobilePatrolOpen, setIsMobilePatrolOpen] = useState(false);
  
  const { user, isAuthenticated, loading } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();



  // Disable body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const dropdownContainer = document.querySelector('.user-dropdown');
      const patrolDropdownContainer = document.querySelector('.patrol-dropdown');
      
      if (dropdownContainer && !dropdownContainer.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (patrolDropdownContainer && !patrolDropdownContainer.contains(target)) {
        setIsPatrolOpen(false);
      }
    };

    if (isDropdownOpen || isPatrolOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isPatrolOpen]);

  const handleChangePassword = () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    if (user?.role === 'PQC') {
      navigate('/change-password');
    } else {
      const roleLower = user?.role?.toLowerCase();
      navigate(`/${roleLower}/change-password`);
    }
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      
      setIsMenuOpen(false);
      setIsDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsMenuOpen(false);
      setIsDropdownOpen(false);
      navigate('/login');
    }
  };

  return (
    <header className="bg-white text-black border-b border-gray-200 px-3 lg:px-0">
      <nav className="lg:max-w-7xl mx-auto px-6 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center mx-2">
              <div className="w-64 h-20 rounded-lg overflow-hidden">
                <img className="w-full h-full object-cover" src={logo} alt="brand" />
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {/* Removed standalone Patrol dropdown */}
            {user && isAuthenticated ? (
              <>
                
                <div className="flex items-center gap-1">
                  {/* Welcome message */}
                  <span className="text-sm text-gray-600">
                    Xin chào, <span className="text-blue-600">{user.fullName}</span>
                  </span>

                  {/* User dropdown */}
                  <div className="relative user-dropdown">
                    {isDropdownOpen && (
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                        }}
                        style={{ background: 'transparent' }}
                      />
                    )}
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition relative z-50"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user?.username?.charAt(0).toUpperCase() }
                      </div>
                      <svg 
                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl border border-gray-200 z-50">
                        <div className="">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPatrolOpen(!isPatrolOpen);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors rounded-md text-gray-600 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              <FaMicrochip className="text-gray-400" />
                              <span>Patrol</span>
                            </div>
                            <svg className={`w-4 h-4 transition-transform ${isPatrolOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {isPatrolOpen && (
                            <div className="space-y-1 animate-fade-in">
                               <Link 
                                to="/pqc-patrol?view=list&type=daily" 
                                className="flex items-center gap-2 px-8! py-2 text-decoration-none text-sm !text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  setIsPatrolOpen(false);
                                }}
                              >
                                <FaPencil className="text-gray-400 text-xs" />
                                Patrol Ngày
                              </Link>
                              <Link 
                                to="/pqc-patrol?view=list&type=weekly" 
                                className="flex items-center gap-2 px-8! py-2 text-decoration-none text-sm !text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  setIsPatrolOpen(false);
                                }}
                              >
                                <FaPencil className="text-gray-400 text-xs" />
                                Patrol Tuần
                              </Link>
                              <Link 
                                to="/pqc-patrol?view=report" 
                                className="flex items-center gap-2 px-8! py-2 text-sm text-decoration-none !text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  setIsPatrolOpen(false);
                                }}
                              >
                                <FaChartPie className="text-gray-400 text-xs" />
                                Báo cáo Patrol
                              </Link>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-gray-100"></div>

                        <button
                          onClick={handleChangePassword}
                          disabled={loading}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <FaKey className="text-gray-400" />
                          Đổi mật khẩu
                        </button>

                        <button
                          onClick={handleLogout}
                          disabled={loading}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                         <TbLogout />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Hiển thị khi chưa login
              <Link to="/login" className="text-gray-700! no-underline font-semibold hover:opacity-75 text-decoration-none">
                Login →
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen((s) => !s)}
            className="md:hidden p-2"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile sliding nav + backdrop */}
        {/* Backdrop */}
        <div
          aria-hidden={!isMenuOpen}
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-60 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Sliding panel */}
        <aside
          className={`fixed top-0 right-0 z-50 h-full w-[70%] max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out
            ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-40 h-20 rounded overflow-hidden">
                  <Link to="/" onClick={() => setIsMenuOpen(false)}>
                    <img src={logo} alt="logo" className="w-full h-full object-cover" />
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
                className="p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-4 py-6 mt-3 overflow-y-auto">
              {user ? (
                // Menu khi đã login
                <>
                  <div className="mb-3 overflow-hidden transition-all bg-gray-700">
                    <button
                      onClick={() => setIsMobilePatrolOpen(!isMobilePatrolOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 font-medium transition text-white ${window.location.pathname.includes('patrol') ? 'bg-gray-500' : 'hover:bg-gray-600'}`}
                    >
                      <div className="flex items-center gap-3">
                        <FaMicrochip />
                        <span>Patrol Check list</span>
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${isMobilePatrolOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div className={`grid transition-all duration-300 ease-in-out ${isMobilePatrolOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <Link 
                          to="/pqc-patrol?view=list&type=daily" 
                          className={`flex items-center h-11 gap-3 px-4 text-decoration-none text-white transition-colors ${window.location.href.includes('type=daily') ? 'bg-gray-600 font-bold' : 'hover:bg-gray-600/70'}`} 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <FaPencil className="opacity-70" />
                          Patrol Ngày
                        </Link>
                        <Link 
                          to="/pqc-patrol?view=list&type=weekly" 
                          className={`flex items-center h-11 gap-3 px-4 text-decoration-none text-white transition-colors ${window.location.href.includes('type=weekly') ? 'bg-gray-600 font-bold' : 'hover:bg-gray-600/70'}`} 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <FaPencil className="opacity-70" />
                          Patrol Tuần
                        </Link>
                        <Link 
                          to="/pqc-patrol?view=report" 
                          className={`flex items-center h-11 gap-3 px-4 text-decoration-none text-white transition-colors ${window.location.href.includes('view=report') ? 'bg-gray-600 font-bold' : 'hover:bg-gray-600/70'}`} 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <FaChartPie className="opacity-70" />
                          Báo cáo Patrol
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <button
                  disabled={loading}
                    onClick={handleChangePassword}
                    className="w-full flex items-center gap-3 px-3 py-3 mb-3 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition"
                  >
                   <FaKey />
                    Đổi mật khẩu
                  </button>

                  <button
                  disabled={loading}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition"
                  >
                   <TbLogout />
                    Logout
                  </button>
                </>
              ) : (
                // Menu khi chưa login
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-3 rounded-lg font-medium hover:bg-gray-600 border border-gray-300 no-underline text-white bg-gray-700 mb-3"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </aside>
      </nav>

      {/* CSS cho animation fade-in */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;