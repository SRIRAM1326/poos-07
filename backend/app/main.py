import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.models import models
from app.api import auth, profiles, projects, talent, recognition, webhooks, github_auth, google_auth, ai, mentor_sessions, notifications, messages, events, github
from app.services.background_sync import periodic_github_sync_loop

from sqlalchemy import text

# Automatically migrate missing database columns in Supabase PostgreSQL
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE IF EXISTS github_oauth_states RENAME TO oauth_states;"))
        conn.commit()
except Exception as err:
    print(f"Migration notice (oauth_states rename): {err}")

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_uid VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"))
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS hashed_password;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE oauth_states ALTER COLUMN user_id DROP NOT NULL;"))
        conn.execute(text("ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS role VARCHAR(50);"))
        conn.execute(text("ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'github';"))
        conn.execute(text("ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);"))
        conn.execute(text("ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS description TEXT;"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS accreditation VARCHAR(500);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS admin_designation VARCHAR(255);"))
        conn.execute(text("ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING';"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain VARCHAR(255);"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS required_skills_json JSON DEFAULT '[]';"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50);"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'PUBLIC';"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date VARCHAR(100);"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_completion VARCHAR(100);"))
        conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS mentor_name VARCHAR(255);"))
        conn.execute(text("ALTER TABLE project_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED';"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id INTEGER;"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(100);"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date VARCHAR(100);"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline VARCHAR(100);"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS event_status VARCHAR(20);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS affiliation VARCHAR(255);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS established_year VARCHAR(10);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS college_type VARCHAR(50);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS official_contact_email VARCHAR(255);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS address TEXT;"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS other_links_json JSON DEFAULT '[]';"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS admin_contact_number VARCHAR(50);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS admin_role VARCHAR(100);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);"))
        conn.execute(text("ALTER TABLE college_profiles ADD COLUMN IF NOT EXISTS verification_date VARCHAR(100);"))
        conn.execute(text("UPDATE project_members SET status = 'APPROVED' WHERE status IS NULL;"))
        conn.execute(text("UPDATE student_profiles SET verification_status = 'PENDING' WHERE verification_status IS NULL;"))
        conn.execute(text("UPDATE student_profiles SET verification_status = 'VERIFIED' WHERE verified_by_college = TRUE AND verification_status = 'PENDING';"))
        conn.execute(text("ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS statistics_json JSON;"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS company VARCHAR(255);"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS location VARCHAR(255);"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS blog VARCHAR(500);"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS followers INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS following INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS public_repos INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS account_created_at TIMESTAMP;"))
        conn.execute(text("ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS languages_json JSON;"))
        conn.execute(text("ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS primary_language VARCHAR(100);"))
        conn.execute(text("ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS size INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS open_issues_count INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS license_name VARCHAR(100);"))
        conn.execute(text("ALTER TABLE github_repositories ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;"))
        conn.commit()
except Exception as err:
    print(f"Migration notice: {err}")

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Periodically resync GitHub stats for all connected accounts so activity
    # reflects in PoOS even when no webhook event is delivered.
    task = asyncio.create_task(periodic_github_sync_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend API service for PoOS — Project & Open-source Opportunity System connecting Students, Colleges, Mentors, IT Companies, and Non-IT Companies via Supabase PostgreSQL.",
    lifespan=lifespan,
)

# Enable CORS for configured frontend origins (from env CORS_ORIGINS, no wildcards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profiles.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(talent.router, prefix=settings.API_V1_STR)
app.include_router(recognition.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)
app.include_router(github_auth.router, prefix=settings.API_V1_STR)
app.include_router(google_auth.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(mentor_sessions.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router)
app.include_router(messages.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(github.router, prefix=settings.API_V1_STR)



@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "database": "Supabase PostgreSQL Connected",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def healthcheck():
    return {"status": "ok", "message": "PoOS FastAPI service is healthy and connected to Supabase PostgreSQL."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
