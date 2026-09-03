import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Download, Copy, Check, 
  FileText, Palette, Layout, Save, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Eye, FileDown, Layers, Wand2,
  Printer, ArrowLeft, ZoomIn, ZoomOut, X, Linkedin, Lock, Globe
} from 'lucide-react';
import { 
  ResumeData, ResumeSection, ResumeStyleSettings, SectionType, 
  ExperienceItem, EducationItem, SkillCategory, ProjectItem, 
  CertificationItem, LanguageItem, AchievementItem, CustomFieldItem,
  SavedResumeVersion, TemplateId
} from '../../types/resume';
import { ResumeTemplateView } from './ResumeTemplates';
import { analyzeResumeATS } from '../../utils/atsEngine';
import { exportResumeToPDF, generatePlainTextResume, downloadPlainTextFile, downloadDocxCompatibleFile } from '../../utils/resumeExport';
import { saveVersions, loadSavedVersions, updateVersionScore, syncResumeToCloud, toggleVersionPrivacy } from '../../utils/resumeStorage';
import { LinkedInImportModal, ParsedLinkedInData } from './LinkedInImportModal';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../Auth/AuthModal';
import { StyleSettingsPanel } from './StyleSettingsPanel';
import { AVAILABLE_TEMPLATES } from '../../types/resume';
export { AVAILABLE_TEMPLATES };

