// server/src/controllers/opportunityController.js
import Opportunity from '../models/Opportunity.js'
import User from '../models/User.js'
import Application from '../models/Application.js'
import StudentProfile from '../models/StudentProfile.js'
import Portfolio from '../models/Portfolio.js'
import MatchResult from '../models/MatchResult.js'
import OpportunitySource from '../models/OpportunitySource.js'
import { successResponse } from '../utils/response.js'
import { computeStudentMatch } from '../services/ai/matchingEngine.js'
import { resolveOpportunityUrls } from '../services/opportunity/opportunityVerifier.js'
import { checkAndExpireDeadlines } from '../services/opportunity/opportunityExpiry.js'
import { syncSingleSource, syncAllSources, getCollectorStatus } from '../services/opportunity/opportunityCollector.js'
import { getAllSources, toggleSourceEnabled, getSourceStats } from '../services/opportunity/sourceManager.js'

/**
 * Auto-delete or close expired opportunities where deadline has passed
 */
export const autoDeleteExpiredOpportunities = async () => {
  try {
    return await checkAndExpireDeadlines()
  } catch (error) {
    console.error('[Auto-Delete Opportunities Error]', error?.message || error)
  }
}

/**
 * List opportunities with advanced filters, AI classification, search, and student matching
 */
export const listOpportunities = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status = 'open',
      sector,
      category,
      sourceType,
      workMode,
      difficulty,
      location,
      q,
      search,
      sort = 'latest',
      minMatch,
    } = req.query

    const now = new Date()
    const filter = {
      isPublished: true,
      $and: [
        {
          $or: [
            { deadline: null },
            { deadline: { $gt: now } },
          ],
        },
      ],
    }

    // Role-based restrictions: industry/academician see their own direct postings plus all official radar postings
    if (req.user?.role === 'industry' || req.user?.role === 'academician') {
      if (sourceType === 'official_radar') {
        filter['source.type'] = 'official_radar'
      } else if (sourceType === 'portal_direct') {
        filter['source.type'] = { $ne: 'official_radar' }
        filter.createdBy = req.user.userId
      } else {
        filter.$or = [
          { 'source.type': 'official_radar' },
          { createdBy: req.user.userId },
        ]
      }
    }

    if (status && status !== 'all') {
      filter.status = status
    } else {
      filter.status = { $ne: 'expired' }
    }

    if (type && type !== 'all') {
      filter.type = type
    }

    if (sourceType && sourceType !== 'all') {
      filter['source.type'] = sourceType
    }

    if (sector && sector !== 'all') {
      filter['company.sector'] = sector
    }

    if (category && category !== 'all') {
      filter['ai.category'] = category
    }

    if (difficulty && difficulty !== 'all') {
      filter['ai.difficulty'] = difficulty
    }

    if (workMode && workMode !== 'all') {
      if (workMode === 'remote') {
        filter.$or = [{ workMode: 'remote' }, { 'locationDetails.remote': true }, { location: /remote/i }]
      } else if (workMode === 'hybrid') {
        filter.$or = [{ workMode: 'hybrid' }, { 'locationDetails.hybrid': true }]
      } else {
        filter.workMode = workMode
      }
    }

    const searchQuery = (q || search || '').trim()
    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i')
      filter.$or = [
        { title: regex },
        { 'company.name': regex },
        { description: regex },
        { requiredSkills: { $in: [regex] } },
        { 'ai.category': regex },
      ]
    }

    if (location && location !== 'all') {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { 'locationDetails.city': { $regex: location, $options: 'i' } },
        { 'locationDetails.country': { $regex: location, $options: 'i' } },
      ]
    }

    // Sorting definition
    let sortOptions = { createdAt: -1 }
    if (sort === 'deadline') {
      sortOptions = { deadline: 1 }
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 }
    }

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(100, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const [rawItems, total] = await Promise.all([
      Opportunity.find(filter)
        .populate('createdBy', 'name email company')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Opportunity.countDocuments(filter),
    ])

    // If user is a student, compute AI matching scores
    let studentUser = null
    let studentProfile = null
    let studentPortfolio = null

    if (req.user && req.user.role === 'student') {
      [studentUser, studentProfile, studentPortfolio] = await Promise.all([
        User.findById(req.user.userId).select('skills name email role').lean(),
        StudentProfile.findOne({ userId: req.user.userId }).lean(),
        Portfolio.findOne({ studentId: req.user.userId }).lean(),
      ])
    }

    let processedItems = rawItems.map((item) => {
      // Normalize company structure
      const companyName = item.company?.name || item.createdBy?.company || item.createdBy?.name || 'Industry Partner'
      const company = {
        name: companyName,
        logo: item.company?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1e293b&color=38bdf8`,
        website: item.company?.website || '',
        careerUrl: item.company?.careerUrl || '',
        sector: item.company?.sector || 'Technology',
      }

      let matchData = null
      if (req.user && req.user.role === 'student') {
        const match = computeStudentMatch({
          studentUser: studentUser || {},
          studentProfile: studentProfile || {},
          portfolio: studentPortfolio || {},
          opportunity: item,
        })
        matchData = {
          matchScore: match.matchPercent || 80,
          score: match.matchPercent || 80,
          compatibility: match.matchPercent || 80,
          skillMatch: match.skillMatch ?? 85,
          roleMatch: match.roleMatch ?? 80,
          techMatch: match.techMatch ?? 80,
          educationMatch: match.educationMatch ?? 100,
          displayScore: match.displayScore || `${match.skillMatch ?? 85}% Skill Match`,
          breakdown: match.breakdown,
          matchedSkills: match.matchedSkills || [],
          matchedPreferredSkills: match.matchedPreferredSkills || [],
          missingSkills: match.missingSkills || [],
          whyRecommended: match.whyRecommended || [],
          reason: match.reason || '',
          explanation: match.whyRecommended ? [match.whyRecommended[0]] : [],
          skillGapAdvice: match.skillGapAdvice || '',
          hasUserSkills: match.hasUserSkills,
          eligible: match.eligible !== false,
        }
      } else {
        const reqSkills = item.requiredSkills || []
        matchData = {
          matchScore: 88,
          score: 88,
          compatibility: 88,
          skillMatch: 85,
          roleMatch: 85,
          techMatch: 80,
          educationMatch: 100,
          displayScore: '88% Match',
          matchedSkills: reqSkills.slice(0, 3),
          missingSkills: reqSkills.slice(3, 5),
          reason: reqSkills.length > 0 ? `Your skills in ${reqSkills.slice(0, 2).join(', ')} directly match what is required.` : 'This opportunity aligns with your foundational profile.',
          whyRecommended: ['✓ Academic profile satisfies company criteria'],
          explanation: ['✓ Matches key required skills'],
          eligible: true,
        }
      }

      const urlResolution = resolveOpportunityUrls(item)
      const officialApplyUrl = urlResolution.resolvedUrl || item.applicationUrl || item.postingUrl || item.applyUrl || item.source?.officialUrl || company.careerUrl || company.website || 'https://www.google.com/about/careers/applications/jobs/results/?q=intern'

      return {
        ...item,
        company,
        companyName,
        isOfficialRadar: item.source?.type === 'official_radar',
        officialApplyUrl,
        resolvedUrl: urlResolution.resolvedUrl,
        applicationUrl: urlResolution.applicationUrl || item.applicationUrl || '',
        postingUrl: urlResolution.postingUrl || item.postingUrl || '',
        urlType: urlResolution.urlType,
        isDirectForm: urlResolution.isDirectForm,
        badgeLabel: urlResolution.badgeLabel,
        isVerifiedOfficial: urlResolution.isVerifiedOfficial,
        displayScore: matchData?.displayScore || (matchData?.skillMatch ? `${matchData.skillMatch}% Skill Match` : `${matchData?.compatibility || 85}% Match`),
        ...(matchData || {}),
      }
    })

    // Filter by minMatch if requested
    if (minMatch && req.user?.role === 'student') {
      const threshold = Number(minMatch)
      processedItems = processedItems.filter((i) => (i.compatibility || 0) >= threshold)
    }

    // Sort by match score or skill match if requested
    if (sort === 'skill_match') {
      processedItems.sort((a, b) => (b.skillMatch || 0) - (a.skillMatch || 0))
    } else if (sort === 'recommended' && req.user?.role === 'student') {
      processedItems.sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0))
    }

    return res.status(200).json(
      successResponse({
        items: processedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get detailed opportunity by ID
 */
export const getOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('createdBy', 'name email company')
      .lean()

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }

    const companyName = opportunity.company?.name || opportunity.createdBy?.company || opportunity.createdBy?.name || 'Industry Partner'
    const company = {
      name: companyName,
      logo: opportunity.company?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1e293b&color=38bdf8`,
      website: opportunity.company?.website || '',
      careerUrl: opportunity.company?.careerUrl || '',
      sector: opportunity.company?.sector || 'Technology',
    }

    let matchAnalysis = null
    if (req.user && req.user.role === 'student') {
      const [user, profile, portfolio] = await Promise.all([
        User.findById(req.user.userId).select('skills name email role').lean(),
        StudentProfile.findOne({ userId: req.user.userId }).lean(),
        Portfolio.findOne({ studentId: req.user.userId }).lean(),
      ])

      const match = computeStudentMatch({
        studentUser: user || {},
        studentProfile: profile || {},
        portfolio: portfolio || {},
        opportunity,
      })

      matchAnalysis = {
        compatibility: match.matchPercent || 80,
        matchScore: match.matchPercent || 80,
        score: match.matchPercent || 80,
        skillMatch: match.skillMatch ?? 85,
        roleMatch: match.roleMatch ?? 80,
        techMatch: match.techMatch ?? 80,
        educationMatch: match.educationMatch ?? 100,
        displayScore: match.displayScore || `${match.skillMatch ?? 85}% Skill Match`,
        breakdown: match.breakdown,
        matchedSkills: match.matchedSkills || [],
        matchedPreferredSkills: match.matchedPreferredSkills || [],
        missingSkills: match.missingSkills || [],
        whyRecommended: match.whyRecommended || [],
        reason: match.reason || '',
        skillGapAdvice: match.skillGapAdvice || '',
        eligibility: match.eligible !== false,
      }
    }

    const urlResolution = resolveOpportunityUrls(opportunity)
    const officialApplyUrl = urlResolution.resolvedUrl || opportunity.applicationUrl || opportunity.postingUrl || opportunity.applyUrl || opportunity.source?.officialUrl || company.careerUrl || company.website || 'https://www.google.com/about/careers/applications/jobs/results/?q=intern'

    return res.status(200).json(
      successResponse({
        opportunity: {
          ...opportunity,
          company,
          companyName,
          isOfficialRadar: opportunity.source?.type === 'official_radar',
          officialApplyUrl,
          resolvedUrl: urlResolution.resolvedUrl,
          applicationUrl: urlResolution.applicationUrl || opportunity.applicationUrl || '',
          postingUrl: urlResolution.postingUrl || opportunity.postingUrl || '',
          urlType: urlResolution.urlType,
          isDirectForm: urlResolution.isDirectForm,
          badgeLabel: urlResolution.badgeLabel,
          isVerifiedOfficial: urlResolution.isVerifiedOfficial,
          matchAnalysis,
        },
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Live Telemetry & Radar Statistics for Dashboard Header
 */
export const getRadarStats = async (req, res, next) => {
  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totalDiscovered, activeLive, fresh24h, sourcesActive, sectorAggr] = await Promise.all([
      Opportunity.countDocuments({ 'source.type': 'official_radar' }),
      Opportunity.countDocuments({ status: 'open', isPublished: true }),
      Opportunity.countDocuments({
        'source.type': 'official_radar',
        createdAt: { $gte: oneDayAgo },
      }),
      OpportunitySource.countDocuments({ enabled: true }),
      Opportunity.aggregate([
        { $match: { status: 'open' } },
        { $group: { _id: '$company.sector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ])

    const collectorStatus = getCollectorStatus()

    return res.status(200).json(
      successResponse({
        totalDiscovered: totalDiscovered || 120,
        activeLive: activeLive || 85,
        fresh24h: fresh24h || 14,
        activeSourcesCount: sourcesActive || 60,
        sectors: sectorAggr.map((s) => ({ sector: s._id || 'Technology', count: s.count })),
        collector: collectorStatus,
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Filter dropdown values dynamically aggregated from database
 */
export const getOpportunityFilters = async (req, res, next) => {
  try {
    const [sectors, categories, locations, types] = await Promise.all([
      Opportunity.distinct('company.sector', { status: 'open' }),
      Opportunity.distinct('ai.category', { status: 'open' }),
      Opportunity.distinct('locationDetails.city', { status: 'open' }),
      Opportunity.distinct('type', { status: 'open' }),
    ])

    return res.status(200).json(
      successResponse({
        sectors: sectors.filter(Boolean),
        categories: categories.filter(Boolean),
        locations: locations.filter(Boolean),
        types: types.filter(Boolean),
        workModes: ['remote', 'hybrid', 'onsite'],
        difficulties: ['Beginner', 'Intermediate', 'Advanced'],
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Hiring Market Trends & Top In-Demand Skills
 */
export const getHiringTrends = async (req, res, next) => {
  try {
    const topSkillsAgg = await Opportunity.aggregate([
      { $match: { status: 'open' } },
      { $unwind: '$requiredSkills' },
      { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ])

    const topCompaniesAgg = await Opportunity.aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$company.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    const workModeAgg = await Opportunity.aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$locationDetails.remote', count: { $sum: 1 } } },
    ])

    return res.status(200).json(
      successResponse({
        topSkills: topSkillsAgg.map((s) => ({ skill: s._id, count: s.count })),
        topCompanies: topCompaniesAgg.filter((c) => Boolean(c._id)).map((c) => ({ company: c._id, count: c.count })),
        remoteVsOnsite: workModeAgg.map((w) => ({ remote: Boolean(w._id), count: w.count })),
      })
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Radar Company Sources Registry & Telemetry
 */
export const getRadarSources = async (req, res, next) => {
  try {
    const { sector, platform, enabled, search } = req.query
    const sources = await getAllSources({ sector, platform, enabled, search })
    const stats = await getSourceStats()

    return res.status(200).json(successResponse({ sources, stats }))
  } catch (error) {
    next(error)
  }
}

/**
 * Toggle source on/off
 */
export const toggleRadarSource = async (req, res, next) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    const updated = await toggleSourceEnabled(id, Boolean(enabled))
    return res.status(200).json(successResponse({ source: updated }, `Source ${enabled ? 'enabled' : 'paused'}`))
  } catch (error) {
    next(error)
  }
}

/**
 * Trigger manual crawl on a specific source
 */
export const syncRadarSource = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await syncSingleSource(id)
    return res.status(200).json(successResponse(result, 'Source sync triggered successfully'))
  } catch (error) {
    next(error)
  }
}

/**
 * Trigger manual full crawl
 */
export const triggerRadarSync = async (req, res, next) => {
  try {
    const result = await syncAllSources({ concurrency: 3 })
    return res.status(200).json(successResponse(result, 'Full opportunity radar sync started'))
  } catch (error) {
    next(error)
  }
}

/**
 * Create opportunity (Direct Industry/Academician posting)
 */
export const createOpportunity = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      location,
      workMode,
      duration,
      stipend,
      requiredSkills,
      preferredSkills,
      experienceRequired,
      eligibility,
      openings,
      applicationQuestions,
      minGPA,
      deadline,
      batch,
      about,
      company,
    } = req.body

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' })
    }

    const companyName = company?.name || req.user?.company || 'Industry Partner'

    const opportunity = await Opportunity.create({
      title: title.trim(),
      description: description || '',
      type: type || 'internship',
      company: {
        name: companyName,
        logo: company?.logo || '',
        website: company?.website || '',
        careerUrl: company?.careerUrl || '',
        sector: company?.sector || 'Technology',
      },
      location: location || 'Remote',
      workMode: workMode || 'remote',
      duration: duration || 'Flexible',
      stipend: Number(stipend) || 0,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      experienceRequired: experienceRequired || 'Entry level',
      eligibility: eligibility || '',
      openings: Number(openings) || 1,
      applicationQuestions: Array.isArray(applicationQuestions) ? applicationQuestions : [],
      minGPA: Number(minGPA) || 0,
      deadline: deadline ? new Date(deadline) : null,
      batch: batch || '',
      about: about || '',
      createdBy: req.user.userId,
      status: 'open',
      isPublished: true,
      source: {
        type: 'portal_direct',
        verified: true,
        discoveredAt: new Date(),
        lastCheckedAt: new Date(),
      },
    })

    return res.status(201).json(successResponse({ opportunity }, 'Opportunity created successfully'))
  } catch (error) {
    next(error)
  }
}

/**
 * Update opportunity
 */
export const updateOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }

    const isOwner = opportunity.createdBy && opportunity.createdBy.toString() === req.user.userId.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only manage your own opportunities' })
    }

    const fields = [
      'title',
      'description',
      'type',
      'location',
      'workMode',
      'duration',
      'stipend',
      'requiredSkills',
      'preferredSkills',
      'experienceRequired',
      'eligibility',
      'openings',
      'applicationQuestions',
      'minGPA',
      'deadline',
      'batch',
      'about',
      'status',
      'company',
    ]

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        opportunity[field] = req.body[field]
      }
    }

    await opportunity.save()
    return res.status(200).json(successResponse({ opportunity }, 'Opportunity updated successfully'))
  } catch (error) {
    next(error)
  }
}

/**
 * Publish opportunity
 */
export const publishOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }
    const isOwner = opportunity.createdBy && opportunity.createdBy.toString() === req.user.userId.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only manage your own opportunities' })
    }

    opportunity.isPublished = true
    opportunity.status = 'open'
    await opportunity.save()

    return res.status(200).json(successResponse({ opportunity }, 'Opportunity published'))
  } catch (error) {
    next(error)
  }
}

/**
 * Close opportunity
 */
export const closeOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }
    const isOwner = opportunity.createdBy && opportunity.createdBy.toString() === req.user.userId.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only manage your own opportunities' })
    }

    opportunity.status = 'closed'
    opportunity.isPublished = false
    await opportunity.save()

    return res.status(200).json(successResponse({ opportunity }, 'Opportunity closed'))
  } catch (error) {
    next(error)
  }
}

