import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ResumeChecker } from './components/Checker/ResumeChecker';
import { ResumeBuilder } from './components/Builder/ResumeBuilder';
import { UserDashboard } from './components/Dashboard/UserDashboard';
import { ErrorBoundary } from './components/Error/ErrorBoundary';
import { ErrorPage } from './components/Error/ErrorPage';
import { NotFoundPage } from './components/Error/NotFoundPage';
import { SharedResumePage } from './components/Share/SharedResumePage';
import { ResumeData, SuggestedKeywordsData } from './types/resume';
import { loadSavedVersions, getInitialResumeData, fetchUserResumesFromCloud } from './utils/resumeStorage';
import { AuthProvider, useAuth } from './context/AuthContext';

export type AppRoute = 'checker' | 'builder' | 'dashboard' | 'share' | 'not-found' | 'error';

function parseRouteFromLocation(): AppRoute {
  try {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/checker') return 'checker';
    if (path === '/builder') return 'builder';
    if (path === '/dashboard' || path === '/saved-versions') return 'dashboard';
    if (path === '/share') return 'share';
    if (path === '/error') return 'error';
    // Any unrecognized path returns not-found
    return 'not-found';
  } catch {
    return 'checker';
  }
}

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppRoute>(parseRouteFromLocation);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [activeResumeData, setActiveResumeData] = useState<ResumeData | null>(null);
  const [targetJobDescription, setTargetJobDescription] = useState<string>('');
  const [suggestedKeywordsData, setSuggestedKeywordsData] = useState<SuggestedKeywordsData | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = parseRouteFromLocation();
      setActiveTab(nextRoute);
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept global runtime exceptions and unhandled rejections to never display system errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.warn('AppContent intercepted runtime exception:', event.message);
      event.preventDefault();
      setActiveTab('error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('AppContent intercepted unhandled rejection:', event.reason);
      event.preventDefault();
      if (event.reason?.name !== 'AbortError') {
        setActiveTab('error');
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(() => {
        // Fallback gracefully without showing errors
      });
  }, []);

  // When authenticated user changes, sync cloud resumes
  useEffect(() => {
    if (user && !user.isAnonymous) {
      fetchUserResumesFromCloud(user.uid)
        .then(versions => {
          if (versions && versions.length > 0 && !activeResumeData) {
            setActiveResumeData(versions[0].resumeData);
          }
        })
        .catch(err => {
          console.warn('Could not load user resumes on auth change:', err);
        });
    }
  }, [user]);

  // Navigate helper that updates URL history
  const navigateTo = (tab: AppRoute, pushHistory = true) => {
    setActiveTab(tab);
    if (pushHistory) {
      const pathMap: Record<AppRoute, string> = {
        checker: '/',
        builder: '/builder',
        dashboard: '/dashboard',
        share: '/share',
        error: '/error',
        'not-found': '/404',
      };
      const targetPath = pathMap[tab] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      setCurrentPath(targetPath);
    }
  };

  // When user clicks "Fix in Builder" from the Checker results
  const handleFixInBuilder = (resumeData: ResumeData, targetJd?: string, keywordsData?: SuggestedKeywordsData) => {
    setActiveResumeData(resumeData);
    setTargetJobDescription(targetJd || keywordsData?.targetJobDescription || '');
    setSuggestedKeywordsData(keywordsData || null);
    navigateTo('builder');
  };

  const handleOpenVersionFromDashboard = (resumeData: ResumeData) => {
    setActiveResumeData(resumeData);
    navigateTo('builder');
  };

  const handleCreateNewResume = () => {
    const fresh = getInitialResumeData();
    fresh.id = `resume-${Date.now()}`;
    fresh.name = 'New ATS Resume';
    setActiveResumeData(fresh);
    navigateTo('builder');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top App Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={(tab) => navigateTo(tab)}
        hasApiKey={hasApiKey}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {activeTab === 'checker' && (
          <ResumeChecker
            onFixInBuilder={handleFixInBuilder}
            onNavigateToBuilder={() => {
              if (!activeResumeData) {
                const versions = loadSavedVersions();
                setActiveResumeData(versions[0]?.resumeData || getInitialResumeData());
              }
              navigateTo('builder');
            }}
          />
        )}

        {activeTab === 'builder' && (
          <ResumeBuilder
            initialResumeData={activeResumeData}
            targetJobDescription={targetJobDescription}
            suggestedKeywordsData={suggestedKeywordsData}
            onViewDashboard={() => navigateTo('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard
            onOpenVersion={handleOpenVersionFromDashboard}
            onCreateNew={handleCreateNewResume}
            onScanNew={() => navigateTo('checker')}
          />
        )}

        {activeTab === 'share' && <SharedResumePage />}

        {activeTab === 'not-found' && (
          <NotFoundPage
            currentPath={currentPath}
            onNavigate={(tab) => navigateTo(tab)}
          />
        )}

        {activeTab === 'error' && (
          <ErrorPage
            onReset={() => navigateTo('checker')}
            onNavigate={(tab) => navigateTo(tab)}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>Paused AI</strong> — Deterministic ATS Formatting & AI Content Enhancement
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Single-Column ATS Compliance Guaranteed</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigateTo('not-found')}
              className="hover:text-slate-600 underline text-slate-400 cursor-pointer"
            >
              404 Page
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigateTo('error')}
              className="hover:text-slate-600 underline text-slate-400 cursor-pointer"
            >
              Status Page
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
