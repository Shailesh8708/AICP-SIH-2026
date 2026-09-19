// server/src/services/opportunity/opportunityNormalizer.js
// Pipeline stage: sanitizes, structures, and enriches raw opportunity listings

import { processOpportunityWithAI } from '../ai/opportunityAI.js'
import { verifyApplicationUrl } from './opportunityVerifier.js'
import { generateFingerprint } from './opportunityDeduplicator.js'

/**
 * Strip HTML tags and decode basic entities
 */
export const stripHtml = (html = '') => {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Parses location text into structured locationDetails
 */
export const parseLocationDetails = (locationText = '', title = '') => {
  const combined = `${locationText} ${title}`.toLowerCase()
  const isRemote = /\b(remote|work from home|wfh|anywhere|telecommute)\b/i.test(combined)
  const isHybrid = /\b(hybrid|flexible)\b/i.test(combined)

  let city = ''
  let country = 'India'

  const cityMatches = [
    'bengaluru', 'bangalore', 'hyderabad', 'pune', 'mumbai', 'delhi', 'gurugram', 'gurgaon',
    'noida', 'chennai', 'kolkata', 'ahmedabad', 'kochi', 'coimbatore', 'san francisco',
    'new york', 'seattle', 'london', 'singapore', 'berlin', 'tokyo'
  ]

  for (const c of cityMatches) {
    if (combined.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1)
      if (city === 'Bangalore') city = 'Bengaluru'
      if (city === 'Gurgaon') city = 'Gurugram'
      break
    }
  }

  if (/\b(united states|usa|us|uk|united kingdom|singapore|germany|japan)\b/i.test(combined)) {
    if (/\b(united states|usa|us)\b/i.test(combined)) country = 'United States'
    else if (/\b(uk|united kingdom)\b/i.test(combined)) country = 'United Kingdom'
    else if (/\bsingapore\b/i.test(combined)) country = 'Singapore'
    else if (/\bgermany\b/i.test(combined)) country = 'Germany'
    else if (/\bjapan\b/i.test(combined)) country = 'Japan'
  }

  return {
    city: city || (isRemote ? 'Remote' : 'Various'),
    state: '',
    country,
    remote: isRemote,
    hybrid: isHybrid,
  }
}

/**
 * Normalizes salary information
 */
export const parseSalary = (rawSalary = {}) => {
  if (!rawSalary || typeof rawSalary !== 'object') {
    return { undisclosed: true, currency: 'INR', period: 'monthly' }
  }

  const min = typeof rawSalary.min === 'number' ? rawSalary.min : null
  const max = typeof rawSalary.max === 'number' ? rawSalary.max : null
  const currency = rawSalary.currency || 'INR'
  const period = rawSalary.period || 'monthly'

  return {
    min,
    max,
    currency,
    period,
    undisclosed: min === null && max === null,
  }
}

/**
 * Main normalization function
 */
export const normalizeOpportunity = (raw = {}, sourceMetadata = {}) => {
  const title = stripHtml(raw.title || 'Untitled Opportunity').trim()
  const rawDescription = raw.description || ''
  const description = stripHtml(rawDescription)

  const companyName = String(
    raw.company?.name || raw.companyName || sourceMetadata.companyName || 'Company'
  ).trim()

  const company = {
    name: companyName,
    logo: raw.company?.logo || sourceMetadata.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1e293b&color=38bdf8`,
    website: raw.company?.website || sourceMetadata.website || '',
    careerUrl: raw.company?.careerUrl || sourceMetadata.careerUrl || '',
    sector: raw.company?.sector || sourceMetadata.sector || 'Technology',
  }

  const rawLocation = raw.location || 'Remote'
  const locationDetails = parseLocationDetails(rawLocation, title)
  const locationStr = locationDetails.remote && !locationDetails.city
    ? 'Remote'
    : `${locationDetails.city}${locationDetails.country ? `, ${locationDetails.country}` : ''}`

  // Application URL verification
  const rawApplyUrl = raw.applyUrl || raw.url || sourceMetadata.careerUrl || ''
  const verification = verifyApplicationUrl(rawApplyUrl, company.website, sourceMetadata.verifiedDomains || [])
  const applyUrl = verification.cleanUrl || rawApplyUrl

  // AI Pipeline Enrichment (Extraction, Normalization, Classification, Summary, Match Scoring)
  const aiEnriched = processOpportunityWithAI({
    title,
    description,
    company,
    location: locationStr,
    type: raw.type,
    requiredSkills: raw.requiredSkills || raw.skills || [],
    eligibility: raw.eligibility,
    experienceRequired: raw.experienceRequired,
  })

  // Expiry calculation: default to 45 days from today if no deadline provided
  let deadline = raw.deadline ? new Date(raw.deadline) : null
  if (!deadline || isNaN(deadline.getTime())) {
    deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
  }

  // Deduplication Fingerprint
  const fingerprint = generateFingerprint({
    companyName: company.name,
    title,
    externalId: raw.externalId || raw.id || '',
    location: locationStr,
    applyUrl,
  })

  return {
    title,
    description: description || `${title} at ${company.name}. Explore responsibilities, eligibility criteria and official application details on the company career portal.`,
    type: aiEnriched.type || 'job',
    company,
    location: locationStr,
    locationDetails,
    salary: parseSalary(raw.salary),
    deadline,
    status: 'open',
    isPublished: true,
    requiredSkills: aiEnriched.requiredSkills || [],
    preferredSkills: aiEnriched.preferredSkills || [],
    eligibilityCriteria: {
      ...aiEnriched.eligibilityCriteria,
      ...(raw.eligibilityCriteria || {}),
    },
    source: {
      type: 'official_radar',
      officialUrl: applyUrl,
      verified: verification.verified,
      platform: raw.sourcePlatform || sourceMetadata.platform || 'custom',
      adapterName: sourceMetadata.adapter || 'direct',
      discoveredAt: new Date(),
      lastCheckedAt: new Date(),
    },
    applyUrl,
    fingerprint,
    ai: aiEnriched.ai,
  }
}
