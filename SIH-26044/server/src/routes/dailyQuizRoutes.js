import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import {
  getTodayQuizStatus,
  submitDailyQuiz,
  getBadgeShowcase,
} from '../controllers/dailyQuizController.js'

const router = express.Router()

// Authenticated daily quiz routes
router.get('/today', verifyToken, getTodayQuizStatus)
router.post('/submit', verifyToken, submitDailyQuiz)
router.get('/badges', verifyToken, getBadgeShowcase)

export default router

