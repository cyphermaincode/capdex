import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import ScoreRadarChart from '../../components/ScoreRadarChart';
import GrowthLineChart from '../../components/GrowthLineChart';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import AICoachChat from '../../components/AICoachChat';
import PromotionCelebrationModal from '../../components/PromotionCelebrationModal';
import {
  TrendingUp,
  Award,
  Sparkles,
  Target,
  ArrowRight,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function EmployeeDashboard() {
  const [evaluations, setEvaluations] = useState([]);
  const [goals, setGoals] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEval, setActiveEval] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [evalsRes, goalsRes, meRes] = await Promise.all([
          axiosClient.get('/evaluations'),
          axiosClient.get('/growth-goals'),
          axiosClient.get('/auth/me')
        ]);
        const evals = evalsRes.data.data || [];
        setEvaluations(evals);
        setGoals(goalsRes.data.data || []);
        setUserProfile(meRes.data.data || null);

        if (evals.length > 0) {
          const detailRes = await axiosClient.get(`/evaluations/${evals[0].id}`);
          setActiveEval(detailRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load employee dashboard data:', err);
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

  const latestScore = activeEval?.overall_score || 0;
  const radarLabels = activeEval?.scores?.map(s => s.parameter_name) || [];
  const radarScores = activeEval?.scores?.map(s => Number(s.score)) || [];

  const trendLabels = evaluations.slice().reverse().map(e => new Date(e.cycle_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }));
  const trendScores = evaluations.slice().reverse().map(e => Number(e.overall_score));

  const openGoals = goals.filter(g => g.status !== 'COMPLETED');
  const latestManagerComment = activeEval?.manager_comments?.[0];

  return (
    <div className="space-y-8">
      {/* Promotion Notification / Celebration Banner if Promoted */}
      <PromotionCelebrationModal />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Performance & Diagnostic Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Continuous performance appraisal score, manager coaching notes, and AI feedback analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/employee/history"
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <Sparkles className="w-4 h-4" /> Full AI Diagnostic
          </Link>
          <Link
            to="/employee/goals"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-2"
          >
            <Target className="w-4 h-4" /> Set Goal
          </Link>
        </div>
      </div>

      {/* Active PIP Warning & Action Plan Banner */}
      {(userProfile?.is_on_pip || userProfile?.pip_status === 'ACTIVE') && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  Active Performance Improvement Plan (PIP)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {userProfile.pip_reason || 'Your recent appraisal metrics require targeted weekly deliverables and milestone coaching.'}
                </p>
              </div>
            </div>
            {userProfile.pip_target_date && (
              <div className="text-right shrink-0 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Milestone Due</span>
                <span className="text-xs font-mono font-bold text-white">
                  {new Date(userProfile.pip_target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200/80">
            <span>Work closely with your manager on the assigned deliverables in your Growth Goals.</span>
            <Link to="/employee/goals" className="font-bold underline hover:text-amber-100">
              View PIP Action Goals →
            </Link>
          </div>
        </div>
      )}

      {/* Demotion / Role Revision Notification */}
      {userProfile?.demotion_status === 'APPROVED' && (
        <div className="bg-gradient-to-r from-orange-950/50 via-slate-900 to-slate-900 border border-orange-500/40 rounded-2xl p-5 shadow-lg flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-300">
              Role Scope Adjustment Notice
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Your official role title is adjusted to <strong>{userProfile.title}</strong> following the recent appraisal evaluation. Please review your updated milestones and career path with HR.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Latest Overall Score"
          value={`${latestScore}%`}
          subtitle={latestScore >= 85 ? 'Eligible for Promotion' : latestScore >= 75 ? 'Developing Trajectory' : 'Coaching Recommended'}
          icon={TrendingUp}
          color={latestScore >= 85 ? 'brand' : latestScore >= 75 ? 'amber' : 'rose'}
        />
        <StatCard
          title="Appraisals Completed"
          value={evaluations.length}
          subtitle="Evaluation cycles recorded"
          icon={Award}
          color="blue"
        />
        <StatCard
          title="Active Growth Goals"
          value={openGoals.length}
          subtitle={`${goals.length - openGoals.length} milestones achieved`}
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Evaluation Status"
          value={activeEval?.status || 'UP TO DATE'}
          subtitle={activeEval?.status === 'SUBMITTED' ? 'Acknowledgment Pending' : 'Review Acknowledged'}
          icon={CheckCircle2}
          color={activeEval?.status === 'SUBMITTED' ? 'amber' : 'brand'}
        />
      </div>

      {/* Manager Review Spotlight Banner if present */}
      {latestManagerComment && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Latest Manager Feedback from {latestManagerComment.manager_name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({new Date(latestManagerComment.created_at).toLocaleDateString()})</span>
              </div>
              <p className="text-xs text-blue-100 italic mt-1">"{latestManagerComment.comment_text}"</p>
            </div>
          </div>
          <Link
            to="/employee/history"
            className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto border border-blue-500/20"
          >
            Review Cycle Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Two Column Grid: Radar Diagnostic & Historical Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Competency Breakdown</h3>
              <p className="text-xs text-slate-400">Score per evaluated role parameter (0 to 10 scale)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">Radar</span>
          </div>
          {radarLabels.length > 0 ? (
            <ScoreRadarChart labels={radarLabels} scores={radarScores} />
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              No appraisal competency scores recorded yet.
            </div>
          )}
        </div>

        {/* Growth Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Appraisal Trajectory</h3>
              <p className="text-xs text-slate-400">Overall score evolution over continuous cycles</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">History</span>
          </div>
          {trendLabels.length > 0 ? (
            <GrowthLineChart labels={trendLabels} dataPoints={trendScores} label="My Performance Score" />
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              No historical review cycles available.
            </div>
          )}
        </div>
      </div>

      {/* Interactive AI Diagnostic Coach Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> AI Performance Diagnostic Coach
          </div>
          <span className="text-xs text-slate-500">Ask for customized action plans & career growth strategies</span>
        </div>

        <AICoachChat
          evaluationId={activeEval?.id}
          initialContext={activeEval}
        />
      </div>
    </div>
  );
}
