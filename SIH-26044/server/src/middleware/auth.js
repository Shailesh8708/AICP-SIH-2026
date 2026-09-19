// server/src/middleware/auth.js
import { verifyAccessToken } from '../utils/jwt.js'
import { errorResponse } from '../utils/response.js'

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        errorResponse('No token provided', ['Authorization header missing'])
      )
    }

    const token = authHeader.substring(7)

    try {
      const decoded = verifyAccessToken(token)
      const uid = decoded.userId || decoded.id || decoded._id
      req.user = {
        ...decoded,
        userId: uid,
        id: uid,
        _id: uid,
      }
      next()
    } catch (error) {
      return res.status(401).json(
        errorResponse(error.message, ['Invalid or expired token'])
      )
    }
  } catch (error) {
    return res.status(500).json(errorResponse('Token verification failed'))
  }
}

/**
 * Middleware to check user role
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Unauthorized', ['User not authenticated'])
      )
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Forbidden', [
          `This resource requires one of: ${allowedRoles.join(', ')}`,
        ])
      )
    }

    next()
  }
}

/**
 * Optional token middleware - doesn't fail if token missing
 */
const optionalToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = verifyAccessToken(token)
        const uid = decoded.userId || decoded.id || decoded._id
        req.user = {
          ...decoded,
          userId: uid,
          id: uid,
          _id: uid,
        }
      } catch (error) {
        // Token invalid but not required, continue
      }
    }

    next()
  } catch (error) {
    next()
  }
}

export { verifyToken, authorizeRole, optionalToken }
