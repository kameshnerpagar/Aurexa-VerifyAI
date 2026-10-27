import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createApplication, uploadDocument } from '../api';
import {
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  FileCheck,
  Check,
  Sparkles,
  Info
} from 'lucide-react';

interface NewApplicationWizardProps {
  onNavigate: (view: string, id?: string) => void;
}

export const NewApplicationWizard: React.FC<NewApplicationWizardProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 1: Institution Details
  const [institutionName, setInstitutionName] = useState<string>(
    user.institution_name || 'Shree Chhatrapati Shivaji Institute of Technology'
  );
  const [currentPid, setCurrentPid] = useState<string>(user.current_pid || '1-490219834');
  const [institutionType, setInstitutionType] = useState<string>('Engineering & Technology');
  const [state, setState] = useState<string>('Maharashtra');
  const [district, setDistrict] = useState<string>('Pune');
  const [address, setAddress] = useState<string>('Survey No. 88, Baner-Pashan Link Road, Pune');
  const [pinCode, setPinCode] = useState<string>('411045');
  const [academicYear, setAcademicYear] = useState<string>('2026-27');
  const [contactPerson, setContactPerson] = useState<string>(user.name || 'Dr. Dilip Joshi');
  const [contactEmail, setContactEmail] = useState<string>(user.email || 'registrar@scsit.edu.in');
  const [contactPhone, setContactPhone] = useState<string>('+91 98220 44556');
  const [establishedYear, setEstablishedYear] = useState<string>('2014');

  // Step 2: Application Details
  const [category, setCategory] = useState<string>('Extension of Approval (EOA)');
  const [programmes, setProgrammes] = useState<string>('Computer Engineering (120), Information Technology (60), Artificial Intelligence (60)');
  const [proposedIntake, setProposedIntake] = useState<string>('240');
  const [previousApprovalRef, setPreviousApprovalRef] = useState<string>('F.No. Western/1-490219834/2025/EOA');
  const [landArea, setLandArea] = useState<string>('7.5');
  const [builtUpArea, setBuiltUpArea] = useState<string>('16800');
  const [principalName, setPrincipalName] = useState<string>('Dr. S. K. Patil');
  const [additionalNotes, setAdditionalNotes] = useState<string>('Application submitted for routine Extension of Approval for AY 2026-27.');

  // Step 3: Supporting Documents
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ file: File; docType: string; id: string; size: number }>
  >([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('AICTE Previous Approval Order');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Category-based mandatory document checklist
  const getRequiredDocTypes = (cat: string) => {
    switch (cat) {
      case 'New Institution Approval':
        return ['Land Ownership / Lease Deed', 'Building Safety Certificate', 'Fire Safety NOC', 'Affiliating University NOC'];
      case 'Increase in Intake / Additional Course':
        return ['AICTE Previous Approval Order', 'Affiliating University NOC'];
      case 'Change in Site / Campus':
        return ['Land Ownership / Lease Deed', 'Building Safety Certificate', 'Fire Safety NOC'];
      case 'Extension of Approval (EOA)':
      default:
        return ['AICTE Previous Approval Order', 'Fire Safety NOC'];
    }
  };

  const requiredDocTypes = getRequiredDocTypes(category);

  const handleAddFile = () => {
    if (!fileToUpload) return;
    setUploadedFiles(prev => [
      ...prev,
      {
        file: fileToUpload,
        docType: selectedDocType,
        id: `local-file-${Date.now()}`,
        size: fileToUpload.size
      }
    ]);
    setFileToUpload(null);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadedDocTypes = new Set(uploadedFiles.map(f => f.docType));
  const missingCount = requiredDocTypes.filter(t => !uploadedDocTypes.has(t)).length;

  const handleSubmit = async (isDraft: boolean) => {
    setSubmitting(true);
    try {
      // 1. Create Application
      const appPayload = {
        institution_name: institutionName,
        current_pid: currentPid,
        institution_type: institutionType,
        state,
        district,
        address,
        pin_code: pinCode,
        academic_year: academicYear,
        contact_person: contactPerson,
        email: contactEmail,
        phone: contactPhone,
        established_year: establishedYear,
        category,
        programmes: programmes.split(',').map(s => s.trim()),
        proposed_intake: { Total: parseInt(proposedIntake) || 0 },
        previous_approval_ref: previousApprovalRef,
        land_area_acres: parseFloat(landArea) || 0,
        built_up_area_sqm: parseFloat(builtUpArea) || 0,
        principal_name: principalName,
        additional_notes: additionalNotes,
        is_draft: isDraft,
        actor_name: user.name,
        actor_role: user.role
      };

      const res = await createApplication(appPayload);
      if (res.success && res.applicationId) {
        const newAppId = res.applicationId;

        // 2. Upload any staged documents
        for (const item of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('application_id', newAppId);
          formData.append('document_type', item.docType);
          formData.append('actor_name', user.name);
          formData.append('actor_role', user.role);

          await uploadDocument(formData);
        }

        // Navigate directly to Application Review Workspace
        onNavigate('applications', newAppId);
      }
    } catch (err) {
      console.error('[Application Submission Error]', err);
      alert('Error creating application: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
            AICTE Approval Process 2026-27
          </span>
          <span className="text-xs text-slate-400">&bull; Multi-Step Application Wizard</span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
          New Institutional Approval Filing
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit regulatory approval requests under AICTE Regulations. All data is verified automatically upon submission.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Institution Details', icon: Building2 },
            { step: 2, label: 'Application Details', icon: FileText },
            { step: 3, label: 'Supporting Documents', icon: UploadCloud },
            { step: 4, label: 'Review & Submit', icon: CheckCircle2 }
          ].map(s => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <div key={s.step} className="flex-1 flex flex-col items-center relative">
                <button
                  onClick={() => setCurrentStep(s.step)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'ring-4 ring-teal-500/20 bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.step}
                </button>
                <span
                  className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                    isCurrent ? 'text-slate-900 font-bold' : isCompleted ? 'text-teal-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* STEP 1: Institution Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 1: Institutional Identification</h2>
              <p className="text-xs text-slate-500">Provide legal institutional identity as registered in state gazette & AICTE.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permanent Institute ID (PID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentPid}
                  onChange={e => setCurrentPid(e.target.value)}
                  placeholder="e.g. 1-490219834"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={institutionType}
                  onChange={e => setInstitutionType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Engineering & Technology">Engineering & Technology</option>
                  <option value="Management">Management (MBA / PGDM)</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Polytechnic">Polytechnic (Diploma)</option>
                  <option value="Architecture & Planning">Architecture & Planning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pin Code</label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Application Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 2: Regulatory Category & Programme Norms</h2>
              <p className="text-xs text-slate-500">Specify requested approval scope, proposed intake, and previous references.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Application Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Extension of Approval (EOA)">Extension of Approval (EOA)</option>
                  <option value="New Institution Approval">New Institution Approval</option>
                  <option value="Increase in Intake / Additional Course">Increase in Intake / Additional Course</option>
                  <option value="Change in Site / Campus">Change in Site / Campus</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Courses / Programmes (Comma-separated)
                </label>
                <input
                  type="text"
                  value={programmes}
                  onChange={e => setProgrammes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Total Intake (Seats)</label>
                <input
                  type="number"
                  value={proposedIntake}
                  onChange={e => setProposedIntake(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Previous AICTE Approval Reference</label>
                <input
                  type="text"
                  value={previousApprovalRef}
                  onChange={e => setPreviousApprovalRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contiguous Land Area (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  value={landArea}
                  onChange={e => setLandArea(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Built-Up Area (Sq. Meters)</label>
                <input
                  type="number"
                  value={builtUpArea}
                  onChange={e => setBuiltUpArea(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Principal / Director Name</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={e => setPrincipalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Supporting Documents */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 3: Document Uploads & Checklist</h2>
                <p className="text-xs text-slate-500">Upload authentic statutory certificates. Files are OCR scanned and cross-compared.</p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  missingCount === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {missingCount === 0 ? 'All Mandatory Uploaded' : `${missingCount} Mandatory Pending`}
              </span>
            </div>

            {/* Checklist guide */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mandatory Checklist for: {category}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {requiredDocTypes.map(docType => {
                  const isPresent = uploadedDocTypes.has(docType);
                  return (
                    <div
                      key={docType}
                      className={`flex items-center gap-2 p-2 rounded border ${
                        isPresent ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {isPresent ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                      <span className="font-medium truncate">{docType}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload form */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Document Category</label>
                  <select
                    value={selectedDocType}
                    onChange={e => setSelectedDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="AICTE Previous Approval Order">AICTE Previous Approval Order</option>
                    <option value="Fire Safety NOC">Fire Safety NOC</option>
                    <option value="Building Safety Certificate">Building Safety Certificate</option>
                    <option value="Affiliating University NOC">Affiliating University NOC</option>
                    <option value="Land Ownership / Lease Deed">Land Ownership / Lease Deed</option>
                    <option value="Audited Financial Statement">Audited Financial Statement</option>
                    <option value="Faculty Compliance List">Faculty Compliance List</option>
                    <option value="Laboratory Equipment Inventory">Laboratory Equipment Inventory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Choose File (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddFile}
                  disabled={!fileToUpload}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  Attach Document
                </button>
              </div>
            </div>

            {/* Uploaded Files Table */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Attached Documents ({uploadedFiles.length})</p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {uploadedFiles.map((item, index) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-4 h-4 text-teal-600" />
                        <div>
                          <p className="font-semibold text-slate-800">{item.file.name}</p>
                          <span className="text-[10px] text-slate-400">
                            Category: {item.docType} &bull; {(item.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review and Submit */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 4: Submission Verification & Audit Check</h2>
              <p className="text-xs text-slate-500">Review application summary before submitting to AICTE Preliminary Scrutiny pipeline.</p>
            </div>

            {/* Checklist Warning Banner if Missing Docs */}
            {missingCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Mandatory Documents Pending</p>
                  <p className="text-[11px] mt-0.5">
                    {missingCount} required document(s) have not been attached. You may save as a Draft or proceed with submission; AICTE validation will flag deficiencies.
                  </p>
                </div>
              </div>
            )}

            {/* Data Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution Name</span>
                <p className="font-semibold text-slate-800 mt-0.5">{institutionName}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">PID / State</span>
                <p className="font-semibold text-slate-800 mt-0.5">{currentPid} &bull; {state}, {district}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Application Category</span>
                <p className="font-semibold text-slate-800 mt-0.5">{category}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposed Intake / Academic Year</span>
                <p className="font-semibold text-slate-800 mt-0.5">{proposedIntake} Seats &bull; AY {academicYear}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested Programmes</span>
                <p className="font-semibold text-slate-800 mt-0.5">{programmes}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Land & Built-up Area</span>
                <p className="font-semibold text-slate-800 mt-0.5">{landArea} Acres &bull; {builtUpArea} Sq.m</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Documents Attached</span>
                <p className="font-semibold text-slate-800 mt-0.5">{uploadedFiles.length} file(s) staged</p>
              </div>
            </div>

            {/* Digital Signature Confirmation checkbox */}
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-600 leading-relaxed">
                  I hereby declare under AICTE Approval Regulations that all furnished information is truthful and supported by authentic institutional records. Electronic submission will be timestamped and logged in the immutable audit registry.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-900/10 transition-all"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Submit to Scrutiny Pipeline</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
