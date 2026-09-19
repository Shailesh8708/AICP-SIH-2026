import React, { useState } from 'react'
import { Sparkles, ArrowUpRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { Button, Alert } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'

const PRESET_ROLES = [
  'AI/ML Engineer', 'Data Scientist', 'Full Stack Developer',
  'Data Analyst', 'Backend Developer', 'Frontend Developer',
  'DevOps Engineer', 'Cybersecurity Analyst', 'Product Manager',
]

const CompatBar = ({ score }) => {
  const color = score >= 70 ? '#2da96d' : score >= 40 ? '#ec7c45' : '#e05261'
  return (
    <div className="compat-bar-wrap">
      <div className="compat-bar-fill" style={{ width: `${score}%`, background: color }} />
      <span style={{ color }}>{score}%</span>
    </div>
  )
}

export const CareerRecommendations = () => {
  const [targetRole, setTargetRole] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  const getRecommendations = async (role = '') => {
    setLoading(true)
    setError('')
    setRecommendations([])
    setExpanded(null)
    try {
      const res = await careerAgentAPI.getCareerRecommendations(role || targetRole)
      if (res?.success) {
        const recs = res.data.recommendations || []
        // Enrich each recommendation with a compatibility percentage
        const enriched = recs.slice(0, 5).map((rec, i) => {
          const matchedCount = rec.matched_skills?.length || 0
          const missingCount = rec.missing_skills?.length || 0
          const total = matchedCount + missingCount
          const compat = total > 0 ? Math.round((matchedCount / total) * 100) : 50
          return { ...rec, compatScore: compat, rank: i + 1 }
        })
        setRecommendations(enriched)
      } else {
        setError('Could not fetch recommendations. Add skills to your profile first.')
      }
    } catch (err) {
      setError(err?.message || 'Career recommendations unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="career-section">
      <div className="career-section-header">
        <span className="section-label">CAREER RECOMMENDATION ENGINE</span>
        <h2>Discover roles that fit your current skill set</h2>
        <p className="career-muted">
          Analyzes your verified skills against career paths in the AICP ontology and returns the top 3–5 best-fit roles
          with compatibility scores, matched skills, and what you still need to learn.
        </p>
      </div>

      {/* Role input + auto-detect */}
      <div className="career-role-input">
        <label className="career-label">Explore a specific role (or leave blank for auto-detect)</label>
        <div className="role-chips">
          {PRESET_ROLES.map((r) => (
            <button
              key={r}
              className={`role-chip ${targetRole === r ? 'active' : ''}`}
              onClick={() => setTargetRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="nav" onClick={() => getRecommendations(targetRole)} loading={loading}>
            <Sparkles size={15} /> {targetRole ? `Analyze for ${targetRole}` : 'Auto-Detect Best Roles'}
          </Button>
          {targetRole && (
            <Button variant="outline" onClick={() => { setTargetRole(''); getRecommendations('') }} disabled={loading}>
              Auto-Detect
            </Button>
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {recommendations.length > 0 && (
        <div className="career-rec-list">
          {recommendations.map((rec, i) => (
            <div key={i} className={`career-rec-card ${expanded === i ? 'expanded' : ''}`}>
              <div className="career-rec-card-header" onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="career-rec-rank">#{rec.rank}</div>
                <div className="career-rec-info">
                  <h3>{rec.career}</h3>
                  <p className="career-muted">{rec.reason}</p>
                </div>
                <div className="career-rec-compat">
                  <CompatBar score={rec.compatScore} />
                  <small>compatibility</small>
                </div>
                <ArrowUpRight size={16} className={`career-rec-chevron ${expanded === i ? 'rotated' : ''}`} />
              </div>

              {expanded === i && (
                <div className="career-rec-detail">
                  {/* Matched skills */}
                  <div className="career-rec-skills">
                    <div className="career-rec-skills-col">
                      <span className="section-label"><CheckCircle2 size={12} color="#2da96d" /> MATCHED SKILLS</span>
                      {rec.matched_skills?.length > 0
                        ? <div className="skill-tags">
                            {rec.matched_skills.map((s) => <span key={s} className="skill-tag strong">✓ {s}</span>)}
                          </div>
                        : <p className="career-muted">No matched skills yet. Add relevant skills to your profile.</p>
                      }
                    </div>
                    <div className="career-rec-skills-col">
                      <span className="section-label"><AlertCircle size={12} color="#e05261" /> SKILLS TO ACQUIRE</span>
                      {rec.missing_skills?.length > 0
                        ? <div className="skill-tags">
                            {rec.missing_skills.map((s) => <span key={s} className="skill-tag missing">⚠ {s}</span>)}
                          </div>
                        : <p className="career-muted">You have all core skills for this role!</p>
                      }
                    </div>
                  </div>

                  {/* Recommended technologies */}
                  {rec.missing_skills?.length > 0 && (
                    <div className="career-rec-next-steps">
                      <span className="section-label"><TrendingUp size={12} color="#6655ee" /> RECOMMENDED NEXT STEPS</span>
                      <div className="career-rec-steps-list">
                        {rec.missing_skills.slice(0, 4).map((skill, idx) => (
                          <div key={skill} className="career-rec-step">
                            <span className="rec-step-number">{idx + 1}</span>
                            <div>
                              <strong>Learn {skill}</strong>
                              <p className="career-muted">Add verified evidence to your profile after completing a project or course.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career roadmap shortcut */}
                  <div className="career-rec-cta">
                    <Button variant="outline" size="sm"
                      onClick={() => { window.dispatchEvent(new CustomEvent('career-navigate', { detail: 'skill-gap' })) }}>
                      <Sparkles size={13} /> Full Skill Gap for {rec.career}
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => { window.dispatchEvent(new CustomEvent('career-navigate', { detail: 'roadmap' })) }}>
                      View Learning Roadmap
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && recommendations.length === 0 && !error && (
        <div className="career-empty">
          <Sparkles size={36} color="#d4cff8" />
          <p>Click &quot;Auto-Detect Best Roles&quot; or select a specific role above to see your career recommendations.</p>
          <p className="career-muted">You need at least a few skills in your profile for meaningful results.</p>
        </div>
      )}
    </div>
  )
}
