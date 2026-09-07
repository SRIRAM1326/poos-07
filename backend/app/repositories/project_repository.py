from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import Project, ProjectMember
from app.schemas.schemas import ProjectCreate

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_projects(self) -> List[Project]:
        return self.db.query(Project).all()

    def get_project_by_id(self, project_id: int) -> Optional[Project]:
        return self.db.query(Project).filter(Project.id == project_id).first()

    def create_project(self, project_data: ProjectCreate, owner_id: int, owner_name: str) -> Project:
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
            scope=getattr(project_data, 'scope', 'Open to Entire PoOS')
        )
        self.db.add(db_project)
        self.db.commit()
        self.db.refresh(db_project)
        return db_project

    def get_projects_by_owner(self, owner_id: int) -> List[Project]:
        return self.db.query(Project).filter(Project.owner_id == owner_id).all()
