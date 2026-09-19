// server/src/routes/careerAgentRoutes.js
import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { verifyToken } from '../middleware/auth.js'
import { careerAgentLimiter } from '../middleware/rateLimiter.js'
import {
  getCareerProfile,
  saveCareerProfile,
  startInterview,
  sendInterviewMessage,
  getInterviewSession,
  exitInterview,
  analyzeProfile,
  getCareerRecommendations,
  generateATSResume,
  analyzeJobDescription,
  matchInternships,
  analyzeSkillGap,
  generateRoadmap,
  recommendProjects,
  startMockInterview,
  evaluateMockInterview,
  checkMockAnswer,
  getCareerDashboard,
  analyzeGitHub,
  createGitHubRepo,
  analyzeLinkedIn,
} from '../controllers/careerAgentController.js'

const router = express.Router()

// All routes require authentication + career-agent rate limit
router.use(verifyToken)
router.use(careerAgentLimiter)

// Career Profile
router.get('/profile', asyncHandler(getCareerProfile))
router.put('/profile', asyncHandler(saveCareerProfile))

// AI Interview
router.post('/interview/start', asyncHandler(startInterview))
router.post('/interview/message', asyncHandler(sendInterviewMessage))
router.get('/interview/session', asyncHandler(getInterviewSession))
router.post('/interview/exit', asyncHandler(exitInterview))

// Analysis
router.post('/analyze', asyncHandler(analyzeProfile))
router.post('/career-recommendations', asyncHandler(getCareerRecommendations))
router.post('/job-match', asyncHandler(analyzeJobDescription))
router.get('/internship-match', asyncHandler(matchInternships))
router.post('/skill-gap', asyncHandler(analyzeSkillGap))

// Generation
router.post('/resume/generate', asyncHandler(generateATSResume))
router.post('/roadmap', asyncHandler(generateRoadmap))
router.post('/projects', asyncHandler(recommendProjects))

// Mock Interview
router.post('/mock-interview/start', asyncHandler(startMockInterview))
router.post('/mock-interview/evaluate', asyncHandler(evaluateMockInterview))
router.post('/mock-interview/check-answer', asyncHandler(checkMockAnswer))

// Dashboard
router.get('/dashboard', asyncHandler(getCareerDashboard))

// GitHub
router.post('/github/analyze', asyncHandler(analyzeGitHub))
router.post('/github/create-repo', asyncHandler(createGitHubRepo))

// LinkedIn
router.post('/linkedin/analyze', asyncHandler(analyzeLinkedIn))

export default router
