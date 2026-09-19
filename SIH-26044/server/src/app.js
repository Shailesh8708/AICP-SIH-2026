// server/src/app.js
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import config from './config/env.js'
import { apiLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import { successResponse } from './utils/response.js'
import authRoutes from './routes/authRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import skillRoutes from './routes/skillRoutes.js'
import assessmentRoutes from './routes/assessmentRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import opportunityRoutes from './routes/opportunityRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import learningRoutes from './routes/learningRoutes.js'
import portfolioRoutes from './routes/portfolioRoutes.js'
import collaborationRoutes from './routes/collaborationRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import internshipRoutes from './routes/internshipRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import careerAgentRoutes from './routes/careerAgentRoutes.js'
import dailyQuizRoutes from './routes/dailyQuizRoutes.js'
import { renderBackendGateway } from './views/backendGatewayView.js'

const app = express()

// ============= SECURITY MIDDLEWARE =============

// Helmet for security headers (allow gateway visual dashboard styling)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
)

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  })
)

// ============= PARSING MIDDLEWARE =============

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ============= LOGGING MIDDLEWARE =============

app.use((req, res, next) => {
  console.log(`🔹 ${req.method} ${req.path}`)
  next()
})

// ============= RATE LIMITING =============

app.use('/api/', apiLimiter)

// ============= HEALTH CHECK =============

app.get('/health', (req, res) => {
  res.json(
    successResponse(
      {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
      },
      'Server is running'
    )
  )
})

app.get('/api/health', (req, res) => {
  res.json(
    successResponse(
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date(),
      },
      'API is running'
    )
  )
})

// ============= BACKEND GATEWAY & API EXPLORER =============

const handleGatewayRoute = (req, res) => {
  const acceptsHtml = req.accepts(['html', 'json']) === 'html'
  const forceJson = req.query.format === 'json' || req.query.json === 'true'

  if (acceptsHtml && !forceJson) {
    const port = config.serverPort || process.env.PORT || 5000
    res.setHeader('Content-Type', 'text/html')
    return res.send(
      renderBackendGateway(req, {
        port,
        env: config.nodeEnv || 'development',
        uptime: process.uptime(),
      })
    )
  }

  return res.json(
    successResponse(
      {
        service: 'AICP Backend Gateway',
        status: 'online',
        port: config.serverPort || process.env.PORT || 5000,
        env: config.nodeEnv || 'development',
        uptime: process.uptime(),
        timestamp: new Date(),
        frontendUrl: config.corsOrigin || 'http://localhost:5173',
        endpoints: {
          health: '/health',
          apiHealth: '/api/health',
          auth: '/api/auth',
          skills: '/api/skills',
          opportunities: '/api/opportunities',
          opportunityRadar: '/api/opportunities/radar/stats',
          dailyQuiz: '/api/daily-quiz',
          career: '/api/career',
          assessments: '/api/assessments',
        },
      },
      'AICP Backend Gateway is operational'
    )
  )
}

app.get('/', handleGatewayRoute)
app.get('/api', handleGatewayRoute)
app.get('/api/', handleGatewayRoute)

// ============= API ROUTES =============

app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/opportunities', opportunityRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/learning', learningRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/collaborations', collaborationRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/internships', internshipRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/career', careerAgentRoutes)
app.use('/api/daily-quiz', dailyQuizRoutes)

// ============= 404 HANDLER =============

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.path} not found`,
  })
})

// ============= ERROR HANDLER =============

app.use(errorHandler)

export default app
