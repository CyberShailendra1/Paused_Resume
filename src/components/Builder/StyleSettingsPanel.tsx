import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, Palette, AlertTriangle, CheckCircle2, 
  Sparkles, Info, ShieldCheck, 
  AlertCircle, ChevronDown, ChevronUp, ChevronRight, Check,
  LayoutTemplate, Landmark, Laptop, FileCode, Rocket, Briefcase,
  Minimize2, GraduationCap, AlignJustify, Heading, Pipette,
  Contrast, SlidersHorizontal, Layers, BookOpen, Compass,
  FileText, Sun, Moon, RefreshCcw, Eye
} from 'lucide-react';
import { ResumeStyleSettings, TemplateId, AVAILABLE_TEMPLATES } from '../../types/resume';

interface StyleSettingsPanelProps {
  styles: ResumeStyleSettings;
  onUpdateStyles: (updater: (prev: ResumeStyleSettings) => ResumeStyleSettings) => void;
}

// Preset color options with ATS compliance data
export interface ColorPreset {
  hex: string;
  name: string;
  industry: string;
  isSafe: boolean;
}

export const ATS_SAFE_COLORS: ColorPreset[] = [
  { hex: '#0f172a', name: 'Executive Slate', industry: 'General / All', isSafe: true },
  { hex: '#1e3a8a', name: 'Wall St Navy', industry: 'Finance / Corporate', isSafe: true },
  { hex: '#312e81', name: 'Royal Indigo', industry: 'Tech / Product', isSafe: true },
  { hex: '#064e3b', name: 'Deep Forest', industry: 'Consulting / Healthcare', isSafe: true },
  { hex: '#334155', name: 'Classic Charcoal', industry: 'Engineering / Defense', isSafe: true },
  { hex: '#881337', name: 'Executive Crimson', industry: 'Legal / Academia', isSafe: true },
  { hex: '#115e59', name: 'Deep Teal', industry: 'Creative Tech / Biotech', isSafe: true },
  { hex: '#451a03', name: 'Warm Espresso', industry: 'Publishing / Architecture', isSafe: true }
];

export const SUBOPTIMAL_COLORS: ColorPreset[] = [
  { hex: '#94a3b8', name: 'Muted Gray', industry: 'Low Contrast', isSafe: false },
  { hex: '#eab308', name: 'Vibrant Yellow', industry: 'Illegible on White', isSafe: false },
  { hex: '#38bdf8', name: 'Sky Cyan', industry: 'Washout on Print', isSafe: false },
  { hex: '#f43f5e', name: 'Neon Rose', industry: 'Harsh Saturation', isSafe: false }
];

// Presets for Body Text & Typography Inking
export interface TextColorPreset {
  hex: string;
  name: string;
  description: string;
  tag: string;
}

export const ATS_SAFE_TEXT_COLORS: TextColorPreset[] = [
  { hex: '#0f172a', name: 'Obsidian Slate', description: 'Deep, ultra-crisp modern dark slate', tag: 'Standard (Default)' },
  { hex: '#111827', name: 'Deep Onyx', description: 'Rich near-black for maximum contrast on paper', tag: 'Maximum Contrast' },
  { hex: '#1e293b', name: 'Executive Charcoal', description: 'Classic corporate soft-black tone', tag: 'Corporate Classic' },
  { hex: '#1c1917', name: 'Warm Charcoal', description: 'Natural warm dark gray, elegant on textured paper', tag: 'Natural Warm' },
  { hex: '#0f2942', name: 'Midnight Ink', description: 'Subtle deep blue undertone for tech resumes', tag: 'Tech Modern' },
  { hex: '#262626', name: 'Neutral Graphite', description: 'Balanced neutral black for design & engineering', tag: 'Clean Graphite' }
];

// Presets for Paper Canvas & Background Tint
export interface BackgroundPreset {
  hex: string;
  name: string;
  description: string;
  isPureWhite?: boolean;
  tag: string;
}

export const ATS_SAFE_BACKGROUND_COLORS: BackgroundPreset[] = [
  { hex: '#ffffff', name: 'Crisp White', description: 'Standard printer paper - 100% ATS scanner guaranteed', isPureWhite: true, tag: '100% ATS Safe' },
  { hex: '#fafaf9', name: 'Warm Linen', description: 'Gentle on recruiter eyes during prolonged screen review', tag: 'Warm & Soft' },
  { hex: '#f8fafc', name: 'Ice White', description: 'Cool tech tint, sharp and ultra-contemporary', tag: 'Cool Tech' },
  { hex: '#fdfbf7', name: 'Ivory Stationery', description: 'Executive classic tone for legal, finance & academic CVs', tag: 'Executive Ivory' },
  { hex: '#f9f9fb', name: 'Alabaster Crisp', description: 'Subtle slate tint with pristine contrast', tag: 'Modern Crisp' },
  { hex: '#f5f5f4', name: 'Soft Parchment', description: 'Traditional academic tone for publishing and humanities', tag: 'Scholarly' }
];

// Mapping templates to distinct icons
export const TEMPLATE_ICONS: Record<TemplateId, React.ComponentType<{ className?: string }>> = {
  'ivy-executive': Landmark,
  'modern-tech': Laptop,
  'minimalist-ats': FileCode,
  'silicon-valley': Rocket,
  'corporate-finance': Briefcase,
  'nordic-clean': Sparkles,
  'compact-hybrid': Minimize2,
  'academic-cv': GraduationCap,
};

/**
 * Calculates WCAG 2.1 relative luminance and contrast ratio between foreground and background
 */
export function calculateContrastRatio(fgHex: string, bgHex: string = '#ffffff'): { ratio: number; level: 'AAA' | 'AA' | 'FAIL' } {
  const getLuminance = (hexColor: string): number => {
    let hex = (hexColor || '#000000').replace('#', '').trim();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return 0;
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 0;
    const linearize = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  };

  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  let level: 'AAA' | 'AA' | 'FAIL' = 'FAIL';
  if (ratio >= 7.0) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else level = 'FAIL';
  return { ratio, level };
}

