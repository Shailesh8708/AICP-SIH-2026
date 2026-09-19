import React, { useState, useRef, useCallback } from 'react'

export const HeroCompanionShowcase = () => {
  const cardRef = useRef(null)
  const [transformStyle, setTransformStyle] = useState('')
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calibrated 3D parallax angles (smoother, futuristic tilt)
    const rotateX = ((centerY - y) / centerY) * 10
    const rotateY = ((x - centerX) / centerX) * 12

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.035, 1.035, 1.035)`
    )
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTransformStyle('')
  }

  return (
    <div
      ref={cardRef}
      className={`hero-companion-showcase tilt-card-3d ${isHovered ? 'is-hovered' : 'is-floating'}`}
      style={transformStyle ? { transform: transformStyle } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Interactive 3D AI Robot Companion"
    >
      {/* Outer Multi-Spectral Ambient Cyber Aura */}
      <div className="companion-glow-aura" />

      {/* Rotating Cyber Energy Border Glow */}
      <div className="companion-cyber-border-glow" />

      {/* Main Video Container */}
      <div className="companion-video-wrapper">
        <video
          src="/robot-companion.mp4"
          poster="/robot-companion-poster.jpg"
          autoPlay
          loop
          muted
          playsInline
          className="companion-video"
          aria-label="3D Robot Chatbot Animation"
        />

        {/* Futuristic Laser Hologram Scanline */}
        <div className="companion-scanline" />

        {/* Hologram Glass Sheen Overlay */}
        <div className="companion-hologram-sheen" />

        {/* Cyber HUD Corner Reticles */}
        <div className="companion-corner-reticle reticle-tl" />
        <div className="companion-corner-reticle reticle-tr" />
        <div className="companion-corner-reticle reticle-bl" />
        <div className="companion-corner-reticle reticle-br" />

        {/* Futuristic Live Online Pill Beacon */}
        <div className="companion-live-status-pill">
          <span className="companion-live-core">
            <span className="companion-live-ping" />
            <span className="companion-live-dot" />
          </span>
          <span className="companion-live-text">AI LIVE</span>
        </div>
      </div>
    </div>
  )
}

export default HeroCompanionShowcase
