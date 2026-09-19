// server/tests/linkedinAuditor.test.js
import { describe, it, expect } from 'vitest'
import {
  auditHeadline,
  auditAbout,
  auditExperience,
  auditSkillsAndEvidence,
  auditProjects,
  auditEducation,
  auditFeatured,
  auditCertifications,
  auditCareerAlignment,
  selectTopPriorityImprovements,
  generateProfessionalInsights,
  auditLinkedInProfile,
} from '../src/services/ai/linkedinAuditor.js'

describe('LinkedIn Profile Auditor & Professional Optimizer Engine', () => {
  // ─── Test A: Strong Technical Student ──────────────────────────────────────
  describe('Test A: Strong Technical Student', () => {
    const strongStudentProfile = {
      headline: 'Frontend Engineer | React • TypeScript • Next.js | Building Scalable Web Applications',
      about: 'Computer Science undergraduate passionate about building high-performance web applications. My core engineering stack includes React, TypeScript, Next.js, and Tailwind CSS.\n\nRecently, I architected and implemented CloudDesk and DevPortal, focusing on clean modular architecture and seamless user experiences.\n\nOpen to Software Engineering internships and full-time roles — feel free to connect!',
      skills: ['React', 'TypeScript', 'Next.js', 'JavaScript', 'Tailwind CSS', 'Git', 'REST APIs', 'Node.js', 'Redux', 'Jest'],
      experience: [
        {
          title: 'Frontend Engineering Intern',
          company: 'TechCorp Labs',
          description: 'Engineered reusable UI component library using React and TypeScript, reducing interface development time by 35%. Automated component testing with Jest.',
        },
      ],
      projects: [
        {
          title: 'CloudDesk Dashboard',
          description: 'Architected responsive cloud analytics dashboard using React, TypeScript, and Tailwind CSS. Integrated real-time metrics stream (github.com/student/clouddesk).',
          technologies: ['React', 'TypeScript', 'Tailwind CSS'],
          github: 'https://github.com/student/clouddesk',
        },
        {
          title: 'DevPortal Platform',
          description: 'Developed developer documentation portal with Next.js and REST APIs, supporting 500+ active contributors (github.com/student/devportal).',
          technologies: ['Next.js', 'REST APIs'],
          github: 'https://github.com/student/devportal',
        },
      ],
      education: 'B.Tech in Computer Science, State University, Graduating 2025. Relevant Coursework: Data Structures, Distributed Systems.',
      featured: 'https://github.com/student/clouddesk',
      certifications: ['Meta Frontend Developer Professional Certificate'],
      targetRole: 'Frontend Developer',
      isStudent: true,
    }

    it('recognizes strengths and grants a high score without penalizing lack of 10-year experience', () => {
      const result = auditLinkedInProfile(strongStudentProfile)
      expect(result.overallScore).toBeGreaterThanOrEqual(75)
      expect(result.profileCompleteness).toBe(100)
      expect(result.careerAlignment.status).toBe('Strong Alignment')
      expect(result.dataAvailability.headline).toBe(true)
      expect(result.dataAvailability.experience).toBe(true)
      expect(result.dataAvailability.projects).toBe(true)
    })

    it('verifies skills that have corroborating evidence in projects or experience', () => {
      const result = auditSkillsAndEvidence(
        strongStudentProfile.skills,
        strongStudentProfile.experience,
        strongStudentProfile.projects,
        strongStudentProfile.targetRole
      )
      const verifiedNames = result.verifiedSkills.map((v) => v.skill.toLowerCase())
      expect(verifiedNames).toContain('react')
      expect(verifiedNames).toContain('typescript')
      expect(verifiedNames).toContain('next.js')
      expect(result.verifiedSkills.length).toBeGreaterThan(result.unverifiedSkills.length)
    })

    it('confirms headline includes target role and relevant technical skills', () => {
      const headlineAudit = auditHeadline(
        strongStudentProfile.headline,
        strongStudentProfile.targetRole,
        strongStudentProfile.skills
      )
      expect(headlineAudit.score).toBeGreaterThanOrEqual(75)
      expect(headlineAudit.issues.some((i) => i.includes('too brief'))).toBe(false)
      expect(headlineAudit.options.length).toBe(3)
    })
  })

  // ─── Test B: Beginner Student ──────────────────────────────────────────────
  describe('Test B: Beginner Student Profile', () => {
    const beginnerProfile = {
      headline: 'Student looking for opportunities',
      about: 'I am a hardworking and passionate student eager to learn new technologies.',
      skills: ['HTML', 'CSS', 'Python'],
      experience: [],
      projects: [],
      education: 'B.Tech First Year Student, XYZ College',
      targetRole: 'Frontend Developer',
      isStudent: true,
    }

    it('focuses on foundational profile development and detects buzzwords', () => {
      const result = auditLinkedInProfile(beginnerProfile)
      expect(result.overallScore).toBeLessThan(60)
      expect(result.dataAvailability.experience).toBe(false)
      expect(result.dataAvailability.projects).toBe(false)

      // Transparent disclaimer
      expect(result.availabilityDisclaimer).toContain('Some sections could not be evaluated')

      // Headline issues detect buzzwords and missing technical skills
      const headlineAudit = result.analyzedSections.headline
      expect(headlineAudit.score).toBeLessThan(60)
      expect(headlineAudit.issues.some((i) => i.toLowerCase().includes('buzzword') || i.toLowerCase().includes('target professional role'))).toBe(true)

      // About issues detect clichés
      const aboutAudit = result.analyzedSections.about
      expect(aboutAudit.issues.some((i) => i.toLowerCase().includes('filler') || i.toLowerCase().includes('brief'))).toBe(true)

      // Top priorities focus on foundational additions
      const topActions = result.topPriorityImprovements.map((p) => p.section)
      expect(topActions).toContain('Headline')
      expect(topActions).toContain('About')
    })
  })

  // ─── Test C: Experienced User ──────────────────────────────────────────────
  describe('Test C: Experienced Professional Profile', () => {
    const experiencedProfile = {
      headline: 'Senior Full Stack Engineer | Node.js • React • AWS • Kubernetes | Distributed Architecture',
      about: 'Senior Software Engineer with 6+ years of experience designing high-throughput microservices and scalable web applications.\n\nCore competencies span Node.js, TypeScript, React, Docker, Kubernetes, and AWS. Directed cross-functional engineering pods and delivered fault-tolerant systems handling over 50k daily active users.\n\nOpen to Principal/Senior Engineering roles and technical leadership opportunities.',
      skills: ['Node.js', 'React', 'TypeScript', 'AWS', 'Kubernetes', 'Docker', 'PostgreSQL', 'Redis', 'Microservices', 'CI/CD'],
      experience: [
        {
          title: 'Senior Backend Engineer',
          company: 'Fintech Scaleup',
          description: 'Architected distributed payment processing gateway using Node.js, Redis, and PostgreSQL, reducing transaction failure rate by 42% and processing 10k requests/sec.',
        },
        {
          title: 'Software Engineer',
          company: 'Enterprise Cloud Corp',
          description: 'Engineered event-driven message queuing pipeline using Docker and AWS, increasing deployment velocity by 25%.',
        },
      ],
      projects: [
        {
          title: 'High-Scale Event Broker',
          description: 'Built high-throughput pub/sub engine in Node.js and Redis (github.com/engineer/broker).',
          technologies: ['Node.js', 'Redis'],
        },
      ],
      education: 'B.S. in Computer Science',
      featured: 'https://github.com/engineer/broker',
      certifications: ['AWS Certified Solutions Architect — Professional'],
      targetRole: 'Full Stack Developer',
      isStudent: false,
    }

    it('evaluates experience individually with strong action verbs and quantifiable metrics', () => {
      const expAudit = auditExperience(
        experiencedProfile.experience,
        experiencedProfile.targetRole,
        experiencedProfile.skills
      )
      expect(expAudit.entries.length).toBe(2)
      for (const entry of expAudit.entries) {
        expect(entry.actionVerbsFound.length).toBeGreaterThan(0)
        expect(entry.hasMetrics).toBe(true)
        expect(entry.score).toBeGreaterThanOrEqual(80)
      }
      expect(expAudit.score).toBeGreaterThanOrEqual(80)
    })

    it('produces high score with heavy weighting on experience for non-student profiles', () => {
      const result = auditLinkedInProfile(experiencedProfile)
      expect(result.overallScore).toBeGreaterThanOrEqual(85)
      expect(result.isStudent).toBe(false)
    })
  })

  // ─── Test D: Incomplete Profile & Transparent Data Availability ────────────
  describe('Test D: Incomplete Profile & Data Availability', () => {
    const incompleteProfile = {
      headline: 'Software Developer | Python',
      skills: ['Python', 'SQL'],
      // Missing about, experience, projects, education, featured, certifications
      targetRole: 'Software Developer',
    }

    it('declares exact data availability and does not pretend missing sections were analyzed', () => {
      const result = auditLinkedInProfile(incompleteProfile)
      expect(result.dataAvailability.headline).toBe(true)
      expect(result.dataAvailability.skills).toBe(true)
      expect(result.dataAvailability.about).toBe(false)
      expect(result.dataAvailability.experience).toBe(false)
      expect(result.dataAvailability.projects).toBe(false)
      expect(result.dataAvailability.education).toBe(false)
      expect(result.dataAvailability.featured).toBe(false)

      expect(result.availabilityDisclaimer).toContain('Some sections could not be evaluated because their content was not provided')
      expect(result.profileCompleteness).toBeLessThan(40)
    })
  })

  // ─── Test E: Different Career Directions ───────────────────────────────────
  describe('Test E: Different Career Directions Produce Different Advice', () => {
    const sharedProfile = {
      headline: 'Junior Developer | Python • Data Structures',
      about: 'Passionate about coding and building practical programs.',
      skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'HTML', 'CSS', 'JavaScript'],
    }

    it('produces role-specific keyword recommendations and alignment ratings for ML Engineer vs Frontend Developer', () => {
      // Directed at Machine Learning Engineer
      const mlAudit = auditLinkedInProfile({
        ...sharedProfile,
        targetRole: 'Machine Learning Engineer',
      })

      // Directed at Frontend Developer
      const feAudit = auditLinkedInProfile({
        ...sharedProfile,
        targetRole: 'Frontend Developer',
      })

      // Machine learning expects ML tools (e.g. Scikit-learn, TensorFlow)
      const mlMissing = mlAudit.analyzedSections.skills.missingTargetSkills
      // Frontend expects React, REST APIs, Git
      const feMissing = feAudit.analyzedSections.skills.missingTargetSkills

      expect(mlMissing).not.toEqual(feMissing)
      expect(feMissing.map((s) => s.toLowerCase())).toContain('react')

      // Headlines generated differ based on target role
      const mlHeadlines = mlAudit.analyzedSections.headline.options.map((o) => o.headline)
      const feHeadlines = feAudit.analyzedSections.headline.options.map((o) => o.headline)

      expect(mlHeadlines[0]).toContain('Machine Learning Engineer')
      expect(feHeadlines[0]).toContain('Frontend Developer')
      expect(mlHeadlines[0]).not.toEqual(feHeadlines[0])
    })
  })

  // ─── Test F: Zero Fabrication Policy ───────────────────────────────────────
  describe('Test F: Zero Fabrication Verification', () => {
    it('never fabricates fake companies, degrees, dates, or metrics', () => {
      const input = {
        headline: 'Coder',
        about: 'Working on web tech.',
        skills: ['React', 'Node.js'],
        experience: ['Developer — SmallStartup — Worked on features'],
        targetRole: 'Frontend Developer',
      }

      const result = auditLinkedInProfile(input)

      // Check all generated text for hallucinated metrics
      const headlineOptions = result.analyzedSections.headline.options.map((o) => o.headline).join(' ')
      const aboutOptions = result.analyzedSections.about.options.map((o) => o.content).join(' ')
      const expRecommended = result.analyzedSections.experience.entries[0]?.beforeAfter?.recommended || ''

      // Must not fabricate arbitrary percentages or user counts
      expect(headlineOptions).not.toMatch(/\b(Google|Microsoft|Amazon|Netflix|Meta|Apple)\b/i)
      expect(aboutOptions).not.toMatch(/\b(increased by \d+%|scaled to \d+k users)\b/i)

      // If metric is prompted, it explicitly uses placeholder prompt rather than fabricated number
      expect(expRecommended).toContain('add measurable metric if available')
    })
  })

  // ─── Test G: Top 5 Priority Improvements Engine ────────────────────────────
  describe('Test G: Top 5 Priority Improvements Sorting', () => {
    it('orders high priority actions ahead of medium and low priority actions', () => {
      const input = {
        headline: 'Looking for jobs',
        about: 'I am a student.',
        skills: ['Java'],
        targetRole: 'Backend Developer',
      }

      const result = auditLinkedInProfile(input)
      expect(result.topPriorityImprovements.length).toBeGreaterThan(0)
      expect(result.topPriorityImprovements.length).toBeLessThanOrEqual(5)

      const priorities = result.topPriorityImprovements.map((p) => p.priority)
      // Verify high priority items appear first
      if (priorities.includes('high') && priorities.includes('low')) {
        const firstHigh = priorities.indexOf('high')
        const firstLow = priorities.indexOf('low')
        expect(firstHigh).toBeLessThan(firstLow)
      }
    })
  })
})

