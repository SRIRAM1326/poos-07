from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    oauth_provider: Optional[str] = None
    profile_completed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileSetupRequest(BaseModel):
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[str]] = None
    bio: Optional[str] = None
    college_name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

# --- Profile Schemas ---
class StudentProfileSchema(BaseModel):
    id: int
    user_id: int
    roll_number: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[str] = None
    bio: Optional[str] = None
    github_handle: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    reputation_score: int
    verified_by_college: bool
    skills_json: List[Dict[str, Any]]

    class Config:
        from_attributes = True

class CollegeProfileSchema(BaseModel):
    id: int
    user_id: int
    college_name: Optional[str] = None
    college_code: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    is_verified: bool
    student_count: int
    active_projects_count: int
    departments_json: List[Dict[str, Any]]

    class Config:
        from_attributes = True

class MentorProfileSchema(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    company: Optional[str] = None
    experience_years: int
    domain_expertise: Optional[str] = None
    hourly_rate: float
    bio: Optional[str] = None
    rating: float
    total_sessions: int
    skills_json: List[str]

    class Config:
        from_attributes = True

class CompanyProfileSchema(BaseModel):
    id: int
    user_id: int
    company_name: str
    company_type: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    tech_stack_json: List[str]
    domains_json: List[str]

    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    title: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    project_type: str = "OPEN_SOURCE"
    college_name: Optional[str] = None
    company_name: Optional[str] = None
    repo_url: Optional[str] = None
    rights_tag: str = "MIT License — Open Contribution"
    tech_stack_json: List[str] = []
    scope: str = "Open to Entire PoOS"

class ProjectResponse(BaseModel):
    id: int
    title: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    project_type: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    college_name: Optional[str] = None
    company_name: Optional[str] = None
    repo_url: Optional[str] = None
    rights_tag: str
    status: str
    stars_count: int
    forks_count: int
    tech_stack_json: List[str]
    scope: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    assignee_name: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assignee_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IssueCreate(BaseModel):
    title: str
    body: Optional[str] = None
    label: str = "GOOD_FIRST_ISSUE"

class IssueResponse(BaseModel):
    id: int
    project_id: int
    title: str
    body: Optional[str] = None
    status: str
    label: str
    author_name: str
    assignee_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ContributionCreate(BaseModel):
    commit_hash: str
    commit_message: str
    pr_number: Optional[int] = None
    pr_title: Optional[str] = None
    lines_added: int = 0
    lines_deleted: int = 0

class ContributionResponse(BaseModel):
    id: int
    project_id: int
    contributor_id: int
    contributor_name: str
    commit_hash: str
    commit_message: str
    pr_number: Optional[int] = None
    pr_title: Optional[str] = None
    status: str
    lines_added: int
    lines_deleted: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Shortlist & Contact Requests ---
class ShortlistCreate(BaseModel):
    student_id: int
    category: Optional[str] = None
    notes: Optional[str] = None

class ContactRequestCreate(BaseModel):
    student_id: int
    opportunity_type: str = "INTERNSHIP"
    message: str

# --- Certificates & Badges ---
class CertificateResponse(BaseModel):
    id: int
    cert_hash: str
    recipient_name: str
    issuer_name: str
    title: str
    description: Optional[str] = None
    issue_date: str
    verification_url: Optional[str] = None

    class Config:
        from_attributes = True

class JDSearchRequest(BaseModel):
    job_description: Optional[str] = None
    skills: Optional[str] = None
    domain_expertise: Optional[str] = None
    college: Optional[str] = None
    company_type: Optional[str] = "IT"
