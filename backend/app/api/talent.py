from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles

COMPANY_ONLY = require_roles("IT_COMPANY", "NON_IT_COMPANY")
from app.models import models
from app.schemas import schemas
from typing import List, Optional

router = APIRouter(prefix="/talent", tags=["Talent Discovery"])

@router.get("/it-search")
def it_talent_search(
    tech_stack: Optional[str] = None,
    college: Optional[str] = None,
    department: Optional[str] = None,
    domain: Optional[str] = None,
    min_reputation: Optional[int] = 0,
    current_user: models.User = Depends(COMPANY_ONLY),
    db: Session = Depends(get_db)
):
    query = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id)
    
    if min_reputation:
        query = query.filter(models.StudentProfile.reputation_score >= min_reputation)
    if college:
        query = query.filter(models.StudentProfile.college_name.ilike(f"%{college}%"))
    if department:
        query = query.filter(models.StudentProfile.department.ilike(f"%{department}%"))
    
    results = []
    for profile, user in query.all():
        contribs = db.query(models.Contribution).filter(models.Contribution.contributor_id == user.id).all()
        projects = db.query(models.Project).filter(models.Project.owner_id == user.id).all()
        skills = profile.skills_json or []

        # Filter by tech stack if specified
        if tech_stack:
            terms = [t.strip().lower() for t in tech_stack.split() if len(t.strip()) > 1]
            skills_str = " ".join([s["name"].lower() for s in skills if isinstance(s, dict) and "name" in s])
            if terms and not any(term in skills_str for term in terms):
                continue

        results.append({
            "id": profile.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "college_name": profile.college_name,
            "department": profile.department,
            "reputation_score": profile.reputation_score,
            "github_handle": profile.github_handle,
            "verified": profile.verified_by_college,
            "skills": skills,
            "avatar_url": user.avatar_url,
            "contributions_count": len(contribs),
            "projects_count": len(projects),
            "experience_level": f"{profile.year_of_study} · {len(skills)} Verified Core Skills"
        })
    return results

@router.get("/non-it-search")
def non_it_talent_search(
    domain: Optional[str] = None,
    college: Optional[str] = None,
    min_reputation: Optional[int] = 0,
    current_user: models.User = Depends(COMPANY_ONLY),
    db: Session = Depends(get_db)
):
    query = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id)
    if min_reputation:
        query = query.filter(models.StudentProfile.reputation_score >= min_reputation)
    
    results = []
    for profile, user in query.all():
        contribs = db.query(models.Contribution).filter(models.Contribution.contributor_id == user.id).all()
        results.append({
            "id": profile.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "college_name": profile.college_name,
            "department": profile.department,
            "reputation_score": profile.reputation_score,
            "verified": profile.verified_by_college,
            "skills": profile.skills_json,
            "avatar_url": user.avatar_url,
            "contributions_count": len(contribs),
            "experience_level": profile.year_of_study
        })
    return results


