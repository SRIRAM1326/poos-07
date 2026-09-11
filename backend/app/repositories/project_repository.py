from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import Project, ProjectMember
from app.schemas.schemas import ProjectCreate


def _visibility_from_scope(scope: Optional[str]) -> str:
    s = (scope or '').strip().lower()
    if s in ('college only', 'college_only'):
        return 'COLLEGE_ONLY'
    if s in ('invite only', 'invite_only', 'selected colleges', 'selected_colleges'):
        return 'INVITE_ONLY'
    return 'PUBLIC'


def _scope_from_visibility(visibility: Optional[str]) -> str:
    v = (visibility or '').strip().upper()
    if v == 'COLLEGE_ONLY':
        return 'College Only'
    if v == 'INVITE_ONLY':
        return 'Invite Only'
    return 'Open to Entire PoOS'


class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_projects(self) -> List[Project]:
        return self.db.query(Project).all()

    def get_project_by_id(self, project_id: int) -> Optional[Project]:
        return self.db.query(Project).filter(Project.id == project_id).first()

    def create_project(self, project_data: ProjectCreate, owner_id: int, owner_name: str) -> Project:
        visibility = (getattr(project_data, 'visibility', None) or '').upper() or None
        scope = getattr(project_data, 'scope', None) or 'Open to Entire PoOS'
        # Keep visibility and scope consistent for ecosystem discovery.
        if visibility is None:
            visibility = _visibility_from_scope(scope)
        else:
            scope = _scope_from_visibility(visibility)
        db_project = Project(
            title=project_data.title,
            tagline=project_data.tagline,
            description=project_data.description,
            project_type=project_data.project_type,
            owner_id=owner_id,
            owner_name=owner_name,
            college_name=project_data.college_name,
            company_name=project_data.company_name,
            repo_url=project_data.repo_url,
            rights_tag=project_data.rights_tag,
            tech_stack_json=project_data.tech_stack_json,
            # Ecosystem specific scope:
            scope=scope,
            domain=getattr(project_data, 'domain', None),
            required_skills_json=list(getattr(project_data, 'required_skills', None) or []),
            difficulty_level=getattr(project_data, 'difficulty_level', None),
            visibility=visibility,
            is_open=getattr(project_data, 'is_open', True) if getattr(project_data, 'is_open', True) is not None else True,
            start_date=getattr(project_data, 'start_date', None),
            expected_completion=getattr(project_data, 'expected_completion', None),
            mentor_name=getattr(project_data, 'mentor_name', None),
        )
        self.db.add(db_project)
        self.db.commit()
        self.db.refresh(db_project)
        return db_project

    def get_projects_by_owner(self, owner_id: int) -> List[Project]:
        return self.db.query(Project).filter(Project.owner_id == owner_id).all()
