/**
 * server/src/controllers/careerAgentController.js
 *
 * Handles all AI Career & Resume Agent operations.
 * Reuses: User, StudentProfile, Portfolio, Resume, Opportunity models + aiServiceUrl config.
 * New:    CareerProfile, CareerSession models.
 *
 * AI Safety: this controller NEVER fabricates experience, metrics, or qualifications.
 * All AI operations are clearly labelled as AI-generated indicators.
 */

import axios from 'axios'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import Portfolio from '../models/Portfolio.js'
import Resume from '../models/Resume.js'
import Opportunity from '../models/Opportunity.js'
import CareerProfile from '../models/CareerProfile.js'
import CareerSession from '../models/CareerSession.js'
import MockInterview from '../models/MockInterview.js'
import config from '../config/env.js'
import { successResponse } from '../utils/response.js'
import { normalizeResume } from '../utils/resume.js'
import { validateRole } from '../services/ai/careerTaxonomy.js'
import { analyzeSkillGapEngine } from '../services/ai/skillGapEngine.js'
import { auditLinkedInProfile } from '../services/ai/linkedinAuditor.js'
import {
  validateGitHubUrl,
  fetchGitHubProfileAndRepos,
  auditGitHubProfile,
  createGitHubRepository,
} from '../services/ai/githubAuditor.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Proxy a request to the Python AI service with graceful fallback. */
const callAI = async (path, body, fallback) => {
  try {
    const response = await axios.post(`${config.aiServiceUrl}${path}`, body, {
      timeout: config.aiInferenceTimeoutMs,
    })
    return { data: response.data, fallback: false }
  } catch (error) {
    if (['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) {
      return { data: fallback, fallback: true }
    }
    throw error
  }
}

/** Build a consolidated profile bundle for a userId. */
const buildProfileBundle = async (userId) => {
  const [user, profile, portfolio, careerProfile] = await Promise.all([
    User.findById(userId).select('name email phone skills').lean(),
    StudentProfile.findOne({ userId }).lean(),
    Portfolio.findOne({ studentId: userId }).lean(),
    CareerProfile.findOne({ userId }).lean(),
  ])
  return { user: user || {}, profile: profile || {}, portfolio: portfolio || {}, careerProfile: careerProfile || {} }
}

/** Compute deterministic readiness scores from profile data (used as fallback). */
const computeReadinessScores = (bundle) => {
  const { user, profile, portfolio, careerProfile } = bundle
  const allSkills = [
    ...(user.skills || []),
    ...(Object.values(careerProfile.skillsByCategory || {}).flat()),
  ]
  const skillScore = Math.min(100, allSkills.length * 6)
  const projectCount = (portfolio?.projects?.length || 0) + (careerProfile?.projects?.length || 0)
  const projectScore = Math.min(100, projectCount * 18)
  const expCount = careerProfile?.experience?.length || 0
  const expScore = Math.min(100, expCount * 25)
  const certScore = Math.min(100, ((portfolio?.certifications?.length || 0) + (careerProfile?.certifications?.length || 0)) * 20)
  const githubScore = portfolio?.github ? 40 : 0
  const linkedinScore = (careerProfile?.linkedin || portfolio?.linkedin) ? 30 : 0
  const cgpa = profile?.cgpa || 0
  const eduScore = cgpa >= 8 ? 90 : cgpa >= 6 ? 70 : cgpa > 0 ? 50 : 30

  const overall = Math.round(
    skillScore * 0.20 +
    projectScore * 0.20 +
    expScore * 0.15 +
    certScore * 0.05 +
    githubScore * 0.10 +
    linkedinScore * 0.05 +
    eduScore * 0.15 +
    50 * 0.10  // interview readiness — unknown without mock interview
  )
  return { overall, skills: skillScore, projects: projectScore, experience: expScore, certifications: certScore, github: githubScore, linkedin: linkedinScore, resume: 50, interviewReadiness: 50, internshipReadiness: overall, analyzedAt: new Date() }
}

// ─── Career Profile CRUD ──────────────────────────────────────────────────────

export const getCareerProfile = async (req, res, next) => {
  try {
    const bundle = await buildProfileBundle(req.user.userId)
    return res.status(200).json(successResponse({ bundle }, 'Career profile retrieved'))
  } catch (error) { next(error) }
}

export const saveCareerProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const allowed = ['linkedin', 'github', 'portfolio', 'currentYear', 'currentSemester', 'relevantCoursework', 'skillsByCategory', 'experience', 'projects', 'certifications', 'achievements', 'targetRoles', 'preferredLocations']
    const update = {}
    allowed.forEach((key) => { if (req.body[key] !== undefined) update[key] = req.body[key] })
    const careerProfile = await CareerProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json(successResponse({ careerProfile }, 'Career profile saved'))
  } catch (error) { next(error) }
}

// ─── AI Interview (session-based) ────────────────────────────────────────────

const STAGE_ORDER = ['personal', 'education', 'skills', 'experience', 'projects', 'achievements', 'certifications', 'preferences', 'complete']

export const STAGE_PROMPTS_BY_ROUND = {
  1: {
    personal: "Let's begin Round 1! What is your full name, location, and a quick summary of your technical background?",
    education: "Great! Tell me about your academic journey — degree, college, branch, current semester, and CGPA.",
    skills: "What are your core technical skills? Mention your primary programming languages, frameworks, and databases.",
    experience: "Share your past internships or work experience. If you haven't held a formal job yet, mention any open-source or freelance projects. (Say 'None' if none yet).",
    projects: "Walk me through your best technical project: what problem did it solve, what was your tech stack, and what was the outcome?",
    achievements: "What are your proudest accomplishments? (Hackathons, coding rankings, paper publications, leadership roles).",
    certifications: "Which professional certifications or courses have you completed (e.g. AWS, Coursera, NPTEL)?",
    preferences: "What are your dream career roles, preferred work environment (remote/hybrid/onsite), and target industries?",
    complete: "Thank you! Round 1 is complete. Let me analyze your responses and generate your performance report.",
  },
  2: {
    personal: "Welcome to Round 2 — Technical Architecture & Professional Deep-Dive! Give me your 60-second elevator pitch as you would to an engineering hiring manager.",
    education: "Which university coursework or core computer science subjects (OS, DBMS, DSA, Networks) have influenced your software design the most, and how?",
    skills: "In this technical deep-dive: how do you approach system design, API architectural patterns (REST vs GraphQL), and database indexing/optimization?",
    experience: "Tell me about a time during an internship or project where you faced a critical bug or performance bottleneck. How did you diagnose and solve it?",
    projects: "Describe the architectural trade-offs in your most complex project. Why did you choose your specific tech stack over alternatives?",
    achievements: "How do you demonstrate technical initiative outside the classroom? Share any open-source contributions, mentor roles, or competitive programming milestones.",
    certifications: "Beyond certifications, how do you keep your technical skills sharp in emerging areas like AI, cloud architecture, and cybersecurity?",
    preferences: "Where do you envision yourself in 3 years technically? What advanced engineering problems do you want to solve?",
    complete: "Excellent work! Round 2 is complete. Review your advanced evaluation and model answers below.",
  },
  3: {
    personal: "Welcome to Round 3 — Senior Candidate & Problem Solving! How would your peers and project teammates describe your working style and engineering mindset?",
    education: "How have you balanced academic rigor with practical self-taught projects and collaborative team deadlines?",
    skills: "How do you evaluate code maintainability, testing strategies (unit vs integration vs e2e), and CI/CD pipelines in production?",
    experience: "Describe a situation where you had a technical disagreement with a team member or mentor. How did you reach consensus and deliver?",
    projects: "If you had to re-architect your flagship project for 100x user scale, what caching, queuing, and distributed systems changes would you make?",
    achievements: "Tell me about a high-pressure competition, hackathon, or crunch deadline where things didn't go as planned. How did you adapt?",
    certifications: "What is the single most challenging technical concept or skill you mastered recently, and what was your learning methodology?",
    preferences: "In an ideal engineering team, what kind of engineering culture, code review process, and mentorship do you look for?",
    complete: "Outstanding effort! Round 3 is complete. Check your senior-level evaluation and model answers below.",
  },
}

export const getStagePromptsForRound = (round = 1) => {
  const normalized = ((round - 1) % 3) + 1
  return STAGE_PROMPTS_BY_ROUND[normalized] || STAGE_PROMPTS_BY_ROUND[1]
}

export const validateAnswerInput = (text, stage = 'personal') => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, reason: 'Answer cannot be empty. Please provide a substantive response.' }
  }
  const trimmed = text.trim()

  // Check for repeated character sequences e.g. "aaaaaa", "zzzzzz", "11111"
  if (/(.)\1{4,}/i.test(trimmed)) {
    return { isValid: false, reason: 'Your input contains repetitive characters. Please enter a valid, meaningful answer.' }
  }

  // Check for keyboard mashing patterns
  const mashPattern = /\b(asdf|qwerty|zxcvb|hjkl|12345|test123|blabla|blablabla)\b/i
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (mashPattern.test(trimmed) && words.length <= 4) {
    return { isValid: false, reason: 'Your input appears to be placeholder or test text. Please provide your real response.' }
  }

  if (trimmed.length < 5 || words.length < 2) {
    return { isValid: false, reason: 'Answer is too short. Please provide at least a few words describing your response.' }
  }

  // Check for consonant-only long words (random typing like 'sdfsdfghjk')
  const longWords = words.filter((w) => w.length >= 6)
  for (const w of longWords) {
    if (!/[aeiouy]/i.test(w)) {
      return { isValid: false, reason: `The word "${w}" does not appear to be valid English. Please enter clear sentences.` }
    }
  }

  // Evasion check: allow "none" or "n/a" only for experience, certifications, achievements
  const allowedEmptyStages = ['experience', 'certifications', 'achievements']
  const isEvasion = /^(none|no|n\/a|na|nope|nothing|idk|i don't know|dont know|skip)$/i.test(trimmed)
  if (isEvasion && !allowedEmptyStages.includes(stage)) {
    return { isValid: false, reason: 'Please make an attempt to answer this question, as it is vital for your career assessment.' }
  }

  return { isValid: true }
}

