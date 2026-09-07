import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, Boolean, DateTime, ForeignKey, Float, JSON, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    COLLEGE_ADMIN = "COLLEGE_ADMIN"
    MENTOR = "MENTOR"
    IT_COMPANY = "IT_COMPANY"
    NON_IT_COMPANY = "NON_IT_COMPANY"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    username = Column(String(255), nullable=True, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="STUDENT", nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    oauth_provider = Column(String(50), nullable=True, index=True)
    oauth_provider_uid = Column(String(255), nullable=True, index=True)
    profile_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    college_profile = relationship("CollegeProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    roll_number = Column(String(100), nullable=True)
    college_name = Column(String(255), nullable=False, default="National Institute of Technology")
    department = Column(String(255), nullable=False, default="Computer Science & Engineering")
    year_of_study = Column(String(50), default="3rd Year")
    bio = Column(Text, nullable=True)
    github_handle = Column(String(100), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    reputation_score = Column(Integer, default=450)
    verified_by_college = Column(Boolean, default=True)
    skills_json = Column(JSON, default=list) # e.g. [{"name": "React", "level": "Advanced", "verified": True}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="student_profile")

class CollegeProfile(Base):
    __tablename__ = "college_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    college_name = Column(String(255), nullable=False)
    college_code = Column(String(50), nullable=False)
    location = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=True)
    student_count = Column(Integer, default=1200)
    active_projects_count = Column(Integer, default=45)
    departments_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="college_profile")

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    title = Column(String(255), default="Staff Software Engineer")
    company = Column(String(255), default="TechCorp Global")
    experience_years = Column(Integer, default=8)
    domain_expertise = Column(String(255), default="Distributed Systems & Cloud Architecture")
    hourly_rate = Column(Float, default=0.0) # Free mentorship
    bio = Column(Text, nullable=True)
    rating = Column(Float, default=4.9)
    total_sessions = Column(Integer, default=34)
    skills_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="mentor_profile")

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    company_name = Column(String(255), nullable=False)
    company_type = Column(String(50), default="IT", nullable=False) # IT vs NON_IT
    industry = Column(String(255), default="Enterprise Software")
    company_size = Column(String(100), default="500-1000 employees")
    location = Column(String(255), default="Bengaluru / Hybrid")
    website = Column(String(255), nullable=True)
    website_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    tech_stack_json = Column(JSON, default=list)
    domains_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="company_profile")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    tagline = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    project_type = Column(String(50), default="OPEN_SOURCE") # OPEN_SOURCE, COLLEGE_PROJECT, INDUSTRY_PROJECT, PROPRIETARY
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    owner_name = Column(String(255), default="PoOS Core Maintainers")
    college_name = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    repo_url = Column(String(500), nullable=True)
    rights_tag = Column(String(100), default="MIT License — Open Contribution")
    status = Column(String(50), default="ACTIVE")
    stars_count = Column(Integer, default=12)
    forks_count = Column(Integer, default=4)
    tech_stack_json = Column(JSON, default=list)
    scope = Column(String(100), default="Open to Entire PoOS") # College Only, Selected Colleges, Entire PoOS
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String(50), default="CONTRIBUTOR") # LEAD, MAINTAINER, CONTRIBUTOR, REVIEWER
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProjectTask(Base):
    __tablename__ = "project_tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="BACKLOG") # BACKLOG, IN_PROGRESS, CODE_REVIEW, DONE
    priority = Column(String(50), default="Medium")
    assignee_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProjectIssue(Base):
    __tablename__ = "project_issues"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    status = Column(String(50), default="OPEN") # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    label = Column(String(50), default="GOOD_FIRST_ISSUE") # BUG, FEATURE, DOCUMENTATION, GOOD_FIRST_ISSUE
    author_name = Column(String(255), default="Community Contributor")
    assignee_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    contributor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    contributor_name = Column(String(255), nullable=False)
    commit_hash = Column(String(100), nullable=False)
    commit_message = Column(String(500), nullable=False)
    pr_number = Column(Integer, nullable=True)
    pr_title = Column(String(255), nullable=True)
    status = Column(String(50), default="MERGED")
    lines_added = Column(Integer, default=120)
    lines_deleted = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Shortlist(Base):
    __tablename__ = "shortlists"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    student_name = Column(String(255), nullable=False)
    category = Column(String(100), default="High Potential Technical Candidate")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    company_name = Column(String(255), nullable=False)
    student_name = Column(String(255), nullable=False)
    opportunity_type = Column(String(100), default="INTERNSHIP") # INTERNSHIP, EMPLOYMENT, CONTRACT, FREELANCE, CONSULTING
    message = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, DECLINED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    cert_hash = Column(String(100), unique=True, index=True, nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    recipient_name = Column(String(255), nullable=False)
    issuer_name = Column(String(255), default="PoOS Open-source Governing Body")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    issue_date = Column(String(50), default="2026-08-31")
    verification_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    badge_key = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(100), default="award")
    awarded_at = Column(DateTime, default=datetime.datetime.utcnow)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    organizer_name = Column(String(255), nullable=False)
    event_type = Column(String(100), default="HACKATHON") # HACKATHON, SPRINT, WORKSHOP, MEETUP
    description = Column(Text, nullable=True)
    location = Column(String(255), default="Virtual / Hybrid")
    event_date = Column(String(100), default="2026-09-15")
    participant_count = Column(Integer, default=150)
    scope = Column(String(100), default="Open to Entire PoOS") # College Only, Selected Colleges, Entire PoOS
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MentorSession(Base):
    __tablename__ = "mentor_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_name = Column(String(255), nullable=False)
    mentor_name = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_at = Column(String(100), nullable=False) # e.g. "2026-09-05 14:00"
    duration_minutes = Column(Integer, default=45)
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, REJECTED, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class NotificationItem(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="INFO") # REPUTATION, MENTORSHIP, OUTREACH, VERIFICATION, GITHUB
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class GitHubAccount(Base):
    __tablename__ = "github_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    github_id = Column(BigInteger, nullable=False, unique=True, index=True)
    login = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    email = Column(String(255), nullable=True)
    html_url = Column(String(500), nullable=True)
    access_token_enc = Column(Text, nullable=False)
    scope = Column(String(200), nullable=True)
    is_connected = Column(Boolean, default=True, nullable=False)
    last_sync_at = Column(DateTime, nullable=True)
    last_sync_error = Column(Text, nullable=True)
    statistics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    repositories = relationship("GitHubRepository", back_populates="account", cascade="all, delete-orphan")

class GitHubRepository(Base):
    __tablename__ = "github_repositories"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("github_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    github_repo_id = Column(BigInteger, nullable=False)
    name = Column(String(200), nullable=False)
    full_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    html_url = Column(String(500), nullable=True)
    default_branch = Column(String(100), nullable=True)
    visibility = Column(String(50), nullable=True)
    owner_login = Column(String(100), nullable=True)
    languages_json = Column(JSON, nullable=True)
    topics_json = Column(JSON, default=list)
    stargazers_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    is_fork = Column(Boolean, default=False)
    repo_created_at = Column(DateTime, nullable=True)
    repo_updated_at = Column(DateTime, nullable=True)
    repo_pushed_at = Column(DateTime, nullable=True)
    statistics_json = Column(JSON, nullable=True)
    synced_at = Column(DateTime, default=datetime.datetime.utcnow)

    account = relationship("GitHubAccount", back_populates="repositories")

    __table_args__ = (
        UniqueConstraint("account_id", "github_repo_id", name="uq_account_repo"),
    )

class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(64), nullable=False, unique=True, index=True)
    provider = Column(String(20), nullable=False, default="github")
    role = Column(String(50), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


