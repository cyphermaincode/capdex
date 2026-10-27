import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/Modal';
import {
  Building2,
  Plus,
  Edit2,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', manager_id: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchDepts = async () => {
    try {
      const [deptsRes, usersRes] = await Promise.all([
        axiosClient.get('/departments'),
        axiosClient.get('/users?role=MANAGER')
      ]);
      setDepartments(deptsRes.data.data || []);
      setManagers(usersRes.data.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedDept(null);
    setFormData({ name: '', manager_id: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setModalMode('edit');
    setSelectedDept(dept);
    setFormData({ name: dept.name, manager_id: dept.manager_id ? String(dept.manager_id) : '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/departments', {
          name: formData.name.trim(),
          manager_id: formData.manager_id ? Number(formData.manager_id) : null
        });
        setSuccessMsg('Department created successfully.');
      } else {
        await axiosClient.put(`/departments/${selectedDept.id}`, {
          name: formData.name.trim(),
          manager_id: formData.manager_id ? Number(formData.manager_id) : null
        });
        setSuccessMsg('Department updated successfully.');
      }
      setIsModalOpen(false);
      await fetchDepts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Action failed.');
    } finally {
      setFormLoading(false);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Department Management</h1>
          <p className="text-xs text-slate-400 mt-1">Organize operational units and assign dedicated departmental managers</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Edit Department"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">{dept.name}</h3>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Manager:{' '}
                    <strong className="text-slate-200">
                      {dept.manager_name || 'Unassigned'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Team Size:{' '}
                    <strong className="text-brand-400">
                      {dept.employee_count || 0} Employees
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Dept ID: #{dept.id}</span>
              <span>Active Node</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Department' : 'Edit Department'}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Department Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Engineering, Product, Marketing"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assigned Manager
            </label>
            <select
              value={formData.manager_id}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="">None (Unassigned)</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
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
              disabled={formLoading}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {modalMode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