export const analyzeSpeechAndGrammar = (text = '', speechMetrics = {}) => {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const durationSeconds = Number(speechMetrics.durationSeconds) || (wordCount > 0 ? (wordCount / 2.2) : 10)
  const wordsPerMinute = Math.round((wordCount / (durationSeconds / 60))) || 120

  // 1. Grammatical errors check
  const grammarIssues = []
  const grammarRules = [
    { regex: /\b(i has)\b/gi, issue: 'Incorrect verb agreement', suggestion: 'Use "I have" instead of "I has"' },
    { regex: /\b(we was)\b/gi, issue: 'Incorrect verb agreement', suggestion: 'Use "we were" instead of "we was"' },
    { regex: /\b(they was)\b/gi, issue: 'Incorrect verb agreement', suggestion: 'Use "they were" instead of "they was"' },
    { regex: /\b(he don't|she don't|it don't)\b/gi, issue: 'Third-person singular agreement', suggestion: 'Use "doesn\'t" instead of "don\'t"' },
    { regex: /\b(you is)\b/gi, issue: 'Subject-verb mismatch', suggestion: 'Use "you are" instead of "you is"' },
    { regex: /\b(i been)\b/gi, issue: 'Missing auxiliary verb', suggestion: 'Use "I have been" instead of "I been"' },
    { regex: /\b(don't have no|didn't do nothing|can't see nothing)\b/gi, issue: 'Double negative', suggestion: 'Avoid double negatives in formal communication' },
    { regex: /\b(revert back)\b/gi, issue: 'Redundant phrasing', suggestion: 'Use "revert" or "reply" instead of "revert back"' },
    { regex: /\b(repeat again)\b/gi, issue: 'Redundant phrasing', suggestion: 'Use "repeat" instead of "repeat again"' },
    { regex: /\b(more better|most best)\b/gi, issue: 'Double superlative/comparative', suggestion: 'Use "better" or "best"' },
  ]

  grammarRules.forEach(({ regex, issue, suggestion }) => {
    if (regex.test(text)) {
      grammarIssues.push({ issue, suggestion })
    }
  })

  // 2. Filler word analysis
  const fillerRegex = /\b(um|uh|er|ah|like|you know|basically|actually|so yeah|kind of|sort of)\b/gi
  const fillerMatches = text.match(fillerRegex) || []
  const fillerCount = fillerMatches.length
  const uniqueFillers = [...new Set(fillerMatches.map((f) => f.toLowerCase()))]

  // 3. Intonation, Pacing, and Confidence
  let pacingFeedback = 'Optimal conversational pace'
  let pacingScore = 90
  if (wordsPerMinute < 95) {
    pacingFeedback = `Deliberate / slightly slow delivery (${wordsPerMinute} WPM) — speak with a bit more cadence`
    pacingScore = 75
  } else if (wordsPerMinute > 165) {
    pacingFeedback = `Fast delivery (${wordsPerMinute} WPM) — pause occasionally between thoughts for clarity`
    pacingScore = 78
  } else {
    pacingFeedback = `Natural, recruiter-friendly pacing (${wordsPerMinute} WPM)`
    pacingScore = 95
  }

  // Hesitation vs Action Verbs (Intonation & Tone Confidence)
  const hesitationRegex = /\b(i guess|maybe|probably|i think maybe|sort of|kind of|i'm not sure)\b/gi
  const hesitationCount = (text.match(hesitationRegex) || []).length

  const actionRegex = /\b(i built|i led|i developed|i engineered|i optimized|i managed|specifically|as a result|successfully|achieved|delivered)\b/gi
  const actionCount = (text.match(actionRegex) || []).length

  let toneRating = 'Confident & Assertive'
  let confidenceScore = 85
  if (hesitationCount > 2) {
    toneRating = 'Somewhat Hesitant — replace speculative words with direct experience'
    confidenceScore -= Math.min(25, hesitationCount * 8)
  }
  if (actionCount >= 2) {
    confidenceScore = Math.min(100, confidenceScore + actionCount * 5)
  }

  const speechScore = Math.max(40, Math.min(100, Math.round(
    pacingScore * 0.35 +
    confidenceScore * 0.35 +
    Math.max(40, 100 - (grammarIssues.length * 15)) * 0.20 +
    Math.max(40, 100 - (fillerCount * 8)) * 0.10
  )))

  return {
    isMicInput: true,
    wordsPerMinute,
    pacingWPM: wordsPerMinute,
    pacingFeedback,
    pacingStatus: pacingFeedback,
    pacingScore,
    fillerCount,
    fillerWordsCount: fillerCount,
    uniqueFillers,
    fillerWordsList: uniqueFillers,
    grammarIssues,
    grammaticalIssues: grammarIssues,
    grammarScore: Math.max(50, 100 - (grammarIssues.length * 15)),
    toneRating,
    tone: toneRating,
    confidenceScore,
    speechScore,
  }
}

export const getModelAnswer = (stage, round = 1) => {
  const normalized = ((round - 1) % 3) + 1
  const modelAnswers = {
    1: {
      personal: "My name is Rohit Sharma, a Final Year Computer Science candidate based in Bengaluru. I am passionate about full-stack web architecture and cloud-native AI integration, focusing on building high-reliability services that improve human productivity.",
      education: "I am pursuing a B.Tech in Computer Science & Engineering at Delhi Technological University with a CGPA of 8.8/10.0. My core coursework includes Data Structures & Algorithms, Database Management Systems, Computer Networks, and Distributed Systems.",
      skills: "My core technical competencies include JavaScript/TypeScript (React 18, Node.js/Express), Python (FastAPI, PyTorch, Scikit-Learn), SQL (PostgreSQL), and NoSQL (MongoDB). For DevOps, I implement Docker containerization, GitHub Actions CI/CD pipelines, and AWS cloud services (S3, EC2).",
      experience: "During my 6-month software development internship at Neural Technologies, I engineered high-throughput RESTful microservices that processed 100k+ daily transactions, implemented Redis distributed caching to decrease endpoint latency by 42%, and maintained 90%+ automated unit test coverage.",
      projects: "I architected 'CollabHub', an enterprise collaborative workspace using React, WebSockets, Express, and MongoDB. It features end-to-end encrypted messaging and document collaboration. The application sustained 5,000 active concurrent connections during stress testing with sub-50ms response times.",
      achievements: "Secured 1st place among 140+ teams at the National Smart India Hackathon 2025 for an AI document verification system, and rank in the top 3% globally on LeetCode with 500+ algorithmic problems solved.",
      certifications: "Completed AWS Certified Cloud Practitioner, Meta Front-End Developer Professional Certificate, and DeepLearning.AI Specialization on Coursera.",
      preferences: "I am targeting Software Development Engineer (SDE-1) or Full Stack AI Engineer roles in progressive tech firms, open to hybrid or remote work environments with high-impact engineering teams.",
    },
    2: {
      personal: "I am a full-stack engineer who thrives at the intersection of performant web architectures and pragmatic AI solutions. I believe software engineering is about solving business problems with clean, maintainable, and observable code.",
      education: "Through OS and Distributed Systems coursework, I mastered concurrency models, memory management, and socket programming. This theoretical rigor directly informs how I design stateless microservices and prevent race conditions.",
      skills: "In system design, I prefer modular microservices communicating via REST/JSON or gRPC. For databases, I leverage B-tree indexing on foreign keys, composite indexes for compound queries, and read-replicas for query-heavy workloads.",
      experience: "Faced with a production memory leak during my internship, I analyzed heap dumps using Chrome DevTools and Node clinic.js, identified an unclosed event listener inside a websocket handler, resolved it, and dropped memory consumption by 65%.",
      projects: "In our flagship project, we chose PostgreSQL over MongoDB because of strict ACID transactional requirements for user payments, and implemented Redis Pub/Sub for scalable horizontal notification broadcasting.",
      achievements: "Active open-source contributor to popular React tooling with 4 merged PRs, and served as Technical Lead for the university ACM Chapter, mentoring 60+ junior students in DSA and web development.",
      certifications: "Completed Google Cloud Associate Cloud Engineer credential and routinely study system architecture whitepapers (Google MapReduce, DynamoDB, Raft consensus) to deepen distributed systems knowledge.",
      preferences: "Over the next 3 years, my roadmap is to advance into an SDE-2 role, owning distributed microservices and mentoring junior engineers while driving cloud infrastructure modernization.",
    },
    3: {
      personal: "Teammates describe me as a collaborative, proactive problem-solver who pairs strong technical execution with empathy and clear documentation. I prioritize code reviews that foster team learning.",
      education: "Balancing academic coursework with production project deadlines taught me rigorous agile time management, test-driven development, and the importance of continuous feedback loops.",
      skills: "I enforce strict code maintainability through ESLint/Prettier, comprehensive Vitest/Jest unit suites, integration tests with Dockerized databases, and automated GitHub Actions that block regressions prior to merge.",
      experience: "When our team debated whether to use GraphQL vs REST for an internal API, I built a quick prototype comparing latency, bundle size, and developer velocity. The evidence demonstrated REST was optimal for our caching requirements.",
      projects: "To scale our project for 100x traffic, I would introduce an API gateway with rate-limiting, implement read-replicas with Redis caching, decouple heavy compute via Kafka message queues, and deploy across Kubernetes clusters.",
      achievements: "During an intense 36-hour hackathon when a third-party API crashed with 4 hours remaining, I quickly pivoted our architecture to an offline cached fallback, allowing us to successfully demo and win the innovation award.",
      certifications: "Recently mastered Raft Consensus and distributed transactions by implementing a mini distributed key-value store from scratch in Go, deepening my appreciation for partition tolerance and CAP theorem trade-offs.",
      preferences: "I seek an engineering culture that prizes psychological safety, rigorous yet kind peer code reviews, continuous deployment, and high ownership over product impact.",
    },
  }

  const roundData = modelAnswers[normalized] || modelAnswers[1]
  return roundData[stage] || roundData.personal
}

export const rateAnswer = (question, answer, stage = 'personal', speechAnalysis = null, round = 1) => {
  const words = (answer || '').trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  let score = 0
  const strengths = []
  const improvements = []

  // 1. Depth and length scoring
  if (wordCount >= 50) {
    score += 45
    strengths.push('Comprehensive depth and detailed explanation')
  } else if (wordCount >= 20) {
    score += 35
    strengths.push('Solid baseline detail with clear focus')
  } else if (wordCount >= 10) {
    score += 25
    improvements.push('Elaborate with additional technical context or impact')
  } else {
    score += 15
    improvements.push('Answer is very brief; aim for at least 35-50 words')
  }

  // 2. Technical terminology & structure check
  const techKeywords = /\b(react|node|python|javascript|typescript|api|database|sql|mongodb|docker|aws|cloud|git|system|scale|performance|cache|redis|star|situation|task|action|result|impact|metric|latency|optimization)\b/i
  if (techKeywords.test(answer)) {
    score += 30
    strengths.push('Effective use of relevant industry terminology and technical concepts')
  } else {
    score += 15
    improvements.push('Mention specific tools, frameworks, or measurable outcomes')
  }

  // 3. Quantifiable impact / outcome check
  if (/\b(\d+%|\d+\s*(users|requests|ms|seconds|minutes|hours|days|x|fold))\b/i.test(answer)) {
    score += 15
    strengths.push('Includes quantifiable metrics and tangible results')
  } else {
    score += 8
    improvements.push('Where possible, quantify your impact (e.g. improved speed by 30%, served 1,000+ users)')
  }

  // 4. Speech delivery adjustments if mic input was used
  if (speechAnalysis) {
    if (speechAnalysis.grammarIssues?.length > 0) {
      score -= Math.min(10, speechAnalysis.grammarIssues.length * 3)
      improvements.push(`Grammar note: ${speechAnalysis.grammarIssues[0].suggestion}`)
    }
    if (speechAnalysis.fillerCount > 3) {
      score -= Math.min(8, speechAnalysis.fillerCount * 2)
      improvements.push(`Minimize verbal filler words like "${speechAnalysis.uniqueFillers.slice(0, 2).join(', ')}"`)
    }
    if (speechAnalysis.confidenceScore >= 85) {
      strengths.push('Spoken delivery demonstrated strong vocal confidence and leadership tone')
    }
  }

  score = Math.max(45, Math.min(100, Math.round(score)))

  let ratingTier = 'Good'
  if (score >= 88) ratingTier = 'Excellent'
  else if (score >= 72) ratingTier = 'Good'
  else if (score >= 58) ratingTier = 'Satisfactory'
  else ratingTier = 'Needs Polish'

  const feedback = score >= 85
    ? 'Impressive response! You provided substantive detail with relevant technical terminology.'
    : score >= 70
      ? 'Good response with clear context. A bit more emphasis on tangible outcomes will make it standout.'
      : 'Decent start. Focus on providing structured examples and technical specifics to boost recruiter confidence.'

  const modelAnswer = getModelAnswer(stage, round)

  return {
    score,
    ratingTier,
    feedback,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    modelAnswer,
    speechAnalysis,
  }
}

export const startInterview = async (req, res, next) => {
  try {
    const userId = req.user.userId
    // Track repeat interview attempts
    const completedCount = await CareerSession.countDocuments({ userId, status: 'completed' })
    const sessionRound = completedCount + 1

    // Abandon any existing active session
    await CareerSession.updateMany({ userId, status: 'active' }, { $set: { status: 'abandoned' } })

    // Prefill from existing profile
    const bundle = await buildProfileBundle(userId)
    const prefill = {
      name: bundle.user.name || '',
      email: bundle.user.email || '',
      phone: bundle.user.phone || '',
      skills: bundle.user.skills || [],
      college: bundle.profile.college || '',
      department: bundle.profile.department || '',
      graduationYear: bundle.profile.graduationYear || null,
      cgpa: bundle.profile.cgpa || null,
      github: bundle.portfolio?.github || '',
      linkedin: bundle.portfolio?.linkedin || '',
    }

    const roundPrompts = getStagePromptsForRound(sessionRound)
    const firstMessage = { role: 'assistant', content: roundPrompts.personal, stage: 'personal' }
    const session = await CareerSession.create({
      userId,
      sessionRound,
      currentStage: 'personal',
      messages: [firstMessage],
      collectedData: { prefill },
      evaluations: [],
    })
    return res.status(201).json(successResponse({ session, sessionRound }, `Interview Round ${sessionRound} started`))
  } catch (error) { next(error) }
}

export const sendInterviewMessage = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { sessionId, message, enteredViaMic = false, speechMetrics = {} } = req.body
    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'sessionId and message are required' })
    }
    const session = await CareerSession.findOne({ _id: sessionId, userId, status: 'active' })
    if (!session) return res.status(404).json({ success: false, message: 'Active session not found' })

    const currentStage = session.currentStage
    const sessionRound = session.sessionRound || 1
    const roundPrompts = getStagePromptsForRound(sessionRound)

    // 1. Input validity check
    const validation = validateAnswerInput(message, currentStage)
    if (!validation.isValid) {
      return res.status(200).json(successResponse({
        validationError: true,
        feedback: validation.reason,
        message: `⚠️ Quality Check Notice: ${validation.reason}\n\nPlease provide a more substantive answer so we can properly evaluate your knowledge and profile.`,
        currentStage,
        isComplete: false,
        sessionId: session._id,
      }, 'Validation check failed'))
    }

    // 2. Analyze speech if entered via mic
    let speechAnalysis = null
    if (enteredViaMic || speechMetrics?.isMicInput) {
      speechAnalysis = analyzeSpeechAndGrammar(message.trim(), speechMetrics)
    }

    // 3. Rate the candidate's answer
    const currentQuestion = roundPrompts[currentStage] || 'Interview question'
    const evaluation = rateAnswer(currentQuestion, message.trim(), currentStage, speechAnalysis, sessionRound)

    // Add user message with evaluation attached
    session.messages.push({
      role: 'user',
      content: message.trim(),
      stage: currentStage,
      evaluation,
      enteredViaMic: !!enteredViaMic,
    })

    if (!session.evaluations) session.evaluations = []
    session.evaluations.push({
      stage: currentStage,
      question: currentQuestion,
      answer: message.trim(),
      ...evaluation,
    })

    // Store collected data for this stage
    if (!session.collectedData) session.collectedData = {}
    session.collectedData[currentStage] = message.trim()
    session.markModified('collectedData')
    session.markModified('evaluations')

    // Determine next stage
    const currentIndex = STAGE_ORDER.indexOf(currentStage)
    const nextStage = STAGE_ORDER[currentIndex + 1] || 'complete'

    let reply
    if (nextStage === 'complete') {
      session.currentStage = 'complete'
      session.status = 'completed'
      session.completedAt = new Date()
      reply = `✓ Congratulations! Round ${sessionRound} of your AI Interview is complete.\n\nYour answers have been checked and rated. Below is your comprehensive performance review with AI suggested best answers for each question.`
    } else {
      session.currentStage = nextStage
      reply = roundPrompts[nextStage]
    }

    session.messages.push({ role: 'assistant', content: reply, stage: nextStage })

    // If complete, persist collected data to CareerProfile
    if (session.status === 'completed') {
      const cd = session.collectedData || {}
      await CareerProfile.findOneAndUpdate(
        { userId },
        {
          $set: {
            linkedin: cd.personal?.match(/linkedin\.com\/[^\s]+/i)?.[0] || '',
            github: cd.personal?.match(/github\.com\/[^\s]+/i)?.[0] || '',
            relevantCoursework: cd.education ? cd.education.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : [],
            interviewCompletedAt: new Date(),
            interviewVersion: sessionRound,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    }

    await session.save()
    return res.status(200).json(successResponse({
      message: reply,
      currentStage: session.currentStage,
      isComplete: session.status === 'completed',
      sessionId: session._id,
      sessionRound,
      evaluation,
      evaluations: session.evaluations,
    }, 'Message processed'))
  } catch (error) { next(error) }
}

export const getInterviewSession = async (req, res, next) => {
  try {
    const session = await CareerSession.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 })
    return res.status(200).json(successResponse({ session }, 'Session retrieved'))
  } catch (error) { next(error) }
}

export const exitInterview = async (req, res, next) => {
  try {
    const userId = req.user.userId
    // Mark any active session as abandoned so it will not be completed or scored
    await CareerSession.updateMany({ userId, status: 'active' }, { $set: { status: 'abandoned' } })
    return res.status(200).json(successResponse(null, 'Interview exited successfully'))
  } catch (error) { next(error) }
}

// ─── Profile Analyzer ────────────────────────────────────────────────────────

export const analyzeProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]
    const targetRole = req.body.targetRole || (bundle.careerProfile.targetRoles?.[0]) || ''

    const fallbackScores = computeReadinessScores(bundle)

    const { data: aiData, fallback } = await callAI('/career-agent/analyze-profile', {
      skills: allSkills,
      target_role: targetRole,
      education: `${bundle.profile.department || ''} ${bundle.profile.college || ''} CGPA:${bundle.profile.cgpa || ''}`,
      projects: (bundle.careerProfile.projects || []).map((p) => p.name),
      experience: (bundle.careerProfile.experience || []).map((e) => `${e.role} at ${e.organization}`),
      certifications: (bundle.careerProfile.certifications || []).map((c) => c.name),
      github: bundle.portfolio?.github || bundle.careerProfile?.github || '',
      linkedin: bundle.portfolio?.linkedin || bundle.careerProfile?.linkedin || '',
    }, {
      scores: fallbackScores,
      strengths: allSkills.slice(0, 5),
      weaknesses: ['Add more projects', 'Improve LinkedIn profile'],
      missingInfo: [],
      recommendations: ['Complete your GitHub profile', 'Add at least 2 more projects'],
    })

    // Persist scores
    const scores = aiData.scores || fallbackScores
    await CareerProfile.findOneAndUpdate(
      { userId },
      { $set: { scores: { ...scores, analyzedAt: new Date() } } },
      { upsert: true, new: true }
    )

    return res.status(200).json(successResponse({
      analysis: aiData,
      scores,
      fallback,
      disclaimer: 'Scores are AI-generated readiness indicators, not scientifically validated assessments.',
    }, fallback ? 'Profile analyzed with local scoring' : 'Profile analyzed'))
  } catch (error) { next(error) }
}

