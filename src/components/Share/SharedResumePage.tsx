import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { ResumeData, ResumeStyleSettings } from '../../types/resume';
import { ResumeTemplateView } from '../Builder/ResumeTemplates';

interface SharedResumePayload {
  resumeData: ResumeData;
  styles: ResumeStyleSettings;
}

function readPayload(): SharedResumePayload | null {
  try {
    const encoded = new URLSearchParams(window.location.search).get('data');
    if (!encoded) return null;
    const decoded = decodeURIComponent(escape(window.atob(encoded)));
    const payload = JSON.parse(decoded) as SharedResumePayload;
    if (!payload.resumeData?.contact || !payload.resumeData?.sections || !payload.styles) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SharedResumePage: React.FC = () => {
  const payload = useMemo(readPayload, []);

  if (!payload) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900">Resume link unavailable</h1>
          <p className="text-sm text-slate-500 mt-2">This share link is invalid or incomplete.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Shared Resume</span>
          <span>View-only</span>
        </div>
        <div className="bg-white shadow-xl mx-auto max-w-[816px]">
          <ResumeTemplateView resume={payload.resumeData} styles={payload.styles} />
        </div>
      </div>
    </main>
  );
};
