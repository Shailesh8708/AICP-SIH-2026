# AICP-SIH-2026
# 🚀 AICP — Academia–Industry Collaboration Portal

<p align="center">
  <img src="https://img.shields.io/badge/AICP-Academia%20%7C%20Industry%20%7C%20Students-6C63FF?style=for-the-badge" alt="AICP">
  <img src="https://img.shields.io/badge/SIH-2026-orange?style=for-the-badge" alt="SIH 2026">
  <img src="https://img.shields.io/badge/Problem%20Statement-26044-red?style=for-the-badge" alt="Problem Statement">
</p>

<p align="center">
  <strong>🌐 A unified AI-powered ecosystem connecting Academia, Industry, Students, and Institutions.</strong>
</p>

<p align="center">
  <em>Bridging the gap between academic learning and real-world industry requirements through intelligent collaboration, skill development, opportunity discovery, and AI-driven career assistance.</em>
</p>

<p align="center">
  <a href="#-about-the-project">About</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-technology-stack">Tech Stack</a> •
  <a href="#-installation--setup">Installation</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-api-overview">API</a> •
  <a href="#-future-enhancements">Future</a>
</p>

---

## 🏆 Smart India Hackathon 2026

**AICP — Academia–Industry Collaboration Portal** is developed for **Smart India Hackathon (SIH) 2026 – Problem Statement 26044**.

The project aims to create a centralized digital platform that facilitates meaningful collaboration between:

🎓 **Students**
🏢 **Industry Professionals & Organizations**
👨‍🏫 **Academicians**
🏛️ **Educational Institutions**

Instead of keeping academic learning, industrial opportunities, skill development, and career preparation isolated, AICP brings these components together into a single intelligent ecosystem.

---

# 📌 About the Project

## 💡 The Problem

There is often a significant gap between what students learn in academic environments and what industries expect from potential candidates.

Students may struggle to:

* 🔍 Discover relevant industry opportunities
* 🧠 Identify skill gaps
* 📚 Find suitable learning resources
* 🤝 Connect with industry professionals
* 💼 Find internships, projects, and employment opportunities
* 🧪 Practice assessments and mock tests
* 📊 Understand their career readiness
* 🧑‍💻 Present their skills and projects effectively

At the same time, industries and academic institutions face challenges in:

* Finding candidates with suitable skills
* Collaborating on academic-industry projects
* Managing opportunities and applications
* Identifying emerging skill requirements
* Tracking student development
* Creating meaningful industry-academia partnerships

---

# 🎯 Our Solution

**AICP** provides an integrated platform where students, industry, academicians, and institutions can interact through dedicated workflows.

The platform combines:

> **🎓 Education + 💼 Industry + 🤝 Collaboration + 🧠 AI + 📊 Analytics**

AICP provides intelligent mechanisms for opportunity discovery, skill matching, learning, assessments, career preparation, portfolio development, collaboration, and analytics.

---

# 🌟 Key Features

## 👨‍🎓 Student Module

Students receive a centralized environment for learning, career development, and industry interaction.

### ✨ Features

* 👤 Student profile management
* 🧑‍💻 Skill and competency tracking
* 📄 Digital portfolio
* 💼 Internship and job opportunities
* 🚀 Industry project opportunities
* 📝 Opportunity applications
* 🧪 Assessments and mock tests
* 📚 Learning resources
* 📈 Career-readiness analytics
* 🤖 AI-powered career assistance
* 🔗 GitHub profile analysis
* 🎯 Personalized opportunity matching

---

## 🏢 Industry Module

Industry users can connect with suitable students and academic ecosystems.

### ✨ Features

* 🏢 Organization profile
* 📢 Publish opportunities
* 💼 Internship and job postings
* 🧑‍💻 Industry project creation
* 🎯 Candidate discovery
* 📋 Application management
* 🧠 Skill-based candidate matching
* 🤝 Collaboration with institutions
* 📊 Opportunity analytics

---

## 👨‍🏫 Academician Module

Academicians can facilitate student development and industry interaction.

### ✨ Features

* 👨‍🏫 Academic profile management
* 👨‍🎓 Student monitoring
* 📚 Learning support
* 🧪 Assessment management
* 🤝 Industry collaboration
* 📊 Student performance insights
* 🎯 Skill development tracking

---

## 🏛️ Institution Module

Institutions receive tools for managing and analyzing their academic-industry ecosystem.

### ✨ Features

* 🏫 Institution management
* 👥 Student and faculty management
* 🤝 Industry partnerships
* 📊 Institutional analytics
* 📈 Skill-gap analysis
* 💼 Opportunity tracking
* 🧩 Collaboration management

---

# 🤖 AI-Powered Intelligence

