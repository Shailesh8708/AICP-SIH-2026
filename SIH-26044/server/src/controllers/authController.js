import User from '../models/User.js'
import OTP from '../models/OTP.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'
import { generateOTP, hashOTP, verifyOTP } from '../utils/otp.js'
import { sendOTPEmail } from '../config/mail.js'
import { getOTPExpirationTime } from '../utils/otp.js'
import config from '../config/env.js'
import crypto from 'crypto'
import StudentProfile from '../models/StudentProfile.js'
import IndustryProfile from '../models/IndustryProfile.js'
import AcademicianProfile from '../models/AcademicianProfile.js'
import InstitutionProfile from '../models/InstitutionProfile.js'

const ALLOWED_ROLES = ['student', 'industry', 'academician', 'institution']

const normalizeEmail = (email) => email.trim().toLowerCase()

const roleProfileModels = {
  student: StudentProfile,
  industry: IndustryProfile,
  academician: AcademicianProfile,
  institution: InstitutionProfile,
}

const profileRequirements = {
  student: ['college', 'department', 'graduationYear', 'cgpa', 'skills'],
  industry: ['companyName', 'industry', 'companySize', 'headquarters'],
  academician: ['institution', 'department', 'designation', 'specialization'],
  institution: ['institutionName', 'type', 'location', 'departments'],
}

const hasValue = (value) => Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0

const validateRegistrationProfile = (role, profile = {}) => {
  const missing = (profileRequirements[role] || []).filter((field) => !hasValue(profile[field]))
  if (missing.length) return `Required ${role} fields missing: ${missing.join(', ')}`
  if (role === 'student' && (Number(profile.graduationYear) < new Date().getFullYear() || Number(profile.cgpa) < 0 || Number(profile.cgpa) > 10)) return 'Graduation year and CGPA are invalid'
  return null
}

const tokenResponse = (user) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
  tokens: {
    accessToken: generateAccessToken(user._id, user.email, user.role),
    refreshToken: generateRefreshToken(user._id),
  },
})

const issueOTP = async (res, email, purpose, payload) => {
  await OTP.deleteMany({ email, purpose })

  const plainOTP = generateOTP()
  const otpDoc = new OTP({
    email,
    otp: await hashOTP(plainOTP),
    purpose,
    payload,
    expiresAt: getOTPExpirationTime(),
  })
  await otpDoc.save()

  try {
    await sendOTPEmail(email, plainOTP)
    if (config.isDevelopment) console.log(`Development OTP for ${email}: ${plainOTP}`)
  } catch (emailError) {
    if (config.isDevelopment) {
      console.warn(`Mail delivery unavailable; using development OTP for ${email}: ${plainOTP}`)
    } else {
      throw emailError
    }
  }

  return res.status(200).json({
    success: true,
    message: 'OTP sent to your email',
    data: {
      email,
      purpose,
      expiresIn: `${config.otpExpiresMinutes} minutes`,
      ...(config.isDevelopment && { devOTP: plainOTP }),
    },
  })
}

/**
 * Register a new user
 * @POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required',
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.',
      })
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      role,
    })

    await newUser.save()

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const requestRegistrationOTP = async (req, res, next) => {
  try {
    const { name, email, role, password, phone, dateOfBirth, organization, profile = {} } = req.body
    if (!name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, role, and password are required',
      })
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }
    if (!phone || !dateOfBirth) return res.status(400).json({ success: false, message: 'Phone number and date of birth are required' })
    const profileError = validateRegistrationProfile(role, profile)
    if (profileError) return res.status(400).json({ success: false, message: profileError })

    const normalizedEmail = normalizeEmail(email)
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login instead.',
      })
    }

    return issueOTP(res, normalizedEmail, 'registration', {
      name: name.trim(),
      role,
      password,
      phone,
      dateOfBirth,
      organization,
      profile,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Request OTP for login or password reset
 * @POST /api/auth/request-otp
 */
export const requestOTP = async (req, res, next) => {
  try {
    const { email, purpose = 'login' } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      })
    }

    if (!['login', 'password_reset'].includes(purpose)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP purpose' })
    }

    const normalizedEmail = normalizeEmail(email)

    // Check if user exists for login.
    if (purpose === 'login') {
      const user = await User.findOne({ email: normalizedEmail })
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this email. Please check your email or register.',
        })
      }
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact support.',
        })
      }
    }

    return issueOTP(res, normalizedEmail, purpose)
  } catch (error) {
    next(error)
  }
}

/**
 * Verify OTP and return JWT tokens
 * @POST /api/auth/verify-otp
 */
