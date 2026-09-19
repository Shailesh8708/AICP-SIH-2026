// server/src/services/ai/skillExtractor.js
// In-House Rule-Based Skill Extraction Engine

import { normalizeSkill } from './skillNormalizer.js'

// Pre-compiled regexes for high-frequency multi-word skills
const MULTI_WORD_PATTERNS = [
  { regex: /\b(machine\s+learning)\b/gi, skill: 'Machine Learning' },
  { regex: /\b(deep\s+learning)\b/gi, skill: 'Deep Learning' },
  { regex: /\b(natural\s+language\s+processing)\b/gi, skill: 'NLP' },
  { regex: /\b(computer\s+vision)\b/gi, skill: 'Computer Vision' },
  { regex: /\b(data\s+analysis|data\s+analytics)\b/gi, skill: 'Data Analytics' },
  { regex: /\b(data\s+science)\b/gi, skill: 'Data Science' },
  { regex: /\b(data\s+visualization)\b/gi, skill: 'Data Visualization' },
  { regex: /\b(rest\s+apis?|restful\s+apis?)\b/gi, skill: 'REST APIs' },
  { regex: /\b(spring\s+boot)\b/gi, skill: 'Spring Boot' },
  { regex: /\b(react\s*(\.js|js)?)\b/gi, skill: 'React' },
  { regex: /\b(node\s*(\.js|js)?)\b/gi, skill: 'Node.js' },
  { regex: /\b(express\s*(\.js|js)?)\b/gi, skill: 'Express' },
  { regex: /\b(vue\s*(\.js|js)?)\b/gi, skill: 'Vue.js' },
  { regex: /\b(next\s*(\.js|js)?)\b/gi, skill: 'Next.js' },
  { regex: /\b(tailwind\s*(css)?)\b/gi, skill: 'Tailwind CSS' },
  { regex: /\b(google\s+cloud(\s+platform)?)\b/gi, skill: 'Google Cloud' },
  { regex: /\b(amazon\s+web\s+services)\b/gi, skill: 'AWS' },
  { regex: /\b(microsoft\s+azure)\b/gi, skill: 'Azure' },
  { regex: /\b(embedded\s+systems?)\b/gi, skill: 'Embedded Systems' },
  { regex: /\b(cyber\s*security)\b/gi, skill: 'Cybersecurity' },
  { regex: /\b(problem\s+solving)\b/gi, skill: 'Problem Solving' },
  { regex: /\b(project\s+management)\b/gi, skill: 'Project Management' },
  { regex: /\b(power\s*bi)\b/gi, skill: 'Power BI' },
]

// Single-word boundary tokens to detect
const SINGLE_WORD_SKILLS = [
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'rust',
  'php', 'swift', 'kotlin', 'r', 'scala', 'sql', 'mysql', 'postgresql',
  'mongodb', 'redis', 'graphql', 'docker', 'kubernetes', 'aws', 'gcp', 'azure',
  'linux', 'git', 'github', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'html',
  'css', 'redux', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'pytorch',
  'tensorflow', 'tableau', 'excel', 'spark', 'kafka', 'hadoop', 'matlab',
  'verilog', 'vhdl', 'iot', 'vlsi', 'agile', 'scrum', 'jira'
]

export const extractSkillsFromText = (text = '') => {
  if (!text || typeof text !== 'string') return []
  const found = new Set()

  // 1. Check multi-word patterns first
  for (const { regex, skill } of MULTI_WORD_PATTERNS) {
    if (regex.test(text)) {
      found.add(skill)
    }
  }

  // 2. Check single-word boundaries
  for (const word of SINGLE_WORD_SKILLS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?:^|[\\s,;()/\\[\\]•.!?:-])${escaped}(?:$|[\\s,;()/\\[\\]•.!?:-])`, 'i')
    if (re.test(text)) {
      const normalized = normalizeSkill(word)
      if (normalized) found.add(normalized)
    }
  }

  return Array.from(found)
}

export const extractOpportunitySkills = ({ title = '', description = '', requirements = [] }) => {
  const fullText = [
    title,
    Array.isArray(requirements) ? requirements.join(' ') : String(requirements || ''),
    description,
  ].join(' ')

  const allSkills = extractSkillsFromText(fullText)

  // Segregate into required vs preferred based on contextual cues
  const preferredSectionMatch = description.match(/(?:preferred|good\s+to\s+have|bonus|nice\s+to\s+have|plus)[\s\S]{0,400}/i)
  const preferredText = preferredSectionMatch ? preferredSectionMatch[0] : ''
  const preferredSkills = extractSkillsFromText(preferredText)

  const preferredSet = new Set(preferredSkills)
  const requiredSkills = allSkills.filter((s) => !preferredSet.has(s))

  // If required is empty, assign top skills as required
  if (requiredSkills.length === 0 && allSkills.length > 0) {
    return {
      requiredSkills: allSkills.slice(0, 5),
      preferredSkills: allSkills.slice(5),
    }
  }

  return {
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : allSkills,
    preferredSkills: preferredSkills.length > 0 ? preferredSkills : [],
  }
}
