// server/src/routes/opportunityRoutes.js
import express from 'express'
import {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  publishOpportunity,
  closeOpportunity,
  deleteOpportunity,
  searchOpportunities,
  getRecommendedOpportunities,
  rankCandidates,
  getRadarStats,
  getOpportunityFilters,
  getHiringTrends,
  getRadarSources,
  toggleRadarSource,
  syncRadarSource,
  triggerRadarSync,
} from '../controllers/opportunityController.js'
import { verifyToken, authorizeRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// AI Opportunity Radar Intelligence endpoints (mounted BEFORE /:id)
router.get('/radar/stats', verifyToken, asyncHandler(getRadarStats))
router.get('/radar/filters', verifyToken, asyncHandler(getOpportunityFilters))
router.get('/radar/trends', verifyToken, asyncHandler(getHiringTrends))
router.get('/radar/sources', verifyToken, asyncHandler(getRadarSources))
router.post('/radar/sources/:id/toggle', verifyToken, authorizeRole('industry', 'admin'), asyncHandler(toggleRadarSource))
router.post('/radar/sources/:id/sync', verifyToken, authorizeRole('industry', 'admin'), asyncHandler(syncRadarSource))
router.post('/radar/sync', verifyToken, asyncHandler(triggerRadarSync))

// General Listings & Recommendations
router.get('/', verifyToken, asyncHandler(listOpportunities))
router.get('/search', verifyToken, asyncHandler(searchOpportunities))
router.get('/recommended', verifyToken, asyncHandler(getRecommendedOpportunities))

// Detail View
router.get('/:id', verifyToken, asyncHandler(getOpportunity))

// Industry Direct Postings Management
router.post('/', verifyToken, authorizeRole('industry', 'academician', 'admin'), asyncHandler(createOpportunity))
router.get('/:id/candidates', verifyToken, authorizeRole('industry', 'admin'), asyncHandler(rankCandidates))
router.put('/:id', verifyToken, authorizeRole('industry', 'admin'), asyncHandler(updateOpportunity))
router.post('/:id/publish', verifyToken, authorizeRole('industry', 'admin'), asyncHandler(publishOpportunity))
router.post('/:id/close', verifyToken, authorizeRole('industry', 'admin'), asyncHandler(closeOpportunity))
router.delete('/:id', verifyToken, authorizeRole('industry', 'academician', 'admin'), asyncHandler(deleteOpportunity))

export default router
