import { useState, useEffect } from 'react';
import logo from '../../assets/image/brand_image_3.webp';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // disable body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-gray-700! no-underline font-semibold hover:opacity-75 text-decoration-none">
              Login →
            </Link>
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
          <div className="h-full flex flex-col ">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-40 h-20 rounded overflow-hidden">
                  <Link to="/"><img src={logo} alt="logo" className="w-full h-full object-cover" /></Link>
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

            <div className="flex-1 px-4 py-6 my-3">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-3 rounded-lg font-medium hover:bg-gray-500 border border-gray-300 text-decoration-none text-white bg-gray-700 mb-3"
              >
                Login
              </Link>

              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-3 rounded-lg font-medium hover:bg-gray-500 border border-gray-300 text-decoration-none text-white bg-gray-700"
              >
                Profile
              </Link>

              {/* thêm link khác */}
            </div>
          </div>
        </aside>
      </nav>
    </header>
  );
};

export default Header;
