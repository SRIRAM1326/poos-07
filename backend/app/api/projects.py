from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.schemas import schemas
from app.services.project_service import ProjectService
from app.repositories.project_repository import _visibility_from_scope
from app.api.notifications import manager
from typing import List, Optional

router = APIRouter(prefix="/projects", tags=["Projects Workspace"])

_PROJECT_ACTIVE = {"ACTIVE", "IN_PROGRESS", "ONGOING", "IN REVIEW", "CODE_REVIEW"}
_PROJECT_COMPLETED = {"COMPLETED", "DONE", "CLOSED", "RESOLVED"}


def _project_visibility(p) -> str:
    raw = (getattr(p, "visibility", None) or "").upper()
    if raw in ("PUBLIC", "COLLEGE_ONLY", "INVITE_ONLY"):
        return raw
    return _visibility_from_scope(getattr(p, "scope", None))


def _member_status(m) -> str:
    raw = (getattr(m, "status", None) or "").upper()
    return raw if raw in ("PENDING", "APPROVED", "REJECTED") else "APPROVED"


def _college_key(name) -> str:
    return (name or "").strip().lower()


def _admin_college_key(db: Session, admin_user) -> str:
    admin_col = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == admin_user.id).first()
    return _college_key(admin_col.college_name if admin_col else None)


def _is_own_college_project(db: Session, user, project) -> bool:
    """POOS rule: a College Admin controls only their own college's projects.

    Ownership always grants control; otherwise the project's college must match
    the admin's own college. Other colleges' projects are read-only for them.
    """
    if project.owner_id == user.id:
        return True
    admin_key = _admin_college_key(db, user)
    if not admin_key:
        return False
    return _college_key(project.college_name) == admin_key


def _can_manage_project(db: Session, project, user) -> bool:
    if project.owner_id == user.id:
        return True
    if user.role == "MENTOR":
        return True
    if user.role == "COLLEGE_ADMIN":
        return _is_own_college_project(db, user, project)
    return False


