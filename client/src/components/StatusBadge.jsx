import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  const getBadgeStyle = () => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'ELIGIBLE':
      case 'ACKNOWLEDGED':
      case 'APPROVED':
      case 'COMPLETED':
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'NEEDS_TRAINING':
      case 'IN_PROGRESS':
      case 'PENDING':
      case 'SUBMITTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'NOT_READY':
      case 'REJECTED':
      case 'INACTIVE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'OPEN':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'HR':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EMPLOYEE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}>
      {status ? String(status).replace(/_/g, ' ') : 'N/A'}
    </span>
  );
}