@router.post("/shortlist", status_code=status.HTTP_201_CREATED)
def add_to_shortlist(shortlist_in: schemas.ShortlistCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("IT_COMPANY", "NON_IT_COMPANY"):
        raise HTTPException(status_code=403, detail="Only company accounts can shortlist candidates")
    cid = user.id

    student_user = db.query(models.User).filter(models.User.id == shortlist_in.student_id).first()
    if not student_user:
        prof = db.query(models.StudentProfile).filter(models.StudentProfile.id == shortlist_in.student_id).first()
        if prof:
            student_user = db.query(models.User).filter(models.User.id == prof.user_id).first()
    if not student_user:
        raise HTTPException(status_code=404, detail="Student not found")

    student_name = student_user.full_name if student_user else shortlist_in.student_id
    sid = student_user.id

    item = models.Shortlist(
        company_id=cid,
        student_id=sid,
        student_name=student_name,
        category=shortlist_in.category,
        notes=shortlist_in.notes
    )
    db.add(item)
    db.commit()
    return {"status": "success", "message": f"{student_name} added to shortlist"}

@router.post("/contact-request", status_code=status.HTTP_201_CREATED)
def send_contact_request(req_in: schemas.ContactRequestCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ("IT_COMPANY", "NON_IT_COMPANY"):
        raise HTTPException(status_code=403, detail="Only company accounts can send contact requests")
    cid = user.id

    student_user = db.query(models.User).filter(models.User.id == req_in.student_id).first()
    if not student_user:
        prof = db.query(models.StudentProfile).filter(models.StudentProfile.id == req_in.student_id).first()
        if prof:
            student_user = db.query(models.User).filter(models.User.id == prof.user_id).first()
    if not student_user:
        raise HTTPException(status_code=404, detail="Student not found")

    company_name = user.full_name
    student_name = student_user.full_name
    sid = student_user.id

    req = models.ContactRequest(
        company_id=cid,
        student_id=sid,
        company_name=company_name,
        student_name=student_name,
        opportunity_type=req_in.opportunity_type,
        message=req_in.message
    )
    db.add(req)
    db.commit()
    return {"status": "success", "message": f"Direct contact request sent to {student_name}"}

@router.post("/search-jd")
def search_talent_by_jd(
    payload: schemas.JDSearchRequest,
    current_user: models.User = Depends(COMPANY_ONLY),
    db: Session = Depends(get_db)
):
    """
    Intelligently match and rank candidate profiles against Job Descriptions (JD),
    skills, domain expertise, and active repository project work.
    """
    jd_text = (payload.job_description or "").lower()
    skill_filter = (payload.skills or "").lower()
    domain_filter = (payload.domain_expertise or "").lower()
    college_filter = (payload.college or "").lower()

    query = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id)
    if college_filter:
        query = query.filter(models.StudentProfile.college_name.ilike(f"%{college_filter}%"))

    candidates = query.all()
    results = []

    search_corpus = f"{jd_text} {skill_filter} {domain_filter}"
    search_words = set([w.strip() for w in search_corpus.split() if len(w.strip()) > 2])
    search_terms = [w for w in search_words]

    for profile, user in candidates:
        contribs = db.query(models.Contribution).filter(models.Contribution.contributor_id == user.id).all()
        projects = db.query(models.Project).filter(models.Project.owner_id == user.id).all()
        skills = profile.skills_json or []

        reasoning = []
        matched_skills = []
        matched_projects = []
        matched_keywords = 0

        # 1. Skill Match
        cand_skills = [s["name"] for s in skills if isinstance(s, dict) and "name" in s]
        cand_skills_lower = [s.lower() for s in cand_skills]
        for term in search_terms:
            if any(term in sk for sk in cand_skills_lower) or (skill_filter and skill_filter in sk for sk in cand_skills_lower):
                matched_keywords += 1
        for sk in cand_skills:
            if skill_filter and skill_filter in sk.lower():
                matched_skills.append(sk)
            elif any(term in sk.lower() for term in search_terms):
                matched_skills.append(sk)

        # 2. Project Match
        for proj in projects:
            p_tech = " ".join(proj.tech_stack_json or []).lower()
            if any(term in proj.title.lower() or term in p_tech for term in search_terms):
                matched_projects.append(proj.title)

        # 3. Domain & Department Alignment
        dept = (profile.department or "").lower()
        bio = (profile.bio or "").lower()
        domain_aligned = any(term in dept or term in bio for term in search_terms)
        if domain_aligned:
            reasoning.append(f"Department & Bio align with domain ({profile.department})")

        # 4. Verified Contributions Evidence
        if len(contribs) > 0:
            reasoning.append(f"{len(contribs) or 0} contributions recorded in database")

        if matched_skills:
            reasoning.insert(0, f"Verified technical skills match JD: {', '.join(sorted(set(matched_skills))[:3])}")
        if matched_projects:
            reasoning.insert(1, f"Maintains aligned project repositories: {', '.join(sorted(set(matched_projects))[:2])}")

        # Real keyword-overlap match score computed from the JD terms and the
        # candidate's verified skills/domain only. Reports None when there is no
        # query to match against, rather than inventing a percentage.
        if not search_terms:
            match_score = None
        else:
            match_score = round(100 * matched_keywords / len(search_terms))

        results.append({
            "id": profile.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "college_name": profile.college_name,
            "department": profile.department,
            "reputation_score": profile.reputation_score,
            "github_handle": profile.github_handle,
            "verified": profile.verified_by_college,
            "skills": skills,
            "avatar_url": user.avatar_url,
            "match_score": match_score,
            "matched_skills": sorted(set(matched_skills)),
            "matched_projects": sorted(set(matched_projects)),
            "reasoning_bullets": reasoning,
            "contributions_count": len(contribs),
            "projects_count": len(projects),
            "experience_level": f"{profile.year_of_study} · {len(skills)} Verified Skills"
        })

    results.sort(key=lambda x: (x["match_score"] is not None, x["match_score"] or 0), reverse=True)
    return {
        "total_ranked": len(results),
        "rankings": results
    }
