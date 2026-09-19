import React, { useState, useEffect } from 'react'
import {
  Flame,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  HelpCircle,
  X,
  BrainCircuit,
  Zap,
  Target,
  ShieldCheck,
} from 'lucide-react'
import { dailyQuizAPI } from '../../services/dailyQuizAPI'
import { BADGE_TIERS } from '../../data/dailyQuizQuestions'

export const DailyQuizWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('quiz') // 'quiz' | 'badges'
  const [loading, setLoading] = useState(true)
  const [quizState, setQuizState] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState(null)
  const [countdown, setCountdown] = useState('')

  const userId = user?._id || user?.id || user?.email || 'guest'

  const loadStatus = async () => {
    try {
      setLoading(true)
      const res = await dailyQuizAPI.getTodayStatus(userId)
      if (res?.success) {
        setQuizState(res.data)
      }
    } catch (_) {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [userId])

  // Live countdown to midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.max(0, midnight.getTime() - now.getTime())

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    if (selectedOption === null || !quizState?.todayQuestion || submitting) return

    setSubmitting(true)
    try {
      const res = await dailyQuizAPI.submitAnswer({
        questionId: quizState.todayQuestion.id,
        selectedOption,
        userId,
      })

      if (res?.success) {
        setSubmissionResult(res.data)
        if (res.data.newBadges && res.data.newBadges.length > 0) {
          setNewlyUnlockedBadge(res.data.newBadges[0])
        }
        // Refresh local quiz state
        await loadStatus()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const currentStreak = quizState?.currentStreak || 0
  const isCompletedToday = quizState?.completedToday || submissionResult?.completedToday

  // 5-day cycle progress for dots
  const currentCycleProgress = currentStreak % 5 === 0 && currentStreak > 0 ? 5 : currentStreak % 5
  const nextMilestoneDays = Math.ceil((currentStreak + 1) / 5) * 5

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'soft_skills':
        return <BrainCircuit size={13} className="text-pink-400" />
      case 'technical':
        return <Zap size={13} className="text-cyan-400" />
      case 'aptitude':
        return <Target size={13} className="text-amber-400" />
      default:
        return <Sparkles size={13} className="text-pink-400" />
    }
  }

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'soft_skills':
        return 'Soft Skills & Leadership'
      case 'technical':
        return 'Technical Intuition'
      case 'aptitude':
        return 'Logic & Aptitude'
      default:
        return 'Skill Drill'
    }
  }

  return (
    <>
      {/* ── Right-Side Floating Daily Quiz Launcher (Above Goku AI) ── */}
      <aside
        className="daily-quiz-launcher-shell"
        style={{
          position: 'fixed',
          bottom: '104px',
          right: '24px',
          zIndex: 9990,
        }}
        aria-label="Daily Quiz & Streak Hub"
      >
        <button
          className={`daily-quiz-trigger-btn ${!isCompletedToday ? 'is-ready-pulse' : ''}`}
          onClick={() => setIsOpen(true)}
          title="Daily Quiz & Streak Hub · Earn 5-Day Milestone Badges"
        >
          {/* Flame & Logo Symbol */}
          <div className="quiz-logo-badge">
            <span className="quiz-flame-icon">🔥</span>
            <Trophy size={14} className="quiz-trophy-symbol" />
          </div>

          {/* Text and Streak Pill */}
          <div className="quiz-trigger-info">
            <span className="quiz-trigger-title">DAILY QUIZ</span>
            <span className="quiz-trigger-streak">
              <span className="flame-glow">🔥</span> {currentStreak}d streak
            </span>
          </div>

          {/* Attention indicator if not taken today */}
          {!isCompletedToday && <span className="quiz-uncompleted-dot" />}
        </button>
      </aside>

      {/* ── Full Interactive Modal ── */}
      {isOpen && (
        <div className="daily-quiz-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="daily-quiz-modal-container tilt-card-3d cyber-hud-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="daily-quiz-header">
              <div className="quiz-header-left">
                <div className="header-badge-icon">
                  <span>🔥</span>
                  <Trophy size={16} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="quiz-header-title">
                    Daily Skill & Aptitude Drill
                  </h2>
                  <p className="quiz-header-sub">
                    1 Question Daily · Keep your streak alive to unlock milestone badges
                  </p>
                </div>
              </div>

              <div className="quiz-header-right">
                <div className="streak-ribbon-badge">
                  <Flame size={15} className="text-orange-500 animate-pulse" />
                  <span className="streak-count">{currentStreak}</span>
                  <span className="streak-label">DAYS</span>
                </div>

                <button
                  className="quiz-modal-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close daily quiz"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 5-Day Milestone Progress Dots Strip */}
            <div className="milestone-dots-strip">
              <div className="dots-header">
                <span className="dots-label">
                  5-DAY BADGE CYCLE ({currentCycleProgress}/5 DAYS):
                </span>
                <span className="dots-next-target">
                  Next Milestone: {nextMilestoneDays} Days 🏆
                </span>
              </div>
              <div className="dots-container">
                {[1, 2, 3, 4, 5].map((step) => {
                  const isFilled = step <= currentCycleProgress
                  return (
                    <div
                      key={step}
                      className={`cycle-dot ${isFilled ? 'dot-filled' : 'dot-empty'} ${
                        step === 5 ? 'dot-reward' : ''
                      }`}
                    >
                      {step === 5 ? (
                        <span>🏆</span>
                      ) : isFilled ? (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      ) : (
                        <span>{step}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation Tabs (Quiz / Badges) */}
            <div className="quiz-nav-tabs">
              <button
                className={`quiz-tab-btn ${activeTab === 'quiz' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                <Sparkles size={14} /> Today's Question
              </button>
              <button
                className={`quiz-tab-btn ${activeTab === 'badges' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('badges')}
              >
                <Award size={14} /> Badges & Milestones ({quizState?.badges?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="quiz-modal-body">
              {loading ? (
                <div className="quiz-loading-shell">
                  <Sparkles size={24} className="animate-spin text-pink-400" />
                  <span>Loading today's skill drill...</span>
                </div>
              ) : activeTab === 'quiz' ? (
                /* ── Quiz Tab Content ── */
                isCompletedToday ? (
                  /* Completed Today View */
                  <div className="quiz-completed-view">
                    <div className="completed-hero-pill">
                      <CheckCircle2 size={24} className="text-emerald-400" />
                      <div>
                        <h3>You've Completed Today's Quiz!</h3>
                        <p>Streak preserved: {currentStreak} consecutive days.</p>
                      </div>
                    </div>

                    <div className="reset-countdown-card">
                      <div className="countdown-label">
                        <Clock size={15} className="text-pink-400" />
                        <span>NEXT QUESTION UNLOCKS IN:</span>
                      </div>
                      <div className="countdown-display">{countdown}</div>
                      <small className="countdown-hint">
                        Each day offers one unique question to build lasting consistency.
                      </small>
                    </div>

                    {/* Today's Question Review & Explanation */}
                    {(quizState?.todayAttempt || submissionResult) && (
                      <div className="today-review-card">
                        <div className="review-tag">
                          {getCategoryIcon(
                            quizState?.todayAttempt?.category ||
                              submissionResult?.category ||
                              'soft_skills'
                          )}
                          <span>
                            {getCategoryLabel(
                              quizState?.todayAttempt?.category ||
                                submissionResult?.category ||
                                'soft_skills'
                            )}
                          </span>
                        </div>
                        <h4 className="review-question">
                          {quizState?.todayAttempt?.questionText ||
                            quizState?.todayQuestion?.question}
                        </h4>
                        <div className="review-explanation">
                          <strong>💡 Key Takeaway:</strong>
                          <p>
                            {quizState?.todayAttempt?.explanation ||
                              submissionResult?.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Active Question View (Not Completed Yet) */
                  <div className="quiz-active-view">
                    {quizState?.todayQuestion ? (
                      <>
                        <div className="question-domain-chip">
                          {getCategoryIcon(quizState.todayQuestion.category)}
                          <span>
                            {getCategoryLabel(quizState.todayQuestion.category)}
                          </span>
                        </div>

                        <h3 className="daily-question-text">
                          {quizState.todayQuestion.question}
                        </h3>

                        {/* Options List */}
                        <div className="options-grid">
                          {quizState.todayQuestion.options.map((option, idx) => {
                            const isSelected = selectedOption === idx
                            return (
                              <button
                                key={idx}
                                className={`option-card ${isSelected ? 'option-selected' : ''}`}
                                onClick={() => setSelectedOption(idx)}
                              >
                                <span className="option-index">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="option-content">{option}</span>
                              </button>
                            )
                          })}
                        </div>

                        <div className="quiz-action-footer">
                          <span className="single-attempt-warning">
                            <ShieldCheck size={13} className="text-pink-400" /> 1 attempt daily
                          </span>

                          <button
                            className="quiz-submit-button"
                            disabled={selectedOption === null || submitting}
                            onClick={handleSubmit}
                          >
                            {submitting ? (
                              'Validating...'
                            ) : (
                              <>
                                Submit Answer <ChevronRight size={16} />
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="quiz-empty-state">
                        <HelpCircle size={24} />
                        <p>No questions found for today. Check back tomorrow!</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* ── Badges & Milestones Tab ── */
                <div className="badges-shelf-view">
                  <div className="badges-intro-banner">
                    <Trophy size={18} className="text-amber-400" />
                    <div>
                      <strong>Tiered Milestone Badges</strong>
                      <p>Awarded every 5 consecutive days completed without skipping.</p>
                    </div>
                  </div>

                  <div className="badge-cards-grid">
                    {BADGE_TIERS.map((tier) => {
                      const isUnlocked = currentStreak >= tier.daysRequired
                      const isNext =
                        !isUnlocked &&
                        tier.daysRequired ===
                          BADGE_TIERS.find((t) => t.daysRequired > currentStreak)?.daysRequired

                      return (
                        <div
                          key={tier.badgeId}
                          className={`badge-tier-card ${
                            isUnlocked ? 'badge-unlocked' : 'badge-locked'
                          } ${isNext ? 'badge-next-target' : ''}`}
                        >
                          <div className="badge-card-icon" style={{ borderColor: tier.color }}>
                            <span>{tier.icon}</span>
                          </div>

                          <div className="badge-card-details">
                            <div className="badge-top-row">
                              <h4 className="badge-title">{tier.title}</h4>
                              <span className="badge-days-pill">
                                {tier.daysRequired} Days
                              </span>
                            </div>
                            <span className="badge-subtitle">{tier.subtitle}</span>
                            <p className="badge-desc">{tier.description}</p>

                            {/* Progress bar towards this badge */}
                            <div className="badge-progress-bar">
                              <div
                                className="badge-progress-fill"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (currentStreak / tier.daysRequired) * 100
                                  )}%`,
                                  backgroundColor: tier.color,
                                }}
                              />
                            </div>
                            <small className="badge-progress-text">
                              {isUnlocked
                                ? '✨ Unlocked & Active'
                                : `${currentStreak} / ${tier.daysRequired} days completed`}
                            </small>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Newly Unlocked 5-Day Badge Celebration Overlay ── */}
      {newlyUnlockedBadge && (
        <div
          className="badge-celebration-backdrop"
          onClick={() => setNewlyUnlockedBadge(null)}
        >
          <div
            className="badge-celebration-modal tilt-card-3d cyber-hud-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="celebration-fireworks">✨ 🏆 ✨</div>
            <span className="celebration-icon">{newlyUnlockedBadge.icon}</span>
            <h3 className="celebration-title">NEW BADGE UNLOCKED!</h3>
            <strong className="celebration-badge-name">
              {newlyUnlockedBadge.title}
            </strong>
            <p className="celebration-desc">{newlyUnlockedBadge.description}</p>
            <div className="celebration-streak-badge">
              🔥 {newlyUnlockedBadge.daysRequired} DAY STREAK COMPLETED
            </div>
            <button
              className="celebration-claim-btn"
              onClick={() => setNewlyUnlockedBadge(null)}
            >
              Claim Badge & Continue
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default DailyQuizWidget

