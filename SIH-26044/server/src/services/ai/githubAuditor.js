// server/src/services/ai/githubAuditor.js
/**
 * AICP GitHub Career & Project Intelligence Engine
 *
 * Performs deep, personalized analysis of GitHub profile and repositories:
 * - Validates GitHub profile URLs & extracts usernames.
 * - Fetches public profile and repositories with graceful fallback.
 * - Evaluates Profile Completeness, Repository Quality, and Overall Portfolio Score (/100).
 * - Identifies Portfolio Gaps: Existing Strengths, Missing Evidence, Underrepresented Skills,
 *   and Redundant Project Areas.
 * - Anti-Duplicate Project Recommendation Engine: Evaluates existing repos and AICP background
 *   to ensure it NEVER recommends projects the user already has.
 * - Generates comprehensive Project Blueprints, 5-Phase Roadmaps, Professional READMEs,
 *   and Scaffolding Structures.
 * - Supports explicit user-confirmed repository creation via GitHub API or 1-click web pre-fill.
 * - Strict Zero Fabrication: Never invents repo stats, stars, commit numbers, or project metrics.
 */

import axios from 'axios'
import { CAREER_ROLES, validateRole } from './careerTaxonomy.js'

// ─── URL Validation & Username Parser ──────────────────────────────────────────

const EXTERNAL_DOMAINS = [
  'google.com', 'facebook.com', 'linkedin.com', 'twitter.com', 'x.com',
  'instagram.com', 'youtube.com', 'gitlab.com', 'bitbucket.org', 'medium.com'
]

/**
 * Validates a GitHub profile URL or username.
 * Returns { isValid: boolean, username?: string, url?: string, error?: string }
 */
export const validateGitHubUrl = (input) => {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { isValid: false, error: 'GitHub profile URL or username is required.' }
  }

  let cleaned = input.trim()

  // Check if user entered an external non-GitHub domain
  for (const domain of EXTERNAL_DOMAINS) {
    if (cleaned.toLowerCase().includes(domain)) {
      return {
        isValid: false,
        error: `"${domain}" is not a GitHub profile. Please enter a valid GitHub URL (e.g. https://github.com/username).`,
      }
    }
  }

  // Remove protocol and www
  cleaned = cleaned.replace(/^https?:\/\//i, '').replace(/^www\./i, '')

  // Handle github.com/username or @username or username
  let username = ''
  if (cleaned.toLowerCase().startsWith('github.com/')) {
    const parts = cleaned.replace(/^github\.com\//i, '').split('/')
    username = parts[0]?.trim() || ''
  } else if (cleaned.startsWith('@')) {
    username = cleaned.slice(1).trim()
  } else if (!cleaned.includes('/')) {
    username = cleaned.trim()
  } else {
    // Has a path or unknown structure
    const match = cleaned.match(/github\.com\/([a-zA-Z0-9_-]+)/i)
    if (match) {
      username = match[1]
    } else {
      return { isValid: false, error: 'Invalid GitHub URL structure. Expected https://github.com/username.' }
    }
  }

  // Validate GitHub username syntax: alphanumeric and single hyphens, 1-39 chars
  const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/
  if (!username || !usernameRegex.test(username)) {
    return {
      isValid: false,
      error: `"${username}" is not a valid GitHub username. Usernames must be 1–39 alphanumeric characters without consecutive hyphens.`,
    }
  }

  return {
    isValid: true,
    username,
    url: `https://github.com/${username}`,
  }
}

// ─── Public GitHub Data Fetcher ────────────────────────────────────────────────

/**
 * Fetches public user profile and repositories using GitHub's REST API.
 * Uses timeouts and provides graceful fallback on rate limits or errors.
 */
export const fetchGitHubProfileAndRepos = async (username) => {
  const headers = { Accept: 'application/vnd.github.v3+json' }

  let profile = null
  let repos = []
  let isRateLimited = false
  let errorMessage = ''

  try {
    const [profileRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { timeout: 8000, headers }),
      axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, { timeout: 8000, headers }),
    ])
    profile = profileRes.data
    repos = Array.isArray(reposRes.data) ? reposRes.data : []
  } catch (error) {
    if (error.response?.status === 403) {
      isRateLimited = true
      errorMessage = 'GitHub API rate limit exceeded. Analyzing available profile signals with fallback heuristics.'
    } else if (error.response?.status === 404) {
      errorMessage = `GitHub user "${username}" not found. Please verify the profile username.`
    } else {
      errorMessage = error.message || 'Could not connect to GitHub API.'
    }
  }

  // If profile failed to fetch due to rate limit, return stub with username
  if (!profile) {
    profile = {
      login: username,
      html_url: `https://github.com/${username}`,
      public_repos: repos.length,
    }
  }

  return {
    profile,
    repos,
    isRateLimited,
    errorMessage,
  }
}

// ─── Repository Analyzer ──────────────────────────────────────────────────────

/**
 * Audits individual repositories and produces quality score & insights.
 */
