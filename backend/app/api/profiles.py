from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.schemas import schemas
from typing import List

router = APIRouter(prefix="/profiles", tags=["Profiles"])

def iso(ts):
    return ts.isoformat() if ts else None

@router.get("/student/{user_id}")
def get_student_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()

    contribs = db.query(models.Contribution).filter(models.Contribution.contributor_id == profile.user_id).all()
    certs_count = db.query(models.Certificate).filter(models.Certificate.recipient_id == profile.user_id).count()
    badges = db.query(models.Badge).filter(models.Badge.user_id == profile.user_id).order_by(models.Badge.awarded_at.desc()).all()
    notifications = (
        db.query(models.NotificationItem)
        .filter(models.NotificationItem.user_id == profile.user_id)
        .order_by(models.NotificationItem.created_at.desc()).all()
    )

    project_ids = {c.project_id for c in contribs if c.project_id}
    projects_map = {}
    if project_ids:
        projects_map = {p.id: p for p in db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()}

    total_prs = sum(1 for c in contribs if c.pr_number)
    total_commits = sum(1 for c in contribs if c.commit_hash)
    lines_added = sum(c.lines_added or 0 for c in contribs)
    lines_deleted = sum(c.lines_deleted or 0 for c in contribs)
    verified_skills = [s for s in (profile.skills_json or []) if isinstance(s, dict) and s.get("verified")]

    timeline = [
        {
            "id": c.id,
            "type": "PR_MERGED" if c.pr_number else "COMMIT",
            "title": c.commit_message,
            "project_name": projects_map[c.project_id].title if c.project_id in projects_map else None,
            "details": f"+{c.lines_added or 0} added / -{c.lines_deleted or 0} deleted",
            "timestamp": iso(c.created_at),
            "lines_added": c.lines_added or 0,
            "lines_deleted": c.lines_deleted or 0,
        }
        for c in contribs
    ]

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": user.full_name if user else None,
        "email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None,
        "roll_number": profile.roll_number,
        "college_name": profile.college_name,
        "department": profile.department,
        "year_of_study": profile.year_of_study,
        "bio": profile.bio,
        "github_handle": profile.github_handle,
        "github_url": (user.github_url if user else None) or (f"https://github.com/{profile.github_handle}" if profile.github_handle else None),
        "linkedin_url": profile.linkedin_url or (user.linkedin_url if user else None),
        "portfolio_url": profile.portfolio_url or (user.portfolio_url if user else None),
        "personal_website_url": user.portfolio_url if user else None,
        "reputation_score": profile.reputation_score or 0,
        "verified_by_college": profile.verified_by_college,
        "profile_completion_pct": 0,
        "contribution_score": profile.reputation_score or 0,
        "active_projects_count": len(project_ids),
        "total_commits": total_commits,
        "total_prs": total_prs,
        "merged_prs": total_prs,
        "issues_solved": 0,
        "code_reviews": 0,
        "tasks_completed": 0,
        "streak_days": 0,
        "college_rank": None,
        "college_total_students": None,
        "global_rank": None,
        "global_total_devs": None,
        "dept_rank": None,
        "dept_total_students": None,
        "skills_json": verified_skills,
        "activity_timeline": timeline,
        "badges": [
            {"id": b.id, "title": b.title, "description": b.description, "icon": b.icon}
            for b in badges
        ],
        "certificates_count": certs_count,
        "recommended_projects": [],
        "recommended_mentors": [],
        "notifications": [
            {
                "id": n.id,
                "category": n.category,
                "title": n.title,
                "message": n.message,
                "timestamp": iso(n.created_at),
                "is_read": n.is_read,
            }
            for n in notifications
        ],
        "analytics": {},
    }

@router.get("/college/pending-students")
def get_pending_students(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can view pending students")
    students = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id).filter(models.StudentProfile.verified_by_college == False).all()
    results = []
    for profile, user in students:
        results.append({
            "student_id": profile.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "college_name": profile.college_name,
            "department": profile.department,
            "roll_number": profile.roll_number,
            "year_of_study": profile.year_of_study,
            "verified_by_college": profile.verified_by_college,
            "avatar_url": user.avatar_url
        })
    return results

