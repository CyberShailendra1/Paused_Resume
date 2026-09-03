export interface SampleResumePreset {
  id: string;
  name: string;
  role: string;
  description: string;
  expectedScoreRange: string;
  badgeColor: string;
  text: string;
  jobDescription: string;
}

export const SAMPLE_PRESETS: SampleResumePreset[] = [
  {
    id: 'preset-bad-ats',
    name: 'Common ATS Mistakes (Score ~52)',
    role: 'Software Developer',
    description: 'Contains multi-column tables, contact emojis, passive verbs ("responsible for"), and zero quantified metrics.',
    expectedScoreRange: '48 - 56',
    badgeColor: 'amber',
    text: `Alex Morgan | 📱 (555) 382-9104 | 📧 alex@gmail.com | 📍 San Francisco, CA
LinkedIn: linkedin.com/in/alexmorgan | Portfolio: [Image: Headshot]

==================================================
WHO I AM & WHAT I DO
==================================================
Hardworking developer looking for an opportunity at a forward-thinking company. Passionate about coding and working in teams.

==================================================
WORK HISTORY (2-Column Layout with Tables)
==================================================
+-----------------------------------+-----------------------------------+
| Company: TechGlobal Corp           | Company: WebSolutions Inc         |
| Role: Software Engineer (2021-Now)| Role: Junior Developer (2019-2021)|
+-----------------------------------+-----------------------------------+
| • Responsible for fixing bugs     | • Helped to build web pages       |
| • Duties included writing tests   | • Worked on database migration    |
| • Handled the frontend tickets    | • Tasked with customer support    |
+-----------------------------------+-----------------------------------+

==================================================
SKILL BARS
==================================================
JavaScript: ●●●●○ (80%)
React:      ●●●○○ (60%)
Python:     ●●●●○ (80%)

==================================================
SCHOOLING
==================================================
UC Berkeley - Computer Science BS (2015-2019)

Page 1 of 2`,
    jobDescription: `We are looking for a Senior Software Engineer with strong experience in:
- TypeScript, React, Node.js, and modern frontend architecture
- Cloud infrastructure: AWS (ECS, S3, Lambda), Docker, and Kubernetes
- Automated CI/CD pipelines, unit testing, and agile team leadership
- High-scale distributed systems and performance optimization`
  },
  {
    id: 'preset-soc-analyst',
    name: 'Cybersecurity SOC Analyst (Score ~78)',
    role: 'SOC Analyst L2',
    description: 'Clean single-column format, good certifications, but missing some key JD keywords and quantified metrics in some bullets.',
    expectedScoreRange: '74 - 82',
    badgeColor: 'blue',
    text: `Jordan Taylor
Information Security Analyst
San Jose, CA | jordan.security@email.com | (555) 729-1038 | linkedin.com/in/jordantaylor-sec

PROFESSIONAL SUMMARY
Dedicated Cyber Defense and SOC Analyst with 4+ years of hands-on experience monitoring SIEM alerts, triaging security incidents, and performing vulnerability management across enterprise networks. Skilled in Splunk, Wireshark, and threat analysis.

WORK EXPERIENCE
Security Operations Center (SOC) Analyst II | CyberGuard Systems
Austin, TX (Remote) | March 2022 - Present
• Monitored SIEM dashboard using Splunk to analyze 5,000+ daily alerts and triage potential phishing attacks and malware infections.
• Conducted tier-2 incident response investigations, mitigating critical ransomware outbreaks and preserving forensic disk artifacts.
• Documented standard operating playbooks for incident escalation across cross-functional IT and legal teams.

Associate Cyber Security Analyst | Vertex Networks
Dallas, TX | June 2020 - February 2022
• Performed routine vulnerability scans utilizing Nessus, categorizing CVE severity across 400+ endpoints.
• Analyzed network traffic captures using Wireshark to isolate anomalous port scans and command-and-control beacons.
• Assisted with quarterly compliance audits ensuring adherence to NIST 800-53 standards.

EDUCATION
Texas A&M University
Bachelor of Science in Cybersecurity & Information Assurance | 2016 - 2020

TECHNICAL SKILLS
Security Tools: Splunk, Nessus, Wireshark, CrowdStrike Falcon, Snort
Protocols & Concepts: TCP/IP, DNS, Firewall Management, Incident Response, NIST Framework
Operating Systems: Linux (Ubuntu, Kali), Windows Server

CERTIFICATIONS
• CompTIA Security+ (ce) - Issued 2021
• Certified Ethical Hacker (CEH) - Issued 2023`,
    jobDescription: `Looking for a Senior SOC Analyst to join our 24/7 Security Operations team:
Key Qualifications:
- 3+ years experience with Splunk, SIEM triage, and packet analysis with Wireshark
- Proven track record with Threat Hunting, MITRE ATT&CK framework, and Python scripting for automation
- Incident response lead experience mitigating ransomware and advanced persistent threats (APT)
- Experience with Cloud Security in AWS/Azure and SIEM query optimization`
  },
  {
    id: 'preset-clean-exec',
    name: 'ATS-Optimized Executive Engineer (Score ~95)',
    role: 'Lead Cloud Architect',
    description: 'Flawless single-column, every bullet has quantified metrics, standard section headers, zero graphics.',
    expectedScoreRange: '92 - 98',
    badgeColor: 'emerald',
    text: `Elena Rostova
Lead Cloud Solutions Architect
Seattle, WA | elena.rostova@cloudtech.io | (555) 492-8173 | linkedin.com/in/elenarostova | github.com/erostova

PROFESSIONAL SUMMARY
Accomplished Cloud Solutions Architect with 8+ years of expertise designing and operating enterprise-grade distributed systems on AWS and Kubernetes. Spearheaded digital modernization programs that reduced annual cloud expenditures by $420,000 while maintaining 99.995% uptime across 12M active user accounts.

WORK EXPERIENCE
Principal Cloud Architect | CloudSphere Global | Seattle, WA
January 2022 - Present
• Architected multi-region serverless infrastructure on AWS (Lambda, ECS, DynamoDB) handling 45,000 requests/sec with sub-40ms latency.
• Orchestrated company-wide Kubernetes migration, reducing compute resource consumption by 34% and saving $180,000 annually.
• Engineered automated Terraform CI/CD pipelines, slashing production deployment time from 4 hours to 11 minutes across 28 microservices.
• Mentored a team of 14 DevOps and software engineers, increasing sprint velocity by 25% across 4 quarters.

Senior Systems Engineer | Dataview Systems | Bellevue, WA
June 2018 - December 2021
• Spearheaded containerization of 18 monolithic legacy services using Docker and Kubernetes, boosting system reliability by 48%.
• Optimized PostgreSQL query indexes and database replication, reducing peak query response times from 850ms to 92ms.
• Designed automated disaster recovery failover protocols, achieving a Recovery Point Objective (RPO) of under 2 minutes.

EDUCATION
University of Washington | Seattle, WA
Bachelor of Science in Computer Science | Magna Cum Laude (GPA: 3.91/4.0)

TECHNICAL SKILLS
Cloud & DevOps: AWS (ECS, S3, RDS, CloudFront, Lambda), Docker, Kubernetes, Terraform, Helm, GitHub Actions
Languages: Python, Go, TypeScript, SQL, Bash
Architecture: Microservices, Event-Driven Systems, Distributed Caching (Redis), REST APIs, GraphQL

CERTIFICATIONS
• AWS Certified Solutions Architect – Professional (2023)
• Certified Kubernetes Administrator (CKA) (2022)`,
    jobDescription: `Cloud Solutions Architect:
Requirements:
- Deep expertise in AWS cloud services, microservices, and distributed architecture
- Hands-on mastery of Kubernetes, Docker, and Terraform infrastructure as code
- Demonstrated history of cloud cost reduction, performance optimization, and high availability (99.99%)
- Experience with CI/CD automation, PostgreSQL tuning, and engineering mentorship`
  }
];