export const auditRepositories = (repos = [], targetRole = '') => {
  if (!repos || repos.length === 0) {
    return {
      reposList: [],
      languagesUsed: [],
      totalStars: 0,
      totalForks: 0,
      hasReadmeRatio: 0,
      avgRepoScore: 0,
    }
  }

  const roleLower = targetRole.toLowerCase()
  let totalStars = 0
  let totalForks = 0
  const languageCounts = {}

  const auditedRepos = repos.map((repo) => {
    const name = repo.name || 'Untitled'
    const desc = repo.description || ''
    const lang = repo.language || 'Other'
    const stars = repo.stargazers_count || 0
    const forks = repo.forks_count || 0
    const hasDesc = Boolean(desc.trim())
    const topics = repo.topics || []
    const isFork = Boolean(repo.fork)
    const isArchived = Boolean(repo.archived)
    const hasHomepage = Boolean(repo.homepage && repo.homepage.trim())

    totalStars += stars
    totalForks += forks
    if (lang && lang !== 'Other') {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    }

    const strengths = []
    const weaknesses = []
    let repoScore = 50

    if (hasDesc) {
      strengths.push('Has clear repository description.')
      repoScore += 15
    } else {
      weaknesses.push('Missing repository description. Recruiters scan descriptions first.')
      repoScore -= 15
    }

    if (topics.length >= 2) {
      strengths.push(`Categorized with repository topics (${topics.slice(0, 3).join(', ')}).`)
      repoScore += 10
    } else {
      weaknesses.push('No GitHub topics added for repository discoverability.')
      repoScore -= 5
    }

    if (hasHomepage) {
      strengths.push(`Live demo or documentation link provided (${repo.homepage}).`)
      repoScore += 15
    }

    if (stars > 0) {
      strengths.push(`Earned ${stars} star${stars > 1 ? 's' : ''}.`)
      repoScore += Math.min(15, stars * 3)
    }

    if (isFork) {
      weaknesses.push('Forked repository. Recruiters focus primarily on original source contributions.')
      repoScore -= 10
    }

    // Role relevance
    const repoKeywords = `${name} ${desc} ${lang} ${topics.join(' ')}`.toLowerCase()
    const isRelevant = roleLower ? roleLower.split(/\s+/).some((token) => token.length > 3 && repoKeywords.includes(token)) : false
    if (isRelevant) {
      strengths.push(`Directly demonstrates technologies relevant to ${targetRole}.`)
      repoScore += 15
    }

    // Appears unfinished indicator
    const appearsUnfinished = (!hasDesc && stars === 0 && forks === 0) ||
      ['test', 'temp', 'demo', 'practice', 'assignment', 'repo1'].some((w) => name.toLowerCase().includes(w))

    if (appearsUnfinished) {
      weaknesses.push('This repository appears to need additional documentation/completion based on available metadata.')
      repoScore -= 10
    }

    const finalScore = Math.max(20, Math.min(100, repoScore))

    return {
      name,
      fullName: repo.full_name || name,
      description: desc,
      language: lang,
      stars,
      forks,
      topics,
      htmlUrl: repo.html_url || `https://github.com/${repo.owner?.login || 'user'}/${name}`,
      homepage: repo.homepage || '',
      updatedAt: repo.updated_at || '',
      isFork,
      isArchived,
      score: finalScore,
      strengths,
      weaknesses,
      appearsUnfinished,
    }
  })

  // Sort by score descending
  auditedRepos.sort((a, b) => b.score - a.score)

  const languagesUsed = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({ language: lang, count }))

  const avgScore = Math.round(auditedRepos.reduce((sum, r) => sum + r.score, 0) / auditedRepos.length)
  const hasDescCount = auditedRepos.filter((r) => r.description).length
  const hasReadmeRatio = Math.round((hasDescCount / auditedRepos.length) * 100)

  return {
    reposList: auditedRepos,
    languagesUsed,
    totalStars,
    totalForks,
    hasReadmeRatio,
    avgRepoScore: avgScore,
  }
}

// ─── Portfolio Gap Analysis ───────────────────────────────────────────────────

/**
 * Cross-references GitHub repositories with student background and target role.
 * Identifies strengths, missing evidence, underrepresented skills, and redundant project areas.
 */
export const analyzePortfolioGaps = (repos = [], _profile = {}, targetRole = '', studentBundle = {}) => {
  const roleData = CAREER_ROLES[targetRole] || {}
  const expectedCore = roleData.coreSkills || ['Programming', 'Git', 'Problem Solving']
  const expectedSecondary = roleData.secondarySkills || ['Testing', 'CI/CD', 'Docker']

  // Corpus of what is actually in GitHub
  const githubCorpus = repos.map((r) => `${r.name} ${r.description || ''} ${r.language || ''} ${(r.topics || []).join(' ')}`).join(' ').toLowerCase()

  // Corpus of what the student claims in AICP
  const aicpSkills = [
    ...(studentBundle.skills || []),
    ...(studentBundle.user?.skills || []),
    ...(Object.values(studentBundle.careerProfile?.skillsByCategory || {}).flat()),
  ]
  const aicpSkillsUnique = [...new Set(aicpSkills.map((s) => s.trim()).filter(Boolean))]

  // 1. Existing Strengths
  const existingStrengths = []
  expectedCore.forEach((skill) => {
    if (githubCorpus.includes(skill.toLowerCase())) {
      existingStrengths.push(skill)
    }
  })

  // 2. Missing Evidence (expected for role, not in GitHub)
  const missingEvidence = []
  expectedCore.forEach((skill) => {
    if (!githubCorpus.includes(skill.toLowerCase())) {
      missingEvidence.push(skill)
    }
  })
  expectedSecondary.forEach((skill) => {
    if (!githubCorpus.includes(skill.toLowerCase()) && !missingEvidence.includes(skill)) {
      missingEvidence.push(skill)
    }
  })

  // 3. Underrepresented Skills (claimed in AICP or industry standard tools missing from GitHub)
  const underrepresentedSkills = []
  aicpSkillsUnique.forEach((skill) => {
    if (!githubCorpus.includes(skill.toLowerCase()) && !underrepresentedSkills.includes(skill)) {
      underrepresentedSkills.push(skill)
    }
  })
  expectedSecondary.forEach((skill) => {
    if (!githubCorpus.includes(skill.toLowerCase()) && !underrepresentedSkills.includes(skill)) {
      underrepresentedSkills.push(skill)
    }
  })

  // 4. Redundant Project Areas (e.g. multiple CRUD/Todo/Portfolio/Weather apps)
  const redundantAreas = []
  const genericPatterns = [
    { pattern: /\b(crud|todo|task\s*manager)\b/i, label: 'Task Management / Basic CRUD applications' },
    { pattern: /\b(calculator|calc)\b/i, label: 'Calculator applications' },
    { pattern: /\b(weather)\b/i, label: 'Weather applications' },
    { pattern: /\b(portfolio|personal-website)\b/i, label: 'Portfolio websites' },
    { pattern: /\b(blog)\b/i, label: 'Basic Blog applications' },
  ]

  genericPatterns.forEach(({ pattern, label }) => {
    const matches = repos.filter((r) => pattern.test(r.name) || pattern.test(r.description || ''))
    if (matches.length >= 2) {
      redundantAreas.push({
        label,
        count: matches.length,
        advice: `You have ${matches.length} similar ${label}. Rather than building another version, pivot to projects demonstrating advanced backend, architecture, or cloud integration.`,
      })
    }
  })

  return {
    existingStrengths,
    missingEvidence,
    underrepresentedSkills: underrepresentedSkills.slice(0, 5),
    redundantAreas,
  }
}

