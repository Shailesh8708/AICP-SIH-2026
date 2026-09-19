import mongoose from 'mongoose'

/**
 * CareerProfile — master profile built by the AI Career Interview.
 * References the existing User and StudentProfile; never duplicates fields
 * already stored there. Only career-agent-specific data lives here.
 */
const experienceSchema = new mongoose.Schema({
  organization: { type: String, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  duration: { type: String, trim: true, default: '' },
  responsibilities: [{ type: String, trim: true }],
  technologies: [{ type: String, trim: true }],
  achievements: [{ type: String, trim: true }],
}, { _id: false })

const projectSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  problemStatement: { type: String, trim: true, default: '' },
  solution: { type: String, trim: true, default: '' },
  technologies: [{ type: String, trim: true }],
  features: [{ type: String, trim: true }],
  contribution: { type: String, trim: true, default: '' },
  teamSize: { type: Number, default: 1 },
  duration: { type: String, trim: true, default: '' },
  github: { type: String, trim: true, default: '' },
  liveDemo: { type: String, trim: true, default: '' },
  impact: { type: String, trim: true, default: '' },
}, { _id: false })

const certificationSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  issuer: { type: String, trim: true, default: '' },
  date: { type: Date, default: null },
  credentialUrl: { type: String, trim: true, default: '' },
  skillsObtained: [{ type: String, trim: true }],
}, { _id: false })

const achievementSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  date: { type: Date, default: null },
  category: {
    type: String,
    enum: ['hackathon', 'award', 'competition', 'leadership', 'publication', 'opensource', 'scholarship', 'other'],
    default: 'other',
  },
}, { _id: false })

const careerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Links back to role-profile models
    studentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', default: null },

    // Supplementary personal links (name/email/phone already on User)
    linkedin: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    portfolio: { type: String, trim: true, default: '' },

    // Education enrichment (college/dept/grad already on StudentProfile)
    currentYear: { type: Number, default: null },
    currentSemester: { type: Number, default: null },
    relevantCoursework: [{ type: String, trim: true }],

    // Skill taxonomy — structured version beyond User.skills array
    skillsByCategory: {
      programmingLanguages: [{ type: String, trim: true }],
      frameworks: [{ type: String, trim: true }],
      libraries: [{ type: String, trim: true }],
      databases: [{ type: String, trim: true }],
      aiMl: [{ type: String, trim: true }],
      webDev: [{ type: String, trim: true }],
      cloud: [{ type: String, trim: true }],
      devops: [{ type: String, trim: true }],
      cybersecurity: [{ type: String, trim: true }],
      tools: [{ type: String, trim: true }],
    },

    // Career-agent-collected data
    experience: [experienceSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    achievements: [achievementSchema],

    // Target role preferences
    targetRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],

    // Computed scores — AI-generated indicators, not scientifically validated
    scores: {
      overall: { type: Number, min: 0, max: 100, default: null },
      skills: { type: Number, min: 0, max: 100, default: null },
      projects: { type: Number, min: 0, max: 100, default: null },
      experience: { type: Number, min: 0, max: 100, default: null },
      github: { type: Number, min: 0, max: 100, default: null },
      linkedin: { type: Number, min: 0, max: 100, default: null },
      resume: { type: Number, min: 0, max: 100, default: null },
      certifications: { type: Number, min: 0, max: 100, default: null },
      interviewReadiness: { type: Number, min: 0, max: 100, default: null },
      internshipReadiness: { type: Number, min: 0, max: 100, default: null },
      analyzedAt: { type: Date, default: null },
    },

    // Interview completion state
    interviewCompletedAt: { type: Date, default: null },
    interviewVersion: { type: Number, default: 0 },

    // GitHub analysis cache
    githubAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },

    // LinkedIn analysis cache
    linkedinAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },

    // Next-best-action text (AI-generated)
    nextBestAction: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
)

careerProfileSchema.index({ userId: 1 })

const CareerProfile = mongoose.model('CareerProfile', careerProfileSchema)
export default CareerProfile
