// server/src/services/ai/companyLearningService.js
/**
 * AICP Verified Company Learning Program Recommendation Service
 *
 * Matches student missing and partial skill gaps against verified company learning programs
 * already represented in AICP data (IBM, Cisco, Microsoft, AWS, Google Cloud, NVIDIA, GitHub,
 * Infosys, Oracle, Scaler, SWAYAM/NPTEL, etc.).
 *
 * AI Safety: Never fabricates companies, credentials, or courses.
 */

import { normalizeSkill } from './skillNormalizer.js'

export const AICP_COMPANY_PROGRAMS = [
  {
    id: 'ibm-skillsbuild',
    provider: 'IBM',
    programName: 'IBM SkillsBuild - AI, Cloud & Emerging Tech Track',
    category: 'ai',
    areas: ['Artificial Intelligence', 'Cybersecurity', 'Cloud Computing', 'Data Analytics'],
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'Cloud Computing', 'Cybersecurity', 'Linux', 'SQL'],
    badgeType: 'free_badge',
    badgeLabel: 'Free Digital Badges (Credly)',
    officialUrl: 'https://skillsbuild.org/',
    shortDesc: 'Industry-focused free digital curriculum with verifiable Credly credentials in emerging enterprise technologies.',
  },
  {
    id: 'cisco-netacad',
    provider: 'Cisco Systems',
    programName: 'Cisco Networking Academy - Network & Cyber Operations Track',
    category: 'cyber',
    areas: ['Computer Networking', 'Cybersecurity Ops', 'Python Programming', 'Packet Tracer'],
    skills: ['Networking', 'Cybersecurity', 'Network Security', 'Python', 'Linux', 'Information Security'],
    badgeType: 'free_badge',
    badgeLabel: 'Verifiable Cisco Badges',
    officialUrl: 'https://www.netacad.com/',
    shortDesc: 'Global standard curriculum for packet routing, network engineering, ethical hacking, and cyber defense.',
  },
  {
    id: 'microsoft-learn',
    provider: 'Microsoft',
    programName: 'Microsoft Learn - Azure Cloud & Software Engineering Paths',
    category: 'cloud',
    areas: ['Azure Cloud Fundamentals', 'AI-900 & Azure AI', 'C# & .NET Core', 'DevOps & Git'],
    skills: ['Azure', 'Cloud', 'Git', 'CI/CD', 'Docker', 'DevOps', 'SQL', 'C#', '.NET'],
    badgeType: 'hybrid',
    badgeLabel: 'Free Trophies / Exam Badges',
    officialUrl: 'https://learn.microsoft.com/',
    shortDesc: 'Free interactive sandbox modules, code tutorials, and certification roadmaps for Azure and DevOps.',
  },
  {
    id: 'aws-skill-builder',
    provider: 'Amazon Web Services',
    programName: 'AWS Skill Builder - Cloud Architecture & Serverless Track',
    category: 'cloud',
    areas: ['AWS Cloud Practitioner', 'Solutions Architecture', 'Serverless & Lambda', 'Cloud Security'],
    skills: ['AWS', 'Cloud', 'Docker', 'Linux', 'Networking', 'Cybersecurity', 'DevOps'],
    badgeType: 'hybrid',
    badgeLabel: 'AWS Digital Badges',
    officialUrl: 'https://explore.skillbuilder.aws/',
    shortDesc: 'Amazon Web Services official learning center featuring 600+ free digital courses and cloud game challenges.',
  },
  {
    id: 'google-cloud-skills-boost',
    provider: 'Google Cloud',
    programName: 'Google Cloud Skills Boost - Cloud Engineering & Big Data Track',
    category: 'cloud',
    areas: ['Google Cloud Platform', 'Vertex AI & LLMs', 'Kubernetes Engine', 'BigQuery Analytics'],
    skills: ['Google Cloud', 'Kubernetes', 'Docker', 'Linux', 'SQL', 'Data Analysis', 'Machine Learning'],
    badgeType: 'hybrid',
    badgeLabel: 'Google Cloud Skill Badges',
    officialUrl: 'https://www.cloudskillsboost.google/',
    shortDesc: 'Real hands-on console labs, quest badges, and learning paths for GCP, Vertex AI, and Kubernetes.',
  },
  {
    id: 'nvidia-dli',
    provider: 'NVIDIA',
    programName: 'NVIDIA Deep Learning Institute - Accelerated Computing & GenAI',
    category: 'ai',
    areas: ['Generative AI & LLMs', 'CUDA C/C++ Optimization', 'Computer Vision', 'Conversational AI'],
    skills: ['Deep Learning', 'PyTorch', 'Machine Learning', 'Python', 'Model Evaluation', 'Data Science'],
    badgeType: 'paid_cert',
    badgeLabel: 'Certificate of Competency',
    officialUrl: 'https://www.nvidia.com/en-us/training/',
    shortDesc: 'Premier GPU-accelerated computing, Generative AI fine-tuning, computer vision, and model optimization.',
  },
  {
    id: 'github-skills',
    provider: 'GitHub',
    programName: 'GitHub Skills - Version Control, CI/CD & Open Source Workflows',
    category: 'tech',
    areas: ['Git Version Control', 'GitHub Actions & CI/CD', 'Open-Source Contribution', 'Markdown & Pages'],
    skills: ['Git', 'CI/CD', 'DevOps', 'Software Testing', 'HTML', 'Markdown'],
    badgeType: 'free_badge',
    badgeLabel: '100% Free GitHub Badges',
    officialUrl: 'https://skills.github.com/',
    shortDesc: 'Interactive courses taught directly through GitHub repositories, pull requests, and automated bot reviews.',
  },
  {
    id: 'infosys-springboard',
    provider: 'Infosys',
    programName: 'Infosys Springboard - Full Stack & Enterprise Software Track',
    category: 'tech',
    areas: ['Full Stack Development', 'Python Programming', 'Corporate Readiness', 'Emerging Tech'],
    skills: ['JavaScript', 'React', 'Node.js', 'Express', 'HTML', 'CSS', 'REST APIs', 'Java', 'Spring Boot', 'SQL', 'Python'],
    badgeType: 'free_badge',
    badgeLabel: 'Free Infosys Certificates',
    officialUrl: 'https://infyspringboard.onwingspan.com/',
    shortDesc: 'Flagship corporate digital learning platform offering holistic software engineering, modern web dev, and masterclasses.',
  },
  {
    id: 'oracle-university',
    provider: 'Oracle Corporation',
    programName: 'Oracle University - Cloud Infrastructure & Database Specialist',
    category: 'cloud',
    areas: ['Oracle Cloud (OCI)', 'Autonomous Database', 'Java SE', 'SQL Performance'],
    skills: ['SQL', 'Database Design', 'Java', 'Cloud', 'PostgreSQL', 'MySQL'],
    badgeType: 'paid_cert',
    badgeLabel: 'Oracle Verified Training',
    officialUrl: 'https://education.oracle.com/',
    shortDesc: 'Official role-based training paths and certification tracks for Oracle Cloud Infrastructure and relational databases.',
  },
  {
    id: 'coursera',
    provider: 'Coursera & Industry Partners',
    programName: 'Coursera Professional Specializations - Web, Data & Software',
    category: 'tech',
    areas: ['Full Stack Web Dev', 'Deep Learning', 'Data Science', 'Algorithms'],
    skills: ['React', 'Node.js', 'HTML', 'CSS', 'REST APIs', 'Data Structures', 'Algorithms', 'Machine Learning', 'Pandas', 'NumPy', 'Statistics'],
    badgeType: 'hybrid',
    badgeLabel: 'Audit Free / Verified Cert',
    officialUrl: 'https://www.coursera.org/',
    shortDesc: 'Professional certificates and specializations designed by leading academic institutions and global industry partners.',
  },
  {
    id: 'scaler',
    provider: 'Scaler Academy',
    programName: 'Scaler Academy - System Design & Backend Engineering Masterclasses',
    category: 'tech',
    areas: ['Data Structures & Algorithms', 'Low-Level System Design', 'High-Level System Design', 'Backend Engineering'],
    skills: ['Data Structures', 'Algorithms', 'Microservices', 'System Design', 'Redis', 'SQL', 'Node.js', 'Java'],
    badgeType: 'hybrid',
    badgeLabel: 'Masterclass Certificates',
    officialUrl: 'https://www.scaler.com/',
    shortDesc: 'Tech-focused curriculum and masterclasses emphasizing DSA problem solving, system design, and backend engineering.',
  },
  {
    id: 'swayam-nptel',
    provider: 'Govt. of India & IITs',
    programName: 'NPTEL / SWAYAM - Core Computer Science & Systems Engineering',
    category: 'tech',
    areas: ['Data Structures & Algorithms', 'Operating Systems', 'VLSI Design', 'Software Engineering'],
    skills: ['Data Structures', 'Algorithms', 'Linux', 'Software Testing', 'SQL', 'C++', 'Java'],
    badgeType: 'hybrid',
    badgeLabel: 'IIT Proctored Certification',
    officialUrl: 'https://swayam.gov.in/',
    shortDesc: 'Ministry of Education national engineering initiative providing rigorous academic and industrial technical training.',
  },
  {
    id: 'salesforce-trailhead',
    provider: 'Salesforce',
    programName: 'Salesforce Trailhead - Cloud Development & Business Architect',
    category: 'business',
    areas: ['Salesforce Administration', 'Apex & Lightning Web Components', 'CRM Systems', 'Business Analysis'],
    skills: ['JavaScript', 'HTML', 'CSS', 'Database Design', 'UI Design'],
    badgeType: 'free_badge',
    badgeLabel: 'Free Superbadges',
    officialUrl: 'https://trailhead.salesforce.com/',
    shortDesc: 'Gamified learning paths with hands-on Developer Edition orgs, Superbadges, and CRM cloud architectures.',
  },
  {
    id: 'forage',
    provider: 'Forage & Fortune 500 Employers',
    programName: 'Forage Virtual Experience Programs - Fortune 500 Work Simulations',
    category: 'business',
    areas: ['Software Engineering Simulations', 'Data Analytics Simulations', 'Cybersecurity Simulations', 'Consulting & Banking'],
    skills: ['Software Engineering', 'Data Analytics', 'Python', 'Cybersecurity', 'Web Development', 'Problem Solving', 'Data Analysis', 'Git', 'Agile'],
    badgeType: 'free_badge',
    badgeLabel: '100% Free Verified Certificates',
    officialUrl: 'https://www.theforage.com/',
    shortDesc: 'Free open-access virtual job simulations designed by leading global employers (JPMorgan Chase, Goldman Sachs, BCG, Accenture, Tata, Walmart). Earn resume-ready certificates.',
  },
  {
    id: 'tcs-ion',
    provider: 'Tata Consultancy Services (TCS)',
    programName: 'TCS iON Digital Learning - Enterprise IT & Software Competency Track',
    category: 'tech',
    areas: ['TCS NQT Preparation', 'Full Stack Development', 'Cloud & DevOps', 'Enterprise Banking & IT'],
    skills: ['Java', 'Python', 'SQL', 'Cloud', 'Data Structures', 'Algorithms', 'Web Development', 'DevOps'],
    badgeType: 'hybrid',
    badgeLabel: 'Industry Verified Certs',
    officialUrl: 'https://learning.tcsionhub.in/',
    shortDesc: 'Tata Consultancy Services flagship enterprise learning hub providing industry certifications, digital competencies, and masterclasses.',
  },
]

