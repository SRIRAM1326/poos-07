from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.schemas import schemas
from app.services.project_service import ProjectService
from app.api.notifications import manager
from typing import List, Optional

router = APIRouter(prefix="/projects", tags=["Projects Workspace"])

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
    if project.owner_id != user.id and user.role not in ("MENTOR", "COLLEGE_ADMIN"):
        raise HTTPException(status_code=403, detail="Only the project owner or a mentor can add tasks")
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
    if project.owner_id != user.id and user.role not in ("MENTOR", "COLLEGE_ADMIN"):
        raise HTTPException(status_code=403, detail="Only the project owner or a mentor can add issues")
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
