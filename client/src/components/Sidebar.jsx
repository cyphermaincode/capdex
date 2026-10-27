import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Sliders,
  ClipboardCheck,
  Award,
  BarChart3,
  Target,
  UserCheck,
  LogOut,
  Sparkles,
  GitPullRequest,
  Home
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hrLinks = [
    { name: 'HR Dashboard', path: '/hr', icon: LayoutDashboard, exact: true },
    { name: 'Employee Directory', path: '/hr/employees', icon: Users },
    { name: 'Department Mgmt', path: '/hr/departments', icon: Building2 },
    { name: 'Evaluation Parameters', path: '/hr/parameters', icon: Sliders },
    { name: 'Evaluate Employee', path: '/hr/evaluate', icon: ClipboardCheck },
    { name: 'Promotion Readiness', path: '/hr/promotions', icon: Award },
    { name: 'Analytics & Reports', path: '/hr/analytics', icon: BarChart3 },
  ];

  const managerLinks = [
    { name: 'Team Dashboard', path: '/manager', icon: LayoutDashboard, exact: true },
    { name: 'Team Evaluations', path: '/manager/evaluations', icon: ClipboardCheck },
    { name: 'Promotion Nominations', path: '/manager/promotions', icon: Award },
    { name: 'Parameter Requests', path: '/manager/change-requests', icon: GitPullRequest },
    { name: 'Team Analytics', path: '/manager/analytics', icon: BarChart3 },
  ];

  const employeeLinks = [
    { name: 'My Performance', path: '/employee', icon: LayoutDashboard, exact: true },
    { name: 'Evaluations & AI Feedback', path: '/employee/history', icon: Sparkles },
    { name: 'Growth Goals', path: '/employee/goals', icon: Target },
    { name: 'My Profile', path: '/employee/profile', icon: UserCheck },
  ];

  const navLinks =
    user?.role === 'HR'
      ? hrLinks
      : user?.role === 'MANAGER'
      ? managerLinks
      : employeeLinks;

  const defaultRolePath =
    user?.role === 'HR' ? '/hr' : user?.role === 'MANAGER' ? '/manager' : '/employee';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header & Home Link */}
        <Link
          to="/"
          onClick={() => setIsOpen(false)}
          className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 hover:bg-slate-800/50 transition group cursor-pointer"
          title="Return to CAPDEX Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            C
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              CAPDEX
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 -mt-0.5 group-hover:text-brand-400 transition">
              ← Go to Home Page
            </p>
          </div>
        </Link>

        {/* User Identity Brief */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <StatusBadge status={user?.role} />
              </div>
            </div>
          </div>
          {user?.departmentName && (
            <p className="text-[11px] text-slate-400 mt-2 font-medium truncate flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              {user.departmentName}
            </p>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout & Home Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          to="/"
          onClick={() => setIsOpen(false)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <Home className="w-4 h-4 shrink-0 text-slate-500" />
          <span>Public Home Page</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
