import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/request-otp') ||
      url.includes('/auth/verify-otp') ||
      url.includes('/auth/password-reset')
    const isNonCriticalWidget =
      url.includes('/daily-quiz') ||
      url.includes('/notifications')

    // Only redirect to /login on 401 if it was a protected session route with an expired token,
    // NOT when the user is actively trying to log in or register, and NOT on optional widget calls!
    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      !isNonCriticalWidget &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }

    const resData = error.response?.data
    const message =
      resData?.message ||
      resData?.error ||
      (typeof resData === 'string' ? resData : null) ||
      error.message ||
      'An unexpected error occurred. Please try again.'

    return Promise.reject({
      ...(typeof resData === 'object' ? resData : {}),
      message,
      status: error.response?.status,
    })
  }
)

// Auth endpoints
export const authAPI = {
  loginWithPassword: (data) => api.post('/auth/login/password', data),
  login: (data) => api.post('/auth/login', data),
  requestLoginOTP: (email) => api.post('/auth/login/request-otp', { email }),
  register: (data) => api.post('/auth/register/request-otp', data),
  verifyOTP: (email, otp) => api.post('/auth/login/verify-otp', { email, otp }),
  verifyRegistrationOTP: (email, otp) =>
    api.post('/auth/register/verify-otp', { email, otp, purpose: 'registration' }),
  refreshToken: (refreshToken) =>
    api.post('/auth/refresh-token', { refreshToken }),
  logout: () => api.post('/auth/logout'),
}

// Profile endpoints
export const profileAPI = {
  getProfile: () => api.get('/profiles/me'),
  updateProfile: (data) => api.put('/profiles/me', data),
  getStudentProfile: () => api.get('/profiles/student'),
  updateStudentProfile: (data) => api.put('/profiles/student', data),
  getIndustryProfile: () => api.get('/profiles/industry'),
  updateIndustryProfile: (data) => api.put('/profiles/industry', data),
  getAcademicianProfile: () => api.get('/profiles/academician'),
  updateAcademicianProfile: (data) => api.put('/profiles/academician', data),
  getInstitutionProfile: () => api.get('/profiles/institution'),
  updateInstitutionProfile: (data) => api.put('/profiles/institution', data),
}

// Skills endpoints
export const skillsAPI = {
  getSkills: (params) => api.get('/skills', { params }),
  getSkill: (id) => api.get(`/skills/${id}`),
  searchSkills: (query) => api.get('/skills/search', { params: { q: query } }),
  getMySkillEvidence: () => api.get('/skills/evidence/me'),
}

// Opportunities & AI Opportunity Radar endpoints
export const opportunitiesAPI = {
  getOpportunities: (params) => api.get('/opportunities', { params }),
  getOpportunity: (id) => api.get(`/opportunities/${id}`),
  getRecommendedOpportunities: () => api.get('/opportunities/recommended'),
  createOpportunity: (data) => api.post('/opportunities', data),
  updateOpportunity: (id, data) => api.put(`/opportunities/${id}`, data),
  publishOpportunity: (id) => api.post(`/opportunities/${id}/publish`),
  closeOpportunity: (id) => api.post(`/opportunities/${id}/close`),
  deleteOpportunity: (id) => api.delete(`/opportunities/${id}`),
  rankCandidates: (id) => api.get(`/opportunities/${id}/candidates`),
  applyToOpportunity: (id, data = {}) => api.post('/applications', { opportunityId: id, ...data }),
  // AI Opportunity Radar Intelligence Methods
  getRadarStats: () => api.get('/opportunities/radar/stats'),
  getFilters: () => api.get('/opportunities/radar/filters'),
  getTrends: () => api.get('/opportunities/radar/trends'),
  getSources: (params) => api.get('/opportunities/radar/sources', { params }),
  toggleSource: (id, enabled) => api.post(`/opportunities/radar/sources/${id}/toggle`, { enabled }),
  syncSource: (id) => api.post(`/opportunities/radar/sources/${id}/sync`),
  triggerSync: () => api.post('/opportunities/radar/sync'),
}

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getStats: () => api.get('/analytics/stats'),
  getStudent: () => api.get('/analytics/student'),
  getIndustry: () => api.get('/analytics/industry'),
  getSkills: () => api.get('/analytics/skills'),
  getPlacements: () => api.get('/analytics/placements'),
  getInstitution: () => api.get('/analytics/institution'),
}

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
}

