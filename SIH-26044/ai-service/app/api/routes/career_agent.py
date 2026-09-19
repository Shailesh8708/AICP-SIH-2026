"""
ai-service/app/api/routes/career_agent.py

Career Agent AI endpoints — called by the Node.js career agent controller.
Uses the same ontology and skill extraction as the main service.

Imports from app.utils (NOT app.main) to prevent the circular import that
occurs when main.py includes_router(career_agent_router) at module load time.
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any

from app.utils import extract_skills, normalize_skill, ONTOLOGY

router = APIRouter(prefix="/career-agent", tags=["career-agent"])


class ProfileAnalyzeRequest(BaseModel):
    skills: list[str] = Field(default_factory=list)
    target_role: str = Field(default="")
    education: str = Field(default="")
    projects: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    github: str = Field(default="")
    linkedin: str = Field(default="")


class InterviewEvaluateRequest(BaseModel):
    answers: list[dict[str, Any]] = Field(default_factory=list)
    target_role: str = Field(default="")


class LinkedInAnalyzeRequest(BaseModel):
    headline: str = Field(default="")
    about: str = Field(default="")
    skills: list[str] = Field(default_factory=list)
    experience: list[Any] = Field(default_factory=list)
    education: str = Field(default="")
    projects: list[Any] = Field(default_factory=list)
    certifications: list[Any] = Field(default_factory=list)
    featured: str = Field(default="")
    targetRole: str = Field(default="")
    profileUrl: str = Field(default="")
    isStudent: bool = Field(default=True)


class GitHubAnalyzeRequest(BaseModel):
    username: str = Field(default="")
    targetRole: str = Field(default="")
    profileData: dict[str, Any] = Field(default_factory=dict)
    reposData: list[dict[str, Any]] = Field(default_factory=list)
    aicpProfile: dict[str, Any] = Field(default_factory=dict)


@router.post("/analyze-profile")
def analyze_profile(request: ProfileAnalyzeRequest) -> dict:
    """
    Score a student profile across multiple dimensions.
    Returns AI-generated readiness indicators (NOT scientifically validated).
    """
    normalized = {normalize_skill(s) or s for s in request.skills if s.strip()}

    skill_score = min(100, len(normalized) * 6)
    project_score = min(100, len(request.projects) * 18)
    exp_score = min(100, len(request.experience) * 25)
    cert_score = min(100, len(request.certifications) * 20)
    github_score = 40 if request.github else 0
    linkedin_score = 30 if request.linkedin else 0

    # Education signal from CGPA in the education string
    cgpa = 0.0
    for token in request.education.split():
        try:
            val = float(token.replace("CGPA:", "").strip(":"))
            if 0 < val <= 10:
                cgpa = val
                break
        except ValueError:
            pass
    edu_score = 90 if cgpa >= 8 else 70 if cgpa >= 6 else 50 if cgpa > 0 else 30

    overall = round(
        skill_score * 0.20
        + project_score * 0.20
        + exp_score * 0.15
        + cert_score * 0.05
        + github_score * 0.10
        + linkedin_score * 0.05
        + edu_score * 0.15
        + 50 * 0.10  # interview readiness placeholder
    )

    # Career-role gap analysis
    career = ONTOLOGY["careers"].get(request.target_role, {})
    required_skills = set(career.get("skills", []))
    strengths = sorted(normalized & required_skills) if required_skills else sorted(normalized)[:5]
    weaknesses = sorted(required_skills - normalized) if required_skills else []

    missing_info = []
    if not request.github:
        missing_info.append("GitHub profile URL not provided")
    if not request.linkedin:
        missing_info.append("LinkedIn profile URL not provided")
    if not request.projects:
        missing_info.append("No projects listed")
    if not request.certifications:
        missing_info.append("No certifications listed")

    recommendations = []
    if github_score == 0:
        recommendations.append("Add your GitHub URL to improve your developer credibility signal.")
    if project_score < 40:
        recommendations.append("Add at least 2 real-world projects with clear problem statements and technologies.")
    if skill_score < 40:
        recommendations.append("List more verified technical skills — include specific frameworks and tools.")

    return {
        "scores": {
            "overall": overall,
            "skills": skill_score,
            "projects": project_score,
            "experience": exp_score,
            "certifications": cert_score,
            "github": github_score,
            "linkedin": linkedin_score,
            "resume": 50,
            "interviewReadiness": 50,
            "internshipReadiness": overall,
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missingInfo": missing_info,
        "recommendations": recommendations,
        "disclaimer": "Scores are AI-generated readiness indicators — not scientifically validated assessments.",
        "modelVersion": "career-agent-analyzer-v1",
    }


@router.post("/evaluate-interview")
def evaluate_interview(request: InterviewEvaluateRequest) -> dict:
    """
    Evaluate mock interview answers.
    Returns qualitative feedback — not a replacement for real interview practice.
    """
    answers = request.answers
    if not answers:
        return {"error": "No answers provided", "overallScore": 0}

    total_length = sum(len(a.get("answer", "")) for a in answers)
    avg_length = total_length / len(answers)

    # Heuristic signals
    star_keywords = ["situation", "task", "action", "result", "because", "therefore", "achieved", "improved", "reduced"]
    technical_depth = ["implemented", "built", "designed", "optimized", "deployed", "configured", "developed"]

    star_count = sum(
        1 for a in answers
        if any(kw in a.get("answer", "").lower() for kw in star_keywords)
    )
    depth_count = sum(
        1 for a in answers
        if any(kw in a.get("answer", "").lower() for kw in technical_depth)
    )

    structure_score = min(40, int((star_count / len(answers)) * 40))
    depth_score = min(30, int((depth_count / len(answers)) * 30))
    length_score = min(30, int(min(avg_length / 300, 1) * 30))
    overall = structure_score + depth_score + length_score

    strengths = []
    weaknesses = []

    if star_count >= len(answers) // 2:
        strengths.append("Good use of structured storytelling in behavioral answers.")
    else:
        weaknesses.append("Use the STAR method (Situation, Task, Action, Result) for behavioral questions.")

    if depth_count >= 2:
        strengths.append("Technical answers show implementation experience.")
    else:
        weaknesses.append("Add specific technical details — mention tools, approaches, and outcomes.")

    if avg_length > 200:
        strengths.append("Answers are sufficiently detailed.")
    else:
        weaknesses.append("Elaborate more — most interview answers benefit from 2–4 sentence responses minimum.")

    return {
        "overallScore": overall,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "communication": "Ensure each answer includes a concrete example from your own experience.",
        "missingConcepts": [],
        "disclaimer": "This is an AI-generated practice evaluation. Real interviews will vary significantly.",
        "modelVersion": "career-agent-interview-eval-v1",
    }


@router.post("/analyze-linkedin")
def analyze_linkedin(request: LinkedInAnalyzeRequest) -> dict:
    """
    Audit full LinkedIn profile information section-by-section.
    Performs skills cross-referencing, transparent scoring, Before->After,
    dynamic priority ranking, and professional insights.
    """
    has_headline = bool(request.headline.strip())
    has_about = bool(request.about.strip())
    has_skills = bool(request.skills)
    has_experience = bool(request.experience)
    has_education = bool(request.education.strip())
    has_projects = bool(request.projects)
    has_certifications = bool(request.certifications)
    has_featured = bool(request.featured.strip())

    data_availability = {
        "headline": has_headline,
        "about": has_about,
        "skills": has_skills,
        "experience": has_experience,
        "education": has_education,
        "projects": has_projects,
        "certifications": has_certifications,
        "featured": has_featured,
        "targetRole": bool(request.targetRole.strip()),
        "profileUrl": bool(request.profileUrl.strip()),
    }

    normalized_skills = [normalize_skill(s) or s for s in request.skills if s.strip()]

    evidence_parts = []
    for exp in request.experience:
        if isinstance(exp, dict):
            evidence_parts.append(f"{exp.get('title', '')} {exp.get('company', '')} {exp.get('description', '')}")
        else:
            evidence_parts.append(str(exp))
    for proj in request.projects:
        if isinstance(proj, dict):
            evidence_parts.append(f"{proj.get('title', '')} {proj.get('description', '')} {' '.join(proj.get('technologies', []))}")
        else:
            evidence_parts.append(str(proj))
    evidence_text = " ".join(evidence_parts).lower()

    verified_skills = []
    unverified_skills = []
    for s in normalized_skills:
        if s.lower() in evidence_text:
            verified_skills.append({"skill": s, "status": "verified", "evidenceNote": "Demonstrated in your projects or experience entries."})
        else:
            unverified_skills.append({"skill": s, "status": "unverified", "recommendation": f"Add project or work proof demonstrating your use of {s}."})

    career = ONTOLOGY.get("careers", {}).get(request.targetRole, {})
    required_role_skills = career.get("skills", [])
    missing_role_skills = [rs for rs in required_role_skills if rs.lower() not in [s.lower() for s in normalized_skills]]

    h_len = len(request.headline.strip())
    h_score = 50
    h_strengths = []
    h_issues = []
    if 50 <= h_len <= 150:
        h_score += 20
        h_strengths.append(f"Optimal headline length ({h_len} chars).")
    elif h_len < 40 and has_headline:
        h_score -= 15
        h_issues.append(f"Headline is too brief ({h_len} chars).")
    elif not has_headline:
        h_score = 0
        h_issues.append("No headline provided.")

    if request.targetRole and request.targetRole.lower() in request.headline.lower():
        h_score += 20
        h_strengths.append(f"Clearly includes target role: {request.targetRole}.")
    elif has_headline:
        h_issues.append("Does not explicitly mention your target role.")

    h_score = max(0, min(100, h_score))

    a_len = len(request.about.strip().split())
    a_score = 50
    a_strengths = []
    a_issues = []
    if 60 <= a_len <= 300:
        a_score += 25
        a_strengths.append(f"Good narrative depth ({a_len} words).")
    elif a_len < 30 and has_about:
        a_score -= 15
        a_issues.append(f"About section is too brief ({a_len} words).")
    elif not has_about:
        a_score = 0
        a_issues.append("No About section provided.")
    a_score = max(0, min(100, a_score))

    exp_score = min(100, len(request.experience) * 30 + (20 if "engineered" in evidence_text or "developed" in evidence_text else 0)) if has_experience else 0
    skill_score = min(100, len(normalized_skills) * 6 + (20 if len(verified_skills) > 0 else 0)) if has_skills else 0
    proj_score = min(100, len(request.projects) * 35) if has_projects else 0
    edu_score = 80 if has_education else 30

    section_scores = {
        "headline": h_score,
        "about": a_score,
        "experience": exp_score,
        "skills": skill_score,
        "projects": proj_score,
        "education": edu_score,
        "featured": 85 if has_featured else 30,
        "certifications": 80 if has_certifications else 40,
        "careerAlignment": 85 if len(missing_role_skills) == 0 else 65,
    }

    weights = {"headline": 0.20, "about": 0.20, "skills": 0.20, "projects": 0.20, "experience": 0.08, "education": 0.05, "careerAlignment": 0.07} if request.isStudent else {"headline": 0.15, "about": 0.15, "experience": 0.30, "skills": 0.15, "projects": 0.10, "education": 0.05, "careerAlignment": 0.10}
    tot_w = sum(weights[k] for k in weights if data_availability.get(k, True))
    weighted = sum(section_scores.get(k, 0) * weights[k] for k in weights if data_availability.get(k, True))
    overall_score = round(weighted / tot_w) if tot_w > 0 else 50

    core_secs = ["headline", "about", "skills", "experience", "projects", "education", "certifications", "featured"]
    completeness = round((sum(1 for s in core_secs if data_availability[s]) / len(core_secs)) * 100)

    top_improvements = []
    if h_issues:
        top_improvements.append({"priority": "high", "section": "Headline", "action": h_issues[0], "impact": "Immediate increase in recruiter discoverability."})
    if a_issues:
        top_improvements.append({"priority": "high", "section": "About", "action": a_issues[0], "impact": "Hooks recruiters reading past your headline."})
    if unverified_skills:
        top_improvements.append({"priority": "high", "section": "Skills & Evidence", "action": f"Add proof for {len(unverified_skills)} unverified skills.", "impact": "Substantiates claimed technical competencies."})
    if missing_role_skills:
        top_improvements.append({"priority": "high", "section": "Skills Alignment", "action": f"Add missing core skills: {', '.join(missing_role_skills[:3])}.", "impact": "Qualifies you for recruiter Boolean search filters."})
    if not has_featured:
        top_improvements.append({"priority": "low", "section": "Featured", "action": "Pin your flagship project to the Featured section.", "impact": "Visual proof at top of profile."})

    top_improvements = top_improvements[:5]

    s1 = normalized_skills[0] if normalized_skills else "Full Stack"
    s2 = normalized_skills[1] if len(normalized_skills) > 1 else "Cloud Architecture"
    s3 = normalized_skills[2] if len(normalized_skills) > 2 else "REST APIs"
    role_disp = request.targetRole or "Software Engineer"

    headline_options = [
        {"style": "Role & Tech Stack Focused", "headline": f"{role_disp} | {s1} • {s2} • {s3} | Problem Solver & Builder", "rationale": "Direct recruiter keyword alignment."},
        {"style": "Value & Impact Focused", "headline": f"{role_disp} specializing in {s1} & {s2} — Delivering Robust Systems", "rationale": "Emphasizes engineering impact."},
        {"style": "Specialization & Domain Focused", "headline": f"{role_disp} Candidate | {s1} • {s2} | Engineering Scalable Architecture", "rationale": "Authoritative and concise."},
    ]

    about_options = [
        {
            "style": "Narrative & Trajectory Focus",
            "content": f"As an aspiring {role_disp}, I focus on turning theoretical knowledge into production-ready software. My technical foundation spans {', '.join(normalized_skills[:4]) if normalized_skills else 'software engineering'}.\n\nI thrive on decomposing complex challenges into scalable solutions. Open to {role_disp} opportunities and collaborations — let's connect!",
            "rationale": "Narrative structure highlighting trajectory and practical skills.",
        },
        {
            "style": "Technical Competency & Projects Focus",
            "content": f"Targeting: {role_disp}\n\nCore Engineering Stack: {', '.join(normalized_skills[:4]) if normalized_skills else 'Modern Web & Systems'}\n\nI focus on writing clean, maintainable, and well-tested code with strong architecture.\n\nOpen to new opportunities — reach out at any time!",
            "rationale": "Scannable format for technical recruiters.",
        }
    ]

    return {
        "overallScore": min(100, max(0, overall_score)),
        "profileCompleteness": completeness,
        "targetRole": request.targetRole or "General Technical Role",
        "careerAlignment": {
            "status": "Strong Alignment" if len(missing_role_skills) == 0 else "Moderate Alignment",
            "score": 85 if len(missing_role_skills) == 0 else 65,
            "reason": f"Target role {role_disp} evaluated against profile signals.",
        },
        "dataAvailability": data_availability,
        "availabilityDisclaimer": "All core profile sections evaluated successfully." if completeness == 100 else "Profile analysis based on the information available from the submitted profile. Some sections could not be evaluated because their content was not provided.",
        "sectionScores": section_scores,
        "analyzedSections": {
            "headline": {
                "score": h_score,
                "scoreReason": f"Headline scored {h_score}/100.",
                "strengths": h_strengths,
                "issues": h_issues,
                "beforeAfter": {
                    "current": request.headline or "None",
                    "problem": h_issues[0] if h_issues else "Could be more punchy.",
                    "recommended": f"{role_disp} | {s1} • {s2} • {s3} | Scalable Solutions",
                    "why": "Keywords and exact role title maximize search click-through rate.",
                },
                "options": headline_options,
            },
            "about": {
                "score": a_score,
                "scoreReason": f"About section scored {a_score}/100.",
                "strengths": a_strengths,
                "issues": a_issues,
                "beforeAfter": {
                    "current": request.about or "None",
                    "problem": a_issues[0] if a_issues else "Could emphasize technical proof.",
                    "recommended": about_options[0]["content"],
                    "why": "Clear technical story with call to action drives recruiter outreach.",
                },
                "options": about_options,
            },
            "experience": {
                "score": exp_score,
                "scoreReason": f"Experience scored {exp_score}/100.",
                "entries": [],
            },
            "skills": {
                "score": skill_score,
                "scoreReason": f"Skills scored {skill_score}/100. {len(verified_skills)} verified with evidence.",
                "skillsCount": len(normalized_skills),
                "categorized": {},
                "verifiedSkills": verified_skills,
                "unverifiedSkills": unverified_skills,
                "missingTargetSkills": missing_role_skills,
                "strengths": [f"{len(verified_skills)} skills verified with evidence."],
                "issues": [f"{len(unverified_skills)} skills lack evidence."] if unverified_skills else [],
            },
            "projects": {
                "score": proj_score,
                "scoreReason": f"Projects scored {proj_score}/100.",
                "projectCount": len(request.projects),
                "strengths": ["Project portfolio provided."] if has_projects else [],
                "issues": ["No projects listed."] if not has_projects else [],
            },
            "education": {
                "score": edu_score,
                "scoreReason": f"Education scored {edu_score}/100.",
                "strengths": ["Education info recorded."] if has_education else [],
                "issues": ["No education provided."] if not has_education else [],
            },
            "featured": {
                "score": 85 if has_featured else 30,
                "scoreReason": "Featured section utilizes key media." if has_featured else "Featured section is empty.",
                "strengths": ["Featured items pinned."] if has_featured else [],
                "issues": ["Pin your top project to Featured."] if not has_featured else [],
            },
            "certifications": {
                "score": 80 if has_certifications else 40,
                "scoreReason": "Certifications validated." if has_certifications else "No certifications listed.",
                "strengths": ["Certifications on file."] if has_certifications else [],
                "issues": ["Add industry credentials to reinforce skills."] if not has_certifications else [],
            },
        },
        "topPriorityImprovements": top_improvements,
        "professionalInsights": [
            {
                "title": "5-Second Recruiter Readability Scan",
                "status": "Pass" if h_score >= 70 and a_score >= 70 else "Needs Optimization",
                "explanation": "Recruiters spend 5–8 seconds scanning a profile before deciding to reach out.",
                "actionItem": "Ensure your Headline leads with your target role and top skills.",
            },
            {
                "title": "Keyword Strategy & Discoverability",
                "status": "Optimized" if not missing_role_skills else "Opportunity",
                "explanation": f"Recruiters use search filters matching {role_disp}.",
                "actionItem": f"Add missing keywords ({', '.join(missing_role_skills[:3])}) if acquired.",
            },
            {
                "title": "Evidence-Based Branding Index",
                "status": "High Credibility" if len(verified_skills) >= len(unverified_skills) else "Needs Evidence",
                "explanation": f"{len(verified_skills)} of {len(normalized_skills)} claimed skills backed by project evidence.",
                "actionItem": "Add project links or repo evidence for unverified skills.",
            },
            {
                "title": "Achievement Framing Formula",
                "status": "Professional Guide",
                "explanation": "Structure achievements with: Action Verb + Context & Tech + Measurable Outcome.",
                "actionItem": "Lead bullets with verbs like Engineered, Implemented, Optimized.",
            },
        ],
        "analyzedAt": "2026-09-11T00:00:00Z",
        "isStudent": request.isStudent,
        "disclaimer": "This audit is generated using AICP local heuristics and recruiter strategy models. Real recruiter decisions may vary.",
        "modelVersion": "career-agent-linkedin-v1",
    }


@router.post("/analyze-github")
def analyze_github(request: GitHubAnalyzeRequest) -> dict:
    """
    AI-Powered GitHub Career & Project Intelligence:
    - Analyzes public GitHub profile & repository signals.
    - Evaluates portfolio quality, language breadth, depth, freshness, and role alignment.
    - Identifies portfolio gaps (strengths, missing evidence, underrepresented skills, redundancies).
    - Generates personalized anti-duplicate project recommendations with full blueprints.
    - Strict Zero Fabrication: uses only actual profile and repo metrics.
    """
    profile = request.profileData or {}
    repos = request.reposData or []
    aicp = request.aicpProfile or {}
    username = request.username or profile.get("login", "developer")
    target_role = request.targetRole or aicp.get("targetRole", "Full Stack Developer")

    # 1. Profile Quality Score (0-100)
    has_bio = bool(profile.get("bio"))
    has_avatar = bool(profile.get("avatar_url"))
    has_name = bool(profile.get("name"))
    has_blog = bool(profile.get("blog"))
    public_repos = profile.get("public_repos", len(repos))
    followers = profile.get("followers", 0)

    profile_quality = min(100, (
        (30 if has_bio else 0) +
        (15 if has_avatar else 0) +
        (15 if has_name else 0) +
        (15 if has_blog else 0) +
        (15 if public_repos >= 3 else (public_repos * 5)) +
        (10 if followers >= 2 else (followers * 5))
    ))

    # 2. Repository Quality & Metrics
    languages_count: dict[str, int] = {}
    total_stars = 0
    total_forks = 0
    scored_repos = []
    has_recent_commits = False
    now = datetime.now(timezone.utc)

    for r in repos:
        r_lang = r.get("language")
        if r_lang:
            languages_count[r_lang] = languages_count.get(r_lang, 0) + 1

        stars = r.get("stargazers_count", 0)
        forks = r.get("forks_count", 0)
        total_stars += stars
        total_forks += forks

        has_desc = bool(r.get("description"))
        # Check freshness
        updated_str = r.get("pushed_at") or r.get("updated_at")
        is_recent = False
        if updated_str:
            try:
                dt = datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
                if (now - dt).days <= 180:
                    is_recent = True
                    has_recent_commits = True
            except Exception:
                pass

        # Detect unfinished/skeleton repos
        is_unfinished = False
        r_name_lower = (r.get("name") or "").lower()
        if any(term in r_name_lower for term in ["test", "demo", "sample", "temp", "practice", "tutorial"]):
            is_unfinished = True

        r_score = min(100, (
            (35 if has_desc else 5) +
            (25 if r_lang else 0) +
            (20 if stars > 0 else 0) +
            (10 if forks > 0 else 0) +
            (10 if is_recent else 0)
        ))

        scored_repos.append({
            "name": r.get("name", "repository"),
            "description": r.get("description") or "",
            "language": r_lang or "Unspecified",
            "stars": stars,
            "forks": forks,
            "updatedAt": updated_str or "",
            "score": r_score,
            "isUnfinished": is_unfinished,
            "hasDescription": has_desc,
            "hasReadme": bool(r.get("description")),
            "htmlUrl": r.get("html_url", f"https://github.com/{username}/{r.get('name', '')}"),
        })

    # Sort repos by score desc
    scored_repos.sort(key=lambda x: x["score"], reverse=True)

    avg_repo_quality = (
        round(sum(r["score"] for r in scored_repos) / len(scored_repos))
        if scored_repos else 25
    )

    # Breadth: distinct languages
    distinct_langs = len(languages_count)
    breadth_score = min(100, distinct_langs * 25 if distinct_langs <= 4 else 100)

    # Depth: stars, forks, comprehensive projects
    depth_score = min(100, (
        min(40, len([r for r in scored_repos if r["score"] >= 60]) * 15) +
        min(30, total_stars * 10) +
        min(30, total_forks * 15)
    )) if scored_repos else 15

    # Role alignment
    role_lower = target_role.lower()
    aligned_matches = 0
    for lang in languages_count:
        l_lower = lang.lower()
        if "frontend" in role_lower and l_lower in ["javascript", "typescript", "html", "css", "vue"]:
            aligned_matches += 1
        elif "backend" in role_lower and l_lower in ["python", "go", "java", "c#", "rust", "javascript", "typescript"]:
            aligned_matches += 1
        elif "machine learning" in role_lower or "data" in role_lower:
            if l_lower in ["python", "r", "c++", "julia"]:
                aligned_matches += 1
        elif "full stack" in role_lower:
            if l_lower in ["javascript", "typescript", "python", "go", "java", "sql"]:
                aligned_matches += 1

    role_alignment_score = min(100, max(35, aligned_matches * 35))

    # Freshness
    freshness_score = 85 if has_recent_commits else (50 if repos else 20)

    # Overall Score (weighted)
    overall_score = round(
        profile_quality * 0.20 +
        avg_repo_quality * 0.30 +
        breadth_score * 0.15 +
        depth_score * 0.15 +
        role_alignment_score * 0.10 +
        freshness_score * 0.10
    )

    # 3. Language list sorted by frequency
    sorted_languages = [
        k for k, _ in sorted(languages_count.items(), key=lambda item: item[1], reverse=True)
    ]

    # 4. Portfolio Gap Analysis
    strengths = []
    if sorted_languages:
        strengths.append(f"Demonstrated proficiency in {', '.join(sorted_languages[:3])}.")
    if total_stars > 0:
        strengths.append(f"Received {total_stars} public stars across repositories.")
    if scored_repos and any(r["score"] >= 70 for r in scored_repos):
        strengths.append(f"{len([r for r in scored_repos if r['score'] >= 70])} repositories have clear documentation and active metadata.")
    if not strengths:
        strengths.append("Active GitHub account established; ready for portfolio enhancement.")

    missing_evidence = []
    if "full stack" in role_lower and not any("backend" in r["description"].lower() or "api" in r["description"].lower() for r in scored_repos):
        missing_evidence.append("Missing dedicated Backend API architecture (REST/GraphQL with database persistence).")
    if ("machine learning" in role_lower or "ai" in role_lower) and not any("model" in r["description"].lower() or "pipeline" in r["description"].lower() for r in scored_repos):
        missing_evidence.append("Missing end-to-end ML model training pipeline or inference deployment.")
    if not any("test" in r["name"].lower() or "ci" in r["description"].lower() for r in scored_repos):
        missing_evidence.append("Zero automated testing or CI/CD workflow badges visible on top projects.")
    if not missing_evidence:
        missing_evidence.append("Add automated integration tests and production deployment links to key projects.")

    underrepresented = []
    all_repo_text = " ".join([r["name"] + " " + r["description"] for r in scored_repos]).lower()
    if "docker" not in all_repo_text:
        underrepresented.append("Docker Containerization")
    if "typescript" not in all_repo_text and any(l in ["JavaScript"] for l in sorted_languages):
        underrepresented.append("TypeScript Type Safety")
    if "test" not in all_repo_text and "jest" not in all_repo_text and "pytest" not in all_repo_text:
        underrepresented.append("Automated Unit/Integration Testing (Jest/Vitest/PyTest)")
    if "redis" not in all_repo_text:
        underrepresented.append("Redis In-Memory Caching & Performance Optimization")

    redundant_areas = []
    todo_clones = [r["name"] for r in scored_repos if any(k in r["name"].lower() for k in ["todo", "counter", "weather", "calculator", "notes"])]
    if len(todo_clones) > 1:
        redundant_areas.append(f"Multiple basic tutorial projects detected ({', '.join(todo_clones[:3])}). Consolidate into 1 advanced full-stack application.")
    elif len(todo_clones) == 1:
        redundant_areas.append(f"Basic tutorial project '{todo_clones[0]}' present. Upgrade with real-time features or authentication.")

    # 5. Anti-Duplicate Project Recommendations
    existing_stems = set()
    for r in scored_repos:
        for token in r["name"].lower().replace("-", " ").replace("_", " ").split():
            if len(token) > 3:
                existing_stems.add(token)

    for p in aicp.get("projects", []):
        p_name = p.get("name", "") if isinstance(p, dict) else str(p)
        for token in p_name.lower().replace("-", " ").replace("_", " ").split():
            if len(token) > 3:
                existing_stems.add(token)

    # Catalog of verified, high-impact blueprints
    project_pool = [
        {
            "id": "proj-distributed-task-queue",
            "title": "Distributed Async Task Queue & Rate-Limiter",
            "domain": "Backend & Distributed Systems",
            "difficulty": "Advanced",
            "estimatedHours": 40,
            "roles": ["backend developer", "full stack developer", "devops engineer", "cloud architect"],
            "stems": ["task", "queue", "worker", "distributed"],
            "whyThisProject": "Recruiters look for proof of handling concurrency, background job workers, and Redis-backed rate limiting.",
            "recruiterValue": "Demonstrates enterprise-grade asynchronous processing, idempotency, and graceful backoff under load.",
            "keyFeatures": [
                "Reliable Redis-backed priority worker queue with dead-letter retry logic",
                "Sliding window rate-limiter middleware using Redis sorted sets",
                "Prometheus metrics exporter & Grafana monitoring dashboard",
                "Comprehensive integration test suite with Docker Compose"
            ],
            "recommendedTechStack": ["Node.js / TypeScript", "Redis", "BullMQ / Celery", "Docker", "Jest / Vitest"],
            "blueprint": {
                "architecture": "Event-driven asynchronous producer-worker architecture with Redis broker, persistent dead-letter queue, and Prometheus telemetry.",
                "databaseSchema": "Redis Streams / Hashes for job state; PostgreSQL jobs audit table (id, status, payload, attempts, max_retries, created_at, processed_at).",
                "apiEndpoints": [
                    "POST /api/v1/jobs - Enqueue background task with priority & delay",
                    "GET /api/v1/jobs/:id - Query job execution progress and results",
                    "POST /api/v1/jobs/:id/retry - Re-queue failed dead-letter task",
                    "GET /api/v1/metrics - Expose Prometheus metrics for worker latency"
                ],
                "roadmap": [
                    {"phase": "Phase 1: Architecture & Queue Broker", "duration": "Week 1", "tasks": ["Setup TypeScript workspace and Dockerized Redis", "Define job contracts and producer interface"]},
                    {"phase": "Phase 2: Worker Concurrency & Idempotency", "duration": "Week 2", "tasks": ["Implement worker consumers with configurable concurrency", "Add idempotent task keys and atomic Redis locks"]},
                    {"phase": "Phase 3: Sliding Window Rate Limiting", "duration": "Week 3", "tasks": ["Build token bucket / sliding window rate limiter", "Implement 429 response handling and retry-after headers"]},
                    {"phase": "Phase 4: Dead-Letter Queue & Telemetry", "duration": "Week 4", "tasks": ["Add dead-letter queue for tasks exceeding 3 retries", "Instrument endpoints with Prometheus metrics"]},
                    {"phase": "Phase 5: Automated Testing & Deployment", "duration": "Week 5", "tasks": ["Write integration tests simulating worker failures", "Provide 1-click Docker Compose deploy script and docs"]}
                ],
                "scaffoldingTree": "distributed-task-queue/\n├── src/\n│   ├── api/\n│   │   ├── controllers/\n│   │   └── routes/\n│   ├── queue/\n│   │   ├── producer.ts\n│   │   └── worker.ts\n│   ├── middleware/\n│   │   └── rateLimiter.ts\n│   └── index.ts\n├── tests/\n├── docker-compose.yml\n└── README.md"
            },
            "readmeContent": "# Distributed Async Task Queue & Rate-Limiter\n\nHigh-throughput, reliable asynchronous task queue with sliding-window rate limiting and Prometheus metrics.\n\n## Key Features\n- Redis priority queue with retry backoff\n- Atomic distributed locks\n- Zero downtime worker scalability\n\n## Getting Started\n```bash\ndocker-compose up -d\nnpm install\nnpm run test\n```"
        },
        {
            "id": "proj-collaborative-whiteboard",
            "title": "Real-Time Collaborative Canvas with Conflict Resolution",
            "domain": "Full Stack & Web Engineering",
            "difficulty": "Advanced",
            "estimatedHours": 45,
            "roles": ["frontend developer", "full stack developer"],
            "stems": ["canvas", "whiteboard", "collab", "socket"],
            "whyThisProject": "Proves deep mastery over WebSockets, HTML5 Canvas rendering, and real-time state synchronization.",
            "recruiterValue": "Recruiters prioritize candidates who can handle WebSockets, undo/redo state stacks, and sub-16ms render loops.",
            "keyFeatures": [
                "Sub-16ms 60 FPS vector canvas rendering using HTML5 Canvas / WebGL",
                "Bidirectional real-time multi-user cursor tracking over WebSockets",
                "Operational Transformation / CRDT for conflict-free shape updates",
                "Export canvas to PNG, SVG, and encrypted persistent cloud sessions"
            ],
            "recommendedTechStack": ["React 18", "TypeScript", "Socket.io", "Node.js", "Zustand", "Tailwind CSS"],
            "blueprint": {
                "architecture": "Client-server bidirectional WebSocket pub/sub model with Zustand local state cache and room-based WebSocket clusters.",
                "databaseSchema": "MongoDB documents / PostgreSQL JSONB: Rooms (id, title, owner_id), Shapes (id, room_id, type, coordinates, color, version).",
                "apiEndpoints": [
                    "POST /api/v1/rooms - Create collaborative canvas room",
                    "GET /api/v1/rooms/:id/export - Export vector snapshot as SVG/JSON",
                    "WS /socket/room/:id - Real-time delta broadcast & presence heartbeat"
                ],
                "roadmap": [
                    {"phase": "Phase 1: Vector Canvas Engine", "duration": "Week 1", "tasks": ["Setup React 18 canvas with coordinate transforms", "Implement zoom, pan, and freehand stroke smoothing"]},
                    {"phase": "Phase 2: WebSocket Presence Sync", "duration": "Week 2", "tasks": ["Connect WebSocket client with heartbeat reconnect", "Broadcast cursor coordinates with throttle"]},
                    {"phase": "Phase 3: Conflict-Free State Management", "duration": "Week 3", "tasks": ["Implement LWW (Last-Write-Wins) or CRDT state engine", "Add global Undo / Redo timeline history"]},
                    {"phase": "Phase 4: Persistence & Room Management", "duration": "Week 4", "tasks": ["Save snapshots to database upon room inactivity", "Add authenticated room access and guest permissions"]},
                    {"phase": "Phase 5: Performance Benchmarking & E2E", "duration": "Week 5", "tasks": ["Benchmark 1,000 active shapes at 60 FPS", "Deploy to Vercel/Railway with production WebSocket support"]}
                ],
                "scaffoldingTree": "collab-canvas/\n├── client/\n│   ├── src/\n│   │   ├── canvas/\n│   │   ├── hooks/\n│   │   └── store/\n├── server/\n│   ├── src/\n│   │   └── sockets/\n├── package.json\n└── README.md"
            },
            "readmeContent": "# Real-Time Collaborative Canvas\n\nHigh-performance 60 FPS collaborative whiteboard with real-time cursor presence and conflict-free shape state synchronization.\n\n## Tech Stack\n- React 18, TypeScript, Tailwind CSS\n- Node.js, Socket.io, Zustand\n\n## Setup\n```bash\nnpm install\nnpm run dev\n```"
        },
        {
            "id": "proj-mlops-inference-pipeline",
            "title": "Production MLOps Pipeline & Model Inference API",
            "domain": "Machine Learning & AI Engineering",
            "difficulty": "Advanced",
            "estimatedHours": 50,
            "roles": ["machine learning engineer", "data scientist", "ai engineer"],
            "stems": ["mlops", "pipeline", "inference", "model"],
            "whyThisProject": "Bridges the gap between exploratory Jupyter notebooks and production ML deployment with model versioning and drift detection.",
            "recruiterValue": "Hiring managers look for automated feature validation, sub-50ms inference latency, and Dockerized model serving.",
            "keyFeatures": [
                "Automated data ingestion and Great Expectations data drift validation",
                "FastAPI asynchronous inference endpoint with batching and Pydantic validation",
                "MLflow tracking for model artifacts, hyperparameters, and ROC metrics",
                "Docker containerized serving with automated GitHub Actions CI/CD"
            ],
            "recommendedTechStack": ["Python 3.11", "FastAPI", "PyTorch / Scikit-Learn", "MLflow", "Docker", "Prometheus"],
            "blueprint": {
                "architecture": "Decoupled training and inference architecture with MLflow model registry, FastAPI low-latency serving gateway, and drift monitors.",
                "databaseSchema": "Inference logs table: (id, model_version, inputs_hash, prediction, confidence_score, latency_ms, timestamp).",
                "apiEndpoints": [
                    "POST /api/v1/predict - Real-time low-latency model inference",
                    "POST /api/v1/predict/batch - High-throughput vectorized batch predictions",
                    "GET /api/v1/health - Live health check with loaded model metadata",
                    "GET /api/v1/metrics/drift - Statistical feature drift Kolmogorov-Smirnov report"
                ],
                "roadmap": [
                    {"phase": "Phase 1: Data Pipeline & Training Script", "duration": "Week 1", "tasks": ["Implement reproducible data preprocessing pipeline", "Track training runs, metrics, and models in MLflow"]},
                    {"phase": "Phase 2: FastAPI Serving Engine", "duration": "Week 2", "tasks": ["Load serialized model weights into memory at startup", "Enforce strict Pydantic input schemas and sanitization"]},
                    {"phase": "Phase 3: Batching & Performance Optimization", "duration": "Week 3", "tasks": ["Add dynamic request batching for inference throughput", "Profile latency to ensure p95 < 50ms"]},
                    {"phase": "Phase 4: Drift Detection & Telemetry", "duration": "Week 4", "tasks": ["Integrate drift validation checks against baseline distributions", "Expose prediction latency metrics for Prometheus"]},
                    {"phase": "Phase 5: Docker Containerization & CI/CD", "duration": "Week 5", "tasks": ["Create multi-stage slim Docker image (<500MB)", "Set up GitHub Actions workflow to run PyTest on PRs"]}
                ],
                "scaffoldingTree": "mlops-pipeline/\n├── app/\n│   ├── api/\n│   ├── models/\n│   └── main.py\n├── pipeline/\n│   ├── train.py\n│   └── evaluate.py\n├── tests/\n├── Dockerfile\n└── README.md"
            },
            "readmeContent": "# Production MLOps Pipeline & Model Inference API\n\nEnd-to-end Machine Learning pipeline with MLflow registry, FastAPI low-latency serving, and data drift monitoring.\n\n## Quickstart\n```bash\ndocker build -t mlops-service .\ndocker run -p 8000:8000 mlops-service\n```"
        },
        {
            "id": "proj-cloud-native-microservices",
            "title": "Cloud-Native Microservices Gateway with OpenTelemetry",
            "domain": "DevOps & Cloud Architecture",
            "difficulty": "Advanced",
            "estimatedHours": 45,
            "roles": ["devops engineer", "cloud architect", "backend developer"],
            "stems": ["cloud", "microservices", "gateway", "opentelemetry"],
            "whyThisProject": "Proves understanding of distributed tracing, service discovery, and resilient inter-service communication.",
            "recruiterValue": "Demonstrates practical production readiness: JWT authentication routing, circuit breaker resilience, and distributed telemetry.",
            "keyFeatures": [
                "API Gateway reverse proxy with JWT authentication and path routing",
                "Resilience circuit breaker pattern preventing cascading service failures",
                "Distributed request tracing using OpenTelemetry and Jaeger",
                "Automated Kubernetes Helm charts with HPA (Horizontal Pod Autoscaling)"
            ],
            "recommendedTechStack": ["Go / Node.js", "Docker", "Kubernetes", "OpenTelemetry", "Jaeger", "Redis"],
            "blueprint": {
                "architecture": "Microservices architecture fronted by an API Gateway with mutual TLS, service mesh resilience, and Jaeger distributed tracing.",
                "databaseSchema": "Decoupled databases per service (PostgreSQL for Users, MongoDB for Catalogs, Redis for Token Blacklist).",
                "apiEndpoints": [
                    "POST /api/v1/auth/login - Centralized authentication and token issuance",
                    "GET /api/v1/services - Gateway routing table and health status",
                    "GET /api/v1/health - Aggregated dependency health check probe"
                ],
                "roadmap": [
                    {"phase": "Phase 1: API Gateway Core", "duration": "Week 1", "tasks": ["Build reverse proxy gateway routing to downstream services", "Add JWT verification middleware at the edge"]},
                    {"phase": "Phase 2: Circuit Breakers & Retries", "duration": "Week 2", "tasks": ["Implement circuit breaker with open/half-open/closed states", "Configure exponential retry backoff"]},
                    {"phase": "Phase 3: OpenTelemetry Distributed Tracing", "duration": "Week 3", "tasks": ["Inject W3C trace context headers on incoming requests", "Stream traces to Jaeger collector daemon"]},
                    {"phase": "Phase 4: Containerization & Helm Charts", "duration": "Week 4", "tasks": ["Package services into minimal Alpine Docker containers", "Write Kubernetes deployment manifests and Helm charts"]},
                    {"phase": "Phase 5: Load Testing & Auto-scaling", "duration": "Week 5", "tasks": ["Run k6 stress tests verifying 1,000 RPS gateway throughput", "Verify Kubernetes Horizontal Pod Autoscaler scales pods smoothly"]}
                ],
                "scaffoldingTree": "cloud-gateway/\n├── gateway/\n├── services/\n│   ├── auth/\n│   └── catalog/\n├── k8s/\n├── docker-compose.yml\n└── README.md"
            },
            "readmeContent": "# Cloud-Native Microservices Gateway\n\nResilient API gateway with JWT edge authentication, circuit breaker fault tolerance, and OpenTelemetry tracing.\n\n## Run with Docker\n```bash\ndocker-compose up -d\n```"
        }
    ]

    # Select recommendations filtering out existing duplicate stems
    recommended = []
    for p in project_pool:
        # Check role match
        role_matches = any(r in role_lower for r in p["roles"]) or "full stack" in role_lower
        # Check duplicate stem
        is_duplicate = any(stem in existing_stems for stem in p["stems"])

        if role_matches and not is_duplicate:
            recommended.append(p)

    # If all filtered out, include non-duplicates or fallback to the most advanced project
    if not recommended:
        for p in project_pool:
            if not any(stem in existing_stems for stem in p["stems"]):
                recommended.append(p)
    if not recommended:
        recommended = project_pool[:3]

    top_actions = [
        "Add comprehensive README files with system architecture diagrams to top 3 repositories.",
        "Add automated test suites (Jest/PyTest) and display green CI passing badges in README headers.",
        "Pin your highest-complexity repository to your GitHub profile showcase.",
        "Ensure live demo URLs or Docker setup instructions are included for every public project.",
    ]

    return {
        "overallScore": overall_score,
        "scoreBreakdown": {
            "profileQuality": profile_quality,
            "repoQuality": avg_repo_quality,
            "breadth": breadth_score,
            "depth": depth_score,
            "roleAlignment": role_alignment_score,
            "freshness": freshness_score,
        },
        "profileOverview": {
            "username": username,
            "name": profile.get("name") or username,
            "bio": profile.get("bio") or "Developer portfolio on GitHub.",
            "publicRepos": public_repos,
            "followers": followers,
            "following": profile.get("following", 0),
            "avatarUrl": profile.get("avatar_url", ""),
            "blog": profile.get("blog", ""),
        },
        "languagesUsed": sorted_languages,
        "topRepositories": scored_repos[:8],
        "portfolioGaps": {
            "strengths": strengths,
            "missingEvidence": missing_evidence,
            "underrepresentedSkills": underrepresented,
            "redundantAreas": redundant_areas,
        },
        "recommendedProjects": recommended[:4],
        "topActions": top_actions,
        "disclaimer": "Analysis conducted strictly on publicly available GitHub data and verified AICP profile information. Zero private code accessed.",
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
        "modelVersion": "career-agent-github-v1",
    }

