import React, { useState, useEffect, useRef } from 'react'

/**
 * High-performance viewport statistics counting animation component.
 * Parses input strings (e.g. "10,000+", "99.2%", "500+") and animates
 * smoothly from 0 to the target number upon entering the viewport.
 */
export const CountUp = ({ value, duration = 1400, className = '' }) => {
  const [displayValue, setDisplayValue] = useState('0')
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef(null)

  // Parse string values like "10,000+", "99.2%", "500+"
  const parseValue = (raw) => {
    if (typeof raw === 'number') {
      return { num: raw, suffix: '', decimals: 0, hasCommas: false }
    }
    const str = String(raw).trim()
    const hasCommas = str.includes(',')
    const suffixMatch = str.match(/[^0-9.,]+$/)
    const suffix = suffixMatch ? suffixMatch[0] : ''
    const cleanNumStr = str.replace(/[^0-9.]/g, '')
    const num = parseFloat(cleanNumStr) || 0
    const decimals = cleanNumStr.includes('.') ? cleanNumStr.split('.')[1].length : 0

    return { num, suffix, decimals, hasCommas }
  }

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayValue(value)
      return
    }

    const { num, suffix, decimals, hasCommas } = parseValue(value)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)

          let startTime = null
          const startNum = 0

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)

            // Ease Out Cubic for smooth natural slowdown
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            const currentNum = startNum + (num - startNum) * easeProgress

            if (progress < 1) {
              let formatted = decimals > 0 ? currentNum.toFixed(decimals) : Math.floor(currentNum).toString()
              if (hasCommas) {
                formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              setDisplayValue(`${formatted}${suffix}`)
              requestAnimationFrame(step)
            } else {
              // Final value guaranteed to match exact original format
              setDisplayValue(value)
            }
          }

          requestAnimationFrame(step)
        }
      },
      { threshold: 0.2 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [value, duration, hasAnimated])

  return (
    <span ref={elementRef} className={`count-up-number inline-block tabular-nums ${className}`}>
      {displayValue}
    </span>
  )
}

