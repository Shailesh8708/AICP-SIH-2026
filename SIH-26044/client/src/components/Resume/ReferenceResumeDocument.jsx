import React from 'react'
import html2pdf from 'html2pdf.js'
import { getTemplateById } from '../../data/resumeTemplatesCatalog'

/**
 * Downloads the resume element as a clean, vector-rendered A4 PDF.
 */
export const downloadResumePDF = async (elementId = 'resume-pdf-content', filename = 'Resume.pdf') => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('Resume element not found:', elementId)
    return
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  return html2pdf().set(opt).from(element).save()
}

/**
 * Dynamic Multi-Layout Resume Document Component
 * Supports:
 * - Single-Column (Standard / Reference Format)
 * - Two-Column / Sidebar (AltaCV / Modern Sidebar Format)
 * - Banner (ModernCV / Executive Banner Format)
 */
export const ReferenceResumeDocument = ({ resume = {}, id = 'resume-pdf-content' }) => {
  const personal = resume.personal || {}
  const name = personal.name || 'YOUR NAME'
  const email = personal.email || ''
  const phone = personal.phone || ''
  const location = personal.location || ''
  const github = personal.github || ''
  const linkedin = personal.linkedin || ''

  const templateConfig = getTemplateById(resume.template || 'shailesh-format')
  const layout = templateConfig.layout || 'single'
  const accentColor = templateConfig.accentColor || '#2563eb'

  // Contact line
  const contactParts = [email, phone ? `(+91) ${phone.replace(/^\+?91/, '').trim()}` : ''].filter(Boolean)
  if (contactParts.length === 0 && location) contactParts.push(location)

  // Normalizing Skills
  let skills = []
  if (Array.isArray(resume.skills)) {
    skills = resume.skills.map((s) => (typeof s === 'string' ? s.trim() : s?.name || '')).filter(Boolean)
  } else if (typeof resume.skills === 'string') {
    skills = resume.skills.split(',').map((s) => s.trim()).filter(Boolean)
  }

  // Normalizing Education
  let education = []
  if (Array.isArray(resume.education)) {
    education = resume.education.map((e) => {
      if (typeof e === 'string') return { degree: e }
      return {
        degree: e.degree || e.title || e.description || '',
        college: e.college || e.school || e.institution || '',
        graduationYear: e.graduationYear || (e.year ? `Year: ${e.year}` : ''),
        cgpa: e.cgpa || '',
        percentage: e.percentage || '',
        description: e.details || '',
      }
    }).filter((e) => e.degree || e.college)
  }

  // Normalizing Experience
  let experience = []
  if (Array.isArray(resume.experience)) {
    experience = resume.experience.map((exp) => {
      if (typeof exp === 'string') return { title: exp }
      return {
        title: exp.title || exp.role || '',
        company: exp.company || exp.organization || '',
        duration: exp.duration || exp.dates || '',
        description: exp.description || exp.responsibilities || '',
      }
    }).filter((exp) => exp.title || exp.company || exp.description)
  }

  // Normalizing Academic Projects
  let projects = []
  if (Array.isArray(resume.projects)) {
    projects = resume.projects.map((proj) => {
      if (typeof proj === 'string') return { title: proj }
      return {
        title: proj.title || proj.name || '',
        tag: proj.tag || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        description: proj.description || proj.solution || '',
      }
    }).filter((proj) => proj.title || proj.description)
  }

  // Normalizing Positions of Responsibility
  let positions = []
  if (Array.isArray(resume.positionsOfResponsibility) && resume.positionsOfResponsibility.length > 0) {
    positions = resume.positionsOfResponsibility.map((pos) => {
      if (typeof pos === 'string') return { title: pos }
      return {
        title: pos.title || pos.role || '',
        organization: pos.organization || pos.club || '',
        description: pos.description || '',
      }
    }).filter((pos) => pos.title || pos.description)
  } else if (Array.isArray(resume.achievements) && resume.achievements.length > 0) {
    positions = resume.achievements.map((ach) => {
      if (typeof ach === 'string') return { title: ach }
      return {
        title: ach.title || ach.name || '',
        organization: ach.organization || ach.issuer || '',
        description: ach.description || '',
      }
    }).filter((ach) => ach.title)
  }

  // Extracurriculars
  const extracurriculars = resume.extracurriculars || (resume.certifications?.length > 0 ? resume.certifications.map(c => typeof c === 'string' ? c : c.name || c.description).join(' • ') : '')

  // Render Social Link Items
  const renderSocialLinks = (light = false) => (
    (github || linkedin) ? (
      <div className={`ref-links-row ${light ? 'ref-links-row-light' : ''}`}>
        {github && (
          <span className="ref-link-item">
            <svg className="ref-icon" width="15" height="15" viewBox="0 0 24 24" fill={light ? '#fff' : 'currentColor'}>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <a
              href={github.startsWith('http') ? github : `https://${github}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`ref-social-link ${light ? 'ref-social-link-light' : ''}`}
            >
              GitHub_Link
            </a>
          </span>
        )}
        {linkedin && (
          <span className="ref-link-item">
            <svg className="ref-icon" width="15" height="15" viewBox="0 0 24 24" fill={light ? '#fff' : '#0a66c2'}>
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
            </svg>
            <a
              href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`ref-social-link ${light ? 'ref-social-link-light' : ''}`}
            >
              LinkedIn_Profile
            </a>
          </span>
        )}
      </div>
    ) : null
  )

  // ─── BANNER LAYOUT ───────────────────────────────────────────────────────────
  if (layout === 'banner') {
    return (
      <div className="reference-resume-paper layout-banner" id={id}>
        <div className="ref-banner-header" style={{ backgroundColor: accentColor }}>
          <h1 className="ref-banner-name">{name.toUpperCase()}</h1>
          {contactParts.length > 0 && (
            <div className="ref-banner-contact">
              {contactParts.join(' | ')}
            </div>
          )}
          {renderSocialLinks(true)}
        </div>

        <div className="ref-banner-body">
          {skills.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                SKILLS
              </h2>
              <div className="ref-skills-grid">
                {skills.map((skill, idx) => (
                  <div key={idx} className="ref-skill-item">
                    <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                    <span className="ref-skill-text">{skill}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                EDUCATION
              </h2>
              <div className="ref-entries-list">
                {education.map((edu, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <strong className="ref-entry-title">{edu.degree}</strong>
                    </div>
                    <div className="ref-entry-body">
                      {edu.college && <div className="ref-sub-line">{edu.college}</div>}
                      {edu.graduationYear && <div className="ref-sub-line">{edu.graduationYear}</div>}
                      {edu.cgpa && <div className="ref-sub-line">{edu.cgpa}</div>}
                      {edu.percentage && <div className="ref-sub-line">{edu.percentage}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {experience.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                EXPERIENCE
              </h2>
              <div className="ref-entries-list">
                {experience.map((exp, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <div className="ref-entry-title-row">
                        <strong className="ref-entry-title">{exp.title}{exp.company ? ` | ${exp.company}` : ''}</strong>
                        {exp.duration && <span className="ref-entry-date">({exp.duration})</span>}
                      </div>
                    </div>
                    {exp.description && <div className="ref-entry-body ref-narrative">{exp.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                ACADEMIC PROJECTS
              </h2>
              <div className="ref-entries-list">
                {projects.map((proj, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <strong className="ref-entry-title">{proj.title}{proj.tag ? ` (${proj.tag})` : ''}</strong>
                    </div>
                    {proj.description && <div className="ref-entry-body ref-narrative">{proj.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {positions.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                POSITION OF RESPONSIBILITY
              </h2>
              <div className="ref-entries-list">
                {positions.map((pos, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <strong className="ref-entry-title">{pos.title}{pos.organization ? ` — ${pos.organization}` : ''}</strong>
                    </div>
                    {pos.description && <div className="ref-entry-body ref-narrative">{pos.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {extracurriculars && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor, textTransform: 'none' }}>
                Extra-Curricular Activities
              </h2>
              <div className="ref-extracurricular-text">
                <em>{extracurriculars}</em>
              </div>
            </section>
          )}
        </div>
      </div>
    )
  }

  // ─── TWO-COLUMN / SIDEBAR LAYOUT ─────────────────────────────────────────────
  if (layout === 'two-column' || layout === 'sidebar') {
    return (
      <div className="reference-resume-paper layout-two-column" id={id}>
        {/* Left Column (Sidebar) */}
        <aside className="ref-twocol-sidebar" style={{ borderRightColor: '#e2e8f0' }}>
          <div className="ref-sidebar-header">
            <h1 className="ref-sidebar-name" style={{ color: accentColor }}>{name.toUpperCase()}</h1>
            <div className="ref-sidebar-role">{resume.title || 'Professional Resume'}</div>
          </div>

          <div className="ref-sidebar-section">
            <h3 className="ref-sidebar-heading" style={{ color: accentColor }}>CONTACT</h3>
            <div className="ref-sidebar-contact">
              {email && <div className="ref-sidebar-contact-item">✉ {email}</div>}
              {phone && <div className="ref-sidebar-contact-item">✆ (+91) {phone.replace(/^\+?91/, '').trim()}</div>}
              {location && <div className="ref-sidebar-contact-item">⚲ {location}</div>}
            </div>
            {renderSocialLinks(false)}
          </div>

          {skills.length > 0 && (
            <div className="ref-sidebar-section">
              <h3 className="ref-sidebar-heading" style={{ color: accentColor }}>SKILLS</h3>
              <div className="ref-sidebar-skills">
                {skills.map((skill, idx) => (
                  <span key={idx} className="ref-skill-chip" style={{ borderLeftColor: accentColor }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extracurriculars && (
            <div className="ref-sidebar-section">
              <h3 className="ref-sidebar-heading" style={{ color: accentColor }}>ACTIVITIES</h3>
              <div className="ref-sidebar-text">
                {extracurriculars}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column (Main Content) */}
        <main className="ref-twocol-main">
          {education.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                EDUCATION
              </h2>
              <div className="ref-entries-list">
                {education.map((edu, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <strong className="ref-entry-title">{edu.degree}</strong>
                    </div>
                    <div className="ref-entry-body">
                      {edu.college && <div className="ref-sub-line">{edu.college}</div>}
                      {edu.graduationYear && <div className="ref-sub-line">{edu.graduationYear}</div>}
                      {edu.cgpa && <div className="ref-sub-line">{edu.cgpa}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {experience.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                EXPERIENCE
              </h2>
              <div className="ref-entries-list">
                {experience.map((exp, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <div className="ref-entry-title-row">
                        <strong className="ref-entry-title">{exp.title}{exp.company ? ` | ${exp.company}` : ''}</strong>
                        {exp.duration && <span className="ref-entry-date">({exp.duration})</span>}
                      </div>
                    </div>
                    {exp.description && <div className="ref-entry-body ref-narrative">{exp.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {projects.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                ACADEMIC PROJECTS
              </h2>
              <div className="ref-entries-list">
                {projects.map((proj, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <strong className="ref-entry-title">{proj.title}{proj.tag ? ` (${proj.tag})` : ''}</strong>
                    </div>
                    {proj.description && <div className="ref-entry-body ref-narrative">{proj.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {positions.length > 0 && (
            <section className="ref-section">
              <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
                POSITION OF RESPONSIBILITY
              </h2>
              <div className="ref-entries-list">
                {positions.map((pos, idx) => (
                  <div key={idx} className="ref-entry-block">
                    <div className="ref-entry-head">
                      <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                      <strong className="ref-entry-title">{pos.title}{pos.organization ? ` — ${pos.organization}` : ''}</strong>
                    </div>
                    {pos.description && <div className="ref-entry-body ref-narrative">{pos.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    )
  }

  // ─── SINGLE-COLUMN LAYOUT (Reference / Tier-1 Placement Standard) ─────────────
  return (
    <div className="reference-resume-paper layout-single" id={id}>
      {/* ── HEADER ── */}
      <div className="ref-header">
        <h1 className="ref-name" style={{ color: accentColor }}>{name.toUpperCase()}</h1>
        {contactParts.length > 0 && (
          <div className="ref-contact">
            {contactParts.join(' | ')}
          </div>
        )}
        {renderSocialLinks(false)}
      </div>

      {/* ── SKILLS ── */}
      {skills.length > 0 && (
        <section className="ref-section">
          <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
            SKILLS
          </h2>
          <div className="ref-skills-grid">
            {skills.map((skill, idx) => (
              <div key={idx} className="ref-skill-item">
                <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                <span className="ref-skill-text">{skill}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EDUCATION ── */}
      {education.length > 0 && (
        <section className="ref-section">
          <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
            EDUCATION
          </h2>
          <div className="ref-entries-list">
            {education.map((edu, idx) => (
              <div key={idx} className="ref-entry-block">
                <div className="ref-entry-head">
                  <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                  <strong className="ref-entry-title">{edu.degree}</strong>
                </div>
                <div className="ref-entry-body">
                  {edu.college && <div className="ref-sub-line">{edu.college}</div>}
                  {edu.graduationYear && <div className="ref-sub-line">{edu.graduationYear}</div>}
                  {edu.cgpa && <div className="ref-sub-line">{edu.cgpa}</div>}
                  {edu.percentage && <div className="ref-sub-line">{edu.percentage}</div>}
                  {edu.description && <div className="ref-sub-line">{edu.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ── */}
      {experience.length > 0 && (
        <section className="ref-section">
          <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
            EXPERIENCE
          </h2>
          <div className="ref-entries-list">
            {experience.map((exp, idx) => (
              <div key={idx} className="ref-entry-block">
                <div className="ref-entry-head">
                  <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                  <div className="ref-entry-title-row">
                    <strong className="ref-entry-title">
                      {exp.title}{exp.company ? ` | ${exp.company}` : ''}
                    </strong>
                    {exp.duration && (
                      <span className="ref-entry-date">({exp.duration})</span>
                    )}
                  </div>
                </div>
                {exp.description && (
                  <div className="ref-entry-body ref-narrative">
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ACADEMIC PROJECTS ── */}
      {projects.length > 0 && (
        <section className="ref-section">
          <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
            ACADEMIC PROJECTS
          </h2>
          <div className="ref-entries-list">
            {projects.map((proj, idx) => (
              <div key={idx} className="ref-entry-block">
                <div className="ref-entry-head">
                  <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                  <strong className="ref-entry-title">
                    {proj.title}{proj.tag ? ` (${proj.tag})` : ''}
                  </strong>
                </div>
                {proj.description && (
                  <div className="ref-entry-body ref-narrative">
                    {proj.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── POSITION OF RESPONSIBILITY ── */}
      {positions.length > 0 && (
        <section className="ref-section">
          <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor }}>
            POSITION OF RESPONSIBILITY
          </h2>
          <div className="ref-entries-list">
            {positions.map((pos, idx) => (
              <div key={idx} className="ref-entry-block">
                <div className="ref-entry-head">
                  <span className="ref-diamond" style={{ color: accentColor }}>❖</span>
                  <strong className="ref-entry-title">
                    {pos.title}{pos.organization ? ` — ${pos.organization}` : ''}
                  </strong>
                </div>
                {pos.description && (
                  <div className="ref-entry-body ref-narrative">
                    {pos.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXTRA-CURRICULAR ACTIVITIES ── */}
      {extracurriculars && (
        <section className="ref-section">
          <h2 className="ref-section-heading" style={{ color: accentColor, borderColor: accentColor, textTransform: 'none' }}>
            Extra-Curricular Activities
          </h2>
          <div className="ref-extracurricular-text">
            <em>{extracurriculars}</em>
          </div>
        </section>
      )}
    </div>
  )
}

export default ReferenceResumeDocument
