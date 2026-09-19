import { describe, expect, it } from 'vitest'
import {
  validateAnswerInput,
  getStagePromptsForRound,
  analyzeSpeechAndGrammar,
  rateAnswer,
  getModelAnswer,
  getMockModelAnswer,
  exitInterview,
} from '../src/controllers/careerAgentController.js'

describe('Career Interview - Input Validation', () => {
  it('rejects empty or single character input', () => {
    expect(validateAnswerInput('').isValid).toBe(false)
    expect(validateAnswerInput('   ').isValid).toBe(false)
    expect(validateAnswerInput('a').isValid).toBe(false)
  })

  it('rejects keyboard mashing and repetitive characters', () => {
    const repeatResult = validateAnswerInput('aaaaaaaaaaa')
    expect(repeatResult.isValid).toBe(false)
    expect(repeatResult.reason).toContain('repetitive characters')

    const mashResult = validateAnswerInput('asdf qwerty zxcv')
    expect(mashResult.isValid).toBe(false)
    expect(mashResult.reason).toContain('placeholder or test text')
  })

  it('rejects evasion on core interview stages like skills and projects', () => {
    const skipSkills = validateAnswerInput('skip', 'skills')
    expect(skipSkills.isValid).toBe(false)

    const idkProjects = validateAnswerInput("i don't know", 'projects')
    expect(idkProjects.isValid).toBe(false)
  })

  it('allows valid responses and acceptable skips on optional stages', () => {
    const validAnswer = validateAnswerInput(
      'I am proficient in JavaScript, TypeScript, React, and Node.js with MongoDB.',
      'skills'
    )
    expect(validAnswer.isValid).toBe(true)

    const optionalSkip = validateAnswerInput('None at this moment', 'certifications')
    expect(optionalSkip.isValid).toBe(true)
  })
})

describe('Career Interview - Round Progression & Non-repeated Questions', () => {
  it('returns distinct question sets for Round 1, Round 2, and Round 3', () => {
    const r1 = getStagePromptsForRound(1)
    const r2 = getStagePromptsForRound(2)
    const r3 = getStagePromptsForRound(3)

    expect(r1.personal).not.toEqual(r2.personal)
    expect(r2.personal).not.toEqual(r3.personal)
    expect(r1.skills).toContain('languages')
    expect(r2.skills).toContain('system design')
    expect(r3.skills).toContain('maintainability')
  })
})

describe('Career Interview - Voice & Speech Analysis', () => {
  it('analyzes pacing (WPM), tone, filler words, and grammatical issues', () => {
    const transcript = 'Um I has been working on Node.js and like we was building an API reversion.'
    const speechMetrics = { durationSeconds: 6, isMicInput: true }

    const analysis = analyzeSpeechAndGrammar(transcript, speechMetrics)

    expect(analysis).toBeDefined()
    expect(analysis.pacingWPM).toBeGreaterThan(0)
    expect(analysis.fillerWordsCount).toBeGreaterThan(0)
    expect(analysis.fillerWordsList).toContain('um')
    expect(analysis.fillerWordsList).toContain('like')

    // Grammatical check
    expect(analysis.grammaticalIssues.length).toBeGreaterThanOrEqual(1)
    const issueTexts = analysis.grammaticalIssues.map((i) => i.issue).join(' ')
    expect(issueTexts).toMatch(/verb agreement/i)
  })
})

describe('Career Interview - Answer Rating & Model Exemplars', () => {
  it('computes structured rating with strengths, improvements, and model answers', () => {
    const question = 'What core programming languages and frameworks are you strongest in?'
    const answer = 'I specialize in React for frontend and Express with Node.js on backend. In my recent full stack project, I built authentication and caching using Redis.'

    const evaluation = rateAnswer(question, answer, 'skills', null, 1)

    expect(evaluation.score).toBeGreaterThanOrEqual(70)
    expect(evaluation.ratingTier).toBeDefined()
    expect(evaluation.strengths.length).toBeGreaterThan(0)
    expect(evaluation.improvements.length).toBeGreaterThan(0)
    expect(evaluation.modelAnswer).toContain('React')
  })

  it('provides rich model answers for mock interview questions across categories', () => {
    const techAnswer = getMockModelAnswer('What is event loop in Node.js?', 'Technical')
    expect(techAnswer).toContain('libuv')

    const behavAnswer = getMockModelAnswer('Tell me about a challenging situation with a teammate', 'Behavioral')
    expect(behavAnswer).toContain('STAR')
  })
})

describe('Career Interview - Exit & Session Management', () => {
  it('exports exitInterview controller function', () => {
    expect(typeof exitInterview).toBe('function')
  })
})


