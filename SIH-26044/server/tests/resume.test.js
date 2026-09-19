import { describe, expect, it } from 'vitest'
import { extractStructuredResume, normalizeResume, resumeText } from '../src/utils/resume.js'

describe('Structured resumes', () => {
  it('imports verified profile fields without inventing sections', () => {
    const resume = normalizeResume({
      user: { name: 'Student', email: 'student@example.com', skills: ['React'] },
      profile: { college: 'AICP University', department: 'Computer Science', graduationYear: 2027 },
      portfolio: { projects: [{ title: 'Portal', description: 'Built a portal', technologies: ['React'] }] },
    })
    expect(resume.personal.name).toBe('Student')
    expect(resume.skills).toEqual(['React'])
    expect(resume.projects[0].title).toBe('Portal')
    expect(resume.experience).toEqual([])
  })

  it('creates bounded text for grounded analysis', () => {
    const text = resumeText({ summary: 'React student', skills: ['React'], projects: [{ description: 'Portal' }] })
    expect(text).toContain('React student')
    expect(text).toContain('Portal')
  })

  it('extracts uploaded resume sections before profile fallback', () => {
    const resume = extractStructuredResume(`
      Kavita Deshwal
      kavita@example.com
      SUMMARY
      Frontend developer focused on accessible interfaces.
      SKILLS
      React, JavaScript, CSS
      PROJECTS
      Built an AICP dashboard
      EDUCATION
      B.Tech Computer Science - 2027
    `, { personal: { name: 'Profile Name' }, skills: ['Python'] })
    expect(resume.personal.name).toBe('Kavita Deshwal')
    expect(resume.skills).toEqual(['React', 'JavaScript', 'CSS'])
    expect(resume.projects[0].description).toContain('AICP dashboard')
    expect(resume.skills).not.toContain('Python')
  })

  it('preserves structured education, experience, positions of responsibility, and extracurriculars', () => {
    const resume = normalizeResume({
      user: { name: 'SHAILESH', email: 'shailesh@example.com', phone: '8708687350', skills: ['Python', 'Machine Learning'] },
      profile: { college: 'Panipat Institute of Engineering and Technology', department: 'AI & ML', graduationYear: '2028', cgpa: '8.35' },
      resume: {
        experience: [
          { title: 'Data Analysis Using AI Intern', company: 'BharatCares & IBM SkillsBuild', duration: 'Aug 17 – Sep 30, 2026', description: 'Applying AI-powered data analysis techniques' },
        ],
        projects: [
          { title: 'AI Healthcare & Fitness Coach', tag: 'IBM Skill-Build', description: 'Designed and developed an AI assistant' },
        ],
        positionsOfResponsibility: [
          { title: 'Member', organization: 'Log10 Club (Department)', description: 'Contributed to technical activities' },
        ],
        extracurriculars: 'Job Simulations Of Large Companies Via Forage.',
      },
    })
    expect(resume.personal.name).toBe('SHAILESH')
    expect(resume.skills).toContain('Python')
    expect(resume.education[0].degree).toContain('AI & ML')
    expect(resume.education[0].college).toBe('Panipat Institute of Engineering and Technology')
    expect(resume.experience[0].title).toBe('Data Analysis Using AI Intern')
    expect(resume.projects[0].title).toBe('AI Healthcare & Fitness Coach')
    expect(resume.positionsOfResponsibility[0].organization).toBe('Log10 Club (Department)')
    expect(resume.extracurriculars).toContain('Job Simulations')
  })

  it('supports selecting and persisting any template from the 320 template catalog', async () => {
    const Resume = (await import('../src/models/Resume.js')).default
    const mongoose = (await import('mongoose')).default

    const sample = new Resume({
      studentId: new mongoose.Types.ObjectId(),
      title: 'DevOps Specialist Resume',
      template: 'jakes-classic',
      personal: { name: 'Alex Rivera' },
      skills: ['Docker', 'Kubernetes'],
    })

    const validationError = sample.validateSync()
    expect(validationError).toBeUndefined()
    expect(sample.template).toBe('jakes-classic')
  })
})
