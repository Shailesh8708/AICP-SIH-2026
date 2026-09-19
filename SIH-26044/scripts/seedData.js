#!/usr/bin/env node

import { connectDB, disconnectDB } from '../server/src/config/db.js'
import User from '../server/src/models/User.js'
import StudentProfile from '../server/src/models/StudentProfile.js'
import IndustryProfile from '../server/src/models/IndustryProfile.js'
import AcademicianProfile from '../server/src/models/AcademicianProfile.js'
import InstitutionProfile from '../server/src/models/InstitutionProfile.js'
import Skill from '../server/src/models/Skill.js'
import Opportunity from '../server/src/models/Opportunity.js'
import Assessment from '../server/src/models/Assessment.js'
import LearningProgram from '../server/src/models/LearningProgram.js'
import Collaboration from '../server/src/models/Collaboration.js'
import Application from '../server/src/models/Application.js'
import Portfolio from '../server/src/models/Portfolio.js'
import CareerProfile from '../server/src/models/CareerProfile.js'
import CareerSession from '../server/src/models/CareerSession.js'
import { seedDefaultSources } from '../server/src/services/opportunity/sourceManager.js'
import { ensureDefaultOfficialRadarOpportunities } from '../server/src/services/opportunity/seedOfficialRadar.js'

const password = 'AICP@2026'
const skillCatalog = [
  ['Python', 'Programming'], ['JavaScript', 'Programming'], ['Java', 'Programming'], ['C++', 'Programming'],
  ['React', 'Frontend'], ['Node.js', 'Backend'], ['Express', 'Backend'], ['MongoDB', 'Database'], ['SQL', 'Database'],
  ['Machine Learning', 'AI/ML'], ['Deep Learning', 'AI/ML'], ['NLP', 'AI/ML'], ['Data Analysis', 'Data'], ['Statistics', 'Data'],
  ['Excel', 'Data'], ['Power BI', 'Data'], ['Tableau', 'Data'], ['Cloud', 'Infrastructure'], ['AWS', 'Infrastructure'],
  ['Docker', 'Infrastructure'], ['Cybersecurity', 'Security'], ['IoT', 'Embedded'], ['Embedded Systems', 'Embedded'],
  ['Communication', 'Professional'], ['Leadership', 'Professional'], ['Teamwork', 'Professional'], ['Problem Solving', 'Professional'],
  ['Git', 'Tools'], ['REST APIs', 'Backend'], ['Data Visualization', 'Data'], ['Research', 'Academic'], ['Technical Writing', 'Academic'],
  ['Project Management', 'Professional'], ['UI Design', 'Design'], ['Testing', 'Engineering'],
]

const studentSeeds = [
  ['aarav.student@example.com', 'Aarav Mehta', ['Python', 'SQL', 'Excel', 'Data Analysis'], 'Computer Science', 8.4],
  ['maya.student@example.com', 'Maya Iyer', ['JavaScript', 'React', 'HTML', 'Git'], 'Computer Science', 8.7],
  ['rohan.student@example.com', 'Rohan Das', ['Node.js', 'Express', 'MongoDB', 'REST APIs'], 'Information Technology', 7.9],
  ['isha.student@example.com', 'Isha Nair', ['Python', 'Machine Learning', 'Statistics', 'Pandas'], 'Data Science', 9.1],
  ['kabir.student@example.com', 'Kabir Singh', ['C++', 'Embedded Systems', 'IoT', 'Problem Solving'], 'Electronics', 8.0],
  ['anaya.student@example.com', 'Anaya Rao', ['Cybersecurity', 'Python', 'Linux', 'Communication'], 'Cybersecurity', 8.5],
  ['vihaan.student@example.com', 'Vihaan Kapoor', ['Java', 'SQL', 'Git', 'Testing'], 'Computer Science', 7.8],
  ['tara.student@example.com', 'Tara Joseph', ['React', 'UI Design', 'JavaScript', 'Teamwork'], 'Information Technology', 8.2],
  ['dev.student@example.com', 'Dev Kulkarni', ['Python', 'NLP', 'Deep Learning', 'Research'], 'Artificial Intelligence', 8.9],
  ['sana.student@example.com', 'Sana Ali', ['Power BI', 'Tableau', 'Excel', 'Data Visualization'], 'Business Analytics', 8.3],
]

