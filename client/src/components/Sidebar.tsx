import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  ShieldAlert,
  Cpu,
  Building2,
  ListOrdered,
  FileSpreadsheet,
  History,
  Settings,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen,
  onCloseMobile
}) => {
  const { role } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'new-application', label: 'New Application', icon: FilePlus, highlight: role === 'applicant' },
    { id: 'document-verification', label: 'Document Verification', icon: ShieldAlert },
    { id: 'compliance-engine', label: 'Compliance Engine', icon: Cpu },
    { id: 'infrastructure-review', label: 'Infrastructure Review', icon: Building2 },
    { id: 'review-queue', label: 'Review Queue', icon: ListOrdered },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'audit-trail', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Main Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.highlight && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Apply
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SIH 2026 Evaluation Info Box */}
        <div className="p-3 m-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH 2026 Prototype</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            AICTE Decision-Support Engine: Automated Preliminary Scrutiny & Compliance Verification.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Org: AICTE</span>
            <span className="text-teal-400 font-medium">PS ID: SIH26261</span>
          </div>
        </div>
      </aside>
    </>
  );
};
