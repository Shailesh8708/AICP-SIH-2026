/**
 * Robot Feature Guide Data & Script Catalog
 * Powers the interactive voice/text AI Feature Guide around the 3D Chatbot Companion.
 */

export const ROBOT_GUIDE_STEPS = [
  {
    id: 'intro',
    isIntro: true,
    category: 'AI CAREER COMPANION',
    name: 'Welcome to AICP',
    icon: 'Sparkles',
    route: '/career-agent',
    shortDescription:
      'Your AI career assistant for personalized planning, skill improvement, resume optimization, and job discovery.',
    narration:
      'Hello everyone! Welcome to our AI-powered career development platform. I am your AI career assistant, and I am here to help you explore the powerful tools available in this platform. We empower you with personalized career planning, skill improvement, resume optimization, interview preparation, internship and job discovery, and tailored career development. Let us explore each tool together!',
  },
  {
    id: 'dashboard',
    stepNumber: 1,
    category: 'AI FEATURE',
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    route: '/career-agent?tab=dashboard',
    shortDescription:
      'Centralized command center. Track your progress, recent activities, recommendations, and essential career updates.',
    narration:
      'First is the Dashboard. It gives you a centralized overview of your career progress, recent activities, smart recommendations, and important platform updates in one view.',
  },
  {
    id: 'ai-interview',
    stepNumber: 2,
    category: 'AI FEATURE',
    name: 'AI Interview',
    icon: 'BrainCircuit',
    route: '/career-agent?tab=interview',
    shortDescription:
      'Practice interactive interviews with AI feedback, instant scoring, and suggested model answers to elevate performance.',
    narration:
      'Next is AI Interview. Practice interactive technical, behavioral, and problem-solving interviews with real-time scoring and model answers to elevate your performance.',
  },
  {
    id: 'my-profile',
    stepNumber: 3,
    category: 'AI FEATURE',
    name: 'My Profile',
    icon: 'User',
    route: '/career-agent?tab=profile-editor',
    shortDescription:
      'Maintain and manage your comprehensive professional profile, education credentials, skills, and portfolio evidence.',
    narration:
      'In My Profile, you can maintain and manage your comprehensive professional identity, academic credentials, verified skills, and project portfolio.',
  },
  {
    id: 'profile-score',
    stepNumber: 4,
    category: 'AI FEATURE',
    name: 'Profile Score',
    icon: 'BarChart3',
    route: '/career-agent?tab=analyze',
    shortDescription:
      'Evaluates technical readiness and verified signals with an AI score and actionable improvement recommendations.',
    narration:
      'Profile Score objectively evaluates your technical readiness, verified projects, and credentials, giving you an AI score with tailored improvement suggestions.',
  },
  {
    id: 'career-paths',
    stepNumber: 5,
    category: 'AI FEATURE',
    name: 'Career Paths',
    icon: 'Compass',
    route: '/career-agent?tab=career-rec',
    shortDescription:
      'Explore personalized career trajectories and high-growth tech roles mapped to your unique skills and aspirations.',
    narration:
      'Career Paths maps out high-growth technology roles and optimal trajectories aligned with your unique skill profile, strengths, and career ambitions.',
  },
  {
    id: 'skill-gap',
    stepNumber: 6,
    category: 'AI FEATURE',
    name: 'Skill Gap',
    icon: 'TrendingUp',
    route: '/career-agent?tab=skill-gap',
    shortDescription:
      'Pinpoints missing or weak skills for target roles and generates structured 30, 60, and 90-day learning roadmaps.',
    narration:
      'The Skill Gap engine identifies missing or weak skills required for your target job roles, generating structured 30, 60, and 90-day roadmaps to bridge every gap.',
  },
  {
    id: 'internship-match',
    stepNumber: 7,
    category: 'AI FEATURE',
    name: 'Internship Match',
    icon: 'Briefcase',
    route: '/career-agent?tab=internship-match',
    shortDescription:
      'Discovers verified enterprise internships and entry-level positions matched to your skills, interests, and profile.',
    narration:
      'Internship Match discovers verified enterprise internships and junior positions matched to your skills and qualifications with transparent compatibility scores.',
  },
  {
    id: 'jd-analyser',
    stepNumber: 8,
    category: 'AI FEATURE',
    name: 'JD Analyser',
    icon: 'FileSearch',
    route: '/career-agent?tab=job-match',
    shortDescription:
      'Analyzes Job Descriptions to highlight critical requirements, required tech stacks, and high-impact ATS keywords.',
    narration:
      'With JD Analyser, paste any job description to instantly uncover critical requirements, expected tech stacks, and high-impact ATS keywords.',
  },
  {
    id: 'ats-resume',
    stepNumber: 9,
    category: 'AI FEATURE',
    name: 'ATS Resume',
    icon: 'FileText',
    route: '/career-agent?tab=resume',
    shortDescription:
      'Generates professionally formatted, ATS-optimized resumes engineered for maximum pass rates and 1-click PDF download.',
    narration:
      'ATS Resume creates professionally formatted, ATS-optimized resumes engineered with high-impact keyword densities for maximum recruiter screening pass rates.',
  },
  {
    id: 'multi-resume',
    stepNumber: 10,
    category: 'AI FEATURE',
    name: 'Multi Resume',
    icon: 'Layers3',
    route: '/career-agent?tab=multi-resume',
    shortDescription:
      'Create and manage multiple targeted resumes from a library of 320 designs customized for different company roles.',
    narration:
      'Multi Resume allows you to create and manage multiple targeted resumes from our catalog of 320 professional designs, tailored for diverse job applications.',
  },
  {
    id: 'project-ideas',
    stepNumber: 11,
    category: 'AI FEATURE',
    name: 'Project Ideas',
    icon: 'Lightbulb',
    route: '/career-agent?tab=projects',
    shortDescription:
      'Curates tailored real-world project recommendations to build practical proof of skill and strengthen your portfolio.',
    narration:
      'Project Ideas provides hand-picked, industry-grade project recommendations that bridge your specific skill gaps and provide tangible proof for employers.',
  },
  {
    id: 'roadmap',
    stepNumber: 12,
    category: 'AI FEATURE',
    name: 'Roadmap',
    icon: 'Target',
    route: '/career-agent?tab=roadmap',
    shortDescription:
      'Structured step-by-step milestones and learning tracks guiding what to study and build to achieve your career goal.',
    narration:
      'The Roadmap provides a structured milestone journey, showing you exactly what to learn, practice, and build step by step toward your target career.',
  },
  {
    id: 'mock-interview',
    stepNumber: 13,
    category: 'AI FEATURE',
    name: 'Mock Interview',
    icon: 'MessageSquare',
    route: '/career-agent?tab=mock-interview',
    shortDescription:
      'Simulate realistic interview scenarios across technical and HR tracks to sharpen communication and build confidence.',
    narration:
      'Mock Interview offers realistic simulated interview drills to test your subject depth, sharpen communication skills, and build real-world interview confidence.',
  },
  {
    id: 'gain-skills',
    stepNumber: 14,
    category: 'AI FEATURE',
    name: 'Gain Skills And Certificates',
    icon: 'Award',
    route: '/career-agent?tab=gain-skills',
    shortDescription:
      'Explore accredited certifications and skill courses from Google, IBM, Microsoft, NVIDIA, AWS, and TCS with direct links.',
    narration:
      'Gain Skills and Certificates connects you directly with official accredited courses and certifications from global industry leaders like Google, IBM, and Microsoft.',
  },
  {
    id: 'github',
    stepNumber: 15,
    category: 'AI FEATURE',
    name: 'GitHub',
    icon: 'Github',
    route: '/career-agent?tab=github',
    shortDescription:
      'Audits your public repositories, code contributions, and commit activity to build strong developer proof.',
    narration:
      'Our GitHub analyzer audits your repositories, code commits, and contribution consistency to showcase verified proof of work to hiring managers.',
  },
  {
    id: 'linkedin',
    stepNumber: 16,
    category: 'AI FEATURE',
    name: 'LinkedIn',
    icon: 'Linkedin',
    route: '/career-agent?tab=linkedin',
    shortDescription:
      'Optimizes your headline, bio, and achievements to enhance your professional visibility to recruiters.',
    narration:
      'The LinkedIn assistant optimizes your profile headline, summary, and experience achievements to strengthen your personal developer brand.',
  },
  {
    id: 'opportunities-radar',
    stepNumber: 17,
    category: 'PLATFORM RADAR',
    name: 'Opportunities — Career Radar',
    icon: 'Radio',
    route: '/opportunities',
    shortDescription:
      'Multi-Company Career Radar. Discover verified career openings across top companies with direct application links.',
    narration:
      'Now let us look at Opportunities, our Multi-Company Career Radar. It centralizes verified openings from top companies with direct application form links, so you never have to search individual career portals.',
  },
  {
    id: 'application-tracker',
    stepNumber: 18,
    category: 'ORGANIZATION TOOL',
    name: 'Application Tracker',
    icon: 'ClipboardCheck',
    route: '/applications',
    shortDescription:
      'Track all internship and job applications in one place, monitoring status and upcoming milestones to stay organized.',
    narration:
      'And the Application Tracker. It organizes all your internship and job applications in one place, helping you track interview stages and deadlines effortlessly.',
  },
  {
    id: 'closing',
    isClosing: true,
    category: 'READY TO GROW',
    name: 'Ready to Accelerate Your Career',
    icon: 'CheckCircle2',
    route: '/career-agent',
    shortDescription:
      'You are all set! Click any tool in your workspace to begin accelerating your career journey.',
    narration:
      'You are all set! Explore any tool in your workspace or ask me questions anytime. Together, let us accelerate your career journey to success!',
  },
]

export const TOTAL_EXPLAINED_FEATURES = 18