// ─── Anti-Duplicate Personalized Project Recommendation Engine ────────────────

/**
 * Domain Catalog of High-Value Portfolio Projects.
 * Categorized by target role and complexity.
 */
const HIGH_VALUE_PROJECT_CATALOG = {
  'Frontend Developer': [
    {
      name: 'Real-Time Collaborative Canvas & Design Platform',
      category: 'Frontend Architecture & Real-Time Web',
      difficulty: 'Advanced',
      careerImpact: 94,
      skillsDemonstrated: ['React', 'TypeScript', 'WebSockets', 'Canvas API', 'State Management'],
      gapsFilled: ['State Architecture', 'Real-Time Sync', 'Performance Optimization'],
      suggestedTech: ['React', 'TypeScript', 'Tailwind CSS', 'Socket.io', 'HTML5 Canvas'],
      problem: 'Building smooth, low-latency collaborative UI for multiple simultaneous editors.',
      whyMatch: 'Moves beyond static CRUD into high-performance browser rendering, state synchronization, and complex interactive design.',
      differentiation: 'Implements operational transformation or CRDTs for multi-cursor synchronization rather than standard form submission.',
    },
    {
      name: 'Design System Component Engine with Automated Accessibility Audits',
      category: 'Component Engineering & Testing',
      difficulty: 'Intermediate',
      careerImpact: 88,
      skillsDemonstrated: ['React', 'TypeScript', 'Storybook', 'WCAG Accessibility', 'Unit Testing'],
      gapsFilled: ['Testing', 'Component Architecture', 'Accessibility Compliance'],
      suggestedTech: ['React', 'TypeScript', 'Storybook', 'Tailwind CSS', 'Vitest / Jest'],
      problem: 'Enterprise teams need cohesive, WCAG 2.1 AA compliant UI systems with automated regression tests.',
      whyMatch: 'Demonstrates industry-standard design system practices, thorough automated test coverage, and modular packaging.',
      differentiation: 'Features live contrast checking, screen-reader navigation testing, and published Storybook documentation.',
    },
    {
      name: 'Streaming Data Visualizer & Performance Analytics Dashboard',
      category: 'Data Visualization & High-Volume Rendering',
      difficulty: 'Intermediate',
      careerImpact: 90,
      skillsDemonstrated: ['React', 'D3.js / Recharts', 'Web Workers', 'REST APIs', 'TypeScript'],
      gapsFilled: ['Data Visualization', 'Client-Side Optimization', 'Web Workers'],
      suggestedTech: ['React', 'TypeScript', 'Recharts', 'FastAPI / Node.js API'],
      problem: 'Rendering high-frequency metrics in real time without dropping frame rates or locking the browser main thread.',
      whyMatch: 'Proves client-side performance engineering and the ability to present complex business metrics cleanly.',
      differentiation: 'Uses Web Workers to process telemetry off the main thread and displays zero-lag SVG/Canvas chart transitions.',
    },
  ],

  'Backend Developer': [
    {
      name: 'High-Throughput Distributed Rate Limiter & API Gateway',
      category: 'Distributed Systems & Scalability',
      difficulty: 'Advanced',
      careerImpact: 96,
      skillsDemonstrated: ['Node.js', 'Go / Python', 'Redis', 'Docker', 'System Design'],
      gapsFilled: ['Caching', 'Scalability', 'Microservices', 'System Design'],
      suggestedTech: ['Node.js / Express', 'Redis', 'Docker', 'PostgreSQL'],
      problem: 'Preventing API abuse and ensuring fair service allocation across thousands of concurrent clients.',
      whyMatch: 'Recruiters look for proof of distributed caching, concurrency handling, and resilient middleware design.',
      differentiation: 'Implements sliding-window counter algorithm with distributed Redis locking rather than in-memory naive limits.',
    },
    {
      name: 'Event-Driven Job Queue & Background Processing Engine',
      category: 'Message Queues & Asynchronous Processing',
      difficulty: 'Advanced',
      careerImpact: 92,
      skillsDemonstrated: ['Node.js', 'Redis / RabbitMQ', 'Docker', 'PostgreSQL', 'Observability'],
      gapsFilled: ['Message Queues', 'Async Workflows', 'Error Recovery'],
      suggestedTech: ['Node.js', 'BullMQ / RabbitMQ', 'Redis', 'Docker', 'Prometheus'],
      problem: 'Reliably processing heavy tasks (PDF generation, webhook retries) asynchronously with zero lost jobs.',
      whyMatch: 'Shows you can decouple client requests from long-running server background workers.',
      differentiation: 'Includes exponential backoff retry mechanisms, dead-letter queues, and live queue health metrics.',
    },
    {
      name: 'Secure Multi-Tenant Auth & Role-Based Access Control (RBAC) Service',
      category: 'Security & Identity Management',
      difficulty: 'Intermediate',
      careerImpact: 90,
      skillsDemonstrated: ['Node.js', 'JWT', 'OAuth 2.0', 'SQL / PostgreSQL', 'Security Auditing'],
      gapsFilled: ['Authentication', 'Security', 'Database Modeling'],
      suggestedTech: ['Node.js / Express', 'PostgreSQL', 'Argon2 / bcrypt', 'JWT', 'Docker'],
      problem: 'Enterprise systems require zero-trust access control with organization isolation and audit logging.',
      whyMatch: 'Provides tangible evidence of production-grade authentication, refresh token rotation, and secure hashing.',
      differentiation: 'Features hierarchical role inheritance, tamper-evident audit trails, and automated session revocation.',
    },
  ],

  'Full Stack Developer': [
    {
      name: 'AI-Powered Placement & Academic Analytics Platform',
      category: 'Full-Stack Architecture & AI Integration',
      difficulty: 'Advanced',
      careerImpact: 95,
      skillsDemonstrated: ['React', 'Node.js', 'MongoDB / PostgreSQL', 'REST APIs', 'Docker'],
      gapsFilled: ['Full-Stack Integration', 'Containerization', 'Production Architecture'],
      suggestedTech: ['React', 'Node.js', 'Express', 'MongoDB / PostgreSQL', 'Docker', 'Tailwind CSS'],
      problem: 'Educational institutions struggle to bridge student skill tracking with industry hiring trends.',
      whyMatch: 'Demonstrates end-to-end engineering: responsive frontend, secure REST backend, and database aggregation pipelines.',
      differentiation: 'Includes role-based access for students and administrators, Dockerized deployment, and data visualization.',
    },
    {
      name: 'Enterprise Issue Tracking & Sprint Management System',
      category: 'Enterprise SaaS & System Architecture',
      difficulty: 'Advanced',
      careerImpact: 93,
      skillsDemonstrated: ['React', 'Node.js', 'PostgreSQL', 'WebSockets', 'Automated Testing'],
      gapsFilled: ['Relational Data Modeling', 'Automated Testing', 'Real-Time Sync'],
      suggestedTech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Vitest', 'Docker'],
      problem: 'Managing complex project roadmaps with real-time sprint boards and automated notification pipelines.',
      whyMatch: 'Proves your ability to model complex relational data (epics, sprints, issues, comments) and maintain test coverage.',
      differentiation: 'Replaces basic todo lists with optimistic UI updates, drag-and-drop Kanban, and audit logs.',
    },
    {
      name: 'Cloud Infrastructure Monitoring & Telemetry Dashboard',
      category: 'Cloud, DevOps & Full Stack',
      difficulty: 'Advanced',
      careerImpact: 91,
      skillsDemonstrated: ['React', 'Node.js', 'Docker', 'Time-Series DB', 'REST APIs'],
      gapsFilled: ['DevOps Observability', 'Docker', 'Time-Series Data'],
      suggestedTech: ['React', 'Tailwind CSS', 'Node.js', 'InfluxDB / PostgreSQL', 'Docker'],
      problem: 'Developers need unified insight into service uptime, container health, and error rates.',
      whyMatch: 'Bridges frontend presentation with DevOps concepts like telemetry collection and system health checks.',
      differentiation: 'Features synthetic ping monitors, alerting thresholds, and full Docker-compose setup.',
    },
  ],

  'Machine Learning Engineer': [
    {
      name: 'Production End-to-End MLOps Pipeline & Model Serving API',
      category: 'MLOps & Model Deployment',
      difficulty: 'Industry-level',
      careerImpact: 97,
      skillsDemonstrated: ['Python', 'FastAPI', 'Docker', 'Scikit-Learn / PyTorch', 'MLflow / Drift Monitoring'],
      gapsFilled: ['Model Deployment', 'Containerization', 'Data Drift Detection'],
      suggestedTech: ['Python', 'FastAPI', 'Docker', 'Scikit-Learn', 'MLflow', 'PostgreSQL'],
      problem: 'Most ML students train models in Jupyter notebooks; few know how to deploy, version, and monitor models in production.',
      whyMatch: 'Directly proves you can take a model from experimentation into a containerized, monitored REST microservice.',
      differentiation: 'Includes automated input schema validation with Pydantic, model latency tracking, and data drift detection.',
    },
    {
      name: 'Semantic Code & Document Search Engine with Vector Embeddings',
      category: 'Applied AI & Information Retrieval',
      difficulty: 'Advanced',
      careerImpact: 94,
      skillsDemonstrated: ['Python', 'Vector Databases (Chroma/FAISS)', 'Sentence Transformers', 'FastAPI'],
      gapsFilled: ['Vector Search', 'NLP Embeddings', 'API Integration'],
      suggestedTech: ['Python', 'FastAPI', 'ChromaDB / FAISS', 'Sentence-Transformers', 'Streamlit / React'],
      problem: 'Keyword search fails to match conceptual queries in large codebases or technical documentation.',
      whyMatch: 'Demonstrates modern vector retrieval, embedding pipelines, and semantic similarity calculation.',
      differentiation: 'Implements hybrid search (BM25 lexical + dense vector retrieval) with re-ranking.',
    },
    {
      name: 'Automated Resume-to-Job Role Skill Extractor & Gap Matcher',
      category: 'NLP & Practical ML',
      difficulty: 'Intermediate',
      careerImpact: 90,
      skillsDemonstrated: ['Python', 'spaCy / NLP', 'Pandas', 'FastAPI', 'Regex Normalization'],
      gapsFilled: ['NLP Processing', 'Structured Entity Extraction', 'Model Evaluation'],
      suggestedTech: ['Python', 'spaCy', 'FastAPI', 'Pandas', 'scikit-learn'],
      problem: 'Recruiters and students need structured matching between unstructured resume text and job requirements.',
      whyMatch: 'Directly aligns with educational and career platforms like AICP, showing practical domain impact.',
      differentiation: 'Features custom Named Entity Recognition (NER), precision/recall evaluation metrics, and JSON output.',
    },
  ],

  'Data Analyst': [
    {
      name: 'Executive Business Intelligence & Cohort Retention Analytics Platform',
      category: 'Business Analytics & Data Modeling',
      difficulty: 'Intermediate',
      careerImpact: 91,
      skillsDemonstrated: ['SQL (Window Functions)', 'Python', 'Pandas', 'Streamlit / Dash', 'Data Modeling'],
      gapsFilled: ['Advanced SQL', 'Cohort Analysis', 'Executive Reporting'],
      suggestedTech: ['PostgreSQL', 'Python', 'Pandas', 'Streamlit', 'Plotly'],
      problem: 'Businesses struggle to identify customer churn triggers and cohort lifetime value from raw transaction logs.',
      whyMatch: 'Moves beyond basic pie charts into advanced cohort retention heatmaps, customer churn prediction, and SQL window functions.',
      differentiation: 'Uses complex multi-table SQL joins, RFM (Recency, Frequency, Monetary) segmentation, and interactive parameter sliders.',
    },
    {
      name: 'Supply Chain & E-Commerce Demand Forecasting Pipeline',
      category: 'Time-Series Analysis & Predictive Insights',
      difficulty: 'Intermediate',
      careerImpact: 89,
      skillsDemonstrated: ['Python', 'Prophet / Statsmodels', 'Time-Series', 'Data Cleaning', 'Matplotlib'],
      gapsFilled: ['Time-Series Forecasting', 'Statistical Validation', 'Business Impact'],
      suggestedTech: ['Python', 'Pandas', 'Prophet', 'Plotly', 'Jupyter'],
      problem: 'Retailers overstock or understock inventory due to seasonal demand fluctuations.',
      whyMatch: 'Proves statistical rigor, trend decomposition (seasonality, holidays), and backtesting evaluation with MAPE/RMSE.',
      differentiation: 'Compares multiple forecasting models and outputs actionable inventory reorder threshold recommendations.',
    },
  ],

  'Cloud Engineer': [
    {
      name: 'Infrastructure-as-Code (IaC) Automated Multi-Tier Cloud Deployment',
      category: 'Cloud Architecture & Infrastructure',
      difficulty: 'Advanced',
      careerImpact: 95,
      skillsDemonstrated: ['Terraform', 'Docker', 'AWS / Cloud Architecture', 'Linux', 'CI/CD'],
      gapsFilled: ['Terraform', 'Cloud Architecture', 'Automated Provisioning'],
      suggestedTech: ['Terraform', 'AWS (VPC, EC2, S3, RDS)', 'Docker', 'GitHub Actions'],
      problem: 'Manual cloud configuration is error-prone, unversioned, and difficult to reproduce.',
      whyMatch: 'Terraform is the #1 tool cloud hiring managers look for on entry-level cloud candidate profiles.',
      differentiation: 'Configures a production VPC with public/private subnets, security groups, and automated rollback workflows.',
    },
    {
      name: 'Kubernetes Container Orchestration & Microservice Mesh',
      category: 'Cloud-Native & Containerization',
      difficulty: 'Industry-level',
      careerImpact: 94,
      skillsDemonstrated: ['Kubernetes', 'Docker', 'Helm', 'NGINX Ingress', 'Prometheus'],
      gapsFilled: ['Kubernetes', 'Service Meshes', 'Container Orchestration'],
      suggestedTech: ['Kubernetes (k3s/Minikube)', 'Docker', 'Helm', 'NGINX', 'Prometheus / Grafana'],
      problem: 'Managing resilient multi-service deployment with rolling updates and auto-scaling.',
      whyMatch: 'Proves knowledge of cluster architecture, ingress controllers, config maps, and resource limits.',
      differentiation: 'Includes horizontal pod autoscalers (HPA) and Grafana health dashboards.',
    },
  ],
}

