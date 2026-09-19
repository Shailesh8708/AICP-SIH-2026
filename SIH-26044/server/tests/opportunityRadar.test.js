import { describe, it, expect } from 'vitest'
import { normalizeSkill, normalizeSkillsList } from '../src/services/ai/skillNormalizer.js'
import { extractOpportunitySkills } from '../src/services/ai/skillExtractor.js'
import { classifyOpportunityType, classifyCategory, determineDifficulty } from '../src/services/ai/opportunityClassifier.js'
import { extractEligibilityCriteria, analyzeStudentEligibility } from '../src/services/ai/eligibilityAnalyzer.js'
import { computeStudentMatch } from '../src/services/ai/matchingEngine.js'
import { verifyApplicationUrl, resolveOpportunityUrls } from '../src/services/opportunity/opportunityVerifier.js'
import { generateFingerprint } from '../src/services/opportunity/opportunityDeduplicator.js'
import { normalizeOpportunity, parseLocationDetails } from '../src/services/opportunity/opportunityNormalizer.js'
import { getAdapter } from '../src/services/opportunity/adapters/adapterRegistry.js'

describe('AI Opportunity Radar - In-House AI Intelligence & Pipeline', () => {
  describe('Skill Normalizer', () => {
    it('normalizes common aliases to canonical names', () => {
      expect(normalizeSkill('ReactJS')).toBe('React')
      expect(normalizeSkill('golang')).toBe('Go')
      expect(normalizeSkill('js')).toBe('JavaScript')
      expect(normalizeSkill('ml')).toBe('Machine Learning')
      expect(normalizeSkill('k8s')).toBe('Kubernetes')
      expect(normalizeSkill('postgres')).toBe('PostgreSQL')
    })

    it('deduplicates and cleans skills list', () => {
      const list = ['ReactJS', 'React.js', 'react', 'Python']
      const normalized = normalizeSkillsList(list)
      expect(normalized).toEqual(['React', 'Python'])
    })
  })

  describe('Skill Extractor', () => {
    it('extracts technical skills from title and description text', () => {
      const { requiredSkills } = extractOpportunitySkills({
        title: 'Backend Software Engineering Intern (Python, Docker)',
        description: 'You will build scalable APIs using Node.js, PostgreSQL, and AWS.',
      })

      expect(requiredSkills).toContain('Python')
      expect(requiredSkills).toContain('Docker')
      expect(requiredSkills).toContain('Node.js')
      expect(requiredSkills).toContain('PostgreSQL')
      expect(requiredSkills).toContain('AWS')
    })
  })

  describe('Opportunity Classifier', () => {
    it('classifies opportunity types accurately', () => {
      expect(classifyOpportunityType('Software Engineer Intern 2026', '')).toBe('internship')
      expect(classifyOpportunityType('Graduate Trainee Engineer', '')).toBe('entry_level')
      expect(classifyOpportunityType('Hardware Apprenticeship', '')).toBe('apprenticeship')
      expect(classifyOpportunityType('Senior Full Stack Developer', '')).toBe('job')
    })

    it('classifies domain category correctly', () => {
      expect(classifyCategory('ML Research Engineer', 'Deep learning and NLP models', ['PyTorch', 'TensorFlow'])).toBe('AI/ML')
      expect(classifyCategory('DevOps Engineer', 'CI/CD and Kubernetes', ['Docker', 'AWS'])).toBe('Cloud & DevOps')
      expect(classifyCategory('Security Analyst', 'Penetration testing', ['Cybersecurity'])).toBe('Cybersecurity')
    })

    it('determines difficulty tier', () => {
      expect(determineDifficulty('Software Intern', 'Students welcome', '0-1 years')).toBe('entry')
      expect(determineDifficulty('Senior Cloud Architect', '5+ years experience', '5 years')).toBe('advanced')
    })
  })

  describe('Eligibility Analyzer', () => {
    it('extracts degree, branch, CGPA, and batch criteria from text', () => {
      const text = 'Candidates must have a B.Tech or M.Tech in Computer Science or Information Technology with minimum 7.5 CGPA from 2025 or 2026 batch.'
      const criteria = extractEligibilityCriteria(text)

      expect(criteria.education).toContain('B.Tech / B.E.')
      expect(criteria.education).toContain('M.Tech / M.E.')
      expect(criteria.branches).toContain('Computer Science')
      expect(criteria.cgpa).toBe(7.5)
      expect(criteria.graduationYear).toContain('2025')
      expect(criteria.graduationYear).toContain('2026')
    })

    it('evaluates student profile eligibility truthfully', () => {
      const opportunity = {
        minGPA: 7.0,
        eligibilityCriteria: {
          education: ['B.Tech / B.E.'],
          branches: ['Computer Science'],
          graduationYear: ['2026'],
        },
      }

      const eligibleStudent = {
        degree: 'B.Tech',
        department: 'Computer Science',
        cgpa: 8.2,
        graduationYear: 2026,
      }

      const result = analyzeStudentEligibility(eligibleStudent, opportunity)
      expect(result.eligible).toBe(true)
      expect(result.reasons.length).toBeGreaterThan(0)
    })
  })

  describe('URL Verifier & Security', () => {
    it('verifies official company domains and known ATS platforms', () => {
      const workdayRes = verifyApplicationUrl('https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/1234', 'https://nvidia.com')
      expect(workdayRes.verified).toBe(true)

      const ghRes = verifyApplicationUrl('https://boards.greenhouse.io/stripe/jobs/5678', 'https://stripe.com')
      expect(ghRes.verified).toBe(true)
    })

    it('rejects dangerous and private IP protocols', () => {
      expect(verifyApplicationUrl('javascript:alert(1)').verified).toBe(false)
      expect(verifyApplicationUrl('data:text/html,<script>').verified).toBe(false)
      expect(verifyApplicationUrl('http://127.0.0.1/apply').verified).toBe(false)
      expect(verifyApplicationUrl('http://localhost:3000').verified).toBe(false)
    })

    it('prioritizes direct application URL over posting URL and generic careers fallback', () => {
      const opp = {
        company: { name: 'Google', website: 'https://google.com', careerUrl: 'https://careers.google.com' },
        postingUrl: 'https://www.google.com/about/careers/applications/jobs/results/94172087570809542',
        applicationUrl: 'https://www.google.com/about/careers/applications/apply/dce82c1b-8483-4cb1-899a-94efbbc64a12/form',
        applyUrl: 'https://www.google.com/about/careers/applications/apply/dce82c1b-8483-4cb1-899a-94efbbc64a12/form',
      }
      const res = resolveOpportunityUrls(opp)
      expect(res.resolvedUrl).toBe('https://www.google.com/about/careers/applications/apply/dce82c1b-8483-4cb1-899a-94efbbc64a12/form')
      expect(res.isDirectForm).toBe(true)
      expect(res.badgeLabel).toBe('Official Application')
      expect(res.urlType).toBe('direct_application')
    })

    it('prioritizes specific posting URL over generic careers portal when direct form is missing', () => {
      const opp = {
        company: { name: 'Microsoft', website: 'https://microsoft.com', careerUrl: 'https://careers.microsoft.com' },
        postingUrl: 'https://jobs.careers.microsoft.com/global/en/job/1762819/Software-Engineering-Intern',
        applicationUrl: '',
        applyUrl: '',
      }
      const res = resolveOpportunityUrls(opp)
      expect(res.resolvedUrl).toBe('https://jobs.careers.microsoft.com/global/en/job/1762819/Software-Engineering-Intern')
      expect(res.isDirectForm).toBe(false)
      expect(res.badgeLabel).toBe('Official Posting')
      expect(res.urlType).toBe('posting')
    })

    it('falls back to company careers page only when direct form and posting URL are both missing', () => {
      const opp = {
        company: { name: 'Amazon', website: 'https://amazon.com', careerUrl: 'https://www.amazon.jobs' },
        postingUrl: '',
        applicationUrl: '',
        applyUrl: '',
      }
      const res = resolveOpportunityUrls(opp)
      expect(res.resolvedUrl).toBe('https://www.amazon.jobs')
      expect(res.badgeLabel).toBe('Official Careers')
      expect(res.urlType).toBe('careers_page')
    })
  })

  describe('Deterministic Fingerprinting & Deduplication', () => {
    it('produces identical SHA-256 fingerprints for equivalent postings', () => {
      const fp1 = generateFingerprint({
        companyName: 'Microsoft',
        title: 'Software Engineer Intern',
        location: 'Bengaluru, India',
        externalId: 'job-12345',
      })

      const fp2 = generateFingerprint({
        companyName: 'microsoft  ',
        title: 'software engineer intern',
        location: 'Bengaluru, India',
        externalId: 'job-12345',
      })

      expect(fp1).toBe(fp2)
      expect(fp1).toHaveLength(64)
    })
  })

  describe('Opportunity Normalizer', () => {
    it('cleans HTML and enriches raw listing with AI classification and location details', () => {
      const raw = {
        title: '<b>Frontend Developer Intern</b>',
        description: '<p>Join our team to build Web applications using React, TypeScript, and CSS.<br>Remote friendly.</p>',
        location: 'Bengaluru / Remote',
        applyUrl: 'https://www.google.com/about/careers/applications/jobs/results/',
        type: 'internship',
      }

      const normalized = normalizeOpportunity(raw, {
        companyName: 'Google',
        website: 'https://google.com',
        sector: 'Technology',
      })

      expect(normalized.title).toBe('Frontend Developer Intern')
      expect(normalized.company.name).toBe('Google')
      expect(normalized.locationDetails.remote).toBe(true)
      expect(normalized.source.type).toBe('official_radar')
      expect(normalized.fingerprint).toBeDefined()
      expect(normalized.ai.category).toBe('Web Development')
      expect(normalized.ai.difficulty).toBe('entry')
    })
  })

  describe('Explainable Matching Engine', () => {
    it('scores student multi-signal compatibility transparently', () => {
      const studentUser = {
        skills: ['Python', 'SQL', 'FastAPI'],
      }
      const studentProfile = {
        degree: 'B.Tech',
        department: 'Computer Science',
        cgpa: 8.5,
        graduationYear: 2026,
        interests: ['AI', 'Data Science'],
      }
      const opportunity = {
        title: 'Data Science Intern',
        requiredSkills: ['Python', 'SQL', 'Machine Learning'],
        preferredSkills: ['FastAPI', 'Docker'],
        minGPA: 7.0,
        eligibilityCriteria: {
          education: ['B.Tech / B.E.'],
          branches: ['Computer Science'],
          graduationYear: ['2026'],
        },
      }

      const match = computeStudentMatch({
        studentUser,
        studentProfile,
        portfolio: {},
        opportunity,
      })

      expect(match.matchPercent).toBeGreaterThan(60)
      expect(match.matchedSkills).toContain('Python')
      expect(match.matchedSkills).toContain('SQL')
      expect(match.missingSkills).toContain('Machine Learning')
      expect(match.whyRecommended.length).toBeGreaterThan(0)
    })
  })

  describe('Adapter Registry', () => {
    it('resolves correct adapter instance by name or platform', () => {
      expect(getAdapter('greenhouse').name).toBe('greenhouse')
      expect(getAdapter('lever').name).toBe('lever')
      expect(getAdapter('workday').name).toBe('workday')
      expect(getAdapter('ashby').name).toBe('ashby')
      expect(getAdapter('smartrecruiters').name).toBe('smartrecruiters')
      expect(getAdapter('generic_api').name).toBe('generic_api')
      expect(getAdapter('unknown_custom_source').name).toBe('generic_api')
    })
  })
})
