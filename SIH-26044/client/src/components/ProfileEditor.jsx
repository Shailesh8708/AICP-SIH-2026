import React, { useEffect, useState } from 'react'
import { Building2, Check, GraduationCap, Landmark, Save, Users } from 'lucide-react'
import { Button, Input } from './common'
import { GainSkillsCard } from './GainSkillsCard'
import { profileAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const roleConfig = {
  student: { label: 'STUDENT PROFILE', title: 'Build your opportunity profile', intro: 'Add your education, goals, and evidence so AICP can match you with the right opportunities.', icon: GraduationCap, fields: [['college', 'College / university'], ['department', 'Department'], ['graduationYear', 'Graduation year'], ['cgpa', 'CGPA']], long: [['bio', 'About you', 'Tell employers what you are building toward.'], ['careerGoals', 'Career goals', 'Data Analyst, Product Engineer'], ['interests', 'Interests', 'AI, healthcare, research']], endpoint: 'student' },
  industry: { label: 'COMPANY PROFILE', title: 'Represent your company', intro: 'Give candidates and partners a clear view of your company, sector, and hiring focus.', icon: Building2, fields: [['companyName', 'Company name'], ['industry', 'Industry sector'], ['companySize', 'Company size'], ['website', 'Company website'], ['headquarters', 'Headquarters']], long: [['description', 'Company description', 'Describe your mission, teams, and the talent you are looking for.']], endpoint: 'industry' },
  academician: { label: 'ACADEMICIAN PROFILE', title: 'Share your academic expertise', intro: 'Make your teaching, research, publications, and mentorship interests discoverable to industry and learners.', icon: Users, fields: [['institution', 'Institution'], ['department', 'Department'], ['designation', 'Designation']], long: [['specialization', 'Specialization areas', 'Machine Learning, Ayurveda technology'], ['publications', 'Publications', 'One publication per line'], ['bio', 'Academic bio', 'Describe your research and teaching focus.']], endpoint: 'academician' },
  institution: { label: 'INSTITUTION PROFILE', title: 'Configure your institution', intro: 'Maintain the institutional data used for student readiness, partner coordination, and outcome reporting.', icon: Landmark, fields: [['institutionName', 'Institution name'], ['type', 'Institution type'], ['location', 'Location'], ['website', 'Website'], ['accreditation', 'Accreditation'], ['studentCount', 'Student count'], ['facultyCount', 'Faculty count']], long: [['departments', 'Departments', 'Computer Science, Electronics, Management'], ['description', 'Institution description', 'Describe your campus and collaboration priorities.']], endpoint: 'institution' },
}

const initialForm = { name: '', college: '', department: '', graduationYear: '', cgpa: '', careerGoals: '', interests: '', bio: '', companyName: '', industry: '', companySize: '', website: '', headquarters: '', description: '', institution: '', designation: '', specialization: '', publications: '', institutionName: '', type: '', location: '', accreditation: '', studentCount: '', facultyCount: '', departments: '' }
const arrayFields = new Set(['careerGoals', 'interests', 'specialization', 'publications', 'departments'])
const toText = (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' ? item.name || item.title || '' : item).filter(Boolean).join(', ') : value || ''

export const ProfileEditor = () => {
  const { user } = useAuth()
  const config = roleConfig[user?.role] || roleConfig.student
  const RoleIcon = config.icon
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const getter = profileAPI[`get${config.endpoint[0].toUpperCase()}${config.endpoint.slice(1)}Profile`]
    getter?.().then((response) => {
      const profile = response?.data?.profile || {}
      const userData = response?.data?.user || {}
      setForm((current) => Object.fromEntries(Object.keys(current).map((key) => [key, key === 'name' ? userData.name || user?.name || '' : toText(profile[key])])))
    }).catch(() => setError('Could not load your profile. You can still enter your details.')).finally(() => setLoading(false))
  }, [config.endpoint, user?.name])
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const save = async (event) => { event.preventDefault(); setSaving(true); setError(''); setMessage(''); try { const payload = Object.fromEntries(Object.entries(form).filter(([key, value]) => key !== 'name' && value !== '')); if (form.name) payload.name = form.name; for (const key of arrayFields) if (payload[key]) payload[key] = payload[key].split(',').map((item) => item.trim()).filter(Boolean); await profileAPI[`update${config.endpoint[0].toUpperCase()}${config.endpoint.slice(1)}Profile`](payload); setMessage('Profile saved successfully.') } catch (err) { setError(err.message || 'Could not save your profile.') } finally { setSaving(false) } }
  return <div className="profile-editor"><div className="editor-heading"><div><div className="profile-title-icon"><RoleIcon size={20} /></div><span className="section-label">{config.label}</span><h2>{config.title}</h2><p>{config.intro}</p></div>{message && <span className="save-message"><Check size={15} /> {message}</span>}</div>{user?.role === 'student' && <div style={{ marginBottom: 24 }}><GainSkillsCard /></div>}{error && <p className="workspace-error">{error}</p>}{loading ? <div className="workspace-empty">Loading {config.endpoint} profile...</div> : <form onSubmit={save} className="profile-form"><Input label="Account name" value={form.name} onChange={change('name')} required /><div className="profile-form-grid">{config.fields.slice(0, 2).map(([field, label]) => <Input key={field} label={label} type={field.toLowerCase().includes('count') || field === 'cgpa' || field === 'graduationYear' ? 'number' : 'text'} value={form[field]} onChange={change(field)} />)}</div>{config.fields.slice(2).map(([field, label]) => <Input key={field} label={label} type={field.toLowerCase().includes('count') || field === 'cgpa' || field === 'graduationYear' ? 'number' : field === 'website' ? 'url' : 'text'} value={form[field]} onChange={change(field)} />)}{config.long.map(([field, label, placeholder]) => <label className="profile-field" key={field}>{label}<textarea rows={field === 'bio' || field === 'description' ? 5 : 3} value={form[field]} onChange={change(field)} placeholder={placeholder} /><small>{arrayFields.has(field) ? 'Separate entries with commas.' : ''}</small></label>)}<Button type="submit" variant="nav" loading={saving}><Save size={17} /> Save {config.endpoint} profile</Button></form>}</div>
}
