import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Mail,
  ShieldAlert,
  FileText,
  Building2,
  Calendar,
  ArrowRight,
  LogOut,
  HelpCircle
} from 'lucide-react';

export default function LaidOffNotice() {
  const location = useLocation();
  const navigate = useNavigate();

  // Try retrieving laid off user info from location state or sessionStorage
  const laidOffUser = location.state?.user || (() => {
    try {
      const stored = sessionStorage.getItem('capdex_laid_off_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const employeeName = laidOffUser?.name || 'Valued Team Member';
  const employeeEmail = laidOffUser?.email || 'your registered email';
  const departmentName = laidOffUser?.departmentName || 'Department';
  const layoffReason = laidOffUser?.layoffReason || 'Performance and delivery benchmarks were not met during the evaluation cycle.';
  const hrNotes = laidOffUser?.hrNotes || 'Formal exit correspondence, severance package details, and settlement guidelines will be sent to your registered personal email address shortly.';
  const separationDate = laidOffUser?.layoffApprovedAt
    ? new Date(laidOffUser.layoffApprovedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const handleSignOut = () => {
    sessionStorage.removeItem('capdex_laid_off_user');
    localStorage.removeItem('capdex_token');
    localStorage.removeItem('capdex_user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-rose-500 selection:text-white">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Company Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-brand-500/20">
              C
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">CAPDEX</span>
          </Link>
          <span className="text-xs font-mono text-slate-500">Official Notice Ref: #SEP-{new Date().getFullYear()}</span>
        </div>

        {/* Main Notice Container */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Top Red Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600" />

          {/* Alert Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-400 block mb-1">
                Notice of Employment Separation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Employment Conclusion Notice
              </h1>
              <p className="text-xs text-slate-400 mt-1">Effective Date: {separationDate}</p>
            </div>
          </div>

          {/* Formal Body Text */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
            <p className="font-semibold text-white">
              Dear {employeeName},
            </p>
            <p>
              We regret to inform you that following recent performance reviews and executive committee deliberations, your employment with CAPDEX ({departmentName}) has been officially concluded.
            </p>
          </div>

          {/* Official Reason for Separation */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-400" /> Documented Reason for Separation
            </div>
            <p className="text-xs sm:text-sm text-rose-200/90 italic bg-rose-950/30 p-3.5 rounded-xl border border-rose-500/20 leading-relaxed">
              "{layoffReason}"
            </p>
          </div>

          {/* Formal Email & Correspondence Notice */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-950 to-slate-950 border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Mail className="w-4 h-4" /> Next Steps & Formal Correspondence
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {hrNotes}
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Recipient:</span>
              <span className="text-blue-300 font-bold">{employeeEmail}</span>
            </div>
          </div>

          {/* Offboarding & Support Assistance */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Asset Return & Inquiries:</span>
            <p>
              Please direct all questions regarding severance disbursement, tax documents, or equipment returns to the HR executive team at <span className="text-brand-400 font-semibold">hr@capdex.com</span>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <a
              href="mailto:hr@capdex.com?subject=Inquiry regarding employment separation notice"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-slate-400" /> Contact HR Executive Support
            </a>

            <button
              onClick={handleSignOut}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
            >
              <LogOut className="w-4 h-4" /> Sign Out & Exit Portal
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600">
          CAPDEX Human Capital Management • Confidential & Privileged Notice
        </p>
      </div>
    </div>
  );
}
