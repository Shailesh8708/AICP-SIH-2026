import { GOKU_KNOWLEDGE } from './gokuKnowledge'

/**
 * Normalizes input string for token matching
 */
const normalizeText = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Checks for greeting phrases
 */
const isGreeting = (cleanText) => {
  const greetings = ['hello', 'hi', 'hey', 'goku', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup']
  const words = cleanText.split(' ')
  return greetings.some((g) => words.includes(g)) && words.length <= 4
}

/**
 * Checks for gratitude or farewell
 */
const isGratitudeOrFarewell = (cleanText) => {
  if (['thank you', 'thanks', 'thx', 'thank you goku', 'awesome thanks', 'great thanks'].includes(cleanText)) {
    return {
      type: 'gratitude',
      message: "You're very welcome! I'm always here if you need help navigating or exploring other features. Just ask!",
    }
  }
  if (['bye', 'goodbye', 'see you', 'cya', 'exit'].includes(cleanText)) {
    return {
      type: 'farewell',
      message: "Take care! Whenever you're ready to accelerate your journey, I'll be right here waiting!",
    }
  }
  return null
}

/**
 * Analyzes natural language query and matches intent to platform services
 */
export const analyzeIntent = (rawQuery) => {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      success: false,
      message: "Please enter a question or tell me what service you're looking for!",
    }
  }

  const cleanQuery = normalizeText(rawQuery)

  // 1. Check gratitude / farewell
  const courtesy = isGratitudeOrFarewell(cleanQuery)
  if (courtesy) {
    return {
      success: true,
      type: courtesy.type,
      message: courtesy.message,
      autoRedirect: false,
    }
  }

  // 2. Check general greeting
  if (isGreeting(cleanQuery)) {
    return {
      success: true,
      type: 'greeting',
      message: "Hello there! I'm Goku, your AI virtual guide. What type of service or assistance do you require today?",
      suggestions: [
        'I want a diet plan for weight gain',
        'Find internships and jobs',
        'I want to build an ATS resume',
        'Practice an AI mock interview',
      ],
      autoRedirect: false,
    }
  }

  // 3. Check FAQs & General knowledge
  for (const faq of GOKU_KNOWLEDGE.faqs) {
    if (faq.triggers.some((trig) => cleanQuery.includes(trig))) {
      return {
        success: true,
        type: 'faq',
        message: faq.answer,
        suggestions: [
          'Take me to Opportunities',
          'Build ATS Resume',
          'AI Mock Interview',
          'Calorie Calculator',
        ],
        autoRedirect: false,
      }
    }
  }

  // 4. Exact Matches Check against services
  for (const service of GOKU_KNOWLEDGE.services) {
    if (service.exactMatches && service.exactMatches.some((em) => cleanQuery.includes(normalizeText(em)))) {
      return buildServiceResult(service, rawQuery)
    }
  }

  // 5. Multi-word and keyword scoring
  const queryTokens = cleanQuery.split(' ').filter((w) => w.length > 1)
  let bestService = null
  let highestScore = 0

  for (const service of GOKU_KNOWLEDGE.services) {
    let score = 0

    // Check multi-word keywords first (high weight)
    for (const kw of service.keywords) {
      const normKw = normalizeText(kw)
      if (normKw.includes(' ') && cleanQuery.includes(normKw)) {
        score += 15 // High reward for exact multi-word phrase
      } else if (queryTokens.includes(normKw)) {
        score += 6
      } else {
        // Partial word match
        for (const token of queryTokens) {
          if (token.length > 3 && (normKw.startsWith(token) || token.startsWith(normKw))) {
            score += 2
          }
        }
      }
    }

    // Boost if title matches
    if (cleanQuery.includes(normalizeText(service.title))) {
      score += 12
    }

    if (score > highestScore) {
      highestScore = score
      bestService = service
    }
  }

  // Score threshold for confident match
  if (bestService && highestScore >= 5) {
    return buildServiceResult(bestService, rawQuery)
  }

  // 6. Fallback response when no direct match is found
  return {
    success: false,
    type: 'unknown',
    message: "I couldn't quite identify that exact service, but here are the key features I can guide you to right now:",
    suggestions: [
      'I want a diet plan for weight gain',
      'I want to know how many calories I should consume',
      'Give me a workout plan',
      'I want to check my symptoms',
      'Build ATS Resume',
      'Find Internships',
      'AI Mock Interview',
    ],
    autoRedirect: false,
  }
}

/**
 * Builds formatted service navigation response
 */
const buildServiceResult = (service, originalQuery) => {
  // Personalized prompt match handling
  let replyText = service.response

  // If query mentions weight gain or weight loss specifically for diet
  if (service.id === 'diet-plan') {
    if (originalQuery.toLowerCase().includes('gain')) {
      replyText = "Sure! I can help you with that. Taking you to the Weight Gain Diet Plan section."
    } else if (originalQuery.toLowerCase().includes('loss')) {
      replyText = "Sure! I can help you with that. Taking you to the Weight Loss & Lean Diet Plan section."
    }
  }

  // Related suggestions
  const allOtherServices = GOKU_KNOWLEDGE.services
    .filter((s) => s.id !== service.id)
    .slice(0, 3)
    .map((s) => s.exactMatches?.[0] || s.title)

  return {
    success: true,
    type: 'navigation',
    intentId: service.id,
    title: service.title,
    route: service.route,
    message: replyText,
    guidance: service.guidance,
    badge: service.badge,
    category: service.category,
    actionText: `Go to ${service.title} →`,
    autoRedirect: true,
    redirectDelayMs: 2200,
    suggestions: allOtherServices,
  }
}

