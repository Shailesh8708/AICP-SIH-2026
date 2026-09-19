// server/src/services/opportunity/aiOpportunityEngine.js
// Project In-House AI Automated Engine for Daily Opportunity Discovery, Refresh & Expiry Management

import Opportunity from '../../models/Opportunity.js'
import { syncAllSources } from './opportunityCollector.js'
import { checkAndExpireDeadlines } from './opportunityExpiry.js'
import { processOpportunityWithAI } from '../ai/opportunityAI.js'
import { ensureDefaultOfficialRadarOpportunities } from './seedOfficialRadar.js'

let isEngineRunning = false
let lastEngineReport = {
  timestamp: null,
  purgedExpiredCount: 0,
  discoveredCount: 0,
  updatedCount: 0,
  activeLiveCount: 0,
  status: 'idle',
}

/**
 * Execute the automated daily AI opportunity cycle:
 * 1. Automatically remove / purge all opportunities whose deadline is over.
 * 2. Scan official company career platforms & ATS endpoints to discover fresh openings.
 * 3. Process every listing through our in-house AI intelligence (skill extraction, categorization, confidence scoring).
 * 4. Update existing listings and publish new ones.
 * 5. Re-evaluate live health and provide telemetry.
 */
export const runDailyAIOpportunityCycle = async ({ concurrency = 3 } = {}) => {
  if (isEngineRunning) {
    console.log('[AIOpportunityEngine] ⏳ Cycle is already in progress in the background.')
    return {
      status: 'in_progress',
      message: 'AI Opportunity engine cycle is already actively processing.',
      report: lastEngineReport,
    }
  }

  isEngineRunning = true
  const startTime = new Date()
  console.log(`[AIOpportunityEngine] 🚀 Starting automated daily AI discovery & maintenance cycle at ${startTime.toISOString()}...`)

  try {
    // ----------------------------------------------------
    // STEP 1: Auto-remove all listings whose deadline has passed
    // ----------------------------------------------------
    const expiryResult = await checkAndExpireDeadlines()
    const purgedCount = (expiryResult.purgedCount || 0) + (expiryResult.closedCount || 0)

    // ----------------------------------------------------
    // STEP 2: Automatically crawl & sync active company sources
    // ----------------------------------------------------
    const syncResult = await syncAllSources({ concurrency })
    let discoveredCount = syncResult.report?.totalDiscovered || 0
    const newCount = syncResult.report?.totalNew || 0
    const updatedCount = Math.max(0, discoveredCount - newCount)

    // Ensure verified official opportunities are always guaranteed available
    const seedRes = await ensureDefaultOfficialRadarOpportunities()
    if (seedRes?.seeded > 0) {
      discoveredCount += seedRes.seeded
    }

    // ----------------------------------------------------
    // STEP 3: Refresh AI intelligence on active opportunities
    // ----------------------------------------------------
    const activeOpps = await Opportunity.find({
      'source.type': 'official_radar',
      status: 'open',
      $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
    })

    let aiRefreshedCount = 0
    for (const opp of activeOpps) {
      // Re-run through self-made AI pipeline if skills or category need update
      if (!opp.ai?.normalizedSkills || opp.ai.normalizedSkills.length === 0) {
        const enriched = processOpportunityWithAI({
          title: opp.title,
          description: opp.description,
          company: opp.company,
          location: opp.location,
          type: opp.type,
          requiredSkills: opp.requiredSkills,
        })
        opp.ai = enriched.ai
        opp.requiredSkills = enriched.requiredSkills
        opp.preferredSkills = enriched.preferredSkills
        await opp.save()
        aiRefreshedCount++
      }
    }

    // ----------------------------------------------------
    // STEP 4: Final telemetry count
    // ----------------------------------------------------
    const activeLiveCount = await Opportunity.countDocuments({
      isPublished: true,
      status: 'open',
      $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
    })

    lastEngineReport = {
      timestamp: new Date(),
      durationMs: Date.now() - startTime.getTime(),
      purgedExpiredCount: purgedCount,
      discoveredCount,
      newCount,
      updatedCount,
      aiRefreshedCount,
      activeLiveCount,
      status: 'completed',
    }

    console.log(`[AIOpportunityEngine] ✅ Daily AI cycle complete! Purged: ${purgedCount} expired | Discovered: ${discoveredCount} | Updated: ${updatedCount} | Live Active: ${activeLiveCount}`)

    return {
      status: 'completed',
      report: lastEngineReport,
    }
  } catch (error) {
    console.error('[AIOpportunityEngine] ❌ Error in daily AI opportunity cycle:', error.message)
    lastEngineReport.status = 'failed'
    lastEngineReport.error = error.message
    return {
      status: 'failed',
      error: error.message,
      report: lastEngineReport,
    }
  } finally {
    isEngineRunning = false
  }
}

/**
 * Get live health & status report of the AI opportunity engine
 */
export const getAIEngineStatus = () => {
  return {
    isEngineRunning,
    report: lastEngineReport,
  }
}
