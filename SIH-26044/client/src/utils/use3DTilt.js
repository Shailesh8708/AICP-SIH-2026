import { useRef, useCallback } from 'react'

/**
 * use3DTilt
 * High-performance hook for realistic 3D perspective card tilting and gliding specular sheen.
 * Uses direct CSS custom properties (--tilt-rx, --tilt-ry, --sheen-x, --sheen-y) without React state updates.
 */
export function use3DTilt(maxAngle = 10, scale = 1.025) {
  const cardRef = useRef(null)

  const onMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const normX = Math.max(0, Math.min(1, x / rect.width))
    const normY = Math.max(0, Math.min(1, y / rect.height))

    const rx = (0.5 - normY) * maxAngle
    const ry = (normX - 0.5) * maxAngle

    cardRef.current.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`)
    cardRef.current.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`)
    cardRef.current.style.setProperty('--tilt-scale', `${scale}`)
    cardRef.current.style.setProperty('--sheen-x', `${(normX * 100).toFixed(1)}%`)
    cardRef.current.style.setProperty('--sheen-y', `${(normY * 100).toFixed(1)}%`)
    cardRef.current.style.setProperty('--sheen-opacity', '1')
  }, [maxAngle, scale])

  const onMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.setProperty('--tilt-rx', '0deg')
    cardRef.current.style.setProperty('--tilt-ry', '0deg')
    cardRef.current.style.setProperty('--tilt-scale', '1')
    cardRef.current.style.setProperty('--sheen-opacity', '0')
  }, [])

  return { cardRef, onMouseMove, onMouseLeave }
}

export default use3DTilt