@router.get("/college/{user_id}")
def get_college_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="College profile not found")
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()

    projects = db.query(models.Project).order_by(models.Project.created_at.desc()).limit(50).all()
    events = db.query(models.Event).order_by(models.Event.created_at.desc()).limit(50).all()
    notifications = (
        db.query(models.NotificationItem)
        .filter(models.NotificationItem.user_id == profile.user_id)
        .order_by(models.NotificationItem.created_at.desc()).all()
    )

    contribs_count = db.query(models.Contribution).count()
    prs_count = db.query(models.Contribution).filter(models.Contribution.pr_number.isnot(None)).count()
    verified_students_count = db.query(models.StudentProfile).filter(models.StudentProfile.verified_by_college == True).count()
    certs_count = db.query(models.Certificate).count()
    events_count = db.query(models.Event).count()

    top_students = (
        db.query(models.StudentProfile, models.User)
        .join(models.User, models.StudentProfile.user_id == models.User.id)
        .order_by(models.StudentProfile.reputation_score.desc())
        .limit(10).all()
    )
    rankings = [
        {
            "rank": i + 1,
            "student_id": sp.id,
            "full_name": u.full_name,
            "roll_number": sp.roll_number,
            "department": sp.department,
            "reputation_score": sp.reputation_score or 0,
            "avatar_url": u.avatar_url,
        }
        for i, (sp, u) in enumerate(top_students)
    ]

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": user.full_name if user else None,
        "email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None,
        "college_name": profile.college_name,
        "college_code": profile.college_code,
        "location": profile.location,
        "website": profile.website,
        "is_verified": profile.is_verified,
        "student_count": profile.student_count,
        "verified_students_count": verified_students_count,
        "active_students_count": 0,
        "active_developers_count": 0,
        "active_projects_count": profile.active_projects_count,
        "certificates_issued_count": certs_count,
        "events_count": events_count,
        "college_rank": None,
        "college_total_rank": None,
        "total_contributions": {
            "commits": contribs_count,
            "prs": prs_count,
            "merged_prs": prs_count,
            "issues_solved": 0,
        },
        "departments_json": profile.departments_json or [],
        "college_projects": [
            {
                "id": p.id,
                "title": p.title,
                "tagline": p.tagline,
                "project_type": p.project_type,
                "participation_scope": p.participation_scope,
                "status": p.status,
                "stars_count": p.stars_count,
                "contributors_count": p.contributors_count,
                "tech_stack_json": p.tech_stack_json or [],
            }
            for p in projects
        ],
        "college_events": [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "event_type": e.event_type,
                "scope": e.scope,
                "event_date": e.event_date,
                "participant_count": e.participant_count,
                "location": e.location,
                "organizer_name": e.organizer_name,
            }
            for e in events
        ],
        "student_rankings": rankings,
        "notifications": [
            {
                "id": n.id,
                "category": n.category,
                "title": n.title,
                "message": n.message,
                "timestamp": iso(n.created_at),
                "is_read": n.is_read,
            }
            for n in notifications
        ],
    }

@router.get("/mentor/{user_id}")
def get_mentor_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.MentorProfile).filter(models.MentorProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": user.full_name if user else None,
        "email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None,
        "title": profile.title,
        "company": profile.company,
        "experience_years": profile.experience_years,
        "domain_expertise": profile.domain_expertise,
        "hourly_rate": profile.hourly_rate,
        "bio": profile.bio,
        "rating": profile.rating,
        "total_sessions": profile.total_sessions,
        "skills_json": profile.skills_json or [],
    }

@router.get("/company/{user_id}")
def get_company_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.CompanyProfile).filter(models.CompanyProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": user.full_name if user else None,
        "email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None,
        "company_name": profile.company_name,
        "company_type": profile.company_type,
        "industry": profile.industry,
        "company_size": profile.company_size,
        "location": profile.location,
        "website": profile.website,
        "description": profile.description,
        "tech_stack_json": profile.tech_stack_json or [],
        "domains_json": profile.domains_json or [],
    }

@router.get("/students", response_model=List[schemas.StudentProfileSchema])
def list_students(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.StudentProfile).all()

@router.post("/college/verify-student/{student_id}")
def verify_student(
    student_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can verify students")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == student_id).first()
    if not profile:
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    profile.verified_by_college = True
    db.commit()
    db.refresh(profile)
    return {"status": "success", "message": f"Student {profile.id} verified successfully by college admin."}

@router.get("/mentors", response_model=List[schemas.MentorProfileSchema])
def list_mentors(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.MentorProfile).all()