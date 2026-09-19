import axios from 'axios'
import Resume from '../models/Resume.js'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import Portfolio from '../models/Portfolio.js'
import Document from '../models/Document.js'
import Opportunity from '../models/Opportunity.js'
import config from '../config/env.js'
import { successResponse } from '../utils/response.js'
import { normalizeResume, extractResumeText, extractStructuredResume, resumeText } from '../utils/resume.js'
import { upload } from './documentController.js'

const getProfileBundle = async (userId) => {
  const [user, profile, portfolio] = await Promise.all([
    User.findById(userId).select('name email phone dateOfBirth organization skills').lean(),
    StudentProfile.findOne({ userId }).lean(),
    Portfolio.findOne({ studentId: userId }).lean(),
  ])
  return { user: user || {}, profile: profile || {}, portfolio: portfolio || {} }
}

const ownedResume = (id, userId) => Resume.findOne({ _id: id, studentId: userId })

const createAnalysisFallback = (resume, opportunity = null) => {
  const text = resumeText(resume).toLowerCase()
  const sections = ['summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements'].map((name) => ({ name, present: Boolean(resume[name]?.length || (typeof resume[name] === 'string' && resume[name].trim())) }))
  const required = opportunity?.requiredSkills || []
  const skillSet = new Set((resume.skills || []).map((skill) => skill.toLowerCase()))
  const missingSkills = required.filter((skill) => !skillSet.has(String(skill).toLowerCase()))
  const sectionScore = sections.filter((section) => section.present).length / sections.length
  const keywordScore = required.length ? (required.length - missingSkills.length) / required.length : 1
  return {
    score: Math.round((sectionScore * 55) + (keywordScore * 45)),
    sections,
    missingSkills,
    jobAlignment: opportunity ? { matchedSkills: required.filter((skill) => !missingSkills.includes(skill)), missingSkills, explanation: missingSkills.length ? 'Some required skills are not present in the resume skills section.' : 'Required skills are represented in the resume.' } : null,
    warnings: [!resume.summary && 'Add a concise professional summary.', !resume.projects?.length && 'Add at least one project with evidence.'].filter(Boolean),
    extractedSkills: resume.skills || [],
    modelVersion: 'deterministic-resume-review-v1',
    textLength: text.length,
  }
}

