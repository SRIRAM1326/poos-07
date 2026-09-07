from sqlalchemy.orm import Session
from typing import List
from app.repositories.project_repository import ProjectRepository
from app.schemas.schemas import ProjectCreate
from app.models.models import Project

class ProjectService:
    def __init__(self, db: Session):
        self.repo = ProjectRepository(db)

    def get_ecosystem_projects(self) -> List[Project]:
        """
        Returns all projects across the ecosystem. 
        In the future, this can be filtered by user's college/company permissions.
        """
        return self.repo.get_all_projects()

    def create_project(self, project_data: ProjectCreate, owner_id: int, owner_name: str) -> Project:
        """
        Creates a new project in the ecosystem.
        """
        return self.repo.create_project(project_data, owner_id, owner_name)

    def get_user_projects(self, user_id: int) -> List[Project]:
        """
        Returns projects owned by the user.
        """
        return self.repo.get_projects_by_owner(user_id)
