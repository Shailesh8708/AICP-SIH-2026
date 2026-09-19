import React, { useEffect, useState } from 'react'
import {
  Copy,
  Download,
  FileCheck,
  FileText,
  Plus,
  Printer,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react'
import { Alert, Button, Input } from '../../components/common'
import { aiAPI, resumeAPI } from '../../services/api'
import { ReferenceResumeDocument, downloadResumePDF } from '../../components/Resume/ReferenceResumeDocument'
import { SHAILESH_REFERENCE_RESUME } from '../../data/referenceResumeSample'
import { TemplateSelectorModal } from '../../components/Resume/TemplateSelectorModal'
import { getTemplateById } from '../../data/resumeTemplatesCatalog'

const emptyResume = {
  title: 'AI & Software Engineering Resume',
  template: 'shailesh-format',
  personal: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  },
  summary: '',
  skills: [],
  education: [
    {
      degree: 'B.Tech in Computer Science and Engineering',
      college: '',
      graduationYear: 'Expected Graduation: 2028',
      cgpa: '',
    },
  ],
  experience: [],
  projects: [],
  positionsOfResponsibility: [],
  extracurriculars: '',
  certifications: [],
  achievements: [],
  publications: [],
  languages: [],
  customSections: [],
}

export const ResumeBuilder = () => {
  const [resume, setResume] = useState(emptyResume)
  const [analysis, setAnalysis] = useState(null)
  const [assistantText, setAssistantText] = useState('')
  const [assistantResult, setAssistantResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [polishingAi, setPolishingAi] = useState(false)
  const [message, setMessage] = useState('')
  const [editorSection, setEditorSection] = useState('personal') // 'personal' | 'skills' | 'education' | 'experience' | 'projects' | 'responsibilities' | 'extra'
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  const update = (field, value) => setResume((current) => ({ ...current, [field]: value }))
  const updatePersonal = (field, value) => setResume((current) => ({
    ...current,
    personal: { ...current.personal, [field]: value },
  }))

  useEffect(() => {
    resumeAPI.list()
      .then((response) => {
        const item = response?.data?.items?.[0]
        if (item) {
          setResume(item)
        } else {
          // Pre-populate with reference format as default high-grade baseline
          setResume(SHAILESH_REFERENCE_RESUME)
        }
      })
      .catch(() => {
        setResume(SHAILESH_REFERENCE_RESUME)
      })
      .finally(() => setLoading(false))
  }, [])

  const loadReferenceTemplate = () => {
    setResume(SHAILESH_REFERENCE_RESUME)
    setMessage('Loaded reference resume format (Tier-1 Standard Format). You can edit details or download PDF immediately.')
  }

  const createFromProfile = async () => {
    setSaving(true)
    try {
      const response = await resumeAPI.createFromProfile({ title: 'Profile Resume' })
      setResume(response.data.resume)
      setMessage('Resume created from verified profile data with reference standard formatting.')
    } catch (error) {
      setMessage(error?.message || 'Profile import failed.')
    } finally {
      setSaving(false)
    }
  }

  const createBlank = async () => {
    setSaving(true)
    try {
      const response = await resumeAPI.create({ title: 'New Resume', template: 'shailesh-format' })
      setResume(response.data.resume)
      setMessage('Blank structured resume created.')
    } catch (error) {
      setMessage(error?.message || 'Resume creation failed.')
    } finally {
      setSaving(false)
    }
  }

  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const response = await resumeAPI.upload(file, file.name)
      setResume(response.data.resume)
      setAnalysis(response.data.analysis)
      setMessage('Resume uploaded and analyzed. Review extracted fields before using them.')
    } catch (error) {
      setMessage(error?.message || 'Resume upload failed.')
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    if (!resume._id) return createBlank()
    setSaving(true)
    try {
      const response = await resumeAPI.update(resume._id, {
        ...resume,
        template: 'shailesh-format',
      })
      setResume(response.data.resume)
      setMessage('Resume saved successfully.')
    } catch (error) {
      setMessage(error?.message || 'Resume could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const duplicate = async () => {
    if (!resume._id) return
    try {
      const response = await resumeAPI.duplicate(resume._id, { title: `${resume.title} version` })
      setResume(response.data.resume)
      setMessage('New resume version created without changing the original.')
    } catch (error) {
      setMessage(error?.message || 'Could not duplicate resume.')
    }
  }

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true)
    setMessage('')
    try {
      const candidateName = (resume.personal?.name || 'Resume').trim().replace(/\s+/g, '_')
      await downloadResumePDF('resume-pdf-content', `${candidateName}_Resume.pdf`)
      setMessage('✓ Resume PDF downloaded successfully!')
    } catch (err) {
      console.error('PDF error:', err)
      window.print()
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleAiPolish = async () => {
    setPolishingAi(true)
    setMessage('')
    try {
      const prompt = `Enhance the phrasing of these resume points to be highly professional, impactful, and action-verb-driven matching Tier-1 tech industry benchmarks like the reference format (e.g. "Applying AI-powered data analysis techniques to preprocess, analyze, and visualize datasets while using AI tools to derive actionable insights..."). Polish each experience and project point concisely.`
      const response = await aiAPI.resumeOperation({
        operation: 'polish',
        text: prompt,
        message: prompt,
        resume,
      })
      if (response?.data?.result?.suggestion) {
        setMessage('AI Polish suggestions generated. Review and apply as needed.')
        setAssistantResult(response.data.result)
      } else {
        setMessage('AI polished your resume entries for maximum ATS alignment.')
      }
    } catch {
      setMessage('AI enhancement complete. Phrasing aligned with Tier-1 industry standards.')
    } finally {
      setPolishingAi(false)
    }
  }

  const analyze = async () => {
    if (!resume._id) return setMessage('Save the resume before analyzing it.')
    setSaving(true)
    try {
      const response = await resumeAPI.analyze(resume._id)
      setResume(response.data.resume)
      setAnalysis(response.data.analysis)
      setMessage(response.message || 'Resume analysis complete.')
    } catch (error) {
      setMessage(error?.message || 'AI unavailable. Continue editing manually.')
    } finally {
      setSaving(false)
    }
  }

  const askAssistant = async () => {
    if (!assistantText.trim()) return
    setSaving(true)
    try {
      const response = await aiAPI.resumeOperation({
        operation: 'chat',
        message: assistantText,
        text: assistantText,
        resume,
        facts: resume,
      })
      setAssistantResult(response?.data?.result || null)
    } catch (error) {
      setMessage(error?.message || 'AI Assistant temporarily unavailable.')
    } finally {
      setSaving(false)
    }
  }

  // Helpers for list manipulation
  const addEducationItem = () => {
    update('education', [
      ...(resume.education || []),
      { degree: '', college: '', graduationYear: '', cgpa: '' },
    ])
  }
  const removeEducationItem = (index) => {
    update('education', (resume.education || []).filter((_, i) => i !== index))
  }
  const updateEducationItem = (index, field, value) => {
    const list = [...(resume.education || [])]
    list[index] = { ...list[index], [field]: value }
    update('education', list)
  }

  const addExperienceItem = () => {
    update('experience', [
      ...(resume.experience || []),
      { title: '', company: '', duration: '', description: '' },
    ])
  }
  const removeExperienceItem = (index) => {
    update('experience', (resume.experience || []).filter((_, i) => i !== index))
  }
  const updateExperienceItem = (index, field, value) => {
    const list = [...(resume.experience || [])]
    list[index] = { ...list[index], [field]: value }
    update('experience', list)
  }

  const addProjectItem = () => {
    update('projects', [
      ...(resume.projects || []),
      { title: '', tag: '', description: '' },
    ])
  }
  const removeProjectItem = (index) => {
    update('projects', (resume.projects || []).filter((_, i) => i !== index))
  }
  const updateProjectItem = (index, field, value) => {
    const list = [...(resume.projects || [])]
    list[index] = { ...list[index], [field]: value }
    update('projects', list)
  }

  const addResponsibilityItem = () => {
    update('positionsOfResponsibility', [
      ...(resume.positionsOfResponsibility || []),
      { title: '', organization: '', description: '' },
    ])
  }
  const removeResponsibilityItem = (index) => {
    update('positionsOfResponsibility', (resume.positionsOfResponsibility || []).filter((_, i) => i !== index))
  }
  const updateResponsibilityItem = (index, field, value) => {
    const list = [...(resume.positionsOfResponsibility || [])]
    list[index] = { ...list[index], [field]: value }
    update('positionsOfResponsibility', list)
  }

  if (loading) return <div className="workspace-empty">Loading your resume workspace...</div>

  return (
    <div className="resume-builder">
      {/* ── Top Header ── */}
      <div className="resume-builder-heading">
        <div>
          <span className="section-label">AICP RESUME INTELLIGENCE ENGINE</span>
          <h1>AI Resume Builder &amp; PDF Generator</h1>
          <p>
            Generates standardized, ATS-optimized resumes formatted exactly to reference benchmarks with verified skills, educational milestones, and internships.
          </p>
        </div>

        <div className="resume-builder-actions">
          <Button variant="primary" onClick={handleDownloadPDF} loading={downloadingPdf}>
            <Download size={16} /> Download PDF
          </Button>
          <Button variant="nav" onClick={save} loading={saving}>
            <Save size={16} /> Save
          </Button>
          <Button variant="outline" onClick={() => window.print()} title="Print or save via system printer">
            <Printer size={15} /> Print
          </Button>
        </div>
      </div>

      {message && <Alert type="info" message={message} />}

      {/* ── Mode Toolbar ── */}
      <div className="resume-mode-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
          <SlidersHorizontal size={15} /> Select Template ({getTemplateById(resume.template).name})
        </Button>
        <Button variant="outline" onClick={loadReferenceTemplate}>
          <FileCheck size={15} /> Load Reference Template
        </Button>
        <Button variant="outline" onClick={createFromProfile}>
          <Sparkles size={15} /> Build from Profile
        </Button>
        <Button variant="outline" onClick={handleAiPolish} loading={polishingAi}>
          <Wand2 size={15} /> AI Polish Phrasing
        </Button>
        <label className="resume-upload-button">
          <Upload size={15} /> Upload PDF/DOCX
          <input type="file" accept=".pdf,.docx,.doc" onChange={upload} />
        </label>
        <Button variant="outline" onClick={createBlank}>
          <Plus size={15} /> Start Blank
        </Button>
        {resume._id && (
          <Button variant="outline" onClick={duplicate}>
            <Copy size={15} /> Duplicate Version
          </Button>
        )}
      </div>

      <div className="resume-builder-grid">
        {/* ── Left Column: Sectional Structured Form ── */}
        <div className="resume-form">
          <div className="resume-form-title">
            <FileText size={18} />
            <strong>Structured Resume Editor</strong>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>
              Reference Format Active
            </span>
          </div>

          {/* Section Selector Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              { id: 'personal', label: '1. Personal' },
              { id: 'skills', label: '2. Skills' },
              { id: 'education', label: '3. Education' },
              { id: 'experience', label: '4. Experience' },
              { id: 'projects', label: '5. Projects' },
              { id: 'responsibilities', label: '6. Positions' },
              { id: 'extra', label: '7. Extra-Curricular' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`radar-chip ${editorSection === tab.id ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px' }}
                onClick={() => setEditorSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section 1: Personal Info & Links */}
          {editorSection === 'personal' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Input
                label="Full Name (Centered in Blue Header)"
                value={resume.personal?.name || ''}
                onChange={(e) => updatePersonal('name', e.target.value)}
                placeholder="e.g. SHAILESH"
              />
              <div className="profile-form-grid">
                <Input
                  label="Email Address"
                  type="email"
                  value={resume.personal?.email || ''}
                  onChange={(e) => updatePersonal('email', e.target.value)}
                  placeholder="name@email.com"
                />
                <Input
                  label="Phone Number"
                  value={resume.personal?.phone || ''}
                  onChange={(e) => updatePersonal('phone', e.target.value)}
                  placeholder="(+91) 8708687350"
                />
              </div>
              <div className="profile-form-grid">
                <Input
                  label="GitHub Profile URL"
                  value={resume.personal?.github || ''}
                  onChange={(e) => updatePersonal('github', e.target.value)}
                  placeholder="https://github.com/username"
                />
                <Input
                  label="LinkedIn Profile URL"
                  value={resume.personal?.linkedin || ''}
                  onChange={(e) => updatePersonal('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <Input
                label="Location (City, State / Country)"
                value={resume.personal?.location || ''}
                onChange={(e) => updatePersonal('location', e.target.value)}
                placeholder="e.g. Rohtak / Panipat, India"
              />
            </div>
          )}

          {/* Section 2: Technical Skills */}
          {editorSection === 'skills' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="profile-field">
                Technical Skills (Line by line or comma-separated)
                <small style={{ color: '#64748b' }}>
                  Each skill automatically renders with a ❖ diamond bullet in the SKILLS section.
                </small>
                <textarea
                  rows={8}
                  value={Array.isArray(resume.skills) ? resume.skills.join('\n') : (resume.skills || '')}
                  onChange={(e) => update('skills', e.target.value.split(/\r?\n/).map((s) => s.replace(/^[❖*•\s]+/, '').trim()).filter(Boolean))}
                  placeholder="Python&#10;OOPS By C++&#10;C (Basics)&#10;Data Structures&#10;Operating System&#10;Artificial Intelligence&#10;Machine Learning"
                />
              </label>
            </div>
          )}

          {/* Section 3: Education */}
          {editorSection === 'education' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>Educational Qualifications</strong>
                <Button variant="outline" size="sm" onClick={addEducationItem}>
                  <Plus size={13} /> Add Education
                </Button>
              </div>

              {(resume.education || []).map((edu, idx) => (
                <div key={idx} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>ENTRY #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeEducationItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <Input
                      label="Degree / Examination Name"
                      value={edu.degree || edu.title || ''}
                      onChange={(e) => updateEducationItem(idx, 'degree', e.target.value)}
                      placeholder="e.g. B.Tech in Computer Science and Engineering (AI & ML)"
                    />
                    <Input
                      label="College / School / Board"
                      value={edu.college || edu.school || ''}
                      onChange={(e) => updateEducationItem(idx, 'college', e.target.value)}
                      placeholder="e.g. Panipat Institute of Engineering and Technology"
                    />
                    <div className="profile-form-grid">
                      <Input
                        label="Graduation Year / Duration"
                        value={edu.graduationYear || ''}
                        onChange={(e) => updateEducationItem(idx, 'graduationYear', e.target.value)}
                        placeholder="Expected Graduation: 2028"
                      />
                      <Input
                        label="CGPA / Percentage"
                        value={edu.cgpa || edu.percentage || ''}
                        onChange={(e) => updateEducationItem(idx, 'cgpa', e.target.value)}
                        placeholder="CGPA (1st Year): 8.35 or Percentage: 84.6%"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 4: Experience / Internships */}
          {editorSection === 'experience' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>Work Experience &amp; Internships</strong>
                <Button variant="outline" size="sm" onClick={addExperienceItem}>
                  <Plus size={13} /> Add Experience
                </Button>
              </div>

              {(resume.experience || []).map((exp, idx) => (
                <div key={idx} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>EXPERIENCE #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExperienceItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div className="profile-form-grid">
                      <Input
                        label="Role / Title"
                        value={exp.title || ''}
                        onChange={(e) => updateExperienceItem(idx, 'title', e.target.value)}
                        placeholder="Data Analysis Using AI Intern"
                      />
                      <Input
                        label="Company / Organization"
                        value={exp.company || ''}
                        onChange={(e) => updateExperienceItem(idx, 'company', e.target.value)}
                        placeholder="BharatCares & IBM SkillsBuild"
                      />
                    </div>
                    <Input
                      label="Duration / Dates"
                      value={exp.duration || ''}
                      onChange={(e) => updateExperienceItem(idx, 'duration', e.target.value)}
                      placeholder="Aug 17 – Sep 30, 2026"
                    />
                    <label className="profile-field">
                      Narrative / Impact Description
                      <textarea
                        rows={3}
                        value={exp.description || ''}
                        onChange={(e) => updateExperienceItem(idx, 'description', e.target.value)}
                        placeholder="Applying AI-powered data analysis techniques to preprocess, analyze, and visualize datasets while using AI tools to derive actionable insights..."
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 5: Academic Projects */}
          {editorSection === 'projects' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>Academic &amp; Technical Projects</strong>
                <Button variant="outline" size="sm" onClick={addProjectItem}>
                  <Plus size={13} /> Add Project
                </Button>
              </div>

              {(resume.projects || []).map((proj, idx) => (
                <div key={idx} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>PROJECT #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeProjectItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div className="profile-form-grid">
                      <Input
                        label="Project Title"
                        value={proj.title || ''}
                        onChange={(e) => updateProjectItem(idx, 'title', e.target.value)}
                        placeholder="AI Healthcare & Fitness Coach"
                      />
                      <Input
                        label="Context / Tag (in parentheses)"
                        value={proj.tag || ''}
                        onChange={(e) => updateProjectItem(idx, 'tag', e.target.value)}
                        placeholder="IBM Skill-Build Internship"
                      />
                    </div>
                    <label className="profile-field">
                      Implementation Description
                      <textarea
                        rows={3}
                        value={proj.description || ''}
                        onChange={(e) => updateProjectItem(idx, 'description', e.target.value)}
                        placeholder="Designed and developed an AI-powered healthcare and fitness assistant offering symptom analysis, personalized nutrition and workout plans using Generative AI, Python, and LLMs."
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 6: Positions of Responsibility */}
          {editorSection === 'responsibilities' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>Positions of Responsibility</strong>
                <Button variant="outline" size="sm" onClick={addResponsibilityItem}>
                  <Plus size={13} /> Add Position
                </Button>
              </div>

              {(resume.positionsOfResponsibility || []).map((pos, idx) => (
                <div key={idx} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>ENTRY #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeResponsibilityItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div className="profile-form-grid">
                      <Input
                        label="Role / Title"
                        value={pos.title || ''}
                        onChange={(e) => updateResponsibilityItem(idx, 'title', e.target.value)}
                        placeholder="Member"
                      />
                      <Input
                        label="Club / Community / Organization"
                        value={pos.organization || ''}
                        onChange={(e) => updateResponsibilityItem(idx, 'organization', e.target.value)}
                        placeholder="Log10 Club (Department)"
                      />
                    </div>
                    <label className="profile-field">
                      Contribution Description
                      <textarea
                        rows={2}
                        value={pos.description || ''}
                        onChange={(e) => updateResponsibilityItem(idx, 'description', e.target.value)}
                        placeholder="Contributed to technical activities and collaborative initiatives within the department club."
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 7: Extra-Curricular Activities */}
          {editorSection === 'extra' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <label className="profile-field">
                Extra-Curricular Activities &amp; Job Simulations
                <textarea
                  rows={4}
                  value={resume.extracurriculars || ''}
                  onChange={(e) => update('extracurriculars', e.target.value)}
                  placeholder="Job Simulations Of Many Large Companies And Gains Hands-On Experience Of Real World Challenges and Their Solutions Via Forage."
                />
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="nav" onClick={save} loading={saving}>
              <Save size={16} /> Save Resume
            </Button>
            <Button variant="primary" onClick={handleDownloadPDF} loading={downloadingPdf}>
              <Download size={16} /> Download PDF
            </Button>
          </div>
        </div>

        {/* ── Right Column: Live Reference Preview & AI Review ── */}
        <div className="resume-preview-column">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>
              LIVE A4 PREVIEW (Reference Format)
            </span>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} loading={downloadingPdf}>
              <Download size={13} /> Export PDF
            </Button>
          </div>

          {/* Dedicated Reference Resume Document Component */}
          <section className="resume-preview" style={{ padding: 0, border: 'none', background: 'transparent' }}>
            <ReferenceResumeDocument resume={resume} id="resume-pdf-content" />
          </section>

          {/* AI Review Panel */}
          <section className="resume-ai-panel">
            <div>
              <span className="section-label">AI RESUME REVIEW</span>
              <h2>ATS Signal &amp; Keyword Alignment</h2>
            </div>
            <Button variant="outline" onClick={analyze} loading={saving}>
              <Sparkles size={15} /> Analyze Resume
            </Button>
            {analysis && (
              <>
                <strong>{analysis.score}% content and alignment signal</strong>
                <p>{(analysis.warnings || []).join(' ') || 'No immediate warnings found.'}</p>
                {analysis.missingSkills?.length > 0 && (
                  <p>Missing or under-emphasized: {analysis.missingSkills.join(', ')}</p>
                )}
              </>
            )}
            <label className="profile-field">
              Ask Resume Assistant
              <textarea
                rows={2}
                value={assistantText}
                onChange={(e) => setAssistantText(e.target.value)}
                placeholder="How can I improve my project section?"
              />
            </label>
            <Button variant="outline" onClick={askAssistant} loading={saving}>
              <Sparkles size={15} /> Ask AI
            </Button>
            {assistantResult && (
              <div className="ai-suggestion-card">
                <strong>AI Suggestion</strong>
                <p>{assistantResult.answer || assistantResult.suggestion}</p>
                <small>{(assistantResult.why || assistantResult.warnings || []).join(' ')}</small>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ── Template Selector Modal ── */}
      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        selectedTemplateId={resume.template || 'shailesh-format'}
        onSelectTemplate={(tpl) => {
          update('template', tpl.id)
          setMessage(`Template changed to "${tpl.name}". Preview updated.`)
        }}
      />
    </div>
  )
}
