import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'General Resume' },
    version: { type: Number, default: 1, min: 1 },
    personal: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      location: { type: String, trim: true, default: '' },
      organization: { type: String, trim: true, default: '' },
      dateOfBirth: { type: Date, default: null },
      linkedin: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
    },
    summary: { type: String, trim: true, default: '' },
    education: [{ type: mongoose.Schema.Types.Mixed }],
    skills: [{ type: String, trim: true }],
    experience: [{ type: mongoose.Schema.Types.Mixed }],
    projects: [{ type: mongoose.Schema.Types.Mixed }],
    certifications: [{ type: mongoose.Schema.Types.Mixed }],
    achievements: [{ type: mongoose.Schema.Types.Mixed }],
    publications: [{ type: mongoose.Schema.Types.Mixed }],
    languages: [{ type: String, trim: true }],
    positionsOfResponsibility: [{ type: mongoose.Schema.Types.Mixed }],
    extracurriculars: { type: String, trim: true, default: '' },
    customSections: [{ type: mongoose.Schema.Types.Mixed }],
    template: { type: String, trim: true, default: 'shailesh-format' },
    targetOpportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', default: null },
    sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    aiGenerated: { type: Boolean, default: false },
    aiMetadata: {
      modelVersion: { type: String, default: '' },
      lastOperation: { type: String, default: '' },
      warnings: [{ type: String }],
      unsupportedClaims: [{ type: String }],
    },
    analysis: {
      status: { type: String, enum: ['none', 'processing', 'complete', 'failed'], default: 'none' },
      score: { type: Number, min: 0, max: 100, default: null },
      sections: [{ type: mongoose.Schema.Types.Mixed }],
      missingSkills: [{ type: String }],
      jobAlignment: { type: mongoose.Schema.Types.Mixed, default: null },
      warnings: [{ type: String }],
      analyzedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
)

resumeSchema.index({ studentId: 1, updatedAt: -1 })
resumeSchema.index({ studentId: 1, title: 1, version: 1 })

export default mongoose.model('Resume', resumeSchema)
