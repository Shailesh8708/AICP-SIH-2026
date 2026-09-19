from pathlib import Path
import re

from fastapi import FastAPI
from pydantic import BaseModel, Field
from .schemas import CareerRequest, MatchRequest, MatchResponse, ResumeAnalyzeRequest, ResumeAnalyzeResponse, ResumeOperationRequest, SkillsRequest, SkillResult, TextRequest
from .utils import ONTOLOGY, normalize_skill, extract_skills

try:
    from joblib import load
except ImportError:  # pragma: no cover - deployment dependency guard
    load = None

app = FastAPI(title="AICP AI Service", version="1.0.0")
MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "skill_matcher.joblib"
model = None


class PredictionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    skills: list[str] = Field(default_factory=list, max_length=100)
    target_role: str = Field(default="", max_length=200)


class PredictionResponse(BaseModel):
    label: str
    confidence: float
    scores: dict[str, float]
    model_version: str


_model_attempted = False


def get_model():
    global model, _model_attempted
    if not _model_attempted:
        _model_attempted = True
        if load is not None and MODEL_PATH.exists():
            try:
                model = load(MODEL_PATH)
            except Exception:
                model = None
    return model


def predict(request: PredictionRequest) -> PredictionResponse:
    combined = f"{request.text} {' '.join(request.skills)} {request.target_role}".strip()
    trained_model = get_model()
    if trained_model is not None:
        scores = trained_model.predict_proba([combined])[0]
        labels = trained_model.classes_
        ranked = sorted(zip(labels, scores), key=lambda item: item[1], reverse=True)
        return PredictionResponse(
            label=ranked[0][0],
            confidence=round(float(ranked[0][1]), 4),
            scores={label: round(float(score), 4) for label, score in ranked},
            model_version="skill-matcher-v1",
        )

    has_signal = bool(request.skills or request.target_role)
    label = "strong_match" if has_signal else "skill_gap"
    return PredictionResponse(
        label=label,
        confidence=0.5,
        scores={label: 0.5},
        model_version="fallback-v1",
    )


def _tokens(value: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) > 2}


def calculate_match(request: MatchRequest) -> MatchResponse:
    normalized_student = {normalize_skill(skill) or skill.strip() for skill in request.student_skills if skill.strip()}
    required = {normalize_skill(skill) or skill.strip() for skill in request.required_skills if skill.strip()}
    preferred = {normalize_skill(skill) or skill.strip() for skill in request.preferred_skills if skill.strip()}
    matched_required = sorted(normalized_student & required)
    matched_preferred = sorted(normalized_student & preferred)
    missing = sorted(required - normalized_student)

    student_text = " ".join([request.student_text, *normalized_student, request.target_role, *request.career_interests])
    opportunity_text = " ".join([request.title, request.description, *required, *preferred])
    student_tokens = _tokens(student_text)
    opportunity_tokens = _tokens(opportunity_text)
    text_similarity = len(student_tokens & opportunity_tokens) / max(len(student_tokens | opportunity_tokens), 1)
    required_score = len(matched_required) / max(len(required), 1)
    preferred_score = len(matched_preferred) / max(len(preferred), 1)
    eligibility = True
    explanation = []

    if request.opportunity_location and request.location:
        eligibility = request.opportunity_location.lower() == "remote" or request.location.lower() in request.opportunity_location.lower()
    if request.opportunity_education and request.education:
        eligibility = eligibility and request.opportunity_education.lower() in request.education.lower()
    if request.opportunity_experience and request.experience:
        eligibility = eligibility and request.opportunity_experience.lower() in request.experience.lower()

    has_profile_signal = bool(normalized_student or student_tokens)
    score = (required_score * 0.55) + (preferred_score * 0.15) + (text_similarity * 0.2)
    if not has_profile_signal:
        score = 0
    if not eligibility:
        score *= 0.5
    score = round(min(score, 1.0), 4)
    if matched_required:
        explanation.append(f"{len(matched_required)}/{len(required)} required skills match")
    if matched_preferred:
        explanation.append(f"{len(matched_preferred)} preferred skills match")
    if text_similarity:
        explanation.append("Profile language overlaps with the opportunity description")
    explanation.append("Eligibility requirements match" if eligibility else "One or more eligibility requirements do not match")

    return MatchResponse(
        match=score,
        confidence=round(min(0.5 + (len(required) / 20), 0.95), 4) if has_profile_signal else 0,
        model_version="hybrid-matching-v1",
        matched_skills=matched_required,
        missing_skills=missing,
        matched_preferred_skills=matched_preferred,
        eligible=eligibility,
        explanation=explanation,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "model": "loaded" if get_model() is not None else "fallback"}


