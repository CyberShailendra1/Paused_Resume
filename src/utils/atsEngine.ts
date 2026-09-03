import { 
  ATSAnalysisResult, 
  ATSIssue, 
  ResumeData, 
  SmartMatchRewrite, 
  ResumeSection, 
  ExperienceItem, 
  EducationItem, 
  SkillCategory, 
  ProjectItem, 
  CertificationItem 
} from '../types/resume';

// Common action verbs expected by ATS scanners
export const STRONG_ACTION_VERBS = new Set([
  'orchestrated', 'spearheaded', 'engineered', 'architected', 'accelerated',
  'optimized', 'formulated', 'streamlined', 'implemented', 'transformed',
  'generated', 'delivered', 'devised', 'pioneered', 'automated', 'deployed',
  'negotiated', 'maximized', 'mitigated', 'reduced', 'increased', 'developed',
  'designed', 'led', 'managed', 'executed', 'built', 'established', 'directed',
  'integrated', 'scaled', 'mentored', 'analyzed', 'audited', 'championed'
]);

// Passive / weak opener phrases that trigger ATS quality penalties
export const WEAK_PASSIVE_PHRASES = [
  { phrase: 'responsible for', fix: 'Replace with direct action verbs like "Directed", "Executed", or "Orchestrated".' },
  { phrase: 'duties included', fix: 'State your accomplishments directly starting with an action verb instead of listing duties.' },
  { phrase: 'assisted with', fix: 'Specify your exact contribution (e.g. "Co-authored", "Coordinated", or "Engineered").' },
  { phrase: 'helped to', fix: 'Use verbs that convey ownership such as "Contributed to", "Facilitated", or "Supported".' },
  { phrase: 'worked on', fix: 'Specify what you built or improved (e.g. "Developed", "Constructed", or "Refactored").' },
  { phrase: 'handled the', fix: 'Use stronger managerial verbs like "Administered", "Resolved", or "Oversaw".' },
  { phrase: 'tasked with', fix: 'Express proactive ownership: "Initiated", "Executed", or "Managed".' }
];

// Standard section names for ATS
export const STANDARD_SECTION_NAMES = [
  'Summary',
  'Experience',
  'Work Experience',
  'Professional Experience',
  'Education',
  'Skills',
  'Technical Skills',
  'Projects',
  'Certifications',
  'Licenses & Certifications',
  'Achievements',
  'Languages'
];

