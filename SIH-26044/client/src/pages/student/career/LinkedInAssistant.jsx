import React, { useState } from 'react'
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Target,
  ShieldCheck,
  FileText,
  Briefcase,
  GraduationCap,
} from 'lucide-react'
import { Button, Alert } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'

const DEFAULT_FORM = {
  headline: '',
  about: '',
  skills: '',
  experience: '',
  education: '',
  projects: '',
  certifications: '',
  featured: '',
  targetRole: '',
  profileUrl: '',
}

const HEADLINE_TIPS = [
  'Lead with your exact target role (e.g. "Frontend Engineer").',
  'Feature 2–3 verified core technologies recruiters filter for.',
  'Include value-driven positioning (e.g. "Building Scalable Web Systems").',
  'Keep between 60–140 characters to avoid mobile truncation.',
]

const ABOUT_TIPS = [
  'Craft an engaging opening hook within the first 2–3 lines before "...see more".',
  'Substantiate claims with 1–2 concrete project or research highlights.',
  'Avoid empty buzzwords like "hardworking" or "passionate student".',
  'Conclude with an inviting Call to Action (e.g. "Open to SWE internships — connect at...").',
]

const SKILL_TIPS = [
  'Cross-reference skills with project descriptions to ensure authentic proof.',
  'Order skills by proficiency and align with target job descriptions.',
  'Maintain 12–25 focused technical skills rather than 50 unfocused keywords.',
  'Seek peer endorsements and course certifications for key tools.',
]