export const verifyOTPCode = async (req, res, next) => {
  try {
    const { email, otp, purpose = 'login' } = req.body
    if (config.isDevelopment) console.log(`Verifying OTP for ${normalizeEmail(email || '')} (${purpose})`)

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      })
    }

    // Find OTP document
    const otpDoc = await OTP.findOne({
      email: normalizeEmail(email),
      purpose,
    }).select('+otp')

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP or OTP expired. Please request a new one.',
      })
    }

    // Check if OTP is expired
    if (otpDoc.isExpired()) {
      await otpDoc.deleteOne()
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      })
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpDoc.otp)
    if (config.isDevelopment) console.log(`OTP verification result: ${isValid ? 'valid' : 'invalid'}`)
    if (!isValid) {
      const exhausted = await otpDoc.incrementAttempts()
      if (exhausted) {
        return res.status(429).json({
          success: false,
          message: 'Maximum OTP attempts exceeded. Please request a new OTP.',
        })
      }
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.`,
      })
    }

    if (purpose === 'registration') {
      if (!otpDoc.payload?.name || !otpDoc.payload?.password || !ALLOWED_ROLES.includes(otpDoc.payload?.role)) {
        return res.status(400).json({ success: false, message: 'Registration data is invalid' })
      }
      const user = await User.create({
        name: otpDoc.payload.name,
        email: normalizeEmail(email),
        role: otpDoc.payload.role,
        password: otpDoc.payload.password,
        phone: otpDoc.payload.phone,
        dateOfBirth: otpDoc.payload.dateOfBirth,
        organization: otpDoc.payload.organization || '',
        isActive: true,
      })
      const profileModel = roleProfileModels[user.role]
      const profilePayload = { ...(otpDoc.payload.profile || {}), userId: user._id }
      if (user.role === 'student') {
        user.skills = profilePayload.skills
        await user.save()
      }
      await profileModel.create(profilePayload)
      await otpDoc.deleteOne()
      return res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        data: tokenResponse(user),
      })
    }

    if (purpose === 'password_reset') {
      const user = await User.findOne({ email: normalizeEmail(email) })
      if (!user || !user.isActive) {
        await otpDoc.deleteOne()
        return res.status(403).json({ success: false, message: 'User not found or account is inactive' })
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      otpDoc.payload = { ...(otpDoc.payload || {}), verified: true, resetToken }
      await otpDoc.save()
      return res.status(200).json({
        success: true,
        message: 'OTP verified. Complete the password reset.',
        data: { email: normalizeEmail(email), resetToken, expiresIn: `${config.otpExpiresMinutes} minutes` },
      })
    }

    // Find user
    const user = await User.findOne({ email: normalizeEmail(email) })
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User not found or account is inactive',
      })
    }

    // Delete used OTP
    await otpDoc.deleteOne()

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate tokens
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        ...tokenResponse(user),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const loginWithPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' })
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password')
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email. Please check your email or register.' })
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is currently inactive. Please contact support.' })
    }
    if (!user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again or reset your password.' })
    }
    user.lastLogin = new Date()
    await user.save()
    return res.status(200).json({ success: true, message: 'Login successful', data: tokenResponse(user) })
  } catch (error) {
    next(error)
  }
}

/**
 * Refresh access token
 * @POST /api/auth/refresh-token
 */
export const refreshAccessTokenHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      })
    }

    // Verify refresh token and get user ID
    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      })
    }

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User not found or account is inactive',
      })
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.email, user.role)

    res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      data: {
        accessToken: newAccessToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' })
    }
    res.status(200).json({ success: true, data: { user } })
  } catch (error) {
    next(error)
  }
}

export const resendOTP = requestOTP

export const completePasswordReset = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset token, and new password are required' })
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' })
    }

    const otpDoc = await OTP.findOne({
      email: normalizeEmail(email),
      purpose: 'password_reset',
      'payload.resetToken': resetToken,
      'payload.verified': true,
    })
    if (!otpDoc || otpDoc.isExpired()) {
      if (otpDoc) await otpDoc.deleteOne()
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' })
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password')
    if (!user || !user.isActive) return res.status(403).json({ success: false, message: 'User not found or account is inactive' })

    user.password = newPassword
    user.passwordChangedAt = new Date()
    await user.save()
    await otpDoc.deleteOne()
    return res.status(200).json({ success: true, message: 'Password reset completed successfully' })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout user
 * @POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    // In OTP-based flow, logout is mainly client-side (remove tokens)
    // But we can optionally invalidate refresh tokens by storing them in a blacklist
    // For now, just return success

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    next(error)
  }
}