@app.post("/predict", response_model=PredictionResponse)
def prediction(request: PredictionRequest) -> PredictionResponse:
    return predict(request)


@app.post("/match", response_model=MatchResponse)
def match(request: MatchRequest) -> MatchResponse:
    return calculate_match(request)


@app.post("/extract-skills", response_model=list[SkillResult])
def extract_skill_endpoint(request: TextRequest) -> list[SkillResult]:
    return extract_skills(request.text)


@app.post("/normalize-skills")
def normalize_skills(request: SkillsRequest) -> dict[str, list[str]]:
    normalized = sorted({skill for value in request.skills if (skill := normalize_skill(value))})
    return {"skills": normalized, "unknown": sorted(set(request.skills) - set(normalized))}


def find_career_in_ontology(target_role: str):
    role_clean = (target_role or "").strip().lower()
    if not role_clean or len(role_clean) < 2:
        return None, None
    for name, defn in ONTOLOGY.get("careers", {}).items():
        if name.lower() == role_clean or role_clean in [a.lower() for a in defn.get("aliases", [])]:
            return name, defn
    for name, defn in ONTOLOGY.get("careers", {}).items():
        for alias in defn.get("aliases", []):
            tokens = alias.lower().split()
            if len(tokens) >= 2 and all(t in role_clean for t in tokens):
                return name, defn
    distinct_keywords = [
        ("fullstack", "Full Stack Developer"),
        ("frontend", "Frontend Developer"),
        ("backend", "Backend Developer"),
        ("devops", "DevOps Engineer"),
        ("cybersecurity", "Cybersecurity Analyst"),
        ("infosec", "Cybersecurity Analyst"),
        ("machine learning", "Machine Learning Engineer"),
        ("data science", "Data Scientist"),
        ("data analyst", "Data Analyst"),
        ("cloud", "Cloud Engineer"),
        ("software engineer", "Software Developer"),
    ]
    for kw, role_name in distinct_keywords:
        if kw in role_clean and role_name in ONTOLOGY.get("careers", {}):
            return role_name, ONTOLOGY["careers"][role_name]
    return None, None


