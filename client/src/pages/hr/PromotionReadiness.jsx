import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Award,
  Filter,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  Send,
  UserCheck,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  UserMinus,
  Mail,
  AlertTriangle,
  ArrowDownRight,
  Target
} from 'lucide-react';

export default function PromotionReadiness() {
  const [candidates, setCandidates] = useState([]);
  const [talentActions, setTalentActions] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [loading, setLoading] = useState(true);

  // Promotion Approval Modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [hrComment, setHrComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Demotion Approval Modal
  const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);
  const [selectedDemoteTarget, setSelectedDemoteTarget] = useState(null);
  const [confirmedDemoteTitle, setConfirmedDemoteTitle] = useState('');
  const [demoteHrNotes, setDemoteHrNotes] = useState('');
  const [submittingDemote, setSubmittingDemote] = useState(false);

  // Layoff Approval Modal
  const [isLayoffModalOpen, setIsLayoffModalOpen] = useState(false);
  const [selectedLayoffTarget, setSelectedLayoffTarget] = useState(null);
  const [officialLayoffReason, setOfficialLayoffReason] = useState('');
  const [hrExitNotes, setHrExitNotes] = useState('');
  const [submittingLayoff, setSubmittingLayoff] = useState(false);

  const fetchRankingsAndActions = async () => {
    try {
      const [rankingsRes, actionsRes] = await Promise.all([
        axiosClient.get(`/analytics/promotion-readiness?threshold=${threshold}`),
        axiosClient.get('/analytics/pending-talent-actions')
      ]);
      setCandidates(rankingsRes.data.data || []);
      setTalentActions(actionsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load talent decision data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingsAndActions();
  }, [threshold]);

  // Promotion handlers
  const handleOpenApprove = (cand) => {
    setSelectedCandidate(cand);
    setNewRoleTitle(cand.target_role_name || (cand.employee_title ? `Senior ${cand.employee_title}` : 'Lead Specialist'));
    setHrComment(`Congratulations! Promoted to ${cand.target_role_name || 'Senior Level'} by HR Executive Approval.`);
    setIsApprovalModalOpen(true);
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosClient.post(`/analytics/approve-promotion/${selectedCandidate.employee_id}`, {
        new_role_title: newRoleTitle.trim(),
        hr_comment: hrComment.trim()
      });
      setSuccessMsg(`Successfully approved promotion for ${selectedCandidate.employee_name} to ${newRoleTitle}! Contributor role updated.`);
      setIsApprovalModalOpen(false);
      await fetchRankingsAndActions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve promotion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPromotion = async (cand) => {
    const reason = prompt(`Enter reason for declining promotion for ${cand.employee_name}:`, 'Candidate requires additional tenure and mastery before senior advancement.');
    if (!reason) return;

    try {
      await axiosClient.post(`/analytics/reject-promotion/${cand.employee_id}`, {
        hr_comment: reason
      });
      setSuccessMsg(`Returned nomination for ${cand.employee_name} with developmental feedback.`);
      await fetchRankingsAndActions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Failed to update nomination.');
    }
  };

  // Demotion handlers
  const handleOpenDemoteDecision = (target) => {
    setSelectedDemoteTarget(target);
    setConfirmedDemoteTitle(target.demoted_title || 'Associate Specialist');
    setDemoteHrNotes('Role scope and title revised in accordance with performance review and managerial recommendations.');
    setIsDemoteModalOpen(true);
  };

  const handleConfirmDemoteApproval = async (e) => {
    e.preventDefault();
    setSubmittingDemote(true);

    try {
      await axiosClient.post(`/analytics/approve-demotion/${selectedDemoteTarget.id}`, {
        confirmed_title: confirmedDemoteTitle.trim(),
        hr_notes: demoteHrNotes.trim()
      });
      setSuccessMsg(`Demotion approved for ${selectedDemoteTarget.name}. Title updated to ${confirmedDemoteTitle}.`);
      setIsDemoteModalOpen(false);
      await fetchRankingsAndActions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve demotion.');
    } finally {
      setSubmittingDemote(false);
    }
  };

  const handleDeclineDemote = async (target) => {
    const note = prompt(`Enter reason for declining demotion for ${target.name}:`, 'Demotion declined. Employee assigned to formal 30-day coaching plan.');
    if (!note) return;

    try {
      await axiosClient.post(`/analytics/decline-demotion/${target.id}`, {
        hr_notes: note
      });
      setSuccessMsg(`Declined demotion proposal for ${target.name}.`);
      await fetchRankingsAndActions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Failed to decline demotion.');
    }
  };

  // Layoff handlers
  const handleOpenLayoffDecision = (target) => {
    setSelectedLayoffTarget(target);
    setOfficialLayoffReason(target.layoff_reason || 'Performance and delivery benchmarks were not met during the evaluation cycle.');
    setHrExitNotes('Formal severance package, benefits continuation documentation, and digital exit guidelines will be sent to your registered personal email address shortly.');
    setIsLayoffModalOpen(true);
  };

  const handleConfirmLayoffApproval = async (e) => {
    e.preventDefault();
    setSubmittingLayoff(true);

    try {
      await axiosClient.post(`/analytics/approve-layoff/${selectedLayoffTarget.id}`, {
        official_reason: officialLayoffReason.trim(),
        hr_notes: hrExitNotes.trim()
      });
      setSuccessMsg(`Official separation approved for ${selectedLayoffTarget.name}. Account deactivated and redirected to Layoff Notice upon next login.`);
      setIsLayoffModalOpen(false);
      await fetchRankingsAndActions();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve layoff.');
    } finally {
      setSubmittingLayoff(false);
    }
  };

  const handleDeclineLayoff = async (target) => {
    const note = prompt(`Enter reason for declining layoff request for ${target.name}:`, 'Layoff request declined. Contributor to be assigned to a structured 30-day PIP with coaching checkpoints before further action.');
    if (!note) return;

    try {
      await axiosClient.post(`/analytics/decline-layoff/${target.id}`, {
        hr_notes: note
      });
      setSuccessMsg(`Declined layoff proposal for ${target.name}. Placed on structured PIP review.`);
      await fetchRankingsAndActions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Failed to decline layoff request.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  // Filter queues
  const pendingNominations = candidates.filter(c => c.status === 'NOMINATED');
  const pendingDemotions = talentActions.filter(u => u.demotion_status === 'PROPOSED');
  const pendingLayoffs = talentActions.filter(u => u.layoff_status === 'PENDING_APPROVAL');
  const activePips = talentActions.filter(u => u.is_on_pip || u.pip_status === 'ACTIVE');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Executive Talent Actions & Approvals</h1>
          <p className="text-xs text-slate-400 mt-1">Review manager promotion nominations, authorize demotions, manage active PIPs, and authorize layoffs</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-300 font-semibold">Promotion Threshold:</span>
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-brand-400 font-bold focus:outline-none"
          >
            <option value={75}>≥ 75% (Broad Pool)</option>
            <option value={80}>≥ 80% (Accelerated)</option>
            <option value={85}>≥ 85% (High Potential)</option>
            <option value={90}>≥ 90% (Top Tier)</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION 1: Pending Manager Layoff Proposals */}
      {pendingLayoffs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-rose-900/50 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Manager Layoff Proposals (Pending HR Executive Decision)
              </h2>
              <p className="text-xs text-slate-400">Formal separation requests submitted by Department Managers for underperforming contributors</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {pendingLayoffs.length} Layoff Requests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLayoffs.map((lay) => (
              <div
                key={lay.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{lay.name}</h3>
                      <p className="text-xs text-slate-400">{lay.department_name} • {lay.email}</p>
                    </div>
                    <div className="text-right">
                      {lay.latest_score && (
                        <span className="text-xl font-black text-rose-400 font-mono">{lay.latest_score}%</span>
                      )}
                      <span className="block text-[10px] text-rose-400 font-bold uppercase tracking-wider">Layoff Proposed</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Manager Justification ({lay.proposed_by_name || 'Department Manager'}):
                    </span>
                    <p className="text-xs text-rose-200/90 italic leading-relaxed">
                      "{lay.layoff_reason}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleDeclineLayoff(lay)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <X className="w-3.5 h-3.5" /> Decline / PIP Instead
                  </button>
                  <button
                    onClick={() => handleOpenLayoffDecision(lay)}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Authorize Layoff & Offboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Pending Manager Demotion Proposals */}
      {pendingDemotions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-orange-900/50 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-orange-400" /> Manager Demotion Proposals (Pending HR Approval)
              </h2>
              <p className="text-xs text-slate-400">Proposals to adjust title and role band for underperforming contributors</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              {pendingDemotions.length} Demotion Requests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDemotions.map((dem) => (
              <div
                key={dem.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/40 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{dem.name}</h3>
                      <p className="text-xs text-slate-400">{dem.department_name} • {dem.email}</p>
                    </div>
                    <div className="text-right">
                      {dem.latest_score && (
                        <span className="text-xl font-black text-orange-400 font-mono">{dem.latest_score}%</span>
                      )}
                      <span className="block text-[10px] text-orange-400 font-bold uppercase tracking-wider">Demotion Proposed</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-orange-500/20 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Proposed Target Title:</span>
                    <span className="text-xs font-bold text-orange-300">{dem.demoted_title}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Manager Justification ({dem.proposed_by_name || 'Department Manager'}):
                    </span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{dem.demotion_reason}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleDeclineDemote(dem)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                  <button
                    onClick={() => handleOpenDemoteDecision(dem)}
                    className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-orange-600/20"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Demotion
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Active Performance Improvement Plans (PIPs) */}
      {activePips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-amber-900/50 pb-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" /> Active Performance Improvement Plans (PIPs)
              </h2>
              <p className="text-xs text-slate-400">Direct reports currently undergoing structured 30-day coaching milestones</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {activePips.length} Active PIPs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePips.map((pip) => (
              <div
                key={pip.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{pip.name}</h3>
                    <p className="text-xs text-slate-400">{pip.department_name} • {pip.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      ACTIVE PIP
                    </span>
                    {pip.pip_target_date && (
                      <span className="block text-[10px] text-slate-400 font-mono mt-1">
                        Due: {new Date(pip.pip_target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    PIP Milestone Objectives:
                  </span>
                  <p className="text-xs text-slate-300 italic">
                    "{pip.pip_reason}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Pending Manager Promotion Nominations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" /> Manager Promotion Nominations (Pending HR Executive Approval)
            </h2>
            <p className="text-xs text-slate-400">Review formal promotion proposals submitted by Department Managers</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {pendingNominations.length} Pending Approval
          </span>
        </div>

        {pendingNominations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingNominations.map((nom) => (
              <div
                key={nom.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/40 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{nom.employee_name}</h3>
                      <p className="text-xs text-slate-400">{nom.department_name} • {nom.employee_email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-brand-400 font-mono">{nom.score}%</span>
                      <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider">Nominated</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/20 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Proposed Advancement Title:
                    </span>
                    <p className="text-xs font-bold text-emerald-300">
                      {nom.target_role_name || 'Senior Specialist'}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Manager Justification ({nom.nominated_by_name || 'Department Manager'}):
                    </span>
                    <p className="text-xs text-slate-300 italic line-clamp-3">
                      "{nom.recommendation_text}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleRejectPromotion(nom)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/20"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                  <button
                    onClick={() => handleOpenApprove(nom)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Promote
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
            No pending manager promotion nominations awaiting HR decision.
          </div>
        )}
      </div>

      {/* SECTION 5: Organization-Wide Promotion Readiness Rankings */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-400" /> Organization-Wide Promotion Readiness Rankings
            </h2>
            <p className="text-xs text-slate-400">Algorithmic promotion suitability across all departments (Threshold: ≥ {threshold}%)</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="px-6 py-3.5">Candidate</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Designated / Promoted Title</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {candidates.length > 0 ? (
                  candidates.map((cand, idx) => {
                    const isPromoted = cand.status === 'PROMOTED';
                    const isNominated = cand.status === 'NOMINATED';

                    return (
                      <tr key={cand.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {cand.employee_name}
                                {isPromoted && <Award className="w-3.5 h-3.5 text-emerald-400" />}
                              </div>
                              <div className="text-[11px] text-slate-500">{cand.employee_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{cand.department_name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-base font-extrabold font-mono ${cand.score >= 85 ? 'text-emerald-400' : cand.score >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {cand.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isPromoted ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                              PROMOTED
                            </span>
                          ) : isNominated ? (
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                              NOMINATED BY MGR
                            </span>
                          ) : (
                            <StatusBadge status={cand.status} />
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-semibold">
                          {cand.target_role_name || cand.employee_title || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isPromoted && (
                            <button
                              onClick={() => handleOpenApprove(cand)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition"
                            >
                              Promote
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      No candidates found for the specified score threshold.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* HR Promotion Approval Modal */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title={`Authorize Promotion: ${selectedCandidate?.employee_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmApproval} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contributor Score</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{selectedCandidate?.score}%</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
              <span className="text-xs font-bold text-white">{selectedCandidate?.department_name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Confirmed Advancement Title / Role <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newRoleTitle}
              onChange={(e) => setNewRoleTitle(e.target.value)}
              placeholder="e.g. Lead Frontend Engineer, Director of Content"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              HR Executive Congratulations & Confirmation Note
            </label>
            <textarea
              rows={3}
              value={hrComment}
              onChange={(e) => setHrComment(e.target.value)}
              placeholder="Congratulations message displayed to employee upon login..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !newRoleTitle.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Confirm Promotion
            </button>
          </div>
        </form>
      </Modal>

      {/* HR Demotion Approval Modal */}
      <Modal
        isOpen={isDemoteModalOpen}
        onClose={() => setIsDemoteModalOpen(false)}
        title={`Authorize Demotion: ${selectedDemoteTarget?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmDemoteApproval} className="space-y-4">
          <div className="p-4 rounded-xl bg-orange-950/40 border border-orange-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-400 block">Contributor</span>
              <span className="text-base font-extrabold text-white">{selectedDemoteTarget?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-orange-400 block">Department</span>
              <span className="text-xs font-bold text-slate-300">{selectedDemoteTarget?.department_name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Confirmed Revised Title / Band <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={confirmedDemoteTitle}
              onChange={(e) => setConfirmedDemoteTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              HR Executive Notes & Band Confirmation
            </label>
            <textarea
              rows={3}
              value={demoteHrNotes}
              onChange={(e) => setDemoteHrNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
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
              disabled={submittingDemote || !confirmedDemoteTitle.trim()}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-600/20 disabled:opacity-40"
            >
              {submittingDemote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownRight className="w-4 h-4" />}
              Confirm Demotion
            </button>
          </div>
        </form>
      </Modal>

      {/* HR Layoff Approval Modal */}
      <Modal
        isOpen={isLayoffModalOpen}
        onClose={() => setIsLayoffModalOpen(false)}
        title={`Authorize Employment Separation: ${selectedLayoffTarget?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmLayoffApproval} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Contributor</span>
              <span className="text-base font-extrabold text-white">{selectedLayoffTarget?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Department</span>
              <span className="text-xs font-bold text-slate-300">{selectedLayoffTarget?.department_name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Official Documented Reason for Separation <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={officialLayoffReason}
              onChange={(e) => setOfficialLayoffReason(e.target.value)}
              placeholder="Enter official reason (displayed directly to employee on Layoff Notice page)..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-rose-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Formal Exit Correspondence & Severance Instructions
            </label>
            <textarea
              rows={3}
              value={hrExitNotes}
              onChange={(e) => setHrExitNotes(e.target.value)}
              placeholder="Information regarding severance payout timeline, benefits, and equipment return..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 block mb-1">Deactivation Protocol:</span>
            Upon confirmation, the employee's access will be revoked. The next time they attempt to sign in with their credentials, they will be immediately presented with the official <strong>Notice of Employment Separation</strong> detailing the reason and formal correspondence notice.
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
              disabled={submittingLayoff || !officialLayoffReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-40"
            >
              {submittingLayoff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
              Confirm Layoff & Deactivate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
