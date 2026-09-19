import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config()

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
]

const missingVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
)

if (missingVars.length > 0) {
  console.warn(
    `⚠️ Missing environment variables: ${missingVars.join(', ')}`
  )
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',

  isDevelopment:
    (process.env.NODE_ENV || 'development') === 'development',

  isProduction:
    process.env.NODE_ENV === 'production',

  // Render provides PORT automatically
  serverPort: parseInt(
    process.env.PORT || process.env.SERVER_PORT || '5000',
    10
  ),

  clientUrl:
    process.env.CLIENT_URL || 'http://localhost:5173',

  aiServiceUrl:
    process.env.AI_SERVICE_URL || 'http://localhost:8000',

  mongoUri:
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/aicp',

  mongoDbName:
    process.env.MONGO_DB_NAME || 'aicp',

  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN || '15m',

  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET,

  refreshTokenExpiresIn:
    process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // OTP configuration
  otpExpiresMinutes:
    parseInt(
      process.env.OTP_EXPIRES_MINUTES || '5',
      10
    ),

  otpLength:
    parseInt(
      process.env.OTP_LENGTH || '6',
      10
    ),

  otpMaxAttempts:
    parseInt(
      process.env.OTP_MAX_ATTEMPTS || '5',
      10
    ),

  otpResendCooldownSeconds:
    parseInt(
      process.env.OTP_RESEND_COOLDOWN_SECONDS || '60',
      10
    ),

  // =====================================================
  // BREVO HTTPS EMAIL CONFIGURATION
  // =====================================================

  mail: {
    enabled:
      process.env.EMAIL_ENABLED !== 'false',

    apiKey:
      process.env.BREVO_API_KEY,

    from:
      process.env.BREVO_FROM_EMAIL,

    fromName:
      process.env.BREVO_FROM_NAME || 'AICP Portal',
  },

  uploadDir:
    process.env.UPLOAD_DIR || './uploads',

  maxFileSizeMB:
    parseInt(
      process.env.MAX_FILE_SIZE_MB || '10',
      10
    ),

  allowedFileExtensions:
    (
      process.env.ALLOWED_FILE_EXTENSIONS ||
      'pdf,doc,docx'
    ).split(','),

  logLevel:
    process.env.LOG_LEVEL || 'debug',

  bcryptRounds:
    parseInt(
      process.env.BCRYPT_ROUNDS || '10',
      10
    ),

  corsOrigin:
    process.env.CORS_ORIGIN ||
    'http://localhost:5173',

  rateLimitWindowMs:
    parseInt(
      process.env.RATE_LIMIT_WINDOW_MS ||
      '900000',
      10
    ),

  rateLimitMaxRequests:
    parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10
    ),

  aiInferenceTimeoutMs:
    parseInt(
      process.env.AI_INFERENCE_TIMEOUT_MS ||
      '30000',
      10
    ),

  debug:
    process.env.DEBUG === 'true',

  openAiApiKey:
    process.env.OPENAI_API_KEY || '',

  opportunityRadar: {
    syncEnabled: process.env.OPPORTUNITY_RADAR_SYNC_ENABLED !== 'false',
    syncIntervalMinutes: parseInt(process.env.OPPORTUNITY_RADAR_SYNC_INTERVAL_MINUTES || '60', 10),
    syncConcurrency: parseInt(process.env.OPPORTUNITY_RADAR_SYNC_CONCURRENCY || '3', 10),
    autoExpireEnabled: process.env.OPPORTUNITY_RADAR_AUTO_EXPIRE_ENABLED !== 'false',
  },
}

export default config