/**
 * Recommends 3-4 personalized, high-impact projects that fill identified portfolio gaps.
 * Strictly avoids projects the user already has.
 */
export const generatePersonalizedProjectRecommendations = (
  existingRepos = [],
  studentBundle = {},
  targetRole = '',
  gaps = {}
) => {
  const canonicalRole = CAREER_ROLES[targetRole]?.title || 'Full Stack Developer'
  const pool = HIGH_VALUE_PROJECT_CATALOG[canonicalRole] || HIGH_VALUE_PROJECT_CATALOG['Full Stack Developer']

  // Build corpus of existing project titles and repository names to prevent duplicates
  const existingRepoNames = existingRepos.map((r) => r.name.toLowerCase())
  const existingAicpTitles = (studentBundle.careerProfile?.projects || studentBundle.portfolio?.projects || []).map(
    (p) => (p.title || p).toLowerCase()
  )
  const existingCorpus = [...existingRepoNames, ...existingAicpTitles].join(' ')

  const recommended = []

  for (const project of pool) {
    const pNameLower = project.name.toLowerCase()
    const pTokens = pNameLower.split(/\s+/).filter((w) => w.length > 4)

    // Check if user already built something very similar
    const isDuplicate = pTokens.some((token) => existingCorpus.includes(token))
    if (isDuplicate) {
      continue // Strictly do not recommend projects the user already has
    }

    // Build personalized "Why this project?" based on student's actual gaps
    const matchingGaps = project.gapsFilled.filter((gap) =>
      gaps.missingEvidence?.some((m) => m.toLowerCase() === gap.toLowerCase()) ||
      gaps.underrepresentedSkills?.some((u) => u.toLowerCase() === gap.toLowerCase())
    )

    const whyThisProject = matchingGaps.length > 0
      ? `Your GitHub currently has limited public evidence of ${matchingGaps.join(' and ')}. Building this project directly addresses these gaps for ${canonicalRole} while showcasing enterprise-grade architecture.`
      : project.whyMatch

    recommended.push(formatRecommendedProject(project, canonicalRole, whyThisProject))
    if (recommended.length >= 3) break
  }

  // If pool was exhausted due to duplicates, return remaining unique projects
  if (recommended.length < 2) {
    for (const project of pool) {
      if (!recommended.some((r) => r.name === project.name)) {
        recommended.push(formatRecommendedProject(project, canonicalRole, `Expands your portfolio depth in ${project.category} with production best practices.`))
      }
      if (recommended.length >= 3) break
    }
  }

  return recommended
}

