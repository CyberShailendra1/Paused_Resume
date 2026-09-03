import React from 'react';
import { ResumeData, ResumeStyleSettings } from '../../types/resume';

interface TemplateProps {
  resume: ResumeData;
  styles: ResumeStyleSettings;
}

export const ResumeTemplateView: React.FC<TemplateProps> = ({ resume, styles }) => {
  const { templateId, fontSize, spacing, fontFamily, accentColor, textColor, backgroundColor } = styles;

  const bgColor = backgroundColor || '#ffffff';
  const mainTextColor = textColor || '#0f172a';
  const mainAccentColor = accentColor || '#0f172a';
  const secondaryTextStyle: React.CSSProperties = { color: mainTextColor, opacity: 0.82 };
  const metaTextStyle: React.CSSProperties = { color: mainTextColor, opacity: 0.70 };

  // Font family class
  const isSerifTemplate = templateId === 'ivy-executive' || templateId === 'academic-cv' || fontFamily === 'serif';
  const isMonoTemplate = templateId === 'minimalist-ats' || fontFamily === 'mono';
  const fontClass = isSerifTemplate
    ? 'font-serif'
    : isMonoTemplate
    ? 'font-mono'
    : 'font-sans';

  // Font size scale
  const sizeConfig = {
    compact: {
      name: 'text-xl',
      title: 'text-xs',
      contact: 'text-[11px]',
      secHeading: 'text-xs',
      subHeading: 'text-[12px]',
      body: 'text-[11px]',
      meta: 'text-[11px]',
      leading: 'leading-tight'
    },
    standard: {
      name: 'text-2xl',
      title: 'text-sm',
      contact: 'text-xs',
      secHeading: 'text-sm',
      subHeading: 'text-[13px]',
      body: 'text-xs',
      meta: 'text-xs',
      leading: 'leading-snug'
    },
    relaxed: {
      name: 'text-3xl',
      title: 'text-base',
      contact: 'text-sm',
      secHeading: 'text-base',
      subHeading: 'text-sm',
      body: 'text-[13px]',
      meta: 'text-xs',
      leading: 'leading-relaxed'
    }
  }[fontSize || 'standard'];

  // Spacing gaps
  const isCompactTemplate = templateId === 'compact-hybrid' || templateId === 'minimalist-ats';
  const effectiveSpacing = isCompactTemplate && spacing === 'spacious' ? 'normal' : spacing;

  const gapConfig = {
    tight: {
      sectionGap: 'mb-3',
      itemGap: 'mb-2',
      bulletGap: 'space-y-0.5',
      padding: 'p-6 sm:p-8'
    },
    normal: {
      sectionGap: isCompactTemplate ? 'mb-3' : 'mb-4',
      itemGap: isCompactTemplate ? 'mb-2' : 'mb-3',
      bulletGap: 'space-y-1',
      padding: 'p-8 sm:p-12'
    },
    spacious: {
      sectionGap: 'mb-6',
      itemGap: 'mb-4',
      bulletGap: 'space-y-1.5',
      padding: 'p-10 sm:p-14'
    }
  }[effectiveSpacing || 'normal'];

  // Dynamic line height from spacing setting
  const lineHeightConfig = {
    tight: 'leading-tight',
    normal: 'leading-normal',
    spacious: 'leading-relaxed'
  }[effectiveSpacing || 'normal'];

  // Contact links
  const contactParts: string[] = [];
  if (resume.contact.email) contactParts.push(resume.contact.email);
  if (resume.contact.phone) contactParts.push(resume.contact.phone);
  if (resume.contact.location) contactParts.push(resume.contact.location);
  if (resume.contact.linkedin) contactParts.push(resume.contact.linkedin.replace(/^https?:\/\//, ''));
  if (resume.contact.github) contactParts.push(resume.contact.github.replace(/^https?:\/\//, ''));
  if (resume.contact.website) contactParts.push(resume.contact.website.replace(/^https?:\/\//, ''));

  const isCenteredHeader = templateId === 'ivy-executive' || templateId === 'academic-cv';

  return (
    <div 
      id="resume-document-container"
      className={`w-full max-w-[850px] mx-auto shadow-lg print:shadow-none border border-slate-200/80 print:border-none min-h-[1050px] transition-all select-text ${fontClass} ${lineHeightConfig} ${gapConfig.padding}`}
      style={{ backgroundColor: bgColor, color: mainTextColor }}
    >
      {/* ========================================================
          HEADER (100% Single Column ATS-Safe)
          ======================================================== */}
      <header className={`pb-3.5 ${gapConfig.sectionGap} ${
        templateId === 'corporate-finance' 
          ? 'border-b-2 border-slate-900' 
          : templateId === 'nordic-clean'
          ? 'border-b border-slate-200'
          : 'border-b border-slate-300'
      } ${isCenteredHeader ? 'text-center' : 'text-left'}`}>
        
        {/* Silicon Valley Top Accent Bar */}
        {templateId === 'silicon-valley' && (
          <div 
            className="h-1.5 w-16 rounded-full mb-3" 
            style={{ backgroundColor: mainAccentColor }}
          />
        )}

        <h1 
          className={`font-bold tracking-tight ${sizeConfig.name} ${
            templateId === 'corporate-finance' ? 'uppercase tracking-wider' : ''
          }`}
          style={{ color: mainAccentColor }}
        >
          {resume.contact.fullName || 'Your Full Name'}
        </h1>

        {resume.contact.jobTitle && (
          <p 
            className={`font-medium mt-0.5 ${sizeConfig.title} ${
              templateId === 'academic-cv' ? 'italic' : ''
            }`}
            style={{ color: mainTextColor, opacity: 0.85 }}
          >
            {resume.contact.jobTitle}
          </p>
        )}

        {contactParts.length > 0 && (
          <div 
            className={`mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 ${sizeConfig.contact} ${
              isCenteredHeader ? 'justify-center' : 'justify-start'
            }`}
            style={{ color: mainTextColor, opacity: 0.75 }}
          >
            {contactParts.map((item, idx) => (
              <React.Fragment key={idx}>
                <span>{item}</span>
                {idx < contactParts.length - 1 && (
                  <span className="opacity-40 select-none">
                    {templateId === 'minimalist-ats' ? '|' : '•'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* ========================================================
          SECTIONS (Ordered List)
          ======================================================== */}
      <div className="space-y-4">
        {resume.sections.map((section) => {
          return (
            <section key={section.id} className={`${gapConfig.sectionGap} break-inside-avoid`}>
              
              {/* Section Title Header according to Template */}
              {templateId === 'corporate-finance' ? (
                <div className="border-b-2 border-slate-900 pb-0.5 mb-2">
                  <h2 
                    className={`font-bold tracking-wider uppercase text-slate-900 ${sizeConfig.secHeading}`}
                    style={{ color: accentColor || '#0f172a' }}
                  >
                    {section.title}
                  </h2>
                </div>
              ) : templateId === 'nordic-clean' ? (
                <div 
                  className="border-l-4 pl-2.5 py-0.5 mb-2.5"
                  style={{ borderColor: accentColor || '#3b82f6' }}
                >
                  <h2 
                    className={`font-semibold tracking-wide uppercase text-slate-800 ${sizeConfig.secHeading}`}
                    style={{ color: accentColor || '#1e293b' }}
                  >
                    {section.title}
                  </h2>
                </div>
              ) : templateId === 'silicon-valley' ? (
                <div className="border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
                  <h2 
                    className={`font-bold tracking-tight uppercase text-slate-900 ${sizeConfig.secHeading}`}
                    style={{ color: accentColor || '#1e293b' }}
                  >
                    {section.title}
                  </h2>
                  <div className="h-0.5 w-6 bg-slate-300 rounded" />
                </div>
              ) : (
                <div className="border-b border-slate-300 pb-1 mb-2">
                  <h2 
                    className={`font-bold tracking-wide uppercase text-slate-900 ${sizeConfig.secHeading}`}
                    style={{ color: accentColor || '#1e293b' }}
                  >
                    {section.title}
                  </h2>
                </div>
              )}

              {/* SECTION: SUMMARY */}
              {section.type === 'summary' && section.summaryText && (
                <p 
                  className={`text-justify leading-relaxed ${sizeConfig.body}`}
                  style={{ color: mainTextColor, opacity: 0.92 }}
                >
                  {section.summaryText}
                </p>
              )}

              {/* SECTION: EXPERIENCE */}
              {section.type === 'experience' && section.experienceItems && (
                <div className="space-y-3">
                  {section.experienceItems.map((exp) => (
                    <div key={exp.id} className={`${gapConfig.itemGap}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span 
                          className={`font-bold ${sizeConfig.subHeading}`}
                          style={{ color: mainTextColor }}
                        >
                          {exp.role}
                        </span>
                        <span 
                          className={`font-medium ${sizeConfig.meta}`}
                          style={{ color: mainTextColor, opacity: 0.70 }}
                        >
                          {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline justify-between mb-1" style={{ color: mainTextColor, opacity: 0.85 }}>
                        <span className={`italic font-medium ${sizeConfig.body}`}>
                          {exp.company}
                        </span>
                        {exp.location && (
                          <span className={`opacity-80 ${sizeConfig.meta}`}>
                            {exp.location}
                          </span>
                        )}
                      </div>

                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul 
                          className={`list-disc list-outside ml-4 ${gapConfig.bulletGap} ${sizeConfig.body}`}
                          style={{ color: mainTextColor, opacity: 0.90 }}
                        >
                          {exp.bullets.filter(b => b.trim()).map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION: EDUCATION */}
              {section.type === 'education' && section.educationItems && (
                <div className="space-y-2.5">
                  {section.educationItems.map((edu) => (
                    <div key={edu.id} className={`${gapConfig.itemGap}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span 
                          className={`font-bold ${sizeConfig.subHeading}`}
                          style={{ color: mainTextColor }}
                        >
                          {edu.institution}
                        </span>
                        <span 
                          className={`${sizeConfig.meta}`}
                          style={{ color: mainTextColor, opacity: 0.70 }}
                        >
                          {edu.startDate} – {edu.endDate}
                        </span>
                      </div>

                      <div className={`${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.85 }}>
                        <span>{edu.degree}</span>
                        {edu.fieldOfStudy && <span> in {edu.fieldOfStudy}</span>}
                        {edu.gpaOrHonors && <span className="opacity-80"> • {edu.gpaOrHonors}</span>}
                      </div>

                      {edu.bullets && edu.bullets.length > 0 && (
                        <ul 
                          className={`list-disc list-outside ml-4 mt-1 ${gapConfig.bulletGap} ${sizeConfig.body}`}
                          style={{ color: mainTextColor, opacity: 0.90 }}
                        >
                          {edu.bullets.filter(b => b.trim()).map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION: SKILLS */}
              {section.type === 'skills' && section.skillCategories && (
                <div className={`space-y-1 ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.92 }}>
                  {section.skillCategories.map((cat) => (
                    <div key={cat.id} className="flex flex-wrap">
                      <span className="font-bold mr-2 min-w-[140px]" style={{ color: mainTextColor }}>
                        {cat.categoryName}:
                      </span>
                      <span>
                        {cat.skills.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION: PROJECTS */}
              {section.type === 'projects' && section.projectItems && (
                <div className="space-y-2.5">
                  {section.projectItems.map((proj) => (
                    <div key={proj.id} className={`${gapConfig.itemGap}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <div className="flex items-baseline gap-2">
                          <span 
                            className={`font-bold ${sizeConfig.subHeading}`}
                            style={{ color: mainTextColor }}
                          >
                            {proj.name}
                          </span>
                          {proj.link && (
                            <span 
                              className={`font-mono ${sizeConfig.meta}`}
                              style={{ color: mainTextColor, opacity: 0.65 }}
                            >
                              ({proj.link})
                            </span>
                          )}
                        </div>
                        {proj.startDate && (
                          <span 
                            className={`${sizeConfig.meta}`}
                            style={{ color: mainTextColor, opacity: 0.70 }}
                          >
                            {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                          </span>
                        )}
                      </div>

                      {proj.technologies && proj.technologies.length > 0 && (
                        <p 
                          className={`italic mb-1 ${sizeConfig.meta}`}
                          style={{ color: mainTextColor, opacity: 0.75 }}
                        >
                          Tools: {proj.technologies.join(', ')}
                        </p>
                      )}

                      {proj.bullets && proj.bullets.length > 0 && (
                        <ul 
                          className={`list-disc list-outside ml-4 ${gapConfig.bulletGap} ${sizeConfig.body}`}
                          style={{ color: mainTextColor, opacity: 0.90 }}
                        >
                          {proj.bullets.filter(b => b.trim()).map((bullet, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION: CERTIFICATIONS */}
              {section.type === 'certifications' && section.certificationItems && (
                <ul className={`list-disc list-outside ml-4 space-y-1 ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.90 }}>
                  {section.certificationItems.map((cert) => (
                    <li key={cert.id} className="pl-1">
                      <span className="font-semibold" style={{ color: mainTextColor }}>{cert.name}</span>
                      <span style={{ color: mainTextColor, opacity: 0.70 }}> — {cert.issuer} ({cert.date})</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* SECTION: LANGUAGES */}
              {section.type === 'languages' && section.languageItems && (
                <div className={`flex flex-wrap gap-x-4 gap-y-1 ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.90 }}>
                  {section.languageItems.map((lang) => (
                    <span key={lang.id}>
                      <strong style={{ color: mainTextColor }}>{lang.language}:</strong> {lang.proficiency}
                    </span>
                  ))}
                </div>
              )}

              {/* SECTION: ACHIEVEMENTS */}
              {section.type === 'achievements' && section.achievementItems && (
                <ul className={`list-disc list-outside ml-4 space-y-1 ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.90 }}>
                  {section.achievementItems.map((ach) => (
                    <li key={ach.id} className="pl-1">
                      <strong style={{ color: mainTextColor }}>{ach.title}</strong>
                      {ach.date && <span className="font-normal" style={{ color: mainTextColor, opacity: 0.65 }}> ({ach.date})</span>}
                      <span>: {ach.description}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* SECTION: CUSTOM SECTION */}
              {section.type === 'custom' && section.customItems && (
                <div className="space-y-2">
                  {section.customItems.map((custom) => (
                    <div key={custom.id} className={`${gapConfig.itemGap}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span className={`font-bold ${sizeConfig.subHeading}`} style={{ color: mainTextColor }}>
                          {custom.title}
                        </span>
                        {custom.dateRange && (
                          <span className={`${sizeConfig.meta}`} style={{ color: mainTextColor, opacity: 0.70 }}>
                            {custom.dateRange}
                          </span>
                        )}
                      </div>

                      {custom.subtitle && (
                        <p className={`italic ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.85 }}>
                          {custom.subtitle}
                        </p>
                      )}

                      {custom.description && (
                        <p className={`mt-1 ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.90 }}>
                          {custom.description}
                        </p>
                      )}

                      {custom.bullets && custom.bullets.length > 0 && (
                        <ul className={`list-disc list-outside ml-4 mt-1 ${gapConfig.bulletGap} ${sizeConfig.body}`} style={{ color: mainTextColor, opacity: 0.90 }}>
                          {custom.bullets.filter(b => b.trim()).map((b, bIdx) => (
                            <li key={bIdx} className="pl-1">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </section>
          );
        })}
      </div>
    </div>
  );
};
