import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchComplianceRules,
  toggleComplianceRule,
  createComplianceRule,
  updateComplianceRule
} from '../api';
import { ComplianceRule } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Cpu,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const ComplianceEnginePage: React.FC = () => {
  const { user, role } = useAuth();
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');

  // Form fields
  const [ruleCode, setRuleCode] = useState<string>('');
  const [ruleName, setRuleName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [applicableCategories, setApplicableCategories] = useState<string[]>([
    'Extension of Approval (EOA)',
    'New Institution Approval'
  ]);
  const [requirementType, setRequirementType] = useState<string>('Document Mandatory');
  const [severity, setSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Critical');
  const [handbookRef, setHandbookRef] = useState<string>('Chapter I, Section 1.4');

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await fetchComplianceRules();
      if (res.success) {
        setRules(res.rules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (ruleId: string) => {
    if (role !== 'admin') {
      alert('Only administrators can enable or disable statutory compliance rules.');
      return;
    }
    await toggleComplianceRule(ruleId, user.name);
    loadRules();
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setRuleCode(`AICTE-RULE-CUSTOM-0${rules.length + 1}`);
    setRuleName('');
    setDescription('');
    setRequirementType('Document Mandatory');
    setSeverity('Major');
    setHandbookRef('Approval Process Handbook 2026-27, Appendix 6');
    setModalOpen(true);
  };

  const handleOpenEditModal = (rule: ComplianceRule) => {
    setIsEditing(true);
    setSelectedRuleId(rule.id);
    setRuleCode(rule.rule_code);
    setRuleName(rule.name);
    setDescription(rule.description);
    setApplicableCategories(rule.applicable_categories || []);
    setRequirementType(rule.requirement_type);
    setSeverity(rule.severity);
    setHandbookRef(rule.aicte_handbook_ref || '');
    setModalOpen(true);
  };

  const handleSubmitRule = async () => {
    if (!ruleName || !ruleCode) {
      alert('Rule Code and Name are required');
      return;
    }

    if (isEditing) {
      await updateComplianceRule(selectedRuleId, {
        name: ruleName,
        description,
        applicable_categories: applicableCategories,
        requirement_type: requirementType,
        severity,
        aicte_handbook_ref: handbookRef,
        actor_name: user.name,
        actor_role: user.role
      });
    } else {
      await createComplianceRule({
        rule_code: ruleCode,
        name: ruleName,
        description,
        applicable_categories: applicableCategories,
        requirement_type: requirementType,
        severity,
        aicte_handbook_ref: handbookRef,
        actor_name: user.name,
        actor_role: user.role
      });
    }

    setModalOpen(false);
    loadRules();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
              Statutory Rules Engine
            </span>
            <span className="text-xs text-slate-400">&bull; AICTE Approval Process Handbook (APH 2026-27)</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
            Configurable Regulatory Compliance Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer validation logic, enable/disable checks, and maintain rule versions for audit integrity.
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Add Compliance Rule</span>
          </button>
        )}
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Loading statutory rule definitions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`p-5 rounded-xl border transition-all space-y-3 bg-white shadow-xs ${
                rule.is_enabled === 1 ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {rule.rule_code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">v{rule.version}</span>
                    <StatusBadge status={rule.severity} size="sm" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{rule.name}</h3>
                </div>

                {/* Toggle & Edit */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {role === 'admin' && (
                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Edit rule and increment version"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggle(rule.id)}
                    className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
                    title={rule.is_enabled === 1 ? 'Disable Rule' : 'Enable Rule'}
                  >
                    {rule.is_enabled === 1 ? (
                      <ToggleRight className="w-6 h-6 text-teal-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">{rule.description}</p>

              {/* Scope & Handbook Reference */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Handbook Reference:</span>
                  <span className="font-mono text-slate-600">{rule.aicte_handbook_ref || 'Official AICTE Handbook'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Type:</span>
                  <span className="text-slate-600">{rule.requirement_type}</span>
                </div>

                {rule.applicable_categories && rule.applicable_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rule.applicable_categories.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? `Edit Compliance Rule (${ruleCode})` : 'Create New Statutory Compliance Rule'}
        subtitle={isEditing ? 'Editing will bump rule version to preserve past evaluation auditability.' : 'Define configurable validation logic for AICTE scrutiny.'}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Code</label>
            <input
              type="text"
              value={ruleCode}
              disabled={isEditing}
              onChange={e => setRuleCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
            <input
              type="text"
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
              placeholder="e.g. Mandatory Faculty Cadre Ratio Verification"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed description of statutory requirements under Approval Process Handbook..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requirement Type</label>
              <select
                value={requirementType}
                onChange={e => setRequirementType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="Document Mandatory">Document Mandatory</option>
                <option value="Date Validity">Date Validity</option>
                <option value="Identifier Consistency">Identifier Consistency</option>
                <option value="Intake Consistency">Intake Consistency</option>
                <option value="Infrastructure Area">Infrastructure Area</option>
                <option value="Authentication">Authentication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Handbook Reference</label>
            <input
              type="text"
              value={handbookRef}
              onChange={e => setHandbookRef(e.target.value)}
              placeholder="e.g. Chapter II, Section 2.5 & Appendix 4"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRule}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              {isEditing ? 'Save & Increment Version' : 'Create Rule'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
