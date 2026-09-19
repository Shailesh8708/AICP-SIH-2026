import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * CyberBackground3D
 * Ambient, ultra-futuristic 3D WebGL background canvas using Three.js.
 * Enhanced with Software Engineering Domain Illusions:
 * - Dynamic Neural Network / AST distributed mesh with proximity line connections
 * - Floating 3D code syntax glyphs ({ }, </>, =>, 0101, git::main, API::200, async)
 * - Refractive cyber rose (light pink) & electric cyan floating crystal nodes
 * - Quantum particle field with mouse-reactive parallax
 * - High-performance 60fps rendering with automatic pause on tab blur
 */
export const CyberBackground3D = () => {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const canvas = canvasRef.current
    let width = window.innerWidth
    let height = window.innerHeight

    // 1. Setup Three.js Scene, Camera & Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)
    camera.position.set(0, 0, 18)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
    scene.add(ambientLight)

    // Cyber Rose Light (Light Pink)
    const roseLight = new THREE.PointLight(0xf472b6, 3.8, 38)
    roseLight.position.set(12, 9, 8)
    scene.add(roseLight)

    // Electric Cyan Light
    const cyanLight = new THREE.PointLight(0x38bdf8, 3.2, 38)
    cyanLight.position.set(-12, -7, 7)
    scene.add(cyanLight)

    // 3. Primary Distributed Nodes for Neural / AST Network Mesh
    const nodeCount = 75
    const nodes = []
    const nodePositions = new Float32Array(nodeCount * 3)

    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - 0.5) * 38
      const y = (Math.random() - 0.5) * 26
      const z = (Math.random() - 0.5) * 16

      nodePositions[i * 3] = x
      nodePositions[i * 3 + 1] = y
      nodePositions[i * 3 + 2] = z

      nodes.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.012,
        vy: (Math.random() - 0.5) * 0.012,
        vz: (Math.random() - 0.5) * 0.008,
      })
    }

    // 4. Dynamic Proximity Line Mesh (Neural Net / AST Connections)
    const maxConnections = 240
    const linePositions = new Float32Array(maxConnections * 2 * 3)
    const lineColors = new Float32Array(maxConnections * 2 * 3)

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage))
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage))

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineMesh)

    // 5. Quantum Background Particles (Dust Field)
    const dustCount = 320
    const dustGeo = new THREE.BufferGeometry()
    const dustPositions = new Float32Array(dustCount * 3)
    const dustColors = new Float32Array(dustCount * 3)

    const colorRose = new THREE.Color(0xf472b6)
    const colorCyan = new THREE.Color(0x38bdf8)
    const colorGold = new THREE.Color(0xfbbf24)

    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3
      dustPositions[idx] = (Math.random() - 0.5) * 44
      dustPositions[idx + 1] = (Math.random() - 0.5) * 32
      dustPositions[idx + 2] = (Math.random() - 0.5) * 22

      const rand = Math.random()
      const c = rand < 0.45 ? colorRose : rand < 0.85 ? colorCyan : colorGold
      dustColors[idx] = c.r
      dustColors[idx + 1] = c.g
      dustColors[idx + 2] = c.b
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3))

    // Canvas-based radial particle glow texture
    const pCanvas = document.createElement('canvas')
    pCanvas.width = 32
    pCanvas.height = 32
    const pCtx = pCanvas.getContext('2d')
    const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
    pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    pGrad.addColorStop(0.35, 'rgba(244, 114, 182, 0.85)')
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    pCtx.fillStyle = pGrad
    pCtx.fillRect(0, 0, 32, 32)
    const pTexture = new THREE.CanvasTexture(pCanvas)

    const dustMat = new THREE.PointsMaterial({
      size: 0.38,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const dustSystem = new THREE.Points(dustGeo, dustMat)
    scene.add(dustSystem)

    // 6. Floating 3D Software Engineering Glyphs (Code Tokens)
    const glyphsGroup = new THREE.Group()
    scene.add(glyphsGroup)

    const codeTokens = [
      '{ ... }',
      '</>',
      '=>',
      '0101',
      'git::main',
      'API::200',
      'async',
      'λ.map()',
      'const',
      'AST::node',
      '12ms',
      'npm::build',
    ]

    const glyphSprites = []

    codeTokens.forEach((token, index) => {
      const gCanvas = document.createElement('canvas')
      gCanvas.width = 160
      gCanvas.height = 64
      const gCtx = gCanvas.getContext('2d')

      // Styling: Monospace futuristic code chip
      const isRose = index % 2 === 0
      gCtx.font = 'bold 22px "SF Mono", "Fira Code", monospace'
      gCtx.fillStyle = isRose ? 'rgba(244, 114, 182, 0.9)' : 'rgba(56, 189, 248, 0.9)'
      gCtx.shadowColor = isRose ? '#f472b6' : '#38bdf8'
      gCtx.shadowBlur = 12
      gCtx.textAlign = 'center'
      gCtx.textBaseline = 'middle'
      gCtx.fillText(token, 80, 32)

      const gTexture = new THREE.CanvasTexture(gCanvas)
      const gMat = new THREE.SpriteMaterial({
        map: gTexture,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const sprite = new THREE.Sprite(gMat)
      const scaleX = 2.4
      const scaleY = 0.96
      sprite.scale.set(scaleX, scaleY, 1)

      const x = (Math.random() - 0.5) * 32
      const y = (Math.random() - 0.5) * 22
      const z = (Math.random() - 0.5) * 14 - 1
      sprite.position.set(x, y, z)

      glyphSprites.push({
        sprite,
        baseY: y,
        floatSpeed: 0.0012 + Math.random() * 0.001,
        floatOffset: Math.random() * Math.PI * 2,
        driftSpeedX: (Math.random() - 0.5) * 0.004,
      })

      glyphsGroup.add(sprite)
    })

    // 7. Floating 3D Geometric Crystal Shards
    const crystalsGroup = new THREE.Group()
    scene.add(crystalsGroup)

    const crystalCount = 12
    const crystals = []

    const roseCrystalMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.65,
      transparent: true,
      opacity: 0.6,
    })

    const cyanCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.65,
      transparent: true,
      opacity: 0.55,
    })

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    })

    for (let i = 0; i < crystalCount; i++) {
      const isIcosa = i % 2 === 0
      const size = 0.48 + Math.random() * 0.6
      const geo = isIcosa
        ? new THREE.IcosahedronGeometry(size, 0)
        : new THREE.OctahedronGeometry(size, 0)

      const mat = i % 3 === 0 ? roseCrystalMat : cyanCrystalMat
      const mesh = new THREE.Mesh(geo, mat)

      const wireMesh = new THREE.Mesh(geo, wireMat)
      wireMesh.scale.set(1.03, 1.03, 1.03)
      mesh.add(wireMesh)

      mesh.position.set(
        (Math.random() - 0.5) * 34,
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 14 - 2
      )

      crystals.push({
        mesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.006,
          y: (Math.random() - 0.5) * 0.008,
          z: (Math.random() - 0.5) * 0.005,
        },
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.001 + Math.random() * 0.0015,
        baseY: mesh.position.y,
      })
      crystalsGroup.add(mesh)
    }

    // 8. Pointer & Scroll Coordinates
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
    let scrollY = window.scrollY || 0

    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const handleScroll = () => {
      scrollY = window.scrollY || document.documentElement.scrollTop
    }

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    let isVisible = true
    const handleVisibility = () => {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // 9. Continuous 60fps Animation Loop
    const animate = () => {
      const now = performance.now()

      if (isVisible) {
        // Camera smooth parallax lerp
        mouse.x += (mouse.targetX - mouse.x) * 0.05
        mouse.y += (mouse.targetY - mouse.y) * 0.05

        camera.position.x = mouse.x * 2.4
        camera.position.y = -mouse.y * 1.8 - (scrollY * 0.002)
        camera.lookAt(0, -scrollY * 0.001, 0)

        // Slowly rotate dust particles
        dustSystem.rotation.y = now * 0.00015
        dustSystem.rotation.x = Math.sin(now * 0.0001) * 0.07

        // A. Update Distributed Network Nodes & Dynamic Proximity Lines
        for (let i = 0; i < nodeCount; i++) {
          const n = nodes[i]
          n.x += n.vx
          n.y += n.vy
          n.z += n.vz

          // Bounce back within bounds
          if (Math.abs(n.x) > 19) n.vx *= -1
          if (Math.abs(n.y) > 13) n.vy *= -1
          if (Math.abs(n.z) > 8) n.vz *= -1
        }

        // Connect nearby nodes (Neural Net / AST Connections)
        let connectionCount = 0
        const posAttr = lineGeometry.attributes.position
        const colAttr = lineGeometry.attributes.color
        const maxDist = 4.8
        const maxDistSq = maxDist * maxDist

        for (let i = 0; i < nodeCount && connectionCount < maxConnections; i++) {
          for (let j = i + 1; j < nodeCount && connectionCount < maxConnections; j++) {
            const dx = nodes[i].x - nodes[j].x
            const dy = nodes[i].y - nodes[j].y
            const dz = nodes[i].z - nodes[j].z
            const distSq = dx * dx + dy * dy + dz * dz

            if (distSq < maxDistSq) {
              const alpha = 1.0 - Math.sqrt(distSq) / maxDist
              const idx = connectionCount * 6

              // Vertex 1
              linePositions[idx] = nodes[i].x
              linePositions[idx + 1] = nodes[i].y
              linePositions[idx + 2] = nodes[i].z

              // Vertex 2
              linePositions[idx + 3] = nodes[j].x
              linePositions[idx + 4] = nodes[j].y
              linePositions[idx + 5] = nodes[j].z

              // Interpolate colors: Cyber Rose (#f472b6) to Electric Cyan (#38bdf8)
              const isRoseLead = (i + j) % 2 === 0
              const r1 = isRoseLead ? 0.95 * alpha : 0.22 * alpha
              const g1 = isRoseLead ? 0.45 * alpha : 0.74 * alpha
              const b1 = isRoseLead ? 0.71 * alpha : 0.97 * alpha

              const r2 = isRoseLead ? 0.22 * alpha : 0.95 * alpha
              const g2 = isRoseLead ? 0.74 * alpha : 0.45 * alpha
              const b2 = isRoseLead ? 0.97 * alpha : 0.71 * alpha

              lineColors[idx] = r1
              lineColors[idx + 1] = g1
              lineColors[idx + 2] = b1
              lineColors[idx + 3] = r2
              lineColors[idx + 4] = g2
              lineColors[idx + 5] = b2

              connectionCount++
            }
          }
        }

        lineGeometry.setDrawRange(0, connectionCount * 2)
        posAttr.needsUpdate = true
        colAttr.needsUpdate = true

        // B. Animate Floating Code Glyphs
        for (let i = 0; i < glyphSprites.length; i++) {
          const g = glyphSprites[i]
          g.sprite.position.y = g.baseY + Math.sin(now * g.floatSpeed + g.floatOffset) * 0.35
          g.sprite.position.x += g.driftSpeedX
          if (Math.abs(g.sprite.position.x) > 17) g.driftSpeedX *= -1
        }

        // C. Animate Geometric Crystal Shards
        for (let i = 0; i < crystals.length; i++) {
          const c = crystals[i]
          c.mesh.rotation.x += c.rotSpeed.x
          c.mesh.rotation.y += c.rotSpeed.y
          c.mesh.rotation.z += c.rotSpeed.z
          c.mesh.position.y = c.baseY + Math.sin(now * c.floatSpeed + c.floatOffset) * 0.45
        }

        // Pulse lights
        roseLight.intensity = 2.9 + Math.sin(now * 0.002) * 0.8
        cyanLight.intensity = 2.6 + Math.cos(now * 0.0018) * 0.7

        renderer.render(scene, camera)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    // 10. Cleanup
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
      lineGeometry.dispose()
      lineMaterial.dispose()
      dustGeo.dispose()
      dustMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="cyber-background-canvas"
      aria-hidden="true"
    />
  )
}

export default CyberBackground3D
