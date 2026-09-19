// client/src/services/careerAgentAPI.js
// Career Agent API client — uses the same axios instance as the rest of the app.
import api from './api'

export const careerAgentAPI = {
  // Career Profile
  getProfile: () => api.get('/career/profile'),
  saveProfile: (data) => api.put('/career/profile', data),

  // AI Interview
  startInterview: () => api.post('/career/interview/start'),
  sendMessage: (sessionId, message, enteredViaMic = false, speechMetrics = null) =>
    api.post('/career/interview/message', { sessionId, message, enteredViaMic, speechMetrics }),
  getSession: () => api.get('/career/interview/session'),
  exitInterview: () => api.post('/career/interview/exit'),

  // Analysis & Generation
  analyzeProfile: (targetRole = '') => api.post('/career/analyze', { targetRole }),
  getCareerRecommendations: (targetRole = '') => api.post('/career/career-recommendations', { targetRole }),
  analyzeJobDescription: (jobDescription) => api.post('/career/job-match', { jobDescription }),
  matchInternships: () => api.get('/career/internship-match'),
  analyzeSkillGap: (targetRole = '') => api.post('/career/skill-gap', { targetRole }),

  // Generation
  generateATSResume: (targetRoleOrPayload = '', template = 'shailesh-format') => {
    const payload = typeof targetRoleOrPayload === 'object' && targetRoleOrPayload !== null
      ? targetRoleOrPayload
      : { targetRole: targetRoleOrPayload, template }
    return api.post('/career/resume/generate', payload)
  },
  generateRoadmap: (targetRole = '') => api.post('/career/roadmap', { targetRole }),
  recommendProjects: (targetRole = '') => api.post('/career/projects', { targetRole }),

  // Mock Interview
  startMockInterview: (data) => api.post('/career/mock-interview/start', data),
  checkMockAnswer: (data) => api.post('/career/mock-interview/check-answer', data),
  evaluateMockInterview: (answers, targetRole = '') => api.post('/career/mock-interview/evaluate', { answers, targetRole }),

  // Dashboard
  getDashboard: () => api.get('/career/dashboard'),

  // GitHub
  analyzeGitHub: (payload) => {
    const data = typeof payload === 'string' ? { githubUsername: payload } : payload
    return api.post('/career/github/analyze', data)
  },
  createGitHubRepo: (data) => api.post('/career/github/create-repo', data),

  // LinkedIn
  analyzeLinkedIn: (data) => api.post('/career/linkedin/analyze', data),
}

export default careerAgentAPI