// ─── Career Recommendation ───────────────────────────────────────────────────

export const getCareerRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]

    const { data, fallback } = await callAI('/career-recommendation', {
      skills: allSkills,
      target_role: req.body.targetRole || '',
      text: `${bundle.profile.department || ''} ${bundle.profile.college || ''} ${bundle.profile.cgpa || ''}`,
    }, { recommendations: [] })

    return res.status(200).json(successResponse({ recommendations: data.recommendations || [], fallback }, 'Career recommendations generated'))
  } catch (error) { next(error) }
}

// ─── ATS Resume Generation ───────────────────────────────────────────────────

export const generateATSResume = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const targetRole = req.body.targetRole || ''
    const _allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]

    // Build resume data from verified profile only — never fabricate
    const resumeData = normalizeResume(bundle)

    // Merge career-agent-specific data with structured fields
    if (bundle.careerProfile.experience?.length) {
      resumeData.experience = bundle.careerProfile.experience.map((e) => ({
        title: e.role || e.title || '',
        company: e.organization || e.company || '',
        duration: e.duration || '',
        description: Array.isArray(e.responsibilities) && e.responsibilities.length
          ? e.responsibilities.join('. ')
          : (e.description || ''),
      }))
    }
    if (bundle.careerProfile.projects?.length) {
      resumeData.projects = bundle.careerProfile.projects.map((p) => ({
        title: p.name || p.title || 'Academic Project',
        tag: p.tag || (p.impact ? `Impact: ${p.impact}` : ''),
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
        description: p.solution || p.description || p.problemStatement || '',
      }))
    }
    if (bundle.careerProfile.certifications?.length) resumeData.certifications = bundle.careerProfile.certifications.map((c) => ({ description: `${c.name} — ${c.issuer}` }))
    if (bundle.careerProfile.achievements?.length) resumeData.achievements = bundle.careerProfile.achievements.map((a) => ({ description: a.title }))

    const chosenTemplate = req.body.template || 'shailesh-format'
    const resume = await Resume.create({
      studentId: userId,
      title: req.body.title || (targetRole ? `${targetRole} Resume` : 'ATS Career Resume'),
      template: chosenTemplate,
      aiGenerated: true,
      aiMetadata: { modelVersion: 'career-agent-v1', lastOperation: 'generate_ats_resume', warnings: [], unsupportedClaims: [] },
      ...resumeData,
    })

    return res.status(201).json(successResponse({ resume, targetRole }, 'ATS resume generated from verified profile data. Review all sections before submitting.'))
  } catch (error) { next(error) }
}