@app.post("/skill-gap")
def skill_gap(request: SkillsRequest) -> dict:
    canonical_name, career = find_career_in_ontology(request.target_role)
    if not career:
        return {
            "is_valid_role": False,
            "target_role": request.target_role,
            "error": "Unsupported Career Role",
            "message": f"The role '{request.target_role}' is not recognized as a supported educational or industry career path in AICP. Please enter a relevant career role such as Software Developer, Data Analyst, AI/ML Engineer, Full Stack Developer, etc.",
            "suggested_roles": [
                "Software Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer",
                "Data Analyst", "Data Scientist", "Machine Learning Engineer", "Cloud Engineer", "DevOps Engineer", "Cybersecurity Analyst"
            ],
            "readiness_score": 0,
            "strengths": [],
            "matched_skills": [],
            "partial_skills": [],
            "missing_skills": [],
            "gaps": [],
            "roadmap": None,
            "recommended_programs": [],
        }

    current = {normalize_skill(skill) or skill for skill in request.skills}
    required = career.get("skills", [])
    core_set = set(career.get("core_skills", required[:6]))

    matched_skills = []
    partial_skills = []
    missing_skills = []

    for req_skill in required:
        norm_skill = normalize_skill(req_skill) or req_skill
        skill_meta = ONTOLOGY.get("skills", {}).get(norm_skill.lower(), {})
        prereqs = [normalize_skill(p) or p for p in skill_meta.get("prerequisites", [])]
        is_core = norm_skill in core_set or req_skill in core_set

        if norm_skill in current or req_skill in current:
            matched_skills.append({
                "skill": norm_skill,
                "status": "matched",
                "isCore": is_core,
                "difficulty": skill_meta.get("difficulty", "Beginner"),
            })
        else:
            known_prereqs = [p for p in prereqs if p in current]
            if known_prereqs:
                partial_skills.append({
                    "skill": norm_skill,
                    "status": "partial",
                    "isCore": is_core,
                    "priority": "High" if is_core else "Medium",
                    "knownPrerequisites": known_prereqs,
                    "allPrerequisites": prereqs,
                    "reason": f"You already have foundational knowledge in {', '.join(known_prereqs)}, which provides the conceptual bridge to master {norm_skill}.",
                })
            else:
                missing_skills.append({
                    "skill": norm_skill,
                    "status": "missing",
                    "isCore": is_core,
                    "priority": "High" if is_core else "Medium",
                    "allPrerequisites": prereqs,
                    "reason": f"Core fundamental competency required for {canonical_name}." if is_core else f"Recommended competency to elevate {canonical_name} readiness.",
                })

    total_req = len(required)
    raw_score = ((len(matched_skills) * 1.0 + len(partial_skills) * 0.5) / max(total_req, 1)) * 100
    readiness_score = min(100, round(raw_score))

    combined_gaps = [
        {"skill": p["skill"], "importance": p["priority"].lower(), "reason": p["reason"], "status": "partial", "priority": p["priority"], "knownPrerequisites": p["knownPrerequisites"]}
        for p in partial_skills
    ] + [
        {"skill": m["skill"], "importance": m["priority"].lower(), "reason": m["reason"], "status": "missing", "priority": m["priority"]}
        for m in missing_skills
    ]

    # Build company recommendations
    all_gaps_set = {normalize_skill(g["skill"]) or g["skill"] for g in combined_gaps}
    recommended_programs = []
    for prog in ONTOLOGY.get("company_programs", []):
        prog_skills = [normalize_skill(s) or s for s in prog.get("skills", [])]
        matched_in_prog = [s for s in prog_skills if s in all_gaps_set]
        if matched_in_prog:
            score = len(matched_in_prog) * 25 + (15 if canonical_name.lower() in prog.get("program_name", "").lower() else 0)
            recommended_programs.append({
                "company": prog.get("provider"),
                "programName": prog.get("program_name"),
                "skillsCovered": prog.get("skills", [])[:5],
                "matchedMissingSkills": matched_in_prog,
                "matchScore": min(98, score + 40),
                "badgeLabel": prog.get("badge_label"),
                "officialUrl": prog.get("official_url"),
                "whyRecommended": f"This program covers {', '.join(matched_in_prog[:3])}, which are among your highest-priority missing skills for {canonical_name}."
            })
    recommended_programs.sort(key=lambda x: x["matchScore"], reverse=True)

    # Build roadmap
    p_tasks = [f"Learn {p['skill']}: {p['reason']}" for p in partial_skills[:2]] or [f"Master {m['skill']} fundamentals" for m in missing_skills[:2]]
    roadmap = {
        "targetRole": canonical_name,
        "readinessScore": readiness_score,
        "disclaimer": "This roadmap is dynamically generated from your actual skill gaps and verified AICP ontology.",
        "day7": {
            "title": "Phase 1: Foundation & Prerequisite Bridges (Days 1–14)",
            "tasks": p_tasks if p_tasks else [f"Review advanced concepts in {matched_skills[0]['skill']}" if matched_skills else "Review software fundamentals"],
        },
        "day30": {
            "title": "Phase 2: Core Competencies & Architecture (Days 15–35)",
            "tasks": [f"Build intermediate exercises with {g['skill']}" for g in combined_gaps[1:4]] or ["Complete core architectural case studies"],
        },
        "day60": {
            "title": "Phase 3: Integration & Capstone Build (Days 36–65)",
            "tasks": [f"Develop an end-to-end practical project integrating {', '.join([g['skill'] for g in combined_gaps[:3]] or ['core skills'])}", "Push source code with automated unit tests to GitHub with comprehensive documentation"],
        },
        "day90": {
            "title": "Phase 4: Specialization & Placement Readiness (Days 66–90)",
            "tasks": [f"Polish ATS resume highlighting achievements in {canonical_name}", f"Complete 5+ AICP technical mock interviews for {canonical_name}", "Apply to verified internship and placement opportunities on AICP"],
        },
    }

    return {
        "is_valid_role": True,
        "target_role": canonical_name,
        "readiness_score": readiness_score,
        "strengths": [s["skill"] for s in matched_skills],
        "matched_skills": matched_skills,
        "partial_skills": partial_skills,
        "missing_skills": missing_skills,
        "gaps": combined_gaps,
        "roadmap": roadmap,
        "recommended_programs": recommended_programs[:4],
        "recommended_next": career.get("next", []),
    }



@app.post("/career-recommendation")
def career_recommendation(request: CareerRequest) -> dict:
    current = {normalize_skill(skill) or skill for skill in request.skills}
    recommendations = []
    for role, career in ONTOLOGY["careers"].items():
        overlap = len(current & set(career["skills"]))
        if overlap:
            recommendations.append({"career": role, "matched_skills": sorted(current & set(career["skills"])), "missing_skills": sorted(set(career["skills"]) - current), "reason": "Matches your current skill evidence"})
    recommendations.sort(key=lambda item: len(item["matched_skills"]), reverse=True)
    return {"recommendations": recommendations}


