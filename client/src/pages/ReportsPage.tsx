import React, { useState, useEffect } from 'react';
import { fetchApplications, fetchReportData } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle,
  AlertTriangle,
  QrCode,
  FileCheck,
  Calendar,
  Layers,
  Info
} from 'lucide-react';

interface ReportsPageProps {
  initialAppId?: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialAppId }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId || 'APP-2026-1001');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchApplications({ limit: 50 }).then(res => {
      if (res.success) {
        setApplications(res.applications || []);
        if (!initialAppId && res.applications?.length > 0) {
          setSelectedAppId(res.applications[0].id);
        }
      }
    });
  }, [initialAppId]);

  const loadReport = async (appId: string) => {
    try {
      setLoading(true);
      const res = await fetchReportData(appId);
      if (res.success) {
        setReport(res.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAppId) {
      loadReport(selectedAppId);
    }
  }, [selectedAppId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
              Audit & Decision Support Dossier
            </span>
            <span className="text-xs text-slate-400">&bull; AICTE Approval Process Reporting</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
            Application Verification & Regulatory Dossier
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal decision-support document synthesizing automated validations, extracted fields, and cross-checks for committee review.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Application Selector */}
          <select
            value={selectedAppId}
            onChange={e => setSelectedAppId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs focus:outline-none"
          >
            {applications.map(a => (
              <option key={a.id} value={a.id}>
                {a.id} - {a.institution_name?.slice(0, 30)}...
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Dossier</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      {loading || !report ? (
        <div className="py-24 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Generating official verification report...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 sm:p-12 max-w-4xl mx-auto space-y-8 text-slate-800 print:border-none print:shadow-none print:p-0">
          {/* Report Official Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2 relative">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <ShieldCheck className="w-7 h-7 text-teal-400" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-extrabold font-heading text-slate-900 tracking-tight leading-tight">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </h2>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                  Automated Application Scrutiny & Compliance Verification Dossier
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-100 mt-4">
              <span>Run ID: {report.validationRunId}</span>
              <span>Generated: {report.generatedAt}</span>
              <span>System: Aurexa VerifyAI (PS-SIH26261)</span>
            </div>
          </div>

          {/* Section 1: Institution & Application Identification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              1. Institutional Profile & Filing Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution Legal Name</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{report.application.institution_name}</p>
                <span className="text-slate-500 block mt-0.5">
                  PID: <strong className="font-mono text-slate-800">{report.application.current_pid}</strong> &bull; {report.application.state}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Approval Category & Academic Year</span>
                <p className="font-bold text-slate-900 mt-0.5">{report.application.category}</p>
                <span className="text-slate-500 block mt-0.5">AY {report.application.academic_year} &bull; Status: <strong>{report.application.overall_status}</strong></span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Campus Address</span>
                <p className="text-slate-700 mt-0.5">{report.application.address}, {report.application.district}, {report.application.state}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Scrutiny Officer</span>
                <p className="font-semibold text-slate-800 mt-0.5">{report.application.assigned_reviewer_name || 'AICTE Central Evaluation Committee'}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Scrutiny Prioritization & Risk Assessment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              2. Scrutiny Prioritization Score & Heuristic Indicators
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Prioritization Score</span>
                <p className="text-2xl font-bold font-heading text-slate-900 mt-0.5">
                  {report.application.risk_score} / 100 ({report.application.risk_level} Priority)
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Derivation: {report.findings.length} cross-document findings, {report.application.missing_doc_count} checklist gaps.
                </p>
              </div>
              <StatusBadge status={report.application.risk_level} size="md" />
            </div>
          </div>

          {/* Section 3: Document Verification Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              3. Document Authenticity Verification Matrix
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Document Category</th>
                    <th className="py-2.5 px-3">File Reference</th>
                    <th className="py-2.5 px-3">Verification Source</th>
                    <th className="py-2.5 px-3 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.documents.map((d: any) => (
                    <tr key={d.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{d.document_type}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[180px]">{d.file_name}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">
                        {d.verification_records?.[0]?.source_authority || 'Local Mock Verifier'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <StatusBadge status={d.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Cross-Document Findings & Discrepancies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              4. Cross-Document Findings & Regulatory Discrepancies
            </h3>
            {report.findings.length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-medium">
                Zero cross-document inconsistencies detected. All submitted identifiers, dates, and intake figures match primary benchmarks.
              </p>
            ) : (
              <div className="space-y-2">
                {report.findings.map((f: any) => (
                  <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{f.finding_type} ({f.finding_code})</span>
                      <StatusBadge status={f.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600">{f.explanation}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-600">
                      <span>Observed: <strong className="text-rose-700">{f.observed_value}</strong></span>
                      <span>Expected: <strong className="text-slate-800">{f.expected_value}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Regulatory Compliance Evaluation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              5. AICTE Handbook Compliance Checklist (8 Evaluated Rules)
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Rule Code & Name</th>
                    <th className="py-2.5 px-3">Handbook Clause</th>
                    <th className="py-2.5 px-3">Evidence Observed</th>
                    <th className="py-2.5 px-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.evaluations.map((ev: any) => (
                    <tr key={ev.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{ev.rule_name}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{ev.aicte_handbook_ref}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-600 max-w-xs truncate">{ev.evidence_found}</td>
                      <td className="py-2 px-3 text-right">
                        <StatusBadge status={ev.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Sign-off & Human Review Disclaimer */}
          <div className="pt-6 border-t-2 border-slate-900 space-y-4">
            <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-600 leading-relaxed border border-slate-200">
              <span className="font-bold text-slate-800 block mb-0.5">STATUTORY DISCLAIMER & LIMITATION NOTICE:</span>
              {report.disclaimer}
            </div>

            <div className="pt-6 flex items-end justify-between text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Scrutiny Officer Signature</span>
                <div className="w-48 border-b border-slate-400 pt-6" />
                <p className="font-semibold text-slate-800">{report.application.assigned_reviewer_name || 'AICTE Reviewer'}</p>
                <span className="text-[10px] text-slate-400 block">AICTE Central Approval Bureau</span>
              </div>

              <div className="text-right space-y-1">
                <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-mono ml-auto">
                  OFFICIAL STAMP
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Dossier ID: {report.validationRunId}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
