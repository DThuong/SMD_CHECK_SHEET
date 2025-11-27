import { useState } from 'react';
import logo from '../../assets/image/brand_image_3.webp'
import {Link} from 'react-router-dom'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white text-black border-b border-gray-200 px-3 lg:px-0">
      <nav className="lg:max-w-7xl mx-auto px-6 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-64 h-20 rounded-lg">
                <img className='w-full h-full object-cover' src={logo} alt="" />
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="text-black text-decoration-none font-semibold hover:opacity-75">
              Login →
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 py-2">
            <a href="#" className="text-decoration-none text-black block px-2 py-2 rounded-lg hover:bg-gray-800 font-semibold">
              Login
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;