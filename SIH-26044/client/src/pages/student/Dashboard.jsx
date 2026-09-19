import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, FileText, ClipboardCheck, ArrowUpRight, GraduationCap, Compass } from 'lucide-react'
import { Button } from '../../components/common'
import { ApplicationTracker } from '../../components/ApplicationTracker'
import { GainSkillsCard } from '../../components/GainSkillsCard'
import { HeroCompanionShowcase } from '../../components/HeroCompanionShowcase'
import { DailyQuizDashboardCard } from '../../components/DailyQuiz'
import { applicationAPI } from '../../services/api'
import { ROUTES } from '../../utils/constants'

export const StudentDashboard = ({ user }) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    applicationAPI
      .getApplications({ limit: 10 })
      .then((res) => {
        if (!mounted) return
        const data = res?.data || {}
        const list = Array.isArray(data) ? data : data.items || []
        setApplications(list)
      })
      .catch(() => {
        if (!mounted) return
        setError('Unable to load live applications.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const coreModules = [
    {
      title: 'AI Career Agent',
      badge: 'AI Copilot',
      description:
        'Interactive career interview, personalized skill gap analysis, and tailored career pathways.',
      icon: Sparkles,
      link: ROUTES.CAREER_AGENT,
      cta: 'Launch Career Agent',
      variant: 'primary',
    },
    {
      title: 'Opportunities',
      badge: 'Opportunity Radar',
      description:
        'Discover official internships and jobs from 60+ verified companies matched directly to your skills.',
      icon: Compass,
      link: ROUTES.OPPORTUNITIES,
      cta: 'Explore Opportunities',
      variant: 'secondary',
    },
    {
      title: 'Resume Maker',
      badge: 'ATS Optimized',
      description:
        'Create high-impact, ATS-friendly resumes tailored to job descriptions and target roles.',
      icon: FileText,
      link: '/resume',
      cta: 'Open Resume Maker',
      variant: 'secondary',
    },
    {
      title: 'Application Tracker',
      badge: 'Live Status',
      description:
        'Monitor your submitted applications, interview stages, and feedback from employers.',
      icon: ClipboardCheck,
      link: ROUTES.APPLICATIONS,
      cta: 'View Applications',
      variant: 'secondary',
    },
  ]

  return (
    <div className="student-dashboard-clean warm-dashboard">
      {/* Top Welcome Banner */}
      <div className="student-hero-banner">
        <div className="banner-text">
          <div className="banner-pill cyber-rose-badge">
            <span className="cyber-rose-beacon" />
            <GraduationCap size={16} />
            <span>Student Workspace</span>
          </div>
          <h1>
            Welcome, <span className="cyber-rose-gradient-text">{user?.name || 'Student'}</span>
          </h1>
          <p>
            Your central workspace for AI career guidance, resume building, and application tracking.
          </p>
        </div>

        {/* Interactive 3D Companion Video from Pinterest in Top-Right Space */}
        <HeroCompanionShowcase />
      </div>

      {/* Featured: Daily Quiz & Streak Card */}
      <section className="student-daily-quiz-banner mb-6">
        <DailyQuizDashboardCard
          user={user}
          onOpenQuiz={() => {
            const btn = document.querySelector('.daily-quiz-trigger-btn')
            if (btn) btn.click()
          }}
        />
      </section>

      {/* Featured: Gain Skills & Certificates Card */}
      <section className="student-gain-skills-banner mb-6">
        <GainSkillsCard />
      </section>

      {/* Core Modules */}
      <div className="student-core-grid">
        {coreModules.map((mod) => {
          const Icon = mod.icon
          return (
            <article key={mod.title} className="student-core-card tilt-card-3d cyber-hud-card">
              <div className="core-card-header">
                <div className="core-card-icon">
                  <Icon size={22} />
                </div>
                <span className="core-card-badge">{mod.badge}</span>
              </div>
              <h3>{mod.title}</h3>
              <p>{mod.description}</p>
              <div className="core-card-footer">
                <Link to={mod.link}>
                  <Button
                    variant={mod.variant === 'primary' ? 'nav' : 'outline'}
                    size="sm"
                    className="core-card-btn"
                  >
                    {mod.cta} <ArrowUpRight size={14} />
                  </Button>
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      {/* Embedded Live Application Tracker Section */}
      <section className="student-tracker-section">
        <div className="section-header-clean">
          <div>
            <span className="clean-section-tag">REAL-TIME TRACKING</span>
            <h2>Application Tracker</h2>
            <p>Direct updates on the opportunities you have applied to.</p>
          </div>
          <Link to={ROUTES.APPLICATIONS}>
            <Button variant="outline" size="sm">
              View All Applications <ArrowUpRight size={14} />
            </Button>
          </Link>
        </div>

        <div className="student-tracker-container">
          <ApplicationTracker
            applications={applications}
            loading={loading}
            error={error}
          />
        </div>
      </section>
    </div>
  )
}