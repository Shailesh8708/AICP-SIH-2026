// server/src/services/ai/matchingEngine.js
// Multi-Signal Skill-Based Student Opportunity Matching Engine

import { normalizeSkill } from './skillNormalizer.js'
import { analyzeStudentEligibility } from './eligibilityAnalyzer.js'

const tokenize = (str = '') =>
  new Set(
    String(str)
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length > 2) || []
  )

// Role keyword associations to correlate skills with job titles
const ROLE_SKILL_AFFINITIES = {
  ai_ml: ['python', 'machine learning', 'artificial intelligence', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'data science'],
  data: ['sql', 'python', 'data analysis', 'power bi', 'tableau', 'statistics', 'excel', 'pandas'],
  frontend: ['react', 'javascript', 'html', 'css', 'typescript', 'ui design', 'next.js', 'vue'],
  backend: ['node.js', 'express', 'python', 'java', 'mongodb', 'sql', 'rest apis', 'c++', 'go', 'spring boot'],
  cloud: ['aws', 'cloud', 'docker', 'kubernetes', 'azure', 'linux', 'ci/cd', 'devops'],
  embedded: ['c', 'c++', 'embedded systems', 'iot', 'microcontrollers', 'rtos'],
  security: ['cybersecurity', 'networking', 'linux', 'python', 'cryptography'],
}

/**
 * Calculates role and title affinity score between user profile and opportunity title
 */
const computeRoleAffinity = (title = '', userSkills = new Set(), userInterests = []) => {
  const normTitle = title.toLowerCase()
  const titleTokens = tokenize(normTitle)
  let affinityScore = 0.5 // baseline neutral

  // Check category affinities
  for (const [_, keywords] of Object.entries(ROLE_SKILL_AFFINITIES)) {
    const roleMatchesTitle = keywords.some((k) => normTitle.includes(k))
    if (roleMatchesTitle) {
      const userMatchesCategory = keywords.filter((k) => userSkills.has(k)).length
      if (userMatchesCategory > 0) {
        affinityScore = Math.min(1.0, 0.6 + (userMatchesCategory / keywords.length) * 0.8)
        break
      }
    }
  }

  // Check direct title token overlap
  let directMatches = 0
  for (const token of titleTokens) {
    if (userSkills.has(token) || userInterests.some((i) => i.toLowerCase().includes(token))) {
      directMatches++
    }
  }

  if (directMatches > 0) {
    affinityScore = Math.max(affinityScore, Math.min(1.0, 0.7 + directMatches * 0.15))
  }

  return affinityScore
}

