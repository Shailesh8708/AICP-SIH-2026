import React, { useState } from 'react'
import { GraduationCap, ArrowRight, Sparkles, Award, ExternalLink } from 'lucide-react'
import { Button } from './common'
import { GainSkillsPanel } from './GainSkillsPanel'

export const GainSkillsCard = ({ compact = false, className = '' }) => {
  const [panelOpen, setPanelOpen] = useState(false)

  return (
    <>
      <article className={`gain-skills-trigger-card ${className}`}>
        <div className="gain-skills-card-glow" />

        <div className="gain-skills-trigger-header">
          <div className="gain-skills-badge">
            <Sparkles size={13} />
            <span>Learning Ecosystem</span>
          </div>
          <div className="gain-skills-icon-wrap">
            <GraduationCap size={22} />
          </div>
        </div>

        <h3>
          🎓 Gain Skills &amp; Certificates
        </h3>

        <p>
          Learn industry-ready skills, work on real projects and earn certificates from leading platforms.
        </p>

        {!compact && (
          <div className="gain-skills-trigger-features">
            <span className="gain-skills-feature-pill">
              <Award size={11} /> 13+ Verified Platforms
            </span>
            <span className="gain-skills-feature-pill">
              💻 Tech, Cloud &amp; AI
            </span>
            <span className="gain-skills-feature-pill">
              🚀 Direct Official Portals
            </span>
            <span className="gain-skills-feature-pill">
              🏆 Verifiable Badges
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="primary"
            size={compact ? 'sm' : 'md'}
            onClick={() => setPanelOpen(true)}
            className="w-full sm:w-auto"
          >
            Explore &amp; Learn <ArrowRight size={15} />
          </Button>
        </div>
      </article>

      {/* Interactive Modal Drawer */}
      {panelOpen && <GainSkillsPanel onClose={() => setPanelOpen(false)} />}
    </>
  )
}
