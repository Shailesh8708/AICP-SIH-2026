import React, { useState } from 'react'
import {
  Sparkles,
  Github,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Layers,
  Calendar,
  FolderTree,
  FileText,
  Plus,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  X,
  Star,
  GitFork,
  CheckCheck,
} from 'lucide-react'
import { Button, Alert } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'

const EXTERNAL_DOMAINS = [
  'google.com', 'facebook.com', 'linkedin.com', 'twitter.com', 'x.com',
  'instagram.com', 'youtube.com', 'gitlab.com', 'bitbucket.org', 'medium.com',
]

export const GitHubAnalyzer = () => {
  const [usernameInput, setUsernameInput] = useState('')
  const [targetRoleInput, setTargetRoleInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  // Modals state
  const [activeBlueprint, setActiveBlueprint] = useState(null)
  const [blueprintTab, setBlueprintTab] = useState('overview')
  const [createRepoProject, setCreateRepoProject] = useState(null)

  // Repo creation state
  const [repoConfig, setRepoConfig] = useState({
    token: '',
    repoName: '',
    description: '',
    isPrivate: false,
  })
  const [creatingRepo, setCreatingRepo] = useState(false)
  const [repoCreationResult, setRepoCreationResult] = useState(null)
  const [repoCreationError, setRepoCreationError] = useState('')

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 1-Click Sync from AICP Profile
  const syncFromAICP = async () => {
    setSyncing(true)
    setError('')
    setSyncMessage('')
    try {
      const res = await careerAgentAPI.getProfile()
      const data = res.data?.data || {}
      const cp = data.careerProfile || {}
      const portfolio = data.portfolio || {}

      const ghUrl = portfolio.github || cp.github || ''
      const role = cp.targetRoles?.[0] || ''

      if (ghUrl) setUsernameInput(ghUrl)
      if (role) setTargetRoleInput(role)

      if (ghUrl || role) {
        setSyncMessage(`Synced ${[ghUrl && 'GitHub URL', role && `Target Role (${role})`].filter(Boolean).join(' and ')} from your AICP profile!`)
      } else {
        setSyncMessage('No GitHub profile or target role found on file. Please enter them below.')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not sync from AICP profile.')
    } finally {
      setSyncing(false)
    }
  }

  // Input validation
  const validateInput = (input) => {
    if (!input || !input.trim()) return 'GitHub profile URL or username is required.'
    const lower = input.trim().toLowerCase()
    for (const domain of EXTERNAL_DOMAINS) {
      if (lower.includes(domain)) {
        return `"${domain}" is not a GitHub domain. Please enter a valid GitHub profile URL (e.g. https://github.com/username).`
      }
    }
    return null
  }

  const analyze = async () => {
    const valErr = validateInput(usernameInput)
    if (valErr) {
      setError(valErr)
      return
    }

    setLoading(true)
    setError('')
    setSyncMessage('')
    setResult(null)

    try {
      const res = await careerAgentAPI.analyzeGitHub({
        githubUrl: usernameInput.trim(),
        targetRole: targetRoleInput.trim(),
        syncFromAicp: false,
      })

      if (res?.data?.success) {
        setResult(res.data.data)
      } else if (res?.success) {
        setResult(res.data)
      } else {
        setError(res?.data?.message || 'Analysis failed. Check your GitHub username and try again.')
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'GitHub analysis unavailable.'
      const suggestions = err?.response?.data?.suggestions
      if (suggestions?.length) {
        setError(`${errMsg} Suggested roles: ${suggestions.join(', ')}`)
      } else {
        setError(errMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Open Creation Dialog for a project
  const openCreateDialog = (project) => {
    const slug = (project.title || 'new-project')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setRepoConfig({
      token: '',
      repoName: slug,
      description: project.whyThisProject || project.title || '',
      isPrivate: false,
    })
    setRepoCreationResult(null)
    setRepoCreationError('')
    setCreateRepoProject(project)
  }

  const handleCreateRepository = async () => {
    if (!repoConfig.token.trim()) {
      setRepoCreationError('GitHub Personal Access Token is required for direct API creation. Alternatively, use "Pre-fill on GitHub" below.')
      return
    }

    setCreatingRepo(true)
    setRepoCreationError('')
    try {
      const res = await careerAgentAPI.createGitHubRepo({
        token: repoConfig.token.trim(),
        repoName: repoConfig.repoName.trim(),
        description: repoConfig.description.trim(),
        isPrivate: repoConfig.isPrivate,
        projectData: {
          name: createRepoProject?.title,
          whyThisProject: createRepoProject?.whyThisProject,
          readmeContent: createRepoProject?.readmeContent,
        },
      })

      if (res?.data?.success) {
        setRepoCreationResult(res.data.data)
      } else {
        setRepoCreationError(res?.data?.message || 'Failed to create repository.')
      }
    } catch (err) {
      setRepoCreationError(err?.response?.data?.message || err?.message || 'GitHub API repository creation failed.')
    } finally {
      setCreatingRepo(false)
    }
  }

  const handlePrefillGitHub = (project) => {
    const slug = (project?.title || 'new-project')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const desc = encodeURIComponent(project?.whyThisProject || project?.title || '')
    window.open(`https://github.com/new?name=${encodeURIComponent(slug)}&description=${desc}`, '_blank')
  }

  return (
    <div className="career-section github-intel-container">
      {/* Header */}
      <div className="career-section-header">
        <span className="section-label">AI GITHUB CAREER &amp; PROJECT INTELLIGENCE</span>
        <h2>GitHub Profile Analysis &amp; Personalized Project Blueprints</h2>
        <p className="career-muted">
          Audit your public repositories with recruiter-level intelligence. Detect portfolio gaps, evaluate code freshness
          and language depth, receive anti-duplicate project blueprints, and scaffold repositories with 1-click execution.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="github-form-card">
        <div className="github-form-toolbar">
          <span className="github-toolbar-title">
            <Github size={18} /> GitHub Profile &amp; Career Target
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={syncFromAICP}
            loading={syncing}
            className="github-sync-btn"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            Sync from My AICP Profile
          </Button>
        </div>

        {syncMessage && <Alert type="success" message={syncMessage} />}
        {error && <Alert type="error" message={error} />}

        <div className="github-inputs-row">
          <div className="github-field">
            <label className="github-field-label">Target Career Role</label>
            <input
              className="github-input"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g. Full Stack Developer, Frontend Engineer, Machine Learning Engineer"
            />
            <span className="github-field-hint">
              Aligns project recommendations and gap analysis directly with industry expectations.
            </span>
          </div>

          <div className="github-field">
            <label className="github-field-label">GitHub Profile URL or Username *</label>
            <input
              className="github-input"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. https://github.com/octocat or octocat"
            />
            <span className="github-field-hint">
              Only public GitHub API data is accessed. Zero private repository code is ever viewed or stored.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="nav"
            onClick={analyze}
            loading={loading}
            disabled={!usernameInput.trim()}
          >
            <Sparkles size={16} /> Analyze GitHub &amp; Generate Blueprints
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="github-result">
          {/* Rate Limit Warning Banner if GitHub API was throttled */}
          {result.rateLimited && (
            <Alert
              type="warning"
              message="GitHub Public API rate limit reached. Analysis was generated using verified public signals and cached portfolio data."
            />
          )}

          {/* Hero Pro */}
          <div className="github-hero-pro">
            <div className="github-hero-left">
              <div className="github-score-circle">
                <strong>{result.overallScore ?? '—'}</strong>
                <span className="score-sub">/ 100</span>
              </div>
              <div className="github-hero-details">
                <h3>{result.profileOverview?.name || result.profileOverview?.username || 'Developer Portfolio'}</h3>
                <p className="career-muted" style={{ fontSize: '0.85rem', margin: '3px 0' }}>
                  {result.profileOverview?.bio || 'Developer profile analyzed via GitHub public API.'}
                </p>
                <div className="github-hero-pills">
                  {result.profileOverview?.username && (
                    <a
                      href={`https://github.com/${result.profileOverview.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-pill target-pill"
                    >
                      <Github size={13} /> github.com/{result.profileOverview.username} <ExternalLink size={11} />
                    </a>
                  )}
                  <span className="github-pill">
                    <Layers size={13} /> {result.profileOverview?.publicRepos ?? 0} Repositories
                  </span>
                  <span className="github-pill">
                    <Star size={13} /> {result.topRepositories?.reduce((acc, r) => acc + (r.stars || 0), 0) ?? 0} Stars
                  </span>
                  <span className={`github-pill ${
                    result.overallScore >= 75
                      ? 'status-pill-high'
                      : result.overallScore >= 50
                      ? 'status-pill-med'
                      : 'status-pill-low'
                  }`}>
                    {result.overallScore >= 75 ? 'Recruiter Ready' : result.overallScore >= 50 ? 'Competitive Base' : 'Needs Key Projects'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Radar Breakdown */}
            <div className="github-hero-right">
              <div className="github-metrics-grid">
                {[
                  { label: 'Profile Quality', val: result.scoreBreakdown?.profileQuality },
                  { label: 'Repo Quality', val: result.scoreBreakdown?.repoQuality },
                  { label: 'Language Breadth', val: result.scoreBreakdown?.breadth },
                  { label: 'Engineering Depth', val: result.scoreBreakdown?.depth },
                  { label: 'Role Alignment', val: result.scoreBreakdown?.roleAlignment },
                  { label: 'Commit Freshness', val: result.scoreBreakdown?.freshness },
                ].map((item) => (
                  <div key={item.label} className="github-metric-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="github-metric-label">{item.label}</span>
                      <span className="github-metric-val">{item.val ?? '—'}</span>
                    </div>
                    <div className="github-metric-bar">
                      <div
                        className="github-metric-fill"
                        style={{
                          width: `${item.val ?? 0}%`,
                          backgroundColor:
                            (item.val ?? 0) >= 70 ? '#10b981' : (item.val ?? 0) >= 45 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Languages Section */}
          {result.languagesUsed?.length > 0 && (
            <div className="github-section-card">
              <div className="github-section-head">
                <span className="github-section-title">
                  <Code2 size={18} /> Verified Programming Languages
                </span>
                <span className="career-muted" style={{ fontSize: '0.8rem' }}>
                  Aggregated across public repositories
                </span>
              </div>
              <div className="skill-tags">
                {result.languagesUsed.map((lang) => (
                  <span key={lang} className="skill-tag strong">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Gaps & Strategic Balance */}
          {result.portfolioGaps && (
            <div className="github-section-card">
              <div className="github-section-head">
                <span className="github-section-title">
                  <ShieldCheck size={18} /> Portfolio Gap Analysis &amp; Strategic Balance
                </span>
                <span className="career-muted" style={{ fontSize: '0.8rem' }}>
                  Comparing GitHub signals with industry recruiter benchmarks
                </span>
              </div>

              <div className="github-gaps-grid">
                {/* Existing Strengths */}
                <div className="github-gap-box strengths">
                  <span className="gap-box-title">
                    <CheckCircle2 size={16} /> Existing Strengths
                  </span>
                  <ul className="gap-items-list">
                    {result.portfolioGaps.strengths?.length > 0 ? (
                      result.portfolioGaps.strengths.map((s, idx) => (
                        <li key={idx} className="gap-item-line">
                          <span>•</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="gap-item-line">• Active profile verified.</li>
                    )}
                  </ul>
                </div>

                {/* Missing Evidence */}
                <div className="github-gap-box missing">
                  <span className="gap-box-title">
                    <AlertTriangle size={16} /> Missing Evidence
                  </span>
                  <ul className="gap-items-list">
                    {result.portfolioGaps.missingEvidence?.length > 0 ? (
                      result.portfolioGaps.missingEvidence.map((m, idx) => (
                        <li key={idx} className="gap-item-line">
                          <span>•</span>
                          <span>{m}</span>
                        </li>
                      ))
                    ) : (
                      <li className="gap-item-line">• No critical evidence missing.</li>
                    )}
                  </ul>
                </div>

                {/* Underrepresented Skills */}
                <div className="github-gap-box underrep">
                  <span className="gap-box-title">
                    <Layers size={16} /> Underrepresented Skills
                  </span>
                  <ul className="gap-items-list">
                    {result.portfolioGaps.underrepresentedSkills?.length > 0 ? (
                      result.portfolioGaps.underrepresentedSkills.map((u, idx) => (
                        <li key={idx} className="gap-item-line">
                          <span>•</span>
                          <span>{u}</span>
                        </li>
                      ))
                    ) : (
                      <li className="gap-item-line">• Well-balanced technical representation.</li>
                    )}
                  </ul>
                </div>

                {/* Redundant Areas */}
                <div className="github-gap-box redundant">
                  <span className="gap-box-title">
                    <AlertCircle size={16} /> Redundant / Low-Signal Areas
                  </span>
                  <ul className="gap-items-list">
                    {result.portfolioGaps.redundantAreas?.length > 0 ? (
                      result.portfolioGaps.redundantAreas.map((r, idx) => (
                        <li key={idx} className="gap-item-line">
                          <span>•</span>
                          <span>{r}</span>
                        </li>
                      ))
                    ) : (
                      <li className="gap-item-line">• High signal-to-noise ratio across repositories.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Top Repositories Breakdown */}
          {result.topRepositories?.length > 0 && (
            <div className="github-section-card">
              <div className="github-section-head">
                <span className="github-section-title">
                  <Github size={18} /> Public Repositories Audit
                </span>
                <span className="career-muted" style={{ fontSize: '0.8rem' }}>
                  {result.topRepositories.length} repositories evaluated for quality, READMEs, and completeness
                </span>
              </div>

              <div className="github-repos-grid">
                {result.topRepositories.map((repo) => (
                  <div
                    key={repo.name}
                    className={`github-repo-card ${repo.isUnfinished ? 'repo-unfinished' : ''}`}
                  >
                    <div className="repo-header">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="repo-name-link"
                      >
                        {repo.name} <ExternalLink size={12} />
                      </a>
                      <span
                        className={`repo-score-badge ${
                          repo.score >= 70 ? 'high' : repo.score >= 45 ? 'med' : 'low'
                        }`}
                      >
                        {repo.score}/100
                      </span>
                    </div>

                    <p className="repo-desc">
                      {repo.description || (
                        <span style={{ color: '#d97706', fontStyle: 'italic' }}>
                          ⚠️ Missing repository description
                        </span>
                      )}
                    </p>

                    {repo.isUnfinished && (
                      <div style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> Appears to be a test/demo repository
                      </div>
                    )}

                    <div className="repo-footer">
                      <span style={{ fontWeight: 600, color: '#4f46e5' }}>
                        {repo.language || 'Unspecified'}
                      </span>
                      <div className="repo-meta-group">
                        <span className="repo-meta-item">
                          <Star size={12} /> {repo.stars ?? 0}
                        </span>
                        <span className="repo-meta-item">
                          <GitFork size={12} /> {repo.forks ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anti-Duplicate Personalized Project Recommendations */}
          {result.recommendedProjects?.length > 0 && (
            <div className="github-section-card">
              <div className="github-section-head">
                <span className="github-section-title">
                  <Sparkles size={18} /> Recommended High-Impact Projects (Anti-Duplicate)
                </span>
                <span className="career-muted" style={{ fontSize: '0.8rem' }}>
                  Targeted to fill your portfolio gaps • Cross-verified against your existing repositories
                </span>
              </div>

              <div className="github-rec-grid">
                {result.recommendedProjects.map((project) => (
                  <div key={project.id || project.title} className="github-rec-card">
                    <div className="rec-card-top">
                      <div className="rec-title-group">
                        <h4>{project.title}</h4>
                        <div className="rec-badges">
                          <span className="rec-badge domain">{project.domain}</span>
                          <span className="rec-badge difficulty">{project.difficulty}</span>
                          <span className="rec-badge hours">~{project.estimatedHours} hrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="rec-why">
                      <strong>Why Build This:</strong> {project.whyThisProject}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                        Recruiter Hiring Value:
                      </span>
                      <p style={{ fontSize: '0.82rem', color: '#1e293b', margin: '2px 0 8px 0' }}>
                        {project.recruiterValue}
                      </p>
                    </div>

                    {project.keyFeatures?.length > 0 && (
                      <div className="rec-features-list">
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                          Key Engineering Highlights:
                        </span>
                        {project.keyFeatures.map((feat, i) => (
                          <div key={i} className="rec-feature-item">
                            <CheckCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {project.recommendedTechStack?.length > 0 && (
                      <div className="rec-stack-tags">
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                          Tech Stack:
                        </span>
                        {project.recommendedTechStack.map((tech) => (
                          <span key={tech} className="rec-stack-tag">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="rec-actions-bar">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrefillGitHub(project)}
                      >
                        <ExternalLink size={14} /> Pre-fill on GitHub
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openCreateDialog(project)}
                      >
                        <Plus size={14} /> Create Repository
                      </Button>
                      <Button
                        type="button"
                        variant="nav"
                        size="sm"
                        onClick={() => {
                          setActiveBlueprint(project)
                          setBlueprintTab('overview')
                        }}
                      >
                        <FileText size={14} /> View Blueprint &amp; Scaffolding
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          {result.topActions?.length > 0 && (
            <div className="github-section-card">
              <div className="github-section-head">
                <span className="github-section-title">
                  <AlertCircle size={18} /> Top Priority Action Items
                </span>
                <span className="career-muted" style={{ fontSize: '0.8rem' }}>
                  High-impact optimizations to increase recruiter outreach
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.topActions.map((action, i) => (
                  <div key={i} className="analyzer-rec-item" style={{ fontSize: '0.85rem' }}>
                    <CheckCircle2 size={15} color="#6655ee" style={{ flexShrink: 0 }} /> {action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strict Zero Fabrication Disclaimer */}
          <p className="career-disclaimer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#10b981" /> {result.disclaimer}
          </p>
        </div>
      )}

      {/* ─── MODAL 1: Interactive Project Blueprint Modal ─── */}
      {activeBlueprint && (
        <div className="blueprint-modal-backdrop" onClick={() => setActiveBlueprint(null)}>
          <div className="blueprint-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="blueprint-modal-head">
              <h3>
                <FileText size={18} color="#4f46e5" /> {activeBlueprint.title} Blueprint
              </h3>
              <button className="blueprint-modal-close" onClick={() => setActiveBlueprint(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="blueprint-tabs-bar">
              <button
                className={`blueprint-tab-btn ${blueprintTab === 'overview' ? 'active' : ''}`}
                onClick={() => setBlueprintTab('overview')}
              >
                <Layers size={14} /> Architecture &amp; Overview
              </button>
              <button
                className={`blueprint-tab-btn ${blueprintTab === 'roadmap' ? 'active' : ''}`}
                onClick={() => setBlueprintTab('roadmap')}
              >
                <Calendar size={14} /> 5-Phase Roadmap
              </button>
              <button
                className={`blueprint-tab-btn ${blueprintTab === 'scaffolding' ? 'active' : ''}`}
                onClick={() => setBlueprintTab('scaffolding')}
              >
                <FolderTree size={14} /> Directory Scaffolding
              </button>
              <button
                className={`blueprint-tab-btn ${blueprintTab === 'readme' ? 'active' : ''}`}
                onClick={() => setBlueprintTab('readme')}
              >
                <FileText size={14} /> Professional README.md
              </button>
            </div>

            {/* Tab Contents */}
            <div className="blueprint-modal-body">
              {blueprintTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="rec-why">
                    <strong>Problem Statement &amp; Hiring Signal:</strong>
                    <p style={{ margin: '4px 0 0 0' }}>{activeBlueprint.whyThisProject}</p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                      System Architecture:
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {activeBlueprint.blueprint?.architecture}
                    </p>
                  </div>

                  {activeBlueprint.blueprint?.databaseSchema && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                        Database Schema &amp; Data Model:
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {activeBlueprint.blueprint.databaseSchema}
                      </p>
                    </div>
                  )}

                  {activeBlueprint.blueprint?.apiEndpoints?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                        Key API Endpoints &amp; Contracts:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {activeBlueprint.blueprint.apiEndpoints.map((ep, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              background: '#f1f5f9',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              color: '#1e293b',
                            }}
                          >
                            {ep}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {blueprintTab === 'roadmap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Follow this 5-phase structured roadmap to iteratively build and deploy this project to production:
                  </p>
                  {activeBlueprint.blueprint?.roadmap?.map((phase, idx) => (
                    <div key={idx} className="roadmap-phase-card">
                      <div className="roadmap-phase-head">
                        <strong>{phase.phase}</strong>
                        <span className="roadmap-phase-duration">{phase.duration}</span>
                      </div>
                      <ul style={{ paddingLeft: '18px', margin: '4px 0 0 0', fontSize: '0.82rem', color: '#475569' }}>
                        {phase.tasks?.map((task, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '2px' }}>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {blueprintTab === 'scaffolding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Recommended Repository Scaffolding:
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(activeBlueprint.blueprint?.scaffoldingTree, 'scaffolding')}
                    >
                      {copiedId === 'scaffolding' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      {copiedId === 'scaffolding' ? 'Copied!' : 'Copy Tree'}
                    </Button>
                  </div>
                  <div className="blueprint-code-pane">
                    {activeBlueprint.blueprint?.scaffoldingTree || 'scaffolding/'}
                  </div>
                </div>
              )}

              {blueprintTab === 'readme' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                      Generated Production-Grade README.md:
                    </span>
                    <Button
                      size="sm"
                      variant="nav"
                      onClick={() => handleCopy(activeBlueprint.readmeContent, 'readme')}
                    >
                      {copiedId === 'readme' ? <Check size={14} color="#fff" /> : <Copy size={14} />}
                      {copiedId === 'readme' ? 'Copied README!' : 'Copy README.md'}
                    </Button>
                  </div>
                  <div className="blueprint-code-pane">
                    {activeBlueprint.readmeContent}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="blueprint-modal-footer">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrefillGitHub(activeBlueprint)}
              >
                <ExternalLink size={14} /> Pre-fill on GitHub
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    openCreateDialog(activeBlueprint)
                    setActiveBlueprint(null)
                  }}
                >
                  <Plus size={14} /> Create Repo Dialog
                </Button>
                <Button
                  variant="nav"
                  size="sm"
                  onClick={() => setActiveBlueprint(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: User-Confirmed GitHub Repository Creation ─── */}
      {createRepoProject && (
        <div className="blueprint-modal-backdrop" onClick={() => setCreateRepoProject(null)}>
          <div className="create-repo-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="blueprint-modal-head">
              <h3>
                <Github size={18} /> Create GitHub Repository
              </h3>
              <button className="blueprint-modal-close" onClick={() => setCreateRepoProject(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="blueprint-modal-body">
              {repoCreationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Alert
                    type="success"
                    message={`Repository "${repoCreationResult.repoName}" created successfully on GitHub!`}
                  />
                  <div>
                    <a
                      href={repoCreationResult.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-profile-link"
                      style={{ fontSize: '1rem', fontWeight: 700 }}
                    >
                      {repoCreationResult.repoUrl} <ExternalLink size={15} />
                    </a>
                  </div>

                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '8px 0 4px 0' }}>
                      Get Started Locally:
                    </h5>
                    <div className="blueprint-code-pane">
                      {`git clone ${repoCreationResult.cloneUrl}\ncd ${repoCreationResult.repoName}\n# Follow Phase 1 in your AICP Blueprint Roadmap`}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                    Confirm repository details to initialize this project on your GitHub account with the professional README attached:
                  </p>

                  {repoCreationError && <Alert type="error" message={repoCreationError} />}

                  <div className="github-field">
                    <label className="github-field-label">Repository Name *</label>
                    <input
                      className="github-input"
                      value={repoConfig.repoName}
                      onChange={(e) =>
                        setRepoConfig((prev) => ({ ...prev, repoName: e.target.value }))
                      }
                      placeholder="e.g. distributed-task-queue"
                    />
                  </div>

                  <div className="github-field">
                    <label className="github-field-label">Description</label>
                    <input
                      className="github-input"
                      value={repoConfig.description}
                      onChange={(e) =>
                        setRepoConfig((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Repository description"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="isPrivateCheck"
                      checked={repoConfig.isPrivate}
                      onChange={(e) =>
                        setRepoConfig((prev) => ({ ...prev, isPrivate: e.target.checked }))
                      }
                    />
                    <label htmlFor="isPrivateCheck" style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                      Make repository private (Public is recommended for recruiter visibility)
                    </label>
                  </div>

                  <div className="github-field">
                    <label className="github-field-label">GitHub Personal Access Token (PAT)</label>
                    <input
                      type="password"
                      className="github-input"
                      value={repoConfig.token}
                      onChange={(e) =>
                        setRepoConfig((prev) => ({ ...prev, token: e.target.value }))
                      }
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Requires 'repo' scope)"
                    />
                  </div>

                  {/* Security Notice */}
                  <div className="security-notice-box">
                    <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Strict Security Guarantee:</strong> AICP never stores or logs your Personal Access Token.
                      It is used in-memory solely for this single HTTPS API request to GitHub.
                    </div>
                  </div>

                  {/* 1-Click Fallback without Token */}
                  <div className="prefill-fallback-box">
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      Prefer not to use a Personal Access Token?
                    </span>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                      You can pre-fill this repository on GitHub with 1 click and copy the generated README:
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrefillGitHub(createRepoProject)}
                      >
                        <ExternalLink size={13} /> 1-Click Pre-fill on GitHub.com
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(createRepoProject?.readmeContent, 'prefillReadme')}
                      >
                        {copiedId === 'prefillReadme' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        {copiedId === 'prefillReadme' ? 'Copied!' : 'Copy README'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="blueprint-modal-footer">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreateRepoProject(null)}
              >
                {repoCreationResult ? 'Done' : 'Cancel'}
              </Button>
              {!repoCreationResult && (
                <Button
                  variant="nav"
                  size="sm"
                  onClick={handleCreateRepository}
                  loading={creatingRepo}
                  disabled={!repoConfig.token.trim()}
                >
                  <Plus size={14} /> Confirm &amp; Create Repository
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GitHubAnalyzer
