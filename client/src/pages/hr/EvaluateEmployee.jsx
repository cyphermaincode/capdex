import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import {
  ClipboardCheck,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sliders,
  HelpCircle,
  Award,
  Layers
} from 'lucide-react';

export default function EvaluateEmployee() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [scores, setScores] = useState({});
  const [reasons, setReasons] = useState({});
  const [cycleDate, setCycleDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [usersRes, deptsRes, rolesRes] = await Promise.all([
          axiosClient.get('/users?role=EMPLOYEE'),
          axiosClient.get('/departments'),
          axiosClient.get('/job-roles')
        ]);
        setEmployees(usersRes.data.data || []);
        setDepartments(deptsRes.data.data || []);
        setJobRoles(rolesRes.data.data || []);
      } catch (err) {
        setError('Failed to load employee list.');
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const handleSelectEmployee = async (emp) => {
    setSelectedEmp(emp);
    setError('');
    setSubmissionResult(null);

    const deptRoles = jobRoles.filter(jr => Number(jr.department_id) === Number(emp.department_id));
    const roleId = deptRoles[0]?.id || 1;

    try {
      const pRes = await axiosClient.get(`/parameters?jobRoleId=${roleId}`);
      const params = pRes.data.data || [];
      setParameters(params);

      const initialScores = {};
      const initialReasons = {};
      params.forEach(p => {
        initialScores[p.id] = 8.0;
        initialReasons[p.id] = '';
      });
      setScores(initialScores);
      setReasons(initialReasons);
    } catch (err) {
      setError('Failed to load parameters for this employee role.');
    }
  };

  const handleScoreChange = (paramId, val) => {
    setScores(prev => ({ ...prev, [paramId]: Number(val) }));
  };

  const handleReasonChange = (paramId, val) => {
    setReasons(prev => ({ ...prev, [paramId]: val }));
  };

  const totalWeight = parameters.reduce((acc, p) => acc + Number(p.weightage), 0);
  const weightedScore = totalWeight > 0
    ? parameters.reduce((acc, p) => acc + (Number(scores[p.id] || 0) * Number(p.weightage)), 0) / totalWeight * 10
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const scorePayload = parameters.map(p => ({
      parameter_id: p.id,
      score: Number(scores[p.id]),
      reason: reasons[p.id] || ''
    }));

    try {
      const res = await axiosClient.post('/evaluations', {
        employee_id: selectedEmp.id,
        cycle_date: cycleDate,
        scores: scorePayload
      });
      setSubmissionResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit appraisal.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    !selectedDept || Number(e.department_id) === Number(selectedDept)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Evaluate Contributor</h1>
        <p className="text-xs text-slate-400 mt-1">Submit structured weighted appraisal scores with mandatory written rationales</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {submissionResult ? (
        /* Clean HR Evaluation Summary (Without Employee AI Diagnostic Syntheses) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Appraisal Logged: {selectedEmp.name}
                </h2>
                <p className="text-xs text-slate-400">Evaluation Cycle: {cycleDate} • Department: {selectedEmp.department_name || 'General'}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-400">{submissionResult.overall_score}%</span>
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Overall Weighted Score</span>
            </div>
          </div>

          {/* Submission Details & Parameters Logged */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recorded Parameter Scores & Justifications</h3>
              <StatusBadge status="SUBMITTED" />
            </div>

            <div className="space-y-2.5">
              {parameters.map((p, idx) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({p.weightage}% weight)</span>
                    </div>
                    <p className="text-xs text-slate-300 italic pl-7 mt-1">HR Rationale: "{reasons[p.id]}"</p>
                  </div>
                  <span className="text-sm font-extrabold text-brand-400 font-mono shrink-0">
                    {scores[p.id]} / 10
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              ✓ Evaluation submitted and routed to Contributor Portal for formal review & acknowledgment.
            </p>
            <button
              onClick={() => {
                setSelectedEmp(null);
                setSubmissionResult(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition shadow-lg shadow-brand-500/20"
            >
              Evaluate Another Contributor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 1: Employee Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" /> 1. Select Contributor
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Filter by Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelectEmployee(emp)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedEmp?.id === emp.id
                      ? 'bg-brand-500/10 border-brand-500/50 text-white font-bold'
                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp.department_name || 'General'}</div>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 ${selectedEmp?.id === emp.id ? 'text-brand-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            {selectedEmp && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Appraisal Cycle Date
                </label>
                <input
                  type="date"
                  value={cycleDate}
                  onChange={(e) => setCycleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Step 2 & 3: Parameter Scoring & Reasons Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {!selectedEmp ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                Select an employee from the left panel to begin evaluation.
              </div>
            ) : parameters.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                No evaluation parameters defined for this employee's job role. Configure parameters first.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Grading: {selectedEmp.name}
                    </h3>
                    <p className="text-xs text-slate-400">{parameters.length} parameters configured (100% total weightage)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-2xl font-black text-brand-400">{weightedScore.toFixed(1)}%</span>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Weighted Preview</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {parameters.map((p, idx) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-800 text-[11px] font-bold text-white flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">{p.name}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {p.weightage}% weight
                        </span>
                      </div>

                      {/* Slider & Number */}
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={scores[p.id] || 0}
                          onChange={(e) => handleScoreChange(p.id, e.target.value)}
                          className="flex-1 accent-brand-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-sm font-extrabold text-white font-mono w-12 text-right">
                          {scores[p.id] || 0} / 10
                        </span>
                      </div>

                      {/* Mandatory Reason */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          Mandatory Reason / Justification <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={reasons[p.id] || ''}
                          onChange={(e) => handleReasonChange(p.id, e.target.value)}
                          placeholder={`Specific rationale for ${scores[p.id] || 0}/10 score...`}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Evaluation...
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" /> Save & Log Appraisal
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
