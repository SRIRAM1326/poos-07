from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.schemas import schemas
from typing import List

router = APIRouter(prefix="/profiles", tags=["Profiles"])

def iso(ts):
    return ts.isoformat() if ts else None


VERIFICATION_STATUSES = ("VERIFIED", "PENDING", "REJECTED")


def verification_status_of(profile) -> str:
    """Tri-state verification with legacy fallback (pre-migration rows)."""
    status = (getattr(profile, "verification_status", None) or "").upper()
    if status in VERIFICATION_STATUSES:
        return status
    return "VERIFIED" if getattr(profile, "verified_by_college", False) else "PENDING"


def set_verification(profile, status: str) -> None:
    profile.verification_status = status
    profile.verified_by_college = (status == "VERIFIED")


def _college_key(name) -> str:
    return (name or "").strip().lower()


def _admin_college_key(db: Session, admin_user) -> str:
    """College name key of the admin's own institution ('' when not set)."""
    admin_col = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == admin_user.id).first()
    return _college_key(admin_col.college_name if admin_col else None)


def _require_own_college_student(db: Session, admin_user, student_profile) -> None:
    """POOS rule: a College Admin verifies only students of their own college.

    They cannot verify students belonging to another college, manage global
    POOS users, or act without a completed college identity.
    """
    admin_key = _admin_college_key(db, admin_user)
    if not admin_key:
        raise HTTPException(status_code=403, detail="Complete your college profile before verifying students.")
    student_key = _college_key(student_profile.college_name)
    if not student_key or student_key != admin_key:
        raise HTTPException(status_code=403, detail="You can only verify students belonging to your own college.")

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
        "verification_status": verification_status_of(profile),
        "contribution_score": profile.reputation_score or 0,
        "active_projects_count": len(project_ids),
        "total_commits": total_commits,
        "total_prs": total_prs,
        "merged_prs": total_prs,
        "skills_json": verified_skills,
        "activity_timeline": timeline,
        "badges": [
            {"id": b.id, "title": b.title, "description": b.description, "icon": b.icon}
            for b in badges
        ],
        "certificates_count": certs_count,
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

