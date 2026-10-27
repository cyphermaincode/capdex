import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Shield, Lock, Mail, AlertCircle, Loader2, Zap, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.isLaidOff) {
        navigate('/laid-off', { state: { user: result.user }, replace: true });
        return;
      }
      const defaultDest =
        result.role === 'HR' ? '/hr' : result.role === 'MANAGER' ? '/manager' : '/employee';
      navigate(from || defaultDest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-brand-500/20">
            C
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">CAPDEX</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold text-white tracking-tight">Sign in to your portal</h2>
        <p className="mt-1 text-xs text-slate-400">Continuous Appraisal & Performance Diagnostic Expert</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@capdex.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Click Demo Logins
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill('hr@capdex.com', 'Password123!')}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-purple-500/30 hover:border-purple-500 text-xs font-medium text-purple-300 hover:bg-purple-950/20 transition flex items-center justify-between"
              >
                <span>HR Admin (Sarah Jenkins)</span>
                <span className="text-[10px] text-slate-500">hr@capdex.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('manager.eng@capdex.com', 'Password123!')}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-blue-500/30 hover:border-blue-500 text-xs font-medium text-blue-300 hover:bg-blue-950/20 transition flex items-center justify-between"
              >
                <span>Eng Manager (David Miller)</span>
                <span className="text-[10px] text-slate-500">manager.eng@capdex.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('emp.dev1@capdex.com', 'Password123!')}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 text-xs font-medium text-emerald-300 hover:bg-emerald-950/20 transition flex items-center justify-between"
              >
                <span>Top Performer (Alex Johnson)</span>
                <span className="text-[10px] text-slate-500">emp.dev1@capdex.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('emp.kevin@capdex.com', 'Password123!')}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-rose-500/30 hover:border-rose-500 text-xs font-medium text-rose-300 hover:bg-rose-950/20 transition flex items-center justify-between"
              >
                <span>Underperforming / Layoff Pool (Kevin Vance)</span>
                <span className="text-[10px] text-slate-500">emp.kevin@capdex.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
