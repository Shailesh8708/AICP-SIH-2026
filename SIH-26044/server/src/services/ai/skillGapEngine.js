// server/src/services/ai/skillGapEngine.js
/**
 * AICP AI Skill Gap & Learning Roadmap Engine
 *
 * Performs deterministic, ontology-backed skill comparison:
 * Student Skills -> Skill Normalization -> Role Validation -> Matched / Partial / Missing -> Prioritization -> Dynamic Personalized Roadmap -> Company Learning Recommendations
 *
 * AI Safety: Never fabricates generic roadmaps, fake companies, or nonexistent credentials.
 */

import { normalizeSkill, normalizeSkillsList } from './skillNormalizer.js'
import { CAREER_ROLES, SKILL_DEPENDENCY_GRAPH, validateRole } from './careerTaxonomy.js'
import { recommendCompanyLearningPrograms } from './companyLearningService.js'

/**
 * Perform a full role-aware, student-specific skill gap analysis.
 *
 * @param {Array<string>} studentSkills - Raw or normalized student skills.
 * @param {string} targetRole - Target educational or industry career role.
 * @returns {object} Skill gap analysis result.
 */
export const analyzeSkillGapEngine = (studentSkills = [], targetRole = '') => {
  // 1. Role Validation
  const validation = validateRole(targetRole)
  if (!validation.isValid) {
    return {
      isValidRole: false,
      targetRole: String(targetRole || '').trim(),
      error: validation.error,
      message: validation.message,
      suggestedRoles: validation.suggestedRoles || [],
      readinessScore: 0,
      strengths: [],
      matchedSkills: [],
      partialSkills: [],
      missingSkills: [],
      gaps: [],
      roadmap: null,
      recommendedPrograms: [],
    }
  }

  const canonicalRole = validation.canonicalRole
  const roleDef = validation.roleData || CAREER_ROLES[canonicalRole]

  // 2. Normalize student skills
  const normalizedStudentSkills = new Set(normalizeSkillsList(studentSkills))

  // 3. Collect required skills (core + secondary)
  const coreSkills = (roleDef.coreSkills || []).map(normalizeSkill).filter(Boolean)
  const secondarySkills = (roleDef.secondarySkills || []).map(normalizeSkill).filter(Boolean)
  const allRequired = Array.from(new Set([...coreSkills, ...secondarySkills]))

  const matchedSkills = []
  const partialSkills = []
  const missingSkills = []

  for (const skill of allRequired) {
    const isCore = coreSkills.includes(skill)
    const depMeta = SKILL_DEPENDENCY_GRAPH[skill] || {
      prerequisites: [],
      difficulty: isCore ? 'Intermediate' : 'Beginner',
      category: 'General',
    }

    if (normalizedStudentSkills.has(skill)) {
      matchedSkills.push({
        skill,
        status: 'matched',
        isCore,
        difficulty: depMeta.difficulty,
        category: depMeta.category,
      })
    } else {
      // Skill is not yet possessed by student
      const prereqs = (depMeta.prerequisites || []).map(normalizeSkill).filter(Boolean)
      const knownPrereqs = prereqs.filter((p) => normalizedStudentSkills.has(p))

      if (knownPrereqs.length > 0) {
        // Partial gap: student has foundational prerequisite knowledge
        const allMet = prereqs.every((p) => normalizedStudentSkills.has(p))
        partialSkills.push({
          skill,
          status: 'partial',
          isCore,
          priority: isCore ? 'High' : 'Medium',
          difficulty: depMeta.difficulty,
          knownPrerequisites: knownPrereqs,
          allPrerequisites: prereqs,
          allPrerequisitesMet: allMet,
          reason: `You already have foundational knowledge in ${knownPrereqs.join(', ')}, which provides the direct conceptual bridge to master ${skill}.`,
        })
      } else {
        // Missing gap: no direct prerequisites found in profile
        missingSkills.push({
          skill,
          status: 'missing',
          isCore,
          priority: isCore ? 'High' : 'Medium',
          difficulty: depMeta.difficulty,
          allPrerequisites: prereqs,
          reason: isCore
            ? `Core fundamental competency required for ${canonicalRole}.`
            : `Recommended specialized competency to elevate ${canonicalRole} competitiveness.`,
        })
      }
    }
  }

  // 4. Calculate Readiness Score
  const totalRequired = allRequired.length
  const rawScore = totalRequired > 0
    ? ((matchedSkills.length * 1.0 + partialSkills.length * 0.5) / totalRequired) * 100
    : 0
  const readinessScore = Math.min(100, Math.round(rawScore))

  // 5. Gap prioritization: Sort High priority first, then partial with met prerequisites
  const sortGaps = (a, b) => {
    if (a.priority === 'High' && b.priority !== 'High') return -1
    if (a.priority !== 'High' && b.priority === 'High') return 1
    if (a.status === 'partial' && b.status !== 'partial') return -1
    if (a.status !== 'partial' && b.status === 'partial') return 1
    return 0
  }

  partialSkills.sort(sortGaps)
  missingSkills.sort(sortGaps)

  // Combined gaps for backward compatibility with existing callers
  const combinedGaps = [
    ...partialSkills.map((p) => ({
      skill: p.skill,
      importance: p.priority.toLowerCase(),
      reason: p.reason,
      status: 'partial',
      priority: p.priority,
      knownPrerequisites: p.knownPrerequisites,
    })),
    ...missingSkills.map((m) => ({
      skill: m.skill,
      importance: m.priority.toLowerCase(),
      reason: m.reason,
      status: 'missing',
      priority: m.priority,
    })),
  ]

  // 6. Generate Dynamic Personalized Roadmap
  const roadmap = generatePersonalizedRoadmapEngine({
    canonicalRole,
    matchedSkills: matchedSkills.map((s) => s.skill),
    partialSkills,
    missingSkills,
    readinessScore,
  })

  // 7. Recommend Company Learning Programs
  const recommendedPrograms = recommendCompanyLearningPrograms({
    missingSkills,
    partialSkills,
    targetRole: canonicalRole,
    limit: 4,
  })

  return {
    isValidRole: true,
    targetRole: canonicalRole,
    category: roleDef.category,
    description: roleDef.description,
    readinessScore,
    strengths: matchedSkills.map((s) => s.skill),
    matchedSkills,
    partialSkills,
    missingSkills,
    gaps: combinedGaps,
    roadmap,
    recommendedPrograms,
    nextCareers: roleDef.nextCareers || [],
    disclaimer: 'Skill gaps and roadmap milestones are generated dynamically based on your profile evidence and AICP verified ontology.',
  }
}