const industrySeeds = [
  ['northstar@example.com', 'Northstar Labs', 'Software and AI'],
  ['blueorbit@example.com', 'BlueOrbit Systems', 'Cloud Infrastructure'],
  ['civicdata@example.com', 'Civic Data Works', 'Public Technology'],
  ['pranahealth@example.com', 'Prana Digital Health', 'Healthcare Technology'],
  ['voltforge@example.com', 'VoltForge Innovations', 'IoT and Embedded Systems'],
]

const academicianSeeds = [
  ['neha.faculty@example.com', 'Dr. Neha Sharma', 'Computer Science', ['Machine Learning', 'Research']],
  ['daniel.faculty@example.com', 'Prof. Daniel Thomas', 'Electronics', ['IoT', 'Embedded Systems']],
  ['lina.faculty@example.com', 'Dr. Lina Joseph', 'Management', ['Project Management', 'Communication']],
]

const institutionSeeds = [
  ['aicp.university@example.com', 'AICP University', ['Computer Science', 'Electronics', 'Data Science']],
  ['central.institute@example.com', 'Central Skills Institute', ['Information Technology', 'Business Analytics']],
]

const questionSets = {
  python: [
    ['Which Python type is immutable?', ['List', 'Tuple', 'Dictionary', 'Set'], 1],
    ['Which keyword defines a function?', ['func', 'define', 'def', 'function'], 2],
    ['Which library is used for tabular data?', ['Pandas', 'Flask', 'Jest', 'Express'], 0],
  ],
  web: [
    ['Which library is used to build React interfaces?', ['React', 'MongoDB', 'Docker', 'Pytest'], 0],
    ['Which protocol is commonly used by REST APIs?', ['FTP', 'HTTP', 'SMTP', 'SSH'], 1],
    ['Which tool tracks source code changes?', ['Git', 'Excel', 'Figma', 'Power BI'], 0],
  ],
  data: [
    ['Which language is widely used for querying relational data?', ['SQL', 'CSS', 'HTML', 'Bash'], 0],
    ['What does KPI mean?', ['Key Performance Indicator', 'Known Python Index', 'Kernel Process Input', 'Key Program Interface'], 0],
    ['Which chart is useful for comparing categories?', ['Bar chart', 'Audio chart', 'Paragraph', 'File tree'], 0],
  ],
}

const makeQuestions = (set) => questionSets[set].map(([question, options, correctAnswer]) => ({ question, options, correctAnswer, explanation: 'This answer reflects the core skill being assessed.', difficulty: 'Medium' }))

const createUsers = async (seeds, role) => Promise.all(seeds.map(([email, name, ...rest]) => User.create({ email, name, role, password, skills: role === 'student' ? rest[0] : [], isActive: true })))