@router.get("/college/overview")
def college_projects_overview(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """College Admin view: project statistics + enriched college-created & open projects.

    Contribution flow supported here: college creates project -> visible on POOS
    (PUBLIC) or restricted (COLLEGE_ONLY / INVITE_ONLY) -> users apply/join ->
    owner approves if required -> contributions tracked via GitHub activity.
    """
    if user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can view the college projects overview")

    projects = db.query(models.Project).order_by(models.Project.id.desc()).all()
    college_profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == user.id).first()
    my_college = (college_profile.college_name if college_profile else None) or ""
    my_college_key = my_college.strip().lower()

    def is_college_created(p) -> bool:
        if (p.project_type or "").upper() == "COLLEGE_PROJECT":
            return True
        if p.owner_id == user.id:
            return True
        owner = owner_map.get(p.owner_id) if p.owner_id else None
        if owner is not None and owner.role == "COLLEGE_ADMIN":
            if not my_college_key:
                return True
            return (p.college_name or "").strip().lower() in ("", my_college_key)
        if my_college_key and (p.college_name or "").strip().lower() == my_college_key:
            return True
        return False

    owner_ids = {p.owner_id for p in projects if p.owner_id}
    owner_map = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(owner_ids)).all()} if owner_ids else {}

    # College Verified badge: verified colleges by name so the badge can appear
    # on projects across POOS public content.
    verified_colleges = {
        (c.college_name or "").strip().lower(): True
        for c in db.query(models.CollegeProfile).filter(models.CollegeProfile.is_verified == True).all()
        if (c.college_name or "").strip()
    }
    own_college_verified = bool(my_college_key and verified_colleges.get(my_college_key))

    project_ids = [p.id for p in projects]
    members_by_project: dict[int, list] = {}
    if project_ids:
        for m in db.query(models.ProjectMember).filter(models.ProjectMember.project_id.in_(project_ids)).all():
            members_by_project.setdefault(m.project_id, []).append(m)
    member_user_ids = {m.user_id for ml in members_by_project.values() for m in ml}
    users_map = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(member_user_ids)).all()} if member_user_ids else {}
    student_profiles = {sp.user_id: sp for sp in db.query(models.StudentProfile).filter(models.StudentProfile.user_id.in_(member_user_ids)).all()} if member_user_ids else {}

    contribs_by_project: dict[int, list] = {}
    if project_ids:
        for c in db.query(models.Contribution).filter(models.Contribution.project_id.in_(project_ids)).all():
            contribs_by_project.setdefault(c.project_id, []).append(c)
    issues_by_project: dict[int, list] = {}
    if project_ids:
        for i in db.query(models.ProjectIssue).filter(models.ProjectIssue.project_id.in_(project_ids)).all():
            issues_by_project.setdefault(i.project_id, []).append(i)

    def classify(uid: int, p) -> str:
        """college-student vs external contributor for this project."""
        u = users_map.get(uid)
        sp = student_profiles.get(uid)
        if u is not None and u.role == "STUDENT" and sp is not None:
            if my_college_key and (sp.college_name or "").strip().lower() == my_college_key:
                return "college"
            if not my_college_key and (sp.college_name or "").strip().lower() == (p.college_name or "").strip().lower():
                return "college"
        return "external"

    enriched = []
    college_created_ids: set[int] = set()
    domain_counts: dict[str, int] = {}
    tech_counts: dict[str, int] = {}
    tech_display: dict[str, str] = {}
    total_contributors_set: set[int] = set()
    external_set: set[int] = set()
    college_set: set[int] = set()

    for p in projects:
        members = members_by_project.get(p.id, [])
        approved = [m for m in members if _member_status(m) == "APPROVED"]
        pending = [m for m in members if _member_status(m) == "PENDING"]
        contribs = contribs_by_project.get(p.id, [])
        contrib_user_ids = {c.contributor_id for c in contribs if c.contributor_id}
        approved_ids = {m.user_id for m in approved}
        all_contributor_ids = approved_ids | contrib_user_ids
        total_contributors_set |= all_contributor_ids

        college_names, external_names = [], []
        for uid in sorted(all_contributor_ids):
            u = users_map.get(uid)
            name = u.full_name if u else f"User #{uid}"
            if classify(uid, p) == "college":
                college_names.append(name)
                college_set.add(uid)
            else:
                external_names.append(name)
                external_set.add(uid)

        domain = (p.domain or "Unspecified").strip() or "Unspecified"
        domain_counts[domain] = domain_counts.get(domain, 0) + 1
        for t in (p.tech_stack_json or []) + (getattr(p, "required_skills_json", None) or []):
            if not t:
                continue
            key = str(t).strip().lower()
            if key:
                tech_counts[key] = tech_counts.get(key, 0) + 1
                tech_display.setdefault(key, str(t).strip())

        member_rows = [
            {"id": m.id, "user_id": m.user_id,
             "name": (users_map[m.user_id].full_name if m.user_id in users_map else f"User #{m.user_id}"),
             "role": m.role, "status": _member_status(m)}
            for m in members
        ]
        college_created = is_college_created(p)
        if college_created:
            college_created_ids.add(p.id)
        activity = sorted(contribs, key=lambda c: c.created_at or "", reverse=True)[:5]
        enriched.append({
            "id": p.id,
            "title": p.title,
            "tagline": p.tagline,
            "description": p.description,
            "created_by": p.owner_name,
            "owner_id": p.owner_id,
            "college": p.college_name,
            "college_created": college_created,
            "college_verified": bool((p.college_name or "").strip().lower() in verified_colleges) if (p.college_name or "").strip() else own_college_verified,
            "project_type": p.project_type,
            "domain": p.domain,
            "technologies": p.tech_stack_json or [],
            "required_skills": getattr(p, "required_skills_json", None) or [],
            "difficulty_level": p.difficulty_level,
            "project_status": p.status,
            "is_open": p.is_open if p.is_open is not None else True,
            "start_date": p.start_date,
            "expected_completion": p.expected_completion,
            "repo_url": p.repo_url,
            "has_github_repo": bool((p.repo_url or "").strip()),
            "mentor": p.mentor_name,
            "visibility": _project_visibility(p),
            "scope": p.scope,
            "stars_count": p.stars_count or 0,
            "forks_count": p.forks_count or 0,
            "contributors": member_rows,
            "pending_requests": [r for r in member_rows if r["status"] == "PENDING"],
            "contributor_count": len(all_contributor_ids),
            "college_students_contributing": len(college_names),
            "college_student_names": college_names,
            "external_contributing": len(external_names),
            "external_names": external_names,
            "contribution_stats": {
                "commits": sum(1 for c in contribs if c.commit_hash),
                "pull_requests": sum(1 for c in contribs if c.pr_number),
                "merged_prs": sum(1 for c in contribs if (c.status or "").upper() == "MERGED"),
                "contributors_with_activity": len(contrib_user_ids),
            },
            "issues": [{"id": i.id, "title": i.title, "status": i.status, "label": i.label} for i in issues_by_project.get(p.id, [])],
            "issue_count": len(issues_by_project.get(p.id, [])),
            "recent_activity": [
                {"id": c.id, "commit_message": c.commit_message, "pr_number": c.pr_number,
                 "contributor_name": c.contributor_name,
                 "timestamp": c.created_at.isoformat() if c.created_at else None}
                for c in activity
            ],
        })

    return {
        "summary": {
            "own_college_verified": own_college_verified,
            "total_projects": len(projects),
            "college_created_projects": len(college_created_ids),
            "active_projects": sum(1 for p in projects if (p.status or "").upper() in _PROJECT_ACTIVE),
            "completed_projects": sum(1 for p in projects if (p.status or "").upper() in _PROJECT_COMPLETED),
            "open_projects": sum(1 for p in projects if (p.is_open if p.is_open is not None else True)),
            "closed_projects": sum(1 for p in projects if p.is_open is False),
            "total_contributors": len(total_contributors_set),
            "external_contributors": len(external_set),
            "college_student_contributors": len(college_set),
            "projects_with_github_repo": sum(1 for p in projects if (p.repo_url or "").strip()),
            "by_domain": [{"domain": k, "count": v} for k, v in sorted(domain_counts.items(), key=lambda kv: kv[1], reverse=True)],
            "by_technology": [{"technology": tech_display[k], "count": v} for k, v in sorted(tech_counts.items(), key=lambda kv: kv[1], reverse=True)],
        },
        "projects": enriched,
    }


