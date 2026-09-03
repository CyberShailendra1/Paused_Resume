import { jsPDF } from 'jspdf';
import { ResumeData, ResumeStyleSettings } from '../types/resume';

/**
 * Generates ATS-safe plain text version of resume
 */
export function generatePlainTextResume(resume: ResumeData): string {
  const lines: string[] = [];

  // Header
  lines.push(resume.contact.fullName.toUpperCase());
  if (resume.contact.jobTitle) lines.push(resume.contact.jobTitle);
  
  const contactDetails: string[] = [];
  if (resume.contact.email) contactDetails.push(resume.contact.email);
  if (resume.contact.phone) contactDetails.push(resume.contact.phone);
  if (resume.contact.location) contactDetails.push(resume.contact.location);
  if (resume.contact.linkedin) contactDetails.push(resume.contact.linkedin);
  if (resume.contact.website) contactDetails.push(resume.contact.website);
  if (resume.contact.github) contactDetails.push(resume.contact.github);
  
  if (contactDetails.length > 0) {
    lines.push(contactDetails.join(' | '));
  }
  lines.push('');

  // Sections
  for (const section of resume.sections) {
    lines.push('==================================================');
    lines.push(section.title.toUpperCase());
    lines.push('==================================================');

    if (section.type === 'summary' && section.summaryText) {
      lines.push(section.summaryText);
      lines.push('');
    } else if (section.type === 'experience' && section.experienceItems) {
      for (const item of section.experienceItems) {
        const dateRange = `${item.startDate} - ${item.current ? 'Present' : item.endDate}`;
        lines.push(`${item.role} | ${item.company} | ${item.location || ''} | ${dateRange}`);
        for (const bullet of item.bullets) {
          if (bullet.trim()) lines.push(`• ${bullet.trim()}`);
        }
        lines.push('');
      }
    } else if (section.type === 'education' && section.educationItems) {
      for (const item of section.educationItems) {
        const dateRange = `${item.startDate} - ${item.endDate}`;
        lines.push(`${item.degree}${item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''} | ${item.institution}`);
        if (item.gpaOrHonors) lines.push(`Honors/GPA: ${item.gpaOrHonors}`);
        lines.push(dateRange);
        if (item.bullets) {
          for (const bullet of item.bullets) {
            if (bullet.trim()) lines.push(`• ${bullet.trim()}`);
          }
        }
        lines.push('');
      }
    } else if (section.type === 'skills' && section.skillCategories) {
      for (const cat of section.skillCategories) {
        lines.push(`${cat.categoryName}: ${cat.skills.join(', ')}`);
      }
      lines.push('');
    } else if (section.type === 'projects' && section.projectItems) {
      for (const proj of section.projectItems) {
        lines.push(`${proj.name} ${proj.role ? `(${proj.role})` : ''} ${proj.link ? `[${proj.link}]` : ''}`);
        if (proj.technologies && proj.technologies.length > 0) {
          lines.push(`Technologies: ${proj.technologies.join(', ')}`);
        }
        for (const bullet of proj.bullets) {
          if (bullet.trim()) lines.push(`• ${bullet.trim()}`);
        }
        lines.push('');
      }
    } else if (section.type === 'certifications' && section.certificationItems) {
      for (const cert of section.certificationItems) {
        lines.push(`• ${cert.name} - ${cert.issuer} (${cert.date})`);
      }
      lines.push('');
    } else if (section.type === 'languages' && section.languageItems) {
      for (const lang of section.languageItems) {
        lines.push(`• ${lang.language} (${lang.proficiency})`);
      }
      lines.push('');
    } else if (section.type === 'achievements' && section.achievementItems) {
      for (const ach of section.achievementItems) {
        lines.push(`• ${ach.title}: ${ach.description} ${ach.date ? `(${ach.date})` : ''}`);
      }
      lines.push('');
    } else if (section.type === 'custom' && section.customItems) {
      for (const item of section.customItems) {
        lines.push(`${item.title} ${item.subtitle ? `| ${item.subtitle}` : ''} ${item.dateRange ? `| ${item.dateRange}` : ''}`);
        if (item.description) lines.push(item.description);
        for (const bullet of item.bullets) {
          if (bullet.trim()) lines.push(`• ${bullet.trim()}`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/**
 * Exports true vector ATS-safe PDF using jsPDF
 */
export function exportResumeToPDF(resume: ResumeData, styles: ResumeStyleSettings) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter' // 612 x 792 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 42;
  const contentWidth = pageWidth - (marginX * 2);
  let y = 48;

  // Font setup
  const isSerif = styles.fontFamily === 'serif' || styles.templateId === 'ivy-executive' || styles.templateId === 'academic-cv';
  const isMono = styles.fontFamily === 'mono' || styles.templateId === 'minimalist-ats';
  const baseFont = isSerif ? 'times' : isMono ? 'courier' : 'helvetica';
  const isCentered = styles.templateId === 'ivy-executive' || styles.templateId === 'academic-cv';
  doc.setFont(baseFont);

  // Accent color parsing for PDF
  let accentR = 15;
  let accentG = 23;
  let accentB = 42;
  if (styles.accentColor) {
    let cleanHex = styles.accentColor.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length === 6) {
      const parsedR = parseInt(cleanHex.substring(0, 2), 16);
      const parsedG = parseInt(cleanHex.substring(2, 4), 16);
      const parsedB = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(parsedR) && !isNaN(parsedG) && !isNaN(parsedB)) {
        accentR = parsedR;
        accentG = parsedG;
        accentB = parsedB;
      }
    }
  }

  // Text color parsing for PDF
  let textR = 30;
  let textG = 41;
  let textB = 59;
  if (styles.textColor) {
    let cleanHex = styles.textColor.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length === 6) {
      const parsedR = parseInt(cleanHex.substring(0, 2), 16);
      const parsedG = parseInt(cleanHex.substring(2, 4), 16);
      const parsedB = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(parsedR) && !isNaN(parsedG) && !isNaN(parsedB)) {
        textR = parsedR;
        textG = parsedG;
        textB = parsedB;
      }
    }
  }

  // Background tint parsing for PDF
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;
  const hasBgTint = Boolean(styles.backgroundColor && styles.backgroundColor.toLowerCase() !== '#ffffff');
  if (hasBgTint && styles.backgroundColor) {
    let cleanHex = styles.backgroundColor.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length === 6) {
      const parsedR = parseInt(cleanHex.substring(0, 2), 16);
      const parsedG = parseInt(cleanHex.substring(2, 4), 16);
      const parsedB = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(parsedR) && !isNaN(parsedG) && !isNaN(parsedB)) {
        bgR = parsedR;
        bgG = parsedG;
        bgB = parsedB;
      }
    }
  }

  const applyBackgroundTint = () => {
    if (hasBgTint) {
      doc.setFillColor(bgR, bgG, bgB);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }
  };

  applyBackgroundTint();

  // Helper: check page break
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 48) {
      doc.addPage();
      applyBackgroundTint();
      y = 48;
    }
  };

  // Header: Full Name
  doc.setFont(baseFont, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(accentR, accentG, accentB);
  
  if (isCentered) {
    doc.text(resume.contact.fullName, pageWidth / 2, y, { align: 'center' });
  } else {
    doc.text(resume.contact.fullName, marginX, y);
  }
  y += 20;

  // Header: Job Title
  if (resume.contact.jobTitle) {
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    if (isCentered) {
      doc.text(resume.contact.jobTitle, pageWidth / 2, y, { align: 'center' });
    } else {
      doc.text(resume.contact.jobTitle, marginX, y);
    }
    y += 16;
  }

  // Header: Contact Details line
  const contacts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin?.replace(/^https?:\/\//, ''),
    resume.contact.github?.replace(/^https?:\/\//, ''),
    resume.contact.website?.replace(/^https?:\/\//, '')
  ].filter(Boolean);

  if (contacts.length > 0) {
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const separator = styles.templateId === 'minimalist-ats' ? '  |  ' : '  •  ';
    const contactLine = contacts.join(separator);
    if (isCentered) {
      doc.text(contactLine, pageWidth / 2, y, { align: 'center' });
    } else {
      doc.text(contactLine, marginX, y);
    }
    y += 18;
  }

  // Divider line according to template
  if (styles.templateId === 'corporate-finance') {
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(1.2);
    doc.line(marginX, y, marginX + contentWidth, y);
    doc.setLineWidth(0.4);
    doc.line(marginX, y + 2.5, marginX + contentWidth, y + 2.5);
    y += 18;
  } else {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.75);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 16;
  }

  // Render Sections
  for (const section of resume.sections) {
    checkPageBreak(35);

    // Section Title
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(accentR, accentG, accentB);
    
    const sectionTitle = section.title.toUpperCase();
    doc.text(sectionTitle, marginX, y);
    y += 4;

    // Subtle underline for ATS readability
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(marginX, y + 2, marginX + contentWidth, y + 2);
    y += 14;

    // Reset for content
    doc.setFont(baseFont, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    if (section.type === 'summary' && section.summaryText) {
      const splitText = doc.splitTextToSize(section.summaryText, contentWidth);
      checkPageBreak(splitText.length * 13);
      doc.text(splitText, marginX, y);
      y += splitText.length * 13 + 10;
    } else if (section.type === 'experience' && section.experienceItems) {
      for (const item of section.experienceItems) {
        checkPageBreak(25);
        
        // Role and Company line
        doc.setFont(baseFont, 'bold');
        doc.text(item.role, marginX, y);
        
        const dateRange = `${item.startDate} - ${item.current ? 'Present' : item.endDate}`;
        doc.setFont(baseFont, 'normal');
        doc.text(dateRange, marginX + contentWidth, y, { align: 'right' });
        y += 12;

        doc.setFont(baseFont, 'italic');
        const companyLoc = `${item.company}${item.location ? ` — ${item.location}` : ''}`;
        doc.text(companyLoc, marginX, y);
        y += 12;

        // Bullets
        doc.setFont(baseFont, 'normal');
        for (const bullet of item.bullets) {
          if (!bullet.trim()) continue;
          const bulletLines = doc.splitTextToSize(bullet.trim(), contentWidth - 14);
          checkPageBreak(bulletLines.length * 12 + 4);
          
          doc.text('•', marginX + 4, y);
          doc.text(bulletLines, marginX + 14, y);
          y += bulletLines.length * 12 + 3;
        }
        y += 6;
      }
    } else if (section.type === 'education' && section.educationItems) {
      for (const item of section.educationItems) {
        checkPageBreak(22);
        doc.setFont(baseFont, 'bold');
        doc.text(item.institution, marginX, y);

        const dateRange = `${item.startDate} - ${item.endDate}`;
        doc.setFont(baseFont, 'normal');
        doc.text(dateRange, marginX + contentWidth, y, { align: 'right' });
        y += 12;

        const degreeLine = `${item.degree}${item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}${item.gpaOrHonors ? ` (${item.gpaOrHonors})` : ''}`;
        doc.text(degreeLine, marginX, y);
        y += 14;
      }
    } else if (section.type === 'skills' && section.skillCategories) {
      for (const cat of section.skillCategories) {
        checkPageBreak(15);
        doc.setFont(baseFont, 'bold');
        doc.text(`${cat.categoryName}: `, marginX, y);
        const prefixWidth = doc.getTextWidth(`${cat.categoryName}: `);
        
        doc.setFont(baseFont, 'normal');
        const skillText = cat.skills.join(', ');
        const wrappedSkills = doc.splitTextToSize(skillText, contentWidth - prefixWidth);
        doc.text(wrappedSkills, marginX + prefixWidth, y);
        y += wrappedSkills.length * 13 + 4;
      }
    } else if (section.type === 'projects' && section.projectItems) {
      for (const proj of section.projectItems) {
        checkPageBreak(25);
        doc.setFont(baseFont, 'bold');
        doc.text(proj.name, marginX, y);
        if (proj.link) {
          doc.setFont(baseFont, 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(` (${proj.link})`, marginX + doc.getTextWidth(proj.name), y);
          doc.setTextColor(40, 40, 40);
        }
        y += 12;

        if (proj.technologies && proj.technologies.length > 0) {
          doc.setFont(baseFont, 'italic');
          doc.text(`Tech: ${proj.technologies.join(', ')}`, marginX, y);
          doc.setFont(baseFont, 'normal');
          y += 12;
        }

        for (const bullet of proj.bullets) {
          if (!bullet.trim()) continue;
          const lines = doc.splitTextToSize(bullet.trim(), contentWidth - 14);
          checkPageBreak(lines.length * 12 + 3);
          doc.text('•', marginX + 4, y);
          doc.text(lines, marginX + 14, y);
          y += lines.length * 12 + 3;
        }
        y += 6;
      }
    } else if (section.type === 'certifications' && section.certificationItems) {
      for (const cert of section.certificationItems) {
        checkPageBreak(14);
        doc.text(`•  ${cert.name} — ${cert.issuer} (${cert.date})`, marginX + 4, y);
        y += 14;
      }
    } else if (section.type === 'custom' && section.customItems) {
      for (const item of section.customItems) {
        checkPageBreak(20);
        doc.setFont(baseFont, 'bold');
        doc.text(item.title, marginX, y);
        if (item.dateRange) {
          doc.setFont(baseFont, 'normal');
          doc.text(item.dateRange, marginX + contentWidth, y, { align: 'right' });
        }
        y += 12;

        if (item.description) {
          doc.setFont(baseFont, 'normal');
          const dLines = doc.splitTextToSize(item.description, contentWidth);
          doc.text(dLines, marginX, y);
          y += dLines.length * 12 + 4;
        }

        for (const b of item.bullets) {
          if (!b.trim()) continue;
          const bLines = doc.splitTextToSize(b.trim(), contentWidth - 14);
          checkPageBreak(bLines.length * 12 + 3);
          doc.text('•', marginX + 4, y);
          doc.text(bLines, marginX + 14, y);
          y += bLines.length * 12 + 3;
        }
        y += 6;
      }
    }

    y += 8;
  }

  // Trigger download
  const safeFilename = (resume.name || 'Resume').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  doc.save(`${safeFilename}_ats.pdf`);
}

/**
 * Download Plain Text file
 */
export function downloadPlainTextFile(resume: ResumeData) {
  const text = generatePlainTextResume(resume);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(resume.name || 'Resume').replace(/[^a-z0-9_-]/gi, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to escape HTML characters to prevent XSS / HTML injection in exported documents
 */
function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Download DOCX-compatible Word HTML document
 */
export function downloadDocxCompatibleFile(resume: ResumeData) {
  const text = generatePlainTextResume(resume);
  const safeTitle = escapeHtml(resume.contact.fullName || 'Resume');
  const safeBody = escapeHtml(text);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${safeTitle} - Resume</title>
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; margin: 1in; color: #111; }
h1 { font-size: 18pt; margin-bottom: 2pt; }
h2 { font-size: 12pt; border-bottom: 1pt solid #aaa; padding-bottom: 2pt; margin-top: 14pt; margin-bottom: 6pt; text-transform: uppercase; }
p { margin: 3pt 0; }
ul { margin: 3pt 0 8pt 18pt; padding: 0; }
li { margin-bottom: 2pt; }
.contact { font-size: 9.5pt; color: #555; margin-bottom: 12pt; }
.item-head { font-weight: bold; }
</style>
</head>
<body>
<pre style="font-family: Calibri, Arial, sans-serif; white-space: pre-wrap;">${safeBody}</pre>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(resume.name || 'Resume').replace(/[^a-z0-9_-]/gi, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
