import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { NewApplicationWizard } from './pages/NewApplicationWizard';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { DocumentVerificationPage } from './pages/DocumentVerificationPage';
import { ComplianceEnginePage } from './pages/ComplianceEnginePage';
import { InfrastructureReviewPage } from './pages/InfrastructureReviewPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    if (id) {
      setSelectedAppId(id);
    } else if (view !== 'applications') {
      setSelectedAppId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Persistent Header */}
      <Header
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex">
        {/* Persistent Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setSelectedAppId(null);
            handleNavigate(view);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {currentView === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}

          {currentView === 'applications' && (
            selectedAppId ? (
              <div>
                <button
                  onClick={() => setSelectedAppId(null)}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  &larr; Back to Applications Registry
                </button>
                <ApplicationDetailPage
                  applicationId={selectedAppId}
                  onNavigate={handleNavigate}
                />
              </div>
            ) : (
              <ApplicationsPage onNavigate={handleNavigate} />
            )
          )}

          {currentView === 'new-application' && (
            <NewApplicationWizard onNavigate={handleNavigate} />
          )}

          {currentView === 'document-verification' && (
            <DocumentVerificationPage onNavigate={handleNavigate} />
          )}

          {currentView === 'compliance-engine' && (
            <ComplianceEnginePage />
          )}

          {currentView === 'infrastructure-review' && (
            <InfrastructureReviewPage onNavigate={handleNavigate} />
          )}

          {currentView === 'review-queue' && (
            <ReviewQueuePage onNavigate={handleNavigate} />
          )}

          {currentView === 'reports' && (
            <ReportsPage initialAppId={selectedAppId || undefined} />
          )}

          {currentView === 'audit-trail' && (
            <AuditTrailPage onNavigate={handleNavigate} />
          )}

          {currentView === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
