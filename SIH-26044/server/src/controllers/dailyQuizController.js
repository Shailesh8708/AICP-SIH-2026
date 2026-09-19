import DailyQuizStreak from '../models/DailyQuizStreak.js'
import { DAILY_QUIZ_QUESTIONS, BADGE_TIERS } from '../data/dailyQuizQuestions.js'
import { successResponse, errorResponse } from '../utils/response.js'

/**
 * Format Date as YYYY-MM-DD
 */
export function getTodayDateStr(dateInput = new Date()) {
  const d = new Date(dateInput)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getYesterdayDateStr(todayStr) {
  const [y, m, d] = todayStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

/**
 * Get seconds remaining until midnight (local or UTC reset)
 */
export function getSecondsUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
}

/**
 * Select the next unique question for this user
 */
export function getNextUniqueQuestion(answeredIds = []) {
  const unAnswered = DAILY_QUIZ_QUESTIONS.filter((q) => !answeredIds.includes(q.id))
  if (unAnswered.length > 0) {
    return unAnswered[0]
  }
  // If user has answered all questions, recycle starting from first
  return DAILY_QUIZ_QUESTIONS[0]
}

/**
 * Check if a badge should be awarded at the current streak
 */
export function evaluateNewBadges(currentStreak, existingBadges = []) {
  const existingIds = new Set(existingBadges.map((b) => b.badgeId))
  const newlyUnlocked = []

  for (const tier of BADGE_TIERS) {
    if (currentStreak >= tier.daysRequired && !existingIds.has(tier.badgeId)) {
      newlyUnlocked.push({
        badgeId: tier.badgeId,
        title: tier.title,
        tier: tier.tier,
        daysRequired: tier.daysRequired,
        description: tier.description,
        icon: tier.icon,
        unlockedAt: new Date(),
      })
    }
  }

  return newlyUnlocked
}

/**
 * GET /api/daily-quiz/today
 * Returns today's quiz state, streak, and question (if not completed today)
 */
export const getTodayQuizStatus = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required for daily quiz.'))
    }

    const todayStr = req.query.date || getTodayDateStr()
    const yesterdayStr = getYesterdayDateStr(todayStr)

    let streakDoc = await DailyQuizStreak.findOne({ userId })
    if (!streakDoc) {
      streakDoc = await DailyQuizStreak.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: '',
        answeredQuestionIds: [],
        badges: [],
        history: [],
      })
    }

    // Check if the streak was broken (last completed before yesterday)
    let effectiveStreak = streakDoc.currentStreak
    if (streakDoc.lastCompletedDate && streakDoc.lastCompletedDate !== todayStr && streakDoc.lastCompletedDate !== yesterdayStr) {
      // User missed at least one calendar day
      effectiveStreak = 0
    }

    const completedToday = streakDoc.lastCompletedDate === todayStr

    if (completedToday) {
      const todayAttempt = streakDoc.history.find((h) => h.date === todayStr) || streakDoc.history[streakDoc.history.length - 1]

      return res.json(
        successResponse(
          {
            completedToday: true,
            currentStreak: streakDoc.currentStreak,
            longestStreak: streakDoc.longestStreak,
            totalQuizzesTaken: streakDoc.totalQuizzesTaken,
            totalCorrect: streakDoc.totalCorrect,
            todayAttempt,
            badges: streakDoc.badges,
            allBadgeTiers: BADGE_TIERS,
            secondsUntilReset: getSecondsUntilMidnight(),
            message: 'You have already completed today\'s daily quiz! Streak active.',
          },
          'Today\'s quiz already completed.'
        )
      )
    }

    // Not completed today: pick next unique question
    const question = getNextUniqueQuestion(streakDoc.answeredQuestionIds)

    // Mask correctIndex and explanation to prevent inspection cheating
    const publicQuestion = {
      id: question.id,
      category: question.category,
      question: question.question,
      options: question.options,
    }

    // Calculate progress to next badge
    const nextBadge = BADGE_TIERS.find((b) => b.daysRequired > effectiveStreak) || BADGE_TIERS[BADGE_TIERS.length - 1]

    return res.json(
      successResponse(
        {
          completedToday: false,
          currentStreak: effectiveStreak,
          longestStreak: streakDoc.longestStreak,
          todayQuestion: publicQuestion,
          nextBadge,
          badges: streakDoc.badges,
          allBadgeTiers: BADGE_TIERS,
          secondsUntilReset: getSecondsUntilMidnight(),
        },
        'Daily quiz ready.'
      )
    )
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/daily-quiz/submit
 * Validates answer, updates streak, checks badge unlocks, records history
 */