export const internshipAPI = {
  getInternships: (params) => api.get('/internships', { params }),
  getInternship: (id) => api.get(`/internships/${id}`),
  createInternship: (data) => api.post('/internships', data),
  updateInternship: (id, data) => api.put(`/internships/${id}`, data),
}

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
}

export const assessmentAPI = {
  getAssessments: (params) => api.get('/assessments', { params }),
  getAssessment: (id) => api.get(`/assessments/${id}`),
  createAssessment: (data) => api.post('/assessments', data),
  importAssessment: (data) => api.post('/assessments/import', data, { headers: { 'Content-Type': undefined } }),
  startAssessment: (id) => api.post(`/assessments/${id}/start`),
  submitAnswer: (id, data) => api.post(`/assessments/${id}/attempt`, data),
  completeAssessment: (attemptId) => api.post(`/assessments/attempts/${attemptId}/submit`),
}

export const documentAPI = {
  getDocuments: (params) => api.get('/documents', { params }),
  upload: (file, documentType = 'resume') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', documentType)
    return api.post('/documents/upload', formData, { headers: { 'Content-Type': undefined } })
  },
  applicationResumeUrl: (applicationId) => `${API_BASE_URL}/documents/application/${applicationId}/resume`,
  downloadApplicationResume: (applicationId) => api.get(`/documents/application/${applicationId}/resume`, { responseType: 'blob' }),
}

export const resumeAPI = {
  list: () => api.get('/resumes'),
  get: (id) => api.get(`/resumes/${id}`),
  create: (data) => api.post('/resumes', data),
  createFromProfile: (data = {}) => api.post('/resumes/from-profile', data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  remove: (id) => api.delete(`/resumes/${id}`),
  duplicate: (id, data = {}) => api.post(`/resumes/${id}/duplicate`, data),
  analyze: (id, opportunityId) => api.post(`/resumes/${id}/analyze`, opportunityId ? { opportunityId } : {}),
  upload: (file, title = '') => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    return api.post('/resumes/upload', formData, { headers: { 'Content-Type': undefined } })
  },
}

export const collaborationAPI = {
  getCollaborations: () => api.get('/collaborations'),
  createCollaboration: (data) => api.post('/collaborations', data),
  updateStatus: (id, status) => api.put(`/collaborations/${id}/status`, { status }),
}

export const portfolioAPI = {
  getPortfolio: () => api.get('/portfolio/me'),
  updatePortfolio: (data) => api.put('/portfolio/me', data),
  addProject: (data) => api.post('/portfolio/projects', data),
  updateProject: (id, data) => api.put(`/portfolio/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/portfolio/projects/${id}`),
  addCertification: (data) => api.post('/portfolio/certifications', data),
  addAchievement: (data) => api.post('/portfolio/achievements', data),
}

export const learningAPI = {
  getPrograms: (params) => api.get('/learning', { params }),
  getProgram: (id) => api.get(`/learning/${id}`),
  createProgram: (data) => api.post('/learning', data),
  enrollInProgram: (id) => api.post(`/learning/${id}/enroll`),
  getEnrolledPrograms: () => api.get('/learning/enrolled'),
}

export const applicationAPI = {
  getApplications: (params) => api.get('/applications', { params }),
  createApplication: (data) => api.post('/applications', data),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  shortlist: (id, data) => api.post(`/applications/${id}/shortlist`, data),
  reject: (id, data) => api.post(`/applications/${id}/reject`, data),
  scheduleInterview: (id, data) => api.post(`/applications/${id}/interview`, data),
}

// AI endpoints
export const aiAPI = {
  predictMatch: (data) => api.post('/ai/predict', data),
  matchOpportunity: (profile, opportunity) => api.post('/ai/match', { profile, opportunity }),
  extractSkills: (text) => api.post('/ai/extract-skills', { text }),
  normalizeSkills: (skills) => api.post('/ai/normalize-skills', { skills }),
  recommendCareer: (data) => api.post('/ai/career-recommendation', data),
  getLearningRecommendation: (data) => api.post('/ai/learning-recommendation', data),
  classifySkills: (text) => api.post('/ai/classify-skills', { text }),
  getSimilarSkills: (skillId) => api.get(`/ai/similar-skills/${skillId}`),
  getSkillGap: (studentId, targetRole) =>
    api.post('/ai/skill-gap', { studentId, targetRole }),
  getRecommendations: () => api.get('/ai/recommendations'),
  resumeOperation: (data) => api.post('/ai/resume/operation', data),
}

export default api
