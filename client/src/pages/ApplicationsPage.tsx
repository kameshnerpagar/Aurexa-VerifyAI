import React, { useState, useEffect } from 'react';
import { fetchApplications } from '../api';
import { Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Search,
  Filter,
  FilePlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  FileText,
  CheckCircle
} from 'lucide-react';

interface ApplicationsPageProps {
  onNavigate: (view: string, id?: string) => void;
  initialFilter?: { status?: string; risk?: string };
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ onNavigate, initialFilter }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('All');
  const [status, setStatus] = useState<string>(initialFilter?.status || 'All');
  const [riskLevel, setRiskLevel] = useState<string>(initialFilter?.risk || 'All');
  const [academicYear, setAcademicYear] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('last_updated');
  const [sortOrder, setSortOrder] = useState<string>('DESC');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await fetchApplications({
        search,
        category,
        status,
        risk_level: riskLevel,
        academic_year: academicYear,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        limit: 8
      });
      if (res.success) {
        setApplications(res.applications || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [search, category, status, riskLevel, academicYear, sortBy, sortOrder, page]);

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Institutional Approval Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive registry of {totalCount} institutional filings across Approval Process Handbook categories.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-application')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <FilePlus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by App ID, Institute Name, PID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="All">All Categories</option>
              <option value="Extension of Approval (EOA)">Extension of Approval (EOA)</option>
              <option value="New Institution Approval">New Institution Approval</option>
              <option value="Increase in Intake / Additional Course">Increase in Intake</option>
              <option value="Change in Site / Campus">Change in Site / Campus</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Preliminary Validation">Under Preliminary Validation</option>
              <option value="Deficiencies Flagged">Deficiencies Flagged</option>
              <option value="Manual Review Required">Manual Review Required</option>
              <option value="Inspection Recommended">Inspection Recommended</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Ready for Official Decision">Ready for Official Decision</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={e => { setRiskLevel(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Fetching application records...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No applications found</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th
                    onClick={() => toggleSort('id')}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>App ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('institution_name')}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Institution & PID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th
                    onClick={() => toggleSort('risk_score')}
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Risk Priority</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Checks</th>
                  <th className="py-3 px-4 font-semibold">Assigned Reviewer</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => onNavigate('applications', app.id)}
                    className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                  >
                    {/* App ID & Academic Year */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900">{app.id}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{app.academic_year}</span>
                    </td>

                    {/* Institution Name & PID */}
                    <td className="py-3 px-4 max-w-[240px]">
                      <p className="font-semibold text-slate-800 truncate">{app.institution_name}</p>
                      <span className="text-[11px] text-slate-500 font-mono">
                        PID: {app.current_pid || 'Pending Allocation'} &bull; {app.state}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600 max-w-[180px]">
                      <span className="truncate block font-medium">{app.category}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {app.submission_date ? app.submission_date.slice(0, 10) : 'Not Submitted'}
                      </span>
                    </td>

                    {/* Overall Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={app.overall_status} size="sm" />
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${app.risk_score >= 75 ? 'bg-rose-500' : app.risk_score >= 50 ? 'bg-orange-500' : 'bg-teal-500'}`}
                            style={{ width: `${app.risk_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700 text-[11px]">{app.risk_score}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{app.risk_level} Priority</span>
                    </td>

                    {/* Checks / Gaps */}
                    <td className="py-3 px-4 text-[11px]">
                      {app.missing_doc_count > 0 ? (
                        <span className="text-amber-700 font-semibold block">
                          &bull; {app.missing_doc_count} Missing Doc(s)
                        </span>
                      ) : null}
                      {app.discrepancy_count > 0 ? (
                        <span className="text-rose-700 font-semibold block">
                          &bull; {app.discrepancy_count} Discrepancy
                        </span>
                      ) : null}
                      {app.missing_doc_count === 0 && app.discrepancy_count === 0 ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> All checks clear
                        </span>
                      ) : null}
                    </td>

                    {/* Assigned Reviewer */}
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium">{app.assigned_reviewer_name || 'Unassigned'}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Updated {app.last_updated ? app.last_updated.slice(0, 10) : ''}
                      </span>
                    </td>

                    {/* Action link */}
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-semibold text-xs transition-colors">
                        Review Workspace &rarr;
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Showing Page <span className="font-bold text-slate-700">{page}</span> of{' '}
            <span className="font-bold text-slate-700">{totalPages}</span> ({totalCount} Total)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
