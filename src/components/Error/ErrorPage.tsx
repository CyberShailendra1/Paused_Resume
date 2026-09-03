import React from 'react';
import { AlertTriangle, RefreshCw, Home, FileText, ArrowLeft, LifeBuoy } from 'lucide-react';

interface ErrorPageProps {
  errorTitle?: string;
  errorMessage?: string;
  onReset?: () => void;
  onNavigate?: (route: 'checker' | 'builder' | 'dashboard') => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  errorTitle = 'Something Went Wrong',
  errorMessage = 'An unexpected issue occurred while rendering this view. Your resume data and settings are safely stored in your browser.',
  onReset,
  onNavigate,
}) => {
  const handleReload = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('checker');
    } else {
      window.location.href = '/';
    }
  };

  const handleGoBuilder = () => {
    if (onNavigate) {
      onNavigate('builder');
    } else {
      window.location.href = '/builder';
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-6">
        
        {/* Error Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Application Status
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {errorTitle}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            {errorMessage}
          </p>
        </div>

        {/* Safety Assurances Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Your documents are safe
          </div>
          <p>
            No resume drafts or changes have been lost. All saved versions remain stored locally or synced to your account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Resume Checker
          </button>

          <button
            type="button"
            onClick={handleGoBuilder}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Resume Builder
          </button>
        </div>

        {/* Subtle Assistance Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Need help? Contact support or restart the session.</span>
        </div>

      </div>
    </div>
  );
};