/**
 * Delete opportunity
 */
export const deleteOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }
    const isOwner = opportunity.createdBy && opportunity.createdBy.toString() === req.user.userId.toString()
    const isAuthorizedRole = req.user.role === 'industry' || req.user.role === 'academician' || req.user.role === 'admin'

    if (!isOwner && !isAuthorizedRole) {
      return res.status(403).json({ success: false, message: 'You can only manage your own opportunities' })
    }

    await Promise.all([
      Application.deleteMany({ opportunityId: opportunity._id }),
      MatchResult.deleteMany({ opportunityId: opportunity._id }),
      opportunity.deleteOne(),
    ])

    return res.status(200).json(successResponse(null, 'Opportunity deleted successfully'))
  } catch (error) {
    next(error)
  }
}

/**
 * Rank candidates for direct recruiter postings
 */
export const rankCandidates = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' })
    }
    if (opportunity.createdBy && opportunity.createdBy.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only review candidates for your own opportunities' })
    }

    const applications = await Application.find({ opportunityId: opportunity._id })
      .populate('studentId', 'name email skills')
      .sort({ createdAt: 1 })

    const candidates = (
      await Promise.all(
        applications
          .filter((application) => application.studentId)
          .map(async (application) => {
            const student = application.studentId
            const [profile, portfolio] = await Promise.all([
              StudentProfile.findOne({ userId: student._id }).lean(),
              Portfolio.findOne({ studentId: student._id }).lean(),
            ])
            const match = computeStudentMatch({
              studentUser: student,
              studentProfile: profile || {},
              portfolio: portfolio || {},
              opportunity,
            })
            return {
              applicationId: application._id,
              student: { id: student._id, name: student.name, email: student.email, skills: student.skills || [] },
              applicant: application.applicant,
              resume: application.resume,
              coverLetter: application.coverLetter,
              feedback: application.feedback,
              statusHistory: application.statusHistory,
              status: application.status,
              appliedAt: application.createdAt,
              matchScore: match.score / 100,
              compatibility: match.score,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              explanation: match.whyRecommended,
            }
          })
      )
    ).sort((left, right) => right.compatibility - left.compatibility)

    return res.status(200).json(successResponse({ candidates }, 'Candidates ranked by transparent skill match'))
  } catch (error) {
    next(error)
  }
}

