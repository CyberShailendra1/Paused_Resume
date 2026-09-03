import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, Check, Copy, Wand2, 
  CheckCircle2, RefreshCw, AlertCircle, FileText, ChevronDown, ChevronUp, Layers, HelpCircle
} from 'lucide-react';
import { SmartMatchResult, SmartMatchRewrite, ResumeData, SuggestedKeywordsData } from '../../types/resume';
import { convertTextToResumeData } from '../../utils/atsEngine';

interface SmartMatchPanelProps {
  resumeText: string;
  initialJobDescription?: string;
  onApplyAndEditInBuilder: (
    resumeData: ResumeData, 
    jobDescription: string, 
    keywordsData: SuggestedKeywordsData
  ) => void;
}

export const SmartMatchPanel: React.FC<SmartMatchPanelProps> = ({
  resumeText,
  initialJobDescription = '',
  onApplyAndEditInBuilder
}) => {
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<SmartMatchResult | null>(null);
  const [appliedRewriteIds, setAppliedRewriteIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showJdInput, setShowJdInput] = useState<boolean>(!initialJobDescription.trim());

  // Auto-run Smart Match if initialJobDescription is provided and not yet analyzed
  useEffect(() => {
    if (initialJobDescription && initialJobDescription.trim().length > 30 && !result && !isAnalyzing) {
      runSmartMatch(initialJobDescription);
    }
  }, [initialJobDescription]);

  const runSmartMatch = async (jdToUse: string = jobDescription) => {
    if (!resumeText.trim()) {
      setErrorMsg('Please ensure resume text is provided before running Smart Match.');
      return;
    }
    if (!jdToUse.trim()) {
      setErrorMsg('Please paste a target Job Description to compare against.');
      setShowJdInput(true);
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setAnalysisStep('Auditing candidate resume against target Job Description...');

    const stepTimer1 = setTimeout(() => {
      setAnalysisStep('Scanning for required technical competencies and domain keywords...');
    }, 1000);

    const stepTimer2 = setTimeout(() => {
      setAnalysisStep('Drafting action-oriented bullet point rewrites with metrics...');
    }, 2200);

    try {
      const res = await fetch('/api/ai/smart-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription: jdToUse
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        // Pre-select all rewrites as active by default for maximum ATS benefit
        if (Array.isArray(json.data.rewrites)) {
          const allIds = new Set<string>(json.data.rewrites.map((r: SmartMatchRewrite) => r.id));
          setAppliedRewriteIds(allIds);
        }
        setShowJdInput(false);
      } else {
        setErrorMsg(json.error || 'Failed to complete Smart Match analysis.');
      }
    } catch (err: any) {
      console.error('Smart Match error:', err);
      setErrorMsg('An unexpected network issue occurred. Please try again.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const toggleApplyRewrite = (id: string) => {
    setAppliedRewriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyRewrite = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1800);
  };

  // Helper to load sample JD
  const loadSampleJd = (roleType: 'software' | 'security' | 'data') => {
    let sample = '';
    if (roleType === 'software') {
      sample = `Senior Full-Stack Software Engineer
Company: CloudScale Systems
Requirements:
- 5+ years building scalable distributed web applications using TypeScript, React, and Node.js.
- Strong proficiency in AWS cloud infrastructure (ECS, Lambda, S3, RDS), Docker containerization, and automated CI/CD pipelines.
- Deep expertise with SQL (PostgreSQL), RESTful APIs, and GraphQL microservices.
- Experience leading architectural discussions, system performance optimization, and unit testing frameworks.`;
    } else if (roleType === 'security') {
      sample = `Cybersecurity & Incident Response Analyst
Company: SecureFort Global
Requirements:
- 3+ years in security operations, threat detection, SIEM log monitoring (Splunk), and incident response.
- Hands-on experience with vulnerability management, penetration testing, and security compliance frameworks (SOC 2, ISO 27001).
- Proficiency with Linux command-line analysis, Python automation scripting, and network firewall configuration.`;
    } else {
      sample = `Data & Cloud Platforms Engineer
Company: Apex Data Solutions
Requirements:
- Proven experience engineering data pipelines with Python, SQL, PostgreSQL, and Snowflake.
- Familiarity with AWS data infrastructure, Docker containers, and CI/CD automation.
- Ability to optimize database queries, perform ETL data warehousing, and collaborate in Agile sprints.`;
    }

    setJobDescription(sample);
    setErrorMsg(null);
    setShowJdInput(true);
  };

  // Forward to Builder with applied rewrites and suggested keywords
  const handleProceedToBuilder = (includeRewrites: boolean = true) => {
    const activeRewrites = includeRewrites && result
      ? result.rewrites.filter(r => appliedRewriteIds.has(r.id))
      : [];

    const structuredResume = convertTextToResumeData(resumeText, activeRewrites);

    const keywordsData: SuggestedKeywordsData = {
      matchedKeywords: result?.matchedKeywords || [],
      missingKeywords: result?.missingKeywords || [],
      targetJobDescription: jobDescription,
      targetJobTitle: result?.targetJobTitle,
      rewrites: result?.rewrites || []
    };

    onApplyAndEditInBuilder(structuredResume, jobDescription, keywordsData);
  };

  return (
    <div id="smart-match-panel" className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 overflow-hidden">
      
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Smart Match • AI Keyword & Bullet Optimizer
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scans your resume against the target Job Description and drafts action-oriented bullet point rewrites.
            </p>
          </div>
        </div>

        {/* Action button if result exists */}
        {result && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => runSmartMatch()}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-scan Match
            </button>
            <button
              onClick={() => handleProceedToBuilder(true)}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>Apply & Edit in Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Error Message Notification */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-800 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Job Description Input Section (Collapsible / Toggleable) */}
      <div className="mt-5 bg-slate-50/80 rounded-xl border border-slate-200/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Target Job Description
            </span>
            {jobDescription.trim() && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                JD Attached
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowJdInput(!showJdInput)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{showJdInput ? 'Collapse JD Box' : 'View / Edit Job Description'}</span>
              {showJdInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showJdInput && (
          <div className="mt-3 space-y-3">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job posting / requirements here to compare keywords and generate action-oriented bullet point rewrites..."
              rows={4}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
            />

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500">Try sample JD:</span>
                <button
                  type="button"
                  onClick={() => loadSampleJd('software')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                >
                  Full-Stack Software
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleJd('security')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                >
                  Cybersecurity
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleJd('data')}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                >
                  Data & Cloud
                </button>
              </div>

              <button
                type="button"
                onClick={() => runSmartMatch()}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Run Smart Match Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State Animation */}
      {isAnalyzing && (
        <div className="py-10 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Wand2 className="w-7 h-7 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Running AI Smart Match</h4>
          <p className="text-xs text-indigo-600 font-medium mt-1 animate-fade-in">{analysisStep}</p>
          <div className="w-64 max-w-full mx-auto bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full animate-indeterminate" />
          </div>
        </div>
      )}

      {/* Results View */}
      {result && !isAnalyzing && (
        <div className="mt-6 space-y-6 animate-fade-in">
          
          {/* Match Score & Projected Improvement Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-linear-to-r from-indigo-50/70 via-purple-50/50 to-blue-50/50 rounded-xl p-4 border border-indigo-100">
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-200 flex flex-col items-center justify-center shadow-2xs shrink-0">
                <span className="text-xl font-black text-indigo-900 leading-none">
                  {result.matchScore}%
                </span>
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight mt-0.5">
                  Current Match
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Target Keyword Match</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Projected with rewrites: <strong className="text-emerald-700 font-bold">{result.projectedScore}%</strong> (+{result.projectedScore - result.matchScore} pts)
                </p>
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-indigo-100/80 md:pl-4 pt-3 md:pt-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-slate-800">Missing High-Value Keywords:</span>
                <span className="text-[10px] text-slate-500">(Click to copy)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.slice(0, 8).map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopyKeyword(kw)}
                    className="px-2.5 py-1 rounded-md bg-white border border-indigo-200/90 text-indigo-900 text-xs font-medium hover:bg-indigo-50 transition-colors flex items-center gap-1 group shadow-2xs"
                    title="Click to copy keyword"
                  >
                    <span>{kw}</span>
                    {copiedKeyword === kw ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-indigo-300 group-hover:text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action-Oriented Rewrites List Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>Action-Oriented Bullet Rewrites</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {result.rewrites.length} Suggestions Ready
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Replaces passive phrasing with authoritative past-tense action verbs, quantified metrics, and target keywords.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allSelected = appliedRewriteIds.size === result.rewrites.length;
                  if (allSelected) {
                    setAppliedRewriteIds(new Set());
                  } else {
                    setAppliedRewriteIds(new Set(result.rewrites.map(r => r.id)));
                  }
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                {appliedRewriteIds.size === result.rewrites.length ? 'Deselect All' : 'Select All Rewrites'}
              </button>
            </div>
          </div>

          {/* Rewrite Cards */}
          <div className="space-y-4">
            {result.rewrites.map((item, index) => {
              const isApplied = appliedRewriteIds.has(item.id);

              return (
                <div 
                  key={item.id || index}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isApplied 
                      ? 'border-indigo-300 bg-white shadow-xs ring-1 ring-indigo-200' 
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {item.roleContext || 'Work Experience'}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100">
                        Action Verb: <strong className="font-bold">{item.actionVerbUsed}</strong>
                      </span>
                      {item.keywordsAdded.map((kw, ki) => (
                        <span key={ki} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>+{kw}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyRewrite(item.id, item.rewrittenBullet)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy rewritten bullet point"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleApplyRewrite(item.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Applied to Resume</span>
                          </>
                        ) : (
                          <span>Apply Rewrite</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Before vs After Body */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Before (Candidate Resume):
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        "{item.originalBullet}"
                      </p>
                    </div>

                    {/* After */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <span>Smart Match Rewrite:</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          ATS Optimized
                        </span>
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {item.rewrittenBullet}
                      </p>
                      {item.explanation && (
                        <p className="text-[11px] text-emerald-800/80 mt-2 pt-2 border-t border-emerald-200/60">
                          <strong>Recruiter Impact:</strong> {item.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-8 p-5 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <span>Forward details to Resume Builder</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-extrabold">
                  {appliedRewriteIds.size} rewrites applied
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Transfers your authentic resume details, auto-suggests keywords, and weaves in the applied action bullets.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleProceedToBuilder(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Edit without rewrites
              </button>

              <button
                type="button"
                id="apply-smart-match-builder-cta"
                onClick={() => handleProceedToBuilder(true)}
                className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Apply & Open in Builder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Empty State Prompt if not analyzed yet */}
      {!result && !isAnalyzing && (
        <div className="mt-4 p-5 rounded-xl bg-indigo-50/40 border border-indigo-100/80 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ready to boost your Keyword Match Score?</span>
            </h4>
            <p className="text-[11px] text-indigo-800/80 mt-1">
              Provide your target Job Description above and click <strong>"Run Smart Match Analysis"</strong>. The AI scanner will audit keyword coverage and draft high-impact action-oriented rewrites tailored to your actual experience.
            </p>
          </div>

          <button
            type="button"
            onClick={() => runSmartMatch()}
            disabled={!jobDescription.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Run Smart Match Now</span>
          </button>
        </div>
      )}

    </div>
  );
};
