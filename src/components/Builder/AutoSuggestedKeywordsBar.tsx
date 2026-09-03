import React, { useState } from 'react';
import { 
  Sparkles, Plus, Check, Copy, ChevronDown, ChevronUp, 
  ExternalLink, Layers, CheckCircle2, ArrowUpRight, HelpCircle 
} from 'lucide-react';
import { ResumeData, SuggestedKeywordsData, SmartMatchRewrite } from '../../types/resume';

interface AutoSuggestedKeywordsBarProps {
  resume: ResumeData;
  keywordsData?: SuggestedKeywordsData | null;
  jobDescription?: string;
  onUpdateResume: React.Dispatch<React.SetStateAction<ResumeData>>;
  onOpenSmartMatchModal?: () => void;
}

export const AutoSuggestedKeywordsBar: React.FC<AutoSuggestedKeywordsBarProps> = ({
  resume,
  keywordsData,
  jobDescription = '',
  onUpdateResume,
  onOpenSmartMatchModal
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [addedKeyword, setAddedKeyword] = useState<string | null>(null);
  const [showRewritesDrawer, setShowRewritesDrawer] = useState<boolean>(false);

  // Extract all existing skills from the resume to check which keywords are already added
  const existingSkillsLower = new Set(
    resume.sections
      .filter(s => s.type === 'skills')
      .flatMap(s => s.skillCategories?.flatMap(c => c.skills) || [])
      .map(s => s.toLowerCase().trim())
  );

  const missingKeywords = keywordsData?.missingKeywords || [];
  const matchedKeywords = keywordsData?.matchedKeywords || [];
  const rewrites = keywordsData?.rewrites || [];

  // If no keywordsData and no JD, show nothing or minimal prompt
  if (missingKeywords.length === 0 && matchedKeywords.length === 0 && !jobDescription.trim()) {
    return null;
  }

  // Handle adding keyword directly to Technical Skills
  const handleAddKeywordToSkills = (keyword: string) => {
    onUpdateResume(prev => {
      const newSections = [...prev.sections];
      const skillsSecIndex = newSections.findIndex(s => s.type === 'skills');

      if (skillsSecIndex >= 0) {
        const sec = { ...newSections[skillsSecIndex] };
        const categories = [...(sec.skillCategories || [])];

        if (categories.length > 0) {
          const firstCat = { ...categories[0] };
          if (!firstCat.skills.some(s => s.toLowerCase() === keyword.toLowerCase())) {
            firstCat.skills = [...firstCat.skills, keyword];
            categories[0] = firstCat;
            sec.skillCategories = categories;
            newSections[skillsSecIndex] = sec;
          }
        } else {
          sec.skillCategories = [{
            id: `sk-${Date.now()}`,
            categoryName: 'Core Competencies',
            skills: [keyword]
          }];
          newSections[skillsSecIndex] = sec;
        }
      } else {
        // Create new skills section if none exists
        newSections.push({
          id: `sec-skills-${Date.now()}`,
          type: 'skills',
          title: 'Technical Skills',
          skillCategories: [{
            id: `sk-${Date.now()}`,
            categoryName: 'Core Competencies',
            skills: [keyword]
          }]
        });
      }

      return {
        ...prev,
        sections: newSections,
        updatedAt: new Date().toISOString()
      };
    });

    setAddedKeyword(keyword);
    setTimeout(() => setAddedKeyword(null), 2000);
  };

  const handleCopy = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1800);
  };

  // Insert a rewritten bullet into the first experience item
  const handleInsertRewriteIntoExperience = (bulletText: string) => {
    onUpdateResume(prev => {
      const newSections = [...prev.sections];
      const expSecIndex = newSections.findIndex(s => s.type === 'experience');

      if (expSecIndex >= 0) {
        const sec = { ...newSections[expSecIndex] };
        const items = [...(sec.experienceItems || [])];
        if (items.length > 0) {
          items[0] = {
            ...items[0],
            bullets: [bulletText, ...items[0].bullets]
          };
          sec.experienceItems = items;
          newSections[expSecIndex] = sec;
        }
      }

      return {
        ...prev,
        sections: newSections,
        updatedAt: new Date().toISOString()
      };
    });

    alert('Action-oriented bullet added to your recent Work Experience!');
  };

  return (
    <div className="bg-linear-to-br from-indigo-50/90 via-purple-50/50 to-slate-50 border border-indigo-200/80 rounded-2xl p-4 shadow-xs mb-4">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">
                Auto-Suggested Target Keywords
              </h4>
              {missingKeywords.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  {missingKeywords.length} Missing from Resume
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Click any keyword to add it directly to your Technical Skills section.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rewrites.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRewritesDrawer(!showRewritesDrawer)}
              className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showRewritesDrawer ? 'Hide Rewrites' : `Smart Match Rewrites (${rewrites.length})`}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3.5 space-y-3 pt-3 border-t border-indigo-100">
          
          {/* Missing Keywords Chips */}
          {missingKeywords.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900 block mb-1.5">
                Missing High-Priority ATS Keywords:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw, i) => {
                  const alreadyInResume = existingSkillsLower.has(kw.toLowerCase().trim());
                  const wasJustAdded = addedKeyword === kw;

                  return (
                    <div 
                      key={i}
                      className="inline-flex items-center gap-1 bg-white border border-rose-200 rounded-lg p-1 pr-2 text-xs shadow-2xs hover:border-rose-300 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => handleAddKeywordToSkills(kw)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          alreadyInResume || wasJustAdded
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        }`}
                        title={alreadyInResume ? 'Already in Skills' : 'Click to add to Technical Skills section'}
                      >
                        {alreadyInResume || wasJustAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>In Skills</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 text-rose-500" />
                            <span>Add</span>
                          </>
                        )}
                      </button>

                      <span className="text-slate-800 font-semibold">{kw}</span>

                      <button
                        type="button"
                        onClick={() => handleCopy(kw)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Copy keyword"
                      >
                        {copiedKeyword === kw ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Keywords (Collapsible / Subtle) */}
          {matchedKeywords.length > 0 && (
            <div className="pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                Detected Matched Keywords ({matchedKeywords.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {matchedKeywords.slice(0, 10).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{kw}</span>
                  </span>
                ))}
                {matchedKeywords.length > 10 && (
                  <span className="text-[11px] text-slate-500 self-center">
                    +{matchedKeywords.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Smart Match Rewrites Drawer inside Builder */}
          {showRewritesDrawer && rewrites.length > 0 && (
            <div className="mt-3 p-3.5 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Available Action-Oriented Bullet Rewrites ({rewrites.length})
                </span>
                <span className="text-[10px] text-slate-500">Insert directly into your recent role</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {rewrites.map((r, ri) => (
                  <div key={ri} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {r.actionVerbUsed} • +{r.keywordsAdded.join(', ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInsertRewriteIntoExperience(r.rewrittenBullet)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
                      >
                        <span>Insert Bullet</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">{r.rewrittenBullet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
