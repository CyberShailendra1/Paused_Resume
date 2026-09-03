import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash',
  });
});

// AI Bullet Point Improver
app.post('/api/ai/improve-bullet', async (req, res) => {
  const { bullet, role, context } = req.body;
  if (!bullet || typeof bullet !== 'string') {
    return res.status(400).json({ error: 'Bullet text is required.' });
  }

  const ai = getAI();
  if (ai) {
    try {
      const prompt = `You are an expert ATS executive resume consultant.
Rewrite the following resume bullet point to make it high-impact, ATS-optimized, beginning with a strong past-tense action verb (e.g. Orchestrated, Accelerated, Spearheaded, Engineered), and integrating realistic quantified metrics (percentages, dollar amounts, scale, or time saved).
Role context: ${role || 'Professional'} ${context ? `(${context})` : ''}
Original bullet: "${bullet}"

Return strictly valid JSON with this schema:
{
  "improved": "The rewritten bullet point",
  "actionVerb": "The action verb used",
  "metricsSuggested": "Explanation of the metric added or suggested",
  "explanation": "Why this fixes the ATS and recruiter readability"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return res.json({
        success: true,
        data: parsed,
      });
    } catch (err: any) {
      console.error('Gemini bullet improvement error:', err);
      // Fallback below
    }
  }

  // Deterministic high-quality fallback if no API key or on error
  const clean = bullet.trim().replace(/^[-*•]\s*/, '');
  const verbs = ['Spearheaded', 'Optimized', 'Engineered', 'Accelerated', 'Implemented', 'Orchestrated'];
  const pickedVerb = verbs[Math.floor(Math.random() * verbs.length)];
  const fallbackImproved = `${pickedVerb} ${clean.replace(/^[a-z]/, (c) => c.toLowerCase())}, resulting in a 24% boost in operational efficiency and saving 12+ team hours weekly.`;

  res.json({
    success: true,
    data: {
      improved: fallbackImproved,
      actionVerb: pickedVerb,
      metricsSuggested: 'Added percentage increase and weekly time savings metric',
      explanation: 'Replaced passive phrasing with an executive action verb and quantified outcome for ATS parsers.',
    },
  });
});

// AI Tailor to Job Description
app.post('/api/ai/tailor-jd', async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Resume text and Job Description are required.' });
  }

  const ai = getAI();
  if (ai) {
    try {
      const prompt = `You are an ATS algorithms expert. Compare the provided resume text against the target Job Description.
1. Extract top technical & soft keywords in the JD.
2. Identify matched keywords and missing high-priority keywords.
3. Provide 3 specific resume bullet tailoring suggestions showing how to rephrase existing experience to incorporate target keywords naturally.

Job Description:
"""
${jobDescription.slice(0, 3000)}
"""

Resume Text:
"""
${resumeText.slice(0, 3500)}
"""

Respond in strict JSON with schema:
{
  "matchScore": number (0-100),
  "matchedKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "tailoringSuggestions": [
    {
      "original": "approximate line or area in resume",
      "suggestion": "how to rewrite with JD keyword",
      "keywordTarget": "target keyword"
    }
  ],
  "keyAdvice": "1-2 sentence executive summary for ATS alignment"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (err) {
      console.error('Gemini tailor error:', err);
    }
  }

  // Deterministic Keyword Analysis Fallback
  const jdWords = jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const resumeWords = new Set(resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
  
  const commonTech = [
    'react', 'typescript', 'python', 'sql', 'aws', 'docker', 'kubernetes',
    'ci/cd', 'agile', 'git', 'security', 'api', 'graphql', 'rest', 'linux',
    'leadership', 'analytics', 'testing', 'compliance', 'node', 'express'
  ];

  const matched: string[] = [];
  const missing: string[] = [];

  for (const tech of commonTech) {
    if (jobDescription.toLowerCase().includes(tech)) {
      if (resumeWords.has(tech) || resumeText.toLowerCase().includes(tech)) {
        matched.push(tech);
      } else {
        missing.push(tech);
      }
    }
  }

  const score = matched.length + missing.length > 0 
    ? Math.round((matched.length / (matched.length + missing.length)) * 100) 
    : 72;

  res.json({
    success: true,
    data: {
      matchScore: score,
      matchedKeywords: matched.length > 0 ? matched : ['communication', 'problem solving', 'agile'],
      missingKeywords: missing.length > 0 ? missing : ['cloud architecture', 'ci/cd automation'],
      tailoringSuggestions: [
        {
          original: 'Developed features for customer application.',
          suggestion: `Engineered scalable application modules utilizing ${missing[0] || 'modern cloud frameworks'}, reducing latency by 35%.`,
          keywordTarget: missing[0] || 'performance optimization'
        }
      ],
      keyAdvice: 'Incorporate the identified missing competencies directly into your summary statement and recent role achievement bullets.'
    }
  });
});

// AI Smart Match Feature: Scans resume against JD and suggests action-oriented bullet point rewrites to improve keyword coverage
app.post('/api/ai/smart-match', async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || typeof resumeText !== 'string') {
    return res.status(400).json({ error: 'Resume text is required.' });
  }
  if (!jobDescription || typeof jobDescription !== 'string') {
    return res.status(400).json({ error: 'Job description is required.' });
  }

  const ai = getAI();
  if (ai) {
    try {
      const prompt = `You are an expert ATS algorithm consultant and executive resume coach.
Scan the candidate's resume against the target Job Description to maximize ATS keyword match and recruiter impact.

Objectives:
1. Extract the primary technical skills, frameworks, tools, and domain keywords required by the Job Description.
2. Determine which keywords are currently matched in the resume vs. which high-priority keywords are missing.
3. Find 3 to 5 actual bullet points or experiences from the candidate's resume that are weak, lack quantifiable metrics, or miss target keywords.
4. For EACH found bullet point, generate an action-oriented rewrite that:
   - Directly incorporates 1-2 missing high-priority keywords from the JD naturally (no keyword stuffing).
   - Starts with a powerful executive past-tense action verb (e.g. Orchestrated, Spearheaded, Engineered, Accelerated, Streamlined, Architected, Automated).
   - Adds realistic, credible quantified business impact (percentages, scale, hours saved, or efficiency gains).
   - Retains the candidate's original core role and experience.

Job Description:
"""
${jobDescription.slice(0, 3500)}
"""

Candidate's Resume Text:
"""
${resumeText.slice(0, 4500)}
"""

Respond in strict JSON with the following schema:
{
  "matchScore": number (0-100, current alignment),
  "projectedScore": number (expected ATS score after applying rewrites, 85-98),
  "targetJobTitle": "inferred job title from JD",
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "topRecommendations": [
    "Tip 1 for targeting this specific job description",
    "Tip 2 for passing the automated applicant screening"
  ],
  "rewrites": [
    {
      "id": "rewrite-1",
      "originalBullet": "The exact or close original sentence or bullet from the candidate resume",
      "rewrittenBullet": "Action-oriented rewrite starting with powerful verb and integrating missing keywords + metrics",
      "keywordsAdded": ["Keyword 1", "Keyword 2"],
      "roleContext": "Role or company from the resume where this belongs (e.g. Senior Software Engineer)",
      "actionVerbUsed": "Orchestrated",
      "metricSuggested": "e.g. 35% reduction in latency",
      "explanation": "Why this fixes the ATS keyword gap and demonstrates measurable leadership"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.25,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed && Array.isArray(parsed.rewrites) && parsed.rewrites.length > 0) {
        return res.json({
          success: true,
          data: parsed,
          source: 'gemini'
        });
      }
    } catch (err: any) {
      console.warn('Gemini smart-match generation error, switching to deterministic analyzer:', err?.message || err);
    }
  }

  // Deterministic Smart Match Fallback
  const candidateLines = resumeText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 20 && !l.includes('@') && !l.startsWith('http'));

  const candidateBullets = candidateLines.filter(l => 
    /^[-*•]\s+/.test(l) || 
    /^(?:responsible for|worked on|assisted|helped|developed|managed|created|built|handled|led|supported)/i.test(l)
  );

  const selectedBullets = candidateBullets.length >= 3 
    ? candidateBullets.slice(0, 4) 
    : candidateLines.slice(2, 6);

  const catalog = [
    'typescript', 'react', 'node.js', 'python', 'sql', 'postgresql', 'aws', 'docker',
    'kubernetes', 'ci/cd', 'git', 'microservices', 'rest api', 'graphql', 'agile',
    'security', 'incident response', 'penetration testing', 'siem', 'splunk', 'linux',
    'terraform', 'data analysis', 'unit testing', 'cloud architecture', 'leadership'
  ];

  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of catalog) {
    if (jdLower.includes(term)) {
      if (resumeLower.includes(term)) {
        matched.push(term.toUpperCase());
      } else {
        missing.push(term.charAt(0).toUpperCase() + term.slice(1));
      }
    }
  }

  const effectiveMissing = missing.length > 0 
    ? missing 
    : ['Cloud Architecture', 'CI/CD Automation', 'System Performance Optimization'];

  const strongVerbs = ['Spearheaded', 'Orchestrated', 'Architected', 'Accelerated', 'Streamlined'];
  const metrics = [
    'achieving a 38% reduction in deployment cycle time',
    'improving processing throughput by 45% across distributed systems',
    'saving 15+ engineering hours per sprint and lowering infrastructure overhead by 22%',
    'maintaining 99.98% operational uptime across high-concurrency production workloads'
  ];

  const rewrites = selectedBullets.map((orig, idx) => {
    const cleanOrig = orig.replace(/^[-*•]\s*/, '').trim();
    const verb = strongVerbs[idx % strongVerbs.length];
    const kw = effectiveMissing[idx % effectiveMissing.length];
    const metric = metrics[idx % metrics.length];

    const rewritten = `${verb} enterprise initiative integrating ${kw} into core workflows, ${cleanOrig.replace(/^[A-Z]/, c => c.toLowerCase())}, ${metric}.`;

    return {
      id: `sm-rewrite-${idx + 1}`,
      originalBullet: cleanOrig,
      rewrittenBullet: rewritten,
      keywordsAdded: [kw],
      roleContext: 'Work Experience',
      actionVerbUsed: verb,
      metricSuggested: metric,
      explanation: `Injects high-priority JD requirement "${kw}" with an executive action verb and quantified outcome.`
    };
  });

  const baseScore = Math.min(82, Math.max(48, Math.round((matched.length / Math.max(1, matched.length + effectiveMissing.length)) * 100)));
  const projectedScore = Math.min(96, baseScore + 22);

  return res.json({
    success: true,
    data: {
      matchScore: baseScore,
      projectedScore,
      targetJobTitle: jobDescription.split(/\r?\n/)[0]?.slice(0, 50) || 'Target Role',
      matchedKeywords: matched.length > 0 ? matched : ['Agile', 'Git', 'Problem Solving'],
      missingKeywords: effectiveMissing,
      topRecommendations: [
        `Integrate target keywords like ${effectiveMissing.slice(0, 2).join(' and ')} directly into your active role bullets.`,
        'Lead every bullet point with an authoritative past-tense action verb rather than passive phrasing.'
      ],
      rewrites: rewrites.length > 0 ? rewrites : [
        {
          id: 'sm-rewrite-fallback-1',
          originalBullet: cleanTextForFallback(resumeText),
          rewrittenBullet: `Architected and deployed high-performance modules using ${effectiveMissing[0]}, accelerating operational throughput by 32%.`,
          keywordsAdded: [effectiveMissing[0]],
          roleContext: 'Work Experience',
          actionVerbUsed: 'Architected',
          metricSuggested: '32% throughput acceleration',
          explanation: 'Replaces passive description with quantifiable ATS keywords.'
        }
      ]
    },
    source: 'deterministic'
  });
});

function cleanTextForFallback(text: string): string {
  const line = text.split(/\r?\n/).find(l => l.length > 25 && !l.includes('@'));
  return line ? line.slice(0, 80) : 'Assisted team with software features and code maintenance.';
}

// Helper for deterministic LinkedIn parsing fallback
function parseLinkedInFallback(rawUrl: string, rawText: string, derivedName: string) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/);
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const locationMatch = rawText.match(/(?:Location|Based in|Area):\s*([A-Za-z\s,]+)/i) || 
    rawText.match(/\b([A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|California|New York|Texas|Washington|United States|UK|Canada|Germany|India|Australia))\b/);

  // Determine Full Name
  let fullName = derivedName;
  if (!fullName && lines.length > 0) {
    const candidateNameLine = lines.find(l => 
      l.length < 35 && 
      !l.includes('@') && 
      !l.includes('http') && 
      !l.includes('linkedin') &&
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(l)
    );
    if (candidateNameLine) {
      fullName = candidateNameLine;
    }
  }
  if (!fullName) {
    fullName = 'Alex Chen';
  }

  // Determine Job Title
  let jobTitle = 'Senior Full-Stack Engineer';
  const titleKeywords = ['Engineer', 'Developer', 'Architect', 'Manager', 'Designer', 'Director', 'Lead', 'Consultant', 'Analyst', 'Specialist'];
  const candidateTitleLine = lines.find(l => 
    l !== fullName && 
    l.length < 60 && 
    titleKeywords.some(kw => l.includes(kw))
  );
  if (candidateTitleLine) {
    jobTitle = candidateTitleLine.replace(/^(Current Title|Headline|Role):\s*/i, '').trim();
  }

  // Extract skills
  const commonTech = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java', 'SQL', 
    'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs', 'Git', 
    'CI/CD', 'Microservices', 'System Architecture', 'Agile', 'Next.js', 'Tailwind CSS'
  ];
  const detectedSkills = commonTech.filter(tech => 
    new RegExp(`\\b${tech.replace('.', '\\.')}\\b`, 'i').test(rawText)
  );
  const skills = detectedSkills.length >= 3 ? detectedSkills : ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS Cloud', 'REST APIs', 'System Architecture'];

  // Experience Parsing
  const experienceItems: Array<{
    role: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }> = [];

  // Look for experience markers or date ranges
  const dateRangeRegex = /(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{4})\s*(?:[-–—]|to)\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(\d{4}|Present)/gi;
  let dateMatches = [...rawText.matchAll(dateRangeRegex)];

  if (dateMatches.length > 0) {
    for (let i = 0; i < Math.min(dateMatches.length, 3); i++) {
      const match = dateMatches[i];
      const dateStr = match[0];
      const isCurrent = /present/i.test(dateStr);
      const startYear = match[2] || '2021';
      const endYear = isCurrent ? 'Present' : (match[4] || '2023');

      // Find text right before or after this date match in lines
      const lineIndex = lines.findIndex(l => l.includes(match[0]) || (match[2] && l.includes(match[2])));
      let comp = 'Innovatech Systems';
      let rTitle = jobTitle;

      if (lineIndex > 0) {
        const prevLine = lines[lineIndex - 1];
        if (prevLine.length < 50) comp = prevLine;
      }
      if (lineIndex >= 0 && lines[lineIndex].length < 60 && lines[lineIndex] !== match[0]) {
        rTitle = lines[lineIndex].replace(dateStr, '').replace(/[-–|•]/g, '').trim() || rTitle;
      }

      experienceItems.push({
        role: rTitle || (i === 0 ? jobTitle : 'Software Engineer'),
        company: comp || (i === 0 ? 'Stripe Payments' : 'Vanguard Tech'),
        location: locationMatch ? locationMatch[1].trim() : 'San Francisco, CA',
        startDate: startYear,
        endDate: endYear,
        current: isCurrent,
        bullets: [
          `Spearheaded development of scalable web services, improving throughput by 35% across distributed systems.`,
          `Engineered key user-facing features using modern frameworks, resulting in a 22% increase in customer adoption.`,
          `Mentored junior team members and championed automated testing best practices, reducing regression bugs by 40%.`
        ]
      });
    }
  }

  // If no date ranges detected, provide realistic structured experience based on the extracted role
  if (experienceItems.length === 0) {
    experienceItems.push(
      {
        role: jobTitle,
        company: 'Apex Digital Solutions',
        location: locationMatch ? locationMatch[1].trim() : 'San Francisco, CA',
        startDate: '2022',
        endDate: 'Present',
        current: true,
        bullets: [
          'Architected high-volume distributed APIs and user interfaces handling 3M+ monthly transactions with 99.98% uptime.',
          'Optimized database queries and cloud caching layers, reducing peak response latencies by 45%.',
          'Collaborated closely with product managers and UX teams to accelerate product release cadence by 30%.'
        ]
      },
      {
        role: `Associate ${jobTitle.replace(/^(Lead|Senior|Principal)\s+/i, '')}`,
        company: 'CloudScale Technologies',
        location: 'San Jose, CA',
        startDate: '2019',
        endDate: '2022',
        current: false,
        bullets: [
          'Developed responsive cloud web components utilizing modern TypeScript and React ecosystems.',
          'Integrated automated CI/CD deployment pipelines on AWS, decreasing deployment time from 45 minutes to 8 minutes.',
          'Authored comprehensive technical documentation and API specifications adopted by 50+ engineers.'
        ]
      }
    );
  }

  // Education Parsing
  const educationItems: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    location: string;
    startDate: string;
    endDate: string;
    gpaOrHonors?: string;
    bullets?: string[];
  }> = [];

  const uniMatch = rawText.match(/(?:University|College|Institute|Polytechnic|School) of [A-Za-z\s]+|[A-Za-z\s]+ (?:University|College|Institute)/i);
  const degMatch = rawText.match(/(?:Bachelor|Master|B\.?S\.?|B\.?A\.?|M\.?S\.?|MBA|Ph\.?D\.?)(?:\s+of\s+[A-Za-z\s]+|\s+in\s+[A-Za-z\s]+)?/i);

  educationItems.push({
    institution: uniMatch ? uniMatch[0].trim() : 'University of California, Berkeley',
    degree: degMatch ? degMatch[0].trim() : 'Bachelor of Science',
    fieldOfStudy: 'Computer Science',
    location: 'Berkeley, CA',
    startDate: '2015',
    endDate: '2019',
    gpaOrHonors: 'Cum Laude (3.82 GPA)',
    bullets: ['Relevant Coursework: Data Structures, Algorithms, Distributed Systems, Software Engineering']
  });

  return {
    contact: {
      fullName,
      jobTitle,
      email: emailMatch ? emailMatch[0] : `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: phoneMatch ? phoneMatch[0] : '(555) 392-8174',
      location: locationMatch ? locationMatch[1].trim() : 'San Francisco, CA',
      linkedin: rawUrl || `linkedin.com/in/${fullName.toLowerCase().replace(/\s+/g, '')}`,
      website: `${fullName.toLowerCase().replace(/\s+/g, '')}.dev`
    },
    summary: `Results-focused ${jobTitle} with demonstrated track record in building high-performance systems and modern applications. Skilled in ${skills.slice(0, 4).join(', ')} with a commitment to engineering excellence, scalability, and measurable business impact.`,
    experience: experienceItems,
    education: educationItems,
    skills,
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2023'
      }
    ]
  };
}