export const submitDailyQuiz = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json(errorResponse('Authentication required.'))
    }

    const { questionId, selectedOption, date } = req.body
    if (questionId === undefined || selectedOption === undefined) {
      return res.status(400).json(errorResponse('questionId and selectedOption are required.'))
    }

    const todayStr = date || getTodayDateStr()
    const yesterdayStr = getYesterdayDateStr(todayStr)

    let streakDoc = await DailyQuizStreak.findOne({ userId })
    if (!streakDoc) {
      streakDoc = await DailyQuizStreak.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: '',
        answeredQuestionIds: [],
        badges: [],
        history: [],
      })
    }

    // Enforce once-per-day completion rule
    if (streakDoc.lastCompletedDate === todayStr) {
      return res.status(400).json(
        errorResponse('You have already completed today\'s quiz. Come back tomorrow to continue your streak!')
      )
    }

    // Find original question
    const question = DAILY_QUIZ_QUESTIONS.find((q) => q.id === questionId)
    if (!question) {
      return res.status(404).json(errorResponse('Question not found.'))
    }

    const isCorrect = Number(selectedOption) === question.correctIndex

    // Calculate updated streak
    let newStreak = 1
    if (streakDoc.lastCompletedDate === yesterdayStr) {
      newStreak = streakDoc.currentStreak + 1
    } else {
      // First day or skipped days
      newStreak = 1
    }

    const newLongestStreak = Math.max(streakDoc.longestStreak || 0, newStreak)

    // Check for newly unlocked badges
    const newlyUnlockedBadges = evaluateNewBadges(newStreak, streakDoc.badges)

    // Update document
    streakDoc.currentStreak = newStreak
    streakDoc.longestStreak = newLongestStreak
    streakDoc.lastCompletedDate = todayStr
    streakDoc.totalQuizzesTaken += 1
    if (isCorrect) {
      streakDoc.totalCorrect += 1
    }

    // Add questionId to answered list to guarantee zero repeats
    if (!streakDoc.answeredQuestionIds.includes(questionId)) {
      streakDoc.answeredQuestionIds.push(questionId)
    }

    // Add new badges
    if (newlyUnlockedBadges.length > 0) {
      streakDoc.badges.push(...newlyUnlockedBadges)
    }

    // Record attempt history
    const historyEntry = {
      date: todayStr,
      questionId,
      questionText: question.question,
      category: question.category,
      selectedOption: Number(selectedOption),
      correctOption: question.correctIndex,
      isCorrect,
      explanation: question.explanation,
      completedAt: new Date(),
    }
    streakDoc.history.push(historyEntry)

    await streakDoc.save()

    return res.json(
      successResponse(
        {
          isCorrect,
          correctOption: question.correctIndex,
          explanation: question.explanation,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          newBadges: newlyUnlockedBadges,
          allBadges: streakDoc.badges,
          completedToday: true,
          secondsUntilReset: getSecondsUntilMidnight(),
        },
        isCorrect ? 'Correct! Excellent work.' : 'Completed for today. Review the explanation.'
      )
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/daily-quiz/badges
 * Returns all badge tiers and user's earned badges
 */
export const getBadgeShowcase = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?._id || req.user?.id
    let userBadges = []
    let currentStreak = 0

    if (userId) {
      const streakDoc = await DailyQuizStreak.findOne({ userId })
      if (streakDoc) {
        userBadges = streakDoc.badges || []
        currentStreak = streakDoc.currentStreak || 0
      }
    }

    return res.json(
      successResponse(
        {
          currentStreak,
          earnedBadges: userBadges,
          allTiers: BADGE_TIERS,
        },
        'Badges retrieved successfully.'
      )
    )
  } catch (error) {
    next(error)
  }
}

