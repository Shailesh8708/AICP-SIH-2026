import React, { useState, useEffect } from 'react'
import { Terminal, GitBranch, Cpu, Activity, Sparkles, CheckCircle2 } from 'lucide-react'

const CODE_STREAM_SNIPPETS = [
  'const career = await aicp.compileRoadmap({ verified: true });',
  'git commit -m "feat(ai): optimize full-stack career readiness"',
  'docker compose up --scale ai-readiness=3 -d',
  'npm run test:readiness -- --coverage=100%',
  'export default defineCareerPipeline({ targetRole, skills });',
]

export const SoftwareTelemetryHUD = ({ className = '' }) => {
  const [snippetIndex, setSnippetIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [latency, setLatency] = useState(14)

  // Typing effect for live software engineering code stream
  useEffect(() => {
    const currentFullText = CODE_STREAM_SNIPPETS[snippetIndex]
    let timer

    if (!isDeleting) {
      if (displayText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1))
        }, 45)
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2400)
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length - 1))
        }, 22)
      } else {
        setIsDeleting(false)
        setSnippetIndex((prev) => (prev + 1) % CODE_STREAM_SNIPPETS.length)
      }
    }

    return () => clearTimeout(timer)
  }, [displayText, isDeleting, snippetIndex])

  // Subtle simulated micro-latency oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(12 + Math.floor(Math.random() * 5))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`software-telemetry-hud tilt-card-3d cyber-hud-card ${className}`}>
      {/* Top Telemetry Diagnostics Bar */}
      <div className="telemetry-bar">
        <div className="telemetry-pill">
          <span className="telemetry-live-dot" />
          <GitBranch size={12} className="text-pink-400" />
          <span className="telemetry-label">GIT:</span>
          <span className="telemetry-val">main (0 conflicts)</span>
        </div>

        <div className="telemetry-pill">
          <Cpu size={12} className="text-cyan-400" />
          <span className="telemetry-label">ENGINE:</span>
          <span className="telemetry-val">LLVM-JIT · 60fps</span>
        </div>

        <div className="telemetry-pill">
          <Activity size={12} className="text-emerald-400" />
          <span className="telemetry-label">STATUS:</span>
          <span className="telemetry-val text-emerald-400 font-semibold">200 OK</span>
          <span className="telemetry-latency">· {latency}ms</span>
        </div>

        <div className="telemetry-pill">
          <Sparkles size={12} className="text-pink-400" />
          <span className="telemetry-label">AST MESH:</span>
          <span className="telemetry-val">ONLINE</span>
        </div>
      </div>

      {/* Live Monospace Code Terminal Line */}
      <div className="telemetry-code-line">
        <div className="terminal-prompt">
          <Terminal size={12} className="text-pink-400" />
          <span className="prompt-symbol">aicp-kernel:~$</span>
        </div>
        <div className="code-text-wrapper">
          <code className="telemetry-code-stream">
            {displayText}
            <span className="telemetry-caret" />
          </code>
        </div>
        <span className="verified-chip">
          <CheckCircle2 size={11} className="text-emerald-400" /> SYNCED
        </span>
      </div>
    </div>
  )
}

export default SoftwareTelemetryHUD