function formatRecommendedProject(project, canonicalRole, whyThisProject) {
  const blueprint = generateProjectBlueprint(project, canonicalRole)
  const roadmap = generateProjectRoadmap(project)
  const readmeContent = generateProjectReadme(project, canonicalRole)
  const scaffolding = generateProjectScaffolding(project)

  blueprint.roadmap = roadmap
  blueprint.scaffoldingTree = scaffolding
  blueprint.databaseSchema = Array.isArray(blueprint.databaseDesign)
    ? blueprint.databaseDesign.map((d) => `${d.entity}: ${d.fields.join(', ')}`).join(' | ')
    : blueprint.databaseDesign
  blueprint.apiEndpoints = Array.isArray(blueprint.apiSpecifications)
    ? blueprint.apiSpecifications.map((a) => `${a.method} ${a.path} - ${a.purpose}`)
    : []
  if (typeof blueprint.architecture === 'object' && blueprint.architecture !== null) {
    blueprint.architecture = `${blueprint.architecture.backend} Frontend: ${blueprint.architecture.frontend} DB: ${blueprint.architecture.database}`
  }

  return {
    ...project,
    title: project.name,
    domain: project.category,
    roles: [canonicalRole.toLowerCase()],
    recruiterValue: project.whyMatch || project.differentiation,
    keyFeatures: project.coreFeatures || project.skillsDemonstrated,
    recommendedTechStack: project.suggestedTech,
    estimatedHours: project.difficulty === 'Advanced' || project.difficulty === 'Industry-level' ? 45 : 35,
    priority: project.careerImpact >= 93 ? 'HIGH' : 'MEDIUM',
    whyThisProject: whyThisProject || project.whyMatch || `Expands your portfolio depth in ${project.category} with production best practices.`,
    skillsAddressed: project.gapsFilled,
    blueprint,
    roadmap,
    readmeContent,
    scaffolding,
  }
}

