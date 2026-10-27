import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  UserX,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Building2,
  Calendar,
  Clock,
  Save
} from 'lucide-react';

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return 'Not Evaluated';
  if (typeof dateVal === 'string' && dateVal.includes('T')) {
    return dateVal.split('T')[0];
  }
  return String(dateVal);
};

export default function EmployeeDirectory() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // User Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: '',
    phone: '',
    appraisalDate: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Appraisal Date Edit Modal State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [dateEditUser, setDateEditUser] = useState(null);
  const [newAppraisalDate, setNewAppraisalDate] = useState('');
  const [dateSaving, setDateSaving] = useState(false);
  const [dateError, setDateError] = useState('');

  const fetchDirectory = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        axiosClient.get('/users'),
        axiosClient.get('/departments')
      ]);
      setUsers(usersRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
      phone: '',
      appraisalDate: new Date().toISOString().split('T')[0]
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setModalMode('edit');
    setSelectedUser(u);
    const existingDate = u.latest_cycle_date || u.appraisal_date || '';
    const cleanDate = existingDate ? (existingDate.includes('T') ? existingDate.split('T')[0] : existingDate) : '';
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      departmentId: u.department_id ? String(u.department_id) : '',
      phone: u.phone || '',
      appraisalDate: cleanDate
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditDate = (u) => {
    setDateEditUser(u);
    const existingDate = u.latest_cycle_date || u.appraisal_date || '';
    const cleanDate = existingDate
      ? (existingDate.includes('T') ? existingDate.split('T')[0] : existingDate)
      : new Date().toISOString().split('T')[0];
    setNewAppraisalDate(cleanDate);
    setDateError('');
    setIsDateModalOpen(true);
  };

  const handleSaveAppraisalDate = async (e) => {
    e.preventDefault();
    if (!newAppraisalDate) {
      setDateError('Please select a valid date.');
      return;
    }
    setDateSaving(true);
    setDateError('');

    try {
      await axiosClient.patch(`/evaluations/employee/${dateEditUser.id}/cycle-date`, {
        cycle_date: newAppraisalDate
      });
      setSuccessMsg(`Appraisal cycle date for ${dateEditUser.name} updated to ${newAppraisalDate}.`);
      setIsDateModalOpen(false);
      await fetchDirectory();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setDateError(err.response?.data?.error?.message || 'Failed to update appraisal date.');
    } finally {
      setDateSaving(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          department_id: formData.departmentId ? Number(formData.departmentId) : null,
          departmentId: formData.departmentId ? Number(formData.departmentId) : null,
          phone: formData.phone ? formData.phone.trim() : null,
          appraisal_date: formData.appraisalDate || null
        };
        await axiosClient.post('/users', payload);
        setSuccessMsg('User registered successfully.');
      } else {
        await axiosClient.put(`/users/${selectedUser.id}`, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          department_id: formData.departmentId ? Number(formData.departmentId) : null,
          departmentId: formData.departmentId ? Number(formData.departmentId) : null,
          phone: formData.phone ? formData.phone.trim() : null,
          appraisal_date: formData.appraisalDate || null
        });
        setSuccessMsg('User profile updated successfully.');
      }
      setIsModalOpen(false);
      await fetchDirectory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Action failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await axiosClient.delete(`/users/${id}`);
      setSuccessMsg(`Deactivated user ${name}.`);
      await fetchDirectory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to deactivate user.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || Number(u.department_id) === Number(deptFilter);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Manage all organization accounts, roles, departmental assignments, and editable appraisal cycle dates</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-400 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Roles</option>
            <option value="HR">HR Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Appraisal Cycle Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const dateVal = u.latest_cycle_date || u.appraisal_date;
                  const displayDate = formatDateDisplay(dateVal);

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {u.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {u.department_name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'EMPLOYEE' ? (
                          <button
                            onClick={() => handleOpenEditDate(u)}
                            className="group px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-500 text-left transition flex items-center gap-2"
                            title="Click to edit appraisal date for this employee"
                          >
                            <Calendar className="w-3.5 h-3.5 text-brand-400 group-hover:scale-110 transition" />
                            <span className="font-mono text-slate-300 font-semibold group-hover:text-white">
                              {displayDate}
                            </span>
                            <span className="text-[10px] text-brand-400 opacity-0 group-hover:opacity-100 transition underline font-normal">
                              Edit
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={u.is_laid_off ? 'LAID_OFF' : u.is_active ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === 'EMPLOYEE' && (
                            <button
                              onClick={() => handleOpenEditDate(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-semibold transition flex items-center gap-1 border border-brand-500/20"
                              title="Change Appraisal Date"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Date
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            title="Edit User Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.is_active && u.role !== 'HR' && (
                            <button
                              onClick={() => handleDeactivate(u.id, u.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                              title="Deactivate Account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Appraisal Date Modal */}
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title={`Edit Appraisal Date: ${dateEditUser?.name || 'Employee'}`}
        maxWidth="max-w-md"
      >
        {dateError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        <form onSubmit={handleSaveAppraisalDate} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{dateEditUser?.name}</span>
              <span className="text-[10px] uppercase font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10">
                {dateEditUser?.department_name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{dateEditUser?.email}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-400" /> New Appraisal Cycle Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={newAppraisalDate}
              onChange={(e) => setNewAppraisalDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500">Quick Presets:</span>
            <button
              type="button"
              onClick={() => setNewAppraisalDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                setNewAppraisalDate(d.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
            >
              -1 Month
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 3);
                setNewAppraisalDate(d.toISOString().split('T')[0]);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
            >
              Last Quarter
            </button>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={dateSaving || !newAppraisalDate}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-brand-500/20 disabled:opacity-40"
            >
              {dateSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Appraisal Date
            </button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Register New User' : 'Edit User Profile'}
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
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Johnson"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address (Login ID)
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="alex@capdex.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {modalMode === 'create' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Initial Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                System Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">None / Corporate</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'EMPLOYEE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-400" /> Appraisal Cycle Date
              </label>
              <input
                type="date"
                value={formData.appraisalDate}
                onChange={(e) => setFormData({ ...formData, appraisalDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-0100"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
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
              disabled={formLoading}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
            >
              {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {modalMode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
