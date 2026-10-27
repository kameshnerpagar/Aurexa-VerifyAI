import React, { useState, useEffect } from 'react';
import { fetchApplications } from '../api';
import { Application } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ListOrdered,
  AlertTriangle,
  FileQuestion,
  Clock,
  CheckCircle2,
  Filter,
  ArrowRight,
  Flame,
  Search
} from 'lucide-react';

interface ReviewQueuePageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const ReviewQueuePage: React.FC<ReviewQueuePageProps> = ({ onNavigate }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('high-priority');
  const [search, setSearch] = useState<string>('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      let statusParam = 'All';
      let riskParam = 'All';

      if (activeFilter === 'high-priority') {
        riskParam = 'Critical';
      } else if (activeFilter === 'missing-docs') {
        // Will filter locally for missing_doc_count > 0
      } else if (activeFilter === 'manual-review') {
        statusParam = 'Manual Review Required';
      } else if (activeFilter === 'deficiencies') {
        statusParam = 'Deficiencies Flagged';
      } else if (activeFilter === 'ready-official') {
        statusParam = 'Ready for Official Decision';
      }

      const res = await fetchApplications({
        status: statusParam,
        risk_level: riskParam,
        search,
        limit: 30
      });

      if (res.success) {
        let list = res.applications || [];
        if (activeFilter === 'missing-docs') {
          list = list.filter((a: any) => a.missing_doc_count > 0);
        } else if (activeFilter === 'high-priority') {
          list = list.filter((a: any) => a.risk_score >= 50);
        }
        setApplications(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [activeFilter, search]);

  const queueFilters = [
    { id: 'high-priority', label: 'High Priority (Risk >= 50)', icon: Flame },
    { id: 'missing-docs', label: 'Missing Documents', icon: FileQuestion },
    { id: 'deficiencies', label: 'Compliance Deficiencies', icon: AlertTriangle },
    { id: 'manual-review', label: 'Manual Review Required', icon: Clock },
    { id: 'ready-official', label: 'Ready for Official Review', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
            Reviewer Triage
          </span>
          <span className="text-xs text-slate-400">&bull; AICTE Work Allocation Pipeline</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
          Prioritized Application Review Queue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dynamic triage prioritizing institutional filings by severity of unresolved discrepancies, expiry gaps, and verification backlog.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {queueFilters.map(f => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Queue List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter current queue..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {applications.length} case{applications.length === 1 ? '' : 's'} in current filter
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Prioritizing scrutiny queue...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">Queue is clear for this filter</h3>
            <p className="text-xs text-slate-400 mt-1">No applications currently matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Priority / Risk</th>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Institution & PID</th>
                  <th className="py-3 px-4">Approval Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Flagged Issues</th>
                  <th className="py-3 px-4 text-right">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => onNavigate('applications', app.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            app.risk_score >= 75 ? 'bg-rose-500 animate-pulse' : app.risk_score >= 50 ? 'bg-orange-500' : 'bg-teal-500'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-900 text-sm">{app.risk_score}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">({app.risk_level})</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{app.id}</td>

                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="font-semibold text-slate-800 truncate">{app.institution_name}</p>
                      <span className="text-[10px] text-slate-400 font-mono">PID: {app.current_pid} &bull; {app.state}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate">{app.category}</td>

                    <td className="py-3 px-4">
                      <StatusBadge status={app.overall_status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      {app.missing_doc_count > 0 && (
                        <span className="text-amber-700 font-semibold block">&bull; {app.missing_doc_count} Missing Doc(s)</span>
                      )}
                      {app.discrepancy_count > 0 && (
                        <span className="text-rose-700 font-semibold block">&bull; {app.discrepancy_count} Discrepancy(ies)</span>
                      )}
                      {app.missing_doc_count === 0 && app.discrepancy_count === 0 && (
                        <span className="text-emerald-700 font-medium">&bull; Clear</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-teal-600 font-bold hover:underline">
                        Open Dossier &rarr;
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
