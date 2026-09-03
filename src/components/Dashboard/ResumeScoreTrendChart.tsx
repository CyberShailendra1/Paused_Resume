import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Award, Sparkles, CheckCircle2, 
  Calendar, Clock, Edit3, Plus, ArrowUpRight, History, BarChart3,
  FileText, ShieldCheck, ChevronRight, Lock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { SavedResumeVersion, ScoreHistoryEntry, ResumeData } from '../../types/resume';
import { ensureScoreHistory, recordVersionScoreEdit } from '../../utils/resumeStorage';

interface ResumeScoreTrendChartProps {
  versions: SavedResumeVersion[];
  selectedVersionId?: string;
  onSelectVersionId?: (id: string) => void;
  onOpenInBuilder: (resumeData: ResumeData) => void;
  onVersionUpdated?: (updated: SavedResumeVersion) => void;
}

export const ResumeScoreTrendChart: React.FC<ResumeScoreTrendChartProps> = ({
  versions,
  selectedVersionId,
  onSelectVersionId,
  onOpenInBuilder,
  onVersionUpdated
}) => {
  // Active selected version (default to selectedVersionId or the first version)
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedVersionId || (versions.length > 0 ? versions[0].id : '')
  );

  const activeId = selectedVersionId || internalSelectedId;

  // Selected Version Object
  const currentVersion = useMemo(() => {
    return versions.find(v => v.id === activeId) || versions[0] || null;
  }, [versions, activeId]);

  // Ensure score history entries
  const historyData = useMemo(() => {
    if (!currentVersion) return [];
    return ensureScoreHistory(currentVersion) || [];
  }, [currentVersion]);

  // Modal for logging simulated new revision
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [simulatedLabel, setSimulatedLabel] = useState<string>('AI Keyword Alignment');
  const [simulatedScoreChange, setSimulatedScoreChange] = useState<number>(4);
  const [simulatedNote, setSimulatedNote] = useState<string>('Optimized bullet phrasing with high-impact action verbs');

  if (!currentVersion || versions.length === 0) {
    return null;
  }

  // Compute formatted chart data with deltas
  const chartData = historyData.map((entry, idx) => {
    const prevScore = idx > 0 ? historyData[idx - 1].score : entry.score;
    const delta = entry.score - prevScore;
    
    // Format date readable
    let displayDate = entry.date;
    try {
      const parts = entry.date.split('-');
      if (parts.length === 3) {
        const d = new Date(entry.date + 'T00:00:00');
        displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      displayDate = entry.date;
    }

    return {
      ...entry,
      revisionNumber: idx + 1,
      displayDate,
      delta,
      isLatest: idx === historyData.length - 1
    };
  });

  // Calculate high-level trend metrics
  const initialScore = historyData.length > 0 ? historyData[0].score : (currentVersion.lastScore || 85);
  const latestScore = historyData.length > 0 ? historyData[historyData.length - 1].score : (currentVersion.lastScore || 85);
  const totalDelta = latestScore - initialScore;
  const percentageGain = initialScore > 0 ? ((totalDelta / initialScore) * 100).toFixed(1) : '0';
  const highestScore = Math.max(...historyData.map(h => h.score), latestScore);
  const totalEdits = historyData.length;

  // Min and max Y domain calculations
  const minScoreInHistory = Math.min(...historyData.map(h => h.score), 50);
  const yDomainMin = Math.max(0, Math.floor((minScoreInHistory - 10) / 10) * 10);

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectVersionId) {
      onSelectVersionId(id);
    }
  };

  const handleSimulateNewEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersion) return;

    const newScore = Math.min(99, Math.max(40, latestScore + simulatedScoreChange));
    const updated = recordVersionScoreEdit(
      currentVersion.id,
      newScore,
      simulatedLabel,
      simulatedNote
    );

    if (updated && onVersionUpdated) {
      onVersionUpdated(updated);
    }
    setShowAddModal(false);
  };

  // Custom Tooltip Component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 p-3.5 max-w-xs text-xs space-y-2">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-300">
              Revision #{data.revisionNumber}
            </span>
            <span className="text-[11px] text-slate-400">
              {data.date}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">ATS Score:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-white">
                {data.score}
              </span>
              <span className="text-[11px] text-slate-400">/ 100</span>
            </div>
          </div>

          {data.revisionNumber > 1 && (
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400">From Previous Edit:</span>
              <span className={`font-bold ${data.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.delta >= 0 ? `+${data.delta}` : data.delta} pts
              </span>
            </div>
          )}

          <div className="pt-1">
            <p className="font-semibold text-blue-300 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              {data.label || 'Resume Revision'}
            </p>
            {data.note && (
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                {data.note}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
      
      {/* SECTION TOP: Header, Version Selector, & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        
        {/* Left: Section Title & Version Picker */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                ATS Score Trend & Subsequent Edit History
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Version Tracking
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Track how formatting refinements, JD keyword tailoring, and bullet edits improve your ATS match over time.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Select specific resume version + Log Edit button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Version:</span>
            <select
              value={activeId}
              onChange={(e) => handleSelect(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all cursor-pointer max-w-[220px] sm:max-w-[260px] truncate"
            >
              {versions.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.isPrivate ? '🔒 ' : ''}{ver.title} ({ver.lastScore || 85} pts)
                </option>
              ))}
            </select>
            {currentVersion.isPrivate && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shrink-0" title="This is a Private saved version">
                <Lock className="w-2.5 h-2.5" />
                <span className="hidden md:inline">Private</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors"
            title="Log a simulated edit milestone to see score change"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Edit Milestone</span>
            <span className="sm:hidden">Log Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInBuilder(currentVersion.resumeData)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Open in Builder</span>
          </button>
        </div>

      </div>

      {/* METRIC HIGHLIGHTS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Latest Score */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Latest ATS Score</span>
            <Award className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{latestScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{latestScore >= 80 ? 'ATS Optimized (Passing)' : 'Needs Keyword Tuning'}</span>
          </div>
        </div>

        {/* Total Score Delta */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Overall Improvement</span>
            {totalDelta >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold ${totalDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {totalDelta >= 0 ? `+${totalDelta}` : totalDelta}
            </span>
            <span className="text-xs text-slate-400 font-semibold">pts</span>
          </div>
          <div className="text-[10px] text-slate-500">
            <span>{percentageGain}% gain since initial draft</span>
          </div>
        </div>

        {/* Initial Baseline Score */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Initial Draft Score</span>
            <History className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-600">{initialScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="text-[10px] text-slate-500">
            <span>Revision #1 baseline</span>
          </div>
        </div>

        {/* Subsequent Edits Count */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span>Revisions Tracked</span>
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{totalEdits}</span>
            <span className="text-xs text-slate-400 font-semibold">edits</span>
          </div>
          <div className="text-[10px] text-slate-500">
            <span>Peak score: {highestScore}/100</span>
          </div>
        </div>

      </div>

      {/* THE RECHARTS SCORE TREND CHART */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-200 space-y-3">
        
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Score Evolution: {currentVersion.title}
            </span>
            {currentVersion.targetJobTitle && (
              <span className="text-[11px] text-slate-500 font-normal">
                (Target: {currentVersion.targetJobTitle})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="text-slate-600 font-medium">ATS Match Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 border-t-2 border-dashed border-emerald-500 inline-block" />
              <span className="text-emerald-700 font-semibold">80+ Benchmark (Passing)</span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                vertical={false} 
              />

              <XAxis 
                dataKey="displayDate" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />

              <YAxis 
                domain={[yDomainMin, 100]} 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                ticks={[40, 50, 60, 70, 80, 90, 100]}
              />

              {/* Benchmark line for ATS passing grade */}
              <ReferenceLine 
                y={80} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#2563eb" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#scoreAreaGradient)"
                activeDot={{ 
                  r: 6, 
                  stroke: '#1d4ed8', 
                  strokeWidth: 2, 
                  fill: '#ffffff' 
                }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isLatest = payload.isLatest;
                  return (
                    <circle
                      key={`dot-${payload.revisionNumber}`}
                      cx={cx}
                      cy={cy}
                      r={isLatest ? 5 : 4}
                      fill={isLatest ? '#10b981' : '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
          <span>Tip: Hover over data points to review specific edits and score changes.</span>
          <span className="font-semibold text-blue-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {latestScore >= 80 ? 'Standard ATS Filter Clear' : 'Recommended: Aim for 80+'}
          </span>
        </div>

      </div>

      {/* CHRONOLOGICAL SUBSEQUENT EDITS LOG */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            Edit History & Optimization Log ({historyData.length} revisions)
          </h4>
          <span className="text-[11px] text-slate-400">Chronological Progression</span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {chartData.map((item, idx) => {
            const isLatest = idx === chartData.length - 1;
            const scoreBg = item.score >= 80 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : item.score >= 65 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200';

            return (
              <div 
                key={idx}
                className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                  isLatest ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Left: Revision number & description */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLatest 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    #{item.revisionNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {item.label || `Revision #${item.revisionNumber}`}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          Active Version
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {item.date}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Score and change */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {idx > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.delta > 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : item.delta < 0 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {item.delta > 0 ? `+${item.delta}` : item.delta} pts
                    </span>
                  )}

                  <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${scoreBg}`}>
                    {item.score} / 100
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIMULATION MODAL: To test logging a new revision point */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold">Log Simulated Edit Milestone</h4>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateNewEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Edit Milestone Label
                </label>
                <select
                  value={simulatedLabel}
                  onChange={(e) => setSimulatedLabel(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                >
                  <option value="AI Keyword Alignment">AI Keyword Alignment (Target JD Matching)</option>
                  <option value="Quantified Action Verbs">Quantified Action Verbs & Metrics</option>
                  <option value="Removed Complex Columns">Replaced Multi-Column Layout with ATS Flow</option>
                  <option value="Added Core Certifications">Added Industry Certifications & Accreditations</option>
                  <option value="Format & Spacing Polish">Format, Font & Hierarchy Spacing Polish</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Simulated Score Change: {simulatedScoreChange > 0 ? `+${simulatedScoreChange}` : simulatedScoreChange} pts
                </label>
                <input
                  type="range"
                  min="-5"
                  max="10"
                  value={simulatedScoreChange}
                  onChange={(e) => setSimulatedScoreChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-5 pts</span>
                  <span>0 pts</span>
                  <span>+10 pts</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Edit Notes / Description
                </label>
                <textarea
                  rows={2}
                  value={simulatedNote}
                  onChange={(e) => setSimulatedNote(e.target.value)}
                  placeholder="e.g. Added measurable metrics ($ARR, %, team size)..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Milestone & Plot Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