@router.get("/college/students/overview")
def get_college_students_overview(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """College Admin view: student performance aggregates + enriched profiles.

    Student Information summary (live counts, no mock data) plus one enriched
    record per student covering identity, links, skills, projects and GitHub
    contribution evidence (commits, PRs, merged PRs, issues, code reviews,
    repositories, recent activity).
    """
    if current_user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can view the students overview")

    # POOS rule: a College Admin manages only their own college's students.
    admin_key = _admin_college_key(db, current_user)
    rows = (
        db.query(models.StudentProfile, models.User)
        .join(models.User, models.StudentProfile.user_id == models.User.id)
        .order_by(models.StudentProfile.reputation_score.desc())
        .all()
    )
    if admin_key:
        rows = [(sp, u) for sp, u in rows if _college_key(sp.college_name) == admin_key]
    else:
        rows = []

    user_ids = [sp.user_id for sp, _ in rows]

    github_accounts = {}
    if user_ids:
        for acc in db.query(models.GitHubAccount).filter(models.GitHubAccount.user_id.in_(user_ids)).all():
            github_accounts[acc.user_id] = acc

    contribs_by_user: dict[int, list] = {uid: [] for uid in user_ids}
    for c in db.query(models.Contribution).filter(models.Contribution.contributor_id.in_(user_ids)).all() if user_ids else []:
        contribs_by_user.setdefault(c.contributor_id, []).append(c)

    members_by_user: dict[int, list] = {uid: [] for uid in user_ids}
    project_ids_needed: set[int] = set()
    if user_ids:
        for m in db.query(models.ProjectMember).filter(models.ProjectMember.user_id.in_(user_ids)).all():
            members_by_user.setdefault(m.user_id, []).append(m.project_id)
            project_ids_needed.add(m.project_id)
    for clist in contribs_by_user.values():
        for c in clist:
            if c.project_id:
                project_ids_needed.add(c.project_id)
    projects_map = {}
    if project_ids_needed:
        projects_map = {p.id: p for p in db.query(models.Project).filter(models.Project.id.in_(project_ids_needed)).all()}

    issues_by_name: dict[str, int] = {}
    for i in db.query(models.ProjectIssue).all():
        for key in (i.author_name, i.assignee_name):
            if key:
                issues_by_name[key] = issues_by_name.get(key, 0) + 1

    def skill_names(skills_blob):
        names = []
        for entry in (skills_blob or []):
            name = entry.get("name") if isinstance(entry, dict) else entry
            if name and str(name).strip():
                names.append(str(name).strip())
        return names

    students = []
    dept_counts: dict[str, int] = {}
    year_counts: dict[str, int] = {}
    skill_counts: dict[str, int] = {}
    skill_display: dict[str, str] = {}
    with_github = 0

    for sp, u in rows:
        dept = (sp.department or "Unspecified").strip() or "Unspecified"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        year = (sp.year_of_study or "Unspecified").strip() or "Unspecified"
        year_counts[year] = year_counts.get(year, 0) + 1
        skills = skill_names(sp.skills_json)
        for s in skills:
            key = s.lower()
            skill_counts[key] = skill_counts.get(key, 0) + 1
            skill_display.setdefault(key, s)

        acc = github_accounts.get(sp.user_id)
        github_connected = bool(acc and acc.is_connected)
        has_github = bool((sp.github_handle or "").strip() or github_connected)
        if has_github:
            with_github += 1

        local = contribs_by_user.get(sp.user_id, [])
        local_commits = sum(1 for c in local if c.commit_hash)
        local_prs = sum(1 for c in local if c.pr_number)
        local_merged = sum(1 for c in local if (c.status or "").upper() == "MERGED" or c.pr_number)

        totals = (acc.statistics_json or {}) if acc else {}
        if github_connected and totals:
            commits = int(totals.get("commits", 0) or 0) or local_commits
            pull_requests = int(totals.get("prs_total", 0) or 0) or local_prs
            merged_prs = int(totals.get("prs_merged", 0) or 0) or local_merged
            issues = int(totals.get("issues_closed", 0) or 0)
            open_issues = int(totals.get("issues_open", 0) or 0)
            code_reviews = int(totals.get("code_reviews", 0) or 0)
            repositories = int(acc.public_repos or 0)
        else:
            commits = local_commits
            pull_requests = local_prs
            merged_prs = local_merged
            issues = issues_by_name.get(u.full_name or "", 0)
            open_issues = 0
            code_reviews = 0
            repositories = 0

        project_ids = sorted({pid for pid in members_by_user.get(sp.user_id, [])} | {c.project_id for c in local if c.project_id})
        member_projects = [
            {"id": pid, "title": projects_map[pid].title if pid in projects_map else f"Project #{pid}"}
            for pid in project_ids
        ]

        activity = sorted(local, key=lambda c: c.created_at or "", reverse=True)[:5]
        contribution_activity = [
            {
                "id": c.id,
                "commit_message": c.commit_message,
                "pr_number": c.pr_number,
                "pr_title": c.pr_title,
                "status": c.status,
                "project_name": projects_map[c.project_id].title if c.project_id in projects_map else None,
                "timestamp": iso(c.created_at),
            }
            for c in activity
        ]

        github_url = (u.github_url or None) or (f"https://github.com/{sp.github_handle}" if sp.github_handle else None)
        students.append({
            "id": sp.id,
            "user_id": sp.user_id,
            "full_name": u.full_name,
            "email": u.email,
            "avatar_url": u.avatar_url,
            "roll_number": sp.roll_number,
            "department": sp.department,
            "year_of_study": sp.year_of_study,
            "bio": sp.bio,
            "github_handle": sp.github_handle,
            "github_url": github_url,
            "github_connected": github_connected,
            "has_github": has_github,
            "linkedin_url": sp.linkedin_url or u.linkedin_url,
            "portfolio_url": sp.portfolio_url or u.portfolio_url,
            "skills": skills,
            "projects": member_projects,
            "project_count": len(member_projects),
            "reputation_score": sp.reputation_score or 0,
            "contribution_score": sp.reputation_score or 0,
            "verified_by_college": sp.verified_by_college,
            "verification_status": verification_status_of(sp),
            "commits": commits,
            "pull_requests": pull_requests,
            "merged_prs": merged_prs,
            "issues": issues,
            "open_issues": open_issues,
            "code_reviews": code_reviews,
            "repositories": repositories,
            "contribution_activity": contribution_activity,
        })

    total_students = len(rows)
    active_students = sum(1 for sp, _ in rows if sp.verified_by_college)
    verified_count = sum(1 for sp, _ in rows if verification_status_of(sp) == "VERIFIED")
    pending_count = sum(1 for sp, _ in rows if verification_status_of(sp) == "PENDING")
    rejected_count = sum(1 for sp, _ in rows if verification_status_of(sp) == "REJECTED")
    # Students by Project counts this college's own students per project.
    project_member_counts: dict[int, int] = {}
    if user_ids:
        for m in db.query(models.ProjectMember).filter(models.ProjectMember.user_id.in_(user_ids)).all():
            project_member_counts[m.project_id] = project_member_counts.get(m.project_id, 0) + 1
    by_project = [
        {"project_id": pid, "title": projects_map[pid].title if pid in projects_map else f"Project #{pid}", "student_count": cnt}
        for pid, cnt in sorted(project_member_counts.items(), key=lambda kv: kv[1], reverse=True)
    ]
    # Active GitHub contributors among this college's students only.
    active_github_contributors = 0
    if user_ids:
        active_github_contributors = db.query(func.count(func.distinct(models.Contribution.contributor_id))).filter(
            models.Contribution.contributor_id.in_(user_ids)).scalar() or 0

    return {
        "summary": {
            "total_students": total_students,
            "active_students": active_students,
            "inactive_students": total_students - active_students,
            "students_with_github": with_github,
            "students_without_github": total_students - with_github,
            "active_github_contributors": int(active_github_contributors),
            "verification": {
                "verified": verified_count,
                "pending": pending_count,
                "rejected": rejected_count,
            },
            "by_department": [{"department": k, "count": v} for k, v in sorted(dept_counts.items(), key=lambda kv: kv[1], reverse=True)],
            "by_year": [{"year": k, "count": v} for k, v in sorted(year_counts.items(), key=lambda kv: kv[1], reverse=True)],
            "by_skill": [{"skill": skill_display[k], "count": v} for k, v in sorted(skill_counts.items(), key=lambda kv: kv[1], reverse=True)],
            "by_project": by_project,
        },
        "students": students,
    }


@router.get("/college/pending-students")
def get_pending_students(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can view pending students")
    students = db.query(models.StudentProfile, models.User).join(models.User, models.StudentProfile.user_id == models.User.id).filter(models.StudentProfile.verified_by_college == False).all()
    admin_key = _admin_college_key(db, current_user)
    results = []
    for profile, user in students:
        # Legacy rows without an explicit status are still awaiting review.
        if verification_status_of(profile) == "REJECTED":
            continue
        # Queue shows only the admin's own college applicants.
        if not admin_key or _college_key(profile.college_name) != admin_key:
            continue
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
            "verification_status": verification_status_of(profile),
            "avatar_url": user.avatar_url
        })
    return results