@router.post("/college", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_college_project(proj_in: schemas.ProjectCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """College creates a project and opens it to the POOS ecosystem."""
    if user.role != "COLLEGE_ADMIN":
        raise HTTPException(status_code=403, detail="Only college admins can create college projects")
    college_profile = db.query(models.CollegeProfile).filter(models.CollegeProfile.user_id == user.id).first()
    # College Admins create projects only under their own college identity.
    if college_profile and college_profile.college_name:
        proj_in.college_name = college_profile.college_name
    if proj_in.project_type == "OPEN_SOURCE":
        proj_in.project_type = "COLLEGE_PROJECT"
    project = ProjectService(db).create_project(proj_in, user.id, user.full_name)
    # Owner joins as lead so contributor counts include the creator.
    db.add(models.ProjectMember(project_id=project.id, user_id=user.id, role="LEAD", status="APPROVED"))
    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/join")
def join_project(project_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Apply to / join a project. PUBLIC joins auto-approve; restricted ones pend approval."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    existing = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id, models.ProjectMember.user_id == user.id).first()
    if existing:
        return {"status": "success", "membership_status": _member_status(existing),
                "message": "Already a project member." if _member_status(existing) == "APPROVED" else "Join request already pending."}
    visibility = _project_visibility(project)
    if visibility == "PUBLIC":
        member_status = "APPROVED"
    elif visibility == "COLLEGE_ONLY" and user.role == "STUDENT":
        sp = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user.id).first()
        same_college = sp is not None and (sp.college_name or "").strip().lower() == (project.college_name or "").strip().lower() and sp.verified_by_college
        member_status = "APPROVED" if same_college else "PENDING"
    else:
        member_status = "PENDING"
    member = models.ProjectMember(project_id=project_id, user_id=user.id, role="CONTRIBUTOR", status=member_status)
    db.add(member)
    db.commit()
    db.refresh(member)
    return {"status": "success", "membership_status": member_status,
            "message": "Joined project." if member_status == "APPROVED" else "Request sent. The college/project owner will approve."}


def _require_project_owner_or_admin(project_id: int, user: models.User, db: Session):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id == user.id or user.role == "MENTOR":
        return project
    # College Admins review requests only for their own college's projects —
    # never another college's projects.
    if user.role == "COLLEGE_ADMIN" and _is_own_college_project(db, user, project):
        return project
    raise HTTPException(status_code=403, detail="Only the project owner, its college admin or mentor can review requests")


@router.post("/{project_id}/members/{member_id}/approve")
def approve_member(project_id: int, member_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_project_owner_or_admin(project_id, user, db)
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.id == member_id, models.ProjectMember.project_id == project_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membership request not found")
    member.status = "APPROVED"
    db.commit()
    return {"status": "success", "message": "Member approved."}


@router.post("/{project_id}/members/{member_id}/reject")
def reject_member(project_id: int, member_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_project_owner_or_admin(project_id, user, db)
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.id == member_id, models.ProjectMember.project_id == project_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membership request not found")
    member.status = "REJECTED"
    db.commit()
    return {"status": "success", "message": "Membership request rejected."}


@router.patch("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, patch: schemas.ProjectUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Owners edit their own projects; College Admins edit only their own
    # college's projects — never another college's.
    if project.owner_id != user.id:
        if user.role != "COLLEGE_ADMIN" or not _is_own_college_project(db, user, project):
            raise HTTPException(status_code=403, detail="Only the project owner or its college admin can update the project")
    data = patch.model_dump(exclude_unset=True)
    if "required_skills" in data:
        project.required_skills_json = list(data.pop("required_skills") or [])
    if "visibility" in data and data["visibility"]:
        project.visibility = data["visibility"].upper()
        from app.repositories.project_repository import _scope_from_visibility as _s
        project.scope = _s(project.visibility)
        del data["visibility"]
    for key, value in data.items():
        if hasattr(project, key):
            setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project

@router.get("", response_model=List[schemas.ProjectResponse])
def list_projects(project_type: Optional[str] = None, db: Session = Depends(get_db)):
    service = ProjectService(db)
    projects = service.get_ecosystem_projects()
    if project_type:
        projects = [p for p in projects if p.project_type == project_type]
    return projects

@router.post("", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(proj_in: schemas.ProjectCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ProjectService(db).create_project(proj_in, user.id, user.full_name)

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.get("/{project_id}/tasks", response_model=List[schemas.TaskResponse])
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.ProjectTask).filter(models.ProjectTask.project_id == project_id).all()

@router.post("/{project_id}/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_project_task(
    project_id: int,
    task_in: schemas.TaskCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can_manage_project(db, project, user):
        raise HTTPException(status_code=403, detail="Only the project owner, its college admin or a mentor can add tasks")
    task = models.ProjectTask(
        project_id=project_id,
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        assignee_name=task_in.assignee_name
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{project_id}/issues", response_model=List[schemas.IssueResponse])
def get_project_issues(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.ProjectIssue).filter(models.ProjectIssue.project_id == project_id).all()

@router.post("/{project_id}/issues", response_model=schemas.IssueResponse, status_code=status.HTTP_201_CREATED)
def create_project_issue(
    project_id: int,
    issue_in: schemas.IssueCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _can_manage_project(db, project, user):
        raise HTTPException(status_code=403, detail="Only the project owner, its college admin or a mentor can add issues")
    issue = models.ProjectIssue(
        project_id=project_id,
        title=issue_in.title,
        body=issue_in.body,
        label=issue_in.label
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue

@router.get("/{project_id}/contributions", response_model=List[schemas.ContributionResponse])
def get_project_contributions(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Contribution).filter(models.Contribution.project_id == project_id).all()

@router.post("/{project_id}/contributions", response_model=schemas.ContributionResponse, status_code=status.HTTP_201_CREATED)
async def log_contribution(project_id: int, contrib_in: schemas.ContributionCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    contrib = models.Contribution(
        project_id=project_id,
        contributor_id=user.id,
        contributor_name=user.full_name,
        commit_hash=contrib_in.commit_hash,
        commit_message=contrib_in.commit_message,
        pr_number=contrib_in.pr_number,
        pr_title=contrib_in.pr_title,
        lines_added=contrib_in.lines_added,
        lines_deleted=contrib_in.lines_deleted
    )
    db.add(contrib)
    db.commit()
    db.refresh(contrib)

    # Broadcast Progress WebSocket Event (no fabricated reputation claim)
    await manager.send_personal_message({
        "type": "CONTRIBUTION_LOGGED",
        "payload": {
            "title": "Contribution Logged",
            "message": f"Contribution to {contrib.project_id} recorded."
        }
    }, user.id)

    return contrib
