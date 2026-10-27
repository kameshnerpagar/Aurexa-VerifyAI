import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, NotificationItem } from '../types';
import { fetchNotifications, markNotificationsAsRead } from '../api';
import {
  ShieldCheck,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Menu,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, onNavigate }) => {
  const { user, role, switchRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  const loadNotifs = async () => {
    try {
      const res = await fetchNotifications(role);
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, [role]);

  const handleMarkRead = async () => {
    await markNotificationsAsRead(role);
    setUnreadCount(0);
    loadNotifs();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:shadow-teal-900/20 transition-all">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-lg text-slate-900 tracking-tight">
                  Aurexa <span className="text-teal-600">VerifyAI</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  AICTE PS-SIH26261
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Intelligent Verification. Transparent Compliance. Faster Decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher, Notifications, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all shadow-xs"
            >
              <span className="text-slate-400 hidden md:inline">Role:</span>
              <span className="capitalize text-teal-700 font-bold">
                {role === 'reviewer' && 'AICTE Reviewer'}
                {role === 'applicant' && 'Institution Applicant'}
                {role === 'admin' && 'Administrator'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showRoleMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Demo Persona</p>
                </div>

                <button
                  onClick={() => switchRole('reviewer')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${role === 'reviewer' ? 'bg-teal-50/70 text-teal-900 font-bold' : 'text-slate-700'}`}
                >
                  <div>
                    <p className="font-semibold">AICTE Reviewer</p>
                    <p className="text-[11px] text-slate-500">Smt. Anita Deshmukh (Evaluation)</p>
                  </div>
                  {role === 'reviewer' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                </button>

                <button
                  onClick={() => switchRole('applicant')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${role === 'applicant' ? 'bg-teal-50/70 text-teal-900 font-bold' : 'text-slate-700'}`}
                >
                  <div>
                    <p className="font-semibold">Institution Applicant</p>
                    <p className="text-[11px] text-slate-500">Dr. Rajesh Sharma (Apex Tech)</p>
                  </div>
                  {role === 'applicant' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                </button>

                <button
                  onClick={() => switchRole('admin')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${role === 'admin' ? 'bg-teal-50/70 text-teal-900 font-bold' : 'text-slate-700'}`}
                >
                  <div>
                    <p className="font-semibold">Administrator</p>
                    <p className="text-[11px] text-slate-500">Dr. Vikramaditya Sen (Rules / Audit)</p>
                  </div>
                  {role === 'admin' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">In-App Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkRead}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${n.is_read === 0 ? 'bg-teal-50/40' : ''}`}
                        onClick={() => {
                          if (n.application_id) {
                            onNavigate('applications', n.application_id);
                            setShowNotifs(false);
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />}
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{n.title}</p>
                            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{n.created_at}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-500/20"
            />
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[160px]">
                {user.institution_name ? user.institution_name : user.designation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
