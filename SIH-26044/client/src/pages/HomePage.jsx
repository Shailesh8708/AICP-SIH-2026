import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Award, BarChart3, BookOpen, BrainCircuit, Briefcase,
  Building2, Check, ChevronRight, Database, FileCheck,
  FileSearch, FileText, Github, GraduationCap, Landmark, Layers3, Lightbulb,
  Linkedin, Lock, MapPin, MessageSquare, Network, Rocket,
  ShieldCheck, Sparkles, Star, TrendingUp, Users,
} from 'lucide-react'
import { Button } from '../components/common'
import { CountUp } from '../components/common/CountUp'
import { ROUTES } from '../utils/constants'
import { SoftwareTelemetryHUD } from '../components/SoftwareTelemetryHUD'
import { use3DTilt } from '../utils/use3DTilt'

const AI_FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI Mock Interview',
    description: 'Practice interactive AI interviews across technical, problem-solving, and behavioral domains with instant scoring, feedback, and model answers.',
    cta: 'Start Interview',
    tab: 'mock-interview',
    color: 'amber',
    badge: '⚡ Real-time Feedback',
  },
  {
    icon: BarChart3,
    title: 'Profile & Skill Scoring',
    description: 'Evaluate your technical readiness across verified GitHub repositories, projects, coursework, and credentials with AI insights.',
    cta: 'Scan Profile',
    tab: 'analyze',
    color: 'orange',
    badge: '🧠 Skill Analysis',
  },
  {
    icon: TrendingUp,
    title: 'Skill Gap & Roadmap',
    description: 'Discover the exact skills required for your target roles. Get structured 30/60/90-day learning roadmaps to bridge every knowledge gap.',
    cta: 'View Roadmap',
    tab: 'skill-gap',
    color: 'teal',
    badge: '🎯 Custom Roadmap',
  },
  {
    icon: FileText,
    title: 'ATS Resume Generator',
    description: 'Generate professionally formatted, ATS-optimized resumes engineered with high-impact keyword densities and proven achievement formats.',
    cta: 'Build Resume',
    tab: 'resume',
    color: 'amber',
    badge: '📄 High ATS Pass Rate',
  },
  {
    icon: Briefcase,
    title: 'Internship & Job Matching',
    description: 'Discover verified enterprise internships and entry-level positions matched to your profile, with clear breakdowns of your qualifications.',
    cta: 'Explore Matches',
    tab: 'internship-match',
    color: 'green',
    badge: '💼 Verified Matches',
  },
  {
    icon: Star,
    title: 'Career Pathway Advisor',
    description: 'Personalized career trajectory recommendations. AI evaluates your interests and code signals to map optimal pathways into high-growth tech roles.',
    cta: 'Explore Pathways',
    tab: 'career-rec',
    color: 'orange',
    badge: '✨ Career Guidance',
  },
  {
    icon: MessageSquare,
    title: 'Interactive Career Agent',
    description: 'Engage with an intelligent career conversational agent that learns your goals, projects, and aspirations to create your tailored career plan.',
    cta: 'Start Career Agent',
    tab: 'interview',
    color: 'rose',
    badge: '💬 Guided Dialogue',
  },
  {
    icon: Lightbulb,
    title: 'AI Project Recommender',
    description: 'Get tailored real-world project recommendations designed to bridge your skill gaps and build impressive portfolio proof for employers.',
    cta: 'Explore Projects',
    tab: 'projects',
    color: 'amber',
    badge: '💡 Hands-on Projects',
  },
  {
    icon: Github,
    title: 'GitHub Profile Analyzer',
    description: 'Evaluate your public repositories, code contributions, commit frequency, and documentation quality to strengthen your developer brand.',
    cta: 'Analyze GitHub',
    tab: 'github',
    color: 'teal',
    badge: '📊 Code Insights',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn Profile Optimizer',
    description: 'Optimize your headlines, summary, and experience descriptions with targeted keywords to stand out to recruiters and hiring managers.',
    cta: 'Optimize Profile',
    tab: 'linkedin',
    color: 'sky',
    badge: '👁️ Recruiter Visibility',
  },
  {
    icon: FileSearch,
    title: 'Job Description Analyzer',
    description: 'Paste any job posting to extract key required skills, evaluate your match score, and uncover specific areas to improve before applying.',
    cta: 'Analyze Job',
    tab: 'job-match',
    color: 'rose',
    badge: '🔍 Skill Breakdown',
  },
  {
    icon: GraduationCap,
    title: 'Gain Skills & Certificates',
    description: 'Explore 13+ verified learning platforms, cloud labs, and hands-on courses to bridge skill gaps and earn industry credentials.',
    cta: 'Explore Certificates',
    tab: 'gain-skills',
    color: 'emerald',
    badge: '🎓 Verified Badges',
  },
]