@router.get("/college/{user_id}")
def get_college_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # POOS rule: a College Admin views only their own college's private analytics.
    if current_user.role == "COLLEGE_ADMIN" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own college analytics.")
    profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="College profile not found")
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()

    # All analytics below are scoped to the viewed college only.
    college_key = _college_key(profile.college_name)
    college_students = db.query(models.StudentProfile).filter(
        models.StudentProfile.college_name == profile.college_name).all() if profile.college_name else []
    # Case-insensitive match for robustness against casing drift.
    if profile.college_name:
        college_students = [sp for sp in db.query(models.StudentProfile).all()
                            if _college_key(sp.college_name) == college_key]
    college_user_ids = [sp.user_id for sp in college_students]

    projects = db.query(models.Project).order_by(models.Project.created_at.desc()).all()
    if college_key:
        projects = [p for p in projects
                    if _college_key(p.college_name) == college_key or (p.owner_id in college_user_ids)]
    all_college_events = db.query(models.Event).order_by(models.Event.created_at.desc()).all()
    if college_key:
        all_college_events = [e for e in all_college_events
                              if _college_key(e.college_name) == college_key or e.organizer_id == profile.user_id]
    events = all_college_events[:50]
    projects_display = projects[:50]
    notifications = (
        db.query(models.NotificationItem)
        .filter(models.NotificationItem.user_id == profile.user_id)
        .order_by(models.NotificationItem.created_at.desc()).all()
    )

    if college_user_ids:
        contribs_count = db.query(models.Contribution).filter(
            models.Contribution.contributor_id.in_(college_user_ids)).count()
        prs_count = db.query(models.Contribution).filter(
            models.Contribution.contributor_id.in_(college_user_ids),
            models.Contribution.pr_number.isnot(None)).count()
    else:
        contribs_count = 0
        prs_count = 0
    total_students_count = len(college_students)
    verified_students_count = sum(1 for sp in college_students if sp.verified_by_college)
    if college_user_ids:
        certs_count = db.query(models.Certificate).filter(
            models.Certificate.recipient_id.in_(college_user_ids)).count()
    else:
        certs_count = 0
    events_count = len(events)

    # --- Overview: College Performance at a Glance (college-scoped, no mock data) ---
    total_projects_count = len(projects)
    project_statuses = [(p.status or "") for p in projects]
    _ACTIVE_STATUSES = {"ACTIVE", "IN_PROGRESS", "ONGOING", "IN REVIEW", "CODE_REVIEW"}
    _COMPLETED_STATUSES = {"COMPLETED", "DONE", "CLOSED", "RESOLVED"}
    active_projects_live = sum(1 for s in project_statuses if str(s or "").upper() in _ACTIVE_STATUSES)
    completed_projects_live = sum(1 for s in project_statuses if str(s or "").upper() in _COMPLETED_STATUSES)

    all_events = all_college_events
    total_hackathons = sum(1 for e in all_events if str(getattr(e, "event_type", "") or "").upper() == "HACKATHON")
    upcoming_events_count = 0
    try:
        from datetime import date as _date
        today = _date.today()
        for e in all_events:
            raw = (getattr(e, "event_date", "") or "").strip()
            if not raw:
                continue
            try:
                # Stored as "YYYY-MM-DD"; tolerate datetime strings by slicing the date part.
                parsed = _date.fromisoformat(raw[:10])
                if parsed >= today:
                    upcoming_events_count += 1
            except ValueError:
                if raw[:10] >= today.isoformat():
                    upcoming_events_count += 1
    except Exception:
        upcoming_events_count = 0

    if college_user_ids:
        active_github_contributors = db.query(func.count(func.distinct(models.Contribution.contributor_id))).filter(
            models.Contribution.contributor_id.in_(college_user_ids)).scalar() or 0
        projects_with_github_activity = db.query(func.count(func.distinct(models.Contribution.project_id))).filter(
            models.Contribution.contributor_id.in_(college_user_ids)).scalar() or 0
    else:
        active_github_contributors = 0
        projects_with_github_activity = 0

    # Distinct technical skills identified from this college's student profiles.
    _seen_skills: dict[str, str] = {}
    for sp in college_students:
        for entry in (sp.skills_json or []):
            name = entry.get("name") if isinstance(entry, dict) else entry
            if not name:
                continue
            key = str(name).strip().lower()
            if key and key not in _seen_skills:
                _seen_skills[key] = str(name).strip()
    total_skills_identified = len(_seen_skills)

    overview = {
        "total_students": total_students_count,
        "active_students": verified_students_count,
        "total_projects": total_projects_count,
        "active_projects": active_projects_live,
        "completed_projects": completed_projects_live,
        "total_events": events_count,
        "upcoming_events": upcoming_events_count,
        "total_hackathons": total_hackathons,
        "total_github_contributions": contribs_count,
        "active_github_contributors": int(active_github_contributors),
        "total_skills_identified": total_skills_identified,
        "projects_with_github_activity": int(projects_with_github_activity),
    }

    top_students = (
        db.query(models.StudentProfile, models.User)
        .join(models.User, models.StudentProfile.user_id == models.User.id)
        .order_by(models.StudentProfile.reputation_score.desc())
        .all()
    )
    if college_key:
        top_students = [(sp, u) for sp, u in top_students if _college_key(sp.college_name) == college_key]
    top_students = top_students[:10]
    project_member_counts = dict(
        db.query(models.ProjectMember.project_id, func.count(models.ProjectMember.id))
        .group_by(models.ProjectMember.project_id)
        .all()
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
        "official_email": user.email if user else None,
        "avatar_url": user.avatar_url if user else None,
        "college_name": profile.college_name,
        "college_code": profile.college_code,
        "location": profile.location,
        "website": profile.website,
        "linkedin_url": profile.linkedin_url,
        "logo_url": profile.logo_url,
        "description": profile.description,
        "contact_number": profile.contact_number,
        "accreditation": profile.accreditation,
        "admin_name": profile.admin_name or (user.full_name if user else None),
        "admin_designation": profile.admin_designation,
        "is_verified": profile.is_verified,
        "affiliation": profile.affiliation,
        "established_year": profile.established_year,
        "college_type": profile.college_type,
        "official_contact_email": profile.official_contact_email,
        "address": profile.address,
        "instagram_url": profile.instagram_url,
        "youtube_url": profile.youtube_url,
        "other_links": profile.other_links_json or [],
        "admin_contact_number": profile.admin_contact_number,
        "admin_role": profile.admin_role,
        "admin_official_email": user.email if user else None,
        "profile_photo": user.avatar_url if user else None,
        "account_status": "ACTIVE" if (user.is_active if user and user.is_active is not None else True) else "INACTIVE",
        "verification": {
            # VERIFIED: college confirmed. PENDING: details submitted, awaiting
            # verification. NOT_VERIFIED: no verifiable details submitted yet.
            "status": "VERIFIED" if profile.is_verified else ("PENDING" if (profile.college_name and profile.website) else "NOT_VERIFIED"),
            "verified_by": profile.verified_by,
            "verification_date": profile.verification_date,
        },
        "student_count": profile.student_count,
        "verified_students_count": verified_students_count,
        "active_projects_count": profile.active_projects_count,
        "certificates_issued_count": certs_count,
        "events_count": events_count,
        "overview": overview,
        "total_contributions": {
            "commits": contribs_count,
            "prs": prs_count,
            "merged_prs": prs_count,
        },
        "departments_json": profile.departments_json or [],
        "college_projects": [
            {
                "id": p.id,
                "title": p.title,
                "tagline": p.tagline,
                "project_type": p.project_type,
                "scope": p.scope,
                "status": p.status,
                "stars_count": p.stars_count,
                "contributors_count": project_member_counts.get(p.id, 0),
                "tech_stack_json": p.tech_stack_json or [],
            }
            for p in projects_display
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

    _require_own_college_student(db, current_user, profile)
    set_verification(profile, "VERIFIED")
    db.commit()
    db.refresh(profile)
    return {"status": "success", "message": f"Student {profile.id} verified successfully by college admin.",
            "verification_status": "VERIFIED", "verified_by_college": True}


@router.post("/college/reject-student/{student_id}")
def reject_student(
    student_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """College rejects a verification request: the student does not belong to this institution."""
    if current_user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can reject students")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == student_id).first()
    if not profile:
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    _require_own_college_student(db, current_user, profile)
    set_verification(profile, "REJECTED")
    db.commit()
    db.refresh(profile)
    return {"status": "success", "message": f"Student {profile.id} verification rejected by college admin.",
            "verification_status": "REJECTED", "verified_by_college": False}


@router.post("/student/request-verification")
def request_verification(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Student requests (or re-requests) college verification after a rejection."""
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can request verification")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if verification_status_of(profile) == "VERIFIED":
        return {"status": "success", "message": "Already verified by college.",
                "verification_status": "VERIFIED", "verified_by_college": True}

    set_verification(profile, "PENDING")
    db.commit()
    db.refresh(profile)
    return {"status": "success", "message": "Verification requested. Your college will review it.",
            "verification_status": "PENDING", "verified_by_college": False}

@router.get("/mentors", response_model=List[schemas.MentorProfileSchema])
def list_mentors(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.MentorProfile).all()