// ─── Job Description Analyzer ────────────────────────────────────────────────

export const analyzeJobDescription = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { jobDescription } = req.body
    if (!jobDescription?.trim()) return res.status(400).json({ success: false, message: 'jobDescription is required' })

    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]

    const { data: extractedSkills } = await callAI('/extract-skills', { text: jobDescription.slice(0, 20000) }, { skills: [] })

    // Compute match
    const jdSkills = (Array.isArray(extractedSkills) ? extractedSkills : extractedSkills?.skills || []).map((s) => (typeof s === 'string' ? s : s.name || '').toLowerCase())
    const studentSkillSet = new Set(allSkills.map((s) => s.toLowerCase()))
    const matched = jdSkills.filter((s) => studentSkillSet.has(s))
    const missing = jdSkills.filter((s) => !studentSkillSet.has(s))
    const matchScore = jdSkills.length ? Math.round((matched.length / jdSkills.length) * 100) : 0

    return res.status(200).json(successResponse({
      matchScore,
      matchedSkills: matched,
      missingSkills: missing,
      jdSkills,
      resumeImprovements: missing.map((skill) => `Add evidence of ${skill} only if you genuinely have it — do not fabricate.`),
    }, 'Job description analyzed'))
  } catch (error) { next(error) }
}

// ─── Internship Matching ─────────────────────────────────────────────────────

export const matchInternships = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]

    // Use existing Opportunity collection — no duplicate data
    const opportunities = await Opportunity.find({ isPublished: true, status: 'open', type: { $in: ['internship', 'job'] } }).limit(50).lean()

    const matches = opportunities.map((opp) => {
      const required = opp.requiredSkills || []
      const preferred = opp.preferredSkills || []
      const studentSet = new Set(allSkills.map((s) => s.toLowerCase()))
      const matchedRequired = required.filter((s) => studentSet.has(s.toLowerCase()))
      const matchedPreferred = preferred.filter((s) => studentSet.has(s.toLowerCase()))
      const missing = required.filter((s) => !studentSet.has(s.toLowerCase()))
      const skillMatch = required.length ? Math.round((matchedRequired.length / required.length) * 100) : 50
      const eduMatch = bundle.profile.cgpa >= (opp.minGPA || 0) ? 100 : Math.max(0, Math.round(((bundle.profile.cgpa || 0) / (opp.minGPA || 6)) * 100))
      const overall = Math.round(skillMatch * 0.55 + eduMatch * 0.25 + (matchedPreferred.length > 0 ? 20 : 0))
      return {
        opportunityId: opp._id,
        title: opp.title,
        type: opp.type,
        location: opp.location,
        duration: opp.duration,
        stipend: opp.stipend,
        matchScore: overall,
        skillMatch,
        educationMatch: eduMatch,
        matchedSkills: matchedRequired,
        missingSkills: missing,
        reason: matchedRequired.length ? `Your skills in ${matchedRequired.slice(0, 3).join(', ')} directly match what is required.` : 'This role can help you grow into your target career.',
      }
    })

    matches.sort((a, b) => b.matchScore - a.matchScore)
    return res.status(200).json(successResponse({ matches, total: matches.length }, 'Internship matches calculated'))
  } catch (error) { next(error) }
}

// ─── Skill Gap Analyzer ───────────────────────────────────────────────────────

export const analyzeSkillGap = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(req.body.skills || []),
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
      ...((bundle.careerProfile.certifications || []).flatMap((c) => c.skillsObtained || [])),
      ...((bundle.portfolio?.projects || []).flatMap((p) => p.technologies || p.skills || [])),
    ]
    const targetRole = req.body.targetRole || (bundle.careerProfile.targetRoles?.[0]) || ''

    // Role validation against AICP career ontology
    const validation = validateRole(targetRole)
    if (!validation.isValid) {
      const invalidResult = {
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
      return res.status(200).json(successResponse({ skillGap: invalidResult, fallback: false }, 'Unsupported career role evaluated'))
    }

    const localResult = analyzeSkillGapEngine(allSkills, validation.canonicalRole)

    // Call AI service with fallback to local deterministic domain engine
    const { data: aiData, fallback } = await callAI('/skill-gap', {
      skills: allSkills,
      target_role: validation.canonicalRole,
    }, localResult)

    const finalResult = {
      ...localResult,
      ...(aiData || {}),
      targetRole: aiData?.target_role || aiData?.targetRole || localResult.targetRole,
      isValidRole: aiData?.is_valid_role !== undefined ? aiData.is_valid_role : (aiData?.isValidRole !== undefined ? aiData.isValidRole : true),
      readinessScore: aiData?.readiness_score !== undefined ? aiData.readiness_score : (aiData?.readinessScore !== undefined ? aiData.readinessScore : localResult.readinessScore),
      matchedSkills: aiData?.matched_skills || aiData?.matchedSkills || localResult.matchedSkills,
      partialSkills: aiData?.partial_skills || aiData?.partialSkills || localResult.partialSkills,
      missingSkills: aiData?.missing_skills || aiData?.missingSkills || localResult.missingSkills,
      strengths: aiData?.strengths || localResult.strengths,
      gaps: aiData?.gaps || localResult.gaps,
      roadmap: aiData?.roadmap || localResult.roadmap,
      recommendedPrograms: aiData?.recommended_programs || aiData?.recommendedPrograms || localResult.recommendedPrograms,
    }

    return res.status(200).json(successResponse({ skillGap: finalResult, fallback }, 'Skill gap analyzed'))
  } catch (error) { next(error) }
}

// ─── Personalized Roadmap ─────────────────────────────────────────────────────

export const generateRoadmap = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(req.body.skills || []),
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
      ...((bundle.careerProfile.certifications || []).flatMap((c) => c.skillsObtained || [])),
      ...((bundle.portfolio?.projects || []).flatMap((p) => p.technologies || p.skills || [])),
    ]
    const targetRole = req.body.targetRole || (bundle.careerProfile.targetRoles?.[0]) || ''

    const validation = validateRole(targetRole)
    if (!validation.isValid) {
      return res.status(200).json(successResponse({
        roadmap: null,
        isValidRole: false,
        error: validation.error,
        message: validation.message,
        suggestedRoles: validation.suggestedRoles || [],
      }, 'Unsupported career role evaluated'))
    }

    const localResult = analyzeSkillGapEngine(allSkills, validation.canonicalRole)

    const { data: aiData } = await callAI('/skill-gap', {
      skills: allSkills,
      target_role: validation.canonicalRole,
    }, localResult)

    const roadmap = aiData?.roadmap || localResult.roadmap

    return res.status(200).json(successResponse({ roadmap }, 'Personalized roadmap generated'))
  } catch (error) { next(error) }
}


// ─── Project Recommender ──────────────────────────────────────────────────────

