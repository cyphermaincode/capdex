import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import GrowthLineChart from '../../components/GrowthLineChart';
import PerformanceBarChart from '../../components/PerformanceBarChart';
import DepartmentPieChart from '../../components/DepartmentPieChart';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  Building2,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AnalyticsReports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await axiosClient.get('/analytics/organization');
        setAnalytics(res.data.data);
      } catch (err) {
        setError('Failed to load organizational analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await axiosClient.get('/reports/export?scope=org', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `capdex_org_report_${Date.now()}.csv`);
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

  const deptLabels = analytics?.departmentPerformance?.map(d => d.name) || [];
  const deptScores = analytics?.departmentPerformance?.map(d => d.avgScore) || [];

  const distData = [
    analytics?.scoreDistribution?.under_70 || 0,
    analytics?.scoreDistribution?.range_70_79 || 0,
    analytics?.scoreDistribution?.range_80_89 || 0,
    analytics?.scoreDistribution?.range_90_100 || 0
  ];

  const trendLabels = analytics?.trend?.map(t => new Date(t.cycleDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })) || [];
  const trendScores = analytics?.trend?.map(t => t.avgScore) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Organization Analytics & Reports</h1>
          <p className="text-xs text-slate-400 mt-1">Exportable diagnostic trends, department benchmarks, and score distributions</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Export Organization CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trajectory Over Time */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" />
              Appraisal Cycle Performance Trajectory
            </h3>
            <p className="text-xs text-slate-400">Historical overall score averages across completed review cycles</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">Quarterly Cycles</span>
        </div>
        <GrowthLineChart labels={trendLabels} dataPoints={trendScores} label="Org Average Score" />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Benchmark */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                Department Benchmarking
              </h3>
              <p className="text-xs text-slate-400">Average weighted performance score by business unit</p>
            </div>
          </div>
          <PerformanceBarChart labels={deptLabels} dataPoints={deptScores} label="Average Score" />
        </div>

        {/* Score Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Performance Tier Distribution
              </h3>
              <p className="text-xs text-slate-400">Employee distribution across performance brackets</p>
            </div>
          </div>
          <DepartmentPieChart dataPoints={distData} />
        </div>
      </div>
    </div>
  );
}
