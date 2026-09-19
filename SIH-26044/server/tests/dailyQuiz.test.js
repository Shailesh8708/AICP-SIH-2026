import { describe, it, expect } from 'vitest'
import {
  getTodayDateStr,
  getYesterdayDateStr,
  getNextUniqueQuestion,
  evaluateNewBadges,
  getSecondsUntilMidnight,
} from '../src/controllers/dailyQuizController.js'
import {
  DAILY_QUIZ_QUESTIONS,
  BADGE_TIERS,
} from '../src/data/dailyQuizQuestions.js'

describe('Daily Quiz & Streak Engine Tests', () => {
  it('should have a rich, valid question pool with unique IDs across all categories', () => {
    expect(DAILY_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(45)

    const ids = new Set()
    const categories = new Set()

    for (const q of DAILY_QUIZ_QUESTIONS) {
      expect(q.id).toBeTruthy()
      expect(ids.has(q.id)).toBe(false) // Zero duplicate question IDs
      ids.add(q.id)

      expect(['soft_skills', 'technical', 'aptitude']).toContain(q.category)
      categories.add(q.category)

      expect(q.question).toBeTruthy()
      expect(Array.isArray(q.options)).toBe(true)
      expect(q.options.length).toBe(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(q.explanation).toBeTruthy()
    }

    // Must cover all 3 requested domains
    expect(categories.has('soft_skills')).toBe(true)
    expect(categories.has('technical')).toBe(true)
    expect(categories.has('aptitude')).toBe(true)
  })

  it('should format today and yesterday dates correctly', () => {
    const today = '2026-09-12'
    const yesterday = getYesterdayDateStr(today)
    expect(yesterday).toBe('2026-09-11')

    const dateStr = getTodayDateStr(new Date('2026-05-01T10:00:00Z'))
    expect(dateStr).toBe('2026-05-01')
    expect(getYesterdayDateStr('2026-05-01')).toBe('2026-04-30')
  })

  it('should calculate seconds until midnight accurately', () => {
    const seconds = getSecondsUntilMidnight()
    expect(seconds).toBeGreaterThan(0)
    expect(seconds).toBeLessThanOrEqual(86400)
  })

  it('should guarantee zero repetition when picking next question', () => {
    const answeredIds = ['soft-01', 'soft-02', 'soft-03']
    const nextQuestion = getNextUniqueQuestion(answeredIds)

    expect(nextQuestion).toBeDefined()
    expect(answeredIds).not.toContain(nextQuestion.id)
  })

  it('should award tiered badges every 5 days strictly', () => {
    // Streak 4: No badges
    const badgesStreak4 = evaluateNewBadges(4, [])
    expect(badgesStreak4.length).toBe(0)

    // Streak 5: Unlocks Bronze Catalyst (Tier 1)
    const badgesStreak5 = evaluateNewBadges(5, [])
    expect(badgesStreak5.length).toBe(1)
    expect(badgesStreak5[0].badgeId).toBe('badge_bronze_5')
    expect(badgesStreak5[0].title).toBe('Bronze Catalyst')

    // Streak 9 with existing Bronze: No new badge
    const badgesStreak9 = evaluateNewBadges(9, badgesStreak5)
    expect(badgesStreak9.length).toBe(0)

    // Streak 10: Unlocks Silver Sentinel (Tier 2)
    const badgesStreak10 = evaluateNewBadges(10, badgesStreak5)
    expect(badgesStreak10.length).toBe(1)
    expect(badgesStreak10[0].badgeId).toBe('badge_silver_10')

    // Streak 15: Unlocks Gold Vanguard (Tier 3)
    const existingBadges10 = [...badgesStreak5, ...badgesStreak10]
    const badgesStreak15 = evaluateNewBadges(15, existingBadges10)
    expect(badgesStreak15.length).toBe(1)
    expect(badgesStreak15[0].badgeId).toBe('badge_gold_15')

    // Streak 20: Unlocks Diamond Sovereign (Tier 4)
    const existingBadges15 = [...existingBadges10, ...badgesStreak15]
    const badgesStreak20 = evaluateNewBadges(20, existingBadges15)
    expect(badgesStreak20.length).toBe(1)
    expect(badgesStreak20[0].badgeId).toBe('badge_diamond_20')

    // Streak 25: Unlocks Cosmic Archon (Tier 5)
    const existingBadges20 = [...existingBadges15, ...badgesStreak20]
    const badgesStreak25 = evaluateNewBadges(25, existingBadges20)
    expect(badgesStreak25.length).toBe(1)
    expect(badgesStreak25[0].badgeId).toBe('badge_cosmic_25')

    // Streak 30: Unlocks Grandmaster Cyber Titan (Tier 6)
    const existingBadges25 = [...existingBadges20, ...badgesStreak25]
    const badgesStreak30 = evaluateNewBadges(30, existingBadges25)
    expect(badgesStreak30.length).toBe(1)
    expect(badgesStreak30[0].badgeId).toBe('badge_titan_30')
  })

  it('should contain exactly 6 progressive badge milestones', () => {
    expect(BADGE_TIERS.length).toBe(6)
    expect(BADGE_TIERS[0].daysRequired).toBe(5)
    expect(BADGE_TIERS[1].daysRequired).toBe(10)
    expect(BADGE_TIERS[2].daysRequired).toBe(15)
    expect(BADGE_TIERS[3].daysRequired).toBe(20)
    expect(BADGE_TIERS[4].daysRequired).toBe(25)
    expect(BADGE_TIERS[5].daysRequired).toBe(30)
  })
})