export const recommendProjects = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]
    const targetRole = req.body.targetRole || (bundle.careerProfile.targetRoles?.[0]) || ''

    const { data: gapData } = await callAI('/skill-gap', { skills: allSkills, target_role: targetRole }, { gaps: [] })
    const gaps = (gapData.gaps || []).map((g) => g.skill || g)

    // Role-specific project templates with AI/ML implementation ideas
    const projectTemplates = {
      'AI/ML Engineer': [
        { name: 'Student Performance Predictor', problem: 'Predict academic outcomes using historical data', tech: ['Python', 'scikit-learn', 'Pandas', 'Streamlit'], difficulty: 'Intermediate', duration: '2 weeks', skillsGained: ['Machine Learning', 'Data Analysis', 'Model Evaluation'], aiImplementation: 'Use a Random Forest classifier. Extend with SHAP explainability to show which features affect each prediction.' },
        { name: 'Sentiment Analysis API', problem: 'Classify social media post sentiment in real time', tech: ['Python', 'Transformers', 'FastAPI', 'Docker'], difficulty: 'Intermediate', duration: '3 weeks', skillsGained: ['NLP', 'API Design', 'Deployment'], aiImplementation: 'Fine-tune a DistilBERT model on a public Twitter dataset. Add confidence scores per class.' },
        { name: 'Resume Skill Extractor', problem: 'Automatically extract skills from resume PDFs', tech: ['Python', 'spaCy', 'PyPDF2', 'Flask'], difficulty: 'Beginner', duration: '1 week', skillsGained: ['NLP', 'Text Processing', 'REST APIs'], aiImplementation: 'Use spaCy Named Entity Recognition with a custom entity type for skills. Compare results with keyword matching.' },
      ],
      'Full Stack Developer': [
        { name: 'Internship Tracker', problem: 'Track job applications with status and notes', tech: ['React', 'Node.js', 'MongoDB', 'Express'], difficulty: 'Beginner', duration: '2 weeks', skillsGained: ['MERN Stack', 'CRUD Operations', 'Auth'], aiImplementation: 'Add an AI "next step" recommender using simple rule-based logic on application status and deadlines.' },
        { name: 'Collaborative Code Editor', problem: 'Real-time collaborative coding environment', tech: ['React', 'Socket.io', 'Node.js', 'Monaco Editor'], difficulty: 'Advanced', duration: '4 weeks', skillsGained: ['WebSockets', 'Real-time Systems', 'React Advanced'], aiImplementation: 'Integrate a code completion model (e.g. a small GPT-2 wrapper) for basic autocomplete suggestions.' },
      ],
      'Data Analyst': [
        { name: 'COVID-19 Data Dashboard', problem: 'Visualize trends from public health datasets', tech: ['Python', 'Pandas', 'Plotly', 'Dash'], difficulty: 'Beginner', duration: '1 week', skillsGained: ['Data Viz', 'EDA', 'Dashboard Design'], aiImplementation: 'Add a simple ARIMA or Prophet forecast panel to predict the next 30 days of reported cases.' },
        { name: 'E-Commerce Sales Forecasting', problem: 'Forecast monthly sales using time-series analysis', tech: ['Python', 'Prophet', 'Matplotlib', 'Jupyter'], difficulty: 'Intermediate', duration: '2 weeks', skillsGained: ['Time-Series', 'Forecasting', 'Business Analytics'], aiImplementation: 'Compare Facebook Prophet with a simple LSTM model. Evaluate with RMSE and MAE. Document trade-offs.' },
      ],
      default: [
        { name: 'Personal Portfolio Website', problem: 'Showcase your projects, skills, and contact info', tech: ['React', 'Tailwind CSS', 'Vercel'], difficulty: 'Beginner', duration: '1 week', skillsGained: ['Frontend Dev', 'Responsive Design', 'Deployment'], aiImplementation: 'Add a chatbot widget powered by a simple rule-based FAQ system to answer questions about your profile.' },
        { name: 'CLI Task Manager', problem: 'Manage tasks from the terminal with persistence', tech: ['Python', 'Click', 'SQLite'], difficulty: 'Beginner', duration: '3 days', skillsGained: ['Python', 'CLI Design', 'Databases'], aiImplementation: 'Add a natural language parser so users can type "remind me tomorrow" and it auto-sets a due date.' },
        { name: 'REST API with Auth', problem: 'Build a secure CRUD API with JWT auth', tech: ['Node.js', 'Express', 'MongoDB', 'JWT'], difficulty: 'Intermediate', duration: '1 week', skillsGained: ['Backend Dev', 'Auth', 'API Design'], aiImplementation: 'Add anomalous request detection using a simple frequency-based heuristic on login patterns.' },
      ],
    }

    const roleKey = Object.keys(projectTemplates).find((k) => targetRole.toLowerCase().includes(k.toLowerCase().split(' ')[0])) || 'default'
    const projects = projectTemplates[roleKey] || projectTemplates.default

    return res.status(200).json(successResponse({
      targetRole,
      projects: projects.map((p) => ({
        ...p,
        gapsAddressed: gaps.filter((g) => p.tech.some((t) => t.toLowerCase().includes(g.toLowerCase()))),
        resumeValue: 'High — shows practical implementation skills',
        githubValue: 'Add detailed README with setup instructions, screenshots, and live demo link',
      })),
    }, 'Project recommendations generated'))
  } catch (error) { next(error) }
}

// ─── Mock Interview ───────────────────────────────────────────────────────────

// Expanded question bank — multiple questions per slot to ensure variety
const MOCK_QUESTION_BANK = {
  HR: [
    'Tell me about yourself and your career goals.',
    'Why are you interested in this role?',
    'What is your greatest professional strength and how have you applied it?',
    'Where do you see yourself in three years?',
    'Why should we hire you over other candidates?',
    'What motivates you in your work?',
    'How do you handle tight deadlines and pressure?',
    'What is your biggest professional achievement so far?',
  ],
  Behavioral: [
    'Give an example of a time you worked effectively in a team.',
    'Describe a situation where you had to learn something new quickly.',
    'Tell me about a time you failed and what you learned from it.',
    'Describe a conflict with a teammate and how you resolved it.',
    'Give an example of a time you showed leadership.',
    'Tell me about a time you received critical feedback and how you responded.',
    'Describe a situation where you had to prioritize competing tasks.',
    'Give an example of when you went above and beyond what was expected.',
  ],
  Situational: [
    'If you discovered a critical bug in production on a Friday evening, what would you do?',
    'How would you handle a situation where your manager asked for something you believed was technically wrong?',
    'If two teammates had a conflict that was affecting the project, how would you respond?',
    'You are assigned a project but given insufficient resources. What steps would you take?',
    'How would you handle a situation where a client kept changing requirements mid-project?',
    'If you were assigned a task you had never done before with no guidance, how would you approach it?',
  ],
  Technical: {
    'Software Developer': [
      'Explain the difference between a stack and a queue with a real-world use case.',
      'What is the difference between synchronous and asynchronous programming?',
      'Explain RESTful API design principles.',
      'What is the time complexity of binary search and why?',
      'How does garbage collection work in modern languages?',
      'Explain the difference between SQL and NoSQL databases.',
      'What is version control and describe the Git workflow you prefer.',
      'Explain SOLID principles and give a practical example.',
    ],
    'AI/ML Engineer': [
      'Explain the difference between supervised and unsupervised learning with examples.',
      'What is overfitting and how do you prevent it?',
      'Walk me through how you would evaluate a classification model.',
      'What is the difference between a Random Forest and Gradient Boosting?',
      'Explain backpropagation in neural networks.',
      'How would you handle class imbalance in a dataset?',
      'What is cross-validation and why is it important?',
      'Explain the bias-variance trade-off.',
    ],
    'Data Analyst': [
      'Explain the difference between mean, median, and mode — when would you use each?',
      'How do you handle missing data in a dataset?',
      'What is the difference between correlation and causation?',
      'Explain a SQL JOIN with an example.',
      'What are common data visualization best practices?',
      'How would you detect outliers in a dataset?',
      'What is A/B testing and when would you use it?',
      'Explain normalization vs standardization.',
    ],
    'Full Stack Developer': [
      'Explain the difference between SQL and NoSQL databases.',
      'How does the event loop work in Node.js?',
      'How does REST differ from GraphQL?',
      'Explain the virtual DOM in React.',
      'What is middleware in Express.js?',
      'How do you handle authentication in a web application?',
      'Explain database indexing and when to use it.',
      'What is the difference between authentication and authorization?',
    ],
    'Data Scientist': [
      'What is the difference between regression and classification?',
      'Explain feature engineering — give two examples.',
      'How do you choose between different machine learning algorithms?',
      'What is regularization and why is it needed?',
      'Explain the difference between L1 and L2 regularization.',
      'How would you build a recommendation system from scratch?',
      'What is dimensionality reduction and name two techniques.',
      'Explain p-value and statistical significance in plain terms.',
    ],
    'DevOps Engineer': [
      'Explain the difference between Docker and a virtual machine.',
      'What is CI/CD and why is it important?',
      'How does Kubernetes manage containerized applications?',
      'Explain infrastructure as code with an example.',
      'What is the difference between blue-green and canary deployments?',
      'How do you monitor application health in production?',
      'Explain load balancing strategies.',
      'What is a rolling update strategy in deployments?',
    ],
    'Cybersecurity Analyst': [
      'Explain the difference between symmetric and asymmetric encryption.',
      'What is SQL injection and how do you prevent it?',
      'Explain the CIA triad in security.',
      'What is a man-in-the-middle attack?',
      'How does HTTPS protect data in transit?',
      'Explain the difference between a vulnerability and an exploit.',
      'What is penetration testing?',
      'How would you respond to a suspected data breach?',
    ],
    'Backend Developer': [
      'Explain RESTful API best practices.',
      'What are the differences between HTTP status codes 400, 401, 403, and 404?',
      'How do you design a scalable database schema?',
      'Explain caching strategies and when to use them.',
      'What is the N+1 query problem and how do you solve it?',
      'How does JWT authentication work?',
      'Explain database transactions and ACID properties.',
      'How would you rate-limit an API?',
    ],
    default: [
      'What is time complexity and why does it matter?',
      'Explain the difference between a stack and a queue.',
      'What is version control and how does Git work?',
      'Explain Object-Oriented Programming principles.',
      'What is the difference between a process and a thread?',
      'Describe how the internet works at a high level.',
      'What is an API and how do you design one?',
      'Explain the difference between debugging and testing.',
    ],
  },
  ProjectBased: [
    'Describe a project you built that you are most proud of. What challenges did you face?',
    'Walk me through your most complex technical project.',
    'What is the most impactful project on your resume and what was your specific contribution?',
    'Tell me about a time your project did not go as planned and what you did.',
    'How did you decide the tech stack for your last significant project?',
    'Describe a project where you had to learn a new technology mid-way.',
  ],
}

