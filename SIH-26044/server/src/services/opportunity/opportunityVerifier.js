// server/src/services/opportunity/opportunityVerifier.js
// Official Application URL Security & Official Source Verification

const RECOGNIZED_ATS_DOMAINS = [
  'myworkdayjobs.com',
  'greenhouse.io',
  'lever.co',
  'smartrecruiters.com',
  'ashbyhq.com',
  'workable.com',
  'recruitee.com',
  'taleo.net',
  'successfactors.com',
  'icims.com',
  'brassring.com',
  'tal.net',
  'oraclecloud.com',
  'accenture.com',
  'tcs.com',
  'infosys.com',
  'wipro.com',
  'google.com',
  'microsoft.com',
  'amazon.jobs',
  'amazon.com',
  'nvidia.com',
  'cisco.com',
  'adobe.com',
  'salesforce.com',
  'oracle.com',
  'intel.com',
  'ibm.com',
  'deloitte.com',
  'goldmansachs.com',
  'jpmorganchase.com',
  'bosch.in',
  'bosch.com',
  'gitlab.com',
  'uber.com',
  'flipkart.com',
]

/**
 * Validates whether a URL is safe, syntactically sound, and uses HTTP/HTTPS
 */
export const verifyApplicationUrl = (url = '', companyWebsite = '', verifiedDomains = []) => {
  if (!url || typeof url !== 'string') {
    return { verified: false, cleanUrl: '', reason: 'Missing application URL' }
  }

  const trimmed = url.trim()

  // 1. Check dangerous schemes
  if (/^(javascript:|data:|file:|vbscript:|about:)/i.test(trimmed)) {
    return { verified: false, cleanUrl: '', reason: 'Dangerous protocol or scheme rejected' }
  }

  // 2. Validate URL structure
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch (e) {
    return { verified: false, cleanUrl: '', reason: 'Malformed URL structure' }
  }

  // 3. Must be HTTPS or HTTP (HTTPS strongly preferred)
  if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase())) {
    return { verified: false, cleanUrl: '', reason: 'Invalid protocol scheme (must be HTTP/HTTPS)' }
  }

  // 4. Reject local/private IPs
  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  ) {
    return { verified: false, cleanUrl: '', reason: 'Private or local IP addresses are not permitted' }
  }

  // 5. Verify domain association with company website or known ATS
  let companyHost = ''
  try {
    if (companyWebsite) companyHost = new URL(companyWebsite).hostname.toLowerCase()
  } catch (_) {
    // Ignore invalid companyWebsite URL
  }

  const isCompanyDomain = companyHost && (hostname === companyHost || hostname.endsWith(`.${companyHost}`))
  const isAllowedDomain = Array.isArray(verifiedDomains) && verifiedDomains.some((d) => hostname === d.toLowerCase() || hostname.endsWith(`.${d.toLowerCase()}`))
  const isRecognizedATS = RECOGNIZED_ATS_DOMAINS.some((ats) => hostname === ats || hostname.endsWith(`.${ats}`))

  if (isCompanyDomain || isAllowedDomain || isRecognizedATS) {
    return { verified: true, cleanUrl: trimmed, isOfficialATS: true, reason: 'Verified official company or enterprise ATS domain' }
  }

  return {
    verified: parsed.protocol === 'https:',
    cleanUrl: trimmed,
    isOfficialATS: false,
    reason: 'Valid public HTTPS web destination',
  }
}

/**
 * Resolves the most specific application or posting URL for an opportunity based on preferred priority:
 * 1. Direct application/form URL (applicationUrl / applyUrl)
 * 2. Specific internship/job posting URL (postingUrl / source.officialUrl)
 * 3. Official company application/ATS URL
 * 4. Official company careers page only as a final fallback
 */
export const resolveOpportunityUrls = (opp = {}) => {
  const company = opp.company || {}
  const source = opp.source || {}
  const companyWebsite = company.website || ''
  const verifiedDomains = source.config?.verifiedDomains || []

  const directCandidateUrl = opp.applicationUrl || opp.applyUrl || ''
  const specificPostingUrl = opp.postingUrl || source.officialUrl || ''
  const companyCareerFallback = company.careerUrl || company.website || ''

  // Test Direct Application Form
  const directCheck = verifyApplicationUrl(directCandidateUrl, companyWebsite, verifiedDomains)
  if (directCheck.verified && directCheck.cleanUrl) {
    return {
      resolvedUrl: directCheck.cleanUrl,
      applicationUrl: directCheck.cleanUrl,
      postingUrl: specificPostingUrl || directCheck.cleanUrl,
      urlType: 'direct_application',
      isDirectForm: true,
      badgeLabel: 'Official Application',
      isVerifiedOfficial: true,
    }
  }

  // Test Specific Posting URL
  const postingCheck = verifyApplicationUrl(specificPostingUrl, companyWebsite, verifiedDomains)
  if (postingCheck.verified && postingCheck.cleanUrl) {
    return {
      resolvedUrl: postingCheck.cleanUrl,
      applicationUrl: '',
      postingUrl: postingCheck.cleanUrl,
      urlType: 'posting',
      isDirectForm: false,
      badgeLabel: 'Official Posting',
      isVerifiedOfficial: true,
    }
  }

  // Test Company Career Portal Fallback
  const fallbackCheck = verifyApplicationUrl(companyCareerFallback, companyWebsite, verifiedDomains)
  if (fallbackCheck.verified && fallbackCheck.cleanUrl) {
    return {
      resolvedUrl: fallbackCheck.cleanUrl,
      applicationUrl: '',
      postingUrl: fallbackCheck.cleanUrl,
      urlType: 'careers_page',
      isDirectForm: false,
      badgeLabel: 'Official Careers',
      isVerifiedOfficial: true,
    }
  }

  return {
    resolvedUrl: '',
    applicationUrl: '',
    postingUrl: '',
    urlType: 'unavailable',
    isDirectForm: false,
    badgeLabel: 'Form Unavailable',
    isVerifiedOfficial: false,
  }
}