const SAMPLE_OPPORTUNITIES = [
  {
    id: 'sample-1',
    title: 'AI & Machine Learning Engineer Intern',
    company: 'Neural Labs India',
    location: 'Bengaluru · Hybrid',
    stipend: '₹40,000 / month',
    type: 'Internship',
    matchScore: '98%',
    skills: ['Python', 'PyTorch', 'FastAPI', 'LangChain', 'Data Science'],
    duration: '6 Months',
  },
  {
    id: 'sample-2',
    title: 'Cloud Infrastructure & DevOps Trainee',
    company: 'Apex Cloud Solutions',
    location: 'Hyderabad · Remote',
    stipend: '₹35,000 / month',
    type: 'Internship',
    matchScore: '94%',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
    duration: '3-6 Months',
  },
  {
    id: 'sample-3',
    title: 'Full Stack & Applied AI Developer Intern',
    company: 'Pulse Technologies',
    location: 'Pune · Remote',
    stipend: '₹38,000 / month',
    type: 'Internship',
    matchScore: '92%',
    skills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
    duration: '6 Months',
  },
  {
    id: 'sample-4',
    title: 'Data Analyst & Business Intelligence Intern',
    company: 'Optima Analytics',
    location: 'Gurgaon · On-site',
    stipend: '₹32,000 / month',
    type: 'Internship',
    matchScore: '95%',
    skills: ['Python', 'SQL', 'Tableau', 'Scikit-learn', 'Statistics'],
    duration: '4 Months',
  },
]

const PARTNERS = [
  { name: 'Leading R&D Labs', category: 'Research' },
  { name: 'Top Cloud Academy', category: 'Technology' },
  { name: 'Google Cloud Education', category: 'Cloud Partner' },
  { name: 'Microsoft Learn Lab', category: 'Enterprise' },
  { name: 'TCS Innovation Unit', category: 'Industry' },
  { name: 'National Technical Institutions', category: 'Academia' },
  { name: 'IIT Delhi AI Research', category: 'Academic R&D' },
  { name: 'Verified Tech Employers', category: 'Industry' },
]


