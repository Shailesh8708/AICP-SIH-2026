import React, { useState, useEffect } from 'react'
import { Flame, Trophy, Sparkles, CheckCircle2, ChevronRight, Award, Clock } from 'lucide-react'
import { dailyQuizAPI } from '../../services/dailyQuizAPI'
import { BADGE_TIERS } from '../../data/dailyQuizQuestions'

export const DailyQuizDashboardCard = ({ onOpenQuiz, user }) => {
  const [data, setData] = useState(null)
  const userId = user?._id || user?.id || user?.email || 'guest'

  useEffect(() => {
    dailyQuizAPI.getTodayStatus(userId).then((res) => {
      if (res?.success) {
        setData(res.data)
      }
    })
  }, [userId])

  const currentStreak = data?.currentStreak || 0
  const isCompleted = data?.completedToday
  const cycleProgress = currentStreak % 5 === 0 && currentStreak > 0 ? 5 : currentStreak % 5
  const nextMilestone = Math.ceil((currentStreak + 1) / 5) * 5

  return (
    <div className="daily-quiz-dash-banner tilt-card-3d cyber-hud-card circuit-bus-card">
      <div className="dash-quiz-left">
        <div className="dash-quiz-badge-icon">
          <span className="dash-flame">🔥</span>
          <Trophy size={18} className="text-amber-400" />
        </div>

        <div className="dash-quiz-copy">
          <div className="dash-quiz-meta">
            <span className="dash-kicker-chip">
              <Sparkles size={11} className="text-pink-400" /> DAILY SKILL & APTITUDE DRILL
            </span>
            <span className="dash-streak-pill">
              🔥 <strong>{currentStreak}</strong> Day Streak
            </span>
          </div>

          <h3 className="dash-quiz-title">
            {isCompleted
              ? "Today's Daily Quiz Completed! Streak Kept Alive."
              : 'Complete Today\'s 1-Question Quiz & Maintain Your Streak'}
          </h3>

          <p className="dash-quiz-sub">
            {isCompleted
              ? `Great discipline! Next question unlocks at midnight. Next badge unlocked at ${nextMilestone} days.`
              : 'Sharpen soft skills, technical intuition, and aptitude daily. Earn exclusive milestone badges every 5 days.'}
          </p>

          {/* 5-Day Progress Dots */}
          <div className="dash-dots-row">
            <span className="dash-dots-caption">5-Day Milestone Progress:</span>
            <div className="dash-dots-track">
              {[1, 2, 3, 4, 5].map((d) => (
                <span
                  key={d}
                  className={`dash-dot ${d <= cycleProgress ? 'dash-dot-active' : ''} ${
                    d === 5 ? 'dash-dot-trophy' : ''
                  }`}
                  title={`Day ${d} of 5`}
                >
                  {d === 5 ? '🏆' : d <= cycleProgress ? '✓' : d}
                </span>
              ))}
            </div>
            <span className="dash-milestone-tag">Target: {nextMilestone}d</span>
          </div>
        </div>
      </div>

      <div className="dash-quiz-right">
        <button className="dash-quiz-cta-btn" onClick={onOpenQuiz}>
          {isCompleted ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-300" /> Review Today's Quiz
            </>
          ) : (
            <>
              Start Today's Quiz <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default DailyQuizDashboardCard