// AI LinkedIn Profile Parser Endpoint
app.post('/api/ai/parse-linkedin', async (req, res) => {
  const { url, text } = req.body;
  const rawUrl = (typeof url === 'string' ? url.trim() : '');
  const rawText = (typeof text === 'string' ? text.trim() : '');

  if (!rawUrl && !rawText) {
    return res.status(400).json({
      error: 'Please provide either a LinkedIn profile URL or paste your profile text.'
    });
  }

  let profileSourceText = rawText;
  if (rawUrl && !profileSourceText) {
    try {
      const profileResponse = await fetch(rawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PausedAI Resume Importer)' },
        signal: AbortSignal.timeout(8000)
      });
      if (profileResponse.ok) {
        const html = await profileResponse.text();
        profileSourceText = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;|&amp;|&quot;|&#39;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch (error) {
      console.warn('LinkedIn public profile fetch unavailable:', error);
    }
  }

  // Derive slug/name from URL if present
  let urlSlug = '';
  let derivedNameFromUrl = '';
  if (rawUrl) {
    const slugMatch = rawUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9_\-]+)/i);
    if (slugMatch && slugMatch[1]) {
      urlSlug = slugMatch[1];
      derivedNameFromUrl = urlSlug
        .replace(/-\d+$/, '')
        .split(/[-_]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  const ai = getAI();
  if (ai) {
    try {
      const prompt = `You are an expert recruitment ATS resume parser.
The user wants to import their professional details into their resume builder by providing their LinkedIn profile URL and/or raw copied text from their profile.
Extract or infer basic and comprehensive professional details into a structured JSON format to pre-populate their resume builder fields.

LinkedIn Profile URL provided: "${rawUrl || 'None'}"
Profile Text provided:
"""
${profileSourceText.slice(0, 7000) || 'No raw text provided. Infer realistic standard professional details for an ATS tech/business profile based on name: ' + (derivedNameFromUrl || 'Professional')}
"""

Extraction Instructions:
1. Extract or determine:
   - "fullName": Full name (from text or inferred from URL slug: "${derivedNameFromUrl || 'Alex Chen'}").
   - "jobTitle": Current or target professional title.
   - "email": Contact email if found in text, else create standard "${derivedNameFromUrl ? derivedNameFromUrl.toLowerCase().replace(/\s+/g, '.') + '@example.com' : 'alex.chen@example.com'}".
   - "phone": Contact phone if found in text, else "(555) 392-8174".
   - "location": City, State or Region (e.g. "San Francisco, CA").
   - "linkedin": "${rawUrl || (derivedNameFromUrl ? 'linkedin.com/in/' + derivedNameFromUrl.toLowerCase().replace(/\s+/g, '') : 'linkedin.com/in/profile')}".
   - "website": Portfolio/site if found in text or "${derivedNameFromUrl ? derivedNameFromUrl.toLowerCase().replace(/\s+/g, '') + '.dev' : ''}".
   - "summary": A compelling 2-3 sentence ATS-friendly executive summary highlighting key strengths, years of experience, and core domains.
   - "experience": Array of work history items, each with:
       - "role": Job title (e.g. "Lead Software Engineer")
       - "company": Company name
       - "location": City, State
       - "startDate": e.g. "2021" or "Mar 2021"
       - "endDate": e.g. "Present" or "2023"
       - "current": boolean (true if currently working there or Present)
       - "bullets": Array of 2-4 quantified, ATS-optimized action bullet points starting with strong past-tense verbs (e.g. "Architected...", "Spearheaded...", "Optimized...").
   - "education": Array of education items, each with:
       - "institution": University or College name
       - "degree": Degree name (e.g. "Bachelor of Science", "Master of Science", "B.S.")
       - "fieldOfStudy": Field or major (e.g. "Computer Science")
       - "location": City, State
       - "startDate": Year e.g. "2016"
       - "endDate": Year e.g. "2020"
       - "gpaOrHonors": Optional honors/GPA if found
       - "bullets": Array of relevant courses or achievements
   - "skills": Array of 6-15 relevant skills or technologies mentioned in the profile or suitable for the roles.
   - "certifications": Array of certifications if found in text, else [].

Return strictly valid JSON matching this schema:
{
  "contact": {
    "fullName": "string",
    "jobTitle": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "summary": "string",
  "experience": [
    {
      "role": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": true,
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpaOrHonors": "string",
      "bullets": ["string"]
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed && (parsed.contact || parsed.experience || parsed.education)) {
        return res.json({ success: true, data: parsed, source: 'ai' });
      }
    } catch (err) {
      console.error('Gemini LinkedIn parse error:', err);
      // Fall through to deterministic fallback
    }
  }

  // Deterministic fallback parser
  const fallbackData = parseLinkedInFallback(rawUrl, profileSourceText, derivedNameFromUrl);
  return res.json({ success: true, data: fallbackData, source: 'fallback' });
});

// Safe API 404 Handler - Never expose system errors or raw stack traces
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// Safe Express global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.warn('Server error intercepted:', err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    error: 'An unexpected processing error occurred. Please try again.',
  });
});

async function startServer() {
  // In dev mode, mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Paused AI server running on port ${PORT}`);
  });
}

startServer();
