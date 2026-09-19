// server/src/services/opportunity/opportunityDeduplicator.js
// Deterministic Fingerprint Generation & Upsert Deduplication

import crypto from 'crypto'
import Opportunity from '../../models/Opportunity.js'

export const generateFingerprint = ({
  companyName = '',
  title = '',
  externalId = '',
  location = '',
  applyUrl = '',
  postingUrl = '',
  applicationUrl = '',
}) => {
  const normCompany = String(companyName).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  const normTitle = String(title).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  const normLocation = String(location).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  const normKey = String(externalId || applicationUrl || postingUrl || applyUrl).trim().toLowerCase()

  const rawString = `${normCompany}|${normTitle}|${normKey || normLocation}`
  return crypto.createHash('sha256').update(rawString).digest('hex')
}

export const deduplicateAndSave = async (opportunityData) => {
  const fingerprint = opportunityData.fingerprint || generateFingerprint({
    companyName: opportunityData.company?.name,
    title: opportunityData.title,
    location: opportunityData.location,
    applyUrl: opportunityData.applyUrl,
    postingUrl: opportunityData.postingUrl,
    applicationUrl: opportunityData.applicationUrl,
    externalId: opportunityData.externalId,
  })

  const existing = await Opportunity.findOne({ fingerprint })

  if (existing) {
    // Update existing record rather than inserting a duplicate
    existing.status = 'open'
    if (existing.source) {
      existing.source.lastCheckedAt = new Date()
    }
    if (opportunityData.applicationUrl) existing.applicationUrl = opportunityData.applicationUrl
    if (opportunityData.postingUrl) existing.postingUrl = opportunityData.postingUrl
    if (opportunityData.applyUrl) existing.applyUrl = opportunityData.applyUrl
    if (opportunityData.description && !existing.description) existing.description = opportunityData.description
    if (opportunityData.deadline) existing.deadline = opportunityData.deadline
    if (opportunityData.ai) existing.ai = opportunityData.ai
    await existing.save()
    return { saved: existing, isNew: false }
  }

  // Create new record
  const created = await Opportunity.create({
    ...opportunityData,
    fingerprint,
    source: {
      ...opportunityData.source,
      discoveredAt: new Date(),
      lastCheckedAt: new Date(),
    },
    status: 'open',
    isPublished: true,
  })

  return { saved: created, isNew: true }
}