@app.post("/learning-recommendation")
def learning_recommendation(request: SkillsRequest) -> dict:
    gap_result = skill_gap(request)
    return {"target_role": request.target_role, "roadmap": [f"Learn {item['skill']}" for item in gap_result.get("gaps", [])] + ["Build a project that demonstrates the target skills", "Apply the skills in a relevant opportunity"]}


@app.post('/resume/analyze', response_model=ResumeAnalyzeResponse)
def resume_analyze(request: ResumeAnalyzeRequest) -> ResumeAnalyzeResponse:
    resume = request.resume or {}
    sections = []
    for name in ['summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'achievements']:
        value = resume.get(name)
        present = bool(value.strip()) if isinstance(value, str) else bool(value)
        sections.append({'name': name, 'present': present})

    skills = [str(skill).strip() for skill in resume.get('skills', []) if str(skill).strip()]
    if not skills and request.resume_text:
        skills = [item.name for item in extract_skills(request.resume_text)]
    normalized = {normalize_skill(skill) or skill for skill in skills}
    opportunity = request.opportunity or {}
    required = [str(skill).strip() for skill in opportunity.get('requiredSkills', []) if str(skill).strip()]
    normalized_required = {normalize_skill(skill) or skill for skill in required}
    matched = sorted(normalized & normalized_required)
    missing = sorted(normalized_required - normalized)
    keyword_score = len(matched) / max(len(normalized_required), 1)
    section_score = sum(section['present'] for section in sections) / max(len(sections), 1)
    warnings = []
    if not resume.get('summary'):
        warnings.append('Add a concise professional summary.')
    if not resume.get('projects'):
        warnings.append('Add at least one project with evidence.')
    if not resume.get('experience'):
        warnings.append('Add experience or clarify that you are seeking your first role.')
    alignment = None
    if opportunity:
        alignment = {
            'matchedSkills': matched,
            'missingSkills': missing,
            'explanation': 'Required skills are represented in the resume.' if not missing else 'Some required skills are not present in the resume skills section.',
        }
    return ResumeAnalyzeResponse(
        score=round((section_score * 55) + (keyword_score * 45)),
        sections=sections,
        missingSkills=missing,
        jobAlignment=alignment,
        warnings=warnings,
        extractedSkills=sorted(normalized),
        modelVersion='ontology-resume-review-v1',
    )


@app.post('/resume/operation')
def resume_operation(request: ResumeOperationRequest) -> dict:
    resume = request.resume or {}
    facts = request.facts or resume
    skills = [str(skill) for skill in facts.get('skills', []) if str(skill).strip()]
    operation = request.operation.lower()
    if operation in {'improve_summary', 'improve_project', 'improve_experience', 'improve_achievement'}:
        source = request.text.strip()
        return {
            'operation': operation,
            'suggestion': source,
            'why': ['Preserves the supplied factual content.', 'No unsupported metrics or technologies were added.'],
            'unsupportedClaims': [],
            'requiresApproval': True,
            'modelVersion': 'grounded-editor-v1',
        }
    if operation == 'generate_summary':
        name = facts.get('personal', {}).get('name', '')
        focus = ', '.join(skills[:5])
        suggestion = f'{name} is developing practical capability in {focus}.' if name and focus else 'Add a concise summary using your verified skills, education, and projects.'
        return {'operation': operation, 'suggestion': suggestion, 'why': ['Uses only supplied profile facts.'], 'unsupportedClaims': [], 'requiresApproval': True, 'modelVersion': 'grounded-editor-v1'}
    if operation in {'tailor_resume', 'analyze_resume'}:
        required = [str(skill) for skill in (request.opportunity or {}).get('requiredSkills', [])]
        normalized = {normalize_skill(skill) or skill for skill in skills}
        matched = sorted([skill for skill in required if (normalize_skill(skill) or skill) in normalized])
        missing = sorted([skill for skill in required if skill not in matched])
        return {'operation': operation, 'matchedSkills': matched, 'missingSkills': missing, 'suggestions': [f'Highlight verified evidence for {skill}.' for skill in matched], 'warnings': [f'Do not add {skill} unless you actually have it.' for skill in missing], 'modelVersion': 'grounded-editor-v1'}
    return {'operation': 'chat', 'answer': 'I can help improve or analyze supplied resume content. I will keep every suggestion grounded in your verified facts.', 'suggestions': [], 'unsupportedClaims': [], 'modelVersion': 'grounded-editor-v1'}


# Mount career agent router last (after app and shared functions are defined)
from .api.routes.career_agent import router as career_agent_router  # noqa: E402
app.include_router(career_agent_router)
