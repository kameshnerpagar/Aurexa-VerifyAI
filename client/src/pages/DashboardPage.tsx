import React, { useState, useEffect } from 'react';
import { fetchStats } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Clock,
  AlertCircle,
  FileSearch,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Building,
  Info
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await fetchStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading AICTE Operational Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const priorityQueue = data?.priorityQueue || [];
  const recentActivity = data?.recentActivity || [];

  const pieColors = ['#0d9488', '#0284c7', '#f59e0b', '#e11d48', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Institutional Verification Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time automated preliminary scrutiny, cross-document discrepancies, and regulatory decision support.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>Illustrative Synthetic Dataset</span>
          </span>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 6 Key Operational KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => onNavigate('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-slate-900 mt-2">{stats.totalApplications || 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Active approval cycle</span>
        </div>

        {/* Awaiting Review */}
        <div
          onClick={() => onNavigate('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Awaiting Review</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-blue-600 mt-2">{stats.awaitingReview || 0}</p>
          <span className="text-[11px] text-blue-500 font-medium mt-1 block">In intake queue</span>
        </div>

        {/* Missing Documents */}
        <div
          onClick={() => onNavigate('review-queue')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Missing Documents</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-amber-600 mt-2">{stats.missingDocuments || 0}</p>
          <span className="text-[11px] text-amber-500 font-medium mt-1 block">Checklist gaps</span>
        </div>

        {/* Manual Verification */}
        <div
          onClick={() => onNavigate('review-queue')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Manual Verify</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <FileSearch className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-rose-600 mt-2">{stats.manualVerificationRequired || 0}</p>
          <span className="text-[11px] text-rose-500 font-medium mt-1 block">Needs scrutiny</span>
        </div>

        {/* Ready for Official Review */}
        <div
          onClick={() => onNavigate('applications')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ready for Official</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-600 mt-2">{stats.readyForOfficialReview || 0}</p>
          <span className="text-[11px] text-emerald-500 font-medium mt-1 block">Validated dossier</span>
        </div>

        {/* Open Compliance Deficiencies */}
        <div
          onClick={() => onNavigate('compliance-engine')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Deficiencies</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-rose-600 mt-2">{stats.openComplianceDeficiencies || 0}</p>
          <span className="text-[11px] text-rose-500 font-medium mt-1 block">Active findings</span>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Status Distribution</h3>
              <p className="text-[11px] text-slate-500">Current workflow breakdown across 12 seeded benchmarks</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts.statusDistribution || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} applications`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  formatter={(val: string) => <span className="text-[11px] text-slate-600">{val}</span>}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Prioritization Risk Profiles</h3>
              <p className="text-[11px] text-slate-500">Weighted heuristic distribution for scrutiny triage</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.riskDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Applications" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Category Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Approval Category Volumes</h3>
              <p className="text-[11px] text-slate-500">Distribution across statutory AICTE approval streams</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={charts.categoryBreakdown || []}
                margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Applications" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Priority Review Queue & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* High Priority Review Queue (2 Columns) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">High-Priority Scrutiny Queue</h3>
              <p className="text-[11px] text-slate-500">Applications flagged with critical discrepancies or high risk scores</p>
            </div>
            <button
              onClick={() => onNavigate('review-queue')}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/30">
                  <th className="py-2.5 px-4 font-semibold">Application</th>
                  <th className="py-2.5 px-4 font-semibold">Institution</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Risk Score</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priorityQueue.map((app: any) => (
                  <tr
                    key={app.id}
                    onClick={() => onNavigate('applications', app.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{app.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">{app.institution_name}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate">{app.category}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.overall_status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${app.risk_score >= 75 ? 'bg-rose-500' : app.risk_score >= 50 ? 'bg-orange-500' : 'bg-teal-500'}`}
                            style={{ width: `${app.risk_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 font-mono text-[11px]">{app.risk_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-teal-600 font-semibold hover:underline">Review &rarr;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Audit & Reviewer Activity Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Audit Events</h3>
              <p className="text-[11px] text-slate-500">Append-only immutable event stream</p>
            </div>
            <button
              onClick={() => onNavigate('audit-trail')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              All Logs
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[380px]">
            {recentActivity.map((ev: any) => (
              <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-semibold text-slate-700">{ev.actor_name} ({ev.actor_role})</span>
                  <span>{ev.timestamp ? ev.timestamp.slice(11, 16) : ''}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-mono text-slate-800 font-medium text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                    {ev.action}
                  </span>
                  {ev.application_id && (
                    <span
                      onClick={() => onNavigate('applications', ev.application_id)}
                      className="text-teal-600 hover:underline font-mono text-[11px] cursor-pointer"
                    >
                      {ev.application_id}
                    </span>
                  )}
                </div>
                {ev.details && ev.details.recommendation && (
                  <p className="text-slate-500 text-[11px] mt-1 italic">&ldquo;{ev.details.recommendation}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
