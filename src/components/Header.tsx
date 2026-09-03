import React from 'react';
import { FileCheck, Edit3, FolderKanban, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserMenu } from './Auth/UserMenu';

interface HeaderProps {
  activeTab: 'checker' | 'builder' | 'dashboard' | 'not-found' | 'error';
  setActiveTab: (tab: 'checker' | 'builder' | 'dashboard') => void;
  hasApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hasApiKey }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('checker')} 
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-colors">
            <FileCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">Paused AI</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hidden xs:inline-block">
                ATS Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden lg:block">Deterministic Format Checker & Resume Builder</p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            id="nav-tab-checker"
            onClick={() => setActiveTab('checker')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'checker'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Resume Checker</span>
            <span className="sm:hidden">Checker</span>
          </button>

          <button
            id="nav-tab-builder"
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'builder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Resume Builder</span>
            <span className="sm:hidden">Builder</span>
          </button>

          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span className="hidden sm:inline">Saved Versions</span>
            <span className="sm:hidden">Versions</span>
          </button>
        </nav>

        {/* Right side: Status indicator & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini AI Content Engine</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
          </div>

          <UserMenu onNavigateToDashboard={() => setActiveTab('dashboard')} />
        </div>

      </div>
    </header>
  );
};

