import mongoose from 'mongoose'

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'internship',
        'job',
        'project',
        'training',
        'graduate_program',
        'apprenticeship',
        'coop',
        'entry_level',
      ],
      default: 'internship',
    },
    // Company information (supports official enterprise sources as well as internal creators)
    company: {
      name: { type: String, trim: true, default: '' },
      logo: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
      careerUrl: { type: String, trim: true, default: '' },
      sector: { type: String, trim: true, default: '' },
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    locationDetails: {
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
      remote: { type: Boolean, default: false },
      hybrid: { type: Boolean, default: false },
    },
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'remote' },
    duration: {
      type: String,
      trim: true,
      default: 'Flexible',
    },
    stipend: {
      type: Number,
      default: 0,
    },
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      text: { type: String, trim: true, default: '' },
    },
    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],
    experienceRequired: { type: String, trim: true, default: 'Entry level' },
    eligibility: { type: String, trim: true, default: '' },
    eligibilityCriteria: {
      education: [{ type: String, trim: true }],
      branches: [{ type: String, trim: true }],
      graduationYear: [{ type: String, trim: true }],
      experience: { type: String, trim: true, default: '' },
      cgpa: { type: Number, default: 0 },
    },
    openings: { type: Number, min: 1, default: 1 },
    applicationQuestions: [{ type: String, trim: true }],
    minGPA: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    deadline: {
      type: Date,
      default: null,
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    about: {
      type: String,
      trim: true,
      default: '',
    },
    // Discovery & Official Source Verification
    source: {
      type: {
        type: String,
        enum: ['official_radar', 'portal_direct'],
        default: 'portal_direct',
      },
      sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OpportunitySource',
        default: null,
      },
      platform: { type: String, trim: true, default: 'direct' },
      officialUrl: { type: String, trim: true, default: '' },
      verified: { type: Boolean, default: false },
      discoveredAt: { type: Date, default: Date.now },
      lastCheckedAt: { type: Date, default: Date.now },
    },
    // Legitimate official company application URL (direct apply form / ATS candidate portal)
    applicationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Specific job or internship posting page URL
    postingUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Backwards-compatibility alias for application URL
    applyUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Deterministic SHA-256 fingerprint to prevent duplicates
    fingerprint: {
      type: String,
      trim: true,
      sparse: true,
    },
    // Self-made AI Analysis & Classification
    ai: {
      category: { type: String, trim: true, default: 'Software Development' },
      extractedSkills: [{ type: String, trim: true }],
      normalizedSkills: [{ type: String, trim: true }],
      summary: { type: String, trim: true, default: '' },
      difficulty: {
        type: String,
        enum: ['entry', 'intermediate', 'advanced'],
        default: 'entry',
      },
      confidence: { type: Number, min: 0, max: 1, default: 0.9 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'expired'],
      default: 'open',
    },
  },
  { timestamps: true }
)

opportunitySchema.index({ type: 1 })
opportunitySchema.index({ status: 1 })
opportunitySchema.index({ createdBy: 1 })
opportunitySchema.index({ 'company.name': 1 })
opportunitySchema.index({ 'source.type': 1 })
opportunitySchema.index({ 'source.verified': 1 })
opportunitySchema.index({ 'ai.category': 1 })
opportunitySchema.index({ 'locationDetails.country': 1 })
opportunitySchema.index({ fingerprint: 1 }, { sparse: true })
opportunitySchema.index({ createdAt: -1 })

const Opportunity = mongoose.model('Opportunity', opportunitySchema)

export default Opportunity
