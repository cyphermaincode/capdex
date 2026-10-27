import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  TrendingUp,
  UserCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  UserMinus,
  ArrowDownRight,
  Target,
  FileText
} from 'lucide-react';

export default function ManagerPromotionReadiness() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nomination Modal
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [targetRoleTitle, setTargetRoleTitle] = useState('');
  const [recommendationText, setRecommendationText] = useState('');

  // PIP Modal
  const [isPipModalOpen, setIsPipModalOpen] = useState(false);
  const [pipTarget, setPipTarget] = useState(null);
  const [pipReason, setPipReason] = useState('');
  const [pipTargetDate, setPipTargetDate] = useState('');

  // Demotion Modal
  const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState(null);
  const [demoteTitle, setDemoteTitle] = useState('');
  const [demoteReason, setDemoteReason] = useState('');

  // Layoff Modal
  const [isLayoffModalOpen, setIsLayoffModalOpen] = useState(false);
  const [layoffTarget, setLayoffTarget] = useState(null);
  const [layoffReason, setLayoffReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCandidates = async () => {
    try {
      const res = await axiosClient.get('/analytics/promotion-readiness');
      setCandidates(res.data.data || []);
    } catch (err) {
      console.error('Failed to load team promotion candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Nomination handlers
  const handleOpenNominate = (cand) => {
    setSelectedCandidate(cand);
    setTargetRoleTitle(cand.target_role_name || (cand.score >= 85 ? `Senior ${cand.employee_title || 'Contributor'}` : 'Lead Specialist'));
    setRecommendationText(cand.recommendation_text || '');
    setIsNominateModalOpen(true);
  };

  const handleSubmitNomination = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.post(`/analytics/nominate-promotion/${selectedCandidate.employee_id}`, {
        target_role_name: targetRoleTitle.trim(),
        recommendation_text: recommendationText.trim()
      });
      setSuccessMsg(`Promotion nomination for ${selectedCandidate.employee_name} submitted to HR Executive Committee.`);
      setIsNominateModalOpen(false);
      await fetchCandidates();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit nomination.');
    } finally {
      setSubmitting(false);
    }
  };

  // PIP handlers
  const handleOpenPip = (cand) => {
    setPipTarget(cand);
    setPipReason(`Performance score of ${cand.score}% is below role expectations. Weekly milestones in core deliverables and code quality required over the next 30 days.`);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setPipTargetDate(d.toISOString().split('T')[0]);
    setIsPipModalOpen(true);
  };

  const handleSubmitPip = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.post(`/analytics/assign-pip/${pipTarget.employee_id}`, {
        reason: pipReason.trim(),
        target_date: pipTargetDate
      });
      setSuccessMsg(`Successfully assigned 30-Day PIP for ${pipTarget.employee_name}. Milestone logged in growth plans.`);
      setIsPipModalOpen(false);
      await fetchCandidates();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to assign PIP.');
    } finally {
      setSubmitting(false);
    }
  };

  // Demotion handlers
  const handleOpenDemote = (cand) => {
    setDemoteTarget(cand);
    setDemoteTitle(cand.employee_title ? `Associate ${cand.employee_title.replace(/^Senior\s+|^Lead\s+/i, '')}` : 'Junior Associate');
    setDemoteReason(`Consistent deficiency in core technical competencies (${cand.score}%). Proposing role scope revision to better match current execution level.`);
    setIsDemoteModalOpen(true);
  };

  const handleSubmitDemote = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.post(`/analytics/propose-demotion/${demoteTarget.employee_id}`, {
        demoted_title: demoteTitle.trim(),
        reason: demoteReason.trim()
      });
      setSuccessMsg(`Demotion proposal for ${demoteTarget.employee_name} routed to HR Executive Approval.`);
      setIsDemoteModalOpen(false);
      await fetchCandidates();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit demotion proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Layoff handlers
  const handleOpenLayoff = (cand) => {
    setLayoffTarget(cand);
    setLayoffReason(`Critical delivery bottlenecks during evaluation cycle (${cand.score}%). Unmet performance milestones warranting separation review.`);
    setIsLayoffModalOpen(true);
  };

  const handleSubmitLayoff = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.post(`/analytics/propose-layoff/${layoffTarget.employee_id}`, {
        reason: layoffReason.trim()
      });
      setSuccessMsg(`Layoff / separation proposal for ${layoffTarget.employee_name} sent to HR.`);
      setIsLayoffModalOpen(false);
      await fetchCandidates();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit layoff proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Group candidates
  const activeNominees = candidates.filter(c => c.status === 'NOMINATED' || c.status === 'PROMOTED');
  const availableCandidates = candidates.filter(c => c.status !== 'NOMINATED' && c.status !== 'PROMOTED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Talent Decisions & Promotion Management</h1>
        <p className="text-xs text-slate-400 mt-1">
          Nominate high-impact performers for promotions, initiate 30-Day PIPs for developing members, or submit demotion & separation proposals to HR
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION 1: Active Nominees & Submissions to HR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" /> Active Promotion Nominees (Sent to HR)
            </h2>
            <p className="text-xs text-slate-400">Formal advancement proposals currently under executive HR review</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
            {activeNominees.length} Active Nominees
          </span>
        </div>

        {activeNominees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeNominees.map((nom) => {
              const isPromoted = nom.status === 'PROMOTED';

              return (
                <div
                  key={nom.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 shadow-lg ${
                    isPromoted
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-purple-950/20 border-purple-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{nom.employee_name}</h3>
                        <p className="text-[11px] text-slate-400">{nom.employee_email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-brand-400 font-mono">{nom.score}%</span>
                        <div className="mt-0.5">
                          {isPromoted ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                              PROMOTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                              NOMINATED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 my-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Proposed Advancement Title:
                      </span>
                      <p className="text-xs font-bold text-emerald-300">
                        {nom.target_role_name || nom.employee_title || 'Senior Contributor'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 italic line-clamp-2">
                      "{nom.recommendation_text}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Submitted by {nom.nominated_by_name || 'Department Manager'}</span>
                    {!isPromoted && (
                      <button
                        onClick={() => handleOpenNominate(nom)}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition"
                      >
                        Edit Proposal →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
            No active promotion nominations submitted yet. Select an eligible candidate from the talent pool below.
          </div>
        )}
      </div>

      {/* SECTION 2: Team Talent Pool & Decisions */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-400" /> Team Talent Pool & Performance Actions
            </h2>
            <p className="text-xs text-slate-400">Review team members, nominate top performers, assign PIPs, or initiate title & separation actions</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="px-6 py-3.5">Team Member</th>
                  <th className="px-6 py-3.5">Performance Score</th>
                  <th className="px-6 py-3.5">Eligibility Tier</th>
                  <th className="px-6 py-3.5 text-right">Available Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {availableCandidates.length > 0 ? (
                  availableCandidates.map((cand) => {
                    const score = Number(cand.score);
                    const isHighPotential = score >= 85.0;
                    const isDeveloping = score >= 70.0 && score < 85.0;
                    const isUnderperforming = score < 70.0;

                    const isOnPip = cand.is_on_pip || cand.pip_status === 'ACTIVE';
                    const isDemotePending = cand.demotion_status === 'PROPOSED';
                    const isLayoffPending = cand.layoff_status === 'PENDING_APPROVAL';

                    return (
                      <tr key={cand.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            {cand.employee_name}
                            {isOnPip && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40">
                                ON PIP
                              </span>
                            )}
                            {isDemotePending && (
                              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[9px] font-bold border border-orange-500/40">
                                DEMOTION PENDING
                              </span>
                            )}
                            {isLayoffPending && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/40">
                                LAYOFF PROPOSED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{cand.employee_email} • {cand.employee_title || 'Contributor'}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`text-base font-extrabold font-mono ${isHighPotential ? 'text-emerald-400' : isDeveloping ? 'text-amber-400' : 'text-rose-400'}`}>
                            {cand.score}%
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {isHighPotential && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <Award className="w-3 h-3" /> High Potential (≥ 85%)
                            </span>
                          )}
                          {isDeveloping && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Retain & Coach (70-84%)
                            </span>
                          )}
                          {isUnderperforming && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> PIP / Layoff Risk (&lt; 70%)
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* High Potential & Developing Actions */}
                            {!isUnderperforming && (
                              <button
                                onClick={() => handleOpenNominate(cand)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 ${
                                  isHighPotential
                                    ? 'bg-brand-500 hover:bg-brand-400 text-black shadow-brand-500/20'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                              >
                                <Award className="w-3.5 h-3.5" /> Nominate for Promotion
                              </button>
                            )}

                            {/* Underperformer Actions (< 70%) */}
                            {isUnderperforming && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenPip(cand)}
                                  disabled={isOnPip}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                                    isOnPip
                                      ? 'bg-amber-950/40 text-amber-400/60 border-amber-500/20 cursor-not-allowed'
                                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  }`}
                                  title={isOnPip ? 'Already on active PIP' : 'Place on 30-Day PIP'}
                                >
                                  <Target className="w-3 h-3" /> {isOnPip ? 'On PIP' : 'Place on PIP'}
                                </button>

                                <button
                                  onClick={() => handleOpenDemote(cand)}
                                  disabled={isDemotePending}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                                    isDemotePending
                                      ? 'bg-orange-950/40 text-orange-400/60 border-orange-500/20 cursor-not-allowed'
                                      : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  }`}
                                  title="Propose Demotion to HR"
                                >
                                  <ArrowDownRight className="w-3 h-3" /> Demote
                                </button>

                                <button
                                  onClick={() => handleOpenLayoff(cand)}
                                  disabled={isLayoffPending}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border shadow-sm ${
                                    isLayoffPending
                                      ? 'bg-rose-950/40 text-rose-400/60 border-rose-500/20 cursor-not-allowed'
                                      : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600/50 shadow-rose-600/20'
                                  }`}
                                  title="Propose Layoff to HR"
                                >
                                  <UserMinus className="w-3 h-3" /> Layoff
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-500">
                      No candidates in talent pool.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Nomination Modal */}
      <Modal
        isOpen={isNominateModalOpen}
        onClose={() => setIsNominateModalOpen(false)}
        title={`Nominate for Promotion: ${selectedCandidate?.employee_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitNomination} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Performance Score</span>
              <span className="text-xl font-black text-brand-400 font-mono">{selectedCandidate?.score}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Role</span>
              <span className="text-xs font-bold text-white">{selectedCandidate?.employee_title || 'Contributor'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Proposed Advancement Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={targetRoleTitle}
              onChange={(e) => setTargetRoleTitle(e.target.value)}
              placeholder="e.g. Lead Frontend Engineer"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Manager Justification & Accomplishments <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={recommendationText}
              onChange={(e) => setRecommendationText(e.target.value)}
              placeholder="Detail key accomplishments, technical leadership, and why this candidate is ready for next band..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsNominateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !targetRoleTitle.trim()}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Proposal to HR
            </button>
          </div>
        </form>
      </Modal>

      {/* Place on PIP Modal */}
      <Modal
        isOpen={isPipModalOpen}
        onClose={() => setIsPipModalOpen(false)}
        title={`Place on Performance Improvement Plan (PIP): ${pipTarget?.employee_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitPip} className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Performance Score</span>
              <span className="text-xl font-black text-amber-400 font-mono">{pipTarget?.score}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Status</span>
              <span className="text-xs font-bold text-amber-300">Underperforming Tier</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              PIP Target Review Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={pipTargetDate}
              onChange={(e) => setPipTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Improvement Objectives & Required Milestones <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={pipReason}
              onChange={(e) => setPipReason(e.target.value)}
              placeholder="Detail weekly deliverables, core competency benchmarks, and metrics required to pass PIP..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            Placing this employee on PIP logs an active action plan visible on their dashboard with formal target dates.
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPipModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !pipReason.trim()}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              Assign 30-Day PIP
            </button>
          </div>
        </form>
      </Modal>

      {/* Propose Demotion Modal */}
      <Modal
        isOpen={isDemoteModalOpen}
        onClose={() => setIsDemoteModalOpen(false)}
        title={`Propose Demotion to HR: ${demoteTarget?.employee_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitDemote} className="space-y-4">
          <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-400 block">Current Title</span>
              <span className="text-sm font-extrabold text-white">{demoteTarget?.employee_title || 'Current Role'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-orange-400 block">Performance Score</span>
              <span className="text-lg font-black text-orange-400 font-mono">{demoteTarget?.score}%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Proposed Revised Title / Band <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={demoteTitle}
              onChange={(e) => setDemoteTitle(e.target.value)}
              placeholder="e.g. Associate Backend Engineer"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Demotion Rationale & Scope Reduction Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={demoteReason}
              onChange={(e) => setDemoteReason(e.target.value)}
              placeholder="Document reasons for scope reduction and revised role responsibilities..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDemoteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !demoteTitle.trim()}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              Send Demotion Proposal to HR
            </button>
          </div>
        </form>
      </Modal>

      {/* Propose Layoff Modal */}
      <Modal
        isOpen={isLayoffModalOpen}
        onClose={() => setIsLayoffModalOpen(false)}
        title={`Propose Layoff / Separation to HR: ${layoffTarget?.employee_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitLayoff} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Performance Score</span>
              <span className="text-xl font-black text-rose-400 font-mono">{layoffTarget?.score}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Status</span>
              <span className="text-xs font-bold text-rose-300">Severe Delivery Risk</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Primary Separation Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={layoffReason}
              onChange={(e) => setLayoffReason(e.target.value)}
              placeholder="Detail reasons for offboarding (e.g. repeated delivery failures, critical technical regressions)..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            Submitting this request will route the offboarding proposal to the HR Executive Committee for separation approval.
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
              disabled={submitting || !layoffReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
              Send Layoff Proposal to HR
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
