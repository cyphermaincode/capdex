import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sparkles, LogOut, Home } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import StatusBadge from './StatusBadge';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Home Navigation */}
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition group"
          title="Return to CAPDEX Home"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-black text-sm shadow-md shadow-brand-500/20 lg:hidden">
            C
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
            CAPDEX Portal
          </span>
        </Link>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-xs font-bold text-slate-200">
          {user?.role === 'HR'
            ? 'Admin & Strategic Operations'
            : user?.role === 'MANAGER'
            ? 'Team Performance Oversight'
            : 'Personal Growth & Review Hub'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-slate-300 font-medium">
            AI Feedback Engine: <strong className="text-emerald-400">Active</strong>
          </span>
        </div>

        <Link
          to="/"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition hidden sm:flex items-center gap-1.5 text-xs font-semibold"
          title="Go to Public Landing Page"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Home</span>
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <StatusBadge status={user?.role} />
        </div>

        {/* Direct Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition border border-rose-500/20"
          title="Sign out of current account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
