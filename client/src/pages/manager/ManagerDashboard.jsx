import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  GitPullRequest,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldAlert,
  Bot
} from 'lucide-react';

export default function ManagerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [teamEvals, setTeamEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, evalsRes] = await Promise.all([
          axiosClient.get('/analytics/team'),
          axiosClient.get('/evaluations/team')
        ]);
        setAnalytics(analyticsRes.data.data);
        setTeamEvals((evalsRes.data.data || []).slice(0, 8));
      } catch (err) {
        console.error('Failed to load team analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Team Performance Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Departmental benchmarking, AI talent decisions (Promote / Retain / PIP Risk), and appraisal commentary</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/manager/evaluations"
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <Bot className="w-4 h-4" /> AI Talent Decisions
          </Link>
          <Link
            to="/manager/change-requests"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2"
          >
            <GitPullRequest className="w-4 h-4" /> Request Parameter Change
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Team Headcount"
          value={analytics?.teamTotalEmployees || 0}
          subtitle="Direct reports in department"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Team Average Score"
          value={`${analytics?.teamAverageScore || 0}%`}
          subtitle="Cycle weighted average"
          icon={TrendingUp}
          color="brand"
        />
        <StatCard
          title="Promote Candidates"
          value={analytics?.topPerformers?.length || 0}
          subtitle="Scoring ≥ 85% (High Potential)"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Coaching / PIP Focus"
          value={analytics?.needsImprovement?.length || 0}
          subtitle="Scoring < 80%"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Talent Tier Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* High Potential Promotion Pool */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> High Potential Leaders (≥ 85.0%)
            </h3>
            <Link
              to="/manager/promotions"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              Nominate <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.topPerformers?.length > 0 ? (
              analytics.topPerformers.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.email}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {p.top_score}%
                    </span>
                    <span className="block text-[10px] font-bold text-emerald-500 uppercase">Promote Ready</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No contributors currently meet the high-potential threshold.
              </div>
            )}
          </div>
        </div>

        {/* Coaching & PIP Risk Pool */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Coaching & Improvement Focus (&lt; 80.0%)
            </h3>
            <span className="text-xs text-slate-500">Targeted 1-on-1s</span>
          </div>

          <div className="space-y-3">
            {analytics?.needsImprovement?.length > 0 ? (
              analytics.needsImprovement.map((p) => {
                const isRisk = Number(p.latest_score) < 70.0;

                return (
                  <div key={p.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.email}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-extrabold font-mono ${isRisk ? 'text-rose-400' : 'text-amber-400'}`}>
                        {p.latest_score}%
                      </span>
                      <span className={`block text-[10px] font-bold uppercase ${isRisk ? 'text-rose-500' : 'text-amber-500'}`}>
                        {isRisk ? 'PIP / Layoff Risk' : 'Retain & Coach'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                All team members are currently meeting or exceeding performance benchmarks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Team Evaluations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Recent Appraisals & AI Decision Signals</h3>
            <p className="text-xs text-slate-400">Review scores, AI talent recommendations, and add manager comments</p>
          </div>
          <Link
            to="/manager/evaluations"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 transition flex items-center gap-1.5"
          >
            Open Evaluation Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Cycle Date</th>
                <th className="pb-3">Overall Score</th>
                <th className="pb-3">AI Talent Signal</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {teamEvals.length > 0 ? (
                teamEvals.map((ev) => {
                  const score = Number(ev.overall_score);
                  const isPromote = score >= 85.0;
                  const isRetain = score >= 70.0 && score < 85.0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 font-bold text-white">
                        <div>{ev.employee_name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{ev.employee_email}</div>
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono">{new Date(ev.cycle_date).toLocaleDateString()}</td>
                      <td className="py-3.5 font-extrabold text-white font-mono">
                        <span className={isPromote ? 'text-emerald-400' : isRetain ? 'text-amber-400' : 'text-rose-400'}>
                          {ev.overall_score}%
                        </span>
                      </td>
                      <td className="py-3.5">
                        {isPromote ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            PROMOTE
                          </span>
                        ) : isRetain ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            RETAIN & COACH
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            PIP / LAYOFF RISK
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to="/manager/evaluations"
                          className="text-xs font-bold text-slate-300 hover:text-brand-400 transition"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No evaluations recorded for your team members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