export const HomePage = () => {
  const { cardRef: pipelineTiltRef, onMouseMove: onPipelineMouseMove, onMouseLeave: onPipelineMouseLeave } = use3DTilt(7, 1.015)

  const handleAIFeatureClick = (tab) => {
    sessionStorage.setItem('careerAgentTab', tab)
    window.location.href = ROUTES.CAREER_AGENT
  }

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll')
    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-page warm-landing-page" id="top">
      {/* ── Warm Ambient Backdrop ── */}
      <div className="warm-ambient-glow" aria-hidden="true" />

      {/* ── 1. Hero Section ── */}
      <section className="landing-hero warm-hero">
        {/* 3D Perspective Holographic Grid Floor Illusion */}
        <div className="cyber-grid-floor" aria-hidden="true" />

        <div className="hero-content warm-hero-content">
          <div className="eyebrow-badge warm-eyebrow hero-stagger-1 cyber-rose-badge">
            <span className="cyber-rose-beacon" />
            <Sparkles size={14} className="text-pink-500" />
            <span>AI-POWERED CAREER & TALENT MATCHING</span>
          </div>

          <h1 className="warm-hero-title hero-stagger-2">
            Unlock Your Potential.{' '}
            <span className="hero-highlight warm-highlight-text cyber-rose-gradient-text">Build Your Dream Career.</span>
          </h1>

          <p className="hero-lede warm-hero-sub hero-stagger-3">
            The intelligent career acceleration platform connecting academia, ambitious students, and leading employers. Build ATS-optimized resumes, practice AI mock interviews, close skill gaps, and discover verified internships and jobs.
          </p>

          <div className="hero-actions warm-hero-actions hero-stagger-4">
            <Link to={ROUTES.REGISTER}>
              <Button variant="nav" size="lg" className="hero-cta-primary warm-btn-primary">
                Get Started Free <ArrowRight size={18} />
              </Button>
            </Link>

            <button
              className="hero-cta-secondary warm-btn-outline"
              onClick={() => handleAIFeatureClick('mock-interview')}
            >
              <BrainCircuit size={17} className="text-amber-600" /> 🧠 Explore AI Tools
            </button>

            <Link to={ROUTES.OPPORTUNITIES}>
              <Button variant="outline" size="lg" className="hero-cta-ghost warm-btn-subtle">
                <Briefcase size={16} className="text-amber-600" /> View Opportunities
              </Button>
            </Link>
          </div>

          <div className="trust-row warm-trust-row hero-stagger-5">
            <span className="warm-trust-tag">
              <Lock size={14} className="text-amber-600" /> Secure Email OTP 2FA
            </span>
            <span className="warm-trust-tag">
              <ShieldCheck size={14} className="text-emerald-600" /> Verified Accounts
            </span>
            <span className="warm-trust-tag">
              <Sparkles size={14} className="text-amber-600" /> 12 Intelligent AI Tools
            </span>
          </div>

          {/* Software Engineering Live Diagnostics & Monospace Kernel Stream */}
          <SoftwareTelemetryHUD className="hero-stagger-5" />
        </div>

        {/* ── High-Visibility Pipeline Visualizer with 3D Tilt & Circuit Bus Pulse ── */}
        <div
          ref={pipelineTiltRef}
          onMouseMove={onPipelineMouseMove}
          onMouseLeave={onPipelineMouseLeave}
          className="pipeline-preview warm-pipeline-preview hero-stagger-preview tilt-card-3d cyber-hud-card circuit-bus-card"
          aria-label="AICP AI career pipeline preview"
        >
          <div className="preview-heading warm-preview-heading">
            <span className="live-status-pill warm-pill-live cyber-rose-badge">
              <span className="live-pulse cyber-rose-beacon" /> ✨ CAREER ACCELERATION PIPELINE
            </span>
            <span className="preview-mode warm-tag-active">AI Matching Active</span>
          </div>

          <div className="pipeline-track warm-pipeline-track">
            {[
              ['01', Database, 'SKILLS', 'GitHub, Projects & Profile', 'amber'],
              ['02', BrainCircuit, 'EVALUATE', 'AI Skill Analysis', 'orange'],
              ['03', Network, 'MATCH', 'Intelligent Fit Scoring', 'amber'],
              ['04', FileCheck, 'PREPARE', 'ATS Resume & Mock Prep', 'orange'],
              ['05', Rocket, 'CONNECT', 'Opportunity Applications', 'green'],
            ].map(([number, Icon, label, sub, colorTone], index) => (
              <div className={`pipeline-node warm-node warm-node-${colorTone} node-${index}`} key={number}>
                <span className="node-step warm-node-step">{number}</span>
                <div className="node-icon-shell warm-icon-shell">
                  <Icon size={22} />
                </div>
                <strong>{label}</strong>
                <small className="node-sub warm-node-sub">{sub}</small>
              </div>
            ))}
          </div>

          <div className="pipeline-stats-cards warm-stats-cards">
            <div className="accuracy-card warm-stat-card">
              <small className="warm-card-kicker">🎯 MATCH ACCURACY</small>
              <strong className="warm-stat-num"><CountUp value="98.4%" /> <em className="warm-positive-text">↗ High Fit</em></strong>
              <span className="warm-stat-detail">AI-powered skill matching algorithm</span>
            </div>
            <div className="accuracy-card secondary warm-stat-card warm-stat-card-alt">
              <small className="warm-card-kicker">💼 ACTIVE OPPORTUNITIES</small>
              <strong className="warm-stat-num"><CountUp value="15,000+" /> <em className="warm-status-badge">Verified</em></strong>
              <span className="warm-stat-detail">500+ Top Enterprises & Institutions</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Ecosystem Impact Stat Strip ──
      <section className="stat-strip warm-stat-strip reveal-on-scroll">
        <div className="stat-item warm-stat-item">
          <strong className="warm-num-amber"><CountUp value="10,000+" /></strong>
          <span>Active Students</span>
          <small className="stat-sub">180+ Universities & Colleges</small>
        </div>
        <div className="stat-sep warm-stat-sep" />
        <div className="stat-item warm-stat-item">
          <strong className="warm-num-terracotta"><CountUp value="500+" /></strong>
          <span>Partner Companies</span>
          <small className="stat-sub">Actively Hiring Talent</small>
        </div>
        <div className="stat-sep warm-stat-sep" />
        <div className="stat-item warm-stat-item">
          <strong className="warm-num-amber"><CountUp value="2,500+" /></strong>
          <span>Faculty Mentors</span>
          <small className="stat-sub">Guiding Next-Gen Careers</small>
        </div>
        <div className="stat-sep warm-stat-sep" />
        <div className="stat-item warm-stat-item">
          <strong className="warm-num-terracotta"><CountUp value="15,000+" /></strong>
          <span>Opportunities</span>
          <small className="stat-sub">Internships, Jobs & Projects</small>
        </div>
        <div className="stat-sep warm-stat-sep" />
        <div className="stat-item highlight warm-stat-item warm-stat-highlight">
          <strong className="warm-num-primary"><CountUp value="99.2%" /></strong>
          <span>Satisfaction Rate</span>
          <small className="stat-sub">Positive Student Outcomes</small>
        </div>
      </section> */}

      {/* ── 3. Partner / Recruiter Strip ── */}
      <section className="partner-section warm-partner-section reveal-on-scroll">
        <div className="section-label-center warm-label-center">
          <span>TRUSTED BY LEADING TECH, ACADEMIC & INDUSTRY PARTNERS</span>
        </div>
        <div className="partner-pills-wrap warm-pills-wrap">
          {PARTNERS.map((partner) => (
            <div className="partner-pill warm-partner-pill" key={partner.name}>
              <Building2 size={16} className="text-amber-600" />
              <span className="partner-name">{partner.name}</span>
              <span className="partner-tag warm-partner-tag">[{partner.category}]</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Platform Value Section ── */}
      <section className="section-block warm-value-section reveal-on-scroll" id="features">
        <div className="section-heading warm-section-heading">
          <span className="section-label warm-section-label">✨ THE AICP ADVANTAGE</span>
          <h2>Intelligent tools designed for <span>campus-to-career success.</span></h2>
          <p>
            Bridging the gap between classroom education and industry demands with intelligent career tools, verified profiles, and seamless opportunity matching.
          </p>
        </div>

        <div className="feature-grid warm-feature-grid">
          {[
            {
              icon: BrainCircuit,
              title: 'Objective Skill Evaluation',
              copy: 'Showcase real proof of your abilities with skill assessments, verified project contributions, and structured code evaluations.',
              action: 'Analyze Skills',
              tab: 'analyze',
              color: 'amber',
            },
            {
              icon: Network,
              title: 'Smart Job Matching',
              copy: 'Compare your profile against actual job descriptions to see match percentages and actionable recommendations to improve.',
              action: 'Check Matches',
              tab: 'job-match',
              color: 'orange',
            },
            {
              icon: FileText,
              title: 'ATS-Optimized Resumes',
              copy: 'Build clean, high-impact resumes tailored to the specific industry keywords and formatting recruiters look for.',
              action: 'Create Resume',
              tab: 'resume',
              color: 'amber',
            },
            {
              icon: ShieldCheck,
              title: 'Secure Authentication',
              copy: 'Reliable security with NodeMailer OTP email verification, protected user accounts, and role-based permissions.',
              action: 'Learn More',
              tab: 'mock-interview',
              color: 'green',
            },
          ].map(({ icon: Icon, title, copy, action, tab, color }) => (
            <article className={`feature-item warm-feature-item warm-border-${color} tilt-card-3d cyber-hud-card`} key={title}>
              <div className={`feature-icon warm-feature-icon tone-${color}`}>
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <button
                className="feature-link-btn warm-feature-link"
                onClick={() => handleAIFeatureClick(tab)}
              >
                {action} <ChevronRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ── 5. Featured Live Opportunities ── */}
      <section className="section-block opportunities-preview-block warm-opps-block reveal-on-scroll" id="opportunities">
        <div className="section-heading-split warm-heading-split">
          <div>
            <span className="section-label warm-section-label">💼 FEATURED OPPORTUNITIES</span>
            <h2>Top internships & <span>career roles.</span></h2>
            <p>Direct from verified employers and leading companies. Matched to your skills and career interests.</p>
          </div>
          <Link to={ROUTES.OPPORTUNITIES}>
            <Button variant="nav" size="md" className="warm-btn-primary">
              Explore All Opportunities <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        <div className="opportunities-preview-grid warm-opps-grid">
          {SAMPLE_OPPORTUNITIES.map((opp) => (
            <article className="opp-preview-card warm-opp-card" key={opp.id}>
              <div className="opp-card-header">
                <div className="opp-avatar warm-opp-avatar">
                  <Building2 size={20} />
                </div>
                <div className="opp-meta">
                  <span className="opp-type-badge warm-type-badge">{opp.type}</span>
                  <span className="opp-match-pill warm-match-pill">{opp.matchScore} Match</span>
                </div>
              </div>

              <h3>{opp.title}</h3>
              <p className="opp-company-line warm-company-line">{opp.company}</p>

              <div className="opp-card-details warm-card-details">
                <span><MapPin size={13} /> {opp.location}</span>
                <span className="warm-stipend-glow"><Award size={13} /> {opp.stipend}</span>
              </div>

              <div className="opp-skills-list warm-skills-list">
                {opp.skills.map((s) => (
                  <span key={s} className="opp-skill-tag warm-skill-tag">{s}</span>
                ))}
              </div>

              <div className="opp-card-foot warm-card-foot">
                <span className="opp-duration warm-duration">⏱️ {opp.duration}</span>
                <Link to={ROUTES.OPPORTUNITIES} className="opp-apply-link warm-apply-link">
                  View & Apply <ArrowUpRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── 6. AI Features Hub ── */}
      <section className="section-block ai-hub-section warm-ai-hub reveal-on-scroll" id="ai-features">
        <div className="section-heading warm-section-heading">
          <span className="section-label warm-section-label">🧠 AI CAREER SUITE // 12 MODULES</span>
          <h2>Every intelligent career tool, <span>in one unified workspace.</span></h2>
          <p>
            Comprehensive AI tools designed to evaluate skills, practice realistic interviews, build ATS resumes, and accelerate your career.
          </p>
        </div>

        <div className="ai-features-grid warm-ai-grid">
          {AI_FEATURES.map(({ icon: Icon, title, description, cta, tab, color, badge }) => (
            <article key={title} className={`ai-feature-card warm-ai-card ai-feature-${color}`}>
              <div className="ai-card-top">
                <div className="ai-feature-icon warm-ai-icon">
                  <Icon size={22} />
                </div>
                <span className="ai-badge-chip warm-badge-chip">{badge}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <button
                className="ai-feature-cta warm-feature-cta"
                onClick={() => handleAIFeatureClick(tab)}
              >
                {cta} <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>

        <div className="ai-hub-cta warm-hub-cta">
          <Link to={ROUTES.CAREER_AGENT}>
            <Button variant="nav" size="lg" className="launch-agent-btn warm-btn-primary">
              <Sparkles size={18} /> Launch Full AI Career Agent
            </Button>
          </Link>
          <p className="ai-hub-note warm-hub-note">
            Free and available immediately inside your student workspace upon sign-in.
          </p>
        </div>
      </section>

      {/* ── 7. How It Works ── */}
      <section className="pipeline-section warm-pipeline-section reveal-on-scroll" id="pipeline">
        <div className="section-heading left warm-heading-left">
          <span className="section-label warm-section-label">⚡ 5-STEP CAREER ROADMAP</span>
          <h2>Your career trajectory, <span>accelerated step-by-step.</span></h2>
          <p>Every milestone is transparent, guided by AI, and designed to help you land your ideal role.</p>
        </div>

        <div className="journey warm-journey">
          {[
            ['01', 'Build Profile', 'Add coursework, GitHub repositories, projects, and skills to create a strong foundation.', Database],
            ['02', 'Skill Assessment', 'Analyze your strengths, practice AI mock interviews, and identify specific areas for growth.', Layers3],
            ['03', 'Close Skill Gaps', 'Follow tailored 30/60/90-day roadmaps and project recommendations to acquire high-demand skills.', BookOpen],
            ['04', 'Discover Matches', 'Get matched with verified internships and job opportunities aligned with your career goals.', Network],
            ['05', 'Apply & Succeed', 'Submit ATS-optimized applications, track status in real-time, and interview with confidence.', BarChart3],
          ].map(([n, title, copy, Icon]) => (
            <div className="journey-step warm-journey-step" key={n}>
              <span className="step-number warm-step-number">{n}</span>
              <div className="step-icon-box warm-step-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. Ecosystem Roles ── */}
      <section className="section-block roles-section warm-roles-section reveal-on-scroll" id="roles">
        <div className="section-heading warm-section-heading">
          <span className="section-label warm-section-label">👥 TAILORED FOR EVERY USER</span>
          <h2>Dedicated workspaces for <span>every stakeholder.</span></h2>
          <p>AICP connects students, employers, faculty mentors, and institutional leadership on a single platform.</p>
        </div>

        <div className="role-grid warm-role-grid">
          {[
            {
              icon: GraduationCap,
              title: 'Students & Job Seekers',
              color: 'amber',
              tier: 'FOR LEARNERS',
              copy: 'Turn coursework and coding projects into proven skills, clear direction, and high-impact internships.',
              items: ['AI Mock Interviews & Instant Feedback', 'ATS Resume Generator', 'Personalized Skill Gap Roadmaps', 'Curated Opportunity Matches'],
              roleType: 'student',
            },
            {
              icon: Landmark,
              title: 'Employers & Recruiters',
              color: 'orange',
              tier: 'FOR RECRUITERS',
              copy: 'Hire job-ready candidates faster with objective skill matches and verified candidate profiles.',
              items: ['Post Internships & Jobs with Auto-Expiry', 'Intelligent Candidate Match Scoring', 'Custom Question Banks', 'Application Pipeline Management'],
              roleType: 'industry',
            },
            {
              icon: Users,
              title: 'Faculty & Mentors',
              color: 'teal',
              tier: 'FOR EDUCATORS',
              copy: 'Align academic curriculum with real industry demands and foster impactful mentorship and research.',
              items: ['Industry Collaborations & Projects', 'Student Mentorship & Guidance', 'Curriculum Readiness Insights', 'Cohort Progress Tracking'],
              roleType: 'academician',
            },
            {
              icon: BarChart3,
              title: 'Institutions & Universities',
              color: 'amber',
              tier: 'FOR INSTITUTIONS',
              copy: 'Gain comprehensive visibility into student placement readiness, industry partnerships, and campus outcomes.',
              items: ['Campus Skill Gap Analytics', 'Placement Pipeline Tracking', 'Institutional Outcome Reports', 'Industry Partnership Network'],
              roleType: 'institution',
            },
          ].map(({ icon: Icon, title, color, tier, copy, items }) => (
            <article className={`role-card warm-role-card role-${color}`} key={title}>
              <div className="role-top">
                <div className="role-icon warm-role-icon">
                  <Icon size={22} />
                </div>
                <span className="role-explore-badge warm-tier-badge">{tier}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <ul>
                {items.map((item) => (
                  <li key={item}>
                    <Check size={14} className="text-amber-600" /> {item}
                  </li>
                ))}
              </ul>
              <Link to={ROUTES.REGISTER} className="role-card-link warm-role-link">
                Get Started as {title.split(' ')[0]} <ArrowRight size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── 9. Tech Architecture & Stack ── */}
      <section className="stack-section warm-stack-section reveal-on-scroll" id="stack">
        <div className="stack-copy warm-stack-copy">
          <span className="section-label warm-section-label">💻 RELIABLE & SECURE ARCHITECTURE</span>
          <h2>Modern, high-performance stack built for <span>scale and trust.</span></h2>
          <p>
            Engineered with a modern React frontend, reliable Node.js/Express backend, MongoDB persistence, secure NodeMailer OTP two-factor authentication, and intelligent matching services.
          </p>
          <div className="stack-highlights warm-stack-highlights">
            <div className="stack-chip warm-stack-chip"><span>CORE</span> React 18 · Express · Node · MongoDB</div>
            <div className="stack-chip warm-stack-chip"><span>AI MATCHING</span> Vector Similarity · Semantic NLP · Python Microservice</div>
            <div className="stack-chip warm-stack-chip"><span>SECURITY</span> Email OTP 2FA · Secure Sessions · Role-Based Access</div>
          </div>
          <Link to={ROUTES.LOGIN} className="text-action stack-cta warm-stack-cta">
            Sign in to your account <ArrowRight size={17} />
          </Link>
        </div>

        <div className="stack-orbit warm-stack-orbit-center ">
          <div className="orbit-center warm-orbit-center">
            <BrainCircuit size={32} />
            <strong>AICP PLATFORM</strong>
            <small>INTELLIGENT SUITE</small>
          </div>
          {[
            ['MERN', Database, 'Full-Stack Architecture'],
            ['AI/ML', BrainCircuit, 'Intelligent Match Engine'],
            ['SECURE', ShieldCheck, 'Email OTP Authentication'],
            ['VECTOR', BarChart3, 'Smart Semantic Matching'],
          ].map(([label, Icon, desc], index) => (
            <div className={`orbit-node warm-orbit-node orbit-${index}`} key={label}>
              <Icon size={18} />
              <div className="orbit-node-text">
                <strong>{label}</strong>
                <small>{desc}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      

      {/* ── 11. Final Call to Action ── */}
      <section className="final-cta-section warm-final-section reveal-on-scroll">
        <div className="final-cta-card warm-final-card">
          <span className="final-cta-kicker warm-final-kicker">✨ ACCELERATE YOUR JOURNEY</span>
          <h2 className="warm-final-title">Ready to discover opportunities or recruit top campus talent?</h2>
          <p className="warm-final-sub">
            Join thousands of motivated students, top employers, and academic mentors on the AICP platform today.
          </p>

          <div className="final-cta-buttons warm-final-buttons">
            <Link to={ROUTES.REGISTER}>
              <Button variant="nav" size="lg" className="final-primary-btn warm-btn-primary">
                Register Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" size="lg" className="final-secondary-btn warm-btn-outline">
                Sign In to Account
              </Button>
            </Link>
          </div>

          <div className="final-trust-checks warm-trust-checks">
            <span><Check size={14} className="text-emerald-600" /> 100% Free for Students</span>
            <span><Check size={14} className="text-emerald-600" /> Secure Email OTP 2FA</span>
            <span><Check size={14} className="text-emerald-600" /> Immediate Access to AI Tools</span>
          </div>
        </div>
      </section>
    </div>
  )
}

