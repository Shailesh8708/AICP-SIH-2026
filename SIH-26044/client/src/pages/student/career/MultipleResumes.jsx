import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  FileText,
  Plus,
  Trash2,
  ArrowUpRight,
  Download,
  Eye,
  SlidersHorizontal,
  ShieldCheck,
  Layers,
  X,
  CheckCircle2,
  Calendar,
  Zap,
  Search
} from 'lucide-react'
import { Button, Alert, Input } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'
import { resumeAPI } from '../../../services/api'
import { ReferenceResumeDocument, downloadResumePDF } from '../../../components/Resume/ReferenceResumeDocument'
import { TemplateSelectorModal } from '../../../components/Resume/TemplateSelectorModal'
import {
  RESUME_TEMPLATES,
  REFERENCE_TEMPLATE,
  getTemplateById
} from '../../../data/resumeTemplatesCatalog'

const ROLE_TEMPLATES = [
  { role: 'AI/ML Engineer', focus: 'Machine learning, deep learning, PyTorch, model deployment, Python' },
  { role: 'Full Stack Developer', focus: 'React, Node.js, Express, MongoDB, REST APIs, system design' },
  { role: 'Data Scientist', focus: 'Statistics, Python, ML algorithms, experimentation, Pandas, visualization' },
  { role: 'Data Analyst', focus: 'SQL, Power BI, Tableau, Excel, data storytelling, metrics' },
  { role: 'DevOps Engineer', focus: 'Docker, Kubernetes, CI/CD, AWS, Linux, Terraform, IaC' },
  { role: 'Backend Developer', focus: 'Node.js, microservices, databases, API design, scalability' },
  { role: 'Frontend Developer', focus: 'React, Next.js, JavaScript, Tailwind CSS, performance' },
  { role: 'Cybersecurity Analyst', focus: 'Network security, threat analysis, penetration testing, compliance' },
  { role: 'Software Engineer Intern', focus: 'Data structures, algorithms, problem solving, campus placement' },
]

