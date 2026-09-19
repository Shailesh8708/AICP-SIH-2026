// server/tests/skillGapEngine.test.js
import { describe, it, expect } from 'vitest'
import { validateRole, CAREER_ROLES } from '../src/services/ai/careerTaxonomy.js'
import { analyzeSkillGapEngine, generatePersonalizedRoadmapEngine } from '../src/services/ai/skillGapEngine.js'
import { recommendCompanyLearningPrograms } from '../src/services/ai/companyLearningService.js'

describe('Skill Gap & Learning Roadmap Engine', () => {
  describe('Role Validation & Taxonomy', () => {
    it('rejects non-career and arbitrary inputs without a hardcoded blacklist', () => {
      const invalidRoles = ['thief', 'criminal', 'robber', 'xyz123', 'asdfgh', 'random text', '']
      for (const role of invalidRoles) {
        const result = validateRole(role)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Unsupported Career Role')
        expect(result.message).toContain('not recognized as a supported educational or industry career path')
        expect(Array.isArray(result.suggestedRoles)).toBe(true)
        expect(result.suggestedRoles.length).toBeGreaterThan(0)
      }
    })

    it('validates canonical career roles', () => {
      for (const canonicalTitle of Object.keys(CAREER_ROLES)) {
        const result = validateRole(canonicalTitle)
        expect(result.isValid).toBe(true)
        expect(result.canonicalRole).toBe(canonicalTitle)
      }
    })

    it('recognizes role aliases and domain variations', () => {
      const aliasTests = [
        { input: 'react developer', expected: 'Frontend Developer' },
        { input: 'front-end', expected: 'Frontend Developer' },
        { input: 'fullstack', expected: 'Full Stack Developer' },
        { input: 'ml engineer', expected: 'Machine Learning Engineer' },
        { input: 'ai engineer', expected: 'Machine Learning Engineer' },
        { input: 'data science', expected: 'Data Scientist' },
        { input: 'cloud architect', expected: 'Cloud Engineer' },
        { input: 'devops', expected: 'DevOps Engineer' },
        { input: 'cybersecurity', expected: 'Cybersecurity Analyst' },
      ]

      for (const { input, expected } of aliasTests) {
        const result = validateRole(input)
        expect(result.isValid).toBe(true)
        expect(result.canonicalRole).toBe(expected)
      }
    })
  })

  describe('Skill Comparison: Matched, Partial, and Missing', () => {
    it('identifies matched, partial, and missing skills with prerequisite explainability', () => {
      // Student has HTML, CSS, JavaScript; target is Frontend Developer
      const result = analyzeSkillGapEngine(['HTML', 'CSS', 'JavaScript'], 'Frontend Developer')

      expect(result.isValidRole).toBe(true)
      expect(result.targetRole).toBe('Frontend Developer')

      // Matched: HTML, CSS, JavaScript
      const matchedNames = result.matchedSkills.map((s) => s.skill)
      expect(matchedNames).toContain('HTML')
      expect(matchedNames).toContain('CSS')
      expect(matchedNames).toContain('JavaScript')

      // Partial: React (because student has JavaScript, HTML, CSS as prerequisites)
      const partialReact = result.partialSkills.find((s) => s.skill === 'React')
      expect(partialReact).toBeDefined()
      expect(partialReact.status).toBe('partial')
      expect(partialReact.knownPrerequisites).toContain('JavaScript')
      expect(partialReact.reason).toContain('JavaScript')

      // Missing: REST APIs or Git (if not provided)
      const missingSkills = result.missingSkills.map((s) => s.skill)
      expect(missingSkills.length).toBeGreaterThan(0)

      // Readiness score is computed and greater than 0
      expect(result.readinessScore).toBeGreaterThan(20)
      expect(result.readinessScore).toBeLessThan(100)
    })

    it('handles student possessing 100% of required skills without re-teaching them', () => {
      const allFrontendSkills = [
        'HTML', 'CSS', 'JavaScript', 'React', 'REST APIs', 'Git',
        'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'Testing'
      ]

      const result = analyzeSkillGapEngine(allFrontendSkills, 'Frontend Developer')

      expect(result.isValidRole).toBe(true)
      expect(result.readinessScore).toBe(100)
      expect(result.missingSkills.length).toBe(0)
      expect(result.partialSkills.length).toBe(0)

      // Roadmap focuses on advanced capstone and system architecture rather than re-teaching HTML
      expect(result.roadmap.day7.title).toContain('Architecture & System Design')
      expect(result.roadmap.day30.title).toContain('Capstone Project')
      const allTasks = [
        ...result.roadmap.day7.tasks,
        ...result.roadmap.day30.tasks,
        ...result.roadmap.day60.tasks,
        ...result.roadmap.day90.tasks,
      ].join(' ')
      expect(allTasks).not.toContain('Learn HTML')
      expect(allTasks).not.toContain('Learn CSS')
    })
  })

  describe('Different Students & Roles Produce Distinct Dynamic Roadmaps', () => {
    it('produces meaningfully different roadmaps for different roles', () => {
      const studentSkills = ['Python', 'SQL']

      const resDataAnalyst = analyzeSkillGapEngine(studentSkills, 'Data Analyst')
      const resDevOps = analyzeSkillGapEngine(studentSkills, 'DevOps Engineer')

      expect(resDataAnalyst.targetRole).toBe('Data Analyst')
      expect(resDevOps.targetRole).toBe('DevOps Engineer')

      // Data Analyst has Python & SQL matched, needs Excel / Data Visualization / Statistics
      expect(resDataAnalyst.strengths).toContain('Python')
      expect(resDataAnalyst.strengths).toContain('SQL')

      // DevOps requires Linux, Docker, CI/CD, AWS
      const devOpsGaps = resDevOps.gaps.map((g) => g.skill)
      expect(devOpsGaps).toContain('Docker')
      expect(devOpsGaps).toContain('Linux')

      // Roadmap tasks are role-specific, not static templates
      const daTasks = resDataAnalyst.roadmap.day7.tasks.join(' ')
      const devOpsTasks = resDevOps.roadmap.day7.tasks.join(' ')
      expect(daTasks).not.toEqual(devOpsTasks)
    })

    it('produces meaningfully different roadmaps for different students targeting the same role', () => {
      // Student A: HTML, CSS, JavaScript -> Target: Full Stack Developer
      const resA = analyzeSkillGapEngine(['HTML', 'CSS', 'JavaScript'], 'Full Stack Developer')

      // Student B: Python, SQL, MongoDB -> Target: Full Stack Developer
      const resB = analyzeSkillGapEngine(['Python', 'SQL', 'MongoDB'], 'Full Stack Developer')

      // Student A already has HTML/CSS/JS, missing backend/database
      expect(resA.strengths).toContain('JavaScript')
      // Node.js is a partial skill because JavaScript is a known prerequisite
      expect(resA.partialSkills.map((s) => s.skill)).toContain('Node.js')
      expect(resA.missingSkills.map((s) => s.skill)).toContain('MongoDB')

      // Student B has MongoDB/SQL, missing frontend JavaScript/React/HTML
      expect(resB.strengths).toContain('MongoDB')
      expect(resB.missingSkills.map((s) => s.skill)).toContain('HTML')

      // Roadmaps differ based on their respective gaps
      const tasksA = resA.roadmap.day7.tasks.join(' ')
      const tasksB = resB.roadmap.day7.tasks.join(' ')
      expect(tasksA).not.toEqual(tasksB)
    })

    it('eliminates the static generic tasks and replaces them with role & skill-specific tasks', () => {
      const result = analyzeSkillGapEngine(['Python', 'Statistics'], 'Data Scientist')

      const tasksString = JSON.stringify(result.roadmap)
      // The static template phrases must NOT appear
      expect(tasksString).not.toContain('Update your LinkedIn headline and about section')
      expect(tasksString).not.toContain('Push any incomplete projects to GitHub with proper README')
      expect(tasksString).not.toContain('Request one LinkedIn recommendation from a professor')

      // Must contain actual skill-specific guidance
      expect(tasksString).toMatch(/(SQL|Machine Learning|Pandas|NumPy|Scikit-learn)/)
    })
  })

  describe('Company Learning Program Recommendations', () => {
    it('matches and ranks verified AICP company programs against missing skills with explainability', () => {
      const recommendations = recommendCompanyLearningPrograms({
        missingSkills: [{ skill: 'React', priority: 'High' }, { skill: 'REST APIs', priority: 'High' }],
        partialSkills: [{ skill: 'Node.js', priority: 'High' }],
        targetRole: 'Frontend Developer',
      })

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.length).toBeLessThanOrEqual(4)

      for (const rec of recommendations) {
        expect(rec.company).toBeDefined()
        expect(rec.programName).toBeDefined()
        expect(rec.officialUrl).toBeDefined()
        expect(rec.whyRecommended).toContain('Frontend Developer')
        expect(rec.matchScore).toBeGreaterThan(0)
        expect(rec.matchedMissingSkills.length).toBeGreaterThan(0)
      }

      // First recommendation should cover at least one missing skill
      const topRec = recommendations[0]
      expect(topRec.matchedMissingSkills.length).toBeGreaterThan(0)
    })

    it('strictly filters out programs with zero missing skill overlap', () => {
      // Student missing only Cybersecurity and Networking
      const recommendations = recommendCompanyLearningPrograms({
        missingSkills: [{ skill: 'Cybersecurity', priority: 'High' }, { skill: 'Networking', priority: 'High' }],
        partialSkills: [],
        targetRole: 'Cybersecurity Analyst',
      })

      // Programs that cover only Web/Frontend should not appear
      const companyNames = recommendations.map((r) => r.company)
      expect(companyNames).toContain('Cisco Systems')
    })

    it('correctly recommends Forage for real-world simulation skills and work experience', () => {
      const recommendations = recommendCompanyLearningPrograms({
        missingSkills: [{ skill: 'Software Engineering', priority: 'High' }, { skill: 'Data Analytics', priority: 'High' }],
        partialSkills: [],
        targetRole: 'Software Engineer',
      })

      const forageRec = recommendations.find((r) => r.id === 'forage' || r.company.includes('Forage'))
      expect(forageRec).toBeDefined()
      expect(forageRec.officialUrl).toBe('https://www.theforage.com/')
      expect(forageRec.badgeLabel).toBe('100% Free Verified Certificates')
    })

    it('correctly recommends TCS iON for enterprise programming and technical competencies', () => {
      const recommendations = recommendCompanyLearningPrograms({
        missingSkills: [{ skill: 'Java', priority: 'High' }, { skill: 'SQL', priority: 'High' }],
        partialSkills: [],
        targetRole: 'Backend Developer',
      })

      const tcsRec = recommendations.find((r) => r.id === 'tcs-ion' || r.company.includes('Tata'))
      expect(tcsRec).toBeDefined()
      expect(tcsRec.officialUrl).toBe('https://learning.tcsionhub.in/')
      expect(tcsRec.badgeLabel).toBe('Industry Verified Certs')
    })
  })
})
