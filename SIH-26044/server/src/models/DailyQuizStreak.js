import mongoose from 'mongoose'

const dailyQuizStreakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastCompletedDate: {
      type: String, // 'YYYY-MM-DD'
      default: '',
    },
    totalQuizzesTaken: {
      type: Number,
      default: 0,
    },
    totalCorrect: {
      type: Number,
      default: 0,
    },
    answeredQuestionIds: {
      type: [String],
      default: [],
    },
    badges: [
      {
        badgeId: { type: String, required: true },
        title: { type: String, required: true },
        tier: { type: Number, required: true },
        daysRequired: { type: Number, required: true },
        description: { type: String, required: true },
        icon: { type: String, default: 'trophy' },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    history: [
      {
        date: { type: String, required: true },
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        category: { type: String, enum: ['soft_skills', 'technical', 'aptitude'], required: true },
        selectedOption: { type: Number, required: true },
        correctOption: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String, default: '' },
        completedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
)

const DailyQuizStreak = mongoose.model('DailyQuizStreak', dailyQuizStreakSchema)

export default DailyQuizStreak

