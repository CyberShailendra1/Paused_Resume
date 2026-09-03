import React, { useEffect, useState } from 'react';
import { 
  Linkedin, Sparkles, Check, AlertCircle, RefreshCw, X, ArrowRight,
  Briefcase, GraduationCap, User, Wrench, FileText, CheckSquare, Square, Award
} from 'lucide-react';
import { ResumeData } from '../../types/resume';

export interface ParsedLinkedInData {
  contact: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    role: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    location?: string;
    startDate: string;
    endDate: string;
    gpaOrHonors?: string;
    bullets?: string[];
  }>;
  skills: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    data: ParsedLinkedInData, 
    mode: 'replace' | 'merge', 
    selectedSections: {
      contact: boolean;
      summary: boolean;
      experience: boolean;
      education: boolean;
      skills: boolean;
      certifications: boolean;
    }
  ) => void;
  currentResume: ResumeData;
}

const SAMPLE_PROFILES = [
  {
    name: 'Alex Chen (Staff Software Engineer)',
    url: 'https://www.linkedin.com/in/alex-chen-cloud-eng',
    text: `Alex Chen
Staff Software Engineer at Stripe | Ex-Airbnb | Distributed Systems & Cloud Architecture
San Francisco Bay Area • alex.chen@example.com • (555) 492-3810
linkedin.com/in/alex-chen-cloud-eng

About
Staff-level Software Engineer with 8+ years architecting fault-tolerant financial infrastructure and distributed systems. Expert in TypeScript, Go, React, Kafka, and AWS cloud primitives. Passionate about system latency, developer velocity, and zero-downtime database migrations.

Experience

Staff Software Engineer
Stripe • Full-time
Mar 2022 - Present • San Francisco, CA
• Architected multi-region real-time payment settlement pipeline processing $18B+ annually with 99.999% availability.
• Spearheaded migration from legacy Ruby services to high-throughput Go and gRPC microservices, reducing p99 tail latency by 48%.
• Mentored 12+ senior engineers across three teams and established standardized distributed tracing across 40+ microservices.

Senior Software Engineer
Airbnb
Jun 2018 - Feb 2022 • San Francisco, CA
• Engineered guest checkout experience using React, GraphQL, and Node.js, increasing checkout conversion by 3.2%.
• Optimized GraphQL federation query engine, saving $340K annually in cloud compute resources and reducing cache miss rate by 35%.
• Led a cross-functional incident response squad that reduced mean time to resolution (MTTR) by 50%.

Education

University of California, Berkeley
Bachelor of Science - BS, Computer Science
2014 - 2018
Activities and societies: Upsilon Pi Epsilon Honors Society, Cal Hacks Organizer
• Graduated with High Honors (GPA 3.86). Focus on Operating Systems and Distributed Computing.

Skills
Distributed Systems • TypeScript • Go (Golang) • React • Node.js • AWS Cloud • GraphQL • Apache Kafka • Kubernetes • Docker • PostgreSQL • System Design`
  },
  {
    name: 'Sarah Connor (Senior Product Manager)',
    url: 'https://www.linkedin.com/in/sarah-connor-pm',
    text: `Sarah Connor
Senior Product Manager • AI Platform & Enterprise Automation
Greater New York Area • sarah.connor@example.com • (555) 819-2041
linkedin.com/in/sarah-connor-pm

About
Data-driven Senior Product Manager with 6+ years driving enterprise AI and B2B SaaS workflows from zero-to-one and scale. Proven history of launching AI copilot features, growing ARR by $14M+, and collaborating with executive stakeholders.

Experience

Senior Product Manager - AI Platform
Datadog
Jan 2022 - Present • New York, NY
• Launched generative AI automated incident investigation assistant, reaching 45,000 weekly active enterprise engineers.
• Grew AI Platform product line annual recurring revenue (ARR) from $2M to $16M within 18 months.
• Defined product roadmap, customer discovery sprints, and telemetry metrics in close partnership with ML research leaders.

Product Manager
Twilio
Aug 2019 - Dec 2021 • New York, NY
• Spearheaded self-serve onboarding redesign for Voice API, improving developer activation rate from 18% to 31%.
• Conducted 100+ customer discovery interviews and led Agile scrum ceremonies with 14 engineers and designers.

Education

Columbia University
Master of Science - MS, Management Science & Engineering
2017 - 2019

University of Michigan
Bachelor of Arts - BA, Economics
2013 - 2017

Skills
Product Strategy • Enterprise SaaS • Generative AI • Roadmap Prioritization • SQL • User Research • Agile Scrum • Data Analytics • Cross-functional Leadership`
  }
];

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentResume
}) => {
  // Input form state
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [profileText, setProfileText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Extracted preview state
  const [extractedData, setExtractedData] = useState<ParsedLinkedInData | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [selectedSections, setSelectedSections] = useState({
    contact: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true
  });

  useEffect(() => {
    if (isOpen) {
      setProfileUrl('');
      setProfileText('');
      setExtractedData(null);
      setErrorMessage('');
      setImportMode('replace');
      setSelectedSections({
        contact: true,
        summary: true,
        experience: true,
        education: true,
        skills: true,
        certifications: true
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_PROFILES[sampleIndex];
    setProfileUrl(sample.url);
    setProfileText(sample.text);
    setErrorMessage('');
  };

  const handleExtract = async () => {
    if (!profileUrl.trim() && !profileText.trim()) {
      setErrorMessage('Please provide a LinkedIn profile URL or paste your profile text.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai/parse-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: profileUrl.trim(),
          text: profileText.trim()
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to parse LinkedIn details.');
      }

      setExtractedData(json.data);
    } catch (err: any) {
      console.warn('LinkedIn parse error:', err);
      const friendlyMsg = err?.message && !err.message.includes('fetch') && !err.message.includes('token') && !err.message.includes('Object') && !err.message.includes('JSON')
        ? err.message 
        : 'Unable to parse profile details at this time. Please check your pasted text or try again.';
      setErrorMessage(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!extractedData) return;
    onImport(extractedData, importMode, selectedSections);
    onClose();
  };

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="linkedin-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <Linkedin className="w-5 h-5" />
            </div>
            <div>
              <h3 id="linkedin-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                Import from LinkedIn
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  AI Pre-population
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Paste your LinkedIn URL or copied profile text to auto-fill experience & education.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 flex-1">
          
          {/* Step 1: Input Form (Shown when no extracted data yet) */}
          {!extractedData && (
            <div className="space-y-4">
              
              {/* Quick sample chips */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-blue-900 font-medium">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Try instantly with sample data:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SAMPLE_PROFILES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadSample(idx)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-blue-800 text-[11px] font-semibold transition-all hover:shadow-xs"
                    >
                      {sample.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* LinkedIn URL Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  LinkedIn Profile URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/your-username"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Example: <code className="text-blue-600">linkedin.com/in/alex-chen</code> or your custom profile link.
                </p>
              </div>

              {/* LinkedIn Profile Text Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    LinkedIn Profile Text or Sections
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {profileText.length > 0 ? `${profileText.length} characters` : 'Optional if URL provided'}
                  </span>
                </div>
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  placeholder="Paste your LinkedIn About, Experience, and Education sections here...
Tip: On your LinkedIn profile, select and copy (Ctrl+C / ⌘+C) your Experience and Education sections, or click 'More -> Save to PDF' and copy the text."
                  rows={6}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-mono leading-relaxed"
                />
              </div>

              {/* Helpful Tips Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  What gets extracted and pre-populated?
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 text-[11px]">
                  <li><strong>Contact Details:</strong> Full Name, Job Title, LinkedIn Link, Location, Email</li>
                  <li><strong>Work Experience:</strong> Companies, job titles, start & end dates, and bullet achievements</li>
                  <li><strong>Education:</strong> Universities, degrees, field of study, graduation dates</li>
                  <li><strong>Skills:</strong> Core competencies extracted into standard ATS keywords</li>
                </ul>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

            </div>
          )}

          {/* Step 2: Extracted Details Review (Shown when data is parsed) */}
          {extractedData && (
            <div className="space-y-4">
              
              {/* Success Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      Successfully Extracted Profile Details
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Review the parsed fields below and choose how to apply them to your resume.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline px-2 py-1"
                >
                  Edit Input
                </button>
              </div>

              {/* Section Checkboxes & Previews */}
              <div className="space-y-3">
                
                {/* 1. Contact Information Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  selectedSections.contact ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('contact')}>
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-blue-600">
                        {selectedSections.contact ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800">Contact Details</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {extractedData.contact.fullName} • {extractedData.contact.jobTitle}
                    </span>
                  </div>

                  {selectedSections.contact && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div><strong className="text-slate-700">Name:</strong> {extractedData.contact.fullName}</div>
                      <div><strong className="text-slate-700">Title:</strong> {extractedData.contact.jobTitle}</div>
                      <div><strong className="text-slate-700">Location:</strong> {extractedData.contact.location || 'Not specified'}</div>
                      <div><strong className="text-slate-700">LinkedIn:</strong> {extractedData.contact.linkedin}</div>
                      {extractedData.contact.email && <div><strong className="text-slate-700">Email:</strong> {extractedData.contact.email}</div>}
                      {extractedData.contact.phone && <div><strong className="text-slate-700">Phone:</strong> {extractedData.contact.phone}</div>}
                    </div>
                  )}
                </div>

                {/* 2. Professional Summary Card */}
                {extractedData.summary && (
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    selectedSections.summary ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('summary')}>
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-blue-600">
                          {selectedSections.summary ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        <FileText className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-bold text-slate-800">Professional Summary</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Included</span>
                    </div>

                    {selectedSections.summary && (
                      <p className="mt-2.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
                        "{extractedData.summary}"
                      </p>
                    )}
                  </div>
                )}

                {/* 3. Work Experience Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  selectedSections.experience ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('experience')}>
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-blue-600">
                        {selectedSections.experience ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <Briefcase className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Work Experience ({extractedData.experience.length} roles found)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600">
                      {selectedSections.experience ? 'Selected' : 'Skipped'}
                    </span>
                  </div>

                  {selectedSections.experience && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                      {extractedData.experience.map((exp, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 text-[11px] space-y-1">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{exp.role} @ {exp.company}</span>
                            <span className="text-slate-500 font-medium">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                              {exp.bullets.slice(0, 2).map((b, bIdx) => (
                                <li key={bIdx} className="truncate">{b}</li>
                              ))}
                              {exp.bullets.length > 2 && (
                                <li className="text-slate-400 italic">+{exp.bullets.length - 2} more bullet points</li>
                              )}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Education Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  selectedSections.education ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('education')}>
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-blue-600">
                        {selectedSections.education ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <GraduationCap className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Education ({extractedData.education.length} degrees found)
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600">
                      {selectedSections.education ? 'Selected' : 'Skipped'}
                    </span>
                  </div>

                  {selectedSections.education && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                      {extractedData.education.map((edu, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span>
                            <div className="text-slate-600">{edu.institution}</div>
                          </div>
                          <span className="text-slate-500 font-medium">{edu.startDate} - {edu.endDate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Skills Card */}
                {extractedData.skills && extractedData.skills.length > 0 && (
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    selectedSections.skills ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('skills')}>
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-blue-600">
                          {selectedSections.skills ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        <Wrench className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Skills & Competencies ({extractedData.skills.length} skills)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600">
                        {selectedSections.skills ? 'Selected' : 'Skipped'}
                      </span>
                    </div>

                    {selectedSections.skills && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {extractedData.skills.map((skill, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Certifications Card */}
                {extractedData.certifications && extractedData.certifications.length > 0 && (
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    selectedSections.certifications ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('certifications')}>
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-blue-600">
                          {selectedSections.certifications ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        <Award className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Certifications ({extractedData.certifications.length})
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600">
                        {selectedSections.certifications ? 'Selected' : 'Skipped'}
                      </span>
                    </div>
                    {selectedSections.certifications && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                        {extractedData.certifications.map((cert, idx) => (
                          <div key={idx}><strong className="text-slate-800">{cert.name}</strong>{cert.issuer ? ` • ${cert.issuer}` : ''}{cert.date ? ` • ${cert.date}` : ''}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Import Mode Radio Group */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  How would you like to apply these details?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                    importMode === 'replace' ? 'bg-white border-blue-500 shadow-xs text-slate-900' : 'bg-white/50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">Pre-populate Full Resume</div>
                      <p className="text-[11px] text-slate-500">Replaces current draft with clean LinkedIn profile data.</p>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                    importMode === 'merge' ? 'bg-white border-blue-500 shadow-xs text-slate-900' : 'bg-white/50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">Merge & Append</div>
                      <p className="text-[11px] text-slate-500">Keeps existing sections and appends new experience & education.</p>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          {!extractedData ? (
            <button
              type="button"
              onClick={handleExtract}
              disabled={isLoading || (!profileUrl.trim() && !profileText.trim())}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Details with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Analyze & Extract Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Resume Builder</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
