import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import ScoreRadarChart from '../../components/ScoreRadarChart';
import StatusBadge from '../../components/StatusBadge';
import AICoachChat from '../../components/AICoachChat';
import PromotionCelebrationModal from '../../components/PromotionCelebrationModal';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  MessageSquare,
  Award,
  AlertCircle,
  Loader2,
  Bot,
  UserCheck
} from 'lucide-react';

export default function EvaluationHistory() {
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEval, setSelectedEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evalLoading, setEvalLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchEvaluations = async () => {
    try {
      const res = await axiosClient.get('/evaluations');
      const evals = res.data.data || [];
      setEvaluations(evals);
      if (evals.length > 0) {
        await loadEvaluationDetails(evals[0].id);
      }
    } catch (err) {
      setError('Failed to load evaluation history.');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationDetails = async (id) => {
    setEvalLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/evaluations/${id}`);
      setSelectedEval(res.data.data);
    } catch (err) {
      setError('Failed to fetch evaluation details.');
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleAcknowledge = async () => {
    if (!selectedEval) return;
    setAcknowledging(true);
    try {
      await axiosClient.patch(`/evaluations/${selectedEval.id}/acknowledge`);
      setSuccessMsg('Evaluation formally acknowledged.');
      await loadEvaluationDetails(selectedEval.id);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to acknowledge evaluation.');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleRegenerateFeedback = async () => {
    if (!selectedEval) return;
    setRegenerating(true);
    try {
      const res = await axiosClient.post(`/evaluations/${selectedEval.id}/feedback/regenerate`);
      setSelectedEval(prev => ({ ...prev, feedback: res.data.data }));
      setSuccessMsg('AI performance feedback refreshed successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to regenerate AI feedback.');
    } finally {
      setRegenerating(false);
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
      {/* Promotion Notification Modal & Banner */}
      <PromotionCelebrationModal />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Evaluations & AI Feedback</h1>
        <p className="text-xs text-slate-400 mt-1">Review weighted competency scores, manager review comments, and interactive AI diagnostics</p>
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

      {evaluations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 text-xs">
          No evaluations have been submitted for your profile yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Cycle Selector Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Review Cycles</h3>
            <div className="space-y-2">
              {evaluations.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => loadEvaluationDetails(ev.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedEval?.id === ev.id
                      ? 'bg-brand-500/10 border-brand-500/50 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-mono">{new Date(ev.cycle_date).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-500 font-normal">Cycle ID: #{ev.id}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-brand-400">{ev.overall_score}%</span>
                    <div className="mt-0.5">
                      <StatusBadge status={ev.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details & AI Synthesis */}
          <div className="lg:col-span-3 space-y-6">
            {evalLoading || !selectedEval ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Score & Acknowledgment Banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Appraisal Cycle: {new Date(selectedEval.cycle_date).toLocaleDateString()}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                      Overall Score: <span className="text-brand-400">{selectedEval.overall_score}%</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Evaluated by: {selectedEval.evaluator_name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedEval.status === 'SUBMITTED' ? (
                      <button
                        onClick={handleAcknowledge}
                        disabled={acknowledging}
                        className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                      >
                        {acknowledging ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Acknowledge Evaluation</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Acknowledged
                      </div>
                    )}

                    <button
                      onClick={handleRegenerateFeedback}
                      disabled={regenerating}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50"
                      title="Re-run AI Synthesis"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin text-brand-400' : ''}`} />
                      <span>Refresh AI</span>
                    </button>
                  </div>
                </div>

                {/* Manager Comments Section (Prominently Rendered) */}
                {selectedEval.manager_comments?.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-6 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" /> Manager Review Comments & Feedback
                      </h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Direct Coaching Note
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {selectedEval.manager_comments.map((c) => (
                        <div key={c.id} className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/20 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-400">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px]">
                                {c.manager_name ? c.manager_name[0] : 'M'}
                              </div>
                              <span className="font-bold text-slate-200">{c.manager_name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-blue-100 italic leading-relaxed pl-8">
                            "{c.comment_text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Radar Competency Visualizer */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white tracking-tight mb-4">Competency Radar Diagnostic</h3>
                  <ScoreRadarChart
                    labels={selectedEval.scores?.map(s => s.parameter_name) || []}
                    scores={selectedEval.scores?.map(s => Number(s.score)) || []}
                  />
                </div>

                {/* Granular Parameter Scores & HR Notes */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white tracking-tight">Evaluated Parameters & Justification Notes</h3>
                  <div className="space-y-3">
                    {selectedEval.scores?.map((s, idx) => (
                      <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white">{s.parameter_name}</span>
                            <span className="text-[10px] font-semibold text-slate-400">({s.weightage}% weight)</span>
                          </div>
                          <p className="text-xs text-slate-300 italic pl-7">HR Note: "{s.reason}"</p>
                        </div>
                        <span className="text-sm font-extrabold text-brand-400 font-mono pl-7 sm:pl-0 shrink-0">
                          {s.score} / 10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Performance Diagnostic Syntheses & Interactive AI Coach */}
                <div className="space-y-6">
                  {selectedEval.feedback && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" /> AI Performance Diagnostic Syntheses
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Key Strengths</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{selectedEval.feedback.strengths_text}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Growth Opportunities</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{selectedEval.feedback.skill_gaps_text}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">Actionable 90-Day Recommendations</h4>
                        <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          {selectedEval.feedback.suggestions_text}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive AI Coach Chat Bot */}
                  <AICoachChat
                    evaluationId={selectedEval.id}
                    initialContext={selectedEval}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
