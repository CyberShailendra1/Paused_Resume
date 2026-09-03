export type SectionType = 
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'custom';

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  startDate: string;
  endDate: string;
  gpaOrHonors?: string;
  bullets?: string[];
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  skills: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role?: string;
  link?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string; // e.g. Native, Fluent, Professional Working, Conversational
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface CustomFieldItem {
  id: string;
  title: string;
  subtitle?: string;
  dateRange?: string;
  description?: string;
  bullets: string[];
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  summaryText?: string;
  experienceItems?: ExperienceItem[];
  educationItems?: EducationItem[];
  skillCategories?: SkillCategory[];
  projectItems?: ProjectItem[];
  certificationItems?: CertificationItem[];
  languageItems?: LanguageItem[];
  achievementItems?: AchievementItem[];
  customItems?: CustomFieldItem[];
}

export interface ResumeContact {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

export type TemplateId = 
  | 'ivy-executive' 
  | 'modern-tech' 
  | 'minimalist-ats'
  | 'silicon-valley'
  | 'corporate-finance'
  | 'nordic-clean'
  | 'compact-hybrid'
  | 'academic-cv';

export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  tag: string;
  description: string;
}

export const AVAILABLE_TEMPLATES: TemplateDefinition[] = [
  { id: 'ivy-executive', label: 'Ivy Executive', tag: 'Ivy / Serif', description: 'Harvard/Wharton centered serif executive layout' },
  { id: 'modern-tech', label: 'Modern Tech', tag: 'Tech / Sans', description: 'Crisp sans-serif optimized for tech & software roles' },
  { id: 'minimalist-ats', label: 'Minimalist ATS', tag: 'Dense ATS', description: 'Ultra-dense monospace keywords & maximal space efficiency' },
  { id: 'silicon-valley', label: 'Silicon Valley', tag: 'Startup / Lead', description: 'Clean modern layout with bold role hierarchy & subtle rules' },
  { id: 'corporate-finance', label: 'Corporate Finance', tag: 'Wall St / IB', description: 'Formal uppercase double-rule financial layout' },
  { id: 'nordic-clean', label: 'Nordic Clean', tag: 'Scandinavian', description: 'Airy line heights and left accent tags' },
  { id: 'compact-hybrid', label: 'Compact One-Page', tag: '1-Page Focus', description: 'Calibrated vertical density for 1-page resumes' },
  { id: 'academic-cv', label: 'Academic CV', tag: 'Research / PhD', description: 'Scholarly formatting for research, teaching & publications' },
];

export interface ResumeStyleSettings {
  templateId: TemplateId;
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: 'compact' | 'standard' | 'relaxed';
  spacing: 'tight' | 'normal' | 'spacious';
  accentColor: string;
  textColor?: string;
  backgroundColor?: string;
}

export interface ResumeData {
  id: string;
  name: string; // Version title e.g. "Software Engineer - Backend"
  updatedAt: string;
  contact: ResumeContact;
  sections: ResumeSection[];
  targetJobDescription?: string;
}

export interface ATSIssue {
  id: string;
  category: 'format' | 'keyword' | 'completeness' | 'quality';
  severity: 'critical' | 'warning' | 'suggestion';
  title: string;
  before: string;
  fix: string;
  impactScore: number;
  fixed?: boolean;
}

export interface ATSAnalysisResult {
  overallScore: number;
  formatScore: number;
  keywordScore: number;
  completenessScore: number;
  qualityScore: number;
  issues: ATSIssue[];
  matchedKeywords: string[];
  missingKeywords: string[];
  totalJdKeywords: number;
  sectionsStatus: Record<string, { present: boolean; title: string }>;
  stats: {
    wordCount: number;
    bulletCount: number;
    metricsCount: number;
    actionVerbsCount: number;
  };
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  label?: string;
  note?: string;
  wordCount?: number;
  keywordMatchRate?: number;
}

export interface SavedResumeVersion {
  id: string;
  title: string;
  updatedAt: string;
  resumeData: ResumeData;
  styleSettings: ResumeStyleSettings;
  lastScore?: number;
  scoreHistory?: ScoreHistoryEntry[];
  targetJobTitle?: string;
  targetJobDescription?: string;
  isPrivate?: boolean;
}

export interface SmartMatchRewrite {
  id: string;
  originalBullet: string;
  rewrittenBullet: string;
  keywordsAdded: string[];
  roleContext?: string;
  actionVerbUsed: string;
  metricSuggested: string;
  explanation: string;
  applied?: boolean;
}

export interface SmartMatchResult {
  matchScore: number;
  projectedScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  rewrites: SmartMatchRewrite[];
  topRecommendations: string[];
  targetJobTitle?: string;
}

export interface SuggestedKeywordsData {
  matchedKeywords: string[];
  missingKeywords: string[];
  targetJobDescription?: string;
  targetJobTitle?: string;
  rewrites?: SmartMatchRewrite[];
}