const seed = async () => {
  await connectDB()
  await Promise.all([
    User.deleteMany({}), StudentProfile.deleteMany({}), IndustryProfile.deleteMany({}), AcademicianProfile.deleteMany({}),
    InstitutionProfile.deleteMany({}), Skill.deleteMany({}), Opportunity.deleteMany({}), Assessment.deleteMany({}),
    LearningProgram.deleteMany({}), Collaboration.deleteMany({}), Application.deleteMany({}), Portfolio.deleteMany({}),
    CareerProfile.deleteMany({}), CareerSession.deleteMany({}),
  ])

  const skills = await Skill.insertMany(skillCatalog.map(([name, category]) => ({ name, normalizedName: name.toLowerCase(), category, levels: ['Beginner', 'Intermediate', 'Advanced'] })))
  const skillIds = Object.fromEntries(skills.map((skill) => [skill.name, skill._id]))
  const students = await createUsers(studentSeeds, 'student')
  const industries = await createUsers(industrySeeds, 'industry')
  const academicians = await createUsers(academicianSeeds, 'academician')
  const institutions = await createUsers(institutionSeeds, 'institution')

  await StudentProfile.insertMany(students.map((user, index) => ({ userId: user._id, college: index % 2 ? 'Central Skills Institute' : 'AICP University', department: studentSeeds[index][3], graduationYear: 2026, cgpa: studentSeeds[index][4], careerGoals: ['Build industry-ready skills'], interests: studentSeeds[index][2], bio: `Student profile for ${user.name}`, assessmentAttempts: index < 6 ? 1 : 0 })))
  await IndustryProfile.insertMany(industries.map((user, index) => ({ userId: user._id, companyName: industrySeeds[index][1], industry: industrySeeds[index][2], companySize: '51-200', headquarters: index % 2 ? 'Bengaluru' : 'Pune', description: `${industrySeeds[index][1]} creates practical opportunities for students.`, isVerified: true, verificationDate: new Date() })))
  await AcademicianProfile.insertMany(academicians.map((user, index) => ({ userId: user._id, institution: 'AICP University', department: academicianSeeds[index][2], designation: 'Faculty Lead', specialization: academicianSeeds[index][3], publications: ['Applied collaboration in education and industry'] })))
  await InstitutionProfile.insertMany(institutions.map((user, index) => ({ userId: user._id, institutionName: institutionSeeds[index][1], type: 'Higher Education', location: index ? 'Delhi' : 'Bengaluru', accreditation: 'NAAC', studentCount: 1200 + index * 350, facultyCount: 85 + index * 20, departments: institutionSeeds[index][2] })))

  const opportunitySeeds = [
    ['Python Data Analyst Intern', 'internship', industries[0], ['Python', 'SQL', 'Data Analysis'], ['Excel'], 18000],
    ['Frontend React Developer', 'internship', industries[0], ['JavaScript', 'React', 'Git'], ['UI Design'], 20000],
    ['Backend Node.js Engineer', 'job', industries[1], ['Node.js', 'Express', 'MongoDB'], ['Docker', 'REST APIs'], 850000],
    ['Cloud Operations Associate', 'job', industries[1], ['Cloud', 'AWS', 'Docker'], ['Linux', 'Git'], 700000],
    ['Civic Data Research Intern', 'internship', industries[2], ['Python', 'SQL', 'Research'], ['Data Visualization'], 15000],
    ['Healthcare ML Intern', 'internship', industries[3], ['Python', 'Machine Learning', 'Statistics'], ['NLP'], 22000],
    ['IoT Firmware Trainee', 'training', industries[4], ['IoT', 'Embedded Systems', 'C++'], ['Problem Solving'], 10000],
    ['Cybersecurity Analyst', 'job', industries[1], ['Cybersecurity', 'Python', 'Problem Solving'], ['Cloud'], 650000],
    ['Business Intelligence Intern', 'internship', industries[2], ['SQL', 'Power BI', 'Data Visualization'], ['Excel', 'Tableau'], 16000],
    ['Technical Product Intern', 'internship', industries[3], ['Communication', 'Project Management', 'Research'], ['SQL'], 14000],
  ]
  const opportunities = await Opportunity.insertMany(opportunitySeeds.map(([title, type, owner, requiredSkills, preferredSkills, stipend]) => ({ title, description: `${title} with guided work, mentor feedback, and a practical deliverable.`, type, location: 'Hybrid', duration: type === 'job' ? 'Full time' : '12 weeks', stipend, requiredSkills, preferredSkills, minGPA: 7, deadline: new Date('2026-12-15'), about: 'AICP seeded opportunity for local demonstration.', createdBy: owner._id, isPublished: true, status: 'open' })))

  await seedDefaultSources()
  await ensureDefaultOfficialRadarOpportunities()

  await Assessment.insertMany([
    { title: 'Python Fundamentals Mock Test', description: 'Industry screening test for Python opportunities.', type: 'technical', difficulty: 'Medium', duration: 20, passingScore: 67, skills: [skillIds.Python], questions: makeQuestions('python'), createdBy: industries[0]._id, isPublished: true },
    { title: 'Web Development Mock Test', description: 'Industry screening test for frontend and backend roles.', type: 'technical', difficulty: 'Medium', duration: 20, passingScore: 67, skills: [skillIds.JavaScript, skillIds.React], questions: makeQuestions('web'), createdBy: industries[1]._id, isPublished: true },
    { title: 'Data Analysis Mock Test', description: 'Screening test for analyst and BI opportunities.', type: 'skill_test', difficulty: 'Easy', duration: 20, passingScore: 67, skills: [skillIds.SQL, skillIds['Data Analysis']], questions: makeQuestions('data'), createdBy: industries[2]._id, isPublished: true },
  ])

  await LearningProgram.insertMany([
    ['SQL for Placement Readiness', 'Data foundations', ['SQL', 'Data Analysis'], academicians[0]._id],
    ['Practical Machine Learning', 'AI/ML', ['Python', 'Machine Learning', 'Statistics'], academicians[0]._id],
    ['Embedded Systems Studio', 'IoT', ['C++', 'Embedded Systems', 'IoT'], academicians[1]._id],
    ['Research Communication Lab', 'Professional', ['Research', 'Technical Writing', 'Communication'], academicians[2]._id],
  ].map(([title, category, coveredSkills, owner]) => ({ title, description: `${title} with guided lessons and an applied project.`, category, provider: 'AICP Faculty Network', level: 'Intermediate', duration: 8, skills: coveredSkills, certificateOffered: true, createdBy: owner, isPublished: true })))

  await Collaboration.insertMany([
    { initiatorId: academicians[0]._id, targetId: industries[3]._id, type: 'research', title: 'Clinical data research collaboration', description: 'Explore responsible ML for healthcare datasets.', status: 'pending' },
    { initiatorId: academicians[1]._id, targetId: industries[4]._id, type: 'training', title: 'Embedded systems industrial training', description: 'Coordinate a practical IoT training cohort.', status: 'accepted' },
    { initiatorId: academicians[2]._id, targetId: industries[2]._id, type: 'project', title: 'Civic technology consultancy', description: 'Faculty and industry collaboration on public data.', status: 'pending' },
  ])

  await Portfolio.insertMany(students.slice(0, 5).map((student, index) => ({ studentId: student._id, bio: `Portfolio of ${student.name}`, github: 'https://github.com/aicp-demo', projects: [{ title: index % 2 ? 'Campus Opportunity Portal' : 'Student Skill Analytics', description: 'A practical project demonstrating industry-ready work.', technologies: student.skills }] })))
  await Application.insertMany(students.slice(0, 8).map((student, index) => ({
    studentId: student._id,
    opportunityId: opportunities[index % opportunities.length]._id,
    applicant: {
      name: student.name,
      email: student.email,
      skills: student.skills || [],
    },
    resume: {
      fileName: `resume-${student._id}.pdf`,
      originalName: `${student.name.replace(/\s+/g, '_')}_Resume.pdf`,
      mimeType: 'application/pdf',
      size: 102400,
    },
    status: ['applied', 'shortlisted', 'interview', 'selected'][index % 4],
    coverLetter: 'I am interested in this opportunity and can demonstrate the listed skills.',
  })))

  // Seed demo CareerProfile records for the first 3 students
  const careerTargetRoles = [['Data Scientist', 'AI/ML Engineer'], ['Full Stack Developer', 'Frontend Developer'], ['AI/ML Engineer', 'Data Analyst']]
  await CareerProfile.insertMany(students.slice(0, 3).map((student, index) => ({
    userId: student._id,
    github: 'https://github.com/aicp-demo',
    linkedin: 'https://linkedin.com/in/aicp-demo',
    skillsByCategory: {
      programmingLanguages: studentSeeds[index][2].filter((s) => ['Python', 'JavaScript', 'Java', 'C++'].includes(s)),
      frameworks: studentSeeds[index][2].filter((s) => ['React', 'Express', 'Node.js'].includes(s)),
      databases: studentSeeds[index][2].filter((s) => ['MongoDB', 'SQL'].includes(s)),
      aiMl: studentSeeds[index][2].filter((s) => ['Machine Learning', 'Deep Learning', 'NLP'].includes(s)),
      tools: studentSeeds[index][2].filter((s) => ['Git', 'Docker'].includes(s)),
    },
    targetRoles: careerTargetRoles[index],
    projects: [{ name: index % 2 ? 'Campus Opportunity Portal' : 'Student Skill Analytics', problemStatement: 'Improve student placement outcomes using technology', solution: 'Built a full-stack web application', technologies: studentSeeds[index][2], contribution: 'Full individual project', teamSize: 1, duration: '4 weeks', impact: 'Demonstrated industry-relevant skills' }],
    interviewCompletedAt: new Date(),
    interviewVersion: 1,
    scores: { overall: 55 + index * 10, skills: 60 + index * 5, projects: 50 + index * 10, experience: 20, certifications: 10, github: 40, linkedin: 30, resume: 50, interviewReadiness: 45, internshipReadiness: 55 + index * 8, analyzedAt: new Date() },
    nextBestAction: 'Add more real-world projects to your GitHub and complete one certification in your target domain.',
  })))

  console.log(JSON.stringify({ accounts: students.length + industries.length + academicians.length + institutions.length, students: students.length, industries: industries.length, academicians: academicians.length, institutions: institutions.length, skills: skills.length, opportunities: opportunities.length, mockTests: 3, learningPrograms: 4, collaborations: 3, applications: 8, careerProfiles: 3, password }, null, 2))
  await disconnectDB()
}

seed().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`)
  await disconnectDB()
  process.exitCode = 1
})