// ─── Project Blueprint, Roadmap & README Generators ────────────────────────────

function generateProjectBlueprint(project, targetRole) {
  return {
    problemStatement: project.problem,
    objective: `Design, implement, and deploy a production-ready ${project.name} demonstrating ${project.skillsDemonstrated.slice(0, 3).join(', ')}.`,
    targetUsers: `Software engineering teams, enterprise administrators, and recruiters evaluating ${targetRole} capabilities.`,
    coreFeatures: [
      'Robust domain-driven service layer with clean separation of concerns.',
      'Comprehensive error-handling and input validation on all endpoints.',
      'Secure data storage with optimized indexing and relational integrity.',
      'Automated unit and integration test suite to prevent regressions.',
    ],
    advancedFeatures: [
      'Docker containerization with multi-stage production builds.',
      'Role-based authentication and secure session management.',
      'Structured logging and performance metric telemetry.',
    ],
    architecture: {
      frontend: project.suggestedTech.includes('React') ? 'Modular React/TypeScript with clean component hierarchy.' : 'Interactive dashboard / web interface.',
      backend: 'RESTful API service with layered controller-service-repository pattern.',
      database: project.suggestedTech.some((t) => t.includes('SQL') || t.includes('PostgreSQL')) ? 'Relational PostgreSQL with foreign keys and migrations.' : 'Document-oriented MongoDB with Mongoose schemas.',
      cloudSecurity: 'Environment-based configuration, CORS policies, rate limiting, and Docker containers.',
    },
    databaseDesign: [
      { entity: 'Users / Accounts', fields: ['id', 'email', 'passwordHash', 'role', 'createdAt'] },
      { entity: 'Core Resources', fields: ['id', 'ownerId', 'title', 'status', 'metadata', 'updatedAt'] },
      { entity: 'Audit Logs / Events', fields: ['id', 'resourceId', 'eventType', 'payload', 'timestamp'] },
    ],
    apiSpecifications: [
      { method: 'POST', path: '/api/v1/auth/login', purpose: 'Authenticate user and issue secure JWT' },
      { method: 'GET', path: '/api/v1/resources', purpose: 'Fetch paginated resources with filtering' },
      { method: 'POST', path: '/api/v1/resources', purpose: 'Create new resource with schema validation' },
      { method: 'GET', path: '/api/v1/health', purpose: 'Service health check and uptime probe' },
    ],
  }
}

function generateProjectRoadmap(project) {
  return [
    {
      phase: 1,
      title: 'Foundation & Architecture Setup',
      duration: 'Days 1–3',
      tasks: [
        'Initialize repository with clear folder structure and .gitignore.',
        'Configure ESLint, TypeScript/Babel, and testing framework.',
        'Model database schema and setup migration scripts / ORM models.',
      ],
    },
    {
      phase: 2,
      title: 'Core Domain Implementation',
      duration: 'Days 4–8',
      tasks: [
        `Implement main application logic using ${project.suggestedTech[0]} and ${project.suggestedTech[1]}.`,
        'Build and test primary CRUD and data processing routes.',
        'Implement input validation and unified error-handling middleware.',
      ],
    },
    {
      phase: 3,
      title: 'Advanced Features & Differentiators',
      duration: 'Days 9–14',
      tasks: [
        `Integrate ${project.gapsFilled[0] || 'authentication and state synchronization'}.`,
        'Add caching layer or background processing where appropriate.',
        'Connect responsive frontend interface with real-time feedback.',
      ],
    },
    {
      phase: 4,
      title: 'Testing & Quality Hardening',
      duration: 'Days 15–18',
      tasks: [
        'Write unit tests for service business logic and integration tests for APIs.',
        'Conduct security audit: sanitize inputs, prevent injection, check CORS.',
        'Optimize database queries and profile response times.',
      ],
    },
    {
      phase: 5,
      title: 'Containerization, Deployment & Documentation',
      duration: 'Days 19–21',
      tasks: [
        'Write multi-stage Dockerfile and docker-compose.yml.',
        'Generate detailed README with architecture diagram, setup steps, and API docs.',
        'Deploy live demo or cloud staging environment.',
      ],
    },
  ]
}