export const computeStudentMatch = ({
  studentUser = {},
  studentProfile = {},
  portfolio = {},
  opportunity = {},
}) => {
  // 1. Gather student skills from all sources
  const studentRawSkills = [
    ...(studentUser.skills || []),
    ...(studentProfile.skills || []),
    ...((studentProfile.skillSelfAssessment || []).map((s) => s.skillName || '')),
    ...((portfolio.projects || []).flatMap((p) => p.technologies || [])),
  ]
  const studentSkills = Array.from(
    new Set(studentRawSkills.map((s) => normalizeSkill(s)).filter(Boolean))
  )
  const studentSkillSet = new Set(studentSkills.map((s) => s.toLowerCase()))
  const hasUserSkills = studentSkillSet.size > 0

  // 2. Gather opportunity skills
  const reqSkills = Array.isArray(opportunity.requiredSkills)
    ? opportunity.requiredSkills.map((s) => normalizeSkill(s)).filter(Boolean)
    : []
  const prefSkills = Array.isArray(opportunity.preferredSkills)
    ? opportunity.preferredSkills.map((s) => normalizeSkill(s)).filter(Boolean)
    : []

  const matchedRequired = reqSkills.filter((s) => studentSkillSet.has(s.toLowerCase()))
  const matchedPreferred = prefSkills.filter((s) => studentSkillSet.has(s.toLowerCase()))
  const missingSkills = reqSkills.filter((s) => !studentSkillSet.has(s.toLowerCase()))

  // Factor 1: Skill Match Score (Weight: 45%)
  let skillScore = 0.2
  if (hasUserSkills) {
    const reqWeight = reqSkills.length || 1
    const prefWeight = prefSkills.length || 1
    const reqRatio = matchedRequired.length / reqWeight
    const prefRatio = matchedPreferred.length / prefWeight
    skillScore = reqRatio * 0.8 + prefRatio * 0.2
  }

  // Factor 2: Role & Title Match Score (Weight: 20%)
  const roleScore = computeRoleAffinity(
    opportunity.title,
    studentSkillSet,
    studentProfile.interests || []
  )

  // Factor 3: Technology Stack & Semantic Description Fit (Weight: 15%)
  const profileTokens = tokenize([
    studentProfile.bio,
    portfolio.bio,
    ...(studentProfile.interests || []),
    ...(studentProfile.careerGoals || []),
    ...studentSkills,
  ].join(' '))

  const oppTokens = tokenize([
    opportunity.title,
    opportunity.description,
    opportunity.ai?.category || '',
    ...reqSkills,
  ].join(' '))

  let overlap = 0
  for (const t of profileTokens) {
    if (oppTokens.has(t)) overlap++
  }
  const unionSize = new Set([...profileTokens, ...oppTokens]).size || 1
  const techScore = hasUserSkills ? Math.min(1.0, (overlap / unionSize) * 4) : 0.3

  // Factor 4: Experience, CGPA & Eligibility Fit (Weight: 10%)
  const eligibilityResult = analyzeStudentEligibility(studentProfile, opportunity)
  const eligibilityScore = eligibilityResult.eligible ? 1.0 : 0.4
  let batchScore = 0.8
  const studentYear = String(studentProfile.graduationYear || '')
  const oppYears = opportunity.eligibilityCriteria?.graduationYear || []
  if (oppYears.length > 0 && studentYear) {
    batchScore = oppYears.includes(studentYear) ? 1.0 : 0.5
  }
  const educationExperienceScore = (eligibilityScore + batchScore) / 2

  // Factor 5: Location & Work Mode Fit (Weight: 10%)
  let locationScore = 0.7
  const isRemoteOpp =
    opportunity.workMode === 'remote' ||
    (opportunity.location || '').toLowerCase().includes('remote') ||
    Boolean(opportunity.locationDetails?.remote)

  if (isRemoteOpp) {
    locationScore = 1.0
  } else if (studentProfile.location && opportunity.location) {
    if (opportunity.location.toLowerCase().includes(studentProfile.location.toLowerCase())) {
      locationScore = 1.0
    }
  }

  // Multi-Signal Final Weighted Score:
  // Skill (45%) + Role (20%) + Technology (15%) + Education (10%) + Location (10%)
  const totalRaw =
    skillScore * 0.45 +
    roleScore * 0.20 +
    techScore * 0.15 +
    educationExperienceScore * 0.10 +
    locationScore * 0.10

  const matchPercent = hasUserSkills
    ? Math.min(99, Math.max(20, Math.round(totalRaw * 100)))
    : 45 // neutral onboarding score if no skills added yet

  const skillMatch = hasUserSkills
    ? Math.min(100, Math.max(0, Math.round(skillScore * 100)))
    : 0

  const educationMatch = Math.min(100, Math.max(0, Math.round(educationExperienceScore * 100)))

  // Human-readable score label for UI display
  const displayScore = skillMatch >= 75
    ? `${skillMatch}% Skill Match`
    : `${matchPercent}% Match`

  // Generate Explainability ("Why Recommended")
  const whyRecommended = []
  if (matchedRequired.length > 0) {
    whyRecommended.push(`✓ Matches ${matchedRequired.length} key required skill${matchedRequired.length > 1 ? 's' : ''}: ${matchedRequired.slice(0, 3).join(', ')}`)
  }
  if (matchedPreferred.length > 0) {
    whyRecommended.push(`✓ Preferred strength: ${matchedPreferred.slice(0, 2).join(', ')}`)
  }
  if (roleScore >= 0.8) {
    whyRecommended.push(`✓ High role alignment with your career focus`)
  }
  if (eligibilityResult.eligible) {
    whyRecommended.push('✓ Academic profile satisfies company criteria')
  }
  if (isRemoteOpp) {
    whyRecommended.push('✓ Remote / flexible work mode available')
  } else if (opportunity.location) {
    whyRecommended.push(`✓ Location: ${opportunity.location}`)
  }

  // Actionable Skill Gap Advice
  let skillGapAdvice = ''
  if (!hasUserSkills) {
    skillGapAdvice = 'Add your technical skills to your profile to get personalized AI compatibility rankings.'
  } else if (missingSkills.length > 0) {
    skillGapAdvice = `Learn ${missingSkills[0]} to raise your match score above 90%.`
  } else {
    skillGapAdvice = 'Excellent match! Your profile aligns strongly with all listed requirements.'
  }

  const reason = matchedRequired.length > 0
    ? `Your skills in ${matchedRequired.slice(0, 3).join(', ')} directly match what ${opportunity.company?.name || 'this company'} is looking for.`
    : (opportunity.description
        ? opportunity.description.slice(0, 95) + '...'
        : 'This opportunity aligns with your foundational academic and career trajectory.')

  return {
    matchScore: Number((matchPercent / 100).toFixed(2)),
    matchPercent,
    score: matchPercent,
    compatibility: matchPercent,
    skillMatch,
    roleMatch: Math.round(roleScore * 100),
    techMatch: Math.round(techScore * 100),
    educationMatch,
    displayScore,
    matchedSkills: matchedRequired,
    matchedPreferredSkills: matchedPreferred,
    missingSkills,
    eligible: eligibilityResult.eligible,
    eligibilityReasons: eligibilityResult.reasons,
    whyRecommended,
    reason,
    skillGapAdvice,
    hasUserSkills,
    breakdown: {
      skillScore: skillMatch,
      roleScore: Math.round(roleScore * 100),
      techScore: Math.round(techScore * 100),
      eligibilityScore: educationMatch,
      locationScore: Math.round(locationScore * 100),
    },
  }
}
