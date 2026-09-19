import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse/lib/pdf-parse.js')
const mammoth = require('mammoth')

export const extractResumeText = async (document) => {
  const buffer = await fs.readFile(document.storagePath)
  const extension = path.extname(document.originalName).toLowerCase()
  if (extension === '.pdf') {
    const result = await pdfParse(buffer)
    return result.text.trim()
  }
  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }
  if (extension === '.doc') {
    throw new Error('Legacy .doc files are not supported for extraction. Save the file as .docx or PDF.')
  }
  throw new Error('Only PDF and DOCX resumes can be analyzed')
}

export const normalizeResume = ({ user = {}, profile = {}, portfolio = {}, resume = {} }) => {
  let defaultEdu = []
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    defaultEdu = profile.education.map((e) => ({
      degree: e.degree || e.title || (profile.department ? `B.Tech in ${profile.department}` : 'B.Tech in Computer Science and Engineering'),
      college: e.college || e.institution || profile.college || '',
      graduationYear: e.graduationYear ? `Expected Graduation: ${e.graduationYear}` : (profile.graduationYear ? `Expected Graduation: ${profile.graduationYear}` : ''),
      cgpa: e.cgpa ? `CGPA: ${e.cgpa}` : (profile.cgpa ? `CGPA: ${profile.cgpa}` : ''),
      percentage: e.percentage ? `Percentage: ${e.percentage}%` : '',
    }))
  } else if (profile.college || profile.department || profile.graduationYear) {
    defaultEdu = [{
      degree: profile.department ? `B.Tech in ${profile.department}` : 'B.Tech in Computer Science and Engineering',
      college: profile.college || 'Engineering Institute',
      graduationYear: profile.graduationYear ? `Expected Graduation: ${profile.graduationYear}` : '',
      cgpa: profile.cgpa ? `CGPA: ${profile.cgpa}` : '',
    }]
  }

  const defaultProjects = (portfolio.projects || []).map((p) => ({
    title: p.title || p.name || 'Academic Project',
    tag: p.tag || '',
    technologies: Array.isArray(p.technologies) ? p.technologies : [],
    description: p.description || p.solution || '',
  }))

  return {
    personal: {
      name: resume.personal?.name || user.name || '',
      email: resume.personal?.email || user.email || '',
      phone: resume.personal?.phone || user.phone || '',
      location: resume.personal?.location || profile.location || '',
      organization: resume.personal?.organization || user.organization || '',
      dateOfBirth: resume.personal?.dateOfBirth || user.dateOfBirth || '',
      linkedin: resume.personal?.linkedin || portfolio.linkedin || '',
      github: resume.personal?.github || portfolio.github || '',
      portfolio: resume.personal?.portfolio || portfolio.website || '',
    },
    summary: resume.summary || profile.bio || portfolio.bio || '',
    education: resume.education?.length ? resume.education : defaultEdu,
    skills: resume.skills?.length ? resume.skills : user.skills || [],
    experience: resume.experience?.length ? resume.experience : [],
    projects: resume.projects?.length ? resume.projects : defaultProjects,
    positionsOfResponsibility: resume.positionsOfResponsibility?.length ? resume.positionsOfResponsibility : [],
    extracurriculars: resume.extracurriculars || '',
    certifications: resume.certifications?.length ? resume.certifications : portfolio.certifications || [],
    achievements: resume.achievements?.length ? resume.achievements : portfolio.achievements || [],
    publications: resume.publications || [],
    languages: resume.languages || [],
    customSections: resume.customSections || [],
    template: resume.template || 'shailesh-format',
  }
}

export const resumeText = (resume) => JSON.stringify({
  summary: resume.summary,
  education: resume.education,
  skills: resume.skills,
  experience: resume.experience,
  projects: resume.projects,
  positionsOfResponsibility: resume.positionsOfResponsibility,
  extracurriculars: resume.extracurriculars,
  certifications: resume.certifications,
  achievements: resume.achievements,
  publications: resume.publications,
})

const sectionAliases = {
  summary: ['summary', 'professional summary', 'profile', 'objective'],
  education: ['education', 'academic background'],
  experience: ['experience', 'work experience', 'employment'],
  projects: ['projects', 'personal projects', 'academic projects'],
  skills: ['skills', 'technical skills', 'skills & technologies'],
  certifications: ['certifications', 'certificates'],
  achievements: ['achievements', 'awards'],
  publications: ['publications'],
}

const headingFor = (line) => {
  const normalized = line.replace(/[:-]/g, '').trim().toLowerCase()
  return Object.entries(sectionAliases).find(([, aliases]) => aliases.includes(normalized))?.[0] || null
}

export const extractStructuredResume = (text, fallback = {}) => {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.replace(/[•▪●]/g, '').trim()).filter(Boolean)
  const sections = {}
  let current = 'summary'
  for (const line of lines) {
    const heading = headingFor(line)
    if (heading) {
      current = heading
      sections[current] = []
    } else {
      if (!sections[current]) sections[current] = []
      sections[current].push(line)
    }
  }
  const email = lines.find((line) => /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(line))?.match(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/)?.[0] || ''
  const phone = lines.find((line) => /(?:\+?\d[\d\s().-]{7,}\d)/.test(line))?.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || ''
  const name = lines.find((line) => line !== email && line !== phone && !headingFor(line) && !/@/.test(line) && line.length < 70) || ''
  const asItems = (values) => values.map((value) => ({ description: value }))
  const parsedSkills = (sections.skills || []).flatMap((line) => line.split(/[,|;]/)).map((skill) => skill.trim()).filter(Boolean)
  return {
    ...fallback,
    personal: { ...fallback.personal, name: name || fallback.personal?.name || '', email: email || fallback.personal?.email || '', phone: phone || fallback.personal?.phone || '' },
    summary: sections.summary?.join(' ') || fallback.summary || '',
    skills: parsedSkills.length ? [...new Set(parsedSkills)] : fallback.skills || [],
    education: sections.education?.length ? asItems(sections.education) : fallback.education || [],
    experience: sections.experience?.length ? asItems(sections.experience) : fallback.experience || [],
    projects: sections.projects?.length ? asItems(sections.projects) : fallback.projects || [],
    certifications: sections.certifications?.length ? asItems(sections.certifications) : fallback.certifications || [],
    achievements: sections.achievements?.length ? asItems(sections.achievements) : fallback.achievements || [],
    publications: sections.publications?.length ? asItems(sections.publications) : fallback.publications || [],
  }
}