/**
 * Dynamically generates personalized learning roadmap phases.
 * Respects prerequisites and never re-teaches skills the student already knows.
 */
export const generatePersonalizedRoadmapEngine = ({
  canonicalRole = '',
  matchedSkills = [],
  partialSkills = [],
  missingSkills = [],
  readinessScore = 0,
} = {}) => {
  const allGaps = [...partialSkills, ...missingSkills]

  // Case A: 100% matched — student already possesses all required skills
  if (allGaps.length === 0) {
    return {
      targetRole: canonicalRole,
      readinessScore: 100,
      disclaimer: 'You have verified competencies in all core skills for this role. Focus on production architecture, system design, and placement pipelines.',
      day7: {
        title: 'Phase 1: Architecture & System Design (Days 1–14)',
        focusSkills: matchedSkills.slice(0, 3),
        tasks: [
          `Review advanced system architecture and scalability patterns for ${canonicalRole}`,
          `Audit your existing projects for performance bottlenecks, test coverage, and documentation`,
          `Set up production monitoring and telemetry blueprints for your strongest implementations`,
        ],
      },
      day30: {
        title: 'Phase 2: Full-Scale Capstone Project (Days 15–35)',
        focusSkills: matchedSkills.slice(2, 5),
        tasks: [
          `Build and deploy an enterprise-grade capstone project integrating ${matchedSkills.slice(0, 3).join(', ')}`,
          `Incorporate automated CI/CD pipelines, containerization, and cloud deployment`,
          `Write a thorough technical case study detailing trade-offs, architecture, and benchmarks`,
        ],
      },
      day60: {
        title: 'Phase 3: Industry Technical Practice (Days 36–60)',
        focusSkills: ['Interview Readiness', 'System Design'],
        tasks: [
          `Complete 5+ advanced AICP technical mock interviews tailored for ${canonicalRole}`,
          `Practice live coding and domain-specific architectural whiteboard challenges`,
          `Contribute to open-source repositories relevant to ${canonicalRole}`,
        ],
      },
      day90: {
        title: 'Phase 4: Placement & High-Impact Applications (Days 61–90)',
        focusSkills: ['ATS Resume', 'Opportunity Pipeline'],
        tasks: [
          `Finalize ATS resume highlighting production metrics from your verified capstone`,
          `Apply to top-tier verified internship and full-time opportunities on AICP`,
          `Engage with verified industry partners and academic mentors for direct referrals`,
        ],
      },
    }
  }

  // Case B: Partial & Missing Gaps present — dynamically assign phases based on gaps and prerequisites

  // Separate immediate actionable gaps (partial skills where prereqs are already known, or beginner missing skills)
  const phase1Skills = []
  const phase2Skills = []
  const phase3Skills = []
  const phase4Skills = []

  for (const gap of allGaps) {
    if (gap.status === 'partial' || gap.difficulty === 'Beginner') {
      if (phase1Skills.length < 2) {
        phase1Skills.push(gap)
      } else {
        phase2Skills.push(gap)
      }
    } else if (gap.isCore) {
      if (phase2Skills.length < 2) {
        phase2Skills.push(gap)
      } else {
        phase3Skills.push(gap)
      }
    } else {
      phase4Skills.push(gap)
    }
  }

  // Ensure balance across phases
  const unassigned = [...allGaps]
  const p1 = phase1Skills.length > 0 ? phase1Skills : [unassigned[0]].filter(Boolean)
  const p2 = phase2Skills.length > 0 ? phase2Skills : [unassigned[1] || unassigned[0]].filter(Boolean)
  const p3 = phase3Skills.length > 0 ? phase3Skills : [unassigned[2] || unassigned[0]].filter(Boolean)
  const p4 = phase4Skills.length > 0 ? phase4Skills : [unassigned[3] || unassigned[1] || unassigned[0]].filter(Boolean)

  const buildPhaseTasks = (skills, phaseNumber) => {
    const tasks = []
    for (const g of skills) {
      const skillName = g.skill
      const depMeta = SKILL_DEPENDENCY_GRAPH[skillName]
      const topics = depMeta?.topics

      if (g.status === 'partial') {
        tasks.push(
          `Leverage your known ${g.knownPrerequisites.join(', ')} skills to accelerate learning ${skillName}: master core syntax and key design patterns.`
        )
      } else if (topics?.beginner?.[0]) {
        tasks.push(`Master ${skillName} fundamentals: ${topics.beginner[0]} and ${topics.beginner[1] || 'hands-on labs'}.`)
      } else {
        tasks.push(`Complete dedicated beginner-to-intermediate course modules on ${skillName}.`)
      }

      if (topics?.intermediate?.[0]) {
        tasks.push(`Deep dive into ${skillName} intermediate concepts: ${topics.intermediate[0]}.`)
      }
    }

    if (phaseNumber === 1) {
      tasks.push('Create a dedicated GitHub repository for daily hands-on practice code and documentation.')
    } else if (phaseNumber === 2) {
      tasks.push(`Connect newly learned skills with your existing strengths (${matchedSkills.slice(0, 2).join(', ') || 'programming'}) in small integration exercises.`)
    } else if (phaseNumber === 3) {
      const practicalProject = SKILL_DEPENDENCY_GRAPH[skills[0]?.skill]?.topics?.project
        || `Build an end-to-end practical project highlighting ${skills.map((s) => s.skill).join(' and ')}.`
      tasks.push(`Practical Capstone: ${practicalProject}`)
      tasks.push('Implement automated tests and push production code with a detailed technical README.')
    } else {
      tasks.push(`Polish your ATS resume with concrete achievements featuring ${skills.map((s) => s.skill).join(', ')}.`)
      tasks.push(`Complete 3+ AICP mock interview rounds tailored specifically for ${canonicalRole}.`)
      tasks.push(`Target and apply to 10+ matching opportunities on AICP.`)
    }

    return tasks
  }

  const p1Names = p1.map((g) => g.skill)
  const p2Names = p2.map((g) => g.skill)
  const p3Names = p3.map((g) => g.skill)
  const p4Names = p4.map((g) => g.skill)

  return {
    targetRole: canonicalRole,
    readinessScore,
    disclaimer: 'This roadmap is dynamically generated from your actual skill gaps, prerequisite dependencies, and AICP verified curriculum.',
    day7: {
      title: `Phase 1: Foundation & Prerequisite Bridges (Days 1–14)`,
      focusSkills: p1Names,
      tasks: buildPhaseTasks(p1, 1),
    },
    day30: {
      title: `Phase 2: Core Competencies & Architecture (Days 15–35)`,
      focusSkills: p2Names,
      tasks: buildPhaseTasks(p2, 2),
    },
    day60: {
      title: `Phase 3: Integration & Capstone Build (Days 36–65)`,
      focusSkills: p3Names,
      tasks: buildPhaseTasks(p3, 3),
    },
    day90: {
      title: `Phase 4: Specialization, ATS Resume & Placement Readiness (Days 66–90)`,
      focusSkills: p4Names,
      tasks: buildPhaseTasks(p4, 4),
    },
  }
}

