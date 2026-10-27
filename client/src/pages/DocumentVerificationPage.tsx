import React, { useState, useEffect } from 'react';
import { fetchMockIssuerRegistry, fetchApplications } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShieldAlert,
  FileSearch,
  Database,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  RefreshCw,
  Search,
  FileCheck
} from 'lucide-react';

interface DocumentVerificationPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const DocumentVerificationPage: React.FC<DocumentVerificationPageProps> = ({ onNavigate }) => {
  const [mockRegistry, setMockRegistry] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedScenario, setSelectedScenario] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [regRes, appRes] = await Promise.all([
        fetchMockIssuerRegistry(),
        fetchApplications({ limit: 12 })
      ]);
      if (regRes.success) setMockRegistry(regRes.records || []);
      if (appRes.success) setApplications(appRes.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
            Verification Subsystem
          </span>
          <span className="text-xs text-slate-400">&bull; Multi-Adapter Verification Architecture</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
          Document Authenticity & Issuer Verification Engine
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pluggable adapters for Digital Signatures (Class 3 DSC), State Issuer Registries (API Setu), QR code decoding, and cross-consistency verification.
        </p>
      </div>

      {/* Critical Statutory Limitation Notice Box */}
      <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-teal-400" />
          <span>Statutory Authenticity & Decision-Support Protocol</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Aurexa VerifyAI does not treat OCR text extraction, plausible layouts, or decoded QR strings alone as proof of document authenticity. Authentic verification requires cryptographic signature validation against the Controller of Certifying Authorities (CCA) trust chain or bilateral authoritative query to State Issuer registries (e.g. Fire Services, Revenue, Universities).
        </p>
      </div>

      {/* Five Verification Adapters Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <KeyRound className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">1. Digital Signatures</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Class 3 DSC token trust-chain validation against accredited Indian CAs (eMudhra, NSDL).
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">2. Authorized Issuers</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            API Setu / State Fire / University record matching against primary issuance database.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <QrCode className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">3. Trusted QR Codes</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Machine-readable 2D barcode payload extraction with simulated signature token checks.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <FileSearch className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">4. Cross-Consistency</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            PID, Institution name, sanctioned intake caps, and cut-off date validity analysis.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900">5. Manual Review Route</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Automated routing to human AICTE scrutiny officers when external sources are unavailable.
          </p>
        </div>
      </div>

      {/* Synthetic Issuer Registry Benchmark Scenarios Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Synthetic Issuer Authority Records (Mock Registry)</h3>
            <p className="text-[11px] text-slate-500">
              Simulates authoritative government databases for state fire services, universities, and public works
            </p>
          </div>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            DEMO / SIMULATED ADAPTERS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-4">Authority Type</th>
                <th className="py-2.5 px-4">Document Reference</th>
                <th className="py-2.5 px-4">Expected Institution</th>
                <th className="py-2.5 px-4">Valid Period</th>
                <th className="py-2.5 px-4">Registry Status</th>
                <th className="py-2.5 px-4">Verification Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockRegistry.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-800">{rec.issuer_type}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{rec.document_reference}</td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-medium block">{rec.expected_institution_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">PID: {rec.expected_institution_id}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {rec.expected_issue_date || 'N/A'} to {rec.expected_expiry_date || 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={rec.verification_status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                    {rec.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demonstration Scenarios Selector for Judges */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">SIH 2026 Evaluation Scenarios Quick Access</h3>
          <p className="text-[11px] text-slate-500">
            Click on any test scenario below to jump straight to its application review workspace:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              id: 'APP-2026-1001',
              title: 'Clean EOA Application',
              desc: '100% verified documents, Class 3 DSC, zero discrepancies.',
              badge: 'Exemplary'
            },
            {
              id: 'APP-2026-1002',
              title: 'Missing Mandatory Document',
              desc: 'New Institution Approval missing Affiliating University NOC.',
              badge: 'Checklist Gap'
            },
            {
              id: 'APP-2026-1003',
              title: 'Expired Fire Safety NOC',
              desc: 'Fire NOC lapsed on 31-Dec-2024; fails academic year cut-off.',
              badge: 'Expired Date'
            },
            {
              id: 'APP-2026-1004',
              title: 'Institutional PID Mismatch',
              desc: 'Building certificate cites old PID 1-9876543 vs active PID.',
              badge: 'ID Clash'
            },
            {
              id: 'APP-2026-1005',
              title: 'Intake Ceiling Violation',
              desc: 'Application requests 120 intake while university NOC sanctions 60.',
              badge: 'Cap Exceeded'
            },
            {
              id: 'APP-2026-1006',
              title: 'Duplicate SHA-256 Hash',
              desc: 'Identical file payload uploaded under Land Deed and Building Safety.',
              badge: 'Hash Clash'
            },
            {
              id: 'APP-2026-1007',
              title: 'Untrusted Digital Signature',
              desc: 'Self-signed certificate not anchored in CCA India trust store.',
              badge: 'Invalid DSC'
            },
            {
              id: 'APP-2026-1008',
              title: 'External Registry 503 Outage',
              desc: 'State Land Dharani API gateway returned 503 Service Unavailable.',
              badge: 'Retry Queued'
            },
            {
              id: 'APP-2026-1010',
              title: 'Infrastructure Geotag Discrepancy',
              desc: 'Computer Lab photo GPS coordinates deviate >150km from campus.',
              badge: 'Physical EVC'
            }
          ].map(sc => (
            <div
              key={sc.id}
              onClick={() => onNavigate('applications', sc.id)}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-teal-50/40 hover:border-teal-300 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-800">{sc.id}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                  {sc.badge}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs">{sc.title}</h4>
              <p className="text-[11px] text-slate-500 leading-tight">{sc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
