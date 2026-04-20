import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../App';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface NavbarProps {
  onAdminLogout: () => void;
}

export default function Navbar({ onAdminLogout }: NavbarProps) {
  const { user, profile, isAdminAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleAdminLogoutClick = () => {
    onAdminLogout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="mr-3 h-10 w-10 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-100 group-hover:scale-110 transition-transform">
                <img 
                  src="/logo.png" 
                  alt="SM Enterprise Logo" 
                  className="h-full w-full object-contain p-1"
                  onError={(e) => {
                    // Fallback to old icon if logo file is missing
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }}>
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <span className="text-2xl font-black text-blue-600 tracking-tighter hidden md:block">
                SM ENTERPRISE <span className="text-gray-900 font-light">& LAPTOP HOUSE</span>
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link to="/" className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">Home</Link>
              <Link to="/about" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">About</Link>
              <Link to="/contact" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">Contact</Link>
              <Link to="/help" className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">Help</Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAdminAuthenticated && (
              <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-2 rounded-md bg-blue-50">
                Admin Panel
              </Link>
            )}
            {isAdminAuthenticated && (
              <button onClick={handleAdminLogoutClick} className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-md bg-red-50">
                Logout Admin
              </button>
            )}
            {user ? (
              <>
                <Link to="/profile" className="text-gray-500 hover:text-gray-700 p-2 rounded-full">
                  <User className="h-6 w-6" />
                </Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 p-2 rounded-full">
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              <Link to="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">
                Login
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className="block pl-3 pr-4 py-2 border-l-4 border-blue-500 text-base font-medium text-blue-700 bg-blue-50">Home</Link>
            <Link to="/about" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">About</Link>
            <Link to="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">Contact</Link>
            <Link to="/help" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">Help</Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="space-y-1">
                <Link to="/dashboard" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Dashboard</Link>
                <Link to="/profile" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">My Profile</Link>
                {isAdminAuthenticated && <Link to="/admin" className="block px-4 py-2 text-base font-medium text-blue-600 hover:bg-gray-100">Admin Panel</Link>}
                {isAdminAuthenticated && <button onClick={handleAdminLogoutClick} className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-gray-100">Logout Admin</button>}
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Logout</button>
              </div>
            ) : (
              <div className="px-4 py-2">
                <Link to="/login" className="block text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Login</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
