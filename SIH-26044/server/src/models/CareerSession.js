import mongoose from 'mongoose'

/**
 * CareerSession — stores the state of one AI Career Interview session.
 * Multiple sessions can exist per user (e.g. re-interview after 3 months).
 */
const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['assistant', 'user'], required: true },
  content: { type: String, trim: true, required: true },
  timestamp: { type: Date, default: Date.now },
  // Which interview stage this message belongs to
  stage: {
    type: String,
    enum: ['personal', 'education', 'skills', 'experience', 'projects', 'achievements', 'certifications', 'preferences', 'complete'],
    default: 'personal',
  },
  evaluation: { type: mongoose.Schema.Types.Mixed, default: null },
  enteredViaMic: { type: Boolean, default: false },
}, { _id: false })

const careerSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    careerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareerProfile',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    currentStage: {
      type: String,
      enum: ['personal', 'education', 'skills', 'experience', 'projects', 'achievements', 'certifications', 'preferences', 'complete'],
      default: 'personal',
    },
    messages: [messageSchema],
    // Round number for tracking repeat interviews
    sessionRound: { type: Number, default: 1 },
    // Structured evaluations and ratings per question
    evaluations: [
      {
        stage: { type: String },
        question: { type: String },
        answer: { type: String },
        score: { type: Number, default: 0 },
        ratingTier: { type: String, default: 'Good' },
        feedback: { type: String, default: '' },
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        modelAnswer: { type: String, default: '' },
        speechAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
    // Structured data collected so far (partial profile)
    collectedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    speechMetrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

careerSessionSchema.index({ userId: 1, status: 1 })
careerSessionSchema.index({ userId: 1, updatedAt: -1 })

const CareerSession = mongoose.model('CareerSession', careerSessionSchema)
export default CareerSession
