// server/src/jobs/opportunitySyncJob.js
// Background Scheduler for Periodic Company Sync and Expiry Cleanup

import config from '../config/env.js'
import { seedDefaultSources } from '../services/opportunity/sourceManager.js'
import { checkAndExpireDeadlines } from '../services/opportunity/opportunityExpiry.js'
import { runDailyAIOpportunityCycle, getAIEngineStatus } from '../services/opportunity/aiOpportunityEngine.js'
import { ensureDefaultOfficialRadarOpportunities } from '../services/opportunity/seedOfficialRadar.js'

let syncTimer = null
let expiryTimer = null

/**
 * Initialize sources, clean expired listings, and launch automated AI discovery
 */
export const initializeOpportunityRadar = async () => {
  try {
    console.log('[OpportunityRadar] 📡 Booting Self-Made AI Opportunity Radar...')

    // 1. Seed & verify enterprise sources
    const seedResult = await seedDefaultSources()
    console.log(`[OpportunityRadar] ✅ Sources catalog: ${seedResult.createdCount} new, ${seedResult.updatedCount} refreshed (Total: ${seedResult.total})`)

    // 2. Ensure verified official radar listings exist
    await ensureDefaultOfficialRadarOpportunities()

    // 3. Auto-remove any past-deadline opportunities immediately on boot
    const expiryResult = await checkAndExpireDeadlines()
    if (expiryResult.purgedCount > 0) {
      console.log(`[OpportunityRadar] 🧹 Boot cleanup: purged ${expiryResult.purgedCount} expired listings`)
    }

    // 3. Launch automated in-house AI discovery cycle in background
    console.log('[OpportunityRadar] 🤖 Launching background AI opportunity discovery & update cycle...')
    runDailyAIOpportunityCycle({ concurrency: config.opportunityRadar?.syncConcurrency || 3 })
      .then((res) => {
        console.log(`[OpportunityRadar] 🎉 AI opportunity cycle finished. Active live listings: ${res.report?.activeLiveCount || 0}`)
      })
      .catch((err) => {
        console.warn('[OpportunityRadar] AI cycle error:', err.message)
      })
  } catch (error) {
    console.error('[OpportunityRadar] Initialization failed:', error.message)
  }
}

/**
 * Start the recurring background sync scheduler
 */
export const startOpportunitySyncScheduler = () => {
  const syncIntervalMs = (config.opportunityRadar?.syncIntervalMinutes || 60) * 60 * 1000
  const expiryIntervalMs = 30 * 60 * 1000 // 30 minutes

  // Stop any existing timers
  if (syncTimer) clearInterval(syncTimer)
  if (expiryTimer) clearInterval(expiryTimer)

  // Daily periodic source sync & AI refresh
  if (config.opportunityRadar?.syncEnabled !== false) {
    syncTimer = setInterval(async () => {
      console.log('[OpportunityRadar] ⏰ Daily scheduled AI sync & update starting...')
      try {
        await runDailyAIOpportunityCycle({ concurrency: config.opportunityRadar?.syncConcurrency || 3 })
      } catch (err) {
        console.error('[OpportunityRadar] Scheduled AI sync error:', err.message)
      }
    }, syncIntervalMs)
  }

  // Periodic real-time deadline cleanup pass (every 30 minutes)
  if (config.opportunityRadar?.autoExpireEnabled !== false) {
    expiryTimer = setInterval(async () => {
      try {
        await checkAndExpireDeadlines()
      } catch (err) {
        console.error('[OpportunityRadar] Expiry cleanup error:', err.message)
      }
    }, expiryIntervalMs)
  }

  console.log(`[OpportunityRadar] 🚀 AI Engine active (Sync every ${Math.round(syncIntervalMs / 60000)}m, Expiry check every 30m)`)
}

/**
 * Manually trigger AI cycle run (e.g. from UI sync button)
 */
export const triggerManualSync = async (concurrency = 3) => {
  return runDailyAIOpportunityCycle({ concurrency })
}

/**
 * Get live status of AI opportunity engine
 */
export const getRadarStatus = () => {
  return getAIEngineStatus()
}
