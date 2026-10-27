import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resetDemoDataset } from '../api';
import {
  Settings,
  RotateCcw,
  ShieldCheck,
  Server,
  KeyRound,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo data back to pristine SIH 2026 benchmark state? This will restore all 8 institutions and 12 scenario applications.')) {
      return;
    }

    setResetting(true);
    setResetSuccess(false);
    try {
      const res = await resetDemoDataset(user.name);
      if (res.success) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 5000);
      }
    } catch (err) {
      alert('Error resetting demo: ' + err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
            System Administration
          </span>
          <span className="text-xs text-slate-400">&bull; SIH 2026 Judging Configuration</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
          System Settings & Verification Adapters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure government integration endpoints, cryptographic trust stores, and manage demo evaluation states.
        </p>
      </div>

      {/* ONE-CLICK RESET DEMO DATASET (Judges feature) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>One-Click Demonstration Reset</span>
            </div>
            <h3 className="text-lg font-bold font-heading text-white">
              Reset SIH 2026 Demonstration Scenario
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Resets the underlying SQLite database back to the standard evaluation baseline containing all 8 institutions, 12 edge-case applications (missing docs, expired NOCs, PID clashes, duplicate hashes, untrusted DSCs, and clean cases).
            </p>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all shrink-0"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting DB...' : 'Reset Demo Dataset'}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-teal-500/20 border border-teal-500/40 rounded-xl text-xs text-teal-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Pristine evaluation dataset restored! All 12 benchmark applications and compliance rules are active.</span>
          </div>
        )}
      </div>

      {/* Verification Adapters Configuration (Pluggable Architecture) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Pluggable Verification Adapters (Gateway Status)</h3>
          <p className="text-xs text-slate-500">
            Interface abstraction layers connecting Aurexa VerifyAI to authoritative external government registers.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {/* Adapter 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Controller of Certifying Authorities (CCA) India Trust Adapter</p>
                <p className="text-[11px] text-slate-500">Class 3 Digital Signature Certificate (DSC) X.509 Chain Verification</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active (Simulated)
            </span>
          </div>

          {/* Adapter 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">National API Setu / DigiLocker Issuer Verification Adapter</p>
                <p className="text-[11px] text-slate-500">Bilateral query to State Fire Services & Technical University registers</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active (Simulated)
            </span>
          </div>

          {/* Adapter 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">State Land Revenue (Dharani / Bhulekh) Cadastral Gateway</p>
                <p className="text-[11px] text-slate-500">Land Title Deed & Lease Agreement Verification Gateway</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Retry Mode (503 Fallback)
            </span>
          </div>
        </div>
      </div>

      {/* Security & System Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
        <h3 className="text-base font-bold text-slate-900">System Security Safeguards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">&bull; Role-Based Access Control (RBAC)</span>
            <p className="text-[11px]">Enforces strict route permissions for Applicant, Reviewer, and Admin roles.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">&bull; Cryptographic Payload Integrity</span>
            <p className="text-[11px]">All uploaded documents compute SHA-256 hashes to prevent file alterations.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">&bull; Synthetic Institutional Data</span>
            <p className="text-[11px]">Contains zero real citizen Aadhaar, PAN, or confidential institutional secrets.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">&bull; SQLite WAL Mode & Transactions</span>
            <p className="text-[11px]">Atomic database transactions ensure crash resilience and data consistency.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
