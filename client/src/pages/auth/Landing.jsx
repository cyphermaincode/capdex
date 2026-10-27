import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  ShieldCheck,
  Sparkles,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Sliders,
  Cpu
} from 'lucide-react';

export default function Landing() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password) => {
    try {
      const u = await login(email, password);
      if (u.isLaidOff) {
        navigate('/laid-off', { state: { user: u.user } });
        return;
      }
      const dest = u.role === 'HR' ? '/hr' : u.role === 'MANAGER' ? '/manager' : '/employee';
      navigate(dest);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-black">
      {/* Navigation */}
      <header className="border-b border-slate-850 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-brand-500/20">
            C
          </div>
          <span className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            CAPDEX
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-bold border border-brand-500/20">
              Enterprise
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => {
                const dest = user?.role === 'HR' ? '/hr' : user?.role === 'MANAGER' ? '/manager' : '/employee';
                navigate(dest);
              }}
              className="px-4 py-2 rounded-lg bg-brand-500 text-black font-bold text-xs hover:bg-brand-400 transition flex items-center gap-2"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs hover:bg-slate-700 hover:text-white transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-brand-400 mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" /> Next-Generation Continuous Performance Diagnostics
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight max-w-4xl mx-auto">
          Objective Appraisals Powered by{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            AI Intelligence
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          CAPDEX transforms traditional annual reviews into a structured, weighted appraisal engine. Enforce strict role-based access, eliminate bias with mandatory score justifications, and empower employees with actionable AI guidance.
        </p>

        {/* 1-Click Interactive Demo Portals */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto text-left shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Interactive Quick Demo Access
            </span>
            <span className="text-[11px] text-slate-500">Click any role to test immediately</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickLogin('hr@capdex.com', 'Password123!')}
              className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 hover:border-purple-500 hover:bg-purple-950/20 text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  HR Admin
                </span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs font-bold text-white">Sarah Jenkins</p>
              <p className="text-[11px] text-slate-400 mt-1">Evaluations, Parameters & Org-wide Reports</p>
            </button>

            <button
              onClick={() => handleQuickLogin('manager.eng@capdex.com', 'Password123!')}
              className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-950/20 text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                  Team Manager
                </span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs font-bold text-white">David Miller</p>
              <p className="text-[11px] text-slate-400 mt-1">Team Analytics, Comments & Nominations</p>
            </button>

            <button
              onClick={() => handleQuickLogin('emp.dev1@capdex.com', 'Password123!')}
              className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-950/20 text-left transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Employee
                </span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </div>
              <p className="text-xs font-bold text-white">Alex Johnson</p>
              <p className="text-[11px] text-slate-400 mt-1">Radar Scores, AI Feedback & Goals</p>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Weighted 100% Parameter Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Define custom competencies per job role strictly verified to sum to 100%. Mandatory written justifications ensure every score is documented with concrete rationale.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dual-Mode AI Feedback</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Synthesizes qualitative HR justification notes into structured Strengths, Skill Gaps, and 90-day Actionable Growth Suggestions using OpenAI or deterministic fallback.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Strict Three-Tier RBAC</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Row-level security ensures Managers see only their department, Employees access strictly their own reviews, and HR holds full administrative oversight.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-850 py-8 px-6 text-center text-xs text-slate-500">
        CAPDEX Continuous Appraisal System • Built to production PRD specification.
      </footer>
    </div>
  );
}