/**
 * Matches and ranks verified company learning programs against student missing & partial skills.
 *
 * @param {object} params
 * @param {Array<string|object>} params.missingSkills - Missing skills required for target role.
 * @param {Array<string|object>} params.partialSkills - Partial skills where prerequisites are known.
 * @param {string} params.targetRole - Target career role title.
 * @param {number} [params.limit=4] - Maximum recommendations to return.
 * @returns {Array<object>} Ranked recommendations with explainability.
 */
export const recommendCompanyLearningPrograms = ({
  missingSkills = [],
  partialSkills = [],
  targetRole = '',
  limit = 4,
} = {}) => {
  const missingList = missingSkills.map((item) => (typeof item === 'string' ? item : item.skill || '')).filter(Boolean)
  const partialList = partialSkills.map((item) => (typeof item === 'string' ? item : item.skill || '')).filter(Boolean)

  const normalizedMissing = new Set(missingList.map(normalizeSkill).filter(Boolean))
  const normalizedPartial = new Set(partialList.map(normalizeSkill).filter(Boolean))

  const allTargetGaps = new Set([...normalizedMissing, ...normalizedPartial])

  if (allTargetGaps.size === 0) {
    // If student has no gaps, recommend advanced tracks from flagship platforms
    return AICP_COMPANY_PROGRAMS.slice(0, limit).map((prog) => ({
      company: prog.provider,
      programName: prog.programName,
      skillsCovered: prog.skills.slice(0, 4),
      matchedMissingSkills: [],
      matchScore: 85,
      badgeLabel: prog.badgeLabel,
      officialUrl: prog.officialUrl,
      whyRecommended: `You already meet all core requirements for ${targetRole || 'your target role'}! This program provides advanced enterprise credentials and capstone project experience.`,
    }))
  }

  const scoredPrograms = []

  for (const program of AICP_COMPANY_PROGRAMS) {
    const programSkillsNormalized = program.skills.map(normalizeSkill).filter(Boolean)

    // Find intersection with missing skills
    const matchedMissing = programSkillsNormalized.filter((s) => normalizedMissing.has(s))
    const matchedPartial = programSkillsNormalized.filter((s) => normalizedPartial.has(s))

    const totalCovered = [...matchedMissing, ...matchedPartial]
    if (totalCovered.length === 0) {
      continue // Strictly ignore programs that do NOT cover any missing or partial skills
    }

    // Weight score: missing skills = 30 pts each, partial skills = 20 pts each
    let score = matchedMissing.length * 30 + matchedPartial.length * 20

    // Domain relevance bonus
    const roleLower = targetRole.toLowerCase()
    if (
      (program.category === 'ai' && (roleLower.includes('data') || roleLower.includes('machine') || roleLower.includes('ai') || roleLower.includes('deep'))) ||
      (program.category === 'cloud' && (roleLower.includes('cloud') || roleLower.includes('devops') || roleLower.includes('aws') || roleLower.includes('azure'))) ||
      (program.category === 'cyber' && (roleLower.includes('cyber') || roleLower.includes('security') || roleLower.includes('network'))) ||
      (program.category === 'tech' && (roleLower.includes('developer') || roleLower.includes('engineer') || roleLower.includes('stack') || roleLower.includes('frontend') || roleLower.includes('backend')))
    ) {
      score += 15
    }

    // Cap score at 98
    const matchScore = Math.min(98, score)

    // Build human explainability
    const skillsListStr = totalCovered.slice(0, 3).join(', ')
    const whyRecommended = matchedMissing.length > 0
      ? `This program covers ${skillsListStr}${totalCovered.length > 3 ? ` (+${totalCovered.length - 3} more)` : ''}, which are among your highest-priority missing skills for ${targetRole || 'your target role'}.`
      : `This program covers ${skillsListStr}, building directly on your foundational knowledge to accelerate your transition to ${targetRole || 'your target role'}.`

    scoredPrograms.push({
      company: program.provider,
      programName: program.programName,
      skillsCovered: program.skills.slice(0, 5),
      matchedMissingSkills: totalCovered,
      matchScore,
      badgeLabel: program.badgeLabel,
      officialUrl: program.officialUrl,
      whyRecommended,
    })
  }

  // Sort descending by match score
  scoredPrograms.sort((a, b) => b.matchScore - a.matchScore)

  return scoredPrograms.slice(0, limit)
}

