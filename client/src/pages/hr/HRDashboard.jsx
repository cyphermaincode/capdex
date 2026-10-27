import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/StatCard';
import PerformanceBarChart from '../../components/PerformanceBarChart';
import DepartmentPieChart from '../../components/DepartmentPieChart';
import GrowthLineChart from '../../components/GrowthLineChart';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Users,
  Award,
  TrendingUp,
  ClipboardCheck,
  Building2,
  Sliders,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Save,
  Edit2
} from 'lucide-react';

export default function HRDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Date edit modal state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [newCycleDate, setNewCycleDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [dateError, setDateError] = useState('');

  const fetchData = async () => {
    try {
      const [analyticsRes, evalsRes] = await Promise.all([
        axiosClient.get('/analytics/organization'),
        axiosClient.get('/evaluations')
      ]);
      setAnalytics(analyticsRes.data.data);
      setRecentEvaluations((evalsRes.data.data || []).slice(0, 8));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load organization analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEditDate = (ev) => {
    setSelectedEval(ev);
    const existing = ev.cycle_date
      ? new Date(ev.cycle_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setNewCycleDate(existing);
    setDateError('');
    setIsDateModalOpen(true);
  };

  const handleSaveCycleDate = async (e) => {
    e.preventDefault();
    if (!newCycleDate) {
      setDateError('Please select a valid date.');
      return;
    }
    setSavingDate(true);
    setDateError('');

    try {
      await axiosClient.patch(`/evaluations/${selectedEval.id}/cycle-date`, {
        cycle_date: newCycleDate
      });
      setSuccessMsg(`Appraisal cycle date for ${selectedEval.employee_name} updated to ${newCycleDate}.`);
      setIsDateModalOpen(false);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setDateError(err.response?.data?.error?.message || 'Failed to update appraisal cycle date.');
    } finally {
      setSavingDate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const deptLabels = analytics?.departmentPerformance?.map(d => d.name) || [];
  const deptScores = analytics?.departmentPerformance?.map(d => d.avgScore) || [];

  const distData = [
    analytics?.scoreDistribution?.under_70 || 0,
    analytics?.scoreDistribution?.range_70_79 || 0,
    analytics?.scoreDistribution?.range_80_89 || 0,
    analytics?.scoreDistribution?.range_90_100 || 0
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">HR Operations & Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Organization-wide continuous performance metrics, editable appraisal dates, and executive actions</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/hr/evaluate"
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Start Evaluation
          </Link>
          <Link
            to="/hr/parameters"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-2"
          >
            <Sliders className="w-4 h-4" /> Configure Parameters
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 shadow-md">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Employees"
          value={analytics?.totalEmployees || 0}
          subtitle={`${analytics?.evaluatedEmployees || 0} evaluated`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Org Average Score"
          value={`${analytics?.organizationAverageScore || 0}%`}
          subtitle="Weighted across all departments"
          icon={TrendingUp}
          color="brand"
        />
        <StatCard
          title="Departments Tracked"
          value={deptLabels.length}
          subtitle="Operational units"
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Evaluations Completed"
          value={recentEvaluations.length}
          subtitle="Recent cycle records"
          icon={ClipboardCheck}
          color="amber"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Average Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Department Performance Comparison</h3>
              <p className="text-xs text-slate-400">Average weighted competency scores by department</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">0 - 100%</span>
          </div>
          <PerformanceBarChart labels={deptLabels} dataPoints={deptScores} label="Dept Average Score" />
        </div>

        {/* Score Distribution Doughnut */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Score Distribution Breakdown</h3>
              <p className="text-xs text-slate-400">Employee count across performance tiers</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">Tiers</span>
          </div>
          <DepartmentPieChart dataPoints={distData} />
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Appraisals Logged</h3>
            <p className="text-xs text-slate-400">Latest evaluated contributors with editable appraisal cycle dates</p>
          </div>
          <Link
            to="/hr/employees"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 transition flex items-center gap-1.5"
          >
            Employee Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Appraisal Date</th>
                <th className="pb-3">Overall Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentEvaluations.length > 0 ? (
                recentEvaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 font-bold text-white">
                      <div>{ev.employee_name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{ev.employee_email}</div>
                    </td>
                    <td className="py-3.5 text-slate-300 font-medium">{ev.department_name}</td>
                    <td className="py-3.5 font-mono">
                      <button
                        onClick={() => handleOpenEditDate(ev)}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-500 text-slate-300 hover:text-white transition"
                        title="Edit appraisal cycle date"
                      >
                        <Calendar className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition" />
                        <span>{new Date(ev.cycle_date).toLocaleDateString()}</span>
                        <Edit2 className="w-2.5 h-2.5 text-brand-400 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    </td>
                    <td className="py-3.5 font-extrabold text-white">
                      <span className={Number(ev.overall_score) >= 85 ? 'text-emerald-400' : Number(ev.overall_score) >= 75 ? 'text-amber-400' : 'text-rose-400'}>
                        {ev.overall_score}%
                      </span>
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={ev.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleOpenEditDate(ev)}
                        className="px-2.5 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-semibold transition inline-flex items-center gap-1 border border-brand-500/20"
                      >
                        <Calendar className="w-3 h-3" /> Change Date
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No evaluations recorded yet. Start by evaluating an employee.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Date Modal */}
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title={`Change Appraisal Date: ${selectedEval?.employee_name || 'Appraisal'}`}
        maxWidth="max-w-md"
      >
        {dateError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        <form onSubmit={handleSaveCycleDate} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{selectedEval?.employee_name}</span>
              <span className="text-[10px] uppercase font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10">
                Score: {selectedEval?.overall_score}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Department: {selectedEval?.department_name} • Appraisal ID: #{selectedEval?.id}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-400" /> New Appraisal Cycle Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={newCycleDate}
              onChange={(e) => setNewCycleDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500">Quick Presets:</span>
            <button
              type="button"
              onClick={() => setNewCycleDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                setNewCycleDate(d.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
            >
              -1 Month
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 3);
                setNewCycleDate(d.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
            >
              Last Quarter
            </button>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingDate || !newCycleDate}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-brand-500/20 disabled:opacity-40"
            >
              {savingDate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save New Date
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