One of the major components of AICP is its dedicated **AI service**.

The platform uses locally implemented machine-learning/NLP techniques to provide intelligent functionality while maintaining a modular architecture.

### 🧠 AI Capabilities

#### 🎯 Intelligent Matching

AICP can analyze relevant information such as:

* Student skills
* Opportunity requirements
* Academic information
* Experience
* Project information
* Interests

and generate meaningful matching results.

The matching pipeline incorporates techniques such as:

* 📚 Local ontology
* 🔤 TF-IDF
* 📊 Logistic Regression
* 🔀 Hybrid matching approaches

---

## 🤖 AI Career Agent

The platform includes an AI-assisted career workflow designed to help students understand their career profile.

The career agent can work with information such as:

* Student profile
* Skills
* Projects
* Experience
* Learning progress
* GitHub information

### 🧑‍💻 GitHub Analysis

The system can analyze GitHub-related information to help understand a student's development profile, including project/activity-related signals.

This creates a bridge between:

> **📚 Academic Profile → 🧑‍💻 Technical Work → 💼 Career Opportunities**

---

# 📊 Platform Modules

| Module            | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| 👨‍🎓 Student     | Learning, opportunities, applications & career development |
| 🏢 Industry       | Opportunities, projects & candidate discovery              |
| 👨‍🏫 Academician | Student development & academic-industry interaction        |
| 🏛️ Institution   | Institutional management & analytics                       |
| 🤖 AI Service     | Matching & intelligent career functionality                |
| 📊 Analytics      | Insights into performance, skills & opportunities          |
| 📝 Assessments    | Tests, evaluations & mock examinations                     |
| 📚 Learning       | Learning resources and skill development                   |
| 💼 Opportunities  | Internships, jobs and projects                             |
| 🤝 Collaboration  | Academia-industry collaboration                            |

---

# 🏗️ System Architecture

AICP follows a modular full-stack architecture.

```text
                    ┌─────────────────────────┐
                    │       AICP Platform     │
                    └────────────┬────────────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
           🎨 Frontend                     ⚙️ Backend
          React + Vite                 Node.js + Express
                  │                             │
                  │                      ┌──────┴──────┐
                  │                      │             │
                  │                  MongoDB       REST APIs
                  │
                  │
                  └──────────────┬───────────────┘
                                 │
                         🤖 AI Service
                              FastAPI
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                 NLP/ML                 AI Models
              TF-IDF / ML            Matching / Agent
```

---

# 🧩 Technology Stack

## 🎨 Frontend

| Technology          | Purpose                         |
| ------------------- | ------------------------------- |
| ⚛️ React.js         | User interface                  |
| ⚡ Vite              | Frontend development/build tool |
| 🎨 Tailwind CSS     | Styling and responsive UI       |
| 🟨 JavaScript / JSX | Application logic               |

---

## ⚙️ Backend

| Technology    | Purpose                   |
| ------------- | ------------------------- |
| 🟢 Node.js    | Backend runtime           |
| 🚂 Express.js | REST API framework        |
| 🍃 Mongoose   | MongoDB object modeling   |
| 🍃 MongoDB    | Database                  |
| 🔐 JWT        | Authentication            |
| 🛡️ RBAC      | Role-based access control |

---

## 🤖 AI Service

| Technology             | Purpose                             |
| ---------------------- | ----------------------------------- |
| 🐍 Python              | AI/ML development                   |
| ⚡ FastAPI              | AI service API                      |
| 🔤 TF-IDF              | Text representation                 |
| 📊 Logistic Regression | Machine-learning component          |
| 🧠 Local Ontology      | Skill/knowledge representation      |
| 🔀 Hybrid Matching     | Intelligent recommendation/matching |

---

# 🔐 Authentication & Authorization

AICP implements secure role-based access.

### 🔑 Authentication

Users authenticate through a token-based mechanism using **JWT**.

### 🛡️ Role-Based Access Control

Different users receive access according to their role:

```text
👨‍🎓 Student
      │
      ├── Profile
      ├── Opportunities
      ├── Applications
      ├── Learning
      ├── Assessments
      └── Career Agent

🏢 Industry
      │
      ├── Organization Profile
      ├── Opportunities
      ├── Projects
      └── Applications

👨‍🏫 Academician
      │
      ├── Students
      ├── Learning
      ├── Assessments
      └── Collaboration

🏛️ Institution
      │
      ├── Users
      ├── Partnerships
      ├── Opportunities
      └── Analytics
```

---

# 📁 Project Structure

