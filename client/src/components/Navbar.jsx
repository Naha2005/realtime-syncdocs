import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, FileText, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200/80 dark:border-darkBorder/80 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-primary-500 rounded-xl text-white shadow-md shadow-primary-500/30 transform group-hover:scale-105 transition-all">
                <FileText className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-600 to-sky-400 bg-clip-text text-transparent dark:from-primary-400 dark:to-sky-300">
                CollabDocs
              </span>
            </Link>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-4">
            {/* Dashboard shortcut */}
            <Link
              to="/"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-darkBorder/40 rounded-xl transition-all"
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-darkBorder/40 rounded-xl transition-all"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400 animate-pulse" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Divider */}
            <span className="h-6 w-px bg-gray-200 dark:bg-darkBorder" />

            {/* User Profile */}
            {user && (
              <div className="flex items-center space-x-3 pl-2">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary-500/20 dark:ring-primary-500/40"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
                  }}
                />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-none">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-400 truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>
            )}

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-xl transition-all"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
