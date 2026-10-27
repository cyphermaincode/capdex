import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function GrowthGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', target_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchGoals = async () => {
    try {
      const res = await axiosClient.get('/growth-goals');
      setGoals(res.data.data || []);
    } catch (err) {
      console.error('Failed to load growth goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenCreate = () => {
    setFormData({ title: '', description: '', target_date: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await axiosClient.post('/growth-goals', formData);
      setSuccessMsg('Growth goal created successfully.');
      setIsModalOpen(false);
      fetchGoals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to save goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosClient.patch(`/growth-goals/${id}`, { status: newStatus });
      setSuccessMsg(`Goal status updated to ${newStatus}.`);
      fetchGoals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to update goal status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal milestone?')) return;
    try {
      await axiosClient.delete(`/growth-goals/${id}`);
      setSuccessMsg('Goal deleted.');
      fetchGoals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to delete goal.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Growth & Development Goals</h1>
          <p className="text-xs text-slate-400 mt-1">Track actionable 90-day learning milestones aligned with appraisal diagnostics</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Add Growth Goal
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((g) => (
          <div
            key={g.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={g.status} />
                <button
                  onClick={() => handleDelete(g.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{g.title}</h3>
              {g.description && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{g.description}</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              {g.target_date && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target: {new Date(g.target_date).toLocaleDateString()}</span>
                </div>
              )}

              {/* Status toggle buttons */}
              <div className="flex items-center gap-2 pt-1">
                {g.status !== 'IN_PROGRESS' && g.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStatusChange(g.id, 'IN_PROGRESS')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold"
                  >
                    Start Working
                  </button>
                )}
                {g.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStatusChange(g.id, 'COMPLETED')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No developmental growth goals created yet. Set your first 90-day milestone.
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Developmental Growth Goal"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Master WCAG 2.2 accessibility standards"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Action Plan / Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Steps, courses, or cross-functional projects to complete this milestone..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
