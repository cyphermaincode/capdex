import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  GitPullRequest,
  Plus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers
} from 'lucide-react';

export default function ParameterChangeRequests() {
  const [parameters, setParameters] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParamId, setSelectedParamId] = useState('');
  const [requestText, setRequestText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const [paramsRes, requestsRes] = await Promise.all([
        axiosClient.get('/parameters'),
        axiosClient.get('/change-requests')
      ]);
      setParameters(paramsRes.data.data || []);
      setMyRequests(requestsRes.data.data || []);
      if (paramsRes.data.data?.length > 0) {
        setSelectedParamId(paramsRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load change requests data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = (paramId) => {
    if (paramId) setSelectedParamId(paramId);
    setRequestText('');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axiosClient.post(`/parameters/${selectedParamId}/change-request`, {
        request_text: requestText
      });
      setSuccessMsg('Parameter modification request submitted to HR.');
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit request.');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Parameter Change Requests</h1>
          <p className="text-xs text-slate-400 mt-1">Propose competency weighting or description adjustments to HR administrators</p>
        </div>
        <button
          onClick={() => handleOpenCreate()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" /> New Proposal
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Column Grid: Current Parameters vs Submitted Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-400" /> Active Department Parameters
            </h3>
            <p className="text-xs text-slate-400">Select any metric to propose an adjustment to HR</p>
          </div>

          <div className="space-y-3">
            {parameters.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Role: {p.job_role_name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">
                    {p.weightage}%
                  </span>
                  <button
                    onClick={() => handleOpenCreate(p.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Request Change
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Submitted Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-purple-400" /> Request Audit Log
            </h3>
            <p className="text-xs text-slate-400">History of parameter revisions submitted to HR</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {myRequests.length > 0 ? (
              myRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white">{req.parameter_name} ({req.current_weightage}%)</div>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    "{req.request_text}"
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Submitted on {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No change requests submitted yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Propose Parameter Weightage Revision"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Target Parameter
            </label>
            <select
              value={selectedParamId}
              onChange={(e) => setSelectedParamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {parameters.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.weightage}%) — {p.job_role_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Reason / Proposed Weighting Adjustment
            </label>
            <textarea
              rows={4}
              required
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Explain why this parameter's weight should be adjusted (e.g. Increase architecture weight to 30% due to upcoming cloud migration)..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
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
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Proposal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