export const LinkedInAssistant = () => {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [showExtraFields, setShowExtraFields] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [openSections, setOpenSections] = useState({
    headline: true,
    about: true,
    skills: true,
    experience: false,
    projects: false,
    alignment: false,
  })

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
  }

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 1-Click Sync from AICP Profile Bundle
  const syncFromProfile = async () => {
    setSyncing(true)
    setError('')
    setSyncMessage('')
    try {
      const res = await careerAgentAPI.getProfile()
      const data = res.data?.data || {}
      const cp = data.careerProfile || {}
      const user = data.user || {}
      const portfolio = data.portfolio || {}

      const skillsCombined = [
        ...(user.skills || []),
        ...(Object.values(cp.skillsByCategory || {}).flat()),
      ]
      const uniqueSkills = [...new Set(skillsCombined.filter(Boolean))].join(', ')

      const experienceList = (cp.experience || []).map((e) => `${e.title || 'Role'} — ${e.company || ''} — ${e.description || ''}`).join('\n')
      const projectsList = (cp.projects || portfolio.projects || []).map((p) => `${p.title || 'Project'}: ${p.description || ''}`).join('\n')
      const certsList = (cp.certifications || portfolio.certifications || []).map((c) => c.name || c).join(', ')

      const primaryRole = cp.targetRoles?.[0] || ''
      const headlineGenerated = form.headline || (primaryRole ? `${primaryRole} | ${uniqueSkills.split(',').slice(0, 3).map((s) => s.trim()).join(' • ')}` : '')
      const aboutGenerated = form.about || portfolio.bio || ''

      setForm((prev) => ({
        ...prev,
        headline: headlineGenerated || prev.headline,
        about: aboutGenerated || prev.about,
        skills: uniqueSkills || prev.skills,
        experience: experienceList || prev.experience,
        projects: projectsList || prev.projects,
        certifications: certsList || prev.certifications,
        targetRole: primaryRole || prev.targetRole,
        profileUrl: portfolio.linkedin || cp.linkedin || prev.profileUrl,
      }))

      setSyncMessage('Successfully synced skills, projects, and target role from your AICP profile!')
      setShowExtraFields(true)
      setTimeout(() => setSyncMessage(''), 4000)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not sync AICP profile.')
    } finally {
      setSyncing(false)
    }
  }

  // Run Profile Audit
  const analyze = async () => {
    if (!form.headline.trim() && !form.about.trim() && !form.skills.trim()) {
      setError('Please provide at least your Headline, About, or Skills to begin the audit.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const payload = {
        headline: form.headline,
        about: form.about,
        skills: form.skills.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
        experience: form.experience ? form.experience.split('\n').map((l) => l.trim()).filter(Boolean) : [],
        education: form.education,
        projects: form.projects ? form.projects.split('\n').map((l) => l.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : [],
        featured: form.featured,
        targetRole: form.targetRole,
        profileUrl: form.profileUrl,
        isStudent: true,
      }

      const res = await careerAgentAPI.analyzeLinkedIn(payload)
      const auditData = res.data?.data || {}
      setAnalysis(auditData)

      // Open key sections with recommendations
      setOpenSections({
        headline: true,
        about: true,
        skills: true,
        experience: Boolean(auditData.analyzedSections?.experience?.entries?.length),
        projects: Boolean(auditData.analyzedSections?.projects?.projectCount),
        alignment: true,
      })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'LinkedIn audit failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="career-section linkedin-auditor-container">
      {/* Header */}
      <div className="career-section-header">
        <span className="section-label">AI LINKEDIN AUDITOR &amp; PROFILE OPTIMIZER</span>
        <h2>Professional LinkedIn Profile Audit &amp; Optimization</h2>
        <p className="career-muted">
          Evaluate your profile with recruiter-level scrutiny. Audit each section independently, detect unverified skill claims,
          inspect keyword discoverability, and generate tailored, authentic improvements with zero fabrication.
        </p>
      </div>

      {/* Profile Ingestion Form */}
      <div className="linkedin-form">
        <div className="linkedin-form-toolbar">
          <span className="linkedin-toolbar-title">Profile Information</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={syncFromProfile}
            loading={syncing}
            className="linkedin-sync-btn"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            Sync from My AICP Profile
          </Button>
        </div>

        {syncMessage && <Alert type="success" message={syncMessage} />}

        {/* Primary Fields */}
        <div className="linkedin-field">
          <label className="career-label">Target Career Role</label>
          <input
            className="linkedin-input"
            value={form.targetRole}
            onChange={(e) => update('targetRole', e.target.value)}
            placeholder="e.g. Frontend Developer, Machine Learning Engineer, Cloud Architect"
          />
          <span className="linkedin-field-hint">Used to evaluate keyword discoverability and role alignment.</span>
        </div>

        <div className="linkedin-field">
          <label className="career-label">Headline</label>
          <input
            className="linkedin-input"
            value={form.headline}
            onChange={(e) => update('headline', e.target.value)}
            placeholder="e.g. Full Stack Developer | React • Node.js • TypeScript | Building scalable web apps"
          />
          <div className="linkedin-char-counter">
            {form.headline.length}/220 characters
            {form.headline.length > 180 && <span className="char-warn"> (May truncate on mobile)</span>}
          </div>
        </div>

        <div className="linkedin-field">
          <label className="career-label">About / Summary</label>
          <textarea
            className="linkedin-textarea"
            value={form.about}
            onChange={(e) => update('about', e.target.value)}
            placeholder="Paste your LinkedIn About section or career summary…"
            rows={4}
          />
        </div>

        <div className="linkedin-field">
          <label className="career-label">Skills (comma-separated)</label>
          <textarea
            className="linkedin-textarea"
            value={form.skills}
            onChange={(e) => update('skills', e.target.value)}
            placeholder="e.g. Python, React, Node.js, Docker, MongoDB, REST APIs, Git"
            rows={2}
          />
        </div>

        {/* Additional Collapsible Sections */}
        <button
          type="button"
          className="linkedin-toggle-extra-btn"
          onClick={() => setShowExtraFields(!showExtraFields)}
        >
          {showExtraFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showExtraFields ? 'Hide Additional Sections' : 'Add Experience, Projects, Education & Featured Sections (Recommended)'}
        </button>

        {showExtraFields && (
          <div className="linkedin-extra-fields">
            <div className="linkedin-field">
              <label className="career-label">Experience (One per line: Title — Company — Description)</label>
              <textarea
                className="linkedin-textarea"
                value={form.experience}
                onChange={(e) => update('experience', e.target.value)}
                placeholder="e.g. Full Stack Intern — Acme Corp — Engineered responsive React dashboards and optimized API response times"
                rows={3}
              />
            </div>

            <div className="linkedin-field">
              <label className="career-label">Projects (One per line: Title: Description)</label>
              <textarea
                className="linkedin-textarea"
                value={form.projects}
                onChange={(e) => update('projects', e.target.value)}
                placeholder="e.g. Cloud Monitor: Built a distributed monitoring microservice with Node.js and Docker (github.com/username/monitor)"
                rows={3}
              />
            </div>

            <div className="linkedin-field-grid">
              <div className="linkedin-field">
                <label className="career-label">Education</label>
                <input
                  className="linkedin-input"
                  value={form.education}
                  onChange={(e) => update('education', e.target.value)}
                  placeholder="e.g. B.Tech Computer Science — State University (2025)"
                />
              </div>
              <div className="linkedin-field">
                <label className="career-label">Certifications (comma-separated)</label>
                <input
                  className="linkedin-input"
                  value={form.certifications}
                  onChange={(e) => update('certifications', e.target.value)}
                  placeholder="e.g. AWS Cloud Practitioner, Meta Frontend Specialist"
                />
              </div>
            </div>

            <div className="linkedin-field-grid">
              <div className="linkedin-field">
                <label className="career-label">Featured Section Items (links or titles)</label>
                <input
                  className="linkedin-input"
                  value={form.featured}
                  onChange={(e) => update('featured', e.target.value)}
                  placeholder="e.g. GitHub Repository, Published Article, Portfolio URL"
                />
              </div>
              <div className="linkedin-field">
                <label className="career-label">LinkedIn Profile URL</label>
                <input
                  className="linkedin-input"
                  value={form.profileUrl}
                  onChange={(e) => update('profileUrl', e.target.value)}
                  placeholder="e.g. https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>
        )}

        {error && <Alert type="error" message={error} />}

        <Button variant="nav" onClick={analyze} loading={loading} className="linkedin-analyze-btn">
          <Sparkles size={16} /> Run Full LinkedIn Audit
        </Button>
      </div>

      {/* ─── Audit Results ──────────────────────────────────────────────── */}
      {analysis && (
        <div className="linkedin-result">
          {/* Profile Score Hero */}
          <div className="linkedin-score-hero-pro">
            <div className="score-hero-left">
              <div className="score-circle-badge">
                <strong>{analysis.overallScore}</strong>
                <span className="score-scale">/100</span>
              </div>
              <div className="score-hero-meta">
                <h3>Overall LinkedIn Profile Score</h3>
                <p className="career-muted">
                  Audited across {Object.keys(analysis.sectionScores || {}).length} independent dimensions with recruiter-grade heuristics.
                </p>
                <div className="score-hero-pills">
                  <span className="hero-pill">
                    <strong>Completeness:</strong> {analysis.profileCompleteness}%
                  </span>
                  <span className={`hero-pill alignment-${(analysis.careerAlignment?.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                    <Target size={14} />
                    <strong>Alignment:</strong> {analysis.careerAlignment?.status || 'Active'}
                  </span>
                  <span className="hero-pill">
                    <ShieldCheck size={14} /> Zero Fabrication Verified
                  </span>
                </div>
              </div>
            </div>
            <div className="score-hero-right">
              <div className="score-radar-mini">
                <div className="radar-metric">
                  <span>Headline:</span>
                  <strong>{analysis.sectionScores?.headline ?? '—'}/100</strong>
                </div>
                <div className="radar-metric">
                  <span>About:</span>
                  <strong>{analysis.sectionScores?.about ?? '—'}/100</strong>
                </div>
                <div className="radar-metric">
                  <span>Skills:</span>
                  <strong>{analysis.sectionScores?.skills ?? '—'}/100</strong>
                </div>
                <div className="radar-metric">
                  <span>Projects:</span>
                  <strong>{analysis.sectionScores?.projects ?? '—'}/100</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Data Availability Banner */}
          <div className="linkedin-availability-card">
            <div className="availability-header">
              <AlertCircle size={16} color="#6655ee" />
              <span>Transparent Data Availability</span>
            </div>
            <p className="availability-desc">{analysis.availabilityDisclaimer}</p>
            <div className="availability-badges">
              {Object.entries(analysis.dataAvailability || {}).map(([key, available]) => (
                <span key={key} className={`avail-badge ${available ? 'evaluated' : 'omitted'}`}>
                  {available ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {key}: {available ? 'Evaluated' : 'Not Provided'}
                </span>
              ))}
            </div>
          </div>

          {/* Top 5 Priority Changes to Make Now */}
          {analysis.topPriorityImprovements?.length > 0 && (
            <div className="linkedin-priority-card">
              <div className="priority-card-header">
                <span className="section-label">ACTION PLAN</span>
                <h3>Top {analysis.topPriorityImprovements.length} Priority Changes to Make Now</h3>
                <p className="career-muted">Ordered by estimated impact on recruiter click-through rates and search indexing.</p>
              </div>
              <div className="priority-actions-list">
                {analysis.topPriorityImprovements.map((item, idx) => (
                  <div key={idx} className={`priority-action-item priority-${item.priority}`}>
                    <div className="priority-item-rank">
                      <span className={`priority-pill priority-pill-${item.priority}`}>
                        {item.priority === 'high' ? '🔴 High' : item.priority === 'medium' ? '🟠 Medium' : '🟢 Low'}
                      </span>
                      <span className="priority-section-tag">{item.section}</span>
                    </div>
                    <div className="priority-item-body">
                      <h4>{item.action}</h4>
                      <p className="priority-impact"><strong>Why it matters:</strong> {item.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Section-by-Section Accordion ─────────────────────────────── */}
          <div className="linkedin-sections-accordion">
            <div className="accordion-main-header">
              <span className="section-label">DETAILED AUDIT</span>
              <h3>Section-by-Section Deep Evaluation</h3>
            </div>

            {/* 1. Headline Section */}
            {analysis.analyzedSections?.headline && (
              <div className="audit-accordion-item">
                <div className="accordion-item-header" onClick={() => toggleSection('headline')}>
                  <div className="accordion-header-title">
                    <FileText size={18} color="#6655ee" />
                    <strong>Headline Analysis</strong>
                    <span className="score-pill">{analysis.analyzedSections.headline.score}/100</span>
                  </div>
                  {openSections.headline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSections.headline && (
                  <div className="accordion-item-content">
                    <p className="score-reason-text">{analysis.analyzedSections.headline.scoreReason}</p>

                    {/* Strengths & Issues */}
                    <div className="audit-lists-grid">
                      {analysis.analyzedSections.headline.strengths?.length > 0 && (
                        <div className="audit-list-box strengths">
                          <span className="list-box-title"><CheckCircle2 size={14} /> Strengths</span>
                          <ul>
                            {analysis.analyzedSections.headline.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {analysis.analyzedSections.headline.issues?.length > 0 && (
                        <div className="audit-list-box issues">
                          <span className="list-box-title"><AlertTriangle size={14} /> Areas to Optimize</span>
                          <ul>
                            {analysis.analyzedSections.headline.issues.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Before -> Problem -> Recommended -> Why */}
                    {analysis.analyzedSections.headline.beforeAfter && (
                      <div className="linkedin-diff-card">
                        <span className="diff-card-title">Before &amp; After Transformation</span>
                        <div className="diff-row current">
                          <span className="diff-label">CURRENT</span>
                          <p className="diff-content">{analysis.analyzedSections.headline.beforeAfter.current}</p>
                        </div>
                        <div className="diff-row problem">
                          <span className="diff-label">PROBLEM</span>
                          <p className="diff-content">{analysis.analyzedSections.headline.beforeAfter.problem}</p>
                        </div>
                        <div className="diff-row recommended">
                          <span className="diff-label">RECOMMENDED</span>
                          <div className="diff-content-with-copy">
                            <p className="diff-content font-semibold">{analysis.analyzedSections.headline.beforeAfter.recommended}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(analysis.analyzedSections.headline.beforeAfter.recommended, 'head-rec')}
                              className="copy-btn-mini"
                            >
                              {copiedId === 'head-rec' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              {copiedId === 'head-rec' ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                        <div className="diff-row why">
                          <span className="diff-label">WHY</span>
                          <p className="diff-content">{analysis.analyzedSections.headline.beforeAfter.why}</p>
                        </div>
                      </div>
                    )}

                    {/* Tailored Headline Options */}
                    {analysis.analyzedSections.headline.options?.length > 0 && (
                      <div className="headline-options-container">
                        <span className="options-title">Tailored Headline Alternatives (Grounded in Your Skills)</span>
                        <div className="options-grid">
                          {analysis.analyzedSections.headline.options.map((opt, i) => (
                            <div key={i} className="linkedin-option-box">
                              <div className="option-box-header">
                                <span className="option-style-badge">{opt.style}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(opt.headline, `head-opt-${i}`)}
                                  className="copy-btn-mini"
                                >
                                  {copiedId === `head-opt-${i}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                  {copiedId === `head-opt-${i}` ? 'Copied' : 'Copy'}
                                </Button>
                              </div>
                              <p className="option-text">{opt.headline}</p>
                              <span className="option-rationale">{opt.rationale}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. About Section */}
            {analysis.analyzedSections?.about && (
              <div className="audit-accordion-item">
                <div className="accordion-item-header" onClick={() => toggleSection('about')}>
                  <div className="accordion-header-title">
                    <FileText size={18} color="#6655ee" />
                    <strong>About / Summary Analysis</strong>
                    <span className="score-pill">{analysis.analyzedSections.about.score}/100</span>
                  </div>
                  {openSections.about ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSections.about && (
                  <div className="accordion-item-content">
                    <p className="score-reason-text">{analysis.analyzedSections.about.scoreReason}</p>

                    <div className="audit-lists-grid">
                      {analysis.analyzedSections.about.strengths?.length > 0 && (
                        <div className="audit-list-box strengths">
                          <span className="list-box-title"><CheckCircle2 size={14} /> Strengths</span>
                          <ul>
                            {analysis.analyzedSections.about.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {analysis.analyzedSections.about.issues?.length > 0 && (
                        <div className="audit-list-box issues">
                          <span className="list-box-title"><AlertTriangle size={14} /> Areas to Optimize</span>
                          <ul>
                            {analysis.analyzedSections.about.issues.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    {analysis.analyzedSections.about.beforeAfter && (
                      <div className="linkedin-diff-card">
                        <span className="diff-card-title">Before &amp; After Transformation</span>
                        <div className="diff-row current">
                          <span className="diff-label">CURRENT</span>
                          <p className="diff-content whitespace-pre-wrap">{analysis.analyzedSections.about.beforeAfter.current}</p>
                        </div>
                        <div className="diff-row problem">
                          <span className="diff-label">PROBLEM</span>
                          <p className="diff-content">{analysis.analyzedSections.about.beforeAfter.problem}</p>
                        </div>
                        <div className="diff-row recommended">
                          <span className="diff-label">RECOMMENDED DRAFT</span>
                          <div className="diff-content-with-copy">
                            <p className="diff-content whitespace-pre-wrap">{analysis.analyzedSections.about.beforeAfter.recommended}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(analysis.analyzedSections.about.beforeAfter.recommended, 'about-rec')}
                              className="copy-btn-mini"
                            >
                              {copiedId === 'about-rec' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              {copiedId === 'about-rec' ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                        <div className="diff-row why">
                          <span className="diff-label">WHY</span>
                          <p className="diff-content">{analysis.analyzedSections.about.beforeAfter.why}</p>
                        </div>
                      </div>
                    )}

                    {analysis.analyzedSections.about.options?.length > 0 && (
                      <div className="headline-options-container">
                        <span className="options-title">Alternative About Section Formats</span>
                        <div className="options-grid">
                          {analysis.analyzedSections.about.options.map((opt, i) => (
                            <div key={i} className="linkedin-option-box">
                              <div className="option-box-header">
                                <span className="option-style-badge">{opt.style}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(opt.content, `about-opt-${i}`)}
                                  className="copy-btn-mini"
                                >
                                  {copiedId === `about-opt-${i}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                  {copiedId === `about-opt-${i}` ? 'Copied' : 'Copy'}
                                </Button>
                              </div>
                              <p className="option-text whitespace-pre-wrap">{opt.content}</p>
                              <span className="option-rationale">{opt.rationale}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Skills & Evidence Mapping Section */}
            {analysis.analyzedSections?.skills && (
              <div className="audit-accordion-item">
                <div className="accordion-item-header" onClick={() => toggleSection('skills')}>
                  <div className="accordion-header-title">
                    <ShieldCheck size={18} color="#6655ee" />
                    <strong>Skills &amp; Evidence Mapping</strong>
                    <span className="score-pill">{analysis.analyzedSections.skills.score}/100</span>
                  </div>
                  {openSections.skills ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSections.skills && (
                  <div className="accordion-item-content">
                    <p className="score-reason-text">{analysis.analyzedSections.skills.scoreReason}</p>

                    {/* Evidence Badges */}
                    <div className="evidence-mapping-container">
                      <div className="evidence-column">
                        <div className="evidence-col-header verified">
                          <CheckCircle2 size={16} color="#10b981" />
                          <strong>Verified with Evidence ({analysis.analyzedSections.skills.verifiedSkills?.length || 0})</strong>
                        </div>
                        <p className="evidence-col-hint">These skills are backed by concrete mentions in your projects or experience.</p>
                        <div className="evidence-tags-list">
                          {(analysis.analyzedSections.skills.verifiedSkills || []).map((v, i) => (
                            <span key={i} className="evidence-badge verified" title={v.evidenceNote}>
                              <CheckCircle2 size={12} /> {v.skill}
                            </span>
                          ))}
                          {(!analysis.analyzedSections.skills.verifiedSkills || analysis.analyzedSections.skills.verifiedSkills.length === 0) && (
                            <span className="career-muted text-sm">No skills cross-referenced with project evidence yet.</span>
                          )}
                        </div>
                      </div>

                      <div className="evidence-column">
                        <div className="evidence-col-header unverified">
                          <AlertTriangle size={16} color="#f59e0b" />
                          <strong>Unverified Claims ({analysis.analyzedSections.skills.unverifiedSkills?.length || 0})</strong>
                        </div>
                        <p className="evidence-col-hint">Claimed in your skills list, but not supported by visible projects or work bullets.</p>
                        <div className="evidence-tags-list">
                          {(analysis.analyzedSections.skills.unverifiedSkills || []).map((u, i) => (
                            <span key={i} className="evidence-badge unverified" title={u.recommendation}>
                              <AlertCircle size={12} /> {u.skill}
                            </span>
                          ))}
                          {(!analysis.analyzedSections.skills.unverifiedSkills || analysis.analyzedSections.skills.unverifiedSkills.length === 0) && (
                            <span className="career-muted text-sm">All claimed skills are corroborated by project evidence!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Missing Target Skills */}
                    {analysis.analyzedSections.skills.missingTargetSkills?.length > 0 && (
                      <div className="missing-target-skills-box">
                        <span className="missing-box-label">Recommended Core Skills for {analysis.targetRole}</span>
                        <p className="career-muted text-sm">Recruiters actively filter candidates for these high-frequency competencies:</p>
                        <div className="missing-skills-tags">
                          {analysis.analyzedSections.skills.missingTargetSkills.map((s, i) => (
                            <span key={i} className="missing-skill-pill">+ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. Experience Section (Evaluated Individually) */}
            {analysis.analyzedSections?.experience && (
              <div className="audit-accordion-item">
                <div className="accordion-item-header" onClick={() => toggleSection('experience')}>
                  <div className="accordion-header-title">
                    <Briefcase size={18} color="#6655ee" />
                    <strong>Experience Entries (Individual Evaluation)</strong>
                    <span className="score-pill">{analysis.analyzedSections.experience.score}/100</span>
                  </div>
                  {openSections.experience ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSections.experience && (
                  <div className="accordion-item-content">
                    <p className="score-reason-text">{analysis.analyzedSections.experience.scoreReason}</p>

                    {analysis.analyzedSections.experience.entries?.length === 0 && (
                      <p className="career-muted text-sm">No experience entries provided. Add internships or project leadership to receive role-by-role evaluations.</p>
                    )}

                    {analysis.analyzedSections.experience.entries?.map((entry) => (
                      <div key={entry.id} className="experience-role-audit-card">
                        <div className="role-audit-header">
                          <div>
                            <h4>{entry.title} {entry.company ? `at ${entry.company}` : ''}</h4>
                            <span className="role-score-label">Role Quality Score: <strong>{entry.score}/100</strong></span>
                          </div>
                          <div className="role-badges">
                            {entry.actionVerbsFound?.length > 0 ? (
                              <span className="role-badge green">Action Verbs: {entry.actionVerbsFound.join(', ')}</span>
                            ) : (
                              <span className="role-badge red">Needs Action Verbs</span>
                            )}
                            {entry.hasMetrics ? (
                              <span className="role-badge green">Quantifiable Impact</span>
                            ) : (
                              <span className="role-badge yellow">Missing Metrics</span>
                            )}
                          </div>
                        </div>

                        {entry.beforeAfter && (
                          <div className="linkedin-diff-card role-diff">
                            <div className="diff-row current">
                              <span className="diff-label">CURRENT</span>
                              <p className="diff-content">{entry.beforeAfter.current}</p>
                            </div>
                            <div className="diff-row problem">
                              <span className="diff-label">PROBLEM</span>
                              <p className="diff-content">{entry.beforeAfter.problem}</p>
                            </div>
                            <div className="diff-row recommended">
                              <span className="diff-label">ACHIEVEMENT FRAMING</span>
                              <div className="diff-content-with-copy">
                                <p className="diff-content">{entry.beforeAfter.recommended}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopy(entry.beforeAfter.recommended, `exp-rec-${entry.id}`)}
                                  className="copy-btn-mini"
                                >
                                  {copiedId === `exp-rec-${entry.id}` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                                  {copiedId === `exp-rec-${entry.id}` ? 'Copied' : 'Copy'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Projects & Education */}
            <div className="audit-accordion-item">
              <div className="accordion-item-header" onClick={() => toggleSection('projects')}>
                <div className="accordion-header-title">
                  <GraduationCap size={18} color="#6655ee" />
                  <strong>Projects, Education &amp; Featured Sections</strong>
                  <span className="score-pill">
                    {Math.round(
                      ((analysis.sectionScores?.projects || 0) +
                        (analysis.sectionScores?.education || 0) +
                        (analysis.sectionScores?.featured || 0)) / 3
                    )}/100
                  </span>
                </div>
                {openSections.projects ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {openSections.projects && (
                <div className="accordion-item-content">
                  <div className="aux-sections-grid">
                    <div className="aux-section-box">
                      <div className="aux-box-header">
                        <strong>Technical Projects</strong>
                        <span className="score-pill-mini">{analysis.sectionScores?.projects ?? '—'}/100</span>
                      </div>
                      <p className="text-sm career-muted">{analysis.analyzedSections?.projects?.scoreReason}</p>
                      <ul className="aux-list">
                        {(analysis.analyzedSections?.projects?.strengths || []).map((s, i) => <li key={i} className="green">{s}</li>)}
                        {(analysis.analyzedSections?.projects?.issues || []).map((s, i) => <li key={i} className="orange">{s}</li>)}
                      </ul>
                    </div>

                    <div className="aux-section-box">
                      <div className="aux-box-header">
                        <strong>Education &amp; Academics</strong>
                        <span className="score-pill-mini">{analysis.sectionScores?.education ?? '—'}/100</span>
                      </div>
                      <p className="text-sm career-muted">{analysis.analyzedSections?.education?.scoreReason}</p>
                      <ul className="aux-list">
                        {(analysis.analyzedSections?.education?.strengths || []).map((s, i) => <li key={i} className="green">{s}</li>)}
                        {(analysis.analyzedSections?.education?.issues || []).map((s, i) => <li key={i} className="orange">{s}</li>)}
                      </ul>
                    </div>

                    <div className="aux-section-box">
                      <div className="aux-box-header">
                        <strong>Featured Section</strong>
                        <span className="score-pill-mini">{analysis.sectionScores?.featured ?? '—'}/100</span>
                      </div>
                      <p className="text-sm career-muted">{analysis.analyzedSections?.featured?.scoreReason}</p>
                      <ul className="aux-list">
                        {(analysis.analyzedSections?.featured?.strengths || []).map((s, i) => <li key={i} className="green">{s}</li>)}
                        {(analysis.analyzedSections?.featured?.issues || []).map((s, i) => <li key={i} className="orange">{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Career Alignment */}
            {analysis.careerAlignment && (
              <div className="audit-accordion-item">
                <div className="accordion-item-header" onClick={() => toggleSection('alignment')}>
                  <div className="accordion-header-title">
                    <Target size={18} color="#6655ee" />
                    <strong>Career Alignment &amp; Positioning ({analysis.targetRole})</strong>
                    <span className="score-pill">{analysis.careerAlignment.score}/100</span>
                  </div>
                  {openSections.alignment ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openSections.alignment && (
                  <div className="accordion-item-content">
                    <div className="career-alignment-box">
                      <div className="alignment-status-banner">
                        <span className="alignment-label">Current Positioning:</span>
                        <strong className="alignment-badge">{analysis.careerAlignment.status}</strong>
                      </div>
                      <p className="alignment-reason">{analysis.careerAlignment.reason}</p>
                      {analysis.careerAlignment.advice && (
                        <p className="alignment-advice"><strong>Strategic Guidance:</strong> {analysis.careerAlignment.advice}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Ultra-Pro Professional Insights ──────────────────────────── */}
          {analysis.professionalInsights?.length > 0 && (
            <div className="professional-insights-section">
              <div className="insights-header">
                <span className="section-label">STRATEGY INTELLIGENCE</span>
                <h3>Professional LinkedIn Optimization Insights</h3>
                <p className="career-muted">Advanced recruiter psychology, search discoverability algorithms, and evidence branding.</p>
              </div>
              <div className="professional-insights-grid">
                {analysis.professionalInsights.map((ins, i) => (
                  <div key={i} className="pro-insight-card">
                    <div className="insight-card-top">
                      <h4>{ins.title}</h4>
                      <span className={`insight-status-tag status-${ins.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {ins.status}
                      </span>
                    </div>
                    <p className="insight-explanation">{ins.explanation}</p>
                    <div className="insight-action-box">
                      <span className="action-box-label">Recommended Action:</span>
                      <p className="action-box-text">{ins.actionItem}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference Tips Grid */}
          <div className="linkedin-tips-grid">
            <div className="linkedin-tips-col">
              <span className="section-label">HEADLINE PRINCIPLES</span>
              <ul>{HEADLINE_TIPS.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="linkedin-tips-col">
              <span className="section-label">ABOUT PRINCIPLES</span>
              <ul>{ABOUT_TIPS.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
            <div className="linkedin-tips-col">
              <span className="section-label">SKILLS PRINCIPLES</span>
              <ul>{SKILL_TIPS.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LinkedInAssistant