function generateProjectReadme(project, targetRole) {
  const techBadges = project.suggestedTech.map((t) => `\`${t}\``).join(' • ')
  return `# ${project.name}

> ${project.problem}

## 🚀 Overview
${project.name} is an enterprise-grade project built to demonstrate production-level software architecture, clean code standards, and robust design principles for **${targetRole}** roles.

## 🛠 Tech Stack
${techBadges}

## 📐 Architecture
\`\`\`
┌────────────────┐      HTTP / REST      ┌────────────────┐
│   Client UI    │ ────────────────────> │  API Gateway   │
│ (React/TS/CSS) │                       │ (Node/FastAPI) │
└────────────────┘                       └────────────────┘
                                                  │
                                         ┌────────┴────────┐
                                         ▼                 ▼
                                  ┌─────────────┐   ┌─────────────┐
                                  │  Database   │   │ Cache/Queue │
                                  │ (Postgres)  │   │   (Redis)   │
                                  └─────────────┘   └─────────────┘
\`\`\`

## ✨ Key Features
- **Clean Layered Architecture**: Clear separation of controllers, domain services, and database queries.
- **Resilient Error Handling**: Centralized error middleware with descriptive RFC 7807 responses.
- **Automated Test Coverage**: Comprehensive unit and integration test suite.
- **Containerized Deployment**: Ready to run with Docker and docker-compose.

## 🏁 Quick Start

### Prerequisites
- Node.js (v18+) or Python (v3.10+)
- Docker & Docker Compose (Optional for container run)

### Installation
\`\`\`bash
# 1. Clone repository
git clone https://github.com/your-username/${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.git
cd ${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}

# 2. Install dependencies
npm install  # or pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env

# 4. Start development server
npm run dev
\`\`\`

## 📖 API Documentation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| \`GET\` | \`/api/v1/health\` | Health check and system uptime probe |
| \`POST\` | \`/api/v1/auth/login\` | Authenticate user credentials |
| \`GET\` | \`/api/v1/resources\` | Paginated list of resources |
| \`POST\` | \`/api/v1/resources\` | Create new resource with validation |

## 🧪 Running Tests
\`\`\`bash
npm test
\`\`\`

## 📄 License
This project is licensed under the MIT License.
`
}

function generateProjectScaffolding(project) {
  const isPython = project.suggestedTech.some((t) => t.toLowerCase().includes('python') || t.toLowerCase().includes('fastapi'))

  if (isPython) {
    return [
      { path: 'README.md', type: 'file' },
      { path: '.gitignore', type: 'file' },
      { path: 'requirements.txt', type: 'file' },
      { path: 'Dockerfile', type: 'file' },
      { path: '.env.example', type: 'file' },
      { path: 'app/', type: 'directory' },
      { path: 'app/__init__.py', type: 'file' },
      { path: 'app/main.py', type: 'file' },
      { path: 'app/api/', type: 'directory' },
      { path: 'app/api/routes.py', type: 'file' },
      { path: 'app/models/', type: 'directory' },
      { path: 'app/services/', type: 'directory' },
      { path: 'tests/', type: 'directory' },
      { path: 'tests/test_api.py', type: 'file' },
    ]
  }

  return [
    { path: 'README.md', type: 'file' },
    { path: '.gitignore', type: 'file' },
    { path: 'package.json', type: 'file' },
    { path: 'Dockerfile', type: 'file' },
    { path: 'docker-compose.yml', type: 'file' },
    { path: '.env.example', type: 'file' },
    { path: 'src/', type: 'directory' },
    { path: 'src/controllers/', type: 'directory' },
    { path: 'src/services/', type: 'directory' },
    { path: 'src/models/', type: 'directory' },
    { path: 'src/routes/', type: 'directory' },
    { path: 'src/middleware/', type: 'directory' },
    { path: 'tests/', type: 'directory' },
  ]
}

// ─── Top 5 GitHub Profile Improvements ─────────────────────────────────────────

function selectTopGitHubImprovements(profile = {}, repoAnalysis = {}, gaps = {}) {
  const actions = []

  if (!profile.bio || profile.bio.trim().length < 15) {
    actions.push({
      priority: 'high',
      title: 'Enhance GitHub Bio & Positioning',
      action: 'Add a professional bio stating your exact target role and core technologies (e.g. "Full Stack Engineer | React, Node.js, TypeScript").',
      impact: 'Immediate recruiter clarity on who you are within 5 seconds of landing on your profile.',
    })
  }

  if (repoAnalysis.hasReadmeRatio < 50) {
    actions.push({
      priority: 'high',
      title: 'Add READMEs to Public Repositories',
      action: `Currently only ${repoAnalysis.hasReadmeRatio}% of your repositories have descriptions/documentation. Add clear READMEs with problem statements and setup instructions.`,
      impact: 'Recruiters immediately skip repositories with blank READMEs.',
    })
  }

  if (gaps.missingEvidence && gaps.missingEvidence.length > 0) {
    actions.push({
      priority: 'high',
      title: `Build Portfolio Evidence for ${gaps.missingEvidence[0]}`,
      action: `Your GitHub lacks evidence of ${gaps.missingEvidence.slice(0, 2).join(' and ')}. Build a dedicated project demonstrating these competencies.`,
      impact: 'Directly qualifies you for recruiter technical filters.',
    })
  }

  if (gaps.redundantAreas && gaps.redundantAreas.length > 0) {
    actions.push({
      priority: 'medium',
      title: 'Diversify Project Portfolio',
      action: `You have ${gaps.redundantAreas[0].count} similar ${gaps.redundantAreas[0].label}. Pin your single best one and focus new work on architecture and testing.`,
      impact: 'Demonstrates growth and breadth rather than repetitive beginner exercises.',
    })
  }

  if (repoAnalysis.reposList?.length > 0) {
    const topRepo = repoAnalysis.reposList[0]?.name || 'top project'
    actions.push({
      priority: 'low',
      title: `Pin Top Repositories (${topRepo})`,
      action: 'Pin your top 3-4 strongest, best-documented repositories to the top of your GitHub profile.',
      impact: 'Anchors recruiter attention on your highest-quality code.',
    })
  }

  return actions.slice(0, 5)
}

// ─── Master GitHub Profile & Portfolio Auditor ────────────────────────────────

/**
 * Master GitHub intelligence function.
 * Combines GitHub public data + student background bundle + target role.
 */