export const NON_STANDARD_TITLES = [
  { pattern: /my\s+story|who\s+i\s+am|about\s+me/i, suggestion: 'Professional Summary' },
  { pattern: /where\s+i'?ve\s+been|my\s+journey|work\s+history/i, suggestion: 'Work Experience' },
  { pattern: /things\s+i\s+know|what\s+i\s+do|toolbelt|competencies/i, suggestion: 'Skills' },
  { pattern: /academic\s+path|schooling/i, suggestion: 'Education' },
  { pattern: /side\s+hustles|creations/i, suggestion: 'Projects' }
];

// Curated comprehensive tech & domain keyword catalog for JD matching
export const COMMON_KEYWORDS_CATALOG = [
  'python', 'javascript', 'typescript', 'react', 'node.js', 'express', 'sql', 'postgresql',
  'mongodb', 'aws', 'docker', 'kubernetes', 'ci/cd', 'git', 'linux', 'rest api', 'graphql',
  'agile', 'scrum', 'jira', 'microservices', 'unit testing', 'cybersecurity', 'siem', 'soc',
  'incident response', 'penetration testing', 'wireshark', 'splunk', 'firewall', 'cloud security',
  'data analysis', 'pandas', 'numpy', 'machine learning', 'devops', 'terraform', 'ansible',
  'leadership', 'cross-functional', 'stakeholder management', 'problem solving', 'system architecture',
  'performance optimization', 'scalability', 'automated testing', 'compliance', 'hipaa', 'gdpr', 'iso 27001'
];

/**
 * Deterministic, rule-based ATS analysis on raw resume text or structured resume data
 */
export function analyzeResumeATS(resumeText: string, jobDescriptionText: string = ''): ATSAnalysisResult {
  const lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const issues: ATSIssue[] = [];

  // ==========================================
  // 1. FORMAT ANALYSIS (DETERMINISTIC)
  // ==========================================
  let formatDeductions = 0;

  // A. Multi-column layout detection
  // Multi-column resumes pasted into text often have multiple pipe-delimited columns, large tab clusters, or side-by-side parallel text
  const multiColumnLines = lines.filter(l => (l.match(/\|/g) || []).length >= 3 || /\t{2,}/.test(l) || /\s{5,}(?:Experience|Education|Skills|Summary)/i.test(l));
  if (multiColumnLines.length > 2) {
    formatDeductions += 18;
    issues.push({
      id: 'format-multi-column',
      category: 'format',
      severity: 'critical',
      title: 'Multi-column or Side-by-Side Layout Detected',
      before: `Found lines with multiple column delimiters or parallel section headers: "${multiColumnLines[0].slice(0, 65)}..."`,
      fix: 'Reorganize your resume into a strictly single-column linear layout. ATS parsers read horizontally left-to-right and jumble multi-column text across roles.',
      impactScore: 18
    });
  }

  // B. Table & grid detection
  const tableMarkers = lines.filter(l => 
    /^[+\-|]{3,}/.test(l) || 
    /\|.*\|.*\|/.test(l) || 
    /<table|<\/table>|<tr|<td/i.test(l)
  );
  if (tableMarkers.length > 0) {
    formatDeductions += 15;
    issues.push({
      id: 'format-tables',
      category: 'format',
      severity: 'critical',
      title: 'Tables or Grid Structures Used',
      before: `Table formatting detected: "${tableMarkers[0].slice(0, 50)}"`,
      fix: 'Remove all table borders and tabular layouts. Replace with standard bold headers, tab stops, or bullet lists.',
      impactScore: 15
    });
  }

  // C. Icons, images, photo placeholders, or emojis
  const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;
  const imageMarkers = lines.filter(l => 
    emojiRegex.test(l) || 
    /\[(?:image|photo|picture|icon|logo|avatar)\]/i.test(l) ||
    /\b(?:profile photo|headshot)\b/i.test(l)
  );
  if (imageMarkers.length > 0) {
    formatDeductions += 12;
    issues.push({
      id: 'format-images-icons',
      category: 'format',
      severity: 'warning',
      title: 'Images, Icons, or Emojis Detected',
      before: `Found visual glyph or image marker: "${imageMarkers[0].slice(0, 55)}"`,
      fix: 'Eliminate all headshots, contact icons (phone/envelope icons), and emojis. Many ATS systems (like Taleo and Workday) corrupt files with embedded graphics.',
      impactScore: 12
    });
  }

  // D. Rating graphics / skill bars
  const skillBarMarkers = lines.filter(l => 
    /[●○■□★☆]{3,}/.test(l) || 
    /\b(?:proficiency|rating):\s*(?:\d+\/5|\d+%\s*bar)/i.test(l)
  );
  if (skillBarMarkers.length > 0) {
    formatDeductions += 10;
    issues.push({
      id: 'format-skill-bars',
      category: 'format',
      severity: 'warning',
      title: 'Skill Rating Bars / Visual Dots',
      before: `Visual skill gauge detected: "${skillBarMarkers[0].slice(0, 45)}"`,
      fix: 'Remove visual progress bars and dot ratings. ATS cannot interpret graphical ratings; list skills as comma-separated text grouped by category.',
      impactScore: 10
    });
  }

  // E. Header/Footer contamination (e.g. Page numbers, repeated name headers)
  const headerFooterLines = lines.filter(l => /page\s+\d+\s+of\s+\d+/i.test(l) || /^--+\s*page\s*\d+/i.test(l));
  if (headerFooterLines.length > 0) {
    formatDeductions += 8;
    issues.push({
      id: 'format-header-footer',
      category: 'format',
      severity: 'suggestion',
      title: 'Header / Footer Text Contamination',
      before: `Header/footer pagination line found: "${headerFooterLines[0]}"`,
      fix: 'Remove explicit "Page X of Y" or header text blocks. ATS parsers frequently interlace header lines directly into the middle of your work experience.',
      impactScore: 8
    });
  }

  // F. Non-standard section titles
  for (const ns of NON_STANDARD_TITLES) {
    const match = lines.find(l => ns.pattern.test(l));
    if (match) {
      formatDeductions += 6;
      issues.push({
        id: `format-title-${match.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'format',
        severity: 'warning',
        title: `Non-Standard Section Title: "${match}"`,
        before: `Section header reads "${match}"`,
        fix: `Rename this heading to "${ns.suggestion}". ATS parsing algorithms look for strict industry-standard section keywords.`,
        impactScore: 6
      });
      break;
    }
  }

  const formatScore = Math.max(10, 100 - formatDeductions);

  // ==========================================
  // 2. SECTION COMPLETENESS
  // ==========================================
  let completenessScore = 100;
  const sectionsStatus: Record<string, { present: boolean; title: string }> = {
    summary: { present: false, title: 'Professional Summary' },
    experience: { present: false, title: 'Work Experience' },
    education: { present: false, title: 'Education' },
    skills: { present: false, title: 'Skills' },
    projects: { present: false, title: 'Projects' },
    certifications: { present: false, title: 'Certifications' }
  };

  const textLower = resumeText.toLowerCase();

  if (/(?:professional\s+)?summary|career\s+objective|profile|overview/i.test(resumeText)) {
    sectionsStatus.summary.present = true;
  } else {
    completenessScore -= 15;
    issues.push({
      id: 'comp-summary-missing',
      category: 'completeness',
      severity: 'warning',
      title: 'Missing Professional Summary',
      before: 'Resume starts directly with experience without an executive summary.',
      fix: 'Add a 3-4 sentence Professional Summary at the top highlighting your years of experience, core technical specialties, and biggest career win.',
      impactScore: 15
    });
  }

  if (/(?:work|professional)\s+experience|employment\s+history|experience\b/i.test(resumeText)) {
    sectionsStatus.experience.present = true;
  } else {
    completenessScore -= 30;
    issues.push({
      id: 'comp-exp-missing',
      category: 'completeness',
      severity: 'critical',
      title: 'Work Experience Section Not Clearly Detected',
      before: 'No recognizable "Work Experience" or "Professional Experience" header found.',
      fix: 'Create a clear section titled "Work Experience" with reverse-chronological job entries including Job Title, Company, Dates, and bullet points.',
      impactScore: 30
    });
  }

  if (/education|academic\s+background|degrees?/i.test(resumeText)) {
    sectionsStatus.education.present = true;
  } else {
    completenessScore -= 20;
    issues.push({
      id: 'comp-edu-missing',
      category: 'completeness',
      severity: 'critical',
      title: 'Missing Education Section',
      before: 'No degree or university history detected.',
      fix: 'Add an "Education" section specifying Degree, Major/Field of Study, Institution Name, and Graduation Year.',
      impactScore: 20
    });
  }

  if (/\bskills\b|technical\s+skills|core\s+competencies/i.test(resumeText)) {
    sectionsStatus.skills.present = true;
  } else {
    completenessScore -= 20;
    issues.push({
      id: 'comp-skills-missing',
      category: 'completeness',
      severity: 'critical',
      title: 'Missing Dedicated Skills Section',
      before: 'No explicit "Skills" section found to index core capabilities.',
      fix: 'Add a dedicated "Skills" section categorizing your technical proficiencies (e.g., Languages, Frameworks, Cloud, Methodologies).',
      impactScore: 20
    });
  }

  if (/projects?|key\s+projects|portfolio/i.test(resumeText)) {
    sectionsStatus.projects.present = true;
  } else {
    completenessScore -= 8;
    issues.push({
      id: 'comp-proj-missing',
      category: 'completeness',
      severity: 'suggestion',
      title: 'Missing Projects Section',
      before: 'No dedicated project highlights included.',
      fix: 'Add a "Projects" section to demonstrate hands-on application of in-demand technologies and concrete delivery outcomes.',
      impactScore: 8
    });
  }

  if (/certifications?|licenses?|credentials?/i.test(resumeText)) {
    sectionsStatus.certifications.present = true;
  } else {
    completenessScore -= 7;
    issues.push({
      id: 'comp-cert-missing',
      category: 'completeness',
      severity: 'suggestion',
      title: 'Missing Certifications Section',
      before: 'No professional certifications or industry licenses listed.',
      fix: 'Include a "Certifications" section listing accredited credentials (e.g. AWS Certified, CISSP, PMP, CompTIA) with issuance dates.',
      impactScore: 7
    });
  }

  completenessScore = Math.max(10, completenessScore);

  // ==========================================
  // 3. CONTENT QUALITY ANALYSIS
  // ==========================================
  let qualityScore = 100;
  const bullets = lines.filter(l => /^[-*•–—]\s*/.test(l) || /^\d+\.\s*/.test(l));
  
  // A. Check for metrics / quantified data in bullet points (numbers, %, $, x boost)
  const metricRegex = /\b\d+(?:[\.,]\d+)?%|\$\d+(?:[\.,]\d+)?(?:k|m|b)?|\b\d+\+?\s*(?:users|clients|team\s*members|hours|days|weeks|engineers|microservices|servers|requests|leads|percent)\b|\b\d+x\b/i;
  let bulletsWithoutMetrics = 0;
  let sampleWeakMetricBullet = '';

  bullets.forEach(b => {
    if (!metricRegex.test(b)) {
      bulletsWithoutMetrics++;
      if (!sampleWeakMetricBullet && b.length > 25) {
        sampleWeakMetricBullet = b;
      }
    }
  });

  const bulletCount = bullets.length || Math.max(3, Math.round(lines.length / 4));
  const metricsRatio = (bulletCount - bulletsWithoutMetrics) / Math.max(1, bulletCount);

  if (metricsRatio < 0.4) {
    const penalty = Math.round((0.5 - metricsRatio) * 35);
    qualityScore -= penalty;
    issues.push({
      id: 'quality-missing-metrics',
      category: 'quality',
      severity: 'warning',
      title: 'Bullet Points Lack Quantified Metrics & Outcomes',
      before: sampleWeakMetricBullet 
        ? `Unquantified bullet: "${sampleWeakMetricBullet.slice(0, 70)}..."` 
        : 'Multiple bullets describe duties without stating measured business results.',
      fix: 'Quantify impact using the formula: [Action Verb] + [What You Did] + [Measured Outcome (%, $, hours saved, scale)]. E.g. "Accelerated API response time by 42% across 250k daily active users."',
      impactScore: 15
    });
  }

  // B. Check for passive / weak opening phrases
  let passiveOccurrences: string[] = [];
  for (const wp of WEAK_PASSIVE_PHRASES) {
    if (textLower.includes(wp.phrase)) {
      passiveOccurrences.push(wp.phrase);
      qualityScore -= 6;
      issues.push({
        id: `quality-passive-${wp.phrase.replace(/\s+/g, '-')}`,
        category: 'quality',
        severity: 'warning',
        title: `Passive Phrasing Found: "${wp.phrase}"`,
        before: `Resume uses passive phrasing: "...${wp.phrase}..."`,
        fix: wp.fix,
        impactScore: 6
      });
      if (passiveOccurrences.length >= 2) break;
    }
  }

  // C. Action verb check on bullet points
  let bulletsStartingWithoutActionVerb = 0;
  let sampleNoVerbBullet = '';
  bullets.forEach(b => {
    const firstWord = b.replace(/^[-*•–—\d\.\s]+/, '').split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (firstWord && !STRONG_ACTION_VERBS.has(firstWord)) {
      bulletsStartingWithoutActionVerb++;
      if (!sampleNoVerbBullet && b.length > 20) {
        sampleNoVerbBullet = b;
      }
    }
  });

  if (bulletsStartingWithoutActionVerb > Math.max(1, bulletCount * 0.45)) {
    qualityScore -= 12;
    issues.push({
      id: 'quality-action-verbs',
      category: 'quality',
      severity: 'warning',
      title: 'Weak or Missing Initial Action Verbs',
      before: sampleNoVerbBullet 
        ? `Bullet does not start with strong past-tense verb: "${sampleNoVerbBullet.slice(0, 65)}..."` 
        : 'Over 40% of bullet points start with nouns, conjunctions, or filler text.',
      fix: 'Start every accomplishment bullet with a high-impact past-tense power verb like "Architected", "Spearheaded", "Revamped", "Engineered", or "Automated".',
      impactScore: 12
    });
  }

  qualityScore = Math.max(20, Math.min(100, qualityScore));

  // ==========================================
  // 4. KEYWORD MATCH SCORE (AGAINST JOB DESCRIPTION)
  // ==========================================
  let keywordScore = 80; // Default reasonable score if no JD provided
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let totalJdKeywords = 0;

  if (jobDescriptionText.trim().length > 30) {
    const jdLower = jobDescriptionText.toLowerCase();
    
    // Extract potential tech skills & keywords from JD using catalog + regex
    const detectedJdKeywords = new Set<string>();
    
    COMMON_KEYWORDS_CATALOG.forEach(kw => {
      if (jdLower.includes(kw)) {
        detectedJdKeywords.add(kw);
      }
    });

    // Also pick out 3+ letter capitalized tech acronyms or words from JD
    const techWords = jobDescriptionText.match(/\b[A-Z][a-zA-Z0-9\+\#\.\-]{2,}\b/g) || [];
    techWords.slice(0, 25).forEach(w => {
      const clean = w.toLowerCase();
      if (!['and', 'the', 'with', 'for', 'you', 'will', 'this', 'that', 'from', 'have'].includes(clean)) {
        detectedJdKeywords.add(clean);
      }
    });

    totalJdKeywords = detectedJdKeywords.size;
    
    detectedJdKeywords.forEach(kw => {
      if (textLower.includes(kw)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    if (totalJdKeywords > 0) {
      keywordScore = Math.round((matchedKeywords.length / totalJdKeywords) * 100);
      
      if (missingKeywords.length > 0) {
        issues.push({
          id: 'keyword-missing-important',
          category: 'keyword',
          severity: missingKeywords.length > 4 ? 'critical' : 'warning',
          title: `${missingKeywords.length} Critical Job Description Keywords Missing`,
          before: `Target JD requires competencies not detected in resume: [${missingKeywords.slice(0, 5).join(', ')}]`,
          fix: `Naturally weave these missing high-priority keywords into your Skills list and Experience bullet points: ${missingKeywords.slice(0, 6).join(', ')}.`,
          impactScore: Math.min(25, missingKeywords.length * 4)
        });
      }
    }
  } else {
    // If no JD is provided, evaluate based on density of industry recognized keywords
    const catalogMatches = COMMON_KEYWORDS_CATALOG.filter(kw => textLower.includes(kw));
    matchedKeywords = catalogMatches.slice(0, 15);
    missingKeywords = COMMON_KEYWORDS_CATALOG.filter(kw => !textLower.includes(kw)).slice(0, 8);
    keywordScore = Math.min(95, Math.max(50, Math.round((catalogMatches.length / 15) * 100)));
  }

  // ==========================================
  // OVERALL WEIGHTED ATS SCORE
  // ==========================================
  // Weights: Format 30%, Keywords 25%, Completeness 25%, Quality 20%
  const overallScore = Math.round(
    (formatScore * 0.30) +
    (keywordScore * 0.25) +
    (completenessScore * 0.25) +
    (qualityScore * 0.20)
  );

  return {
    overallScore: Math.min(100, Math.max(15, overallScore)),
    formatScore,
    keywordScore,
    completenessScore,
    qualityScore,
    issues,
    matchedKeywords,
    missingKeywords,
    totalJdKeywords,
    sectionsStatus,
    stats: {
      wordCount: resumeText.split(/\s+/).filter(Boolean).length,
      bulletCount,
      metricsCount: bulletCount - bulletsWithoutMetrics,
      actionVerbsCount: bulletCount - bulletsStartingWithoutActionVerb
    }
  };
}

/**
 * Accurately parses raw resume text into structured ResumeData for the Resume Builder,
 * preserving all authentic details (contact, summary, actual jobs, education, skills, projects, certifications)
 * and optionally applying Smart Match action-oriented rewrites.
 */
export function convertTextToResumeData(rawText: string, appliedRewrites?: SmartMatchRewrite[]): ResumeData {
  if (!rawText || !rawText.trim()) {
    return createEmptyResumeData();
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Extract Contact Info
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/i);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i);
  const websiteMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:com|dev|io|org|me|net)(?:\/[^\s]*)?/i);
  const locationMatch = rawText.match(/(?:Location|Based in|Address):\s*([A-Za-z\s,]+)/i) ||
    rawText.match(/\b([A-Z][a-zA-Z\s.-]+,\s*(?:[A-Z]{2}|California|New York|Texas|Washington|United States|UK|Canada|Germany|India|Australia))\b/);

  // Determine Full Name (usually first line or non-contact header line)
  let fullName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const candidate = lines[i];
    if (
      candidate.length > 2 &&
      candidate.length < 45 &&
      !candidate.includes('@') &&
      !candidate.includes('http') &&
      !phoneMatch?.includes(candidate) &&
      !/^(resume|curriculum|cv|summary|experience|skills|contact|profile)/i.test(candidate)
    ) {
      fullName = candidate.replace(/^(name:\s*)/i, '').trim();
      break;
    }
  }
  if (!fullName) fullName = 'Professional Candidate';

  // Determine Job Title (usually second line or near name)
  let jobTitle = '';
  const titleKeywords = ['Engineer', 'Developer', 'Architect', 'Manager', 'Analyst', 'Specialist', 'Lead', 'Consultant', 'Administrator', 'Director', 'Officer', 'Designer', 'Scientist'];
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const candidate = lines[i];
    if (candidate !== fullName && titleKeywords.some(kw => candidate.toLowerCase().includes(kw.toLowerCase())) && candidate.length < 60) {
      jobTitle = candidate.replace(/^(title|headline|role):\s*/i, '').trim();
      break;
    }
  }
  if (!jobTitle) jobTitle = 'Technology Professional';

  // 2. Identify Section Boundaries
  const sectionHeaderMap: Array<{ pattern: RegExp; type: string; title: string }> = [
    { pattern: /^(?:professional\s+)?summary|profile|about\s+me|objective/i, type: 'summary', title: 'Professional Summary' },
    { pattern: /^(?:work\s+|professional\s+|employment\s+)?experience|work\s+history|career\s+history/i, type: 'experience', title: 'Work Experience' },
    { pattern: /^education|academic\s+background|qualifications/i, type: 'education', title: 'Education' },
    { pattern: /^(?:technical\s+|core\s+)?skills|competencies|technologies|tools/i, type: 'skills', title: 'Technical Skills' },
    { pattern: /^(?:key\s+|featured\s+)?projects|portfolio/i, type: 'projects', title: 'Key Projects' },
    { pattern: /^certifications|licenses|credentials/i, type: 'certifications', title: 'Certifications' },
    { pattern: /^languages/i, type: 'languages', title: 'Languages' },
    { pattern: /^achievements|awards|honors/i, type: 'achievements', title: 'Key Achievements' }
  ];

  interface RawSectionBlock {
    type: string;
    title: string;
    lines: string[];
  }

  const blocks: RawSectionBlock[] = [];
  let currentBlock: RawSectionBlock = { type: 'header_content', title: 'Header', lines: [] };

  for (const line of lines) {
    const matchedHeader = sectionHeaderMap.find(sec => {
      const clean = line.replace(/[:\-=_#]/g, '').trim();
      return sec.pattern.test(clean) && clean.length < 40;
    });

    if (matchedHeader) {
      if (currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        type: matchedHeader.type,
        title: matchedHeader.title,
        lines: []
      };
    } else {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  // 3. Build Resume Sections from Extracted Blocks
  const sections: ResumeSection[] = [];

  // A. Summary
  const summaryBlock = blocks.find(b => b.type === 'summary');
  if (summaryBlock && summaryBlock.lines.length > 0) {
    sections.push({
      id: 'sec-summary',
      type: 'summary',
      title: summaryBlock.title,
      summaryText: summaryBlock.lines.join(' ')
    });
  } else {
    // Check if there are introductory lines in header_content that look like a summary
    const headerBlock = blocks.find(b => b.type === 'header_content');
    const potentialSummaryLines = headerBlock?.lines.filter(l => 
      l.length > 50 && 
      !l.includes('@') && 
      !phoneMatch?.includes(l) && 
      !l.includes('http')
    );
    if (potentialSummaryLines && potentialSummaryLines.length > 0) {
      sections.push({
        id: 'sec-summary',
        type: 'summary',
        title: 'Professional Summary',
        summaryText: potentialSummaryLines.join(' ')
      });
    }
  }

  // B. Work Experience
  const expBlock = blocks.find(b => b.type === 'experience');
  if (expBlock && expBlock.lines.length > 0) {
    const expItems = parseExperienceLines(expBlock.lines, appliedRewrites);
    if (expItems.length > 0) {
      sections.push({
        id: 'sec-experience',
        type: 'experience',
        title: expBlock.title,
        experienceItems: expItems
      });
    }
  }

  // C. Education
  const eduBlock = blocks.find(b => b.type === 'education');
  if (eduBlock && eduBlock.lines.length > 0) {
    const eduItems = parseEducationLines(eduBlock.lines);
    if (eduItems.length > 0) {
      sections.push({
        id: 'sec-education',
        type: 'education',
        title: eduBlock.title,
        educationItems: eduItems
      });
    }
  }

  // D. Skills
  const skillsBlock = blocks.find(b => b.type === 'skills');
  if (skillsBlock && skillsBlock.lines.length > 0) {
    const categories = parseSkillsLines(skillsBlock.lines);
    if (categories.length > 0) {
      sections.push({
        id: 'sec-skills',
        type: 'skills',
        title: skillsBlock.title,
        skillCategories: categories
      });
    }
  }

  // E. Projects
  const projBlock = blocks.find(b => b.type === 'projects');
  if (projBlock && projBlock.lines.length > 0) {
    const projItems = parseProjectsLines(projBlock.lines);
    if (projItems.length > 0) {
      sections.push({
        id: 'sec-projects',
        type: 'projects',
        title: projBlock.title,
        projectItems: projItems
      });
    }
  }

  // F. Certifications
  const certBlock = blocks.find(b => b.type === 'certifications');
  if (certBlock && certBlock.lines.length > 0) {
    const certItems = parseCertificationsLines(certBlock.lines);
    if (certItems.length > 0) {
      sections.push({
        id: 'sec-certifications',
        type: 'certifications',
        title: certBlock.title,
        certificationItems: certItems
      });
    }
  }

  // Fallback: If no experience section was detected, provide a clean starter experience item
  const hasExperience = sections.some(s => s.type === 'experience');
  if (!hasExperience) {
    sections.push({
      id: `sec-experience-${Date.now()}`,
      type: 'experience',
      title: 'Work Experience',
      experienceItems: [
        {
          id: `exp-${Date.now()}-1`,
          role: jobTitle,
          company: 'Recent Organization',
          location: locationMatch ? locationMatch[1] : 'City, State',
          startDate: '2022',
          endDate: 'Present',
          current: true,
          bullets: appliedRewrites && appliedRewrites.length > 0 
            ? appliedRewrites.map(r => r.rewrittenBullet)
            : ['Engineered scalable business solutions driving 25% operational efficiency improvements.']
        }
      ]
    });
  }

  // Fallback: If no skills section was detected, parse common skills mentioned throughout text
  const hasSkills = sections.some(s => s.type === 'skills');
  if (!hasSkills) {
    const detectedSkills = COMMON_KEYWORDS_CATALOG.filter(kw => rawText.toLowerCase().includes(kw));
    if (detectedSkills.length > 0) {
      sections.push({
        id: `sec-skills-${Date.now()}`,
        type: 'skills',
        title: 'Technical Skills',
        skillCategories: [
          {
            id: `sk-cat-${Date.now()}`,
            categoryName: 'Core Competencies',
            skills: detectedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1))
          }
        ]
      });
    }
  }

  return {
    id: `resume-${Date.now()}`,
    name: `${fullName} - ATS Optimized`,
    updatedAt: new Date().toISOString(),
    contact: {
      fullName,
      jobTitle,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: locationMatch ? locationMatch[1].trim() : '',
      linkedin: linkedinMatch ? linkedinMatch[0] : '',
      github: githubMatch ? githubMatch[0] : '',
      website: websiteMatch ? websiteMatch[0] : ''
    },
    sections
  };
}

function createEmptyResumeData(): ResumeData {
  return {
    id: `resume-${Date.now()}`,
    name: 'New ATS Resume',
    updatedAt: new Date().toISOString(),
    contact: {
      fullName: 'Professional Candidate',
      jobTitle: 'Software Engineer',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: ''
    },
    sections: []
  };
}

/**
 * Parses raw lines from an experience block into structured ExperienceItems
 */
function parseExperienceLines(lines: string[], appliedRewrites?: SmartMatchRewrite[]): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  let currentItem: ExperienceItem | null = null;

  const dateRegex = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\b(?:19|20)\d{2}\b\s*(?:-|–|to)\s*(?:(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\b(?:19|20)\d{2}\b|Present|Current)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isBullet = /^[-*•–]\s+/.test(line) || /^\d+\.\s+/.test(line);
    const dateMatch = line.match(dateRegex);

    if (!isBullet && (dateMatch || line.length < 80)) {
      // Check if this looks like a new role header
      const parts = line.split(/\s+[-|–•]\s+|\s{3,}/);
      const isHeaderLine = dateMatch || parts.length >= 2 || line.toLowerCase().includes('inc') || line.toLowerCase().includes('llc') || line.toLowerCase().includes('technologies') || line.toLowerCase().includes('corp');

      if (isHeaderLine) {
        if (currentItem) {
          items.push(currentItem);
        }

        const dateStr = dateMatch ? dateMatch[0] : '';
        const dateParts = dateStr ? dateStr.split(/\s*(?:-|–|to)\s*/i) : ['2021', 'Present'];

        let role = parts[0] || 'Professional Role';
        let company = parts[1] || 'Organization';

        // Swap if company is first
        if (/engineer|developer|manager|lead|analyst|specialist|director|consultant/i.test(company)) {
          const temp = role;
          role = company;
          company = temp;
        }

        currentItem = {
          id: `exp-${Date.now()}-${items.length + 1}`,
          role: role.replace(dateRegex, '').trim(),
          company: company.replace(dateRegex, '').trim(),
          location: '',
          startDate: dateParts[0] || '2021',
          endDate: dateParts[1] || 'Present',
          current: /present|current/i.test(dateParts[1] || ''),
          bullets: []
        };
        continue;
      }
    }

    // Add bullet to current item (or create an item if none exists yet)
    if (!currentItem) {
      currentItem = {
        id: `exp-${Date.now()}-1`,
        role: 'Professional Role',
        company: 'Organization',
        location: '',
        startDate: '2021',
        endDate: 'Present',
        current: true,
        bullets: []
      };
    }

    const cleanBullet = line.replace(/^[-*•–\d.]\s*/, '').trim();
    if (cleanBullet.length > 10) {
      // Check if this bullet has a Smart Match rewrite available
      let finalBullet = cleanBullet;
      if (appliedRewrites && appliedRewrites.length > 0) {
        const matchedRewrite = appliedRewrites.find(r => 
          cleanBullet.toLowerCase().includes(r.originalBullet.toLowerCase().slice(0, 30)) ||
          r.originalBullet.toLowerCase().includes(cleanBullet.toLowerCase().slice(0, 30))
        );
        if (matchedRewrite) {
          finalBullet = matchedRewrite.rewrittenBullet;
        }
      }
      currentItem.bullets.push(finalBullet);
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  return items;
}

/**
 * Parses raw lines from an education block
 */
function parseEducationLines(lines: string[]): EducationItem[] {
  const items: EducationItem[] = [];
  let currentItem: EducationItem | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const degreeMatch = line.match(/\b(?:Bachelor|Master|Doctor|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Ph\.D|Associate|Diploma)\b[A-Za-z\s,]*/i);
    const dateMatch = line.match(/\b(?:19|20)\d{2}\b(?:\s*-\s*\b(?:19|20)\d{2}\b)?/);
    const gpaMatch = line.match(/GPA:?\s*([0-4]\.\d{1,2}(?:\s*\/\s*4\.0)?)/i);

    if (degreeMatch || line.toLowerCase().includes('university') || line.toLowerCase().includes('college') || line.toLowerCase().includes('institute')) {
      if (currentItem) {
        items.push(currentItem);
      }

      currentItem = {
        id: `edu-${Date.now()}-${items.length + 1}`,
        institution: line.replace(degreeMatch ? degreeMatch[0] : '', '').replace(dateMatch ? dateMatch[0] : '', '').trim() || 'University',
        degree: degreeMatch ? degreeMatch[0].trim() : 'Bachelor of Science',
        fieldOfStudy: '',
        location: '',
        startDate: dateMatch ? dateMatch[0].split('-')[0].trim() : '2017',
        endDate: dateMatch ? (dateMatch[0].split('-')[1]?.trim() || dateMatch[0].trim()) : '2021',
        gpaOrHonors: gpaMatch ? `GPA: ${gpaMatch[1]}` : '',
        bullets: []
      };
    } else if (currentItem) {
      if (line.toLowerCase().includes('gpa') || line.toLowerCase().includes('cum laude') || line.toLowerCase().includes('honors')) {
        currentItem.gpaOrHonors = line;
      } else {
        currentItem.bullets?.push(line.replace(/^[-*•]\s*/, '').trim());
      }
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  return items;
}

/**
 * Parses raw lines from a skills block into grouped categories
 */
function parseSkillsLines(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.includes(':')) {
      const [catName, skillList] = line.split(':');
      const skills = skillList.split(/[,|•\t]/).map(s => s.trim()).filter(Boolean);
      if (skills.length > 0) {
        categories.push({
          id: `sk-${Date.now()}-${categories.length}`,
          categoryName: catName.trim(),
          skills
        });
      }
    } else {
      const skills = line.split(/[,|•\t]/).map(s => s.trim()).filter(Boolean);
      if (skills.length > 0) {
        if (categories.length === 0) {
          categories.push({
            id: `sk-${Date.now()}-0`,
            categoryName: 'Core Competencies',
            skills
          });
        } else {
          categories[categories.length - 1].skills.push(...skills);
        }
      }
    }
  }

  return categories;
}

/**
 * Parses project lines
 */
function parseProjectsLines(lines: string[]): ProjectItem[] {
  const items: ProjectItem[] = [];
  let current: ProjectItem | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const isBullet = /^[-*•]\s+/.test(line);

    if (!isBullet && line.length < 70) {
      if (current) items.push(current);
      current = {
        id: `proj-${Date.now()}-${items.length}`,
        name: line,
        role: 'Developer',
        bullets: []
      };
    } else if (current) {
      current.bullets.push(line.replace(/^[-*•]\s*/, '').trim());
    }
  }

  if (current) items.push(current);
  return items;
}

/**
 * Parses certification lines
 */
function parseCertificationsLines(lines: string[]): CertificationItem[] {
  return lines.map((line, idx) => {
    const clean = line.replace(/^[-*•]\s*/, '').trim();
    const parts = clean.split(/[-|–,]/);
    return {
      id: `cert-${Date.now()}-${idx}`,
      name: parts[0]?.trim() || clean,
      issuer: parts[1]?.trim() || 'Accredited Organization',
      date: 'Active'
    };
  });
}
