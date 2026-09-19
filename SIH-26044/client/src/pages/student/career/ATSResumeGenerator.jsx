import React, { useState } from 'react'
import { Sparkles, FileText, ArrowUpRight, AlertCircle, Download, Printer } from 'lucide-react'
import { Button, Alert, Input } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'
import { ReferenceResumeDocument, downloadResumePDF } from '../../../components/Resume/ReferenceResumeDocument'

const ROLES = [
  'AI/ML Engineer',
  'Data Scientist',
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Data Analyst',
  'DevOps Engineer',
  'Cybersecurity Analyst',
]

export const ATSResumeGenerator = () => {
  const [targetRole, setTargetRole] = useState('')
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const generate = async () => {
    if (!targetRole.trim()) return
    setLoading(true)
    setError('')
    setMessage('')
    setResume(null)
    try {
      const res = await careerAgentAPI.generateATSResume(targetRole)
      if (res?.success && res.data?.resume) {
        setResume(res.data.resume)
        setMessage(`✓ Generated ATS-optimized resume for "${targetRole}" matching reference standard format.`)
      } else {
        setError('Resume generation failed. Please complete your profile first.')
      }
    } catch (err) {
      setError(err?.message || 'Resume generation unavailable.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!resume) return
    setDownloadingPdf(true)
    try {
      const candidateName = (resume.personal?.name || targetRole || 'Resume').trim().replace(/\s+/g, '_')
      await downloadResumePDF('ats-resume-pdf-content', `${candidateName}_ATS_Resume.pdf`)
    } catch (err) {
      console.error('PDF download error:', err)
      window.print()
    } finally {
      setDownloadingPdf(false)
    }
  }

  const goToEditor = () => window.location.href = '/resume'

  return (
    <div className="career-section">
      <div className="career-section-header">
        <span className="section-label">ATS RESUME GENERATOR</span>
        <h2>Generate a targeted, ATS-friendly resume</h2>
        <p className="career-muted">
          Your resume is structured and formatted to Tier-1 reference standards (blue headers, diamond ❖ bullets, and validated experience) based on your target role.
        </p>
      </div>

      <div className="career-role-input">
        <label className="career-label">Target Role</label>
        <div className="role-chips">
          {ROLES.map((r) => (
            <button
              key={r}
              className={`role-chip ${targetRole === r ? 'active' : ''}`}
              onClick={() => setTargetRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <Input
          label="Or type a custom role"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Machine Learning Engineer"
        />
        <Button variant="nav" onClick={generate} loading={loading} disabled={!targetRole.trim()}>
          <Sparkles size={15} /> Generate ATS Resume
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}
      {message && <Alert type="info" message={message} />}

      {resume && (
        <div className="ats-resume-result" style={{ marginTop: 20 }}>
          <div className="ats-resume-notice">
            <AlertCircle size={16} />
            <span>
              Standard Reference Resume generated. Verify all sections and click &quot;Download PDF&quot; to export your vector-rendered resume.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleDownloadPDF} loading={downloadingPdf}>
              <Download size={16} /> Download PDF
            </Button>
            <Button variant="nav" onClick={goToEditor}>
              <FileText size={15} /> Open in Resume Editor <ArrowUpRight size={14} />
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </Button>
          </div>

          {/* Render Reference Standard Resume Document */}
          <div style={{ marginTop: 10 }}>
            <ReferenceResumeDocument resume={resume} id="ats-resume-pdf-content" />
          </div>
        </div>
      )}
    </div>
  )
}
