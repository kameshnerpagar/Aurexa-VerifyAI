import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchApplicationDetail,
  runFullVerification,
  recordFindingDisposition,
  executeReviewerAction,
  updateExtraction,
  uploadDocument
} from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  FileText,
  Building,
  ShieldCheck,
  Cpu,
  Building2,
  History,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Edit3,
  FileCheck,
  Send,
  ExternalLink,
  Info,
  Calendar,
  UserCheck,
  Download,
  AlertCircle,
  Clock,
  Layers,
  MapPin,
  Check,
  X
} from 'lucide-react';

interface ApplicationDetailPageProps {
  applicationId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ApplicationDetailPage: React.FC<ApplicationDetailPageProps> = ({
  applicationId,
  onNavigate
}) => {
  const { user, role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [runningValidation, setRunningValidation] = useState<boolean>(false);

  // Modals state
  const [dismissModalOpen, setDismissModalOpen] = useState<boolean>(false);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [dismissReason, setDismissReason] = useState<string>('');

  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);
  const [selectedExtraction, setSelectedExtraction] = useState<any>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [ocrCorrectedValue, setOcrCorrectedValue] = useState<string>('');
  const [ocrOverrideReason, setOcrOverrideReason] = useState<string>('');

  const [actionModalOpen, setActionModalOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');

  const [uploadDocModalOpen, setUploadDocModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState<string>('Fire Safety NOC');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApplicationDetail(applicationId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [applicationId]);

  const handleRunFullValidation = async () => {
    setRunningValidation(true);
    try {
      await runFullVerification(applicationId, user.name);
      await loadData();
    } catch (err) {
      alert('Error running validation: ' + err);
    } finally {
      setRunningValidation(false);
    }
  };

  const handleConfirmDiscrepancy = async (findingId: string) => {
    await recordFindingDisposition(findingId, 'Confirmed Discrepancy', 'Verified against primary evidence', user.name);
    loadData();
  };

  const handleOpenDismissModal = (finding: any) => {
    setSelectedFinding(finding);
    setDismissReason('');
    setDismissModalOpen(true);
  };

  const handleSubmitDismiss = async () => {
    if (!dismissReason || dismissReason.trim().length < 5) {
      alert('Mandatory reason required (minimum 5 characters)');
      return;
    }
    await recordFindingDisposition(selectedFinding.id, 'Dismissed False Positive', dismissReason, user.name);
    setDismissModalOpen(false);
    loadData();
  };

  const handleOpenOcrCorrection = (ext: any, docId: string) => {
    setSelectedExtraction(ext);
    setSelectedDocId(docId);
    setOcrCorrectedValue(ext.current_value);
    setOcrOverrideReason('');
    setOcrModalOpen(true);
  };

  const handleSubmitOcrCorrection = async () => {
    if (!ocrCorrectedValue || !ocrOverrideReason) {
      alert('Both corrected value and justification are required');
      return;
    }
    await updateExtraction(selectedDocId, selectedExtraction.id, ocrCorrectedValue, ocrOverrideReason, user.name);
    setOcrModalOpen(false);
    loadData();
  };

  const handleOpenActionModal = (type: string) => {
    setActionType(type);
    setActionNotes('');
    setActionModalOpen(true);
  };

  const handleSubmitAction = async () => {
    await executeReviewerAction(applicationId, actionType, {
      notes: actionNotes,
      reviewer_id: user.id,
      reviewer_name: user.name,
      actor_name: user.name,
      actor_role: user.role
    });
    setActionModalOpen(false);
    loadData();
  };

  const handleUploadNewDocument = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('application_id', applicationId);
    formData.append('document_type', uploadDocType);
    formData.append('actor_name', user.name);
    formData.append('actor_role', user.role);

    await uploadDocument(formData);
    setUploadDocModalOpen(false);
    setUploadFile(null);
    loadData();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Application Review Workspace...</p>
        </div>
      </div>
    );
  }

  const { application, details, documents, findings, evaluations, infrastructure, auditTrail, riskBreakdown } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'info', label: 'Application Info', icon: Building },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'cross-checks', label: `Cross-Document Checks (${findings.length})`, icon: AlertTriangle, badge: findings.length },
    { id: 'compliance', label: 'Compliance (8 Rules)', icon: Cpu },
    { id: 'infrastructure', label: `Infrastructure (${infrastructure.length})`, icon: Building2 },
    { id: 'audit', label: `Activity & Audit (${auditTrail.length})`, icon: History }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {application.id}
              </span>
              <StatusBadge status={application.overall_status} size="sm" />
              <span className="text-xs text-slate-400">&bull; {application.academic_year} &bull; {application.category}</span>
            </div>

            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
              {application.institution_name}
            </h1>
            <p className="text-xs text-slate-500">
              PID: <span className="font-mono font-semibold text-slate-700">{application.current_pid || 'Pending'}</span> &bull; {application.state}, {application.district}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunFullValidation}
              disabled={runningValidation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${runningValidation ? 'animate-spin' : ''}`} />
              <span>{runningValidation ? 'Validating...' : 'Re-Run Verification Engine'}</span>
            </button>

            <button
              onClick={() => onNavigate('reports', applicationId)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate Dossier Report</span>
            </button>

            {/* Reviewer Action Buttons */}
            {role !== 'applicant' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenActionModal('REQUEST_EVIDENCE')}
                  className="px-2.5 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
                >
                  Request Evidence
                </button>

                <button
                  onClick={() => handleOpenActionModal('RETURN_FOR_CORRECTION')}
                  className="px-2.5 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold transition-colors"
                >
                  Return for Correction
                </button>

                <button
                  onClick={() => handleOpenActionModal('RECOMMEND_INSPECTION')}
                  className="px-2.5 py-2 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold transition-colors"
                >
                  Recommend Inspection
                </button>

                <button
                  onClick={() => handleOpenActionModal('MARK_READY_FOR_DECISION')}
                  className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                >
                  Mark Ready for Official Review
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-t border-slate-100 pt-3 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-teal-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Risk Prioritization & Explainability (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scrutiny Prioritization</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Explainable Risk Score</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-3xl font-extrabold font-heading text-slate-900">
                  {riskBreakdown.score}<span className="text-sm font-normal text-slate-400"> / 100</span>
                </p>
                <span className="text-xs font-bold text-slate-600 mt-0.5 block">
                  Priority Band: <StatusBadge status={riskBreakdown.level} size="sm" />
                </span>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center relative">
                <span className={`font-mono font-bold text-sm ${riskBreakdown.score >= 70 ? 'text-rose-600' : riskBreakdown.score >= 40 ? 'text-amber-600' : 'text-teal-600'}`}>
                  {riskBreakdown.score}%
                </span>
              </div>
            </div>

            {/* Contributing factors breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Contributing Heuristic Factors:</p>
              {riskBreakdown.factors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No adverse risk factors identified. Fully compliant.</p>
              ) : (
                riskBreakdown.factors.map((f: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{f.category}</span>
                      <span className={`font-mono font-bold text-[11px] ${f.points > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {f.points > 0 ? `+${f.points}` : f.points} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{f.description}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 leading-relaxed border border-slate-200">
              <span className="font-bold text-slate-700 block mb-0.5">Regulatory Decision Support Notice:</span>
              {riskBreakdown.disclaimer}
            </div>
          </div>

          {/* Right Column: Key Metrics & Findings Summary (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3 Metric Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Documents Verified</span>
                <p className="text-xl font-bold font-heading text-slate-900 mt-1">
                  {documents.filter((d: any) => d.status === 'Verified').length} / {documents.length}
                </p>
                <span className="text-[11px] text-teal-600 font-medium">Digital signatures checked</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Active Discrepancies</span>
                <p className="text-xl font-bold font-heading text-rose-600 mt-1">{findings.length}</p>
                <span className="text-[11px] text-rose-500 font-medium">
                  {findings.filter((f: any) => f.severity === 'Critical').length} Critical severity
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Compliance Evaluation</span>
                <p className="text-xl font-bold font-heading text-slate-900 mt-1">
                  {evaluations.filter((e: any) => e.status === 'Passed').length} / 8 Passed
                </p>
                <span className="text-[11px] text-slate-500 font-medium">{application.compliance_status}</span>
              </div>
            </div>

            {/* Unresolved Discrepancies Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Unresolved Cross-Document Discrepancies</h3>
                  <p className="text-[11px] text-slate-500">Automated findings comparing application entries and primary source evidence</p>
                </div>
                <button
                  onClick={() => setActiveTab('cross-checks')}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  Manage All &rarr;
                </button>
              </div>

              {findings.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">Zero Cross-Document Inconsistencies Detected</p>
                  <p className="text-[11px] text-slate-400">All names, PIDs, dates, hashes, and intakes align consistently.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {findings.slice(0, 3).map((f: any) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={f.severity} size="sm" />
                          <span className="font-bold text-slate-900">{f.finding_type}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({f.finding_code})</span>
                        </div>
                        <StatusBadge status={f.reviewer_disposition} size="sm" />
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">{f.explanation}</p>

                      <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded border border-slate-200 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Observed Value:</span>
                          <span className="font-semibold text-rose-700 font-mono">{f.observed_value}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Expected / Comparison Source:</span>
                          <span className="font-semibold text-slate-800 font-mono">{f.expected_value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions / Internal Notes */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Reviewer Notes & Directives</h3>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                {details?.additional_notes || 'No preliminary notes recorded yet by assigned reviewer.'}
              </p>
              {role !== 'applicant' && (
                <button
                  onClick={() => handleOpenActionModal('ADD_NOTE')}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Internal Regulatory Note</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATION INFO */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Institutional Profile & Filing Scope</h2>
            <p className="text-xs text-slate-500">Record data submitted in Step 1 and 2 of approval wizard.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Campus Information</h3>
              <div><span className="text-slate-400">Legal Name:</span> <span className="font-semibold text-slate-800 block">{application.institution_name}</span></div>
              <div><span className="text-slate-400">Current AICTE PID:</span> <span className="font-mono font-bold text-slate-800 block">{application.current_pid}</span></div>
              <div><span className="text-slate-400">Institution Type:</span> <span className="font-semibold text-slate-800 block">{application.institution_type}</span></div>
              <div><span className="text-slate-400">Address:</span> <span className="text-slate-700 block">{application.address}, {application.district}, {application.state} - {application.pin_code}</span></div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Approval Scope</h3>
              <div><span className="text-slate-400">Approval Category:</span> <span className="font-semibold text-slate-800 block">{application.category}</span></div>
              <div><span className="text-slate-400">Academic Year:</span> <span className="font-semibold text-slate-800 block">{application.academic_year}</span></div>
              <div><span className="text-slate-400">Previous Approval Order:</span> <span className="font-mono text-slate-700 block">{details?.previous_approval_ref || 'N/A'}</span></div>
              <div><span className="text-slate-400">Submission Date:</span> <span className="text-slate-700 block">{application.submission_date || 'Draft'}</span></div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Infrastructure Norms Claimed</h3>
              <div><span className="text-slate-400">Contiguous Land Area:</span> <span className="font-bold text-slate-800 block">{details?.land_area_acres || 0} Acres</span></div>
              <div><span className="text-slate-400">Total Built-Up Area:</span> <span className="font-bold text-slate-800 block">{details?.built_up_area_sqm || 0} Sq. Meters</span></div>
              <div><span className="text-slate-400">Principal / Director:</span> <span className="font-semibold text-slate-800 block">{details?.principal_name || 'Dr. S. K. Patil'}</span></div>
              <div><span className="text-slate-400">Institutional Contact:</span> <span className="text-slate-700 block">{application.institution_email} &bull; {application.institution_phone}</span></div>
            </div>
          </div>

          {/* Programmes & Proposed Intake Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Requested Degree / Diploma Programmes</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Programme / Course Name</th>
                    <th className="py-2.5 px-4">Statutory Affiliating Authority</th>
                    <th className="py-2.5 px-4 text-right">Proposed Intake</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(details?.programmes || []).map((prog: string, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{prog}</td>
                      <td className="py-2.5 px-4 text-slate-600">State Technical University</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-700">Sanction Enclosed</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS & OCR EXTRACTIONS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Document Analysis & Primary Evidence Repository</h2>
              <p className="text-xs text-slate-500">
                Uploaded files with cryptographic SHA-256 integrity, OCR extractions, confidence scores, and reviewer corrections.
              </p>
            </div>

            <button
              onClick={() => setUploadDocModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              <span>Upload Additional Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {documents.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Doc Header */}
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{doc.document_type}</span>
                        <StatusBadge status={doc.status} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        File: <span className="font-mono text-slate-700">{doc.file_name}</span> &bull; Size: {(doc.file_size / 1024).toFixed(1)} KB &bull; Uploaded: {doc.upload_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 truncate max-w-[200px]">
                        SHA-256: {doc.file_hash_sha256}
                      </span>
                    </div>
                  </div>

                  {/* Verification Records for this doc */}
                  {doc.verification_records && doc.verification_records.length > 0 && (
                    <div className="px-5 py-3 bg-slate-50/30 border-b border-slate-100 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Pluggable Verification Adapters Outcome:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {doc.verification_records.map((vr: any) => (
                          <div key={vr.id} className="p-2.5 rounded bg-white border border-slate-200 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{vr.verification_method}</span>
                              <StatusBadge status={vr.result} size="sm" />
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">Authority: {vr.source_authority}</p>
                            {vr.details && vr.details.remarks && (
                              <p className="text-[10px] text-slate-600 italic">{vr.details.remarks}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Fields Table */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Extracted Data Points & Confidence
                      </h4>
                      <span className="text-[11px] text-slate-400">Reviewers can correct OCR misreads with mandatory reason</span>
                    </div>

                    {(!doc.extractions || doc.extractions.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No structured fields extracted from this document.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                              <th className="py-2 px-3">Field Name</th>
                              <th className="py-2 px-3">Extracted / Current Value</th>
                              <th className="py-2 px-3">Confidence</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {doc.extractions.map((ext: any) => (
                              <tr key={ext.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-mono font-medium text-slate-700 capitalize">
                                  {ext.field_name.replace(/_/g, ' ')}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                                  {ext.current_value}
                                  {ext.is_overridden === 1 && (
                                    <span className="block text-[10px] text-amber-600 font-normal italic">
                                      Overridden by {ext.overridden_by} (Original: {ext.original_value})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <span className="font-mono text-teal-700 font-bold">
                                    {(ext.confidence_score * 100).toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  {ext.is_overridden === 1 ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      Corrected
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                      Raw OCR
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {role !== 'applicant' && (
                                    <button
                                      onClick={() => handleOpenOcrCorrection(ext, doc.id)}
                                      className="text-teal-600 hover:text-teal-700 font-semibold text-[11px]"
                                    >
                                      Edit / Correct &rarr;
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* OCR Text preview excerpt */}
                    {doc.extracted_text && (
                      <div className="pt-2">
                        <details className="text-xs group">
                          <summary className="cursor-pointer text-slate-500 font-semibold group-hover:text-slate-800 transition-colors">
                            View Raw OCR Text Excerpt ({doc.extracted_text.length} characters)
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {doc.extracted_text}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CROSS-DOCUMENT CHECKS */}
      {activeTab === 'cross-checks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cross-Document Consistency Analysis</h2>
              <p className="text-xs text-slate-500">
                Automated multi-way cross-comparison identifying name mismatches, PID conflicts, expired dates, and duplicated payloads.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {findings.length} Discrepanc{findings.length === 1 ? 'y' : 'ies'} Found
            </span>
          </div>

          {findings.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-xl border border-slate-200">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Complete Cross-Document Consistency Verified</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No conflicts detected across institutional name, PID, course intake caps, certificate validities, or SHA-256 hashes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map((f: any) => (
                <div
                  key={f.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={f.severity} size="sm" />
                      <h4 className="font-bold text-slate-900 text-sm">{f.finding_type}</h4>
                      <span className="font-mono text-slate-400 text-[11px]">[{f.finding_code}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Disposition:</span>
                      <StatusBadge status={f.reviewer_disposition} size="sm" />
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-xs">{f.explanation}</p>

                  {/* Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Source / Observed Value</span>
                      <p className="font-semibold text-rose-800 font-mono mt-0.5">{f.observed_value}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Source Document: {f.source_doc_name || 'Application Form'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Expected / Benchmark Source</span>
                      <p className="font-semibold text-slate-800 font-mono mt-0.5">{f.expected_value}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Benchmark: {f.target_doc_name || 'AICTE Institutional Master Record'}
                      </span>
                    </div>
                  </div>

                  {f.recommended_action && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded text-amber-900 text-[11px]">
                      <span className="font-bold">Recommended Regulatory Action: </span>
                      {f.recommended_action}
                    </div>
                  )}

                  {f.disposition_reason && (
                    <div className="p-2.5 bg-slate-100 rounded text-slate-700 text-[11px]">
                      <span className="font-bold">Reviewer Disposition Justification: </span>
                      {f.disposition_reason} (By: {f.disposition_by || 'Reviewer'})
                    </div>
                  )}

                  {/* Action buttons for reviewer */}
                  {role !== 'applicant' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleConfirmDiscrepancy(f.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                      >
                        Confirm Discrepancy
                      </button>

                      <button
                        onClick={() => handleOpenDismissModal(f)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                      >
                        Dismiss as False Positive (Mandatory Reason)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPLIANCE ENGINE EVALUATION */}
      {activeTab === 'compliance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Regulatory Compliance Engine Evaluation</h2>
              <p className="text-xs text-slate-500">
                Evaluation results against AICTE Approval Process Handbook (APH 2026-27) statutory norms.
              </p>
            </div>
            <StatusBadge status={application.compliance_status} size="sm" />
          </div>

          <div className="space-y-4">
            {evaluations.map((ev: any) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ev.status} size="sm" />
                    <span className="font-mono text-slate-400 font-bold">[{ev.rule_code}]</span>
                    <h4 className="font-bold text-slate-900 text-sm">{ev.rule_name}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Handbook: {ev.aicte_handbook_ref || 'Chapter I'}
                  </span>
                </div>

                <p className="text-slate-600 text-xs">{ev.explanation}</p>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-700">Evidence Observed: </span>
                  <span className="text-slate-800 font-mono">{ev.evidence_found}</span>
                </div>

                {ev.corrective_action && ev.corrective_action !== 'None required.' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[11px]">
                    <span className="font-bold">Mandated Corrective Action: </span>
                    {ev.corrective_action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: INFRASTRUCTURE EVIDENCE */}
      {activeTab === 'infrastructure' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Physical Infrastructure & Geotag Review</h2>
              <p className="text-xs text-slate-500">
                Photographic and spatial evidence of classrooms, computing laboratories, workshop equipment, and campus perimeter.
              </p>
            </div>
            <button
              onClick={() => onNavigate('infrastructure-review')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Full Campus Gallery &rarr;
            </button>
          </div>

          {infrastructure.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No infrastructure evidence uploaded for this application.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {infrastructure.map((inf: any) => (
                <div key={inf.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
                  <div className="relative h-44 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={inf.file_path}
                      alt={inf.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={inf.review_status} size="sm" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">{inf.category}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{inf.title}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{inf.geo_location_name}</span>
                    </p>
                  </div>

                  {/* Detected infrastructure elements */}
                  {inf.detected_elements && inf.detected_elements.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Elements Detected:</span>
                      <div className="flex flex-wrap gap-1">
                        {inf.detected_elements.map((el: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {el}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {inf.reviewer_notes && (
                    <p className="text-[11px] text-slate-600 p-2 bg-slate-50 rounded border border-slate-100 italic">
                      &ldquo;{inf.reviewer_notes}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ACTIVITY & AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Immutable Audit Trail for {application.id}</h2>
              <p className="text-xs text-slate-500">Every submission, upload, OCR modification, disposition, and status change is tamper-evidently recorded.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Append-Only Event Store</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditTrail.map((ev: any) => (
              <div key={ev.id} className="py-3 text-xs flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {ev.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">&bull; Actor:</span>
                    <span className="font-semibold text-slate-700">{ev.actor_name} ({ev.actor_role})</span>
                  </div>

                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded max-w-2xl overflow-x-auto">
                      {JSON.stringify(ev.details, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-slate-400 text-[11px] block">{ev.timestamp}</span>
                  <span className="text-[10px] text-slate-400 font-mono">IP: {ev.ip_address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Dismiss False Positive (Mandatory Reason) */}
      <Modal
        isOpen={dismissModalOpen}
        onClose={() => setDismissModalOpen(false)}
        title="Dismiss Finding as False Positive"
        subtitle={`Mandatory regulatory justification required under AICTE scrutiny protocol.`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
            <p className="font-semibold">{selectedFinding?.finding_type}</p>
            <p className="text-[11px] mt-0.5 text-amber-800">{selectedFinding?.explanation}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Reviewer Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={dismissReason}
              onChange={e => setDismissReason(e.target.value)}
              placeholder="e.g. Verified with State Directorate: Old PID was renumbered during state municipal reorganization under Gazette Notification 2024..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setDismissModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitDismiss}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              Confirm Dismissal
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Correct OCR Mistake */}
      <Modal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        title="Correct Extracted Field Value"
        subtitle="Original extraction will remain preserved in audit history."
      >
        <div className="space-y-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Field Name</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedExtraction?.field_name}</p>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Original OCR Extracted Value</span>
            <p className="font-mono text-slate-500 bg-slate-100 p-2 rounded mt-0.5">{selectedExtraction?.original_value}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrected Value <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={ocrCorrectedValue}
              onChange={e => setOcrCorrectedValue(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correction Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={ocrOverrideReason}
              onChange={e => setOcrOverrideReason(e.target.value)}
              placeholder="e.g. Scanned stamp obscured character '5' as '6'; confirmed via certificate seal."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setOcrModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitOcrCorrection}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              Save Correction & Re-evaluate
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Reviewer Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={
          actionType === 'REQUEST_EVIDENCE'
            ? 'Request Additional Institutional Evidence'
            : actionType === 'RETURN_FOR_CORRECTION'
            ? 'Return Application for Institutional Correction'
            : actionType === 'RECOMMEND_INSPECTION'
            ? 'Recommend Physical Campus Inspection'
            : actionType === 'MARK_READY_FOR_DECISION'
            ? 'Mark Ready for Official Regional Committee Decision'
            : 'Add Internal Regulatory Note'
        }
        subtitle={`Action will be recorded under ${user.name} (${user.role}).`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {actionType === 'MARK_READY_FOR_DECISION' ? 'Final Scrutiny Observation' : 'Specific Notes / Deficiencies Instructions'}
            </label>
            <textarea
              rows={4}
              value={actionNotes}
              onChange={e => setActionNotes(e.target.value)}
              placeholder="Provide clear statutory instructions or scrutiny comments..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActionModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitAction}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              Execute Action
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Upload Supporting Document */}
      <Modal
        isOpen={uploadDocModalOpen}
        onClose={() => setUploadDocModalOpen(false)}
        title="Upload Supporting Document"
        subtitle="File will be instantly SHA-256 hashed, OCR extracted, and re-evaluated."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
            <select
              value={uploadDocType}
              onChange={e => setUploadDocType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="Fire Safety NOC">Fire Safety NOC</option>
              <option value="Building Safety Certificate">Building Safety Certificate</option>
              <option value="Affiliating University NOC">Affiliating University NOC</option>
              <option value="AICTE Previous Approval Order">AICTE Previous Approval Order</option>
              <option value="Land Ownership / Lease Deed">Land Ownership / Lease Deed</option>
              <option value="Audited Financial Statement">Audited Financial Statement</option>
              <option value="Faculty Compliance List">Faculty Compliance List</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">File (PDF, PNG, JPG)</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setUploadDocModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadNewDocument}
              disabled={!uploadFile}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold"
            >
              Upload & Scan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