// Shuffle array deterministically with a seed for variety between sessions
const shuffleWithSeed = (arr, seed) => {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Pick N unique questions avoiding already-asked ones
const pickUnique = (pool, count, exclude = []) => {
  const excludeSet = new Set(exclude.map((q) => q.toLowerCase().trim()))
  let available = pool.filter((q) => !excludeSet.has(q.toLowerCase().trim()))
  if (available.length < count) {
    // If we exhausted unique questions, refill from pool
    available = [...available, ...pool.filter((q) => !available.includes(q))]
  }
  return available.slice(0, count)
}

const MOCK_MODEL_ANSWERS = {
  'Explain the difference between a stack and a queue with a real-world use case.':
    'A Stack operates on a Last-In, First-Out (LIFO) principle, where the last element added is the first one removed. A classic use case is the Browser History or Undo/Redo stack in text editors. In contrast, a Queue operates on a First-In, First-Out (FIFO) principle. A real-world example is an asynchronous task queue or print spooler, where tasks are processed in the exact order they arrive.',

  'What is the difference between synchronous and asynchronous programming?':
    'In synchronous programming, operations execute sequentially, blocking subsequent execution until the current task completes. In asynchronous programming, long-running operations (like network I/O or disk reads) are offloaded non-blockingly, allowing the execution thread to process other tasks. When the asynchronous operation finishes, a callback, promise, or async/await resolves the result, providing high throughput for I/O-intensive services.',

  'Explain RESTful API design principles.':
    'REST (Representational State Transfer) is an architectural style relying on stateless communication, client-server separation, uniform resource identifiers (URIs), and standard HTTP methods: GET to retrieve, POST to create, PUT/PATCH to update, and DELETE to remove. It leverages appropriate HTTP status codes (200, 201, 400, 401, 404, 500) and standard media types like JSON.',

  'What is the time complexity of binary search and why?':
    'Binary search has a logarithmic time complexity of O(log n). It operates on sorted arrays by repeatedly dividing the search space in half. At each comparison, half of the remaining elements are eliminated, halving the problem size from n to n/2, n/4, down to 1 in log₂(n) steps.',

  'Explain the difference between supervised and unsupervised learning with examples.':
    'Supervised learning trains models on labeled datasets where every input sample is paired with a corresponding target ground truth (e.g. predicting house prices via Linear Regression or spam detection via Random Forest). Unsupervised learning discovers hidden structures, patterns, or clusters in unlabeled data without predefined targets (e.g. customer segmentation using K-Means or dimensionality reduction with PCA).',

  'What is overfitting and how do you prevent it?':
    'Overfitting occurs when a machine learning model learns the training data and noise too closely, failing to generalize to unseen test data. It is characterized by near-zero training loss but high validation error. We prevent it using regularization (L1/L2), dropout in neural networks, cross-validation, pruning decision trees, data augmentation, and early stopping.',

  'Tell me about yourself and your career goals.':
    'I am a Computer Science graduate with hands-on experience in full-stack web development and applied AI. In my previous projects and internship, I focused on building reliable, user-centered web applications with React, Node.js, and cloud databases. My career goal is to join a progressive engineering organization where I can contribute to scalable systems, collaborate with experienced engineers, and grow into a system architecture owner over the next few years.',

  'Give an example of a time you worked effectively in a team.':
    'Situation: During our university capstone project, our 4-person team had 6 weeks to build an AI collaboration portal. Task: I was responsible for the backend API and database architecture while coordinating with frontend teammates. Action: I established clear API contracts using OpenAPI upfront and ran daily 10-minute standups to clear blockers. Result: We integrated smoothly ahead of schedule, achieved 94% test coverage, and our project was selected as the top departmental submission.',

  'Describe a conflict with a teammate and how you resolved it.':
    'Situation: A teammate and I had contrasting opinions on whether to use MongoDB or PostgreSQL for our student data service. Task: We needed to decide quickly without stalling development. Action: Instead of debating subjectively, I suggested we benchmark both against our key query requirements (document lookups vs relational joins) and wrote a quick benchmark script. Result: The data demonstrated PostgreSQL handled our foreign key constraints with superior integrity. My teammate agreed, and we delivered on time.',
}

export const getMockModelAnswer = (question = '', category = 'Technical') => {
  if (MOCK_MODEL_ANSWERS[question]) {
    return MOCK_MODEL_ANSWERS[question]
  }
  const qLower = (question || '').toLowerCase()
  for (const [k, v] of Object.entries(MOCK_MODEL_ANSWERS)) {
    if (qLower.includes(k.toLowerCase()) || k.toLowerCase().includes(qLower)) {
      return v
    }
  }
  if (qLower.includes('event loop')) {
    return 'The event loop is a single-threaded execution loop powered by libuv that allows Node.js to perform non-blocking asynchronous I/O operations by offloading operations to the kernel or thread pool.'
  }
  if (category === 'Technical') {
    return `State the core definition clearly, discuss the underlying mechanism or algorithm, provide a real-world software engineering trade-off, and cite a practical example from your own projects.`
  }
  if (category === 'Behavioral' || category === 'Situational') {
    return `Use the STAR method: 1) Situation (context & objective), 2) Task (your specific role & challenge), 3) Action (concrete steps, technical choices, communication), 4) Result (quantifiable impact, metrics, and key lessons learned).`
  }
  if (category === 'Project-Based') {
    return `1) Describe the business problem, 2) Explain why you chose your specific architecture and tech stack, 3) Detail your individual contribution, 4) Conclude with performance metrics, scale achieved, and what you would improve next.`
  }
  return `Provide a focused, structured response with authentic examples, clear technical details, and a positive, solution-oriented conclusion.`
}

export const startMockInterview = async (req, res, next) => {
  try {
    const {
      targetRole = 'Software Developer',
      difficulty = 'medium',
      jobDescription = '',
      previousQuestions = [], // questions from prior sessions in client
    } = req.body

    // Fetch previously asked questions across all prior mock interviews for this user
    let dbPriorQuestions = []
    try {
      const priorInterviews = await MockInterview.find({ userId: req.user.userId }).select('questionsAsked').lean()
      dbPriorQuestions = priorInterviews.flatMap((m) => m.questionsAsked || [])
    } catch (_) {
      // Non-blocking fallback
    }

    const allExcluded = [...new Set([...(previousQuestions || []), ...dbPriorQuestions])]

    // Seed for variety — use timestamp bucket + role length
    const seed = Math.floor(Date.now() / 60000) + targetRole.length

    // Find best technical key for role
    const techKeys = Object.keys(MOCK_QUESTION_BANK.Technical).filter((k) => k !== 'default')
    const techKey = techKeys.find((k) =>
      targetRole.toLowerCase().includes(k.toLowerCase().split(' ')[0].toLowerCase())
    ) || 'default'

    // Shuffle each pool for variety
    const hrPool = shuffleWithSeed(MOCK_QUESTION_BANK.HR, seed)
    const behavioralPool = shuffleWithSeed(MOCK_QUESTION_BANK.Behavioral, seed + 1)
    const situationalPool = shuffleWithSeed(MOCK_QUESTION_BANK.Situational, seed + 2)
    const technicalPool = shuffleWithSeed(MOCK_QUESTION_BANK.Technical[techKey], seed + 3)
    const projectPool = shuffleWithSeed(MOCK_QUESTION_BANK.ProjectBased, seed + 4)

    // Difficulty adjusts question composition
    let composition
    if (difficulty === 'easy') {
      composition = [
        { pool: hrPool, count: 2, category: 'HR' },
        { pool: technicalPool, count: 2, category: 'Technical' },
        { pool: behavioralPool, count: 2, category: 'Behavioral' },
        { pool: projectPool, count: 1, category: 'Project-Based' },
      ]
    } else if (difficulty === 'hard') {
      composition = [
        { pool: hrPool, count: 1, category: 'HR' },
        { pool: technicalPool, count: 4, category: 'Technical' },
        { pool: behavioralPool, count: 2, category: 'Behavioral' },
        { pool: situationalPool, count: 2, category: 'Situational' },
        { pool: projectPool, count: 1, category: 'Project-Based' },
      ]
    } else {
      // medium — default
      composition = [
        { pool: hrPool, count: 2, category: 'HR' },
        { pool: technicalPool, count: 3, category: 'Technical' },
        { pool: behavioralPool, count: 2, category: 'Behavioral' },
        { pool: situationalPool, count: 1, category: 'Situational' },
        { pool: projectPool, count: 1, category: 'Project-Based' },
      ]
    }

    const selected = []
    let idCounter = 1
    for (const { pool, count, category } of composition) {
      const picked = pickUnique(pool, count, allExcluded)
      for (const q of picked) {
        selected.push({ id: idCounter++, question: q, category })
      }
    }

    return res.status(200).json(successResponse({
      sessionConfig: { targetRole, difficulty, jobDescription },
      questions: selected,
      instructions: 'Answer each question thoughtfully. Use specific examples from your projects and coursework. After submitting, you will receive scores, delivery analysis, and recommended model answers.',
    }, 'Mock interview session prepared'))
  } catch (error) { next(error) }
}

// Evaluate each answer locally with structured scoring
const evaluateAnswerLocally = (question, answer, category) => {
  const _len = (answer || '').length
  const wordCount = (answer || '').trim().split(/\s+/).filter(Boolean).length

  // Base relevance from length
  let relevanceScore = 0
  if (wordCount >= 80) relevanceScore = 85 + Math.min(15, Math.floor((wordCount - 80) / 10))
  else if (wordCount >= 40) relevanceScore = 60 + Math.round((wordCount - 40) / 40 * 25)
  else if (wordCount >= 15) relevanceScore = 35 + Math.round((wordCount - 15) / 25 * 25)
  else relevanceScore = Math.min(30, wordCount * 2)
  relevanceScore = Math.min(100, relevanceScore)

  // Communication from structure indicators
  const hasStructure = /first|second|then|finally|situation|task|action|result|because|therefore|in conclusion|overall/i.test(answer || '')
  const hasExamples = /for example|for instance|such as|in my project|when i|i built|i used/i.test(answer || '')
  const hasConcrete = /\b(\d+|percent|%|users|requests|ms|seconds|minutes|hours|days|x|fold)\b/i.test(answer || '')

  let commScore = 40
  if (hasStructure) commScore += 25
  if (hasExamples) commScore += 20
  if (hasConcrete) commScore += 15
  commScore = Math.min(100, commScore)

  // Technical / category relevance
  let categoryScore = 50
  if (category === 'Technical') {
    const techWords = /code|function|algorithm|database|api|class|object|method|server|client|query|index|cache|async|sync|thread|process|memory|cpu|network|protocol|git|branch|commit|merge/i
    const matches = (answer || '').match(techWords) || []
    categoryScore = Math.min(100, 50 + matches.length * 10)
  } else if (category === 'Behavioral' || category === 'Situational') {
    categoryScore = hasStructure && hasExamples ? 85 : hasStructure || hasExamples ? 70 : 50
  } else if (category === 'Project-Based') {
    categoryScore = hasConcrete && hasExamples ? 90 : hasExamples ? 75 : 55
  } else {
    // HR
    categoryScore = wordCount >= 50 ? 85 : wordCount >= 25 ? 70 : 50
  }

  const overallScore = Math.round(relevanceScore * 0.40 + commScore * 0.35 + categoryScore * 0.25)

  let feedback = ''
  let improvement = ''
  let recommendedAnswer = getMockModelAnswer(question, category)

  if (!answer?.trim()) {
    feedback = 'No answer was provided for this question.'
    improvement = 'Practice answering this question before your real interview.'
  } else if (wordCount < 15) {
    feedback = 'Your answer was very brief. Interviewers expect more depth and technical context.'
    improvement = 'Expand your answer with a specific project example or technical detail. Aim for at least 50-70 words.'
  } else if (wordCount < 40) {
    feedback = 'Your answer covers the basics but lacks depth. You have a solid foundation — build on it.'
    improvement = hasExamples
      ? 'Good use of examples. Add more technical specifics or quantify your impact.'
      : 'Add a concrete example from your own projects or coursework to make your answer memorable.'
  } else {
    feedback = wordCount >= 80
      ? 'Strong, detailed answer! You clearly communicated your experience, approach, and impact.'
      : 'Good answer with reasonable depth. Adding quantifiable outcomes will strengthen it further.'
    improvement = hasStructure
      ? (hasConcrete ? 'Excellent structure and specifics. Keep conclusions punchy and focused.' : 'Good structure. Add a quantifiable outcome (e.g. improved speed by 25%) to make it more impactful.')
      : 'Try using the STAR format (Situation → Task → Action → Result) for maximum clarity.'
  }

  return { relevanceScore, communicationScore: commScore, categoryScore, overallScore, feedback, improvement, recommendedAnswer }
}

export const evaluateMockInterview = async (req, res, next) => {
  try {
    const { answers = [], targetRole = '' } = req.body
    if (!answers.length) return res.status(400).json({ success: false, message: 'answers array is required' })

    // Per-question evaluation
    const questionEvaluations = answers.map((a) => ({
      questionId: a.questionId,
      question: a.question,
      category: a.category,
      yourAnswer: a.answer || '',
      ...evaluateAnswerLocally(a.question, a.answer, a.category),
    }))

    // Aggregate scores
    const answered = questionEvaluations.filter((q) => q.yourAnswer.trim())
    const avgScore = (arr, key) =>
      arr.length ? Math.round(arr.reduce((s, q) => s + (q[key] || 0), 0) / arr.length) : 0

    const overallScore = avgScore(questionEvaluations, 'overallScore')
    const technicalScore = avgScore(questionEvaluations.filter((q) => q.category === 'Technical'), 'categoryScore')
    const communicationScore = avgScore(questionEvaluations, 'communicationScore')
    const relevanceScore = avgScore(questionEvaluations, 'relevanceScore')

    // Derive strengths and weaknesses
    const strengths = []
    const weaknesses = []

    if (answered.length === answers.length) strengths.push('You answered all questions — strong commitment to practice.')
    if (overallScore >= 75) strengths.push('Strong overall performance across the interview.')
    if (communicationScore >= 70) strengths.push('Clear and well-structured communication in your answers.')
    if (technicalScore >= 70) strengths.push(`Good technical understanding relevant to the ${targetRole} role.`)
    const hasExamplesCount = questionEvaluations.filter((q) => /for example|for instance|once i|time i|project i/i.test(q.yourAnswer)).length
    if (hasExamplesCount >= 2) strengths.push('You effectively used real examples to support your answers.')

    if (overallScore < 60) weaknesses.push('Overall answer depth needs improvement. Aim for 60+ words per answer.')
    if (technicalScore < 60) weaknesses.push('Technical answers need more depth — mention specific tools, patterns, or trade-offs.')
    if (communicationScore < 60) weaknesses.push('Use the STAR method (Situation, Task, Action, Result) for clearer communication.')
    const shortAnswers = questionEvaluations.filter((q) => q.yourAnswer.trim() && q.yourAnswer.split(/\s+/).length < 30).length
    if (shortAnswers > 1) weaknesses.push(`${shortAnswers} answers were too brief. Elaborate with examples and outcomes.`)
    if (hasExamplesCount < 2) weaknesses.push('Include more concrete examples from your own experience or projects.')

    if (!strengths.length) strengths.push('You completed the practice session — that is the first step to improvement.')
    if (!weaknesses.length) weaknesses.push('Continue practicing to maintain and improve your performance.')

    // Category breakdown
    const categoryScores = {}
    const categories = [...new Set(questionEvaluations.map((q) => q.category))]
    for (const cat of categories) {
      const catQs = questionEvaluations.filter((q) => q.category === cat)
      categoryScores[cat] = avgScore(catQs, 'overallScore')
    }

    // Persist MockInterview to DB so questionsAsked are tracked
    try {
      await MockInterview.create({
        userId: req.user.userId,
        targetRole: targetRole || 'Software Developer',
        difficulty: 'medium',
        questionsAsked: answers.map((a) => a.question),
        answers: questionEvaluations,
        scores: {
          overall: overallScore,
          technical: technicalScore || overallScore,
          communication: communicationScore,
          relevance: relevanceScore,
        },
        strengths,
        weaknesses,
        performanceSummary: overallScore >= 80 ? 'Excellent performance' : 'Good performance',
        status: 'completed',
      })
    } catch (_dbErr) {
      // Non-blocking save
    }

    return res.status(200).json(successResponse({
      overallScore,
      technicalScore: technicalScore || overallScore,
      communicationScore,
      relevanceScore,
      categoryScores,
      strengths,
      weaknesses,
      communication: communicationScore >= 75
        ? 'Your communication style is clear and well-structured. Continue using specific examples.'
        : communicationScore >= 55
          ? 'Your communication is adequate. Focus on structuring answers with clear beginning, middle, and end.'
          : 'Work on structuring your answers more clearly. Use STAR format for behavioral questions and step-by-step for technical ones.',
      questionEvaluations,
      disclaimer: 'This is an AI-generated practice evaluation based on answer length, structure, and content patterns. Real interviews may differ.',
      performanceSummary: overallScore >= 80
        ? 'Excellent performance! You are interview-ready. Focus on polishing a few specific areas.'
        : overallScore >= 65
          ? 'Good performance with clear room for improvement. Review the question-by-question feedback below.'
          : 'You have a solid foundation. Practice more regularly to build confidence and depth in your answers.',
    }, 'Mock interview evaluated'))
  } catch (error) { next(error) }
}

export const checkMockAnswer = async (req, res, next) => {
  try {
    const { question, answer = '', category = 'Technical', enteredViaMic = false, speechMetrics = {} } = req.body
    if (!question) {
      return res.status(400).json({ success: false, message: 'question is required' })
    }

    const validation = validateAnswerInput(answer, category.toLowerCase())
    if (!validation.isValid) {
      return res.status(200).json(successResponse({
        isValid: false,
        reason: validation.reason,
      }, 'Validation check'))
    }

    let speechAnalysis = null
    if (enteredViaMic || speechMetrics?.isMicInput) {
      speechAnalysis = analyzeSpeechAndGrammar(answer, speechMetrics)
    }

    const evaluation = {
      ...evaluateAnswerLocally(question, answer, category),
      speechAnalysis,
    }

    return res.status(200).json(successResponse({
      isValid: true,
      evaluation,
    }, 'Answer evaluated'))
  } catch (error) { next(error) }
}

// ─── Career Dashboard ─────────────────────────────────────────────────────────

export const getCareerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const bundle = await buildProfileBundle(userId)
    const scores = bundle.careerProfile.scores?.analyzedAt ? bundle.careerProfile.scores : computeReadinessScores(bundle)

    const allSkills = [
      ...(bundle.user.skills || []),
      ...(Object.values(bundle.careerProfile.skillsByCategory || {}).flat()),
    ]

    // Generate next-best-action from gaps
    let nextBestAction = bundle.careerProfile.nextBestAction
    if (!nextBestAction) {
      if (!bundle.portfolio?.github && !bundle.careerProfile?.github) {
        nextBestAction = 'Add your GitHub profile URL to increase your developer credibility score by up to 10 points.'
      } else if (allSkills.length < 5) {
        nextBestAction = 'Add at least 5 technical skills to your profile to unlock internship matching.'
      } else if (!(bundle.careerProfile.projects?.length || bundle.portfolio?.projects?.length)) {
        nextBestAction = 'Add at least one project with technologies and impact to significantly improve your readiness score.'
      } else {
        nextBestAction = 'Complete the AI Career Interview to get your full personalized roadmap and ATS resume.'
      }
    }

    return res.status(200).json(successResponse({
      scores,
      nextBestAction,
      interviewCompleted: !!bundle.careerProfile.interviewCompletedAt,
      profileCompleteness: {
        skills: allSkills.length > 0,
        projects: !!(bundle.careerProfile.projects?.length || bundle.portfolio?.projects?.length),
        github: !!(bundle.portfolio?.github || bundle.careerProfile?.github),
        linkedin: !!(bundle.portfolio?.linkedin || bundle.careerProfile?.linkedin),
        experience: !!bundle.careerProfile.experience?.length,
        certifications: !!(bundle.careerProfile.certifications?.length || bundle.portfolio?.certifications?.length),
      },
      disclaimer: 'All scores are AI-generated readiness indicators, not scientifically validated metrics.',
    }, 'Career dashboard loaded'))
  } catch (error) { next(error) }
}

