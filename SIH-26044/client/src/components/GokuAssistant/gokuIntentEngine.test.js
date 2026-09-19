import { describe, it, expect } from 'vitest'
import { analyzeIntent } from './gokuIntentEngine'

describe('Goku Intent Detection Engine', () => {
  it('identifies weight gain diet plan request correctly', () => {
    const result = analyzeIntent('I want a diet plan for weight gain.')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/diet-plan')
    expect(result.message).toContain('Weight Gain Diet Plan')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies calorie consumption calculator request', () => {
    const result = analyzeIntent('I want to know how many calories I should consume.')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/calorie-calculator')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies workout plan request', () => {
    const result = analyzeIntent('Give me a workout plan.')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/workout-plan')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies symptom / health checker request', () => {
    const result = analyzeIntent('I want to check my symptoms.')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/health-checker')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies ATS resume request', () => {
    const result = analyzeIntent('I want to build an ATS resume')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/resume')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies internship and job search request', () => {
    const result = analyzeIntent('Find me internships and job openings')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/opportunities')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies AI mock interview drill request', () => {
    const result = analyzeIntent('Practice an AI mock interview')
    expect(result.success).toBe(true)
    expect(result.route).toContain('mock-interview')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies skill gap inquiry', () => {
    const result = analyzeIntent('Analyze my skill gaps')
    expect(result.success).toBe(true)
    expect(result.route).toContain('skill-gap')
    expect(result.autoRedirect).toBe(true)
  })

  it('handles general greeting without auto-redirecting', () => {
    const result = analyzeIntent('Hello Goku')
    expect(result.success).toBe(true)
    expect(result.type).toBe('greeting')
    expect(result.autoRedirect).toBe(false)
  })

  it('handles FAQ inquiry about Goku identity', () => {
    const result = analyzeIntent('Who are you?')
    expect(result.success).toBe(true)
    expect(result.type).toBe('faq')
    expect(result.message).toContain('Goku')
  })

  it('identifies exact prompt query: I want to find opportunities', () => {
    const result = analyzeIntent('I want to find opportunities')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/opportunities')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies exact prompt query: I want to check my skills', () => {
    const result = analyzeIntent('I want to check my skills')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/skills')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies exact prompt query: I want to prepare my resume', () => {
    const result = analyzeIntent('I want to prepare my resume')
    expect(result.success).toBe(true)
    expect(result.route).toBe('/resume')
    expect(result.autoRedirect).toBe(true)
  })

  it('identifies exact prompt query: I want a mock interview', () => {
    const result = analyzeIntent('I want a mock interview')
    expect(result.success).toBe(true)
    expect(result.route).toContain('mock-interview')
    expect(result.autoRedirect).toBe(true)
  })
})

