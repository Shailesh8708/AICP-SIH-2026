import React, { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Award,
  Layers,
  Briefcase,
} from 'lucide-react'
import { Button, Alert, Input, CompanyLogo } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'

// Comprehensive per-skill learning topic templates
const SKILL_TOPICS = {
  Python: {
    beginner: ['Variables & data types', 'Loops & conditionals', 'Functions & modules', 'Lists, dicts, sets'],
    intermediate: ['OOP in Python', 'File I/O & exceptions', 'List comprehensions', 'Virtual environments'],
    advanced: ['Decorators & generators', 'Async/await', 'Metaclasses', 'Performance profiling'],
    project: 'Build a CLI task manager with SQLite persistence',
    sequence: ['Python Crash Course (book)', 'Real Python tutorials', 'Build 2 projects', 'Contribute to open source'],
  },
  'Machine Learning': {
    beginner: ['Supervised vs unsupervised learning', 'Train/test split', 'scikit-learn basics', 'Linear regression'],
    intermediate: ['Decision trees & random forests', 'Feature engineering', 'Cross-validation', 'Model evaluation metrics'],
    advanced: ['Ensemble methods', 'Hyperparameter tuning', 'MLflow tracking', 'Model deployment'],
    project: 'Build a student performance predictor using scikit-learn',
    sequence: ['Andrew Ng ML course', 'Kaggle beginner competitions', 'Deploy a model with Flask', 'Write a project README'],
  },
  Docker: {
    beginner: ['What is containerization', 'docker run & docker pull', 'Dockerfile basics', 'docker-compose intro'],
    intermediate: ['Multi-stage builds', 'Networking between containers', 'Volumes & persistence', 'Docker Hub'],
    advanced: ['CI/CD with Docker', 'Kubernetes basics', 'Container security', 'Distroless images'],
    project: 'Dockerize a full-stack Node.js + MongoDB app with docker-compose',
    sequence: ['Docker docs play-with-docker', 'Containerize an existing project', 'Add to CI pipeline', 'Deploy on cloud'],
  },
  AWS: {
    beginner: ['EC2 & S3 basics', 'IAM roles', 'AWS CLI', 'Regions & availability zones'],
    intermediate: ['Lambda serverless', 'RDS & DynamoDB', 'CloudFormation basics', 'Load balancers'],
    advanced: ['VPC networking', 'CDK infrastructure as code', 'Cost optimization', 'Security best practices'],
    project: 'Deploy a FastAPI app to AWS Lambda with API Gateway',
    sequence: ['AWS Cloud Practitioner (free), AWS Skill Builder', 'Build & deploy one project', 'Get AWS CCP certification'],
  },
  React: {
    beginner: ['JSX & components', 'Props & state', 'Event handling', 'Lists & keys'],
    intermediate: ['useEffect & lifecycle', 'Context API', 'React Router', 'Custom hooks'],
    advanced: ['Performance optimization', 'Code splitting', 'Testing with RTL', 'State management (Zustand/Redux)'],
    project: 'Build a job application tracker with React + local storage',
    sequence: ['React official docs tutorial', 'Build a small CRUD app', 'Add routing', 'Deploy on Vercel'],
  },
  'Node.js': {
    beginner: ['Event loop basics', 'CommonJS & ES Modules', 'File system & Path modules', 'npm dependencies'],
    intermediate: ['Express routing & middleware', 'RESTful API conventions', 'Async file & network I/O', 'JWT authentication'],
    advanced: ['Worker threads & clustering', 'Performance profiling', 'Microservice architecture', 'Streams & buffers'],
    project: 'Build a scalable REST API with authentication and rate limiting in Node.js',
    sequence: ['Node.js official guides', 'Build 3 CRUD services', 'Add caching with Redis', 'Deploy on cloud'],
  },
  SQL: {
    beginner: ['SELECT, WHERE, ORDER BY, LIMIT', 'INSERT, UPDATE, DELETE', 'Primary & foreign keys', 'Basic joins'],
    intermediate: ['Complex aggregations & GROUP BY', 'Subqueries & CTEs', 'Database normalization', 'Indexes & query plans'],
    advanced: ['Window functions (ROW_NUMBER, RANK)', 'Transactions & ACID properties', 'Performance tuning & EXPLAIN'],
    project: 'Design and optimize a multi-table database schema for student placement analytics',
    sequence: ['SQLBolt interactive tutorial', 'LeetCode database problems', 'Build normalized database', 'Profile queries'],
  },
  default: {
    beginner: ['Core concepts and fundamentals', 'Install & setup environment', 'Follow official getting-started guide'],
    intermediate: ['Build a small project', 'Read the documentation deeply', 'Watch 2–3 tutorial videos'],
    advanced: ['Contribute to open source', 'Teach it to someone else', 'Use it in a real project'],
    project: 'Build a real-world project that uses this skill as its primary technology',
    sequence: ['Official documentation', 'Build one small project', 'Add to resume with link to GitHub', 'Get a certificate'],
  },
}

