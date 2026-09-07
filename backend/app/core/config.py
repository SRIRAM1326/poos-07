import os
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "PoOS — Project & Open-source Opportunity System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Supabase PostgreSQL database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # GitHub OAuth Integration (Students, Mentors, Developers)
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000")
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")
    # Optional dedicated Fernet key (urlsafe-base64 32-byte) for encrypting GitHub
    # access tokens at rest. When absent, a key is derived from SECRET_KEY.
    GITHUB_TOKEN_ENCRYPTION_KEY: str = os.getenv("GITHUB_TOKEN_ENCRYPTION_KEY", "")

    # Google OAuth Integration (Colleges, IT Companies, Non-IT Companies)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:3000?google_auth=success")

    # CORS origins allowed to call this API. Override per environment via
    # CORS_ORIGINS (comma-separated). No wildcards are allowed with credentials.
    CORS_ORIGINS: list = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if o.strip()
    ]

settings = Settings()

# Fail fast when required secrets are absent. No secret may fall back to a
# hardcoded value: a committed fallback turns a missing-config mistake into a
# credential leak.
_REQUIRED_SECRETS = (
    "SECRET_KEY",
    "DATABASE_URL",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GITHUB_WEBHOOK_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
)
_missing_secrets = [name for name in _REQUIRED_SECRETS if not getattr(settings, name)]
if _missing_secrets:
    raise RuntimeError(
        "Missing required environment variable(s). Set them in backend/.env or the "
        f"process environment: {', '.join(_missing_secrets)}"
    )
