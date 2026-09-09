from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from typing import Dict, Any, List

router = APIRouter(prefix="/ai", tags=["AI Intelligence Engine"])

@router.post("/match-projects")
def ai_match_projects(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found for current user")

    verified_skill_names = [s["name"].lower() for s in (profile.skills_json or []) if s.get("verified")]

    all_tasks = db.query(models.ProjectTask, models.Project).join(models.Project, models.ProjectTask.project_id == models.Project.id).filter(models.ProjectTask.status != "DONE").all()

    matched_results = []
    for task, proj in all_tasks:
        tech_stack = [t.lower() for t in (proj.tech_stack_json or [])]
        overlap = set(verified_skill_names).intersection(set(tech_stack))

        if verified_skill_names and tech_stack:
            match_score = round(100 * len(overlap) / len(set(tech_stack)))
        else:
            match_score = None

        if overlap:
            rationale = f"Student verified skills overlap project tech stack: {', '.join(sorted(overlap))}"
        else:
            rationale = "No verified skill overlap with this project's tech stack."

        matched_results.append({
            "task_id": task.id,
            "task_title": task.title,
            "project_id": proj.id,
            "project_title": proj.title,
            "priority": task.priority,
            "match_percentage": match_score,
            "matched_skills": sorted(overlap),
            "match_rationale": rationale
        })

    matched_results.sort(key=lambda x: x["match_percentage"] or 0, reverse=True)
    return {
        "student_id": profile.user_id,
        "reputation_score": profile.reputation_score,
        "total_matched_open_tasks": len(matched_results),
        "matches": matched_results
    }

@router.post("/summarize-profile")
def ai_summarize_profile(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    student_id = payload.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    user = db.query(models.User).filter(models.User.id == profile.user_id).first()
    contribs = db.query(models.Contribution).filter(models.Contribution.contributor_id == profile.user_id).all()
    certs = db.query(models.Certificate).filter(models.Certificate.recipient_id == profile.user_id).all()
    badges = db.query(models.Badge).filter(models.Badge.user_id == profile.user_id).all()

    total_pr_count = len(contribs)
    total_lines_added = sum(c.lines_added or 0 for c in contribs)
    total_lines_deleted = sum(c.lines_deleted or 0 for c in contribs)
    skills_list = [s["name"] for s in (profile.skills_json or []) if s.get("verified")]

    pr_count = sum(1 for c in contribs if c.pr_number)
    commit_count = total_pr_count - pr_count

    # Strict evidence-based bulleted summary (from stored records only)
    summary_bullets = [
        f"Verified Developer Identity: {user.full_name} ({profile.department}, {profile.college_name}).",
        f"Contribution Record: {total_pr_count} stored contribution(s): {pr_count} pull request(s) and {commit_count} commit(s), with +{total_lines_added}/-{total_lines_deleted} recorded lines.",
        f"Verified Core Tech Stack: {', '.join(skills_list) if skills_list else 'No verified skills recorded'}.",
        f"Reputation Score: {profile.reputation_score} points on record.",
        f"Credentials: {len(certs)} official verified certificates and {len(badges)} milestone badges awarded."
    ]

    return {
        "student_id": profile.user_id,
        "full_name": user.full_name,
        "evidence_summary_bullets": summary_bullets,
        "grounded_verification": "Summary generated from stored database records only."
    }

@router.post("/natural-search")
def ai_natural_search(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    query = payload.get("query", "").lower()
    students = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id).all()

    results = []
    for profile, user in students:
        skills = [s["name"].lower() for s in (profile.skills_json or [])]
        dept = (profile.department or "").lower()
        bio = (profile.bio or "").lower()

        matched_keywords = []
        for term in query.split():
            if any(term in sk for sk in skills) or term in dept or term in bio:
                matched_keywords.append(term)

        search_terms = [t for t in query.split() if len(t) > 2]
        relevance = round(100 * len(set(matched_keywords)) / len(search_terms)) if search_terms else None

        results.append({
            "user_id": user.id,
            "full_name": user.full_name,
            "college_name": profile.college_name,
            "department": profile.department,
            "reputation_score": profile.reputation_score,
            "relevance_score": relevance,
            "matched_keywords": sorted(set(matched_keywords)),
            "avatar_url": user.avatar_url,
            "skills": profile.skills_json
        })

    results.sort(key=lambda x: x["relevance_score"] if x["relevance_score"] is not None else -1, reverse=True)
    return {
        "query": payload.get("query", ""),
        "total_results": len(results),
        "candidates": results
    }

@router.post("/match-candidate")
def ai_match_candidate(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    requirements = payload.get("requirements", "FastAPI Python Distributed Systems").lower()
    students = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id).all()

    rankings = []
    for profile, user in students:
        contribs = db.query(models.Contribution).filter(models.Contribution.contributor_id == user.id).all()
        skills = [s["name"].lower() for s in (profile.skills_json or []) if s.get("verified")]

        bullets = []
        req_terms = [t.lower() for t in requirements.split() if len(t) > 2]
        matched_terms = [t for t in req_terms if any(t in sk for sk in skills)]
        matched_count = len(set(matched_terms))
        score = round(100 * matched_count / len(req_terms)) if req_terms else None

        if matched_terms:
            bullets.append(f"Verified expertise matches requirements: {', '.join(sorted(set(skills))[:3])}")
        if len(contribs) > 0:
            bullets.append(f"{len(contribs)} stored contribution(s) on record")
        if profile.reputation_score and profile.reputation_score > 0:
            bullets.append(f"Reputation score: {profile.reputation_score} pts")

        rankings.append({
            "student_id": profile.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "college_name": profile.college_name,
            "department": profile.department,
            "match_score": score,
            "skills": profile.skills_json,
            "reasoning_bullets": bullets,
            "avatar_url": user.avatar_url,
            "github_handle": profile.github_handle
        })

    rankings.sort(key=lambda x: x["match_score"] if x["match_score"] is not None else -1, reverse=True)
    return {
        "requirements": requirements,
        "total_ranked": len(rankings),
        "rankings": rankings
    }

@router.post("/summarize-pr")
def ai_summarize_pr(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    pr_number = payload.get("pr_number")
    if pr_number is None:
        raise HTTPException(status_code=400, detail="pr_number is required")
    pr_title = payload.get("pr_title")

    # Ground the summary in real stored contribution records for this PR.
    query = db.query(models.Contribution).filter(models.Contribution.pr_number == pr_number)
    if pr_title:
        query = query.filter(models.Contribution.pr_title == pr_title)
    contribs = query.all()

    if not contribs:
        return {
            "pr_number": pr_number,
            "pr_title": pr_title,
            "summary": "No stored contribution record found for this pull request.",
            "skills_proved": [],
            "reputation_points": 0,
            "grounded": True,
        }

    top = contribs[0]
    lines_added = sum(c.lines_added or 0 for c in contribs)
    lines_deleted = sum(c.lines_deleted or 0 for c in contribs)
    return {
        "pr_number": pr_number,
        "pr_title": top.pr_title or top.commit_message,
        "summary": f"Pull Request #{pr_number} ('{top.pr_title or top.commit_message}') is recorded as a merged contribution by {top.contributor_name}: +{lines_added}/-{lines_deleted} verified lines across {len(contribs)} stored record(s).",
        "skills_proved": [],
        "reputation_points": 0,
        "grounded": True,
    }

@router.post("/assistant")
def ai_assistant(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    question = payload.get("question", "").lower()
    project_id = payload.get("project_id")
    if project_id is None:
        raise HTTPException(status_code=400, detail="project_id is required")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Grounded answers using only real project fields and real stored tasks.
    if "task" in question or "todo" in question:
        open_tasks = db.query(models.ProjectTask).filter(
            models.ProjectTask.project_id == project.id,
            models.ProjectTask.status != "DONE",
        ).all()
        if open_tasks:
            task_titles = "; ".join(t.title for t in open_tasks[:5])
            reply = f"In repository '{project.title}', pending task(s): {task_titles}."
        else:
            reply = f"In repository '{project.title}', there are no pending tasks recorded."
    elif "setup" in question or "run" in question:
        if project.repo_url:
            reply = f"Project '{project.title}' can be run from its repository: {project.repo_url}. Tech stack: {', '.join(project.tech_stack_json or [])}."
        else:
            reply = f"Project '{project.title}' has no repository URL recorded. Tech stack: {', '.join(project.tech_stack_json or [])}."
    else:
        reply = f"Project '{project.title}' is a {project.project_type} project ({project.status}). Tech stack: {', '.join(project.tech_stack_json or [])}. Scope: {project.scope}."

    return {
        "project_id": project_id,
        "question": payload.get("question"),
        "answer": reply,
        "source": "PoOS Grounded AI Architecture Engine",
    }

