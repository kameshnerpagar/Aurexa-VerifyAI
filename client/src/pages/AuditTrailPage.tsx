import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../api';
import { AuditEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  History,
  Search,
  Filter,
  Lock,
  ShieldCheck,
  Calendar,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';

interface AuditTrailPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const AuditTrailPage: React.FC<AuditTrailPageProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetchAuditLogs({
        search,
        actor_role: roleFilter || undefined,
        action: actionFilter || undefined,
        page,
        limit: 20
      });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, roleFilter, actionFilter, page]);

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
            Tamper-Evident Ledger
          </span>
          <span className="text-xs text-slate-400">&bull; Section 17 Append-Only Event Store</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
          Regulatory Audit Trail & Chain of Custody
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable, timestamped event log recording application creations, uploads, OCR corrections, dispositions, and status changes.
        </p>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-teal-400 shrink-0" />
          <p className="text-slate-300">
            <strong className="text-white">Append-Only Integrity:</strong> Historical entries cannot be modified or deleted via user interface. All administrative transitions are linked to actor credentials and source IP.
          </p>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono text-[10px]">
          SQLite WAL Mode Active
        </span>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by actor, action, or target ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Actor Roles</option>
            <option value="applicant">Institution Applicant</option>
            <option value="reviewer">AICTE Reviewer</option>
            <option value="admin">Administrator</option>
            <option value="system">System / Verification Engine</option>
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="APPLICATION_SUBMITTED">Application Submitted</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="VALIDATION_RUN_COMPLETED">Validation Run</option>
            <option value="FINDING_DISPOSITION_RECORDED">Finding Disposition</option>
            <option value="OCR_EXTRACTION_CORRECTED">OCR Corrected</option>
            <option value="COMPLIANCE_RULE_TOGGLED">Rule Toggled</option>
            <option value="REPORT_GENERATED">Report Generated</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Querying immutable audit ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs italic">
            No audit events found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Timestamp & IP</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Application</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Audit Details & Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 font-sans">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-slate-800 font-semibold block">{log.timestamp}</span>
                      <span className="text-[10px] text-slate-400 font-mono">IP: {log.ip_address}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-slate-800">{log.actor_name}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{log.actor_role}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.application_id ? (
                        <button
                          onClick={() => onNavigate('applications', log.application_id)}
                          className="text-teal-600 hover:underline font-mono font-bold"
                        >
                          {log.application_id}
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={log.outcome} size="sm" />
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <details className="text-[10px]">
                          <summary className="cursor-pointer text-slate-500 hover:text-slate-800">
                            {log.details.reason || log.details.disposition || log.details.file_name || 'View JSON Payload'}
                          </summary>
                          <pre className="mt-1 p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[10px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-slate-500">Page {page}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
