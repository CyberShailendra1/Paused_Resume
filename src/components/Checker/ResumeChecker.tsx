import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, 
  Sparkles, RefreshCw, Eye, Sliders, ChevronDown, ChevronUp, Copy, Check,
  FileCheck, ShieldAlert, Cpu, Award, Zap, HelpCircle
} from 'lucide-react';
import { ATSAnalysisResult, ATSIssue, ResumeData, SuggestedKeywordsData } from '../../types/resume';
import { analyzeResumeATS, convertTextToResumeData } from '../../utils/atsEngine';
import { parseResumeFile } from '../../utils/fileParser';
import { SAMPLE_PRESETS, SampleResumePreset } from '../../utils/sampleData';
import { SmartMatchPanel } from './SmartMatchPanel';

interface ResumeCheckerProps {
  onFixInBuilder: (resumeData: ResumeData, targetJd?: string, keywordsData?: SuggestedKeywordsData) => void;
  onNavigateToBuilder: () => void;
}

export const ResumeChecker: React.FC<ResumeCheckerProps> = ({ onFixInBuilder, onNavigateToBuilder }) => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [showJdInput, setShowJdInput] = useState<boolean>(true);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'format' | 'keyword' | 'completeness' | 'quality'>('all');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [qualityFix, setQualityFix] = useState<{
    issueId: string;
    original: string;
    improved: string;
    explanation: string;
  } | null>(null);
  const [isFixingQuality, setIsFixingQuality] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load a quick sample
  const handleLoadSample = (preset: SampleResumePreset) => {
    setFormError(null);
    setResumeText(preset.text);
    setJobDescription(preset.jobDescription);
    setShowJdInput(true);
    setUploadedFileName(`${preset.name}.txt`);
    setInputMode('paste');
    triggerAnalysis(preset.text, preset.jobDescription);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setFormError(null);
    setIsAnalyzing(true);
    setAnalysisStep('Extracting text content from document...');

    try {
      const extracted = await parseResumeFile(file);
      setResumeText(extracted);
      triggerAnalysis(extracted, jobDescription);
    } catch (err) {
      console.warn('File parse error:', err);
      setFormError('Could not parse the uploaded document. Please upload another file or paste your plain text directly.');
      setIsAnalyzing(false);
    }
  };

  const triggerAnalysis = (textToAnalyze: string, jd: string) => {
    const text = textToAnalyze.trim();
    if (!text) {
      setFormError('Please upload a resume file or paste your resume text to start the scan.');
      return;
    }
    setFormError(null);

    setIsAnalyzing(true);
    setAnalysisStep('Running deterministic ATS format scan...');

    // Simulate realistic multi-stage ATS pipeline
    setTimeout(() => {
      setAnalysisStep('Evaluating single-column layout, tables, and graphics...');
      setTimeout(() => {
        setAnalysisStep('Comparing technical keywords & section completeness...');
        setTimeout(() => {
          const result = analyzeResumeATS(text, jd);
          setAnalysisResult(result);
          setIsAnalyzing(false);
          setAnalysisStep('');
        }, 350);
      }, 350);
    }, 350);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyword(text);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const findQualityTarget = (issue: ATSIssue) => {
    const lines = resumeText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (issue.id === 'quality-missing-metrics') {
      return lines.find(line => /^[-*•–—]\s*/.test(line) && !(/\b\d+(?:[\.,]\d+)?%|\$\d+|\b\d+x\b/i.test(line))) || issue.before;
    }
    if (issue.id === 'quality-action-verbs') {
      return lines.find(line => /^[-*•–—]\s*/.test(line)) || issue.before;
    }
    const phraseMatch = issue.id.match(/^quality-passive-(.+)$/);
    if (phraseMatch) {
      return lines.find(line => line.toLowerCase().includes(phraseMatch[1].replace(/-/g, ' '))) || issue.before;
    }
    return issue.before;
  };

  const handleFixQualityIssue = async (issue: ATSIssue) => {
    const targetText = findQualityTarget(issue);
    setIsFixingQuality(issue.id);
    try {
      const response = await fetch('/api/ai/improve-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet: targetText,
          role: 'Resume Checker - Content Quality',
          context: `${issue.title}. ${issue.fix}${jobDescription ? ` Target role: ${jobDescription.slice(0, 500)}` : ''}`
        })
      });
      const json = await response.json();
      if (!response.ok || !json.success || !json.data?.improved) {
        throw new Error(json.error || 'Unable to generate a rewrite.');
      }
      setQualityFix({
        issueId: issue.id,
        original: targetText,
        improved: json.data.improved,
        explanation: json.data.explanation || issue.fix
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to generate an AI rewrite.');
    } finally {
      setIsFixingQuality(null);
    }
  };

  const applyQualityFix = () => {
    if (!qualityFix) return;
    const original = qualityFix.original.replace(/^[-*•]\s*/, '').trim();
    const nextText = resumeText.includes(qualityFix.original)
      ? resumeText.replace(qualityFix.original, qualityFix.improved)
      : resumeText.replace(original, qualityFix.improved);
    setResumeText(nextText);
    setQualityFix(null);
    triggerAnalysis(nextText, jobDescription);
  };

  const quickFixTip = analysisResult
    ? analysisResult.missingKeywords[0]
      ? `Add “${analysisResult.missingKeywords[0]}” to a recent achievement bullet for the fastest keyword lift.`
      : analysisResult.stats.metricsCount < analysisResult.stats.bulletCount
        ? 'Quantify one more achievement with scale, savings, growth, or time to gain the next few points.'
        : 'Strengthen your weakest bullet with a decisive action verb and a measurable business outcome.'
    : '';

  // Score color helper
  const getScoreTheme = (score: number) => {
    if (score >= 85) return { color: 'emerald', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: '#10b981', label: 'ATS Safe & Optimized' };
    if (score >= 70) return { color: 'blue', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', ring: '#3b82f6', label: 'Good — Minor Tweaks Needed' };
    if (score >= 55) return { color: 'amber', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', ring: '#f59e0b', label: 'Moderate ATS Risk' };
    return { color: 'rose', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', ring: '#f43f5e', label: 'High ATS Rejection Risk' };
  };

  // Filtered issues
  const filteredIssues = analysisResult?.issues.filter(issue => {
    if (activeCategoryFilter === 'all') return true;
    return issue.category === activeCategoryFilter;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ========================================================
          LANDING HERO (Top Choice: Check or Build)
          ======================================================== */}
      {!analysisResult && !isAnalyzing && (
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Deterministic ATS Compliance Scanner
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Stop losing interviews to the ATS black hole
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Audit your resume for multi-column traps, unparseable tables, missing keywords, and weak bullets. Then fix everything in one click with our ATS-safe builder.
          </p>

          {/* Quick Dual Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a 
              href="#checker-form"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Check My Resume</span>
            </a>
            <button
              onClick={onNavigateToBuilder}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 transition-all border border-slate-300 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Build a New Resume From Scratch</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CHECKER INPUT FORM (Upload or Paste + Optional JD)
          ======================================================== */}
      {!analysisResult && !isAnalyzing && (
        <div id="checker-form" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
          
          {/* Sample preset selector */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Quick Test with Realistic Presets:
              </span>
              <span className="text-xs text-slate-500">Click to preview real ATS analysis</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadSample(preset)}
                  className="text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 line-clamp-1">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Method Toggle */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setInputMode('upload')}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                inputMode === 'upload'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload PDF or DOCX
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                inputMode === 'paste'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Paste Plain Text Directly
            </button>
          </div>

          {/* Inline Form Error Notification */}
          {formError && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">{formError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFormError(null)} 
                className="text-amber-600 hover:text-amber-800 font-bold text-sm px-1 cursor-pointer"
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mode 1: File Upload */}
          {inputMode === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base">
                Click to browse or drop your resume here
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, DOCX, or TXT (Max 10MB)
              </p>
              {uploadedFileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Loaded: {uploadedFileName}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Paste Raw Text */}
          {inputMode === 'paste' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Resume Content (Text)
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the plain text of your resume here (e.g. including contact info, summary, work experience bullets, education, and skills)..."
                rows={10}
                className="w-full rounded-xl border border-slate-300 p-4 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
              />
            </div>
          )}

          {/* Optional Job Description Box */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-2">
              <label 
                onClick={() => setShowJdInput(!showJdInput)}
                className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none"
              >
                <span>Target Job Description (Optional — for Keyword Match)</span>
                {showJdInput ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </label>
              <span className="text-xs text-slate-500">Unlocks JD Keyword Match Score</span>
            </div>

            {showJdInput && (
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job posting / requirements here. We'll identify matched technical keywords and flag missing competencies."
                rows={4}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800"
              />
            )}
          </div>

          {/* Analyze Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => triggerAnalysis(resumeText, jobDescription)}
              disabled={!resumeText.trim()}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <FileCheck className="w-5 h-5" />
              <span>Scan & Analyze Resume</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================
          ANALYSIS LOADING STATE
          ======================================================== */}
      {isAnalyzing && (
        <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Scanning Against ATS Rules</h3>
          <p className="text-sm text-blue-600 font-medium mt-1 animate-fade-in">{analysisStep}</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-5 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-indeterminate" />
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Auditing format, layout columns, keyword frequency, and bullet outcomes...
          </p>
        </div>
      )}

      {/* ========================================================
          ANALYSIS RESULTS DASHBOARD
          ======================================================== */}
      {analysisResult && !isAnalyzing && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Header Bar with Fix CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg">ATS Audit Report</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {analysisResult.stats.wordCount} words • {analysisResult.stats.bulletCount} bullets
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated against Workday, Taleo, Greenhouse, and Lever parsing heuristics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Another
              </button>

              {/* Primary Prominent CTA */}
              <button
                id="fix-in-builder-button"
                onClick={() => {
                  const structured = convertTextToResumeData(resumeText);
                  const keywordsData: SuggestedKeywordsData = {
                    matchedKeywords: analysisResult.matchedKeywords,
                    missingKeywords: analysisResult.missingKeywords,
                    targetJobDescription: jobDescription,
                  };
                  onFixInBuilder(structured, jobDescription, keywordsData);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all group"
              >
                <span>Fix in Resume Builder</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* ========================================================
              SCORE HERO GAUGE & CATEGORY BREAKDOWN CARDS
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Main Score Gauge (Most prominent visual element) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Overall ATS Compatibility Score
              </span>

              {/* Circular Gauge Representation */}
              <div className="relative w-44 h-44 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={getScoreTheme(analysisResult.overallScore).ring}
                    strokeWidth="8"
                    strokeDasharray={`${analysisResult.overallScore * 2.51} 251.2`}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                    {analysisResult.overallScore}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase">out of 100</span>
                </div>
              </div>

              {/* Score badge */}
              <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getScoreTheme(analysisResult.overallScore).bg} ${getScoreTheme(analysisResult.overallScore).text} ${getScoreTheme(analysisResult.overallScore).border}`}>
                {getScoreTheme(analysisResult.overallScore).label}
              </div>

              <p className="text-xs text-slate-500 mt-3 max-w-xs">
                {analysisResult.overallScore >= 80 
                  ? 'Your resume uses a clean ATS structure with high keyword density and measurable outcomes.'
                  : analysisResult.overallScore >= 60
                  ? 'Several formatting or content flaws could trigger automatic rejection in corporate ATS filters.'
                  : 'Critical multi-column, table, or formatting issues will prevent automated parsers from reading your text.'}
              </p>

              {quickFixTip && (
                <div className="relative mt-4 max-w-xs text-left rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick Fix
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-amber-950">{quickFixTip}</p>
                </div>
              )}
            </div>

            {/* Category Breakdown Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category A: Format Score */}
              <div 
                onClick={() => setActiveCategoryFilter('format')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeCategoryFilter === 'format' ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    Format Score (30%)
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {analysisResult.formatScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className={`h-2 rounded-full ${analysisResult.formatScore >= 80 ? 'bg-emerald-500' : analysisResult.formatScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${analysisResult.formatScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Single-column layout, zero tables/graphics, standard headings.
                </p>
              </div>

              {/* Category B: Keyword Match Score */}
              <div 
                onClick={() => setActiveCategoryFilter('keyword')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeCategoryFilter === 'keyword' ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    Keyword Match (25%)
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {analysisResult.keywordScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className={`h-2 rounded-full ${analysisResult.keywordScore >= 80 ? 'bg-emerald-500' : analysisResult.keywordScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${analysisResult.keywordScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {analysisResult.matchedKeywords.length} matched competencies, {analysisResult.missingKeywords.length} missing.
                </p>
              </div>

              {/* Category C: Section Completeness */}
              <div 
                onClick={() => setActiveCategoryFilter('completeness')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeCategoryFilter === 'completeness' ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    Completeness (25%)
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {analysisResult.completenessScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className={`h-2 rounded-full ${analysisResult.completenessScore >= 80 ? 'bg-emerald-500' : analysisResult.completenessScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${analysisResult.completenessScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Summary, Experience, Education, Skills, Projects, Certs.
                </p>
              </div>

              {/* Category D: Content Quality */}
              <div 
                onClick={() => setActiveCategoryFilter('quality')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeCategoryFilter === 'quality' ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Content Quality (20%)
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {analysisResult.qualityScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className={`h-2 rounded-full ${analysisResult.qualityScore >= 80 ? 'bg-emerald-500' : analysisResult.qualityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${analysisResult.qualityScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {analysisResult.stats.metricsCount}/{analysisResult.stats.bulletCount} bullets contain quantified metrics.
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================
              KEYWORDS BREAKDOWN (Matched vs Missing)
              ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Target Keywords & Skills Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  {jobDescription ? 'Compared against pasted Job Description' : 'General industry competencies evaluated'}
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {analysisResult.matchedKeywords.length} Matched / {analysisResult.missingKeywords.length} Missing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Matched Keywords */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Matched in Resume ({analysisResult.matchedKeywords.length})
                </span>
                {analysisResult.matchedKeywords.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No direct keyword matches found.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.matchedKeywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 text-xs font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Keywords */}
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Missing High-Priority Keywords ({analysisResult.missingKeywords.length})
                </span>
                {analysisResult.missingKeywords.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-medium">Outstanding! All primary target keywords detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.missingKeywords.map((kw, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleCopy(kw)}
                        title="Click to copy keyword"
                        className="px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-900 text-xs font-medium hover:bg-rose-100 transition-colors flex items-center gap-1 group"
                      >
                        <span>{kw}</span>
                        {copiedKeyword === kw ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-rose-400 group-hover:text-rose-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ========================================================
              AI-POWERED SMART MATCH PANEL (Action-Oriented Bullet Rewrites)
              ======================================================== */}
          <SmartMatchPanel
            resumeText={resumeText}
            initialJobDescription={jobDescription}
            onApplyAndEditInBuilder={(appliedResume, jd, keywordsData) => {
              onFixInBuilder(appliedResume, jd, keywordsData);
            }}
          />

          {/* ========================================================
              ACTIONABLE ISSUE LIST (With 'Before' and 'Suggested Fix')
              ======================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            
            {/* Header and Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Identified Issues & Actionable Fixes ({analysisResult.issues.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Every issue includes what is triggering the penalty and the exact wording fix.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'format', 'keyword', 'completeness', 'quality'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCategoryFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                      activeCategoryFilter === tab
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab} ({tab === 'all' ? analysisResult.issues.length : analysisResult.issues.filter(i => i.category === tab).length})
                  </button>
                ))}
              </div>
            </div>

            {/* List of Issues */}
            {filteredIssues.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">No issues found in this category!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue) => {
                  const isExpanded = expandedIssueId === issue.id;

                  return (
                    <div 
                      key={issue.id}
                      className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all bg-white"
                    >
                      {/* Issue Bar Header */}
                      <div 
                        onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                        className="p-4 flex items-start justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {issue.severity === 'critical' ? (
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          ) : issue.severity === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          )}

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                issue.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                                issue.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {issue.category} • {issue.severity}
                              </span>
                            </div>
                            <span className="text-xs text-emerald-600 font-semibold mt-0.5 inline-block">
                              Fix impact: +{issue.impactScore} ATS Points
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Expanded "Before" and "Suggested Fix" Content */}
                      <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                        {issue.category === 'quality' && (
                          <div className="md:col-span-2 flex justify-end -mb-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleFixQualityIssue(issue);
                              }}
                              disabled={isFixingQuality === issue.id}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              {isFixingQuality === issue.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                              {isFixingQuality === issue.id ? 'Generating...' : 'Fix Automatically'}
                            </button>
                          </div>
                        )}
                        
                        {/* What's Wrong (Before) */}
                        <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200/80">
                          <span className="font-bold text-rose-900 uppercase tracking-wider text-[11px] block mb-1">
                            Before (What Triggered the Penalty):
                          </span>
                          <p className="text-rose-950 font-mono text-[11px] break-words">
                            {issue.before}
                          </p>
                        </div>

                        {/* Actionable Fix (Suggested in own words) */}
                        <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                          <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                            Suggested Actionable Fix:
                          </span>
                          <p className="text-emerald-950 leading-relaxed">
                            {issue.fix}
                          </p>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Fix in Builder Action Bar */}
            <div className="mt-8 p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold">Apply all fixes automatically</h4>
                <p className="text-xs text-slate-400">
                  Transfer your parsed content into our single-column ATS builder with pre-organized sections.
                </p>
              </div>

              <button
                onClick={() => {
                  const structured = convertTextToResumeData(resumeText);
                  const keywordsData: SuggestedKeywordsData = {
                    matchedKeywords: analysisResult.matchedKeywords,
                    missingKeywords: analysisResult.missingKeywords,
                    targetJobDescription: jobDescription,
                  };
                  onFixInBuilder(structured, jobDescription, keywordsData);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Fix in Resume Builder</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {qualityFix && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="quality-fix-title">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <h3 id="quality-fix-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-600" /> AI Content Quality Fix
                </h3>
                <p className="text-xs text-slate-500 mt-1">Review the targeted rewrite before it changes your resume text.</p>
              </div>
              <button type="button" onClick={() => setQualityFix(null)} className="p-1 text-slate-400 hover:text-slate-700" title="Close preview">
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="font-bold uppercase tracking-wider text-rose-800 mb-1">- Before</div>
                <p className="text-rose-950 leading-relaxed">{qualityFix.original}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="font-bold uppercase tracking-wider text-emerald-800 mb-1">+ After</div>
                <p className="text-emerald-950 leading-relaxed">{qualityFix.improved}</p>
              </div>
              <p className="text-slate-600"><strong>Why this helps:</strong> {qualityFix.explanation}</p>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setQualityFix(null)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold">Keep Original</button>
              <button type="button" onClick={applyQualityFix} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Apply Rewrite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
