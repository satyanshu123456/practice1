import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { getImageUrl } from '../../utils/imageHelper';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl">M</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CollabSpace
          </span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4 md:space-x-5">
            <NotificationDropdown />

            <Link
              to="/profile"
              className="flex items-center space-x-2.5 text-slate-300 hover:text-white transition group"
            >
              <img
                src={getImageUrl(user.avatarUrl)}
                alt={user.name}
                className="w-9 h-9 rounded-full ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 object-cover"
              />
              <span className="hidden md:inline font-medium text-sm">{user.name}</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-md transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