interface ResumeBuilderProps {
  initialResumeData?: ResumeData | null;
  targetJobDescription?: string;
  onViewDashboard?: () => void;
}

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ 
  initialResumeData, 
  targetJobDescription = '', 
  onViewDashboard 
}) => {
  // Resume Data State
  const [resume, setResume] = useState<ResumeData>(() => {
    if (initialResumeData) return initialResumeData;
    const versions = loadSavedVersions();
    return versions[0]?.resumeData || {
      id: `resume-${Date.now()}`,
      name: 'Resume - Master Version',
      updatedAt: new Date().toISOString(),
      contact: {
        fullName: 'Alex Morgan',
        jobTitle: 'Senior Full-Stack Engineer',
        email: 'alex.morgan@example.com',
        phone: '(555) 382-9104',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/alexmorgan',
        github: 'github.com/alexmorgan',
        website: 'alexmorgan.dev'
      },
      sections: []
    };
  });

  // Style Settings State (Separate from Content)
  const [styles, setStyles] = useState<ResumeStyleSettings>(() => {
    const versions = loadSavedVersions();
    const matched = initialResumeData?.id 
      ? versions.find(v => v.id === initialResumeData.id) 
      : versions[0];
    const defaultSaved = matched?.styleSettings;

    return {
      templateId: defaultSaved?.templateId || 'ivy-executive',
      fontFamily: defaultSaved?.fontFamily || 'serif',
      fontSize: defaultSaved?.fontSize || 'standard',
      spacing: defaultSaved?.spacing || 'normal',
      accentColor: defaultSaved?.accentColor || '#0f172a',
      textColor: defaultSaved?.textColor || '#0f172a',
      backgroundColor: defaultSaved?.backgroundColor || '#ffffff'
    };
  });

  // Version Privacy State (User requested: make private "saved version")
  const [isPrivateVersion, setIsPrivateVersion] = useState<boolean>(() => {
    const versions = loadSavedVersions();
    const matched = initialResumeData?.id 
      ? versions.find(v => v.id === initialResumeData.id) 
      : versions[0];
    return matched?.isPrivate ?? false;
  });

  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState<string>(targetJobDescription || '');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Auth gating for download
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [authActionReason, setAuthActionReason] = useState<'download' | 'save' | 'general'>('download');
  const [pendingDownloadAction, setPendingDownloadAction] = useState<(() => void) | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  const handleDownloadResume = (format: 'pdf' | 'docx' | 'txt' = 'pdf') => {
    setShowExportMenu(false);
    const isAuthenticated = !!(user && !user.isAnonymous);

    const performDownload = () => {
      if (format === 'pdf') {
        exportResumeToPDF(resume, styles);
      } else if (format === 'docx') {
        downloadDocxCompatibleFile(resume);
      } else if (format === 'txt') {
        downloadPlainTextFile(resume);
      }
    };

    if (!isAuthenticated) {
      setAuthActionReason('download');
      setAuthModalMode('signup');
      setPendingDownloadAction(() => performDownload);
      setShowAuthModal(true);
      return;
    }

    performDownload();
  };

  // Print Preview Mode State
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Keyboard shortcut listener for Print Preview mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPrintPreview) {
        setIsPrintPreview(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintPreview]);
  
  // AI Bullet Assistant State
  const [improvingBulletKey, setImprovingBulletKey] = useState<string | null>(null);
  const [aiBulletModal, setAiBulletModal] = useState<{
    key: string;
    original: string;
    improved: string;
    actionVerb: string;
    metricsSuggested: string;
    explanation: string;
    onApply: (newText: string) => void;
  } | null>(null);

  // AI JD Tailor State
  const [isTailoring, setIsTailoring] = useState<boolean>(false);
  const [tailorResults, setTailorResults] = useState<{
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    tailoringSuggestions: Array<{ original: string; suggestion: string; keywordTarget?: string }>;
    keyAdvice?: string;
  } | null>(null);
  const [showTailorModal, setShowTailorModal] = useState<boolean>(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState<boolean>(false);
  const [linkedInSuccessBanner, setLinkedInSuccessBanner] = useState<string>('');

  // Active expanded section in editor
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(resume.sections[0]?.id || null);

  // Live ATS Score Calculation (Updates deterministically whenever resume or JD changes!)
  const plainTextRepresentation = useMemo(() => {
    return generatePlainTextResume(resume);
  }, [resume]);

  const liveScore = useMemo(() => {
    return analyzeResumeATS(plainTextRepresentation, jobDescription);
  }, [plainTextRepresentation, jobDescription]);

  // Update score on saved version
  useEffect(() => {
    if (resume.id) {
      updateVersionScore(resume.id, liveScore.overallScore);
    }
  }, [liveScore.overallScore, resume.id]);

  // Handle Contact Field Update
  const updateContact = (field: keyof typeof resume.contact, value: string) => {
    setResume(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  // Section Management: Reorder
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...resume.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    setResume(prev => ({ ...prev, sections: newSections }));
  };

  // Section Management: Delete
  const deleteSection = (sectionId: string) => {
    if (!confirm('Are you sure you want to remove this entire section?')) return;
    setResume(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  // Section Management: Add Section
  const addSection = (type: SectionType) => {
    const id = `sec-${Date.now()}`;
    const titles: Record<SectionType, string> = {
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Technical Skills',
      projects: 'Key Projects',
      certifications: 'Certifications',
      languages: 'Languages',
      achievements: 'Key Achievements',
      custom: 'Custom Section'
    };

    const newSection: ResumeSection = {
      id,
      type,
      title: titles[type]
    };

    if (type === 'summary') {
      newSection.summaryText = 'Proven professional with expertise in technical problem solving and team collaboration.';
    } else if (type === 'experience') {
      newSection.experienceItems = [
        {
          id: `exp-${Date.now()}`,
          role: 'Role Title',
          company: 'Company Name',
          location: 'City, State',
          startDate: '2022',
          endDate: 'Present',
          current: true,
          bullets: ['Engineered high-impact solution increasing team output by 25%.']
        }
      ];
    } else if (type === 'education') {
      newSection.educationItems = [
        {
          id: `edu-${Date.now()}`,
          institution: 'University Name',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Field of Study',
          startDate: '2018',
          endDate: '2022'
        }
      ];
    } else if (type === 'skills') {
      newSection.skillCategories = [
        {
          id: `sk-${Date.now()}`,
          categoryName: 'Core Competencies',
          skills: ['Problem Solving', 'Project Management', 'Communication']
        }
      ];
    } else if (type === 'projects') {
      newSection.projectItems = [
        {
          id: `proj-${Date.now()}`,
          name: 'Project Title',
          bullets: ['Delivered end-to-end functionality reducing process time by 30%.']
        }
      ];
    } else if (type === 'certifications') {
      newSection.certificationItems = [
        {
          id: `cert-${Date.now()}`,
          name: 'Certification Title',
          issuer: 'Issuing Organization',
          date: '2023'
        }
      ];
    } else if (type === 'languages') {
      newSection.languageItems = [
        {
          id: `lang-${Date.now()}`,
          language: 'English',
          proficiency: 'Native / Bilingual'
        }
      ];
    } else if (type === 'achievements') {
      newSection.achievementItems = [
        {
          id: `ach-${Date.now()}`,
          title: 'Award or Key Milestone',
          description: 'Recognized for top performance and delivering key business goals.'
        }
      ];
    } else if (type === 'custom') {
      newSection.customItems = [
        {
          id: `cust-${Date.now()}`,
          title: 'Custom Entry Title',
          subtitle: 'Subtitle or Organization',
          dateRange: '2023',
          bullets: ['Key custom detail or accomplishment.']
        }
      ];
    }

    setResume(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setExpandedSectionId(id);
  };

  // AI Bullet Improvement Handler
  const handleAiImproveBullet = async (bulletText: string, contextRole: string, onApply: (newText: string) => void) => {
    if (!bulletText.trim()) return;
    const key = `${contextRole}-${bulletText.slice(0, 15)}`;
    setImprovingBulletKey(key);

    try {
      const res = await fetch('/api/ai/improve-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: bulletText, role: contextRole })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiBulletModal({
          key,
          original: bulletText,
          improved: json.data.improved,
          actionVerb: json.data.actionVerb,
          metricsSuggested: json.data.metricsSuggested,
          explanation: json.data.explanation,
          onApply
        });
      }
    } catch (e) {
      console.error('Error improving bullet with AI:', e);
    } finally {
      setImprovingBulletKey(null);
    }
  };

  // AI Job Description Tailoring Handler
  const handleTailorToJd = async () => {
    if (!jobDescription.trim()) {
      setShowTailorModal(true);
      return;
    }
    setIsTailoring(true);
    setShowTailorModal(true);

    try {
      const res = await fetch('/api/ai/tailor-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: plainTextRepresentation,
          jobDescription
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTailorResults(json.data);
      }
    } catch (e) {
      console.error('Error tailoring to JD:', e);
    } finally {
      setIsTailoring(false);
    }
  };

  // Save Version Handler
  const handleSaveVersion = async () => {
    setIsSaving(true);
    const targetId = resume.id || `resume-${Date.now()}`;
    const targetTitle = resume.name?.trim() || (resume.contact.jobTitle ? `${resume.contact.jobTitle} Resume` : 'My Resume');

    if (!resume.id || !resume.name?.trim()) {
      setResume(prev => ({ ...prev, id: targetId, name: targetTitle }));
    }

    const versions = loadSavedVersions();
    const existingIndex = versions.findIndex(v => v.id === targetId);

    const existingVersion = existingIndex >= 0 ? versions[existingIndex] : null;
    const history = existingVersion?.scoreHistory && existingVersion.scoreHistory.length > 0 
      ? [...existingVersion.scoreHistory] 
      : [];
    
    const todayStr = new Date().toISOString().split('T')[0];
    // Avoid duplicate score entries on same date with exact same score
    const lastHistoryItem = history[history.length - 1];
    if (!lastHistoryItem || lastHistoryItem.date !== todayStr || lastHistoryItem.score !== liveScore.overallScore) {
      history.push({
        date: todayStr,
        score: liveScore.overallScore,
        label: jobDescription ? 'Tailored to Job' : 'Builder Revision',
        note: `Saved with ATS format score of ${liveScore.overallScore}/100`
      });
    }

    const versionRecord: SavedResumeVersion = {
      id: targetId,
      title: targetTitle,
      updatedAt: new Date().toISOString(),
      resumeData: {
        ...resume,
        id: targetId,
        name: targetTitle,
        updatedAt: new Date().toISOString()
      },
      styleSettings: styles,
      lastScore: liveScore.overallScore,
      scoreHistory: history.slice(-15),
      targetJobTitle: resume.contact.jobTitle || '',
      targetJobDescription: jobDescription,
      isPrivate: isPrivateVersion
    };

    if (existingIndex >= 0) {
      versions[existingIndex] = versionRecord;
    } else {
      versions.unshift(versionRecord);
    }

    saveVersions(versions);

    // Sync to Firestore Cloud if user is authenticated
    if (user && !user.isAnonymous) {
      try {
        await syncResumeToCloud(user.uid, versionRecord);
      } catch (err) {
        console.warn('Could not sync to cloud:', err);
      }
    }

    setIsSaving(false);
    setSaveSuccessMsg(user && !user.isAnonymous ? 'Saved & Synced to Cloud!' : 'Version Saved!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  // Copy Plain Text Handler (Robust with iframe fallback)
  const handleCopyPlainText = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(plainTextRepresentation);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      // Fallback for iframe / unsupported clipboard permissions
      const textArea = document.createElement('textarea');
      textArea.value = plainTextRepresentation;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error('execCommand copy fallback failed', e);
      }
      document.body.removeChild(textArea);
    }
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // LinkedIn Import Handler: Pre-populates contact, summary, experience, education, skills
  const handleLinkedInImport = (
    data: ParsedLinkedInData,
    mode: 'replace' | 'merge',
    selectedSections: {
      contact: boolean;
      summary: boolean;
      experience: boolean;
      education: boolean;
      skills: boolean;
    }
  ) => {
    setResume(prev => {
      let updatedContact = { ...prev.contact };
      if (selectedSections.contact && data.contact) {
        updatedContact = {
          fullName: data.contact.fullName || prev.contact.fullName,
          jobTitle: data.contact.jobTitle || prev.contact.jobTitle,
          email: data.contact.email || prev.contact.email,
          phone: data.contact.phone || prev.contact.phone,
          location: data.contact.location || prev.contact.location,
          linkedin: data.contact.linkedin || prev.contact.linkedin,
          website: data.contact.website || prev.contact.website,
          github: prev.contact.github
        };
      }

      let updatedSections: ResumeSection[] = [];

      if (mode === 'replace') {
        if (selectedSections.summary && data.summary) {
          updatedSections.push({
            id: 'sec-summary',
            type: 'summary',
            title: 'Professional Summary',
            summaryText: data.summary
          });
        }

        if (selectedSections.experience && data.experience && data.experience.length > 0) {
          updatedSections.push({
            id: 'sec-experience',
            type: 'experience',
            title: 'Work Experience',
            experienceItems: data.experience.map((exp, idx) => ({
              id: `exp-${Date.now()}-${idx}`,
              role: exp.role || 'Professional Role',
              company: exp.company || 'Company Name',
              location: exp.location || '',
              startDate: exp.startDate || '2021',
              endDate: exp.endDate || 'Present',
              current: exp.current,
              bullets: exp.bullets && exp.bullets.length > 0 
                ? exp.bullets 
                : ['Engineered scalable application features delivering measurable performance improvements.']
            }))
          });
        }

        if (selectedSections.education && data.education && data.education.length > 0) {
          updatedSections.push({
            id: 'sec-education',
            type: 'education',
            title: 'Education',
            educationItems: data.education.map((edu, idx) => ({
              id: `edu-${Date.now()}-${idx}`,
              institution: edu.institution || 'University',
              degree: edu.degree || 'Bachelor of Science',
              fieldOfStudy: edu.fieldOfStudy || '',
              location: edu.location || '',
              startDate: edu.startDate || '2016',
              endDate: edu.endDate || '2020',
              gpaOrHonors: edu.gpaOrHonors || '',
              bullets: edu.bullets || []
            }))
          });
        }

        if (selectedSections.skills && data.skills && data.skills.length > 0) {
          updatedSections.push({
            id: 'sec-skills',
            type: 'skills',
            title: 'Technical Skills',
            skillCategories: [
              {
                id: `sk-${Date.now()}`,
                categoryName: 'Core Competencies',
                skills: data.skills
              }
            ]
          });
        }

        // Retain any custom sections that aren't replaced
        prev.sections.forEach(sec => {
          if (!['summary', 'experience', 'education', 'skills'].includes(sec.type)) {
            updatedSections.push(sec);
          }
        });
      } else {
        // Merge mode
        updatedSections = [...prev.sections];

        if (selectedSections.summary && data.summary) {
          const sumSecIdx = updatedSections.findIndex(s => s.type === 'summary');
          if (sumSecIdx >= 0) {
            updatedSections[sumSecIdx] = {
              ...updatedSections[sumSecIdx],
              summaryText: data.summary
            };
          } else {
            updatedSections.unshift({
              id: `sec-summary-${Date.now()}`,
              type: 'summary',
              title: 'Professional Summary',
              summaryText: data.summary
            });
          }
        }

        if (selectedSections.experience && data.experience && data.experience.length > 0) {
          const newExpItems: ExperienceItem[] = data.experience.map((exp, idx) => ({
            id: `exp-${Date.now()}-${idx}`,
            role: exp.role || 'Professional Role',
            company: exp.company || 'Company Name',
            location: exp.location || '',
            startDate: exp.startDate || '2021',
            endDate: exp.endDate || 'Present',
            current: exp.current,
            bullets: exp.bullets && exp.bullets.length > 0 
              ? exp.bullets 
              : ['Engineered scalable application features delivering measurable performance improvements.']
          }));

          const expSecIdx = updatedSections.findIndex(s => s.type === 'experience');
          if (expSecIdx >= 0) {
            updatedSections[expSecIdx] = {
              ...updatedSections[expSecIdx],
              experienceItems: [
                ...newExpItems,
                ...(updatedSections[expSecIdx].experienceItems || [])
              ]
            };
          } else {
            updatedSections.push({
              id: `sec-experience-${Date.now()}`,
              type: 'experience',
              title: 'Work Experience',
              experienceItems: newExpItems
            });
          }
        }

        if (selectedSections.education && data.education && data.education.length > 0) {
          const newEduItems: EducationItem[] = data.education.map((edu, idx) => ({
            id: `edu-${Date.now()}-${idx}`,
            institution: edu.institution || 'University',
            degree: edu.degree || 'Bachelor of Science',
            fieldOfStudy: edu.fieldOfStudy || '',
            location: edu.location || '',
            startDate: edu.startDate || '2016',
            endDate: edu.endDate || '2020',
            gpaOrHonors: edu.gpaOrHonors || '',
            bullets: edu.bullets || []
          }));

          const eduSecIdx = updatedSections.findIndex(s => s.type === 'education');
          if (eduSecIdx >= 0) {
            updatedSections[eduSecIdx] = {
              ...updatedSections[eduSecIdx],
              educationItems: [
                ...newEduItems,
                ...(updatedSections[eduSecIdx].educationItems || [])
              ]
            };
          } else {
            updatedSections.push({
              id: `sec-education-${Date.now()}`,
              type: 'education',
              title: 'Education',
              educationItems: newEduItems
            });
          }
        }

        if (selectedSections.skills && data.skills && data.skills.length > 0) {
          const skillsSecIdx = updatedSections.findIndex(s => s.type === 'skills');
          if (skillsSecIdx >= 0) {
            const categories = updatedSections[skillsSecIdx].skillCategories || [];
            if (categories.length > 0) {
              const mergedSkills = Array.from(new Set([...categories[0].skills, ...data.skills]));
              categories[0] = { ...categories[0], skills: mergedSkills };
              updatedSections[skillsSecIdx] = {
                ...updatedSections[skillsSecIdx],
                skillCategories: categories
              };
            } else {
              updatedSections[skillsSecIdx] = {
                ...updatedSections[skillsSecIdx],
                skillCategories: [{
                  id: `sk-${Date.now()}`,
                  categoryName: 'Core Competencies',
                  skills: data.skills
                }]
              };
            }
          } else {
            updatedSections.push({
              id: `sec-skills-${Date.now()}`,
              type: 'skills',
              title: 'Technical Skills',
              skillCategories: [{
                id: `sk-${Date.now()}`,
                categoryName: 'Core Competencies',
                skills: data.skills
              }]
            });
          }
        }
      }

      // Automatically expand experience section in the editor
      const expSec = updatedSections.find(s => s.type === 'experience');
      if (expSec) {
        setExpandedSectionId(expSec.id);
      }

      return {
        ...prev,
        name: data.contact?.fullName ? `${data.contact.fullName} - ATS Resume` : prev.name,
        contact: updatedContact,
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      };
    });

    const expCount = selectedSections.experience ? (data.experience?.length || 0) : 0;
    const eduCount = selectedSections.education ? (data.education?.length || 0) : 0;
    setLinkedInSuccessBanner(
      `Imported from LinkedIn: pre-populated ${expCount} experience position${expCount === 1 ? '' : 's'} and ${eduCount} education degree${eduCount === 1 ? '' : 's'}!`
    );

    setTimeout(() => {
      setLinkedInSuccessBanner('');
    }, 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      
      {/* ========================================================
          BUILDER TOOLBAR (Live ATS Score, Tailor, Import, View)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 sticky top-20 z-20 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Version Title + Live ATS Score */}
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="text"
            value={resume.name}
            onChange={(e) => setResume(prev => ({ ...prev, name: e.target.value }))}
            className="text-sm sm:text-base font-bold text-slate-900 border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-blue-500 outline-none pb-0.5 bg-transparent"
            title="Click to rename resume version"
          />

          {/* Live ATS Score Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Live ATS Score:</span>
            <div className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              liveScore.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
              liveScore.overallScore >= 65 ? 'bg-blue-100 text-blue-800' :
              liveScore.overallScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {liveScore.overallScore}/100
            </div>
          </div>

          {/* Version Privacy Toggle */}
          <button
            type="button"
            onClick={() => setIsPrivateVersion(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isPrivateVersion
                ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100 shadow-2xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title={isPrivateVersion ? "Saved version is marked Private (Confidential). Click to make Standard." : "Standard version. Click to mark as Private."}
          >
            {isPrivateVersion ? (
              <>
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Private Version</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Standard Version</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Quick Tools (LinkedIn Import, Tailor to JD, View Toggle) */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* LinkedIn Import Button */}
          <button
            onClick={() => setShowLinkedInModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Import basic details, experience, and education by pasting LinkedIn profile URL or text"
          >
            <Linkedin className="w-3.5 h-3.5 text-sky-600" />
            <span>Import LinkedIn</span>
          </button>

          {/* AI Tailor to JD Button */}
          <button
            onClick={() => setShowTailorModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Tailor to JD</span>
          </button>

          {/* Mobile view toggle */}
          <div className="lg:hidden flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 text-xs font-semibold ${activeTab === 'editor' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold ${activeTab === 'preview' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
            >
              Preview
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================
          STYLE SETTINGS PANEL (Fonts, Spacing, Accent Colors, ATS Diagnostics)
          ======================================================== */}
      <StyleSettingsPanel styles={styles} onUpdateStyles={setStyles} />

      {/* ========================================================
          SPLIT VIEW: SECTION-BASED EDITOR + LIVE PREVIEW
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Section-based Editor */}
        <div className={`lg:col-span-6 space-y-4 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* LinkedIn Pre-population Banner */}
          <div className="bg-linear-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Linkedin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  Import from LinkedIn
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                    Fast Setup
                  </span>
                </h4>
                <p className="text-[11px] text-blue-700">Paste your profile link or text to pre-populate experience & education.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLinkedInModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors flex items-center gap-1"
            >
              <span>Import Profile</span>
            </button>
          </div>

          {/* LinkedIn Import Notification Banner */}
          {linkedInSuccessBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{linkedInSuccessBanner}</span>
              </div>
              <button 
                onClick={() => setLinkedInSuccessBanner('')} 
                className="text-emerald-700 hover:text-emerald-900 p-1"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                <input
                  type="text"
                  value={resume.contact.fullName}
                  onChange={(e) => updateContact('fullName', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Job Title</label>
                <input
                  type="text"
                  value={resume.contact.jobTitle}
                  onChange={(e) => updateContact('jobTitle', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Email Address</label>
                <input
                  type="email"
                  value={resume.contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Phone Number</label>
                <input
                  type="text"
                  value={resume.contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Location (City, State)</label>
                <input
                  type="text"
                  value={resume.contact.location}
                  onChange={(e) => updateContact('location', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">LinkedIn Profile</label>
                <input
                  type="text"
                  value={resume.contact.linkedin || ''}
                  onChange={(e) => updateContact('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section Blocks Accordion */}
          <div className="space-y-3">
            {resume.sections.map((section, sIndex) => {
              const isExpanded = expandedSectionId === section.id;

              return (
                <div key={section.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all">
                  
                  {/* Section Title Header & Reorder Bar */}
                  <div className="p-4 bg-slate-50/70 flex items-center justify-between border-b border-slate-200">
                    <div 
                      onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                      className="flex items-center gap-2 cursor-pointer flex-1 select-none"
                    >
                      <span className="text-xs font-bold text-slate-900">
                        {section.title}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                        {section.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      {/* Move Up */}
                      <button
                        onClick={() => moveSection(sIndex, 'up')}
                        disabled={sIndex === 0}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors"
                        title="Move section up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => moveSection(sIndex, 'down')}
                        disabled={sIndex === resume.sections.length - 1}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors"
                        title="Move section down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Section */}
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors ml-1"
                        title="Remove section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Section Edit Form */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-white text-xs">
                      
                      {/* Section Title Edit */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600">Section Title (ATS Standard)</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const newSections = [...resume.sections];
                            newSections[sIndex].title = e.target.value;
                            setResume(prev => ({ ...prev, sections: newSections }));
                          }}
                          className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* SECTION TYPE: SUMMARY */}
                      {section.type === 'summary' && (
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">Summary Paragraph</label>
                          <textarea
                            value={section.summaryText || ''}
                            onChange={(e) => {
                              const newSections = [...resume.sections];
                              newSections[sIndex].summaryText = e.target.value;
                              setResume(prev => ({ ...prev, sections: newSections }));
                            }}
                            rows={4}
                            placeholder="Write a concise 3-4 sentence professional summary focusing on core competencies and career achievements..."
                            className="w-full mt-1 p-3 rounded-lg border border-slate-300 text-xs text-slate-800 leading-relaxed outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* SECTION TYPE: EXPERIENCE */}
                      {section.type === 'experience' && section.experienceItems && (
                        <div className="space-y-4">
                          {section.experienceItems.map((exp, eIdx) => (
                            <div key={exp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Job Title</label>
                                  <input
                                    type="text"
                                    value={exp.role}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].experienceItems![eIdx].role = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Company Name</label>
                                  <input
                                    type="text"
                                    value={exp.company}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].experienceItems![eIdx].company = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Start Date</label>
                                  <input
                                    type="text"
                                    value={exp.startDate}
                                    placeholder="e.g. 2022-03 or Mar 2022"
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].experienceItems![eIdx].startDate = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">End Date</label>
                                  <input
                                    type="text"
                                    value={exp.current ? 'Present' : exp.endDate}
                                    disabled={exp.current}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].experienceItems![eIdx].endDate = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                              </div>

                              {/* Bullets List with ✨ "Improve This Bullet" Feature */}
                              <div>
                                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                                  Accomplishment Bullets (Target action verbs & metrics)
                                </label>
                                <div className="space-y-2">
                                  {exp.bullets.map((bullet, bIdx) => (
                                    <div key={bIdx} className="space-y-1">
                                      <div className="flex items-start gap-1.5">
                                        <textarea
                                          value={bullet}
                                          onChange={(e) => {
                                            const newSections = [...resume.sections];
                                            newSections[sIndex].experienceItems![eIdx].bullets[bIdx] = e.target.value;
                                            setResume(prev => ({ ...prev, sections: newSections }));
                                          }}
                                          rows={2}
                                          className="flex-1 p-2 rounded border border-slate-300 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                        />

                                        {/* AI Improve Button */}
                                        <button
                                          onClick={() => handleAiImproveBullet(bullet, exp.role, (newText) => {
                                            const newSections = [...resume.sections];
                                            newSections[sIndex].experienceItems![eIdx].bullets[bIdx] = newText;
                                            setResume(prev => ({ ...prev, sections: newSections }));
                                          })}
                                          disabled={!bullet.trim() || improvingBulletKey !== null}
                                          className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shrink-0"
                                          title="AI Rewrite: Add Action Verbs & Metrics"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                        </button>

                                        {/* Remove Bullet */}
                                        <button
                                          onClick={() => {
                                            const newSections = [...resume.sections];
                                            newSections[sIndex].experienceItems![eIdx].bullets.splice(bIdx, 1);
                                            setResume(prev => ({ ...prev, sections: newSections }));
                                          }}
                                          className="p-2 text-slate-400 hover:text-rose-600 rounded"
                                          title="Remove bullet"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].experienceItems![eIdx].bullets.push('Accelerated process efficiency by implementing standard automated pipelines.');
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Bullet Point</span>
                                </button>
                              </div>

                              <div className="flex justify-end pt-2 border-t border-slate-200">
                                <button
                                  onClick={() => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].experienceItems!.splice(eIdx, 1);
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                                >
                                  Delete Job Entry
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={() => {
                              const newSections = [...resume.sections];
                              newSections[sIndex].experienceItems!.push({
                                id: `exp-${Date.now()}`,
                                role: 'Software Engineer',
                                company: 'Company Name',
                                startDate: '2021',
                                endDate: '2023',
                                current: false,
                                bullets: ['Engineered scalable features improving user satisfaction.']
                              });
                              setResume(prev => ({ ...prev, sections: newSections }));
                            }}
                            className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Another Job Experience</span>
                          </button>
                        </div>
                      )}

                      {/* SECTION TYPE: SKILLS */}
                      {section.type === 'skills' && section.skillCategories && (
                        <div className="space-y-3">
                          {section.skillCategories.map((cat, cIdx) => (
                            <div key={cat.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2">
                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Category Name</label>
                                <input
                                  type="text"
                                  value={cat.categoryName}
                                  onChange={(e) => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].skillCategories![cIdx].categoryName = e.target.value;
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Skills (Comma-separated text)</label>
                                <input
                                  type="text"
                                  value={cat.skills.join(', ')}
                                  onChange={(e) => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].skillCategories![cIdx].skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                />
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].skillCategories!.splice(cIdx, 1);
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="text-[11px] text-rose-600 hover:text-rose-700"
                                >
                                  Remove Category
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={() => {
                              const newSections = [...resume.sections];
                              newSections[sIndex].skillCategories!.push({
                                id: `sk-${Date.now()}`,
                                categoryName: 'Tools & Platforms',
                                skills: ['Git', 'Docker', 'AWS']
                              });
                              setResume(prev => ({ ...prev, sections: newSections }));
                            }}
                            className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Skill Category</span>
                          </button>
                        </div>
                      )}

                      {/* SECTION TYPE: EDUCATION */}
                      {section.type === 'education' && section.educationItems && (
                        <div className="space-y-3">
                          {section.educationItems.map((edu, edIdx) => (
                            <div key={edu.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Institution / University</label>
                                  <input
                                    type="text"
                                    value={edu.institution}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].educationItems![edIdx].institution = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Degree</label>
                                  <input
                                    type="text"
                                    value={edu.degree}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].educationItems![edIdx].degree = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Major / Field of Study</label>
                                  <input
                                    type="text"
                                    value={edu.fieldOfStudy || ''}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].educationItems![edIdx].fieldOfStudy = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Graduation Year</label>
                                  <input
                                    type="text"
                                    value={edu.endDate}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].educationItems![edIdx].endDate = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].educationItems!.splice(edIdx, 1);
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="text-[11px] text-rose-600 hover:text-rose-700"
                                >
                                  Remove Degree
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={() => {
                              const newSections = [...resume.sections];
                              newSections[sIndex].educationItems!.push({
                                id: `edu-${Date.now()}`,
                                institution: 'University',
                                degree: 'Degree',
                                startDate: '2016',
                                endDate: '2020'
                              });
                              setResume(prev => ({ ...prev, sections: newSections }));
                            }}
                            className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Education Entry</span>
                          </button>
                        </div>
                      )}

                      {/* SECTION TYPE: CUSTOM SECTION */}
                      {section.type === 'custom' && section.customItems && (
                        <div className="space-y-3">
                          {section.customItems.map((cItem, ciIdx) => (
                            <div key={cItem.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Entry Title</label>
                                  <input
                                    type="text"
                                    value={cItem.title}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].customItems![ciIdx].title = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Date Range (Optional)</label>
                                  <input
                                    type="text"
                                    value={cItem.dateRange || ''}
                                    onChange={(e) => {
                                      const newSections = [...resume.sections];
                                      newSections[sIndex].customItems![ciIdx].dateRange = e.target.value;
                                      setResume(prev => ({ ...prev, sections: newSections }));
                                    }}
                                    className="w-full mt-0.5 px-2.5 py-1 rounded border border-slate-300 text-xs"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Description / Details</label>
                                <textarea
                                  value={cItem.description || ''}
                                  onChange={(e) => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].customItems![ciIdx].description = e.target.value;
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  rows={2}
                                  className="w-full mt-0.5 p-2 rounded border border-slate-300 text-xs"
                                />
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    const newSections = [...resume.sections];
                                    newSections[sIndex].customItems!.splice(ciIdx, 1);
                                    setResume(prev => ({ ...prev, sections: newSections }));
                                  }}
                                  className="text-[11px] text-rose-600 hover:text-rose-700"
                                >
                                  Remove Custom Entry
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={() => {
                              const newSections = [...resume.sections];
                              newSections[sIndex].customItems!.push({
                                id: `cust-${Date.now()}`,
                                title: 'New Custom Entry',
                                bullets: ['Custom accomplishment detail.']
                              });
                              setResume(prev => ({ ...prev, sections: newSections }));
                            }}
                            className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Item to {section.title}</span>
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ADD NEW SECTION BUTTONS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Add New Section to Resume
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'summary', label: '+ Summary' },
                { type: 'experience', label: '+ Work Experience' },
                { type: 'education', label: '+ Education' },
                { type: 'skills', label: '+ Skills' },
                { type: 'projects', label: '+ Projects' },
                { type: 'certifications', label: '+ Certifications' },
                { type: 'languages', label: '+ Languages' },
                { type: 'achievements', label: '+ Achievements' },
                { type: 'custom', label: '+ Custom Section' }
              ].map((s) => (
                <button
                  key={s.type}
                  onClick={() => addSection(s.type as SectionType)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Resume Preview */}
        <div className={`lg:col-span-6 sticky top-28 ${activeTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-slate-100/80 p-2 sm:p-4 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 px-2 text-xs text-slate-500 font-medium border-b border-slate-200 mb-3">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                Live Single-Column ATS Layout
              </span>
              <button
                onClick={() => setIsPrintPreview(true)}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                title="Open full print preview without inputs or buttons"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Preview</span>
              </button>
            </div>

            {/* Document Render Container */}
            <ResumeTemplateView resume={resume} styles={styles} />
          </div>
        </div>

      </div>

      {/* ========================================================
          AI BULLET REWRITE MODAL
          ======================================================== */}
      {aiBulletModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">AI Bullet Point Improver</h3>
                <p className="text-xs text-slate-500">Rewritten with active verbs and quantified business metrics</p>
              </div>
            </div>

            {/* Original */}
            <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-600 uppercase text-[10px] block mb-0.5">Original:</span>
              <p className="text-slate-800 italic">"{aiBulletModal.original}"</p>
            </div>

            {/* Improved */}
            <div className="mb-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-emerald-900 uppercase text-[10px]">Rewritten ATS-Optimized Version:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  Verb: {aiBulletModal.actionVerb}
                </span>
              </div>
              <p className="text-emerald-950 font-semibold leading-relaxed text-sm">
                {aiBulletModal.improved}
              </p>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-600 mb-5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <strong className="text-slate-900">Why this works:</strong> {aiBulletModal.explanation}
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAiBulletModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Original
              </button>
              <button
                onClick={() => {
                  aiBulletModal.onApply(aiBulletModal.improved);
                  setAiBulletModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Accept & Replace Bullet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          AI TAILOR TO JOB DESCRIPTION MODAL
          ======================================================== */}
      {showTailorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tailor Resume to Job Posting</h3>
                  <p className="text-xs text-slate-500">Align competencies and emphasize targeted technical keywords</p>
                </div>
              </div>
              <button
                onClick={() => setShowTailorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Job Description Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Target Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target Job Description or requirements section here..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleTailorToJd}
                  disabled={isTailoring || !jobDescription.trim()}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  {isTailoring && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isTailoring ? 'Analyzing JD...' : 'Analyze Match & Generate Suggestions'}</span>
                </button>
              </div>
            </div>

            {/* Tailor Results */}
            {tailorResults && (
              <div className="space-y-4 pt-2 border-t border-slate-200 text-xs">
                
                {/* Match Score */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="font-bold text-purple-900">JD Relevance Match Score:</span>
                  <span className="text-base font-extrabold text-purple-800">
                    {tailorResults.matchScore}/100
                  </span>
                </div>

                {/* Missing keywords to weave in */}
                {tailorResults.missingKeywords && tailorResults.missingKeywords.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="font-bold text-rose-900 block mb-1.5 uppercase text-[11px]">
                      Target Keywords to Incorporate:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResults.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white border border-rose-300 text-rose-900 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailoring Bullet Suggestions */}
                {tailorResults.tailoringSuggestions && tailorResults.tailoringSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 uppercase text-[11px] block">
                      Specific Bullet Tailoring Recommendations:
                    </span>
                    {tailorResults.tailoringSuggestions.map((sug, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <p className="text-slate-500 italic">" {sug.original} "</p>
                        <p className="text-slate-900 font-medium">
                          <strong className="text-emerald-700">Recommended: </strong> 
                          {sug.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key Advice */}
                {tailorResults.keyAdvice && (
                  <p className="p-3 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    💡 <strong>Executive Advice:</strong> {tailorResults.keyAdvice}
                  </p>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* LinkedIn Import Modal */}
      <LinkedInImportModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onImport={handleLinkedInImport}
        currentResume={resume}
      />

      {/* ========================================================
          PRINT PREVIEW MODE OVERLAY
          Pure Document View: Hides all UI buttons, headers, and form inputs
          ======================================================== */}
      {isPrintPreview && (
        <div 
          className="print-preview-modal fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xs flex flex-col select-text overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Print Preview"
        >
          {/* Top Floating Action Bar (Hidden during actual print via .no-print) */}
          <div className="no-print bg-slate-950 border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg z-20 shrink-0">
            {/* Left: Back to Edit & Document Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrintPreview(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 hover:border-slate-600"
                title="Exit Print Preview (Press Esc)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Editor</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
                  Esc
                </kbd>
              </button>

              <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
                <span className="text-xs font-bold text-slate-200">{resume.name}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800 font-medium">
                  Print Preview Mode
                </span>
              </div>
            </div>

            {/* Center: Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setPreviewZoom(prev => Math.max(50, prev - 10))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Zoom Out"
                disabled={previewZoom <= 50}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => setPreviewZoom(100)}
                className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-300 hover:text-white"
                title="Reset zoom to 100%"
              >
                {previewZoom}%
              </button>

              <button
                onClick={() => setPreviewZoom(prev => Math.min(150, prev + 10))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Zoom In"
                disabled={previewZoom >= 150}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Print & PDF Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const isAuthenticated = !!(user && !user.isAnonymous);
                  if (!isAuthenticated) {
                    setAuthActionReason('download');
                    setAuthModalMode('signup');
                    setPendingDownloadAction(() => () => window.print());
                    setShowAuthModal(true);
                    return;
                  }
                  window.print();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title={!(user && !user.isAnonymous) ? "Sign in / Sign up to print resume" : "Open browser print dialog (Ctrl+P / ⌘P)"}
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print Document</span>
              </button>

              <button
                onClick={() => handleDownloadResume('pdf')}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                title={!(user && !user.isAnonymous) ? "Sign in / Sign up to download ATS PDF" : "Download true vector PDF file"}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
                {!(user && !user.isAnonymous) && (
                  <span className="text-[10px] px-1 py-0.2 bg-blue-500/80 rounded font-normal text-blue-100 ml-0.5">
                    Sign in
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsPrintPreview(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                title="Close Print Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Sheet Canvas */}
          <div className="print-preview-canvas flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-10 flex flex-col items-center justify-start bg-slate-900/90">
            {/* Pure document status notification banner */}
            <div className="no-print mb-4 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Pure document layout view — All buttons, headers, and editor inputs hidden</span>
            </div>

            {/* Paper sheet container */}
            <div 
              className="w-full flex justify-center transition-transform duration-150 origin-top"
              style={{
                transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                transformOrigin: 'top center'
              }}
            >
              <div className="bg-white shadow-2xl ring-1 ring-black/10 rounded-xs">
                <ResumeTemplateView resume={resume} styles={styles} />
              </div>
            </div>

            {/* Helper footer hint */}
            <div className="no-print mt-6 mb-4 text-center text-xs text-slate-500">
              <span>Standard US Letter Document Layout • Single-Column ATS Optimized</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOTTOM DOCKED ACTION BAR (Save Version, Copy Text, Print Preview, Export PDF)
          ======================================================== */}
      {!isPrintPreview && (
        <div 
          id="builder-bottom-bar"
          className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 sm:px-8 py-3 transition-all"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Active Version Title, Template Name & ATS Score */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[160px] sm:max-w-[240px]">
                  {resume.name || 'Untitled Resume'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200 hidden sm:inline-block">
                  {AVAILABLE_TEMPLATES.find(t => t.id === styles.templateId)?.label || 'Template'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 border-l border-slate-200 pl-3">
                <span className="font-semibold text-slate-700 hidden xs:inline">ATS Score:</span>
                <div className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                  liveScore.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                  liveScore.overallScore >= 65 ? 'bg-blue-100 text-blue-800' :
                  liveScore.overallScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {liveScore.overallScore}/100
                </div>
              </div>

              {saveSuccessMsg && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {saveSuccessMsg}
                </span>
              )}
            </div>

            {/* Right: The 4 Requested Bottom Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Privacy Setting Toggle */}
              <button
                type="button"
                onClick={() => setIsPrivateVersion(prev => !prev)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                  isPrivateVersion
                    ? 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title={isPrivateVersion ? "This version will be saved as Private (Confidential). Click to toggle." : "This version will be saved as Standard. Click to make Private."}
              >
                {isPrivateVersion ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Standard</span>
                  </>
                )}
              </button>

              {/* 1. Save Version */}
              <button
                id="btn-save-version"
                onClick={handleSaveVersion}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
                title="Save current resume as a timestamped revision and sync to cloud"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>{saveSuccessMsg || (isSaving ? 'Saving...' : 'Save Version')}</span>
              </button>

              {/* 2. Copy Text */}
              <button
                id="btn-copy-text"
                onClick={handleCopyPlainText}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
                title="Copy ATS Plain Text format for online job portals & form fields"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {/* 3. Print Preview */}
              <button
                id="btn-print-preview"
                onClick={() => setIsPrintPreview(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                title="Toggle pure document print preview mode (hides all form controls)"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span>Print Preview</span>
              </button>

              {/* 4. Export PDF (with split menu for Word and Text) */}
              <div className="relative flex items-center">
                <button
                  id="btn-export-pdf"
                  onClick={() => handleDownloadResume('pdf')}
                  className="px-4 py-2 rounded-l-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  title={!(user && !user.isAnonymous) ? "Sign in / Sign up to download ATS PDF" : "Download ATS Vector PDF"}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                  {!(user && !user.isAnonymous) && (
                    <span className="ml-0.5 text-[10px] px-1.5 py-0.2 bg-blue-500/80 rounded font-normal text-blue-100">
                      Sign in
                    </span>
                  )}
                </button>

                <button
                  id="btn-export-menu-toggle"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-2 py-2 rounded-r-xl bg-blue-700 hover:bg-blue-800 text-white text-xs border-l border-blue-500/40 shadow-sm transition-all flex items-center justify-center"
                  title="More download formats (Word DOCX, Plain Text TXT)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Upward Dropdown Menu */}
                {showExportMenu && (
                  <div 
                    id="export-format-dropdown"
                    className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowExportMenu(false)}
                  >
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                      <span>Export Formats</span>
                      {!(user && !user.isAnonymous) && (
                        <span className="text-[10px] text-blue-600 font-medium">Account required</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownloadResume('pdf')}
                      className="w-full px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">ATS PDF Document</div>
                        <div className="text-[10px] text-slate-400">True vector PDF with clean ATS text layer</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadResume('docx')}
                      className="w-full px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Word Document (.doc)</div>
                        <div className="text-[10px] text-slate-400">Editable in Microsoft Word / Google Docs</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadResume('txt')}
                      className="w-full px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Plain Text (.txt)</div>
                        <div className="text-[10px] text-slate-400">Formatted for direct ATS paste fields</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Auth Modal for Download Gate */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingDownloadAction(null);
          setAuthActionReason('general');
        }}
        initialMode={authModalMode}
        actionReason={authActionReason}
        onSuccess={() => {
          if (pendingDownloadAction) {
            pendingDownloadAction();
            setPendingDownloadAction(null);
          }
        }}
      />

    </div>
  );
};