export const MultipleResumes = () => {
  const [resumes, setResumes] = useState([])
  const [generating, setGenerating] = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Template Selection State
  const [selectedTemplate, setSelectedTemplate] = useState(REFERENCE_TEMPLATE)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [switchingResumeId, setSwitchingResumeId] = useState(null) // if non-null, user is switching template for an existing resume

  // Preview Modal State
  const [previewResume, setPreviewResume] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setLoadingList(true)
    try {
      const res = await resumeAPI.list()
      setResumes(res?.data?.items || [])
    } catch {
      // ignore
    } finally {
      setLoadingList(false)
    }
  }

  // Generate resume for a role with chosen template
  const generate = async (targetRole) => {
    const role = targetRole || customRole.trim()
    if (!role) return
    setGenerating(role)
    setError('')
    setMessage('')
    try {
      const res = await careerAgentAPI.generateATSResume({
        targetRole: role,
        template: selectedTemplate.id,
        title: `${role} Resume`,
      })
      if (res?.success) {
        setResumes((prev) => [res.data.resume, ...prev])
        setMessage(`✓ "${role}" resume generated with "${selectedTemplate.name}" template. Saved to your prepared resumes.`)
        if (customRole) setCustomRole('')
      } else {
        setError('Generation failed. Complete your career profile first.')
      }
    } catch (err) {
      setError(err?.message || 'Resume generation unavailable.')
    } finally {
      setGenerating(null)
    }
  }

  // Delete resume
  const remove = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this resume'}"?`)) return
    try {
      await resumeAPI.remove(id)
      setResumes((prev) => prev.filter((r) => r._id !== id))
      if (previewResume?._id === id) setPreviewResume(null)
      setMessage(`Deleted resume version successfully.`)
    } catch {
      setError('Could not delete resume.')
    }
  }

  // Quick 1-click Download PDF
  const handleDownloadPDF = async (r) => {
    const elementId = `pdf-export-${r._id}`
    setDownloadingId(r._id)
    try {
      await downloadResumePDF(elementId, `${r.personal?.name || r.title || 'Resume'}_${r.template || 'ATS'}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      window.print()
    } finally {
      setDownloadingId(null)
    }
  }

  // Handle template selection from modal
  const handleTemplateSelected = async (template) => {
    if (switchingResumeId) {
      // Update existing resume's template
      try {
        await resumeAPI.update(switchingResumeId, { template: template.id })
        setResumes((prev) =>
          prev.map((r) => (r._id === switchingResumeId ? { ...r, template: template.id } : r))
        )
        if (previewResume?._id === switchingResumeId) {
          setPreviewResume((prev) => ({ ...prev, template: template.id }))
        }
        setMessage(`Updated template to "${template.name}".`)
      } catch (err) {
        setError('Could not update template: ' + (err?.message || ''))
      } finally {
        setSwitchingResumeId(null)
      }
    } else {
      // Set chosen template for future creations
      setSelectedTemplate(template)
      setMessage(`Active template changed to "${template.name}". You can now generate resumes using this design.`)
    }
  }

  // Filter prepared resumes
  const filteredResumes = resumes.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.template?.toLowerCase().includes(q) ||
      r.personal?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="career-section multi-resume-container">
      {/* ── Header ── */}
      <div className="career-section-header">
        <div className="multi-resume-header-badge">
          <Layers size={14} /> MULTI RESUME STUDIO · 320+ DESIGNS
        </div>
        <h2>One Master Profile → Multiple Targeted Resumes</h2>
        <p className="career-muted">
          Generate, customize, and manage tailored resumes for different roles, industries, and applications.
          Choose from over 319 official LaTeX &amp; Studio designs and Tier-1 placement standards with 1-click A4 PDF export.
        </p>
      </div>

      {/* ── Summary Stats Strip ── */}
      <div className="multi-resume-stats-strip">
        <div className="multi-stat-card">
          <span className="multi-stat-label">Prepared Resumes</span>
          <span className="multi-stat-value">{resumes.length}</span>
        </div>
        <div className="multi-stat-card">
          <span className="multi-stat-label">Active Template</span>
          <span className="multi-stat-value truncate-1" style={{ fontSize: '1rem', color: '#2563eb' }}>
            {selectedTemplate.name}
          </span>
        </div>
        <div className="multi-stat-card">
          <span className="multi-stat-label">Catalog Designs</span>
          <span className="multi-stat-value">320 Available</span>
        </div>
        <div className="multi-stat-card">
          <span className="multi-stat-label">PDF Export Fidelity</span>
          <span className="multi-stat-value" style={{ color: '#16a34a' }}>A4 Vector Print</span>
        </div>
      </div>

      {/* ── "Select Resume Template" Featured Section ── */}
      <div className="multi-resume-template-picker-card">
        <div className="template-picker-card-left">
          <div className="template-picker-tag">
            <Sparkles size={13} /> SELECT RESUME TEMPLATE
          </div>
          <h3>Selected Design: {selectedTemplate.name}</h3>
          <p className="career-muted">
            {selectedTemplate.description}
          </p>

          <div className="template-picker-meta-row">
            <span className="tpl-badge tpl-badge-layout">Layout: {selectedTemplate.layout}</span>
            <span className={`tpl-badge ${selectedTemplate.atsClass === 'ats-safe' ? 'tpl-badge-ats' : 'tpl-badge-styled'}`}>
              {selectedTemplate.atsClass === 'ats-safe' ? '✓ ATS Safe' : 'Styled Design'}
            </span>
            <span className="tpl-badge">Level: {selectedTemplate.density}</span>
            <span className="tpl-badge">Engine: {selectedTemplate.engine?.toUpperCase()}</span>
          </div>

          <div className="template-picker-actions">
            <Button
              variant="primary"
              onClick={() => {
                setSwitchingResumeId(null)
                setIsTemplateModalOpen(true)
              }}
            >
              <SlidersHorizontal size={15} /> Select / Change Resume Template (320 Designs)
            </Button>
            <span className="template-picker-hint">
              Click to browse and search all 320 LaTeX &amp; Studio templates.
            </span>
          </div>
        </div>

        {/* Thumbnail preview of chosen template */}
        <div className="template-picker-card-right">
          <div
            className="template-active-preview-thumb"
            onClick={() => {
              setSwitchingResumeId(null)
              setIsTemplateModalOpen(true)
            }}
            title="Click to view all 320 templates"
          >
            <img
              src={selectedTemplate.previewImage}
              alt={selectedTemplate.name}
              className="template-active-thumb-img"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="template-active-thumb-overlay">
              <Eye size={16} /> Browse Catalog
            </div>
          </div>
        </div>
      </div>

      {/* ── Targeted Role Generator ── */}
      <div className="multi-resume-generator">
        <div className="multi-generator-head">
          <span className="section-label">GENERATE TARGETED RESUME</span>
          <span className="multi-generator-subtitle">
            Generates with active template: <strong>{selectedTemplate.name}</strong>
          </span>
        </div>

        <div className="role-chips">
          {ROLE_TEMPLATES.map(({ role }) => (
            <button
              key={role}
              className={`role-chip ${generating === role ? 'active' : ''}`}
              onClick={() => generate(role)}
              disabled={!!generating}
            >
              {generating === role ? <Sparkles size={13} className="spin-icon" /> : <Plus size={13} />}
              {role}
            </button>
          ))}
        </div>

        <div className="multi-resume-custom">
          <Input
            label="Or generate for a custom target role"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="e.g. Cloud Security Architect, NLP Research Intern..."
          />
          <Button
            variant="outline"
            onClick={() => generate()}
            disabled={!customRole.trim() || !!generating}
            loading={generating === customRole}
          >
            <Sparkles size={14} /> Generate with Selected Template
          </Button>
        </div>
      </div>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      {/* ── "YOUR PREPARED RESUMES" SHOWCASE ── */}
      <div className="multi-resume-showcase-section">
        <div className="multi-showcase-header">
          <div>
            <span className="section-label">YOUR PREPARED RESUMES</span>
            <h3>All Prepared Resumes ({resumes.length})</h3>
            <p className="career-muted">
              Each prepared resume version preserves its target role emphasis, custom template design, and can be previewed or exported to A4 PDF with one click.
            </p>
          </div>

          {resumes.length > 0 && (
            <div className="multi-showcase-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter prepared resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="multi-search-input"
              />
            </div>
          )}
        </div>

        {loadingList && (
          <div className="multi-loading-state">
            <Sparkles size={20} className="spin-icon" color="#2563eb" />
            <p>Loading your prepared resumes...</p>
          </div>
        )}

        {!loadingList && resumes.length === 0 && (
          <div className="multi-empty-resumes">
            <FileText size={44} color="#94a3b8" />
            <h4>No Resumes Prepared Yet</h4>
            <p>
              Select any of the 320 resume templates above and click a target role to generate your first professional resume version.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setSwitchingResumeId(null)
                setIsTemplateModalOpen(true)
              }}
            >
              <SlidersHorizontal size={14} /> Open Template Catalog
            </Button>
          </div>
        )}

        {/* Prepared Resumes Cards Grid */}
        {!loadingList && filteredResumes.length > 0 && (
          <div className="multi-resumes-grid">
            {filteredResumes.map((r) => {
              const tplInfo = getTemplateById(r.template)
              const isDownloading = downloadingId === r._id

              return (
                <div key={r._id} className="prepared-resume-card">
                  {/* Card Top: Thumbnail + Info */}
                  <div className="prepared-card-top">
                    {/* Visual miniature icon/frame */}
                    <div className="prepared-mini-thumb">
                      <img
                        src={tplInfo.previewImage}
                        alt={tplInfo.name}
                        className="prepared-thumb-img"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                      <div className="prepared-thumb-fallback">
                        <FileText size={22} color={tplInfo.accentColor || '#2563eb'} />
                      </div>
                    </div>

                    <div className="prepared-card-details">
                      <div className="prepared-card-title-row">
                        <h4 className="prepared-card-title">{r.title || 'Targeted Resume'}</h4>
                        {r.analysis?.score != null && (
                          <span className="prepared-score-pill">
                            ★ {r.analysis.score}% ATS
                          </span>
                        )}
                      </div>

                      <div className="prepared-card-meta">
                        <span className="prepared-template-name">
                          Template: <strong>{tplInfo.name}</strong> ({tplInfo.layout})
                        </span>
                        <span className="prepared-badge-sub">
                          {r.aiGenerated ? 'AI-Engineered' : 'Manual'} · v{r.version || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Candidate summary preview snippet */}
                  <div className="prepared-card-snippet">
                    <span className="prepared-snippet-item">
                      <strong>Name:</strong> {r.personal?.name || 'Not specified'}
                    </span>
                    <span className="prepared-snippet-item">
                      <strong>Skills:</strong> {Array.isArray(r.skills) ? r.skills.length : 0} items listed
                    </span>
                    <span className="prepared-snippet-item">
                      <strong>Projects:</strong> {Array.isArray(r.projects) ? r.projects.length : 0} projects
                    </span>
                  </div>

                  {/* Card Action Bar */}
                  <div className="prepared-card-actions-bar">
                    <button
                      type="button"
                      className="prepared-action-btn primary"
                      onClick={() => setPreviewResume(r)}
                      title="Preview this resume in full fidelity"
                    >
                      <Eye size={14} /> Preview
                    </button>

                    <button
                      type="button"
                      className="prepared-action-btn download"
                      onClick={() => handleDownloadPDF(r)}
                      disabled={isDownloading}
                      title="1-Click Download Vector A4 PDF"
                    >
                      <Download size={14} />
                      {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                    </button>

                    <button
                      type="button"
                      className="prepared-action-btn secondary"
                      onClick={() => {
                        setSwitchingResumeId(r._id)
                        setIsTemplateModalOpen(true)
                      }}
                      title="Switch to another template design"
                    >
                      <SlidersHorizontal size={14} /> Template
                    </button>

                    <a
                      href="/resume"
                      className="prepared-action-btn link"
                      title="Open in full Resume Editor"
                    >
                      <ArrowUpRight size={14} /> Edit
                    </a>

                    <button
                      type="button"
                      className="prepared-action-btn delete"
                      onClick={() => remove(r._id, r.title)}
                      title="Delete this resume version"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Hidden container used by html2pdf when downloading directly from card */}
                  <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div id={`pdf-export-${r._id}`}>
                      <ReferenceResumeDocument resume={r} id={`pdf-doc-${r._id}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Full Preview Modal ── */}
      {previewResume && (
        <div className="multi-preview-overlay" onClick={() => setPreviewResume(null)}>
          <div className="multi-preview-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="multi-preview-header">
              <div className="multi-preview-title-block">
                <h3>{previewResume.title || 'Resume Preview'}</h3>
                <span className="multi-preview-template-tag">
                  Design: <strong>{getTemplateById(previewResume.template).name}</strong> ({getTemplateById(previewResume.template).layout})
                </span>
              </div>

              <div className="multi-preview-header-actions">
                <Button
                  variant="primary"
                  onClick={() => handleDownloadPDF(previewResume)}
                  disabled={downloadingId === previewResume._id}
                >
                  <Download size={15} />
                  {downloadingId === previewResume._id ? 'Exporting PDF...' : 'Download PDF'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSwitchingResumeId(previewResume._id)
                    setIsTemplateModalOpen(true)
                  }}
                >
                  <SlidersHorizontal size={15} /> Change Template
                </Button>

                <a href="/resume" className="multi-preview-edit-cta">
                  <ArrowUpRight size={15} /> Edit Details
                </a>

                <button
                  className="template-modal-close"
                  onClick={() => setPreviewResume(null)}
                  title="Close Preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="multi-preview-scroll-area">
              <div className="multi-preview-paper-wrapper">
                <ReferenceResumeDocument
                  resume={previewResume}
                  id="multi-preview-doc-active"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Template Selector Modal (320 Designs) ── */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false)
          setSwitchingResumeId(null)
        }}
        selectedTemplateId={
          switchingResumeId
            ? resumes.find((r) => r._id === switchingResumeId)?.template || selectedTemplate.id
            : selectedTemplate.id
        }
        onSelectTemplate={handleTemplateSelected}
      />
    </div>
  )
}

export default MultipleResumes