/**
 * Backward compatibility wrapper
 */
export function calculateContrastRatioAgainstWhite(hexColor: string): { ratio: number; level: 'AAA' | 'AA' | 'FAIL' } {
  return calculateContrastRatio(hexColor, '#ffffff');
}

export interface ATSWarning {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  suggestedAction?: {
    label: string;
    apply: () => void;
  };
}

export type MainMenuKey = 'template' | 'font' | 'color';
export type SubMenuKey = 
  | 'template-all' 
  | 'font-family' 
  | 'font-spacing' 
  | 'font-size' 
  | 'color-swatches' 
  | 'color-text'
  | 'color-background'
  | 'color-custom' 
  | 'color-contrast';

export const StyleSettingsPanel: React.FC<StyleSettingsPanelProps> = ({ styles, onUpdateStyles }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Active resolved colors with fallbacks
  const activeAccent = styles.accentColor || '#0f172a';
  const activeText = styles.textColor || '#0f172a';
  const activeBg = styles.backgroundColor || '#ffffff';

  // Left side menu bar state: Static menu with rolling accordion submenus
  // activeMenu tracks which submenu is currently rolled down (can be toggled open/closed)
  const [activeMenu, setActiveMenu] = useState<MainMenuKey | null>('template');
  const [workspaceView, setWorkspaceView] = useState<MainMenuKey>('template');
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuKey>('template-all');
  
  // Custom Color inputs
  const [customHexInput, setCustomHexInput] = useState(activeAccent);
  const [customTextInput, setCustomTextInput] = useState(activeText);
  const [customBgInput, setCustomBgInput] = useState(activeBg);

  // Sync inputs when styles change externally
  React.useEffect(() => {
    setCustomHexInput(activeAccent);
  }, [activeAccent]);

  React.useEffect(() => {
    setCustomTextInput(activeText);
  }, [activeText]);

  React.useEffect(() => {
    setCustomBgInput(activeBg);
  }, [activeBg]);

  // Dual WCAG Contrast calculations: Accent vs Paper Canvas, and Body Text vs Paper Canvas
  const accentContrast = useMemo(() => {
    return calculateContrastRatio(activeAccent, activeBg);
  }, [activeAccent, activeBg]);

  const textContrast = useMemo(() => {
    return calculateContrastRatio(activeText, activeBg);
  }, [activeText, activeBg]);

  // Alias for backward compatibility
  const contrastData = accentContrast;

  // Real-time ATS Warnings Engine
  const atsWarnings = useMemo<ATSWarning[]>(() => {
    const list: ATSWarning[] = [];

    // 1. Text Readability Contrast (Critical for ATS and Recruiters)
    if (textContrast.level === 'FAIL') {
      list.push({
        id: 'text-contrast-fail',
        type: 'critical',
        title: `Critical Body Text Illegibility (${textContrast.ratio}:1)`,
        description: `Your body text color does not meet the minimum WCAG AA threshold (4.5:1) against the canvas background (${activeBg}). Automated ATS OCR scanners will drop keywords, and recruiters will struggle to read your achievements.`,
        suggestedAction: {
          label: 'Fix Text to Obsidian Slate (#0f172a)',
          apply: () => onUpdateStyles(prev => ({ ...prev, textColor: '#0f172a' }))
        }
      });
    } else if (textContrast.level === 'AA') {
      list.push({
        id: 'text-contrast-moderate',
        type: 'info',
        title: `Moderate Text Contrast (${textContrast.ratio}:1)`,
        description: `Body text meets the minimum WCAG AA 4.5:1 threshold, but falls short of the gold-standard 7.0:1 AAA target. Consider a deeper shade for high-speed automated parsers.`,
        suggestedAction: {
          label: 'Boost Text to Deep Onyx (#111827)',
          apply: () => onUpdateStyles(prev => ({ ...prev, textColor: '#111827' }))
        }
      });
    }

    // 2. Accent Contrast Warnings
    if (accentContrast.level === 'FAIL') {
      list.push({
        id: 'low-contrast-fail',
        type: 'critical',
        title: `Critical Accent Contrast Failure (${accentContrast.ratio}:1)`,
        description: `This accent color fails WCAG AA standards (minimum 4.5:1 required) on ${activeBg}. Automated OCR engines (Workday, Taleo, Greenhouse) and human recruiters will struggle to read headings. Black-and-white printouts will be illegible.`,
        suggestedAction: {
          label: 'Fix to Wall St Navy (#1e3a8a)',
          apply: () => onUpdateStyles(prev => ({ ...prev, accentColor: '#1e3a8a' }))
        }
      });
    } else if (accentContrast.level === 'AA') {
      list.push({
        id: 'contrast-moderate',
        type: 'info',
        title: `Moderate Accent Contrast (${accentContrast.ratio}:1)`,
        description: `Accent color meets minimum WCAG AA threshold (4.5:1), but falls short of the recommended 7.0:1 AAA target. On lower-end office printers or scanned copies, text may lose sharpness.`,
        suggestedAction: {
          label: 'Boost to Deep Slate (#0f172a)',
          apply: () => onUpdateStyles(prev => ({ ...prev, accentColor: '#0f172a' }))
        }
      });
    }

    // 3. Paper Background Notice
    if (activeBg.toLowerCase() !== '#ffffff') {
      list.push({
        id: 'paper-tint-notice',
        type: 'info',
        title: `Stationery Paper Tint Active (${activeBg})`,
        description: `Off-white stationery tones look refined on digital monitors and reduce eye strain. When printing to physical paper or submitting to federal government portals, pure white (#ffffff) is universally recommended.`,
        suggestedAction: {
          label: 'Reset to Pure White Paper (#ffffff)',
          apply: () => onUpdateStyles(prev => ({ ...prev, backgroundColor: '#ffffff' }))
        }
      });
    }

    // 4. Line Spacing & Density Warnings
    if (styles.spacing === 'tight' && styles.fontSize === 'compact') {
      list.push({
        id: 'ultra-dense-layout',
        type: 'warning',
        title: 'Ultra-Dense Text Density',
        description: 'Combining compact font sizing (10pt) with tight line spacing can fatigue human recruiters. Use this only if necessary to prevent an accidental single-bullet 2nd page.',
        suggestedAction: {
          label: 'Set Normal Spacing',
          apply: () => onUpdateStyles(prev => ({ ...prev, spacing: 'normal' }))
        }
      });
    } else if (styles.spacing === 'spacious' && styles.fontSize === 'relaxed') {
      list.push({
        id: 'page-overflow-risk',
        type: 'warning',
        title: 'Page Overflow Risk',
        description: 'Relaxed font sizing (12pt) with spacious line heights can expand a standard 1-page resume into an awkward 1.25 pages. Verify page breaks in Print Preview.',
        suggestedAction: {
          label: 'Set Standard Size',
          apply: () => onUpdateStyles(prev => ({ ...prev, fontSize: 'standard' }))
        }
      });
    }

    // 5. Monospace Font Warning
    if (styles.fontFamily === 'mono') {
      list.push({
        id: 'mono-font-notice',
        type: 'info',
        title: 'Monospace Typographic Choice',
        description: 'Monospaced fonts (Courier/Consolas) have uniform letter widths. While 100% parseable by ATS scanners, they consume ~18% more horizontal space per line than Sans or Serif.',
        suggestedAction: {
          label: 'Switch to Clean Sans',
          apply: () => onUpdateStyles(prev => ({ ...prev, fontFamily: 'sans' }))
        }
      });
    }

    return list;
  }, [textContrast, accentContrast, activeBg, styles, onUpdateStyles]);

  // Handle manual Accent HEX input
  const handleHexInputChange = (value: string) => {
    setCustomHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onUpdateStyles(prev => ({ ...prev, accentColor: value }));
    }
  };

  // Handle manual Text HEX input
  const handleTextInputChange = (value: string) => {
    setCustomTextInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onUpdateStyles(prev => ({ ...prev, textColor: value }));
    }
  };

  // Handle manual Background HEX input
  const handleBgInputChange = (value: string) => {
    setCustomBgInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onUpdateStyles(prev => ({ ...prev, backgroundColor: value }));
    }
  };

  // Reset to 100% optimal ATS preset
  const handleResetToOptimalPreset = () => {
    onUpdateStyles(prev => ({
      ...prev,
      fontFamily: 'serif',
      fontSize: 'standard',
      spacing: 'normal',
      accentColor: '#0f172a',
      textColor: '#0f172a',
      backgroundColor: '#ffffff'
    }));
  };

  // Toggling main menu:
  // Updates workspace view and smoothly rolls the submenu down (or up if toggling closed)
  const toggleMainMenu = (menuKey: MainMenuKey, defaultSub: SubMenuKey) => {
    setWorkspaceView(menuKey);
    setActiveSubMenu(defaultSub);
    setActiveMenu(prev => (prev === menuKey ? null : menuKey));
  };

  const handleSubMenuClick = (menuKey: MainMenuKey, subKey: SubMenuKey) => {
    setWorkspaceView(menuKey);
    setActiveSubMenu(subKey);
    setActiveMenu(menuKey);
  };

  const hasCriticalWarning = atsWarnings.some(w => w.type === 'critical');
  const hasSuboptimalWarning = atsWarnings.length > 0;

  // Active template metadata
  const currentTemplate = AVAILABLE_TEMPLATES.find(t => t.id === styles.templateId) || AVAILABLE_TEMPLATES[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 transition-all">
      
      {/* ========================================================
          PANEL TOP BAR & QUICK STATUS BAR
          ======================================================== */}
      <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-200/80">
        
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0"
            title="Style & Typography Controls"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Resume Style & Typography Settings
              </h3>
              {hasCriticalWarning ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  Sub-optimal ATS Format
                </span>
              ) : hasSuboptimalWarning ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {atsWarnings.length} Notice{atsWarnings.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% ATS Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              Static left navigation menu with rolling accordion submenus for Layout Templates, Fonts, and Colors.
            </p>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          {hasSuboptimalWarning && (
            <button
              onClick={handleResetToOptimalPreset}
              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reset all settings to the 100% ATS Optimal Standard preset"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Auto-Fix to</span> ATS Standard
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title={isExpanded ? "Collapse Style Panel" : "Expand Style Panel"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* ========================================================
          SPLIT LAYOUT: STATIC LEFT-SIDE MENU & SUBMENU + RIGHT WORKSPACE
          ======================================================== */}
      {isExpanded && (
        <div className="flex flex-col md:flex-row min-h-[490px]">
          
          {/* --------------------------------------------------------
              STATIC LEFT SIDE MENU WITH ROLLING SUBMENUS
              - Menu stays static and stable with fixed comfortable width
              - Submenus roll up-to-down smoothly with accordion animation
              -------------------------------------------------------- */}
          <aside 
            className="w-full md:w-72 lg:w-80 shrink-0 select-none bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 p-2.5 sm:p-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5 w-full">
              
              {/* Static Header inside left menu */}
              <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-200/70 mb-1">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  Navigation Menu
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  3 Categories
                </span>
              </div>

              {/* ============================================
                  1. RESUME LAYOUT TEMPLATE MENU & SUBMENU
                  ============================================ */}
              <div className={`rounded-xl border transition-all ${
                workspaceView === 'template' 
                  ? 'bg-white border-blue-300 shadow-2xs ring-1 ring-blue-500/15' 
                  : 'border-slate-200/80 bg-white/60 hover:bg-white'
              }`}>
                {/* Main Menu Button */}
                <button
                  type="button"
                  onClick={() => toggleMainMenu('template', 'template-all')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    workspaceView === 'template' ? 'text-blue-900 font-bold' : 'text-slate-700 hover:text-slate-900 font-semibold'
                  }`}
                  title="Resume Layout Template - Click to roll submenu up/down"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      workspaceView === 'template' 
                        ? 'bg-blue-600 text-white shadow-xs scale-105' 
                        : 'bg-slate-200 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                    }`}>
                      <LayoutTemplate className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold truncate">Resume Layout Template</div>
                      <div className="text-[10px] text-slate-500 font-normal truncate">
                        Active: <span className="font-semibold text-blue-700">{currentTemplate.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {AVAILABLE_TEMPLATES.length}
                    </span>
                    <motion.div
                      animate={{ rotate: activeMenu === 'template' ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 ${activeMenu === 'template' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </motion.div>
                  </div>
                </button>

                {/* Submenu for Resume Layout Template - Rolling Up to Down */}
                <AnimatePresence initial={false}>
                  {activeMenu === 'template' && (
                    <motion.div
                      key="submenu-template"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: 'auto', 
                        opacity: 1,
                        transition: {
                          height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.25, delay: 0.05 }
                        }
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                        transition: {
                          height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="px-2 pb-2.5 pt-1.5 space-y-1"
                      >
                        <div className="text-[10px] font-semibold text-slate-400 px-1 py-0.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-blue-500" />
                            Templates Submenu ({AVAILABLE_TEMPLATES.length})
                          </span>
                          <span className="text-[9px] text-blue-600 font-medium">Single-Column ATS</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                          {AVAILABLE_TEMPLATES.map(t => {
                            const IconComponent = TEMPLATE_ICONS[t.id] || LayoutTemplate;
                            const isSelected = styles.templateId === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  handleSubMenuClick('template', 'template-all');
                                  onUpdateStyles(prev => ({
                                    ...prev,
                                    templateId: t.id,
                                    fontFamily: t.id === 'ivy-executive' || t.id === 'academic-cv' 
                                      ? 'serif' 
                                      : t.id === 'minimalist-ats' 
                                        ? 'mono' 
                                        : prev.fontFamily
                                  }));
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-300 shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                                }`}
                                title={t.description}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-600'
                                  }`}>
                                    <IconComponent className="w-3 h-3" />
                                  </div>
                                  <span className="truncate">{t.label}</span>
                                </div>
                                {isSelected ? (
                                  <Check className="w-3 h-3 text-blue-600 shrink-0" />
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-normal truncate max-w-[60px] text-right">
                                    {t.tag}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ============================================
                  2. FONT FAMILY & TYPOGRAPHY MENU & SUBMENU
                  ============================================ */}
              <div className={`rounded-xl border transition-all ${
                workspaceView === 'font' 
                  ? 'bg-white border-indigo-300 shadow-2xs ring-1 ring-indigo-500/15' 
                  : 'border-slate-200/80 bg-white/60 hover:bg-white'
              }`}>
                {/* Main Menu Button */}
                <button
                  type="button"
                  onClick={() => toggleMainMenu('font', 'font-family')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    workspaceView === 'font' ? 'text-indigo-900 font-bold' : 'text-slate-700 hover:text-slate-900 font-semibold'
                  }`}
                  title="Font Family & Letterform - Click to roll submenu up/down"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      workspaceView === 'font' 
                        ? 'bg-indigo-600 text-white shadow-xs scale-105' 
                        : 'bg-slate-200 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                    }`}>
                      <Type className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold truncate">Font Family</div>
                      <div className="text-[10px] text-slate-500 font-normal truncate">
                        {styles.fontFamily.toUpperCase()} • {styles.fontSize} • {styles.spacing}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 capitalize">
                      {styles.fontFamily}
                    </span>
                    <motion.div
                      animate={{ rotate: activeMenu === 'font' ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 ${activeMenu === 'font' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </motion.div>
                  </div>
                </button>

                {/* Submenu for Font Family - Rolling Up to Down */}
                <AnimatePresence initial={false}>
                  {activeMenu === 'font' && (
                    <motion.div
                      key="submenu-font"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: 'auto', 
                        opacity: 1,
                        transition: {
                          height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.25, delay: 0.05 }
                        }
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                        transition: {
                          height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="px-2 pb-2.5 pt-1.5 space-y-1"
                      >
                        <div className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                          Typography Submenu
                        </div>

                        {/* Submenu item 1: Typeface Selection */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('font', 'font-family')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'font-family'
                              ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                              <Type className="w-3 h-3" />
                            </div>
                            <span className="truncate">Typeface Selection</span>
                          </div>
                          <span className="text-[10px] text-indigo-700 capitalize font-medium shrink-0">{styles.fontFamily}</span>
                        </button>

                        {/* Submenu item 2: Line Spacing & Density */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('font', 'font-spacing')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'font-spacing'
                              ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <AlignJustify className="w-3 h-3" />
                            </div>
                            <span className="truncate">Line Spacing & Density</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 capitalize font-medium shrink-0">{styles.spacing}</span>
                        </button>

                        {/* Submenu item 3: Font Sizing Scale */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('font', 'font-size')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'font-size'
                              ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <Heading className="w-3 h-3" />
                            </div>
                            <span className="truncate">Font Sizing Scale</span>
                          </div>
                          <span className="text-[10px] text-blue-700 capitalize font-medium shrink-0">{styles.fontSize}</span>
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ============================================
                  3. GLOBAL ACCENT COLOR, TEXT & BACKGROUND MENU & SUBMENU
                  ============================================ */}
              <div className={`rounded-xl border transition-all ${
                workspaceView === 'color' 
                  ? 'bg-white border-amber-300 shadow-2xs ring-1 ring-amber-500/15' 
                  : 'border-slate-200/80 bg-white/60 hover:bg-white'
              }`}>
                {/* Main Menu Button */}
                <button
                  type="button"
                  onClick={() => toggleMainMenu('color', 'color-swatches')}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    workspaceView === 'color' ? 'text-slate-900 font-bold' : 'text-slate-700 hover:text-slate-900 font-semibold'
                  }`}
                  title="Color, Text & Background Palette - Click to roll submenu up/down"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Tri-Color Swatch Preview Block */}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs border border-black/15 relative overflow-hidden"
                      style={{ backgroundColor: activeBg }}
                      title={`Canvas: ${activeBg}, Text: ${activeText}, Accent: ${activeAccent}`}
                    >
                      <div 
                        className="absolute inset-x-0 top-0 h-3 border-b border-black/10"
                        style={{ backgroundColor: activeAccent }}
                      />
                      <div className="absolute inset-x-0 bottom-1 flex items-center justify-center">
                        <Type className="w-3.5 h-3.5 font-black" style={{ color: activeText }} />
                      </div>
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold truncate">Color, Text & Canvas</div>
                      <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1.5 truncate">
                        <span className="font-mono font-medium">{activeAccent}</span>
                        <span>•</span>
                        <span className="font-mono font-medium">{activeText}</span>
                        <span>•</span>
                        <span className={`font-bold ${
                          textContrast.level === 'AAA' && accentContrast.level === 'AAA' ? 'text-emerald-700' :
                          textContrast.level === 'FAIL' || accentContrast.level === 'FAIL' ? 'text-rose-700' : 'text-amber-700'
                        }`}>
                          {textContrast.level === 'FAIL' || accentContrast.level === 'FAIL' ? 'FAIL' : 'PASS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {textContrast.level === 'FAIL' || accentContrast.level === 'FAIL' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="Contrast Failure detected" />
                    ) : (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                        textContrast.level === 'AAA' && accentContrast.level === 'AAA' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {textContrast.level === 'AAA' && accentContrast.level === 'AAA' ? 'AAA' : 'AA'}
                      </span>
                    )}
                    <motion.div
                      animate={{ rotate: activeMenu === 'color' ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 ${activeMenu === 'color' ? 'text-amber-600' : 'text-slate-400'}`} />
                    </motion.div>
                  </div>
                </button>

                {/* Submenu for Color, Text & Background - Rolling Up to Down */}
                <AnimatePresence initial={false}>
                  {activeMenu === 'color' && (
                    <motion.div
                      key="submenu-color"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: 'auto', 
                        opacity: 1,
                        transition: {
                          height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.25, delay: 0.05 }
                        }
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                        transition: {
                          height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.15 }
                        }
                      }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="px-2 pb-2.5 pt-1.5 space-y-1"
                      >
                        <div className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                          Palette & Contrast Submenu
                        </div>

                        {/* Submenu 1: ATS Safe Accent Swatches */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('color', 'color-swatches')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'color-swatches'
                              ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <Palette className="w-3 h-3" />
                            </div>
                            <span className="truncate">Accent & Highlights</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium shrink-0">8 Swatches</span>
                        </button>

                        {/* Submenu 2: Body Text & Typography Color */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('color', 'color-text')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'color-text'
                              ? 'bg-slate-100 text-slate-950 font-bold border border-slate-300'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Type className="w-3 h-3" />
                            </div>
                            <span className="truncate">Text & Typography</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 shrink-0">{activeText}</span>
                        </button>

                        {/* Submenu 3: Paper Canvas & Tint */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('color', 'color-background')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'color-background'
                              ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileText className="w-3 h-3" />
                            </div>
                            <span className="truncate">Paper Canvas & Tint</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 shrink-0">{activeBg}</span>
                        </button>

                        {/* Submenu 4: Custom Hex & Pipette Suite */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('color', 'color-custom')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'color-custom'
                              ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                              <Pipette className="w-3 h-3" />
                            </div>
                            <span className="truncate">Custom Hex & Pickers</span>
                          </div>
                          <span className="text-[10px] text-indigo-700 font-medium shrink-0">3 Controls</span>
                        </button>

                        {/* Submenu 5: Dual WCAG Contrast Meter */}
                        <button
                          type="button"
                          onClick={() => handleSubMenuClick('color', 'color-contrast')}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            activeSubMenu === 'color-contrast'
                              ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                              <Contrast className="w-3 h-3" />
                            </div>
                            <span className="truncate">Dual WCAG Matrix</span>
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${
                            textContrast.level === 'AAA' ? 'text-emerald-700' : 
                            textContrast.level === 'AA' ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {textContrast.ratio}:1
                          </span>
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom helper card inside static left menu */}
            <div className="pt-3 px-1 border-t border-slate-200/60 mt-3">
              <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-tight">All styles synchronize directly with the Live Preview and PDF print export.</span>
              </div>
            </div>

          </aside>

          {/* --------------------------------------------------------
              RIGHT WORKSPACE / CONTENT AREA
              -------------------------------------------------------- */}
          <main className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto">

            {/* ====================================================
                VIEW 1: RESUME LAYOUT TEMPLATE
                ==================================================== */}
            {workspaceView === 'template' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4 text-blue-600" />
                      Resume Layout Template Selection
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ATS-standardized document structures parsed effortlessly by Workday, Taleo, Greenhouse, and Lever.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Current: {currentTemplate.label}
                  </span>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_TEMPLATES.map(t => {
                    const IconComp = TEMPLATE_ICONS[t.id] || LayoutTemplate;
                    const isSelected = styles.templateId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onUpdateStyles(prev => ({
                            ...prev,
                            templateId: t.id,
                            fontFamily: t.id === 'ivy-executive' || t.id === 'academic-cv' 
                              ? 'serif' 
                              : t.id === 'minimalist-ats' 
                                ? 'mono' 
                                : prev.fontFamily
                          }));
                        }}
                        className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {t.label}
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {t.tag}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {t.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Template Advice Banner */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">100% Single-Column Hierarchy: </span>
                    All 8 templates adhere strictly to single-column parsing geometry, guaranteeing that contact information, work dates, and section headings never get transposed or garbled.
                  </div>
                </div>
              </div>
            )}

            {/* ====================================================
                VIEW 2: FONT FAMILY & TYPOGRAPHY
                ==================================================== */}
            {workspaceView === 'font' && (
              <div className="space-y-6">
                
                {/* 2A. Typeface Family Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Type className="w-4 h-4 text-indigo-600" />
                        Font Family & Letterform
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Standardized cross-platform typefaces with guaranteed OCR scanning accuracy.
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      {styles.fontFamily.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'serif',
                        label: 'Serif (Times / Garamond)',
                        desc: 'Executive standard, formal corporate & academic roles',
                        fontSample: 'font-serif',
                        previewText: 'Aa Bb Gg 123'
                      },
                      {
                        id: 'sans',
                        label: 'Clean Sans (Jakarta / Helvetica)',
                        desc: 'Modern tech, startups, product & corporate',
                        fontSample: 'font-sans',
                        previewText: 'Aa Bb Gg 123'
                      },
                      {
                        id: 'mono',
                        label: 'Compact Mono (Courier)',
                        desc: 'Technical roles, dense tabular data & code-adjacent positions',
                        fontSample: 'font-mono',
                        previewText: 'Aa Bb Gg 123'
                      }
                    ].map(f => {
                      const isSelected = styles.fontFamily === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onUpdateStyles(prev => ({ ...prev, fontFamily: f.id as any }))}
                          className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {f.label}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <div className={`text-xl font-bold my-2 ${f.fontSample} ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {f.previewText}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 leading-normal">{f.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2B. Line Spacing & Sizing Scale Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                  
                  {/* Line Spacing */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlignJustify className="w-3.5 h-3.5 text-emerald-600" />
                        Line Spacing & Density
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {styles.spacing === 'tight' ? '1.25x Line Height' : styles.spacing === 'normal' ? '1.45x Line Height' : '1.65x Line Height'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          id: 'tight',
                          label: 'Tight Density (1.25x)',
                          desc: 'Maximizes vertical density to keep resume on 1 page',
                          badge: 'High Density'
                        },
                        {
                          id: 'normal',
                          label: 'Balanced Standard (1.45x)',
                          desc: 'Optimal ATS OCR & human recruiter readability',
                          badge: 'Recommended'
                        },
                        {
                          id: 'spacious',
                          label: 'Relaxed Spacing (1.65x)',
                          desc: 'Airy formatting suitable for executive 2-page dossiers',
                          badge: 'Executive'
                        }
                      ].map(s => {
                        const isSelected = styles.spacing === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onUpdateStyles(prev => ({ ...prev, spacing: s.id as any }))}
                            className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className={`text-xs font-semibold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                                {s.label}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {s.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Sizing Scale */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Heading className="w-3.5 h-3.5 text-blue-600" />
                        Font Sizing Scale
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {styles.fontSize === 'compact' ? '10pt Body / 20pt Title' : styles.fontSize === 'standard' ? '11pt Body / 24pt Title' : '12pt Body / 28pt Title'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          id: 'compact',
                          label: 'Compact (10pt Body)',
                          desc: 'For senior profiles with extensive career history'
                        },
                        {
                          id: 'standard',
                          label: 'Standard (11pt Body)',
                          desc: 'Industry standard for Workday & Taleo OCR engines'
                        },
                        {
                          id: 'relaxed',
                          label: 'Relaxed (12pt Body)',
                          desc: 'Enhanced legibility for early-career 1-page resumes'
                        }
                      ].map(sz => {
                        const isSelected = styles.fontSize === sz.id;
                        return (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => onUpdateStyles(prev => ({ ...prev, fontSize: sz.id as any }))}
                            className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className={`text-xs font-semibold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                                {sz.label}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{sz.desc}</div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ====================================================
                VIEW 3: GLOBAL ACCENT COLOR, TEXT & BACKGROUND WORKSPACE
                ==================================================== */}
            {workspaceView === 'color' && (
              <div className="space-y-6">
                
                {/* 3A. Header & Dual Contrast Status */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-blue-600" />
                      Global Palette: Accent, Typography Inking & Canvas Tint
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ATS OCR engines and human reviewers require high contrast on white/neutral stationery paper.
                    </p>
                  </div>

                  {/* Dual Contrast Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Text Contrast Badge */}
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                      textContrast.level === 'AAA'
                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                        : textContrast.level === 'AA'
                        ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                    }`}>
                      <div 
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: activeText }} 
                      />
                      <span>Text: {textContrast.ratio}:1</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
                        WCAG {textContrast.level}
                      </span>
                    </div>

                    {/* Accent Contrast Badge */}
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                      accentContrast.level === 'AAA'
                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                        : accentContrast.level === 'AA'
                        ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                    }`}>
                      <div 
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: activeAccent }} 
                      />
                      <span>Accent: {accentContrast.ratio}:1</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px]">
                        WCAG {accentContrast.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3B. Live Interactive Paper Preview Strip */}
                <div 
                  className="p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-sm transition-all relative overflow-hidden"
                  style={{ backgroundColor: activeBg }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-black/10 mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 flex items-center gap-1.5" style={{ color: activeText }}>
                      <Eye className="w-3 h-3" />
                      Live Paper Canvas Simulation
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono opacity-70 px-2 py-0.5 rounded border border-black/10" style={{ color: activeText }}>
                        Canvas: {activeBg}
                      </span>
                      <span className="text-[10px] font-mono opacity-70 px-2 py-0.5 rounded border border-black/10" style={{ color: activeText }}>
                        Ink: {activeText}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: activeAccent }}>
                        Accent: {activeAccent}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: activeAccent }}>
                        ALEXANDRA CHEN
                      </h2>
                      <span className="text-xs font-medium opacity-80" style={{ color: activeText }}>
                        contact@alexchen.dev • (555) 234-5678 • San Francisco, CA
                      </span>
                    </div>

                    <div className="text-xs font-semibold tracking-wide uppercase opacity-75" style={{ color: activeText }}>
                      Senior Systems Architect & Engineering Lead
                    </div>

                    <div className="h-0.5 w-full my-2 rounded-full" style={{ backgroundColor: activeAccent }} />

                    <p className="text-xs leading-relaxed" style={{ color: activeText }}>
                      Architected fault-tolerant distributed services handling 45,000 requests/sec. Led engineering teams across Kubernetes deployments, reducing cold-start latencies by 38% and lowering infrastructure expenditures by $1.4M annually.
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-2xs" style={{ backgroundColor: activeAccent }}>
                        Core Expertise
                      </span>
                      <span className="text-[10px] font-medium opacity-80" style={{ color: activeText }}>
                        TypeScript • React 18 • Cloud Architecture • Distributed Microservices
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submenu Filter Quick Pills */}
                <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Section:</span>
                  {[
                    { key: 'color-swatches', label: 'Accent Highlights' },
                    { key: 'color-text', label: 'Text & Typography' },
                    { key: 'color-background', label: 'Paper Canvas' },
                    { key: 'color-custom', label: 'Custom Hex Suite' },
                    { key: 'color-contrast', label: 'WCAG Matrix' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleSubMenuClick('color', tab.key as SubMenuKey)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        activeSubMenu === tab.key
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ====================================================
                    SECTION 1: GLOBAL ACCENT COLOR & SECTION HIGHLIGHTS
                    ==================================================== */}
                {(activeSubMenu === 'color-swatches' || activeSubMenu === 'color-contrast' || activeSubMenu === 'template-all') && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        1. ATS-Certified Corporate Accent Colors (Headings & Dividers)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Selected: <span className="font-mono font-bold text-slate-800">{activeAccent}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {ATS_SAFE_COLORS.map(c => {
                        const isSelected = activeAccent.toLowerCase() === c.hex.toLowerCase();
                        const cContrast = calculateContrastRatio(c.hex, activeBg);
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => {
                              onUpdateStyles(prev => ({ ...prev, accentColor: c.hex }));
                              setCustomHexInput(c.hex);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="w-5 h-5 rounded-full border border-black/15 shadow-inner"
                                style={{ backgroundColor: c.hex }} 
                              />
                              <div className="flex items-center gap-1">
                                <span className={`text-[9px] px-1 rounded font-bold ${
                                  cContrast.level === 'AAA' ? 'bg-emerald-100 text-emerald-800' :
                                  cContrast.level === 'AA' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {cContrast.ratio}:1
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                                {c.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                {c.industry}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Low Contrast Warning Quick Tests */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Audit Suboptimal Accents:</span> Test how warning engine flags low-contrast colors.
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {SUBOPTIMAL_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => {
                              onUpdateStyles(prev => ({ ...prev, accentColor: c.hex }));
                              setCustomHexInput(c.hex);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                            title={`Test warning with ${c.name} (${c.hex})`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.hex }} />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ====================================================
                    SECTION 2: BODY TEXT & TYPOGRAPHY COLOR (INKING)
                    ==================================================== */}
                {(activeSubMenu === 'color-text' || activeSubMenu === 'color-contrast') && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-slate-800" />
                        2. Body Text & Typography Inking
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Active: <span className="font-mono font-bold text-slate-800">{activeText}</span> ({textContrast.ratio}:1 {textContrast.level})
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      High-density body text requires deep, crisp ink for OCR parsing. Select a curated dark tone or custom hex code.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {ATS_SAFE_TEXT_COLORS.map(t => {
                        const isSelected = activeText.toLowerCase() === t.hex.toLowerCase();
                        const tContrast = calculateContrastRatio(t.hex, activeBg);
                        return (
                          <button
                            key={t.hex}
                            type="button"
                            onClick={() => {
                              onUpdateStyles(prev => ({ ...prev, textColor: t.hex }));
                              setCustomTextInput(t.hex);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="w-5 h-5 rounded-full border border-black/20 shadow-xs flex items-center justify-center"
                                style={{ backgroundColor: t.hex }}
                              >
                                <span className="text-[10px] text-white font-black leading-none">A</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {tContrast.ratio}:1
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-bold leading-tight">
                                {t.name}
                              </div>
                              <div className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                {t.description}
                              </div>
                              <div className={`text-[9px] font-mono mt-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                {t.hex} • {t.tag}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Text Hex & Color Picker Quick Bar */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">Custom Text Ink:</span>
                        <input
                          type="color"
                          value={activeText}
                          onChange={(e) => {
                            onUpdateStyles(prev => ({ ...prev, textColor: e.target.value }));
                            setCustomTextInput(e.target.value);
                          }}
                          className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                          title="Choose custom body text color"
                        />
                        <input
                          type="text"
                          value={customTextInput}
                          onChange={(e) => handleTextInputChange(e.target.value)}
                          placeholder="#0f172a"
                          maxLength={7}
                          className="w-24 px-2 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStyles(prev => ({ ...prev, textColor: '#0f172a' }));
                          setCustomTextInput('#0f172a');
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Reset Text to Slate (#0f172a)
                      </button>
                    </div>
                  </div>
                )}

                {/* ====================================================
                    SECTION 3: PAPER CANVAS & STATIONERY BACKGROUND TINT
                    ==================================================== */}
                {(activeSubMenu === 'color-background' || activeSubMenu === 'color-contrast') && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        3. Paper Canvas & Stationery Tint
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Selected Canvas: <span className="font-mono font-bold text-slate-800">{activeBg}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Select stationery tones calibrated for digital recruitment portfolios. Pure white is ATS standard.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {ATS_SAFE_BACKGROUND_COLORS.map(bg => {
                        const isSelected = activeBg.toLowerCase() === bg.hex.toLowerCase();
                        return (
                          <button
                            key={bg.hex}
                            type="button"
                            onClick={() => {
                              onUpdateStyles(prev => ({ ...prev, backgroundColor: bg.hex }));
                              setCustomBgInput(bg.hex);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div 
                                className="w-6 h-6 rounded-md border border-black/20 shadow-xs flex items-center justify-center font-bold text-[10px] text-slate-700"
                                style={{ backgroundColor: bg.hex }}
                              >
                                📄
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  bg.isPureWhite 
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {bg.tag}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-bold text-slate-900 leading-tight">
                                {bg.name}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                {bg.description}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 mt-1">
                                {bg.hex}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Canvas Hex & Color Picker Quick Bar */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">Custom Paper Tint:</span>
                        <input
                          type="color"
                          value={activeBg}
                          onChange={(e) => {
                            onUpdateStyles(prev => ({ ...prev, backgroundColor: e.target.value }));
                            setCustomBgInput(e.target.value);
                          }}
                          className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                          title="Choose custom background color"
                        />
                        <input
                          type="text"
                          value={customBgInput}
                          onChange={(e) => handleBgInputChange(e.target.value)}
                          placeholder="#ffffff"
                          maxLength={7}
                          className="w-24 px-2 py-1 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStyles(prev => ({ ...prev, backgroundColor: '#ffffff' }));
                          setCustomBgInput('#ffffff');
                        }}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Reset to Pure White Paper (100% ATS)
                      </button>
                    </div>
                  </div>
                )}

                {/* ====================================================
                    SECTION 4: UNIFIED CUSTOM HEX & PIPETTE SUITE
                    ==================================================== */}
                {(activeSubMenu === 'color-custom') && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Pipette className="w-3.5 h-3.5 text-indigo-600" />
                        Custom Hex Entry & Pipette Suite
                      </label>
                      <span className="text-xs text-slate-500">
                        Direct HEX / RGB Color Input for all 3 layers
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Control 1: Accent */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Accent Highlights</span>
                          <span className="text-[10px] font-mono text-slate-500">{activeAccent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeAccent}
                            onChange={(e) => {
                              onUpdateStyles(prev => ({ ...prev, accentColor: e.target.value }));
                              setCustomHexInput(e.target.value);
                            }}
                            className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs shrink-0"
                            title="Open Accent Color Picker"
                          />
                          <input
                            type="text"
                            value={customHexInput}
                            onChange={(e) => handleHexInputChange(e.target.value)}
                            placeholder="#0f172a"
                            maxLength={7}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Used for headers, bullet markers, and primary dividing rules.
                        </div>
                      </div>

                      {/* Control 2: Text Color */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Body Text & Ink</span>
                          <span className="text-[10px] font-mono text-slate-500">{activeText}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeText}
                            onChange={(e) => {
                              onUpdateStyles(prev => ({ ...prev, textColor: e.target.value }));
                              setCustomTextInput(e.target.value);
                            }}
                            className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs shrink-0"
                            title="Open Text Color Picker"
                          />
                          <input
                            type="text"
                            value={customTextInput}
                            onChange={(e) => handleTextInputChange(e.target.value)}
                            placeholder="#0f172a"
                            maxLength={7}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Applied across summaries, experience descriptions, and bullet points.
                        </div>
                      </div>

                      {/* Control 3: Background Canvas */}
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Paper Canvas</span>
                          <span className="text-[10px] font-mono text-slate-500">{activeBg}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeBg}
                            onChange={(e) => {
                              onUpdateStyles(prev => ({ ...prev, backgroundColor: e.target.value }));
                              setCustomBgInput(e.target.value);
                            }}
                            className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs shrink-0"
                            title="Open Canvas Color Picker"
                          />
                          <input
                            type="text"
                            value={customBgInput}
                            onChange={(e) => handleBgInputChange(e.target.value)}
                            placeholder="#ffffff"
                            maxLength={7}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Underlying document paper tone. #ffffff provides guaranteed 100% OCR compliance.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ====================================================
                    SECTION 5: DUAL WCAG CONTRAST MATRIX & DIAGNOSTICS
                    ==================================================== */}
                {(activeSubMenu === 'color-contrast') && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Contrast className="w-4 h-4 text-purple-600" />
                        Dual WCAG 2.1 Contrast Diagnostic Matrix
                      </div>
                      <span className="text-xs text-slate-500">
                        Target: ≥7.0:1 (AAA) or ≥4.5:1 (AA)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Matrix 1: Text vs Canvas */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Body Text Contrast</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            textContrast.level === 'AAA' ? 'bg-emerald-100 text-emerald-800' :
                            textContrast.level === 'AA' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {textContrast.ratio}:1 ({textContrast.level})
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {textContrast.level === 'AAA'
                            ? 'Excellent contrast! Automated OCR systems (Workday, Taleo, Greenhouse) will parse all text flawlessly.'
                            : textContrast.level === 'AA'
                            ? 'Meets minimum readability standards. Recommend a deeper charcoal tone for low-light recruiter environments.'
                            : 'Critical contrast violation! Text may be skipped by resume scrapers or rendered invisible in grayscale prints.'
                          }
                        </div>
                      </div>

                      {/* Matrix 2: Accent vs Canvas */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Accent Contrast</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            accentContrast.level === 'AAA' ? 'bg-emerald-100 text-emerald-800' :
                            accentContrast.level === 'AA' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {accentContrast.ratio}:1 ({accentContrast.level})
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {accentContrast.level === 'AAA'
                            ? 'Heading text and section dividers maintain pristine visual distinction across both digital and print media.'
                            : accentContrast.level === 'AA'
                            ? 'Legible on digital screens, but may appear faint when printed on standard black-and-white office laser printers.'
                            : 'Fails contrast! Headings and highlighted badges will wash out and fail automated accessibility audits.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ====================================================
                PERSISTENT REAL-TIME ATS WARNINGS BANNER
                ==================================================== */}
            {atsWarnings.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Real-Time ATS Readability Diagnostics ({atsWarnings.length})
                </div>

                <div className="space-y-2">
                  {atsWarnings.map(warning => (
                    <div
                      key={warning.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        warning.type === 'critical'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : warning.type === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {warning.type === 'critical' ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : warning.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="text-xs font-bold">{warning.title}</div>
                          <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                            {warning.description}
                          </p>
                        </div>
                      </div>

                      {warning.suggestedAction && (
                        <button
                          type="button"
                          onClick={warning.suggestedAction.apply}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors shadow-2xs cursor-pointer ${
                            warning.type === 'critical'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : warning.type === 'warning'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {warning.suggestedAction.label}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer ATS Compatibility Badges */}
            <div className="mt-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  White (#FFFFFF) Canvas
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  0.75"-1.0" Standard Margin Math
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Single-Column OCR Geometry
                </span>
              </div>
              <div className="font-mono text-slate-400">
                Workday • Taleo • Greenhouse • Lever Ready
              </div>
            </div>

          </main>

        </div>
      )}

    </div>
  );
};
