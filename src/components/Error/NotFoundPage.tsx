import React from 'react';
import { FileQuestion, ArrowLeft, Home, Edit3, FolderKanban, Search } from 'lucide-react';

interface NotFoundPageProps {
  currentPath?: string;
  onNavigate: (route: 'checker' | 'builder' | 'dashboard') => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  currentPath,
  onNavigate,
}) => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center space-y-6">
        
        {/* Large 404 Visual Badge */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
            <FileQuestion className="w-10 h-10" />
          </div>
          <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            404
          </span>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            The page or document route you are looking for does not exist or may have been relocated.
          </p>
          {currentPath && (
            <div className="inline-block mt-1 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
              {currentPath}
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <button
            type="button"
            onClick={() => onNavigate('checker')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
              Resume Checker
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Scan resume against ATS formatting and keywords
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
              Resume Builder
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              Build clean single-column ATS resumes
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group cursor-pointer shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
              Saved Versions
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">
              View your saved drafts and versions
            </div>
          </button>
        </div>

        {/* Primary Return Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate('checker')}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Resume Checker
          </button>
        </div>

      </div>
    </div>
  );
};
