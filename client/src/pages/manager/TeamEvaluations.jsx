import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import ScoreRadarChart from '../../components/ScoreRadarChart';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  ClipboardCheck,
  MessageSquare,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  TrendingUp,
  Award,
  AlertTriangle,
  Flame,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  Bot,
  UserMinus
} from 'lucide-react';

export default function TeamEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeEval, setActiveEval] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // AI Talent Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [talentDecision, setTalentDecision] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Layoff Proposal Modal
  const [isLayoffModalOpen, setIsLayoffModalOpen] = useState(false);
  const [layoffTarget, setLayoffTarget] = useState(null);
  const [layoffReasonInput, setLayoffReasonInput] = useState('');
  const [submittingLayoff, setSubmittingLayoff] = useState(false);

  // Comment Modal
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTeamEvals = async () => {
    try {
      const res = await axiosClient.get('/evaluations/team');
      setEvaluations(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch team evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamEvals();
  }, []);

  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    setIsDetailModalOpen(true);
    try {
      const res = await axiosClient.get(`/evaluations/${id}`);
      setActiveEval(res.data.data);
    } catch (err) {
      alert('Failed to load evaluation details.');
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenTalentDecision = async (employeeId) => {
    setDecisionLoading(true);
    setIsDecisionModalOpen(true);
    setTalentDecision(null);
    try {
      const res = await axiosClient.get(`/analytics/talent-decision/${employeeId}`);
      setTalentDecision(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to generate AI talent decision.');
      setIsDecisionModalOpen(false);
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleOpenLayoffProposal = (empId, empName, score) => {
    setLayoffTarget({ id: empId, name: empName, score });
    setLayoffReasonInput('Performance & delivery expectations unmet; recurring bottlenecks in core competency deliverables during evaluation cycle.');
    setIsLayoffModalOpen(true);
  };

  const handleLayoffSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLayoff(true);

    try {
      await axiosClient.post(`/analytics/propose-layoff/${layoffTarget.id}`, {
        reason: layoffReasonInput.trim()
      });
      setSuccessMsg(`Layoff / separation proposal for ${layoffTarget.name} has been routed to HR for executive decision.`);
      setIsLayoffModalOpen(false);
      setIsDecisionModalOpen(false);
      await fetchTeamEvals();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit layoff proposal.');
    } finally {
      setSubmittingLayoff(false);
    }
  };

  const handleOpenComment = (id) => {
    setSelectedEvalId(id);
    setCommentText('');
    setCommentError('');
    setIsCommentModalOpen(true);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingComment(true);
    setCommentError('');

    try {
      await axiosClient.post(`/evaluations/${selectedEvalId}/comments`, {
        comment_text: commentText
      });
      setSuccessMsg('Manager review comment posted and shared with employee.');
      setIsCommentModalOpen(false);
      await fetchTeamEvals();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setCommentError(err.response?.data?.error?.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Team Evaluations</h1>
          <p className="text-xs text-slate-400 mt-1">Review appraisals, inspect AI talent decisions (Promote, Retain & Coach, or Layoff Risk), and add managerial feedback</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Evaluations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Cycle Date</th>
                <th className="px-6 py-3.5">Overall Score</th>
                <th className="px-6 py-3.5">AI Talent Signal</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {evaluations.length > 0 ? (
                evaluations.map((ev) => {
                  const score = Number(ev.overall_score);
                  const isPromote = score >= 85.0;
                  const isRetain = score >= 70.0 && score < 85.0;
                  const isRisk = score < 70.0;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{ev.employee_name}</div>
                        <div className="text-[11px] text-slate-500">{ev.employee_email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {new Date(ev.cycle_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-base font-extrabold ${isPromote ? 'text-emerald-400' : isRetain ? 'text-amber-400' : 'text-rose-400'}`}>
                          {ev.overall_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isPromote && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <Award className="w-3 h-3" /> PROMOTE
                          </span>
                        )}
                        {isRetain && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> RETAIN & COACH
                          </span>
                        )}
                        {isRisk && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> PIP / LAYOFF RISK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenTalentDecision(ev.employee_id)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/60 to-brand-900/60 hover:from-purple-800 hover:to-brand-800 text-purple-200 hover:text-white border border-purple-700/50 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            title="Open AI Talent Decision Analysis"
                          >
                            <Bot className="w-3.5 h-3.5 text-brand-400" /> AI Decision
                          </button>
                          <button
                            onClick={() => handleOpenDetail(ev.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => handleOpenComment(ev.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Comment
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No evaluations recorded for your team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Talent Decision Analysis Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={`AI Talent Decision: ${talentDecision?.employeeName || 'Analyzing...'}`}
        maxWidth="max-w-3xl"
      >
        {decisionLoading || !talentDecision ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-400">Synthesizing appraisal metrics, team averages, and talent recommendations...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Recommendation Banner */}
            <div
              className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                talentDecision.decision === 'PROMOTE'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : talentDecision.decision === 'RETAIN_AND_COACH'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest block opacity-80 mb-1">
                  AI Talent Recommendation
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  {talentDecision.decision === 'PROMOTE' && <Award className="w-6 h-6 text-emerald-400" />}
                  {talentDecision.decision === 'RETAIN_AND_COACH' && <TrendingUp className="w-6 h-6 text-amber-400" />}
                  {talentDecision.decision === 'PIP_OR_LAYOFF_RISK' && <ShieldAlert className="w-6 h-6 text-rose-400" />}
                  {talentDecision.decisionTitle}
                </h3>
                <p className="text-xs mt-1 text-slate-300">Role: {talentDecision.jobRole} • Department: {talentDecision.departmentName}</p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-white font-mono">{talentDecision.overallScore}%</span>
                <span className="block text-[11px] font-bold mt-0.5 opacity-90">
                  {talentDecision.scoreDelta >= 0 ? `+${talentDecision.scoreDelta}%` : `${talentDecision.scoreDelta}%`} vs Team Avg ({talentDecision.teamAverage}%)
                </span>
              </div>
            </div>

            {/* Benchmark Comparison Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Performance Benchmark Comparison</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contributor Score</span>
                  <span className="text-lg font-black text-white">{talentDecision.overallScore}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Team Average</span>
                  <span className="text-lg font-black text-slate-300">{talentDecision.teamAverage}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Promotion Standard</span>
                  <span className="text-lg font-black text-emerald-400">85.0%</span>
                </div>
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Strategic Analysis Rationale
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">{talentDecision.summary}</p>
            </div>

            {/* Strengths & Critical Gaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths Supporting Decision
                </h5>
                {talentDecision.keyStrengths?.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {talentDecision.keyStrengths.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">No parameters in the 8.0+ mastery tier.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors & Skill Gaps
                </h5>
                {talentDecision.criticalGaps?.length > 0 ? (
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {talentDecision.criticalGaps.map((g, idx) => (
                      <li key={idx} className="leading-relaxed">{g}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 italic">Zero critical gaps. Meets or exceeds all role dimensions.</p>
                )}
              </div>
            </div>

            {/* Manager Action Plan Checklist */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Manager Action Plan & Recommended Protocol
              </h4>
              <div className="space-y-1.5">
                {talentDecision.managerActionPlan?.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {talentDecision.decision === 'PROMOTE' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDecisionModalOpen(false);
                      window.location.href = '/manager/promotions';
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Award className="w-3.5 h-3.5" /> Nominate for Promotion
                  </button>
                )}

                {talentDecision.decision === 'PIP_OR_LAYOFF_RISK' && (
                  <button
                    type="button"
                    onClick={() => handleOpenLayoffProposal(talentDecision.employeeId, talentDecision.employeeName, talentDecision.overallScore)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Propose Layoff to HR
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsDecisionModalOpen(false);
                    if (talentDecision.evaluationId) handleOpenComment(talentDecision.evaluationId);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Manager Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Propose Layoff / Offboarding Modal */}
      <Modal
        isOpen={isLayoffModalOpen}
        onClose={() => setIsLayoffModalOpen(false)}
        title={`Propose Layoff to HR: ${layoffTarget?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleLayoffSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Performance Score</span>
              <span className="text-xl font-black text-rose-400 font-mono">{layoffTarget?.score}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Status Recommendation</span>
              <span className="text-xs font-bold text-rose-300">Underperforming Tier (&lt; 70%)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Primary Layoff / Offboarding Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={layoffReasonInput}
              onChange={(e) => setLayoffReasonInput(e.target.value)}
              placeholder="Detail reasons for separation (e.g. repeated delivery failures, critical technical bottlenecks, unaddressed 30-day PIP milestones)..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <span className="font-bold text-slate-300 block mb-1">HR Review Protocol:</span>
            Submitting this request will send the separation proposal to the HR Executive Committee. Once HR approves, the employee's account will be deactivated and redirected to the official Layoff Separation Notice with severance correspondence upon their next login.
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLayoffModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLayoff || !layoffReasonInput.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-40"
            >
              {submittingLayoff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
              Send Layoff Proposal to HR
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Evaluation Review: ${activeEval?.employee_name || 'Loading...'}`}
        maxWidth="max-w-3xl"
      >
        {detailLoading || !activeEval ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Appraisal Cycle</span>
                <span className="text-sm font-bold text-white">{new Date(activeEval.cycle_date).toLocaleDateString()}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Weighted Overall Score</span>
                <span className="text-2xl font-black text-emerald-400">{activeEval.overall_score}%</span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Competency Radar Diagnostic</h4>
              <ScoreRadarChart
                labels={activeEval.scores?.map(s => s.parameter_name) || []}
                scores={activeEval.scores?.map(s => Number(s.score)) || []}
              />
            </div>

            {/* Parameter breakdown & HR reasons */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameter Breakdown & HR Justifications</h4>
              <div className="space-y-2">
                {activeEval.scores?.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">{s.parameter_name} ({s.weightage}%)</div>
                      <p className="text-xs text-slate-400 italic">HR Note: "{s.reason}"</p>
                    </div>
                    <span className="text-sm font-black text-brand-400 font-mono shrink-0">
                      {s.score} / 10
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Feedback */}
            {activeEval.feedback && (
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> AI Performance Synthesis
                </div>
                <div>
                  <h5 className="text-xs font-bold text-emerald-400">Strengths</h5>
                  <p className="text-xs text-slate-300 mt-1">{activeEval.feedback.strengths_text}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-amber-400">Growth Opportunities</h5>
                  <p className="text-xs text-slate-300 mt-1">{activeEval.feedback.skill_gaps_text}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-sky-400">90-Day Recommendations</h5>
                  <p className="text-xs text-slate-300 mt-1 whitespace-pre-line">{activeEval.feedback.suggestions_text}</p>
                </div>
              </div>
            )}

            {/* Existing Manager Comments */}
            {activeEval.manager_comments?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager Commentary</h4>
                {activeEval.manager_comments.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-slate-300">{c.manager_name}</span>
                      <span className="text-[10px] font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 italic">"{c.comment_text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Manager Comment Modal */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title="Add Manager Review Comment"
      >
        {commentError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{commentError}</span>
          </div>
        )}

        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Manager Commentary / Coaching Notes
            </label>
            <textarea
              rows={4}
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Provide feedback on sprint impact, project leadership, or developmental objectives (shared directly with contributor)..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCommentModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingComment}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2"
            >
              {submittingComment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Post Comment & Share with Contributor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
