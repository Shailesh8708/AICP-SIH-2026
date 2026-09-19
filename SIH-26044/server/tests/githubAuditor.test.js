// server/tests/githubAuditor.test.js
import { describe, it, expect } from 'vitest'
import {
  validateGitHubUrl,
  auditRepositories,
  analyzePortfolioGaps,
  generatePersonalizedProjectRecommendations,
  auditGitHubProfile,
  createGitHubRepository,
} from '../src/services/ai/githubAuditor.js'
import { validateRole } from '../src/services/ai/careerTaxonomy.js'

describe('GitHub Career & Project Intelligence System Tests', () => {
  // ─── Test A: Frontend Student Targeting Full Stack ─────────────────────────
  describe('Test A: Frontend Student Targeting Full Stack Developer', () => {
    const mockProfile = {
      login: 'frontend-dev',
      name: 'Alex Rivera',
      bio: 'Frontend enthusiast working with React and TypeScript.',
      public_repos: 4,
      followers: 12,
      following: 8,
      avatar_url: 'https://github.com/frontend-dev.png',
      blog: 'https://alexrivera.dev',
    }

    const mockRepos = [
      {
        name: 'react-weather-dashboard',
        description: 'Interactive weather forecasting dashboard built with React and Tailwind CSS.',
        language: 'JavaScript',
        stargazers_count: 5,
        forks_count: 1,
        pushed_at: new Date().toISOString(),
      },
      {
        name: 'portfolio-v2',
        description: 'Personal portfolio website built with Next.js and Framer Motion.',
        language: 'TypeScript',
        stargazers_count: 3,
        forks_count: 0,
        pushed_at: new Date().toISOString(),
      },
      {
        name: 'ui-component-kit',
        description: 'Accessible UI components library in React.',
        language: 'TypeScript',
        stargazers_count: 8,
        forks_count: 2,
        pushed_at: new Date().toISOString(),
      },
    ]

    const mockAicpBundle = {
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'HTML', 'CSS'],
      projects: [{ name: 'react-weather-dashboard' }, { name: 'portfolio-v2' }],
      education: 'B.S. Computer Science',
      targetRole: 'Full Stack Developer',
    }

    it('detects missing backend/API architecture and recommends full-stack projects', () => {
      const result = auditGitHubProfile(mockProfile, mockRepos, mockAicpBundle, 'Full Stack Developer')

      expect(result.overallScore).toBeGreaterThanOrEqual(60)
      expect(result.scoreBreakdown.profileQuality).toBeGreaterThanOrEqual(70)
      expect(result.scoreBreakdown.repoQuality).toBeGreaterThanOrEqual(65)

      // Gap analysis should flag missing backend API proof
      const gaps = result.portfolioGaps
      expect(
        gaps.missingEvidence.some((m) => ['backend', 'database', 'node', 'express', 'mongo', 'sql'].some((k) => m.toLowerCase().includes(k)))
      ).toBe(true)

      // Recommendations must include backend / full-stack projects with blueprints
      expect(result.recommendedProjects.length).toBeGreaterThanOrEqual(2)
      const hasFullStackOrBackend = result.recommendedProjects.some(
        (p) => p.roles.includes('full stack developer') || p.roles.includes('backend developer')
      )
      expect(hasFullStackOrBackend).toBe(true)

      // Check blueprint structure
      const sampleProj = result.recommendedProjects[0]
      expect(sampleProj.blueprint).toBeDefined()
      expect(sampleProj.blueprint.architecture).toBeDefined()
      expect(sampleProj.blueprint.roadmap.length).toBe(5)
      expect(sampleProj.readmeContent).toContain('# ')
    })
  })

  // ─── Test B: ML Student ───────────────────────────────────────────────────
  describe('Test B: Machine Learning Student', () => {
    const mockProfile = {
      login: 'ml-learner',
      name: 'Jordan Lee',
      bio: 'Exploring Deep Learning and Computer Vision.',
      public_repos: 3,
      followers: 6,
      following: 15,
      avatar_url: 'https://github.com/ml-learner.png',
      blog: '',
    }

    const mockRepos = [
      {
        name: 'mnist-classifier-notebook',
        description: 'Jupyter notebook experimenting with PyTorch CNN for digit recognition.',
        language: 'Jupyter Notebook',
        stargazers_count: 2,
        forks_count: 0,
        pushed_at: new Date().toISOString(),
      },
      {
        name: 'nlp-sentiment-analysis',
        description: 'Sentiment analysis scripts using Scikit-Learn on IMDB dataset.',
        language: 'Python',
        stargazers_count: 4,
        forks_count: 1,
        pushed_at: new Date().toISOString(),
      },
    ]

    const mockAicpBundle = {
      skills: ['Python', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy'],
      projects: [{ name: 'mnist-classifier-notebook' }],
      targetRole: 'Machine Learning Engineer',
    }

    it('identifies lack of production MLOps pipeline and recommends end-to-end ML project', () => {
      const result = auditGitHubProfile(mockProfile, mockRepos, mockAicpBundle, 'Machine Learning Engineer')

      // Should identify missing MLOps / inference pipeline
      const gaps = result.portfolioGaps
      expect(
        gaps.missingEvidence.some((m) => m.toLowerCase().includes('ml') || m.toLowerCase().includes('pipeline') || m.toLowerCase().includes('inference') || m.toLowerCase().includes('deployment'))
      ).toBe(true)

      // Recommended projects must include MLOps or ML inference
      const mlProject = result.recommendedProjects.find((p) => p.roles.includes('machine learning engineer'))
      expect(mlProject).toBeDefined()
      expect(mlProject.recommendedTechStack.some((t) => t.toLowerCase().includes('fastapi') || t.toLowerCase().includes('python'))).toBe(true)
      expect(mlProject.blueprint.roadmap.length).toBe(5)
    })
  })

  // ─── Test C: Backend Student ───────────────────────────────────────────────
  describe('Test C: Backend Student Targeting Cloud / Backend', () => {
    const mockProfile = {
      login: 'backend-dev',
      name: 'Priya Sharma',
      bio: 'Building backend APIs with Go and Node.js.',
      public_repos: 5,
      followers: 20,
      avatar_url: 'https://github.com/backend-dev.png',
      blog: 'https://priyadev.io',
    }

    const mockRepos = [
      {
        name: 'basic-crud-api',
        description: 'Express.js CRUD endpoints with MongoDB.',
        language: 'JavaScript',
        stargazers_count: 1,
        forks_count: 0,
        pushed_at: new Date().toISOString(),
      },
    ]

    const mockAicpBundle = {
      skills: ['Node.js', 'Express', 'MongoDB'],
      projects: [{ name: 'basic-crud-api' }],
      targetRole: 'Backend Developer',
    }

    it('detects missing distributed systems, caching, and rate limiting', () => {
      const result = auditGitHubProfile(mockProfile, mockRepos, mockAicpBundle, 'Backend Developer')

      const gaps = result.portfolioGaps
      // Underrepresented skills should include Docker, Redis, or automated testing
      expect(
        gaps.underrepresentedSkills.some((u) => u.toLowerCase().includes('docker') || u.toLowerCase().includes('redis') || u.toLowerCase().includes('test'))
      ).toBe(true)

      // Recommends advanced distributed task queue or microservices
      const queueOrGateway = result.recommendedProjects.find(
        (p) => (p.title || p.name || '').toLowerCase().includes('rate limiter') ||
               (p.title || p.name || '').toLowerCase().includes('queue') ||
               p.id === 'proj-distributed-task-queue'
      )
      expect(queueOrGateway).toBeDefined()
      expect(queueOrGateway.blueprint.apiEndpoints.length).toBeGreaterThan(0)
    })
  })

  // ─── Test D: Anti-Duplicate Project Verification ───────────────────────────
  describe('Test D: Anti-Duplicate Project Recommendation Engine', () => {
    const mockProfile = { login: 'advanced-coder', public_repos: 2 }

    const mockRepos = [
      {
        name: 'distributed-task-queue-worker',
        description: 'My custom distributed task queue and worker system with Redis.',
        language: 'TypeScript',
        stargazers_count: 10,
        forks_count: 2,
      },
      {
        name: 'real-time-whiteboard-canvas',
        description: 'Collaborative canvas using WebSockets and React.',
        language: 'TypeScript',
        stargazers_count: 15,
        forks_count: 3,
      },
    ]

    const mockAicpBundle = {
      skills: ['TypeScript', 'Node.js', 'Redis', 'WebSockets', 'React'],
      projects: [
        { name: 'distributed-task-queue-worker' },
        { name: 'real-time-whiteboard-canvas' },
      ],
      targetRole: 'Full Stack Developer',
    }

    it('strictly skips projects matching existing repos and recommends only novel concepts', () => {
      const result = auditGitHubProfile(mockProfile, mockRepos, mockAicpBundle, 'Full Stack Developer')

      // It must NOT recommend the task queue or the whiteboard canvas because student already built them
      const recommendedTitles = result.recommendedProjects.map((p) => p.title.toLowerCase())
      for (const title of recommendedTitles) {
        expect(title).not.toContain('task queue')
        expect(title).not.toContain('whiteboard')
      }
    })
  })

  // ─── Test E: Semantic Role Validation ──────────────────────────────────────
  describe('Test E: Semantic Role Validation', () => {
    it('accepts valid engineering and tech roles', () => {
      expect(validateRole('Full Stack Developer').isValid).toBe(true)
      expect(validateRole('Frontend Engineer').isValid).toBe(true)
      expect(validateRole('Machine Learning Engineer').isValid).toBe(true)
      expect(validateRole('DevOps Engineer').isValid).toBe(true)
    })

    it('rejects arbitrary, non-career nonsense without hardcoded blacklists', () => {
      const invalidRoles = ['thief', 'xyz123', 'randomword', 'king', 'astronaut99']
      for (const role of invalidRoles) {
        const check = validateRole(role)
        expect(check.isValid).toBe(false)
        expect(Array.isArray(check.suggestedRoles)).toBe(true)
        expect(check.suggestedRoles.length).toBeGreaterThan(0)
      }
    })
  })

  // ─── Test F: Minimal / Zero-Repo Profile ────────────────────────────────────
  describe('Test F: Minimal / Zero-Repo Profile', () => {
    const emptyProfile = {
      login: 'new-coder',
      public_repos: 0,
      followers: 0,
      following: 0,
    }

    it('handles zero repositories gracefully with constructive starter advice', () => {
      const result = auditGitHubProfile(emptyProfile, [], {}, 'Frontend Developer')

      expect(result.overallScore).toBeLessThan(50)
      expect(result.profileOverview.publicRepos).toBe(0)
      expect(result.languagesUsed.length).toBe(0)
      expect(result.topRepositories.length).toBe(0)

      // Gaps and recommendations should still be cleanly generated
      expect(result.recommendedProjects.length).toBeGreaterThanOrEqual(1)
      expect(result.topActions.length).toBeGreaterThanOrEqual(2)
      expect(result.disclaimer).toContain('Zero private code')
    })
  })

  // ─── Test G: Zero Fabrication & URL Parsing Validation ─────────────────────
  describe('Test G: Zero Fabrication & URL Parsing Validation', () => {
    it('properly extracts usernames from valid GitHub URL variants', () => {
      expect(validateGitHubUrl('https://github.com/octocat').username).toBe('octocat')
      expect(validateGitHubUrl('http://github.com/octocat/').username).toBe('octocat')
      expect(validateGitHubUrl('github.com/octocat').username).toBe('octocat')
      expect(validateGitHubUrl('@octocat').username).toBe('octocat')
      expect(validateGitHubUrl('octocat').username).toBe('octocat')
    })

    it('rejects non-GitHub domains and malformed usernames', () => {
      expect(validateGitHubUrl('https://google.com/search').isValid).toBe(false)
      expect(validateGitHubUrl('https://facebook.com/profile').isValid).toBe(false)
      expect(validateGitHubUrl('https://linkedin.com/in/user').isValid).toBe(false)
      expect(validateGitHubUrl('user--invalid').isValid).toBe(false)
      expect(validateGitHubUrl('-invalid').isValid).toBe(false)
    })

    it('strictly avoids fabricating repo statistics, stars, or forks', () => {
      const mockProfile = { login: 'truthful-dev', public_repos: 2 }
      const mockRepos = [
        { name: 'repo-one', stargazers_count: 7, forks_count: 3, language: 'Python' },
        { name: 'repo-two', stargazers_count: 2, forks_count: 1, language: 'Go' },
      ]

      const audit = auditGitHubProfile(mockProfile, mockRepos, {}, 'Backend Developer')

      // Star counts in repo items must exactly equal input
      const r1 = audit.topRepositories.find((r) => r.name === 'repo-one')
      expect(r1.stars).toBe(7)
      expect(r1.forks).toBe(3)

      const r2 = audit.topRepositories.find((r) => r.name === 'repo-two')
      expect(r2.stars).toBe(2)
      expect(r2.forks).toBe(1)
    })
  })
})
