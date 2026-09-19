import { useEffect, useRef } from 'react'

/**
 * Custom hook to trigger scroll-revealed animations via IntersectionObserver.
 * Lightweight, GPU friendly, automatically disconnects once element is visible.
 */
export const useScrollReveal = (options = {}) => {
  const ref = useRef(null)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const elem = ref.current
    if (!elem) return

    if (prefersReducedMotion) {
      elem.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          elem.classList.add('is-visible')
          observer.unobserve(elem)
        }
      },
      {
        threshold: options.threshold || 0.12,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
      }
    )

    observer.observe(elem)

    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return ref
}