const getTopics = (skill) => SKILL_TOPICS[skill] || SKILL_TOPICS.default

const PRESET_CAREERS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cybersecurity Analyst',
  'Cloud Engineer',
]

const SkillGapItem = ({ gap, targetRole }) => {
  const [open, setOpen] = useState(false)
  const skill = gap.skill || gap
  const topics = getTopics(skill)
  const isHighPriority = gap.priority === 'High' || gap.importance === 'high'
  const isPartial = gap.status === 'partial'

  return (
    <div className={`skill-gap-accordion ${isPartial ? 'partial' : ''}`}>
      <div className="skill-gap-accordion-header" onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`skill-tag ${isPartial ? 'partial' : 'missing'}`}>
            {isPartial ? '⚡ ' : '⚠ '} {skill}
          </span>
          {isHighPriority && (
            <span className="skill-priority-badge high">HIGH PRIORITY</span>
          )}
          {!isHighPriority && isPartial && (
            <span className="skill-priority-badge partial">PREREQUISITE KNOWN</span>
          )}
        </div>
        <small>
          {gap.reason || (isPartial
            ? `Prerequisites known — ready for accelerated learning.`
            : `Required for ${targetRole}`)}
        </small>
        <ChevronDown
          size={14}
          className={open ? 'rotated' : ''}
          style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        />
      </div>
      {open && (
        <div className="skill-gap-accordion-body">
          <div className="skill-topics-grid">
            <div className="skill-topics-col">
              <span className="section-label">BEGINNER</span>
              <ul>{topics.beginner.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="skill-topics-col">
              <span className="section-label">INTERMEDIATE</span>
              <ul>{topics.intermediate.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="skill-topics-col">
              <span className="section-label">ADVANCED</span>
              <ul>{topics.advanced.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          </div>
          <div className="skill-topic-project">
            <span className="section-label">PRACTICAL PROJECT</span>
            <p>{topics.project}</p>
          </div>
          <div className="skill-topic-sequence">
            <span className="section-label">RECOMMENDED LEARNING SEQUENCE</span>
            <ol>{topics.sequence.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        </div>
      )}
    </div>
  )
}

export const SkillGapRoadmap = () => {
  const [targetRole, setTargetRole] = useState('')
  const [skillGap, setSkillGap] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async (roleToAnalyze) => {
    const queryRole = typeof roleToAnalyze === 'string' ? roleToAnalyze : targetRole
    if (!queryRole.trim()) return

    setTargetRole(queryRole)
    setLoading(true)
    setError('')
    setSkillGap(null)
    setRoadmap(null)

    try {
      const [gapRes, roadmapRes] = await Promise.all([
        careerAgentAPI.analyzeSkillGap(queryRole.trim()),
        careerAgentAPI.generateRoadmap(queryRole.trim()),
      ])

      if (gapRes?.success) {
        setSkillGap(gapRes.data.skillGap)
      }
      if (roadmapRes?.success && roadmapRes.data.roadmap) {
        setRoadmap(roadmapRes.data.roadmap)
      }
    } catch (err) {
      setError(err?.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      analyze()
    }
  }

  const isValidRole = skillGap?.isValidRole !== false
  const readinessScore = skillGap?.readinessScore ?? 0
  const scoreColor = readinessScore >= 70 ? '#2da96d' : readinessScore >= 40 ? '#ec7c45' : '#e05261'

  const matchedSkills = skillGap?.matchedSkills?.map((s) => s.skill || s) || skillGap?.strengths || []
  const partialSkills = skillGap?.partialSkills || []
  const missingSkills = skillGap?.missingSkills || (skillGap?.gaps?.filter((g) => g.status !== 'partial') || [])
  const companyPrograms = skillGap?.recommendedPrograms || []

  return (
    <div className="career-section">
      <div className="career-section-header">
        <span className="section-label">AI SKILL GAP &amp; PERSONALIZED ROADMAP</span>
        <h2>Personalized Path to Your Target Role</h2>
        <p className="career-muted">
          Compare your verified profile skills against authentic industry role requirements.
          Gaps are prioritized by prerequisite dependencies and matched with verified company learning tracks.
        </p>
      </div>

      <div className="career-role-input" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <Input
            label="Target Career Role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Full Stack Developer, Data Scientist, AI/ML Engineer..."
          />
        </div>
        <div style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
          <Button variant="nav" onClick={() => analyze()} loading={loading} disabled={!targetRole.trim()}>
            <Sparkles size={15} /> Analyze Gap
          </Button>
        </div>
      </div>

      {/* Suggested Quick Roles */}
      <div className="role-quick-chips">
        <span className="quick-chips-label"><Briefcase size={12} /> Popular Roles:</span>
        <div className="chips-container">
          {PRESET_CAREERS.map((role) => (
            <button
              key={role}
              type="button"
              className={`role-chip ${targetRole.toLowerCase() === role.toLowerCase() ? 'active' : ''}`}
              onClick={() => analyze(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Case 1: Unsupported / Non-Career Input */}
      {skillGap && !isValidRole && (
        <div className="unsupported-role-banner">
          <div className="unsupported-role-header">
            <AlertCircle size={24} color="#e05261" />
            <div>
              <h3>Unsupported Career Role</h3>
              <p>{skillGap.message || 'This role is not recognized as a supported educational or industry career path in AICP.'}</p>
            </div>
          </div>
          {skillGap.suggestedRoles && skillGap.suggestedRoles.length > 0 && (
            <div className="unsupported-role-suggestions">
              <span className="section-label">PLEASE SELECT A RECOGNIZED CAREER PATH:</span>
              <div className="chips-container" style={{ marginTop: '8px' }}>
                {skillGap.suggestedRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className="role-chip"
                    onClick={() => analyze(role)}
                  >
                    <Sparkles size={11} /> {role}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Case 2: Valid Career Role Analysis Result */}
      {skillGap && isValidRole && (
        <div className="career-skill-gap">
          {/* Skill Match Summary Card */}
          <div className="skill-gap-summary-card">
            <div className="summary-card-header">
              <div>
                <span className="section-label">ROLE EVALUATION</span>
                <h3>{skillGap.targetRole || targetRole}</h3>
                {skillGap.description && (
                  <p className="career-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    {skillGap.description}
                  </p>
                )}
              </div>
              <div className="readiness-gauge">
                <span className="gauge-value" style={{ color: scoreColor }}>
                  {readinessScore}%
                </span>
                <span className="gauge-label">Career Readiness</span>
              </div>
            </div>

            <div className="readiness-bar-wrap">
              <div
                className="readiness-bar-fill"
                style={{ width: `${Math.max(readinessScore, 5)}%`, background: scoreColor }}
              />
            </div>

            <div className="summary-stats-pills">
              <div className="stat-pill matched">
                <CheckCircle2 size={15} color="#2da96d" />
                <span><strong>{matchedSkills.length}</strong> Matched Skills</span>
              </div>
              <div className="stat-pill partial">
                <Sparkles size={15} color="#d97706" />
                <span><strong>{partialSkills.length}</strong> Partial Gaps (Prereqs Known)</span>
              </div>
              <div className="stat-pill missing">
                <TrendingDown size={15} color="#e05261" />
                <span><strong>{missingSkills.length}</strong> Missing Gaps</span>
              </div>
            </div>
          </div>

          {/* Matched Strong Skills */}
          <div className="skill-gap-section strengths">
            <h3><TrendingUp size={17} color="#2da96d" /> Matched Skills <small style={{ color: '#64717d', fontWeight: 400 }}>— already present in your profile</small></h3>
            {matchedSkills.length > 0 ? (
              <div className="skill-tags">
                {matchedSkills.map((s) => (
                  <span key={s} className="skill-tag strong">
                    ✓ {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="career-muted">No core skills matched yet. Review the recommendations below to start building your foundation.</p>
            )}
          </div>

          {/* Partial / Related Gaps (Prerequisites already known) */}
          {partialSkills.length > 0 && (
            <div className="skill-gap-section partial-gaps">
              <h3>
                <Sparkles size={17} color="#d97706" /> Partial / Related Gaps
                <small style={{ color: '#64717d', fontWeight: 400 }}> — foundational prerequisites already met</small>
              </h3>
              <div className="partial-cards-list">
                {partialSkills.map((gap) => (
                  <SkillGapItem key={gap.skill} gap={gap} targetRole={skillGap.targetRole || targetRole} />
                ))}
              </div>
            </div>
          )}

          {/* Prioritized Missing Skills */}
          <div className="skill-gap-section gaps">
            <h3>
              <TrendingDown size={17} color="#e05261" /> Missing Skills
              <small style={{ color: '#64717d', fontWeight: 400 }}> — expand to see curriculum topics &amp; practical project</small>
            </h3>
            {missingSkills.length > 0 ? (
              missingSkills.map((gap) => (
                <SkillGapItem key={gap.skill || gap} gap={gap} targetRole={skillGap.targetRole || targetRole} />
              ))
            ) : (
              <p className="career-muted" style={{ color: '#2da96d', fontWeight: 600 }}>
                Excellent! All required competencies for this role are matched or in progress.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Personalized Roadmap */}
      {roadmap && isValidRole && (
        <div className="career-roadmap">
          <div className="career-section-header">
            <span className="section-label">DYNAMIC PERSONALIZED ROADMAP</span>
            <h3>Your step-by-step path to {roadmap.targetRole || targetRole}</h3>
            <p className="career-disclaimer"><AlertCircle size={14} /> {roadmap.disclaimer}</p>
          </div>
          <div className="roadmap-grid">
            {[roadmap.day7, roadmap.day30, roadmap.day60, roadmap.day90].filter(Boolean).map((phase, idx) => (
              <div key={phase.title || idx} className="roadmap-phase">
                <h4>{phase.title}</h4>
                {phase.focusSkills && phase.focusSkills.length > 0 && (
                  <div className="roadmap-focus-skills">
                    {phase.focusSkills.map((s) => (
                      <span key={s} className="phase-skill-pill">{s}</span>
                    ))}
                  </div>
                )}
                <ul>
                  {(phase.tasks || []).map((task, i) => (
                    <li key={i}><span className="task-dot" />{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Company Learning Programs */}
      {companyPrograms.length > 0 && isValidRole && (
        <div className="company-learning-section">
          <div className="career-section-header">
            <span className="section-label">VERIFIED COMPANY LEARNING PROGRAMS</span>
            <h3>Industry programs tailored to your specific skill gaps</h3>
            <p className="career-muted">
              These programs directly cover your missing skills from official AICP partner platforms with verifiable badges and certifications.
            </p>
          </div>

          <div className="company-learning-grid">
            {companyPrograms.map((prog, i) => (
              <div key={prog.programName || i} className="company-program-card">
                <div className="company-program-top">
                  <div className="provider-badge-wrap">
                    <span className="company-provider-badge">
                      <CompanyLogo company={prog.company || prog.id} size={22} variant="icon" />
                      <span>{prog.company}</span>
                    </span>
                    {prog.badgeLabel && (
                      <span className="credential-badge"><Award size={12} /> {prog.badgeLabel}</span>
                    )}
                  </div>
                  <span className="match-score-badge">{prog.matchScore}% Match</span>
                </div>

                <h4 className="program-title">{prog.programName}</h4>

                <p className="program-why">
                  <Sparkles size={13} color="#6655ee" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{prog.whyRecommended}</span>
                </p>

                <div className="program-skills-covered">
                  <span className="skills-covered-label"><Layers size={12} /> Relevant Skills:</span>
                  <div className="program-skills-tags">
                    {(prog.skillsCovered || []).map((skill) => (
                      <span key={skill} className="prog-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="company-program-footer">
                  <a
                    href={prog.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-program-link"
                  >
                    <CompanyLogo company={prog.company || prog.id} size={20} variant="icon" />
                    <span>Explore on {prog.company}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