// ─── GitHub Career & Project Intelligence ───────────────────────────────────

export const analyzeGitHub = async (req, res, next) => {
  try {
    const {
      githubUsername,
      githubUrl,
      targetRole,
      syncFromAicp = true,
    } = req.body

    const bundle = await buildProfileBundle(req.user.userId)

    const rawInput = (githubUrl || githubUsername || '').trim() ||
      (syncFromAicp ? (bundle.portfolio?.github || bundle.careerProfile?.github || '') : '')

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: 'GitHub profile URL or username is required.',
      })
    }

    // Validate URL / username syntax and ensure non-GitHub domains are rejected
    const urlValidation = validateGitHubUrl(rawInput)
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: urlValidation.error,
      })
    }

    const username = urlValidation.username

    // Resolve Target Career Role
    const effectiveRole = (targetRole || '').trim() ||
      bundle.careerProfile?.targetRoles?.[0] ||
      ''

    // Semantic Role Validation: reject arbitrary nonsense without hardcoded blacklist
    if (effectiveRole) {
      const roleValidation = validateRole(effectiveRole)
      if (!roleValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: `"${effectiveRole}" is not recognized as a standard engineering or tech career role.`,
          suggestions: roleValidation.suggestions || [],
        })
      }
    }

    // Fetch public profile and repositories from GitHub API
    const ghData = await fetchGitHubProfileAndRepos(username)

    if (!ghData.profile && ghData.error && ghData.error.toLowerCase().includes('not found')) {
      return res.status(404).json({
        success: false,
        message: `GitHub user "${username}" was not found. Please verify your username.`,
      })
    }

    // Synthesize AICP Profile Bundle
    const aicpProfileBundle = {
      skills: [
        ...(bundle.user?.skills || []),
        ...(Object.values(bundle.careerProfile?.skillsByCategory || {}).flat()),
      ],
      projects: bundle.careerProfile?.projects || bundle.portfolio?.projects || [],
      education: bundle.profile
        ? [bundle.profile.degree, bundle.profile.department, bundle.profile.college].filter(Boolean).join(' - ')
        : '',
      experience: bundle.careerProfile?.experience || [],
      targetRole: effectiveRole,
    }

    // Generate local deterministic audit & personalized blueprints
    const fallbackAudit = auditGitHubProfile(
      ghData.profile || { login: username },
      ghData.repos || [],
      aicpProfileBundle,
      effectiveRole
    )

    // Call Python FastAPI AI Service with local fallback
    const aiPayload = {
      username,
      targetRole: effectiveRole,
      profileData: ghData.profile || {},
      reposData: ghData.repos || [],
      aicpProfile: aicpProfileBundle,
    }

    const { data: aiResult, fallback: usedFallback } = await callAI(
      '/career-agent/analyze-github',
      aiPayload,
      fallbackAudit
    )

    // Merge intelligence, preserving blueprints and roadmaps
    const finalResult = {
      ...fallbackAudit,
      ...(aiResult || {}),
      isAiGenerated: !usedFallback,
      engine: usedFallback ? 'local-deterministic-engine' : 'fastapi-ai-service',
      rateLimited: ghData.isRateLimited || false,
    }

    // Cache overall score and analysis in CareerProfile
    const updatePayload = {
      github: `https://github.com/${username}`,
      'scores.github': finalResult.overallScore,
      githubAnalysis: {
        score: finalResult.overallScore,
        scoreBreakdown: finalResult.scoreBreakdown,
        profileOverview: finalResult.profileOverview,
        topLanguages: finalResult.languagesUsed?.slice(0, 5) || [],
        repoCount: finalResult.profileOverview?.publicRepos || (ghData.repos || []).length,
        targetRole: effectiveRole,
        analyzedAt: new Date(),
      },
    }

    await CareerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updatePayload },
      { upsert: true, new: true }
    )

    return res.status(200).json(
      successResponse(finalResult, 'GitHub career intelligence analysis completed successfully')
    )
  } catch (error) {
    next(error)
  }
}

