import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import {
  UserCheck,
  Mail,
  Building2,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axiosClient.put(`/users/${user.id}`, { phone });
      setSuccessMsg('Profile updated successfully.');
      await refreshUser();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-400 mt-1">Manage contact coordinates and view role authorizations</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-black text-2xl uppercase shadow-lg shadow-brand-500/20">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={user?.role} />
              {user?.departmentName && (
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  • <Building2 className="w-3 h-3" /> {user.departmentName}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address (SSO Locked)
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400">
                <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account ID & Role
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400">
                <Shield className="w-4 h-4 text-slate-600 shrink-0" />
                <span>#{user?.id} • {user?.role}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Contact Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Profile Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