const analyzeResumeRecord = async (resume, opportunity) => {
  try {
    const response = await axios.post(`${config.aiServiceUrl}/resume/analyze`, {
      resume: normalizeResume({ resume }),
      resume_text: resume.rawText || resumeText(resume),
      opportunity: opportunity ? { title: opportunity.title, description: opportunity.description, requiredSkills: opportunity.requiredSkills, preferredSkills: opportunity.preferredSkills } : null,
    }, { timeout: config.aiInferenceTimeoutMs })
    return { ...response.data, fallback: false }
  } catch (error) {
    if (['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) return { ...createAnalysisFallback(resume, opportunity), fallback: true }
    throw error
  }
}
export const listResumes = async (req, res, next) => {
  try {
    const items = await Resume.find({ studentId: req.user.userId }).sort({ updatedAt: -1 }).select('-analysis.sections')
    return res.status(200).json(successResponse({ items }))
  } catch (error) { next(error) }
}

export const getResume = async (req, res, next) => {
  try {
    const resume = await ownedResume(req.params.id, req.user.userId)
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
    return res.status(200).json(successResponse({ resume }))
  } catch (error) { next(error) }
}

export const createResumeFromProfile = async (req, res, next) => {
  try {
    const bundle = await getProfileBundle(req.user.userId)
    const data = normalizeResume(bundle)
    const resume = await Resume.create({ studentId: req.user.userId, title: req.body.title || 'General Resume', template: req.body.template || 'ats-modern', ...data })
    return res.status(201).json(successResponse({ resume }, 'Resume created from your verified profile'))
  } catch (error) { next(error) }
}

export const createResume = async (req, res, next) => {
  try {
    const data = normalizeResume({ resume: req.body })
    const resume = await Resume.create({ studentId: req.user.userId, title: req.body.title || 'Untitled Resume', template: req.body.template || 'ats-modern', ...data })
    return res.status(201).json(successResponse({ resume }, 'Resume created'))
  } catch (error) { next(error) }
}

export const updateResume = async (req, res, next) => {
  try {
    const resume = await ownedResume(req.params.id, req.user.userId)
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
    const allowed = ['title', 'personal', 'summary', 'education', 'skills', 'experience', 'projects', 'certifications', 'achievements', 'publications', 'languages', 'customSections', 'template', 'targetOpportunityId', 'positionsOfResponsibility', 'extracurriculars']
    allowed.forEach((field) => { if (req.body[field] !== undefined) resume[field] = req.body[field] })
    resume.aiGenerated = Boolean(req.body.aiGenerated)
    await resume.save()
    return res.status(200).json(successResponse({ resume }, 'Resume saved'))
  } catch (error) { next(error) }
}

export const deleteResume = async (req, res, next) => {
  try {
    const result = await Resume.deleteOne({ _id: req.params.id, studentId: req.user.userId })
    if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Resume not found' })
    return res.status(200).json(successResponse(null, 'Resume deleted'))
  } catch (error) { next(error) }
}

export const duplicateResume = async (req, res, next) => {
  try {
    const source = await ownedResume(req.params.id, req.user.userId).lean()
    if (!source) return res.status(404).json({ success: false, message: 'Resume not found' })
    const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...copy } = source
    const resume = await Resume.create({ ...copy, title: req.body.title || `${source.title} copy`, version: source.version + 1, _id: undefined })
    return res.status(201).json(successResponse({ resume }, 'Resume duplicated'))
  } catch (error) { next(error) }
}

export const analyzeResume = async (req, res, next) => {
  try {
    const resume = await ownedResume(req.params.id, req.user.userId)
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
    const opportunity = req.body.opportunityId ? await Opportunity.findById(req.body.opportunityId).lean() : null
    let analysisInput = resume.toObject()
    if (resume.sourceDocumentId) {
      const document = await Document.findOne({ _id: resume.sourceDocumentId, userId: req.user.userId, documentType: 'resume' }).lean()
      if (document) {
        const rawText = await extractResumeText(document)
        const extracted = extractStructuredResume(rawText, analysisInput)
        Object.assign(resume, extracted)
        analysisInput = { ...resume.toObject(), rawText }
      }
    }
    resume.analysis.status = 'processing'
    await resume.save()
    const analysis = await analyzeResumeRecord(analysisInput, opportunity)
    resume.analysis = { status: 'complete', score: analysis.score, sections: analysis.sections, missingSkills: analysis.missingSkills || [], jobAlignment: analysis.jobAlignment || null, warnings: analysis.warnings || [], analyzedAt: new Date() }
    resume.aiMetadata = { modelVersion: analysis.modelVersion || '', lastOperation: 'analyze_resume', warnings: analysis.warnings || [], unsupportedClaims: analysis.unsupportedClaims || [] }
    await resume.save()
    return res.status(200).json(successResponse({ analysis, resume }, analysis.fallback ? 'Resume analyzed with local fallback' : 'Resume analyzed by AICP AI'))
  } catch (error) { next(error) }
}

export const uploadResume = (req, res, next) => {
  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) return next(uploadError)
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Resume file is required' })
      const document = await Document.create({ userId: req.user.userId, fileName: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, documentType: 'resume', storagePath: req.file.path })
      const bundle = await getProfileBundle(req.user.userId)
      const profileData = normalizeResume(bundle)
      const rawText = await extractResumeText(document)
      const data = extractStructuredResume(rawText, profileData)
      const resume = await Resume.create({ studentId: req.user.userId, title: req.body.title || req.file.originalname, sourceDocumentId: document._id, ...data })
      let analysis = null
      try { analysis = await analyzeResumeRecord({ ...resume.toObject(), rawText }, null) } catch (error) { analysis = { ...createAnalysisFallback(data), warning: error.message } }
      if (analysis.extractedSkills?.length && !resume.skills.length) resume.skills = analysis.extractedSkills
      resume.analysis = { status: 'complete', score: analysis.score, sections: analysis.sections || [], missingSkills: analysis.missingSkills || [], warnings: analysis.warnings || [], analyzedAt: new Date() }
      await resume.save()
      return res.status(201).json(successResponse({ resume, documentId: document._id, analysis }, 'Resume uploaded and analyzed'))
    } catch (error) { next(error) }
  })
}
