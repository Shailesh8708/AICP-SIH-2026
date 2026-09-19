import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CAREER_TABS } from './career/careerTabs'
import { CareerDashboard } from './career/CareerDashboard'
import { AIInterview } from './career/AIInterview'
import { ProfileAnalyzer } from './career/ProfileAnalyzer'
import { CareerRecommendations } from './career/CareerRecommendations'
import { SkillGapRoadmap } from './career/SkillGapRoadmap'
import { InternshipMatcher } from './career/InternshipMatcher'
import { JobDescAnalyzer } from './career/JobDescAnalyzer'
import { ATSResumeGenerator } from './career/ATSResumeGenerator'
import { MultipleResumes } from './career/MultipleResumes'
import { MockInterview } from './career/MockInterview'
import { ProjectRecommender } from './career/ProjectRecommender'
import { GitHubAnalyzer } from './career/GitHubAnalyzer'
import { LinkedInAssistant } from './career/LinkedInAssistant'
import { CareerProfileEditor } from './career/CareerProfileEditor'
import { GainSkillsPanel } from '../../components/GainSkillsPanel'

export const CareerAgent = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam && CAREER_TABS.some((t) => t.id === tabParam)) {
      return tabParam
    }
    const savedTab = sessionStorage.getItem('careerAgentTab')
    if (savedTab) {
      sessionStorage.removeItem('careerAgentTab')
      return savedTab
    }
    return 'dashboard'
  })

  // Sync state whenever the URL search param changes (e.g. from sidebar clicks)
  useEffect(() => {
    if (tabParam && CAREER_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const navigate = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Listen for navigation events from sub-components
  useEffect(() => {
    const handler = (e) => navigate(e.detail)
    window.addEventListener('career-navigate', handler)
    return () => window.removeEventListener('career-navigate', handler)
  }, [])

  const currentTab = CAREER_TABS.find((t) => t.id === activeTab) || CAREER_TABS[0]
  const CurrentIcon = currentTab.icon

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':        return <CareerDashboard onNavigate={navigate} />
      case 'interview':        return <AIInterview onComplete={() => navigate('profile-editor')} />
      case 'profile-editor':   return <CareerProfileEditor />
      case 'analyze':          return <ProfileAnalyzer />
      case 'career-rec':       return <CareerRecommendations />
      case 'skill-gap':        return <SkillGapRoadmap />
      case 'internship-match': return <InternshipMatcher />
      case 'job-match':        return <JobDescAnalyzer />
      case 'resume':           return <ATSResumeGenerator />
      case 'multi-resume':     return <MultipleResumes />
      case 'projects':         return <ProjectRecommender />
      case 'roadmap':          return <SkillGapRoadmap initialTab="roadmap" />
      case 'mock-interview':   return <MockInterview />
      case 'gain-skills':      return <GainSkillsPanel standalone={true} />
      case 'github':           return <GitHubAnalyzer />
      case 'linkedin':         return <LinkedInAssistant />
      default:                 return <CareerDashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="career-agent-shell">
      {/* Page header */}
      <div className="career-agent-header">
        <div>
          <span className="section-label">AI CAREER &amp; RESUME AGENT</span>
          <h1>Your intelligent career co-pilot</h1>
          <p>From profile to placement — AI-powered interview, resume generation, skill gap analysis, internship matching, and mock interviews in one place.</p>
        </div>
      </div>

      {/* Active Module Indicator Banner */}
      <div className="career-active-banner">
        <div className="active-banner-pill">
          {CurrentIcon && <CurrentIcon size={16} />}
          <span>Active Module: <strong>{currentTab.label}</strong></span>
        </div>
        <span className="active-banner-hint">
          All 16 tools are accessible on the left sidebar under <strong>AI Career Agent</strong>.
        </span>
      </div>

      {/* Tab content */}
      <div className="career-tab-content">
        {renderTab()}
      </div>
    </div>
  )
}