```text
AICP-SIH-2026/
│
├── 📁 client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── 📁 server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── scripts/
│   └── package.json
│
├── 📁 ai-service/
│   ├── API/
│   ├── models/
│   ├── services/
│   └── requirements.txt
│
├── 📁 ai-training/
│   └── AI/ML training resources
│
├── 📁 datasets/
│   └── Dataset resources
│
├── 📁 models/
│   └── Trained/local model resources
│
├── 📁 uploads/
│   └── Uploaded files/resources
│
├── 📁 scripts/
│   └── Utility and setup scripts
│
├── 📄 .env.example
├── 📄 .gitignore
└── 📄 README.md
```

> 📌 **Note:** Environment variables and sensitive credentials should never be committed to GitHub. Keep `.env` local and use `.env.example` to document required variables.

---

# ⚙️ Requirements

Before running the project, make sure the following are installed:

* 🟢 **Node.js 18+**
* 🐍 **Python 3.11+**
* 🍃 **MongoDB**
* 📦 **npm**
* 🐙 **Git**

You can use either a local MongoDB instance or a MongoDB connection string.

---

# 🚀 Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/Shailesh8708/AICP-SIH-2026.git
cd AICP-SIH-2026
```

---

## 2️⃣ Configure Environment Variables

Create the required `.env` files based on the provided environment-variable examples.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

For the AI service, configure the required Python/AI environment variables according to the project configuration.

> 🔒 Never upload real API keys, passwords, database credentials, or private secrets to GitHub.

---

# 📦 Backend Setup

Navigate to the backend:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Start the backend server:

```bash
npm run dev
```

The backend is configured around:

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

---

# 🤖 AI Service Setup

Open another terminal and navigate to the AI service:

```bash
cd ai-service
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI service according to the project's configured entry point.

The AI service is configured around:

```text
http://localhost:8000
```

---

# 🔄 Running the Complete Application

AICP uses multiple services that work together.

```text
┌─────────────────────┐
│   React Frontend    │
│   localhost:5173    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Node/Express API   │
│   localhost:5000    │
└──────────┬──────────┘
           │
           ├──────────────► 🍃 MongoDB
           │
           ▼
┌─────────────────────┐
│    FastAPI AI       │
│   localhost:8000    │
└─────────────────────┘
```

Run the three services in separate terminals:

```text
Terminal 1 → client
Terminal 2 → server
Terminal 3 → ai-service
```

---

# 🔌 API Overview

The backend follows a modular REST API structure.

Typical functional areas include:

```text
/api/auth
/api/users
/api/students
/api/industry
/api/institutions
/api/academicians
/api/opportunities
/api/applications
/api/assessments
/api/learning
/api/portfolio
/api/collaborations
/api/analytics
```

The exact routes and payloads should be checked against the corresponding route/controller implementations in the repository.

---

# 🧠 Intelligent Matching Workflow

A simplified AICP matching workflow can be represented as:

```text
👨‍🎓 Student Profile
       │
       ├── Skills
       ├── Interests
       ├── Projects
       └── Experience
       │
       ▼
┌───────────────────────┐
│ Text / Skill Analysis │
└───────────┬───────────┘
            │
            ▼
      🔤 TF-IDF
            │
            ▼
     🧠 ML Processing
            │
            ▼
      🔀 Hybrid Matching
            │
            ▼
🎯 Relevant Opportunities
```

This architecture allows the AI layer to remain independent from the main application backend.

---

# 📊 Analytics & Insights

AICP is designed to transform platform activity into useful insights.

Potential analytical areas include:

* 📈 Student performance
* 🎯 Skill development
* 💼 Opportunity activity
* 📝 Assessment results
* 🤝 Collaboration activity
* 🧑‍💻 Portfolio/GitHub activity
* 🏢 Industry requirements
* 🧩 Skill gaps

These insights can support data-driven decision-making for students, institutions, academicians, and industry users.

---

# 🌐 Core Workflow

A typical student journey through AICP can be represented as:

```text
📝 Register
   ↓
👤 Build Profile
   ↓
🧠 Add Skills & Interests
   ↓
📚 Learn & Improve Skills
   ↓
🧪 Take Assessments
   ↓
🧑‍💻 Build Portfolio
   ↓
🤖 AI Career Analysis
   ↓
🎯 Discover Matching Opportunities
   ↓
📨 Apply
   ↓
🤝 Collaborate with Industry
   ↓
💼 Career Development
```

---

# 💼 Opportunity Management

Industry organizations can publish different types of opportunities, such as:

* 💼 Jobs
* 🎓 Internships
* 🧑‍💻 Projects
* 🤝 Collaboration opportunities
* 🏆 Industry challenges

Students can discover and apply to opportunities according to their profiles and skills.

---

# 🧪 Assessment & Mock Tests

AICP also incorporates assessment-oriented functionality.

Students can:

* 📝 Attempt assessments
* 🧠 Test their knowledge
* 📊 Review performance
* 🎯 Identify areas requiring improvement

This helps connect learning outcomes with career readiness.

---

# 📚 Learning Ecosystem

The learning module is designed to support continuous skill development.

The broader workflow is:

```text
Current Skills
      ↓
Skill Gap Identification
      ↓
📚 Learning Resources
      ↓
🧪 Assessment
      ↓
📈 Progress Tracking
      ↓
🎯 Career Opportunities
```

---

# 🤝 Academia–Industry Collaboration

A core objective of AICP is to create meaningful interaction between educational institutions and industries.

The platform provides a foundation for:

```text
🏛️ Institution
      │
      ├──────────────┐
      │              │
      ▼              ▼
👨‍🏫 Academician   🏢 Industry
      │              │
      └──────┬───────┘
             │
             ▼
        🤝 Collaboration
             │
             ▼
        👨‍🎓 Students
```

This can support industry projects, internships, skill development, assessments, and other collaborative activities.

---

# 🎯 Project Objectives

The major objectives of AICP are:

### 1. 🌉 Bridge the Academia–Industry Gap

Create a common platform for academic institutions and industries.

### 2. 🎓 Improve Student Employability

Help students understand and develop relevant skills.

### 3. 🤖 Introduce AI-Assisted Career Support

Use AI/ML techniques for matching and career-oriented assistance.

### 4. 🤝 Promote Collaboration

Facilitate interaction between students, academicians, institutions, and industry.

### 5. 📊 Enable Data-Driven Insights

Provide analytics for understanding performance, skills, opportunities, and collaboration.

### 6. 💼 Improve Opportunity Discovery

Help connect students with relevant internships, projects, and employment opportunities.

---

# 🔮 Future Enhancements

The architecture of AICP allows several future improvements.

Possible extensions include:

* 🤖 More advanced recommendation models
* 🧠 Large Language Model integration
* 💬 Advanced AI career chatbot
* 📄 AI-powered resume analysis
* 🎯 Personalized learning paths
* 🔍 Advanced semantic search
* 📊 More comprehensive dashboards
* 📱 Mobile application
* 🔔 Real-time notifications
* 🏢 Advanced industry analytics
* 🌐 Multi-institution collaboration
* 🔗 Deeper GitHub and developer-profile analysis
* ☁️ Cloud deployment
* 🔐 Enhanced security and monitoring

---

# 🛡️ Security Considerations

Security is an important part of the platform.

The project incorporates concepts such as:

* 🔐 JWT-based authentication
* 🛡️ Role-based authorization
* 🔒 Environment-based secret management
* 🚫 Protection of sensitive configuration
* 👥 Role-specific access control

For production deployment, additional security hardening should be applied, including secure secret management, HTTPS, rate limiting, input validation, logging, monitoring, and appropriate database security.

---

# 🧑‍💻 Development Philosophy

AICP is designed around a modular architecture so that different components can evolve independently.

```text
Frontend
   │
   ▼
Backend API
   │
   ├── Authentication
   ├── Users
   ├── Opportunities
   ├── Applications
   ├── Learning
   ├── Assessments
   ├── Collaboration
   └── Analytics
   │
   ▼
AI Service
   │
   ├── Matching
   ├── NLP
   ├── Career Agent
   └── GitHub Analysis
```

This separation improves maintainability and provides a foundation for future scaling.

---

# 📜 License

This project was developed as part of the **Smart India Hackathon 2026** project initiative.

Add an appropriate open-source license to this repository if the project is intended to be distributed or reused publicly.

---

# 👥 Team

### 🚀 AICP — Academia–Industry Collaboration Portal

**Smart India Hackathon 2026**

**Problem Statement:** `26044`

The project brings together:

> 🎓 Academia
> 🏢 Industry
> 👨‍🎓 Students
> 🤖 Artificial Intelligence
> 📊 Data & Analytics

to create a connected ecosystem for education, collaboration, and career development.

---

# ⭐ Support the Project

If you find this project interesting or useful:

⭐ **Star this repository**

🍴 **Fork the repository**

🐛 **Report issues**

💡 **Suggest improvements**

🤝 **Contribute to the project**

Every contribution helps improve the project and its ecosystem.

---

# 📬 Repository

🔗 **GitHub Repository**

https://github.com/Shailesh8708/AICP-SIH-2026

---

<p align="center">
  <strong>🚀 AICP — Connecting Academia with Industry through Technology & AI 🤖</strong>
</p>

<p align="center">
  Made with ❤️ for <strong>Smart India Hackathon 2026</strong>
</p>

<p align="center">
  ⭐ If you like the project, don't forget to star the repository! ⭐
</p>
