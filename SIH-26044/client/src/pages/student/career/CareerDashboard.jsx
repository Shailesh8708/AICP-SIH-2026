import React, { useEffect, useState } from 'react'
import { ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react'
import { Button, Alert } from '../../../components/common'
import { GainSkillsCard } from '../../../components/GainSkillsCard'
import { careerAgentAPI } from '../../../services/careerAgentAPI'

const ScoreRing = ({ score, label, color = '#6655ee' }) => {
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = score != null ? circ - (circ * score) / 100 : circ
  return (
    <div className="career-score-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e8f0" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={filled}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset .6s ease' }} />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#17212b">
          {score != null ? score : '—'}
        </text>
      </svg>
      <span>{label}</span>
    </div>
  )
}

export const CareerDashboard = ({ onNavigate }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    careerAgentAPI.getDashboard()
      .then((res) => { if (res?.success) { setData(res.data) } else { setError('Could not load dashboard.') } })
      .catch(() => setError('Dashboard unavailable. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="career-loading"><Sparkles size={20} /> Loading your career dashboard...</div>
  if (error) return <Alert type="error" message={error} />

  const { scores, nextBestAction, profileCompleteness, interviewCompleted, disclaimer } = data || {}

  const completenessItems = [
    ['Skills', profileCompleteness?.skills],
    ['Projects', profileCompleteness?.projects],
    ['GitHub', profileCompleteness?.github],
    ['LinkedIn', profileCompleteness?.linkedin],
    ['Experience', profileCompleteness?.experience],
    ['Certifications', profileCompleteness?.certifications],
  ]

  return (
    <div className="career-dashboard">
      <div className="career-section-header">
        <span className="section-label">AI CAREER DASHBOARD</span>
        <h2>Your Career Readiness Overview</h2>
        <p className="career-disclaimer"><AlertCircle size={14} /> {disclaimer}</p>
      </div>

      {/* Main readiness score */}
      <div className="career-readiness-hero">
        <div className="career-readiness-score">
          <span>INTERNSHIP READINESS SCORE</span>
          <strong>{scores?.internshipReadiness ?? '—'}<small>/100</small></strong>
          <p>AI-generated indicator based on your profile completeness, skills, projects, and activity.</p>
        </div>
        <div className="career-score-grid">
          <ScoreRing score={scores?.skills} label="Skills" color="#6655ee" />
          <ScoreRing score={scores?.projects} label="Projects" color="#2da96d" />
          <ScoreRing score={scores?.experience} label="Experience" color="#ec7c45" />
          <ScoreRing score={scores?.github} label="GitHub" color="#117a72" />
          <ScoreRing score={scores?.linkedin} label="LinkedIn" color="#3b82f6" />
          <ScoreRing score={scores?.certifications} label="Certs" color="#e05261" />
        </div>
      </div>

      {/* Next best action */}
      <div className="career-next-action">
        <span className="section-label">NEXT BEST ACTION</span>
        <p>{nextBestAction || 'Complete your profile to get a personalized recommendation.'}</p>
        {!interviewCompleted && (
          <Button variant="nav" onClick={() => onNavigate('interview')}>
            <Sparkles size={15} /> Start AI Career Interview <ArrowUpRight size={15} />
          </Button>
        )}
      </div>

      {/* Gain Skills & Certificates Spotlight */}
      <div className="career-gain-skills-spotlight mb-6">
        <GainSkillsCard />
      </div>

      {/* Profile completeness */}
      <div className="career-completeness">
        <span className="section-label">PROFILE COMPLETENESS</span>
        <div className="career-completeness-grid">
          {completenessItems.map(([label, done]) => (
            <div key={label} className={`completeness-item ${done ? 'done' : 'missing'}`}>
              <span>{done ? '✓' : '○'}</span> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="career-quick-actions">
        <span className="section-label">QUICK ACTIONS</span>
        <div className="career-actions-row">
          {[
            ['Gain Skills & Certificates', 'gain-skills'],
            ['Skill Gap Analysis', 'skill-gap'],
            ['Match Internships', 'internship-match'],
            ['Generate Resume', 'resume'],
            ['Learning Roadmap', 'roadmap'],
            ['Mock Interview', 'mock-interview'],
          ].map(([label, tab]) => (
            <button key={tab} className="career-action-chip" onClick={() => onNavigate(tab)}>
              {label} <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
