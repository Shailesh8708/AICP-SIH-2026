import api from './api'
import { DAILY_QUIZ_QUESTIONS, BADGE_TIERS } from '../data/dailyQuizQuestions'

const STORAGE_KEY_PREFIX = 'aicp_daily_quiz_'

function getTodayStr() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYesterdayStr(todayStr) {
  const [y, m, d] = todayStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function getLocalState(userId = 'guest') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
    if (raw) return JSON.parse(raw)
  } catch (_) {
    // Ignore storage errors
  }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
    answeredQuestionIds: [],
    badges: [],
    history: [],
  }
}

function saveLocalState(userId = 'guest', state) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(state))
  } catch (_) {
    // Ignore storage errors
  }
}

export const dailyQuizAPI = {
  /**
   * Fetch today's quiz state, streak, and current question
   */
  getTodayStatus: async (userId = 'guest') => {
    try {
      const res = await api.get('/daily-quiz/today')
      const payload = res?.data?.success !== undefined ? res.data : res
      if (payload?.success) {
        return payload
      }
    } catch (_) {
      // Graceful fallback to client-side localStorage state
    }

    // Local state fallback
    const todayStr = getTodayStr()
    const yesterdayStr = getYesterdayStr(todayStr)
    const state = getLocalState(userId)

    let effectiveStreak = state.currentStreak
    if (state.lastCompletedDate && state.lastCompletedDate !== todayStr && state.lastCompletedDate !== yesterdayStr) {
      effectiveStreak = 0
    }

    const completedToday = state.lastCompletedDate === todayStr

    if (completedToday) {
      const todayAttempt = state.history.find((h) => h.date === todayStr) || state.history[state.history.length - 1]
      return {
        success: true,
        data: {
          completedToday: true,
          currentStreak: state.currentStreak,
          longestStreak: state.longestStreak,
          todayAttempt,
          badges: state.badges,
          allBadgeTiers: BADGE_TIERS,
        },
      }
    }

    // Select next unique question
    const unanswered = DAILY_QUIZ_QUESTIONS.filter((q) => !state.answeredQuestionIds.includes(q.id))
    const question = unanswered.length > 0 ? unanswered[0] : DAILY_QUIZ_QUESTIONS[0]

    const nextBadge = BADGE_TIERS.find((b) => b.daysRequired > effectiveStreak) || BADGE_TIERS[BADGE_TIERS.length - 1]

    return {
      success: true,
      data: {
        completedToday: false,
        currentStreak: effectiveStreak,
        longestStreak: state.longestStreak,
        todayQuestion: {
          id: question.id,
          category: question.category,
          question: question.question,
          options: question.options,
        },
        nextBadge,
        badges: state.badges,
        allBadgeTiers: BADGE_TIERS,
      },
    }
  },

  /**
   * Submit today's answer
   */
  submitAnswer: async ({ questionId, selectedOption, userId = 'guest' }) => {
    try {
      const res = await api.post('/daily-quiz/submit', { questionId, selectedOption })
      const payload = res?.data?.success !== undefined ? res.data : res
      if (payload?.success) {
        // Also sync to local storage for offline resilience
        const state = getLocalState(userId)
        state.lastCompletedDate = getTodayStr()
        state.currentStreak = payload.data?.currentStreak ?? state.currentStreak
        state.longestStreak = payload.data?.longestStreak ?? state.longestStreak
        state.badges = payload.data?.allBadges ?? state.badges
        if (!state.answeredQuestionIds.includes(questionId)) {
          state.answeredQuestionIds.push(questionId)
        }
        saveLocalState(userId, state)
        return payload
      }
    } catch (_) {
      // Fall through to local submission handler
    }

    // Local evaluation fallback
    const todayStr = getTodayStr()
    const yesterdayStr = getYesterdayStr(todayStr)
    const state = getLocalState(userId)

    if (state.lastCompletedDate === todayStr) {
      return {
        success: false,
        message: 'You have already completed today\'s quiz.',
      }
    }

    const question = DAILY_QUIZ_QUESTIONS.find((q) => q.id === questionId)
    if (!question) {
      return { success: false, message: 'Question not found' }
    }

    const isCorrect = Number(selectedOption) === question.correctIndex

    let newStreak = 1
    if (state.lastCompletedDate === yesterdayStr) {
      newStreak = state.currentStreak + 1
    } else {
      newStreak = 1
    }

    const newLongest = Math.max(state.longestStreak || 0, newStreak)

    // Evaluate newly unlocked badges
    const existingIds = new Set(state.badges.map((b) => b.badgeId))
    const newlyUnlocked = []
    for (const tier of BADGE_TIERS) {
      if (newStreak >= tier.daysRequired && !existingIds.has(tier.badgeId)) {
        const newBadge = {
          badgeId: tier.badgeId,
          title: tier.title,
          tier: tier.tier,
          daysRequired: tier.daysRequired,
          description: tier.description,
          icon: tier.icon,
          unlockedAt: new Date().toISOString(),
        }
        newlyUnlocked.push(newBadge)
        state.badges.push(newBadge)
      }
    }

    state.currentStreak = newStreak
    state.longestStreak = newLongest
    state.lastCompletedDate = todayStr
    if (!state.answeredQuestionIds.includes(questionId)) {
      state.answeredQuestionIds.push(questionId)
    }

    const attempt = {
      date: todayStr,
      questionId,
      questionText: question.question,
      category: question.category,
      selectedOption: Number(selectedOption),
      correctOption: question.correctIndex,
      isCorrect,
      explanation: question.explanation,
      completedAt: new Date().toISOString(),
    }
    state.history.push(attempt)

    saveLocalState(userId, state)

    return {
      success: true,
      data: {
        isCorrect,
        correctOption: question.correctIndex,
        explanation: question.explanation,
        currentStreak: newStreak,
        longestStreak: newLongest,
        newBadges: newlyUnlocked,
        allBadges: state.badges,
        completedToday: true,
      },
      message: isCorrect ? 'Correct! Excellent work.' : 'Completed for today. Review the explanation.',
    }
  },

  /**
   * Get all badge tiers and earned badges
   */
  getBadges: async (userId = 'guest') => {
    try {
      const res = await api.get('/daily-quiz/badges')
      const payload = res?.data?.success !== undefined ? res.data : res
      if (payload?.success) {
        return payload
      }
    } catch (_) {
      // Fallback to local state
    }

    const state = getLocalState(userId)
    return {
      success: true,
      data: {
        currentStreak: state.currentStreak,
        earnedBadges: state.badges,
        allTiers: BADGE_TIERS,
      },
    }
  },
}

export default dailyQuizAPI

