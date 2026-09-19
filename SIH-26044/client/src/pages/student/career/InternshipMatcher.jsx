import React, { useEffect, useState } from 'react'
import { Sparkles, Briefcase, ArrowUpRight } from 'lucide-react'
import { Alert } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'
import { useNavigate } from 'react-router-dom'

const ScoreBar = ({ score, color = '#6655ee' }) => (
  <div className="match-score-bar">
    <div className="match-score-fill" style={{ width: `${score || 0}%`, background: color }} />
  </div>
)

export const InternshipMatcher = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    careerAgentAPI.matchInternships()
      .then((res) => {
        if (res?.success) setMatches(res.data.matches || [])
        else setError('Could not load internship matches.')
      })
      .catch(() => setError('Internship matching unavailable. Ensure you have added skills to your profile.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="career-loading"><Sparkles size={20} /> Calculating your best internship matches...</div>

  return (
    <div className="career-section">
      <div className="career-section-header">
        <span className="section-label">INTERNSHIP MATCHING</span>
        <h2>Opportunities ranked by your compatibility</h2>
        <p className="career-muted">Matches are calculated from your profile skills against real opportunities in the platform. Sorted by compatibility.</p>
      </div>

      {error && <Alert type="error" message={error} />}

      {matches.length === 0 && !error && (
        <div className="career-empty">
          <Briefcase size={40} color="#dce4df" />
          <p>No published internships found at the moment. Check back soon as new opportunities are posted.</p>
        </div>
      )}

      <div className="internship-match-list">
        {matches.map((match) => (
          <div key={match.opportunityId} className="internship-match-card">
            <div className="match-card-header">
              <div>
                <h3>{match.title}</h3>
                <span className="match-type-badge">{match.type}</span>
                {match.location && <span className="match-meta">{match.location}</span>}
                {match.duration && <span className="match-meta">{match.duration}</span>}
                {match.stipend > 0 && <span className="match-meta">₹{match.stipend}/mo</span>}
              </div>
              <div className="match-overall-score">
                <strong>{match.matchScore}%</strong>
                <small>match</small>
              </div>
            </div>

            <div className="match-breakdown">
              <div className="match-breakdown-row">
                <span>Skill Match</span>
                <ScoreBar score={match.skillMatch} color="#6655ee" />
                <strong>{match.skillMatch}%</strong>
              </div>
              <div className="match-breakdown-row">
                <span>Education Match</span>
                <ScoreBar score={match.educationMatch} color="#2da96d" />
                <strong>{match.educationMatch}%</strong>
              </div>
            </div>

            {match.matchedSkills?.length > 0 && (
              <div className="match-skills">
                <span className="section-label">MATCHED</span>
                {match.matchedSkills.map((s) => <span key={s} className="skill-tag strong">✓ {s}</span>)}
              </div>
            )}
            {match.missingSkills?.length > 0 && (
              <div className="match-skills">
                <span className="section-label">TO LEARN</span>
                {match.missingSkills.slice(0, 4).map((s) => <span key={s} className="skill-tag missing">⚠ {s}</span>)}
              </div>
            )}

            {match.reason && <p className="match-reason">{match.reason}</p>}

            <button
              className="match-apply-link"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              }}
              onClick={() => navigate(`/opportunities?id=${match.opportunityId}`)}
            >
              Fill Application Form <ArrowUpRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
