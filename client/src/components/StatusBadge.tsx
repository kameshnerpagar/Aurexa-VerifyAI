import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const s = status || 'Unknown';
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotColor = 'bg-slate-400';

  // Application & General Statuses
  if (['Ready for Official Decision', 'Verified', 'Passed', 'Fully Compliant (8/8 Passed)', 'Exemplary Compliance (8/8 Passed)'].includes(s) || s.includes('Fully Compliant') || s.includes('Deficiencies Resolved')) {
    colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (['Under Preliminary Validation', 'Processing', 'Uploaded'].includes(s)) {
    colorStyles = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (['Submitted'].includes(s)) {
    colorStyles = 'bg-sky-50 text-sky-800 border-sky-200';
    dotColor = 'bg-sky-500';
  } else if (['Deficiencies Flagged', 'Returned for Correction', 'Mismatch Detected', 'Failed', 'Sanctioned Mismatch', 'Expired'].includes(s) || s.includes('Deficient') || s.includes('Violated') || s.includes('Non-Compliant')) {
    colorStyles = 'bg-rose-50 text-rose-800 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (['Manual Review Required', 'Requires Human Review', 'Warning', 'Potential Discrepancy', 'Inspection Recommended'].includes(s) || s.includes('Flagged')) {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (['Pending External Verification', 'Pending Verification', 'Awaiting Evidence', 'Awaiting External Registry'].includes(s)) {
    colorStyles = 'bg-purple-50 text-purple-800 border-purple-200';
    dotColor = 'bg-purple-500';
  } else if (['Invalid Digital Signature'].includes(s)) {
    colorStyles = 'bg-red-50 text-red-800 border-red-300 font-semibold';
    dotColor = 'bg-red-600 animate-pulse';
  } else if (['Draft', 'Not Applicable'].includes(s)) {
    colorStyles = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  }

  // Risk levels
  if (s === 'Critical') {
    colorStyles = 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    dotColor = 'bg-rose-600';
  } else if (s === 'High') {
    colorStyles = 'bg-orange-50 text-orange-800 border-orange-200 font-semibold';
    dotColor = 'bg-orange-500';
  } else if (s === 'Medium') {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (s === 'Low') {
    colorStyles = 'bg-teal-50 text-teal-800 border-teal-200';
    dotColor = 'bg-teal-500';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${colorStyles} ${sizeClasses} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{s}</span>
    </span>
  );
};