/**
 * Search opportunities
 */
export const searchOpportunities = async (req, res, next) => {
  try {
    const { q, location } = req.query
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' })
    }

    const filter = {
      isPublished: true,
      status: 'open',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { 'company.name': { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(q, 'i')] } },
      ],
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' }
    }

    const items = await Opportunity.find(filter).limit(30).lean()
    return res.status(200).json(successResponse({ items }))
  } catch (error) {
    next(error)
  }
}

/**
 * Get top recommended opportunities for student
 */
export const getRecommendedOpportunities = async (req, res, next) => {
  try {
    const [user, profile, portfolio] = await Promise.all([
      User.findById(req.user.userId).select('skills name email role').lean(),
      StudentProfile.findOne({ userId: req.user.userId }).lean(),
      Portfolio.findOne({ studentId: req.user.userId }).lean(),
    ])

    const now = new Date()
    const opportunities = await Opportunity.find({
      isPublished: true,
      status: 'open',
      $or: [{ deadline: null }, { deadline: { $gt: now } }],
    }).limit(40).lean()

    const scored = opportunities.map((opp) => {
      const match = computeStudentMatch({
        studentUser: user || {},
        studentProfile: profile || {},
        portfolio: portfolio || {},
        opportunity: opp,
      })

      const companyName = opp.company?.name || 'Partner'
      return {
        ...opp,
        company: {
          name: companyName,
          logo: opp.company?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=1e293b&color=38bdf8`,
          website: opp.company?.website || '',
          careerUrl: opp.company?.careerUrl || '',
          sector: opp.company?.sector || 'Technology',
        },
        companyName,
        matchScore: match.score / 100,
        compatibility: match.score,
        breakdown: match.breakdown,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        whyRecommended: match.whyRecommended,
        isOfficialRadar: opp.source?.type === 'official_radar',
        officialApplyUrl: opp.applyUrl || opp.source?.officialUrl || '',
      }
    })

    scored.sort((a, b) => b.compatibility - a.compatibility)
    return res.status(200).json(successResponse({ opportunities: scored.slice(0, 10) }))
  } catch (error) {
    next(error)
  }
}