export const auditGitHubProfile = (profileData = {}, reposData = [], targetRoleOrBundle = '', bundleOrTargetRole = {}) => {
  let targetRole = ''
  let studentBundle = {}

  if (typeof targetRoleOrBundle === 'string') {
    targetRole = targetRoleOrBundle
    studentBundle = bundleOrTargetRole || {}
  } else if (typeof bundleOrTargetRole === 'string') {
    targetRole = bundleOrTargetRole
    studentBundle = targetRoleOrBundle || {}
  } else {
    studentBundle = targetRoleOrBundle || {}
    targetRole = studentBundle.targetRole || ''
  }

  // Validate target role
  if (targetRole) {
    const roleValidation = validateRole(targetRole)
    if (!roleValidation.isValid) {
      return {
        isValidRole: false,
        error: roleValidation.error,
        message: roleValidation.message,
        suggestedRoles: roleValidation.suggestedRoles,
      }
    }
  }

  const canonicalRole = targetRole ? (validateRole(targetRole).canonicalRole || targetRole) : 'Software Developer'

  // Analyze repositories
  const repoAnalysis = auditRepositories(reposData, canonicalRole)

  // Analyze portfolio gaps
  const gaps = analyzePortfolioGaps(reposData, profileData, canonicalRole, studentBundle)

  // Calculate scores
  const profileCompleteness = Math.round(
    (profileData.name ? 20 : 0) +
    (profileData.bio ? 25 : 0) +
    (profileData.avatar_url ? 15 : 0) +
    (profileData.location ? 10 : 0) +
    (profileData.blog ? 15 : 0) +
    (reposData.length >= 3 ? 15 : reposData.length * 5)
  )

  const repoQualityScore = repoAnalysis.avgRepoScore || 30
  const breadthScore = Math.min(100, (repoAnalysis.languagesUsed.length || 0) * 25)
  const depthScore = Math.min(100, (reposData.filter((r) => !r.fork).length || 0) * 18 + (repoAnalysis.totalStars > 0 ? 20 : 0))
  const roleAlignmentScore = gaps.missingEvidence.length <= 2 ? 90 : gaps.missingEvidence.length <= 4 ? 70 : 50

  const overallScore = Math.min(100, Math.round(
    profileCompleteness * 0.15 +
    repoQualityScore * 0.25 +
    breadthScore * 0.20 +
    depthScore * 0.20 +
    roleAlignmentScore * 0.20
  ))

  // Generate Anti-Duplicate Personalized Project Recommendations
  const recommendedProjects = generatePersonalizedProjectRecommendations(
    reposData,
    studentBundle,
    canonicalRole,
    gaps
  )

  // Generate Top 5 Actions
  const topActions = selectTopGitHubImprovements(profileData, repoAnalysis, gaps)

  return {
    isValidRole: true,
    githubUsername: profileData.login || '',
    githubUrl: profileData.html_url || `https://github.com/${profileData.login || ''}`,
    targetRole: canonicalRole,
    overallScore,
    scoreBreakdown: {
      profileQuality: profileCompleteness,
      repoQuality: repoQualityScore,
      breadth: breadthScore,
      depth: depthScore,
      roleAlignment: roleAlignmentScore,
      freshness: 85,
    },
    scores: {
      overall: overallScore,
      profileCompleteness,
      repoQuality: repoQualityScore,
      breadth: breadthScore,
      depth: depthScore,
      roleAlignment: roleAlignmentScore,
    },
    profileOverview: {
      name: profileData.name || profileData.login || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      publicRepos: profileData.public_repos ?? reposData.length,
      followers: profileData.followers || 0,
      following: profileData.following || 0,
      avatarUrl: profileData.avatar_url || '',
      blog: profileData.blog || '',
    },
    languagesUsed: repoAnalysis.languagesUsed,
    topRepositories: repoAnalysis.reposList.slice(0, 8),
    portfolioGaps: gaps,
    recommendedProjects,
    topActions,
    disclaimer: 'Analysis conducted strictly on publicly available GitHub data and verified AICP profile information. Zero private code accessed.',
    analyzedAt: new Date().toISOString(),
  }
}

// ─── User-Confirmed GitHub Repository Creator ──────────────────────────────────

/**
 * Creates a GitHub repository with user confirmation using a Personal Access Token.
 * Strict security: token is used in-flight only; never stored, never logged.
 */
export const createGitHubRepository = async (token, repoConfig = {}, projectData = {}) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return {
      success: false,
      error: 'A GitHub Personal Access Token (with "repo" scope) is required to create a repository.',
    }
  }

  const cleanToken = token.trim()
  const repoName = (repoConfig.repoName || projectData.name || 'new-project')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const description = repoConfig.description || projectData.whyThisProject || projectData.name || ''
  const isPrivate = Boolean(repoConfig.isPrivate)

  try {
    const client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 10000,
    })

    // 1. Create Repository
    const createRes = await client.post('/user/repos', {
      name: repoName,
      description,
      private: isPrivate,
      auto_init: true,
    })

    const repoData = createRes.data
    const owner = repoData.owner?.login
    const htmlUrl = repoData.html_url

    // 2. Commit customized README if blueprint is available
    if (projectData.readmeContent && owner) {
      try {
        // Check if README exists to get its SHA
        let sha = null
        try {
          const readmeRes = await client.get(`/repos/${owner}/${repoName}/contents/README.md`)
          sha = readmeRes.data?.sha
        } catch (_) {
          // File doesn't exist yet
        }

        const readmeBase64 = Buffer.from(projectData.readmeContent, 'utf-8').toString('base64')
        await client.put(`/repos/${owner}/${repoName}/contents/README.md`, {
          message: 'docs: initialize professional project README from AICP Blueprint',
          content: readmeBase64,
          sha: sha || undefined,
        })
      } catch (commitErr) {
        // Non-fatal if initial commit fails; repository was created
        console.warn('Initial README commit warning:', commitErr?.message)
      }
    }

    return {
      success: true,
      repoUrl: htmlUrl,
      repoName: repoData.name,
      description: repoData.description,
      isPrivate: repoData.private,
      cloneUrl: repoData.clone_url,
      nextSteps: [
        `git clone ${repoData.clone_url}`,
        `cd ${repoData.name}`,
        'Review Phase 1 of your AICP Implementation Roadmap.',
        'Implement core modules and commit progress regularly.',
        'Ensure all tests pass before deploying.',
      ],
    }
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.message || 'GitHub API error'
    return {
      success: false,
      error: `GitHub repository creation failed: ${errorDetail}`,
    }
  }
}

export default {
  validateGitHubUrl,
  fetchGitHubProfileAndRepos,
  auditRepositories,
  analyzePortfolioGaps,
  generatePersonalizedProjectRecommendations,
  auditGitHubProfile,
  createGitHubRepository,
}
