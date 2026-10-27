import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import ScoreRadarChart from '../../components/ScoreRadarChart';
import PerformanceBarChart from '../../components/PerformanceBarChart';
import {
  BarChart3,
  Download,
  Award,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function TeamAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await axiosClient.get('/analytics/team');
        setAnalytics(res.data.data);
      } catch (err) {
        setError('Failed to load team analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await axiosClient.get('/reports/export?scope=team', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `capdex_team_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const paramLabels = analytics?.parameterAverages?.map(p => p.name) || [];
  const paramScores = analytics?.parameterAverages?.map(p => p.avgScore) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Team Performance Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Granular competency breakdown and downloadable team appraisal reports</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Export Team CSV Report</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Radar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Team Competency Radar</h3>
              <p className="text-xs text-slate-400">Average team performance across core competencies</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">0 - 10</span>
          </div>
          <ScoreRadarChart labels={paramLabels} scores={paramScores} />
        </div>

        {/* Competency Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Dimension Averages</h3>
              <p className="text-xs text-slate-400">Numerical average score by evaluated parameter</p>
            </div>
          </div>
          <PerformanceBarChart labels={paramLabels} dataPoints={paramScores} label="Metric Average (0-10)" />
        </div>
      </div>
    </div>
  );
}
