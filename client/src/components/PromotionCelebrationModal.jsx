import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Award,
  Sparkles,
  CheckCircle2,
  PartyPopper,
  X,
  UserCheck,
  Building2,
  Calendar,
  MessageSquare
} from 'lucide-react';

export default function PromotionCelebrationModal() {
  const [notification, setNotification] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    async function checkPromotion() {
      try {
        const res = await axiosClient.get('/analytics/promotion-notification');
        if (res.data.data) {
          setNotification(res.data.data);
          // If not yet acknowledged by employee, open celebratory popup
          if (!res.data.data.isAcknowledged) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        // silently fail if no promotion notification
      }
    }
    checkPromotion();
  }, []);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await axiosClient.post('/analytics/acknowledge-promotion');
      setIsOpen(false);
      setNotification(prev => ({ ...prev, isAcknowledged: true }));
    } catch (err) {
      console.error('Failed to acknowledge promotion:', err);
      setIsOpen(false);
    } finally {
      setAcknowledging(false);
    }
  };

  if (!notification) return null;

  return (
    <>
      {/* Persistent Gold Celebration Banner at top of page */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-brand-500/20 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl mb-6 animate-pulse">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/30 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Official Career Advancement
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROMOTED
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white mt-0.5">
              Congratulations! You have been promoted to <span className="text-emerald-300 underline decoration-emerald-500">{notification.targetRoleName}</span>
            </h4>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" /> View Promotion Letter
        </button>
      </div>

      {/* Pop-up Celebration Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Medal & Confetti Icon */}
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-brand-400 text-black shadow-xl shadow-amber-500/30 mx-auto">
              <Award className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-1">
                Executive Promotion Notice
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Congratulations, {notification.employeeName}!
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Following outstanding performance appraisals and managerial recommendation, the HR Executive Committee has officially promoted you to:
              </p>
            </div>

            {/* New Title Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40 text-center shadow-inner">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Your New Designated Title</span>
              <h3 className="text-xl font-black text-emerald-300 tracking-tight">
                {notification.targetRoleName}
              </h3>
            </div>

            {/* Manager Endorsement & HR Notes */}
            <div className="text-left space-y-3">
              {notification.recommendationText && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Manager Endorsement ({notification.managerName}):
                  </span>
                  <p className="text-slate-300 italic">
                    "{notification.recommendationText}"
                  </p>
                </div>
              )}

              {notification.hrComment && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HR Executive Message:
                  </span>
                  <p className="text-slate-300 italic">
                    "{notification.hrComment}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-black font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>{acknowledging ? 'Confirming...' : 'Acknowledge & Celebrate 🎉'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
