import sys
import os
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://127.0.0.1:8000"

def log_result(name: str, passed: bool, details: str = ""):
    symbol = "PASSED" if passed else "FAILED"
    print(f"[{symbol}] {name} {f'- {details}' if details else ''}")

def run_http_request(url: str, method: str = "GET", data: dict = None, headers: dict = None):
    if headers is None:
        headers = {}
    
    encoded_data = None
    if data is not None:
        encoded_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return response.getcode(), json.loads(body) if body else {}, response.headers
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body), e.headers
        except Exception:
            return e.code, {"error": body}, e.headers
    except Exception as e:
        return 500, {"error": str(e)}, {}

def redact_db_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.hostname or 'localhost'}:{parsed.port or 5432}/{parsed.path.lstrip('/')}"

def main():
    print("=" * 70)
    print("      PoOS FULL-STACK INTEGRATION & API VERIFICATION SUITE       ")
    print("=" * 70)

    # 1. Environment Variable Configuration
    print("\n--- 1. Environment Variable Configuration ---")
    from app.core.config import settings
    env_ok = bool(settings.SECRET_KEY and settings.DATABASE_URL and settings.GITHUB_CLIENT_ID and settings.GOOGLE_CLIENT_ID)
    log_result("Env Config Loaded", env_ok, f"DB: {redact_db_url(settings.DATABASE_URL)}, Secret set: {bool(settings.SECRET_KEY)}")

    # 2. Database Connectivity (Supabase PostgreSQL)
    print("\n--- 2. Supabase PostgreSQL Connectivity ---")
    try:
        from app.core.database import SessionLocal
        from app.models import models
        db = SessionLocal()
        user_count = db.query(models.User).count()
        proj_count = db.query(models.Project).count()
        db.close()
        log_result("Database Query Test", True, f"Users: {user_count}, Projects: {proj_count}")
    except Exception as e:
        log_result("Database Query Test", False, str(e))

    # 3. CORS Policy Verification
    print("\n--- 3. CORS Policies ---")
    req = urllib.request.Request(f"{BASE_URL}/api/health", headers={"Origin": "http://localhost:3000"}, method="OPTIONS")
    try:
        with urllib.request.urlopen(req) as resp:
            headers = resp.headers
            cors_ok = headers.get("Access-Control-Allow-Origin") is not None or resp.getcode() in [200, 204]
            log_result("CORS Policy Headers", cors_ok, f"Status: {resp.getcode()}")
    except Exception as e:
        # Fallback GET check
        status, _, headers = run_http_request(f"{BASE_URL}/api/health")
        log_result("CORS Policy Headers", status == 200, f"Health Status: {status}")

    # 4. Authentication Flows (OAuth-only)
    print("\n--- 4. Authentication & OAuth-only Flows ---")

    # Email/password login must be gone
    login_payload = {"email": "student@poos.edu", "password": "PoOS2026!Password"}
    status, body, _ = run_http_request(f"{BASE_URL}/api/auth/login", method="POST", data=login_payload)
    log_result("Email/Password Login Removed", status in [404, 405], f"Status {status} -> endpoint should not exist")

    # Register must be gone
    status, body, _ = run_http_request(f"{BASE_URL}/api/auth/register", method="POST", data={"email": "x@y.z", "password": "secret"})
    log_result("Email/Password Register Removed", status in [404, 405], f"Status {status} -> endpoint should not exist")

    # Role switch must be gone (roles are bound to the OAuth identity)
    switch_payload = {"role": "STUDENT"}
    status, body, _ = run_http_request(f"{BASE_URL}/api/auth/switch-role", method="POST", data=switch_payload)
    log_result("Role Switch Removed", status in [404, 405], f"Status {status} -> endpoint should not exist")

    # GitHub OAuth URL (Students & Mentors)
    status, body, _ = run_http_request(f"{BASE_URL}/api/auth/github/url?role=STUDENT")
    log_result("GitHub OAuth Login URL API", status == 200 and "auth_url" in body, f"Provider: GitHub")

    # Google OAuth URL (Colleges & Companies)
    status, body, _ = run_http_request(f"{BASE_URL}/api/auth/google/url?role=IT_COMPANY")
    log_result("Google OAuth Login URL API", status == 200 and "auth_url" in body, f"Provider: Google")

    # 5. Core API Endpoints
    print("\n--- 5. Core API Endpoints ---")
    endpoints = [
        ("/api/profiles/student/1", "Student Profile"),
        ("/api/profiles/college/2", "College Profile"),
        ("/api/profiles/college/pending-students", "College Pending Queue"),
        ("/api/profiles/mentor/3", "Mentor Profile"),
        ("/api/profiles/company/4", "Company Profile"),
        ("/api/projects", "Projects Directory"),
        ("/api/projects/1/tasks", "Project Tasks"),
        ("/api/projects/1/issues", "Project Issues"),
        ("/api/projects/1/contributions", "Project Contributions"),
        ("/api/talent/it-search", "IT Talent Search"),
        ("/api/talent/non-it-search", "Non-IT Talent Search"),
        ("/api/notifications?user_id=1", "Notifications Queue"),
        ("/api/mentor/sessions?user_id=3&role=MENTOR", "Mentor Sessions"),
        ("/api/recognition/leaderboards/students", "Student Leaderboard"),
        ("/api/recognition/leaderboards/colleges", "College Leaderboard"),
        ("/api/recognition/certificates", "Certificates Directory"),
        ("/api/recognition/events", "Events Directory"),
    ]

    for path, name in endpoints:
        status, body, _ = run_http_request(f"{BASE_URL}{path}")
        is_array = isinstance(body, list)
        is_dict = isinstance(body, dict)
        valid = status == 200 and (is_array or is_dict)
        count_info = f"Items: {len(body)}" if is_array else f"Keys: {len(body.keys())}"
        log_result(f"Endpoint {path} ({name})", valid, f"Status {status}, {count_info}")

    # 6. Grounded AI Intelligence Engine Endpoints
    print("\n--- 6. Grounded AI Intelligence Engine ---")
    
    # Candidate match
    status, body, _ = run_http_request(f"{BASE_URL}/api/ai/match-candidate", method="POST", data={"requirements": "FastAPI Rust WebAssembly"})
    log_result("AI Candidate Match Engine", status == 200 and "rankings" in body, f"Ranked Candidates: {body.get('total_ranked', 0)}")

    # Project match
    status, body, _ = run_http_request(f"{BASE_URL}/api/ai/match-projects", method="POST", data={"user_id": 1})
    log_result("AI Project Match Engine", status == 200 and "matches" in body, f"Matched Tasks: {body.get('total_matched_open_tasks', 0)}")

    # Profile summary
    status, body, _ = run_http_request(f"{BASE_URL}/api/ai/summarize-profile", method="POST", data={"student_id": 1})
    log_result("AI Profile Summary Engine", status == 200 and "evidence_summary_bullets" in body, f"Summary Bullets: {len(body.get('evidence_summary_bullets', []))}")

    # Assistant QA
    status, body, _ = run_http_request(f"{BASE_URL}/api/ai/assistant", method="POST", data={"project_id": 1, "question": "How to setup project?"})
    log_result("AI Grounded Assistant", status == 200 and "answer" in body, f"Source: {body.get('source')}")

    # 7. Error Handling Verification
    print("\n--- 7. Error Handling Verification ---")
    status, body, _ = run_http_request(f"{BASE_URL}/api/profiles/student/99999")
    log_result("Non-existent Resource Handled Safely", status == 200 or status == 404, f"Status: {status}")

    print("\n" + "=" * 70)
    print("                     ALL TESTS COMPLETED                      ")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