// ─── User-Confirmed GitHub Repository Creator ───────────────────────────────

export const createGitHubRepo = async (req, res, next) => {
  try {
    const { token, repoName, description, isPrivate, projectData } = req.body

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A GitHub Personal Access Token (with "repo" scope) is required for repository creation.',
      })
    }

    const result = await createGitHubRepository(
      token,
      { repoName, description, isPrivate },
      projectData || {}
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Failed to create GitHub repository.',
      })
    }

    return res.status(201).json(
      successResponse(result, 'GitHub repository created successfully')
    )
  } catch (error) {
    next(error)
  }
}

// ─── LinkedIn Profile Auditor ───────────────────────────────────────────────

export const analyzeLinkedIn = async (req, res, next) => {
  try {
    const {
      headline,
      about,
      skills,
      experience,
      education,
      projects,
      certifications,
      featured,
      targetRole,
      profileUrl,
      isStudent = true,
      syncFromAicp: _syncFromAicp = false,
    } = req.body

    const bundle = await buildProfileBundle(req.user.userId)

    // If syncFromAicp or fields not provided, enrich from AICP profile bundle
    const effectiveHeadline = headline !== undefined && headline !== ''
      ? headline
      : (bundle.careerProfile?.targetRoles?.[0] ? `${bundle.careerProfile.targetRoles[0]} Enthusiast` : '')

    const effectiveAbout = about !== undefined && about !== ''
      ? about
      : (bundle.portfolio?.bio || '')

    let effectiveSkills = skills
    if (!effectiveSkills || (Array.isArray(effectiveSkills) && effectiveSkills.length === 0) || (typeof effectiveSkills === 'string' && !effectiveSkills.trim())) {
      const skillsFromBundle = [
        ...(bundle.user?.skills || []),
        ...(Object.values(bundle.careerProfile?.skillsByCategory || {}).flat()),
      ]
      effectiveSkills = [...new Set(skillsFromBundle)]
    }

    let effectiveExperience = experience
    if (!effectiveExperience || (Array.isArray(effectiveExperience) && effectiveExperience.length === 0)) {
      effectiveExperience = bundle.careerProfile?.experience || []
    }

    let effectiveProjects = projects
    if (!effectiveProjects || (Array.isArray(effectiveProjects) && effectiveProjects.length === 0)) {
      effectiveProjects = bundle.careerProfile?.projects || bundle.portfolio?.projects || []
    }

    let effectiveEducation = education
    if (!effectiveEducation) {
      const sp = bundle.profile
      if (sp) {
        effectiveEducation = [
          sp.degree,
          sp.department || sp.field,
          sp.college || sp.institution,
          sp.graduationYear ? `Class of ${sp.graduationYear}` : '',
        ].filter(Boolean).join(' - ')
      }
    }

    let effectiveCertifications = certifications
    if (!effectiveCertifications || (Array.isArray(effectiveCertifications) && effectiveCertifications.length === 0)) {
      effectiveCertifications = bundle.careerProfile?.certifications || bundle.portfolio?.certifications || []
    }

    const effectiveRole = targetRole || bundle.careerProfile?.targetRoles?.[0] || ''
    const effectiveUrl = profileUrl || bundle.portfolio?.linkedin || bundle.careerProfile?.linkedin || ''

    const profileInput = {
      headline: effectiveHeadline,
      about: effectiveAbout,
      skills: effectiveSkills,
      experience: effectiveExperience,
      education: effectiveEducation,
      projects: effectiveProjects,
      certifications: effectiveCertifications,
      featured: featured || '',
      targetRole: effectiveRole,
      profileUrl: effectiveUrl,
      isStudent: Boolean(isStudent),
    }

    // Deterministic local audit engine
    const fallbackAudit = auditLinkedInProfile(profileInput)

    // Call FastAPI AI Service with local fallback
    const { data: aiResult, fallback: usedFallback } = await callAI(
      '/career-agent/analyze-linkedin',
      profileInput,
      fallbackAudit
    )

    const finalResult = {
      ...aiResult,
      isAiGenerated: !usedFallback,
      engine: usedFallback ? 'local-deterministic-engine' : 'fastapi-ai-service',
    }

    // Cache score and analysis in CareerProfile
    const updatePayload = {
      'scores.linkedin': finalResult.overallScore,
      linkedinAnalysis: {
        score: finalResult.overallScore,
        profileCompleteness: finalResult.profileCompleteness,
        analyzedAt: new Date(),
        targetRole: effectiveRole,
      },
    }
    if (effectiveUrl) {
      updatePayload.linkedin = effectiveUrl
    }

    await CareerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updatePayload },
      { upsert: true, new: true }
    )

    return res.status(200).json(successResponse(finalResult, 'LinkedIn profile audited successfully'))
  } catch (error) {
    next(error)
  }
}

