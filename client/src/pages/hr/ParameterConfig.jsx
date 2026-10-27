import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import {
  Sliders,
  Plus,
  Edit2,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  PieChart,
  Layers,
  ArrowRight,
  Briefcase
} from 'lucide-react';

export default function ParameterConfig() {
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Parameter Modal
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [paramModalMode, setParamModalMode] = useState('create');
  const [selectedParam, setSelectedParam] = useState(null);
  const [paramFormData, setParamFormData] = useState({ name: '', weightage: 20 });
  const [paramLoading, setParamLoading] = useState(false);
  const [paramError, setParamError] = useState('');

  // Job Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ name: '', department_id: '' });
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Change Requests Modal
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchInitialData = async () => {
    try {
      const [rolesRes, requestsRes, deptsRes] = await Promise.all([
        axiosClient.get('/job-roles'),
        axiosClient.get('/change-requests'),
        axiosClient.get('/departments')
      ]);
      const roles = rolesRes.data.data || [];
      setJobRoles(roles);
      setChangeRequests(requestsRes.data.data || []);
      setDepartments(deptsRes.data.data || []);

      if (roles.length > 0) {
        const active = selectedRole ? (roles.find(r => r.id === selectedRole.id) || roles[0]) : roles[0];
        setSelectedRole(active);
        await fetchParamsForRole(active.id);
      }
    } catch (err) {
      console.error('Failed to load parameter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParamsForRole = async (roleId) => {
    try {
      const res = await axiosClient.get(`/parameters?jobRoleId=${roleId}`);
      setParameters(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch parameters for role:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRoleChange = async (role) => {
    setSelectedRole(role);
    await fetchParamsForRole(role.id);
  };

  const totalWeight = parameters.reduce((acc, p) => acc + Number(p.weightage), 0);

  const handleOpenCreateParam = () => {
    setParamModalMode('create');
    setSelectedParam(null);
    const remaining = Math.max(0, 100 - totalWeight);
    setParamFormData({ name: '', weightage: remaining > 0 ? remaining : 10 });
    setParamError('');
    setIsParamModalOpen(true);
  };

  const handleOpenEditParam = (p) => {
    setParamModalMode('edit');
    setSelectedParam(p);
    setParamFormData({ name: p.name, weightage: p.weightage });
    setParamError('');
    setIsParamModalOpen(true);
  };

  const handleParamSubmit = async (e) => {
    e.preventDefault();
    setParamLoading(true);
    setParamError('');

    try {
      if (paramModalMode === 'create') {
        await axiosClient.post('/parameters', {
          jobRoleId: selectedRole.id,
          name: paramFormData.name.trim(),
          weightage: Number(paramFormData.weightage)
        });
        setSuccessMsg('Evaluation parameter created successfully.');
      } else {
        await axiosClient.put(`/parameters/${selectedParam.id}`, {
          name: paramFormData.name.trim(),
          weightage: Number(paramFormData.weightage)
        });
        setSuccessMsg('Evaluation parameter updated successfully.');
      }
      setIsParamModalOpen(false);
      await fetchParamsForRole(selectedRole.id);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setParamError(err.response?.data?.error?.message || 'Failed to save parameter.');
    } finally {
      setParamLoading(false);
    }
  };

  const handleOpenCreateRole = () => {
    setRoleFormData({
      name: '',
      department_id: departments[0]?.id ? String(departments[0].id) : ''
    });
    setRoleError('');
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleLoading(true);
    setRoleError('');

    try {
      const res = await axiosClient.post('/job-roles', {
        name: roleFormData.name.trim(),
        department_id: Number(roleFormData.department_id)
      });
      setSuccessMsg('New job role registered successfully.');
      setIsRoleModalOpen(false);

      const rolesRes = await axiosClient.get('/job-roles');
      const updatedRoles = rolesRes.data.data || [];
      setJobRoles(updatedRoles);
      const newRole = updatedRoles.find(r => r.id === res.data.data.id) || updatedRoles[updatedRoles.length - 1];
      if (newRole) {
        setSelectedRole(newRole);
        await fetchParamsForRole(newRole.id);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setRoleError(err.response?.data?.error?.message || 'Failed to create job role.');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleRequestStatus = async (id, status) => {
    try {
      await axiosClient.patch(`/change-requests/${id}`, { status });
      setSuccessMsg(`Change request ${status.toLowerCase()} successfully.`);
      const requestsRes = await axiosClient.get('/change-requests');
      setChangeRequests(requestsRes.data.data || []);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update request.');
    }
  };

  const pendingRequests = changeRequests.filter(r => r.status === 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Evaluation Parameters</h1>
          <p className="text-xs text-slate-400 mt-1">Configure role-specific metrics strictly enforced to sum to 100%</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateRole}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4 text-brand-400" />
            <span>+ Add Job Role</span>
          </button>
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="relative px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-2"
          >
            <GitPullRequest className="w-4 h-4 text-purple-400" />
            <span>Manager Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white font-black text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={handleOpenCreateParam}
            disabled={!selectedRole || totalWeight >= 100}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add Parameter
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {jobRoles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleRoleChange(role)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              selectedRole?.id === role.id
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30 font-extrabold'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{role.name}</span>
            <span className="text-[10px] text-slate-500">({role.department_name})</span>
          </button>
        ))}
      </div>

      {/* Weightage Budget Progress Card */}
      {selectedRole && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Weightage Budget Allocation: <span className="text-brand-400">{selectedRole.name}</span>
              </h3>
              <p className="text-xs text-slate-400">Total weightage across all metrics for this role must sum to exactly 100%.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${totalWeight === 100 ? 'text-emerald-400' : totalWeight > 100 ? 'text-rose-400' : 'text-amber-400'}`}>
                {totalWeight}%
              </span>
              <span className="text-xs text-slate-500">/ 100%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                totalWeight === 100 ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, totalWeight)}%` }}
            />
          </div>

          {totalWeight < 100 && (
            <p className="mt-2 text-xs text-amber-400 font-medium">
              ⚠️ {100 - totalWeight}% remaining to allocate before this parameter set is balanced.
            </p>
          )}
          {totalWeight === 100 && (
            <p className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Parameter set is balanced and ready for appraisals.
            </p>
          )}
        </div>
      )}

      {/* Parameter Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parameters.map((param, index) => (
          <div
            key={param.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">{param.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Appraisal Dimension & Grading Metric</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-base font-extrabold text-brand-400">{param.weightage}%</span>
                <span className="block text-[10px] text-slate-500 font-semibold uppercase">Weight</span>
              </div>
              <button
                onClick={() => handleOpenEditParam(param)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Edit Parameter"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {parameters.length === 0 && selectedRole && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <p className="text-xs text-slate-400">No evaluation parameters configured for <strong className="text-white">{selectedRole.name}</strong> yet.</p>
            <button
              onClick={handleOpenCreateParam}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Parameter
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Parameter Modal */}
      <Modal
        isOpen={isParamModalOpen}
        onClose={() => setIsParamModalOpen(false)}
        title={paramModalMode === 'create' ? `Add Parameter to ${selectedRole?.name}` : 'Edit Parameter'}
      >
        {paramError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{paramError}</span>
          </div>
        )}

        <form onSubmit={handleParamSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Parameter / Metric Name
            </label>
            <input
              type="text"
              required
              value={paramFormData.name}
              onChange={(e) => setParamFormData({ ...paramFormData, name: e.target.value })}
              placeholder="e.g. Code Quality, Campaign ROI, Architecture"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Weightage Percentage (1 - 100%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={paramFormData.weightage}
              onChange={(e) => setParamFormData({ ...paramFormData, weightage: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsParamModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paramLoading}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              {paramLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {paramModalMode === 'create' ? 'Save Parameter' : 'Update Parameter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Job Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Register New Job Role"
      >
        {roleError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{roleError}</span>
          </div>
        )}

        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Job Role Title
            </label>
            <input
              type="text"
              required
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              placeholder="e.g. Senior Backend Engineer, UI/UX Designer"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assigned Department
            </label>
            <select
              value={roleFormData.department_id}
              onChange={(e) => setRoleFormData({ ...roleFormData, department_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={roleLoading}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              {roleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Job Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Manager Change Requests Modal */}
      <Modal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        title="Manager Parameter Change Requests"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Review proposed parameter weightage modifications requested by Department Managers.
          </p>

          {changeRequests.length > 0 ? (
            <div className="space-y-3">
              {changeRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{req.parameter_name}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">({req.current_weightage}%)</span>
                      <span className="text-[11px] text-slate-500 block">Role: {req.job_role_name}</span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 italic">
                    "{req.request_text}"
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                    <span>Requested by: {req.requested_by_name}</span>
                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRequestStatus(req.id, 'APPROVED')}
                          className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRequestStatus(req.id, 'REJECTED')}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No change requests submitted.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
