import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  BrainCircuit,
  Cloud,
  Code2,
  Briefcase,
  Award,
  Layers,
  CheckCircle2,
  ArrowRight,
  X,
  Compass,
  GraduationCap,
  ChevronRight,
  Terminal,
  Cpu,
  Globe2,
  Database,
  Lock,
} from 'lucide-react'
import {
  PLATFORM_CATEGORIES,
  SKILL_FILTER_TAGS,
  CERTIFICATION_ROADMAP,
  LEARNING_PLATFORMS,
} from '../data/learningPlatforms'
import { CompanyLogo } from './common/CompanyLogo'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../utils/constants'

export const GainSkillsPanel = ({ onClose, standalone = false }) => {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSkillTag, setSelectedSkillTag] = useState('All Skills')
  const [searchQuery, setSearchQuery] = useState('')

  // Handle ESC key to close modal
  useEffect(() => {
    if (standalone || !onClose) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, standalone])

  // Compute smart recommendations based on student's profile/skills
  const recommendations = useMemo(() => {
    const userSkills = Array.isArray(user?.skills)
      ? user.skills.map((s) => (typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase() || ''))
      : []

    if (!userSkills.length) {
      // Default recommended flagship platforms if user has not set skills yet
      return LEARNING_PLATFORMS.filter((p) => p.featured).slice(0, 4)
    }

    const matched = LEARNING_PLATFORMS.filter((platform) => {
      return platform.matchKeywords.some((keyword) =>
        userSkills.some((s) => s.includes(keyword) || keyword.includes(s))
      )
    })

    return matched.length ? matched.slice(0, 4) : LEARNING_PLATFORMS.filter((p) => p.featured).slice(0, 4)
  }, [user])

  // Filter platforms by Category, Skill Tag, and Search Query
  const filteredPlatforms = useMemo(() => {
    return LEARNING_PLATFORMS.filter((platform) => {
      // Category filter
      if (selectedCategory !== 'all' && platform.category !== selectedCategory) {
        return false
      }

      // Skill tag filter
      if (selectedSkillTag !== 'All Skills' && !platform.tags.includes(selectedSkillTag)) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = platform.name.toLowerCase().includes(q)
        const matchesDesc = platform.shortDesc.toLowerCase().includes(q)
        const matchesProvider = platform.provider.toLowerCase().includes(q)
        const matchesAreas = platform.areas.some((a) => a.toLowerCase().includes(q))
        const matchesTags = platform.tags.some((t) => t.toLowerCase().includes(q))
        return matchesName || matchesDesc || matchesProvider || matchesAreas || matchesTags
      }

      return true
    })
  }, [selectedCategory, selectedSkillTag, searchQuery])

  // Category Icon helper
  const renderCategoryIcon = (iconName, size = 15) => {
    switch (iconName) {
      case 'Code2': return <Code2 size={size} />
      case 'BrainCircuit': return <BrainCircuit size={size} />
      case 'Cloud': return <Cloud size={size} />
      case 'ShieldCheck': return <ShieldCheck size={size} />
      case 'Briefcase': return <Briefcase size={size} />
      default: return <Sparkles size={size} />
    }
  }

  const content = (
    <>
      {/* Smart Profile Recommendations Banner */}
      <section className="gain-skills-recommend-banner">
        <div className="gain-skills-recommend-content">
          <div className="gain-skills-recommend-icon">
            <Sparkles size={20} />
          </div>
          <div className="gain-skills-recommend-text">
            <strong>🎯 AI Smart Recommendations for Your Profile</strong>
            <div className="gain-skills-recommend-chips">
              {recommendations.map((p) => (
                <a
                  key={p.id}
                  href={p.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gain-skills-rec-chip"
                  title={`Open official ${p.name}`}
                >
                  <CompanyLogo company={p.logoKey || p.id} size={24} variant="icon" />
                  <span>{p.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Search & Filter Toolbar */}
      <section className="gain-skills-toolbar">
        <div className="gain-skills-search-row">
          <div className="gain-skills-search-input-wrap">
            <Search size={17} className="gain-skills-search-icon" />
            <input
              type="text"
              className="gain-skills-search-input"
              placeholder="Search platforms, skills, technologies, or keywords (e.g. Python, Azure, AI, AWS, Cisco)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search learning platforms"
            />
            {searchQuery && (
              <button
                type="button"
                className="gain-skills-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <span className="gain-skills-results-count">
            Showing <strong>{filteredPlatforms.length}</strong> verified platforms
          </span>
        </div>

        {/* Categories */}
        <div className="gain-skills-category-tabs" role="tablist">
          {PLATFORM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={selectedCategory === cat.id}
              className={`gain-skills-category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {renderCategoryIcon(cat.icon, 14)}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Skill Tag Filters */}
        <div className="gain-skills-tags-row">
          <span className="gain-skills-tag-label">Filter:</span>
          {SKILL_FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`gain-skills-skill-tag ${selectedSkillTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedSkillTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Platform Cards Grid */}
      <div className="gain-skills-grid">
        {filteredPlatforms.length > 0 ? (
          filteredPlatforms.map((platform) => (
            <article key={platform.id} className="gain-skills-platform-card">
              <div className="gain-skills-card-top">
                <div className="gain-skills-card-brand">
                  <div
                    className="gain-skills-logo-box"
                    title={platform.name}
                  >
                    <CompanyLogo company={platform.logoKey || platform.id} size={118} variant="full" />
                  </div>
                  <span
                    className={`gain-skills-credential-badge ${platform.badgeType}`}
                    title={platform.badgeNote}
                  >
                    <Award size={12} /> {platform.badgeLabel}
                  </span>
                </div>

                <h4>{platform.name}</h4>
                <div className="gain-skills-provider-sub">{platform.provider}</div>
                <p className="gain-skills-card-desc">{platform.shortDesc}</p>

                <div className="gain-skills-areas-row">
                  {platform.areas.map((area) => (
                    <span key={area} className="gain-skills-area-pill">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="gain-skills-card-foot">
                <span className="gain-skills-domain-tag">
                  <Globe2 size={12} /> Official Portal
                </span>
                <a
                  href={platform.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gain-skills-action-btn"
                  title={`Open official ${platform.name} website in a new tab`}
                >
                  <CompanyLogo
                    company={platform.logoKey || platform.id}
                    size={26}
                    variant="icon"
                    className="gain-skills-btn-logo"
                  />
                  <span>Explore on {platform.provider?.split(' ')[0] || platform.name}</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="gain-skills-empty-state">
            <h4>No platforms found matching &quot;{searchQuery}&quot;</h4>
            <p>Try switching categories or clearing search keywords.</p>
          </div>
        )}
      </div>

      {/* 🚀 Dedicated Subsection: Build Real-World Experience */}
      <section className="gain-skills-realworld-section">
        <div className="gain-skills-realworld-header">
          <div className="gain-skills-realworld-title">
            <h3>
              <Terminal size={22} className="text-amber-400" /> Build Real-World Experience
            </h3>
            <p>
              Theory gets you started, but verified hands-on execution gets you hired.
              Strengthen your AICP profile through practical challenges and employer-matched projects.
            </p>
          </div>
          <Link to={ROUTES.OPPORTUNITIES} onClick={onClose}>
            <button className="gain-skills-action-btn">
              Find Projects &amp; Challenges <ExternalLink size={13} />
            </button>
          </Link>
        </div>

        <div className="gain-skills-realworld-grid">
          <div className="gain-skills-realworld-item">
            <Cpu size={16} /> Industry-relevant projects
          </div>
          <div className="gain-skills-realworld-item">
            <Terminal size={16} /> Hands-on virtual labs
          </div>
          <div className="gain-skills-realworld-item">
            <CheckCircle2 size={16} /> Practical assignments
          </div>
          <div className="gain-skills-realworld-item">
            <BrainCircuit size={16} /> AI/ML production pipelines
          </div>
          <div className="gain-skills-realworld-item">
            <Cloud size={16} /> Cloud architecture deployments
          </div>
          <div className="gain-skills-realworld-item">
            <Lock size={16} /> Cybersecurity red/blue labs
          </div>
          <div className="gain-skills-realworld-item">
            <Globe2 size={16} /> Networking simulations
          </div>
          <div className="gain-skills-realworld-item">
            <Code2 size={16} /> Open-source contributions
          </div>
          <div className="gain-skills-realworld-item">
            <Briefcase size={16} /> Company-sponsored challenges
          </div>
          <div className="gain-skills-realworld-item">
            <ShieldCheck size={16} /> Standardized skill assessments
          </div>
        </div>
      </section>

      {/* 🏆 Certification Roadmap: Build Your Certification Profile */}
      <section className="gain-skills-roadmap-section">
        <div className="gain-skills-roadmap-header">
          <h3>
            <Award size={20} className="text-amber-500" /> Build Your Certification Profile
          </h3>
          <p>
            Follow this verified six-step pathway to turn structured digital learning into career acceleration and employer trust.
          </p>
        </div>

        <div className="gain-skills-roadmap-track">
          {CERTIFICATION_ROADMAP.map((item) => (
            <div key={item.step} className="gain-skills-roadmap-node">
              <span className="gain-skills-node-step">STEP {item.step}</span>
              <div className="gain-skills-node-title">{item.title}</div>
              <div className="text-xs font-semibold text-amber-800 mb-1">{item.subtitle}</div>
              <div className="gain-skills-node-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  if (standalone) {
    return (
      <div className="gain-skills-standalone">
        <div className="mb-6">
          <span className="section-label">CONTINUOUS LEARNING &amp; CREDENTIALS</span>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap size={26} className="text-amber-500" /> Gain Skills &amp; Certificates
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Learn industry-ready skills, work on real projects, and earn certificates from leading global platforms.
          </p>
        </div>
        {content}
      </div>
    )
  }

  return (
    <div className="gain-skills-modal-backdrop" onClick={onClose}>
      <div
        className="gain-skills-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gain-skills-title"
      >
        {/* Modal Header */}
        <div className="gain-skills-modal-header">
          <div className="gain-skills-header-left">
            <div className="gain-skills-header-icon">
              <GraduationCap size={26} />
            </div>
            <div className="gain-skills-header-titles">
              <span className="section-label">AICP LEARNING ECOSYSTEM</span>
              <h2 id="gain-skills-title">Gain Skills &amp; Certificates</h2>
              <p>
                Learn industry-ready skills, work on real projects, and earn certificates from leading platforms.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              className="gain-skills-modal-close"
              onClick={onClose}
              aria-label="Close panel"
              title="Close panel (Esc)"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="gain-skills-modal-body">{content}</div>
      </div>
    </div>
  )
}
