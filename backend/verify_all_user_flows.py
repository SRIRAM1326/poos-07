import sys
import os
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def log_result(role: str, flow_name: str, passed: bool, details: str = ""):
    status = "PASSED" if passed else "FAILED"
    print(f"[{status}] [{role.upper()}] {flow_name} {f'- {details}' if details else ''}")

def http_post(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

def http_get(url: str):
    try:
        with urllib.request.urlopen(url) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

def main():
    print("=" * 80)
    print("      PoOS COMPREHENSIVE MULTI-ROLE USER FLOW VERIFICATION SUITE       ")
    print("=" * 80 + "\n")

    # 1. STUDENT USER FLOWS
    print("--- 1. STUDENT USER FLOWS ---")
    status, profile = http_get(f"{BASE_URL}/api/profiles/student/1")
    log_result("Student", "Get Super Profile", status == 200 and "full_name" in profile, f"Name: {profile.get('full_name')}, Rep: {profile.get('reputation_score')}")

    status, projects = http_get(f"{BASE_URL}/api/projects")
    log_result("Student", "Projects Directory", status == 200 and isinstance(projects, list), f"Total Projects: {len(projects)}")

    status, tasks = http_get(f"{BASE_URL}/api/projects/1/tasks")
    log_result("Student", "Project Workspace Tasks", status == 200 and isinstance(tasks, list), f"Tasks: {len(tasks)}")

    webhook_payload = {"contributor_github": "aarav-sharma-dev", "commit_message": "feat(pgvector): SIMD distance indexer", "lines_added": 340}
    status, webhook_res = http_post(f"{BASE_URL}/api/webhooks/github", webhook_payload)
    log_result("Student", "GitHub Webhook Code Ingestion", status == 200, f"Reputation Gained: +{webhook_res.get('reputation_points_gained')} pts")

    # 2. COLLEGE ADMIN USER FLOWS
    print("\n--- 2. COLLEGE ADMIN USER FLOWS ---")
    status, college_prof = http_get(f"{BASE_URL}/api/profiles/college/2")
    log_result("College", "Get Institution Profile", status == 200, f"Institution: {college_prof.get('college_name')}")

    status, pending = http_get(f"{BASE_URL}/api/profiles/college/pending-students")
    log_result("College", "Pending Verification Queue", status == 200 and isinstance(pending, list), f"Pending Candidates: {len(pending)}")

    status, verify_res = http_post(f"{BASE_URL}/api/profiles/college/verify-student/3", {})
    log_result("College", "Verify Student Identity", status == 200, f"Status: {verify_res.get('status')}")

    # 3. MENTOR USER FLOWS
    print("\n--- 3. MENTOR USER FLOWS ---")
    status, mentor_prof = http_get(f"{BASE_URL}/api/profiles/mentor/3")
    log_result("Mentor", "Get Mentor Profile", status == 200, f"Name: {mentor_prof.get('full_name')}, Rating: {mentor_prof.get('rating')}")

    status, sessions = http_get(f"{BASE_URL}/api/mentor/sessions?user_id=3&role=MENTOR")
    log_result("Mentor", "Mentor Session Requests", status == 200 and isinstance(sessions, list), f"Sessions: {len(sessions)}")

    status, sess_status = http_post(f"{BASE_URL}/api/mentor/sessions/1/status?status=ACCEPTED", {})
    log_result("Mentor", "Accept Architecture Review Session", status == 200 and "new_status" in sess_status, f"New Status: {sess_status.get('new_status')}")

    # 4. IT COMPANY USER FLOWS
    print("\n--- 4. IT COMPANY USER FLOWS ---")
    status, company_prof = http_get(f"{BASE_URL}/api/profiles/company/4")
    log_result("IT Company", "Get IT Company Profile", status == 200, f"Company: {company_prof.get('company_name')}")

    jd_payload = {
        "job_description": "Seeking Backend Engineer proficient in FastAPI, Rust WebAssembly, and PostgreSQL pgvector",
        "skills": "Rust FastAPI",
        "domain_expertise": "Distributed Systems",
        "company_type": "IT"
    }
    status, jd_res = http_post(f"{BASE_URL}/api/talent/search-jd", jd_payload)
    top_cand = jd_res.get("rankings", [{}])[0]
    log_result("IT Company", "JD Candidate Search & Ranking", status == 200 and jd_res.get("total_ranked", 0) > 0, f"Top Match: {top_cand.get('full_name')} ({top_cand.get('match_score')}%)")

    shortlist_payload = {"student_id": 1, "category": "Core Distributed Systems Engineer", "notes": "Top candidate with 99% match"}
    status, shortlist_res = http_post(f"{BASE_URL}/api/talent/shortlist", shortlist_payload)
    log_result("IT Company", "Shortlist Candidate", status == 200, f"Msg: {shortlist_res.get('message')}")

    outreach_payload = {"student_id": 1, "opportunity_type": "INTERNSHIP", "message": "Direct inquiry for AI infrastructure role"}
    status, outreach_res = http_post(f"{BASE_URL}/api/talent/contact-request", outreach_payload)
    log_result("IT Company", "Send Direct Outreach", status == 200, f"Msg: {outreach_res.get('message')}")

    # 5. NON-IT COMPANY USER FLOWS
    print("\n--- 5. NON-IT COMPANY USER FLOWS ---")
    status, non_it = http_get(f"{BASE_URL}/api/talent/non-it-search")
    log_result("Non-IT Company", "Operations & Business Talent Search", status == 200 and isinstance(non_it, list), f"Found: {len(non_it)}")

    non_it_jd = {
        "job_description": "Seeking candidate with expertise in supply chain logistics simulation and PyTorch analytics",
        "domain_expertise": "Supply Chain Analytics",
        "company_type": "NON_IT"
    }
    status, non_it_res = http_post(f"{BASE_URL}/api/talent/search-jd", non_it_jd)
    log_result("Non-IT Company", "Non-IT JD Matcher Engine", status == 200, f"Ranked Candidates: {non_it_res.get('total_ranked')}")

    # 6. AUTHENTICATION & OAUTH FLOWS
    print("\n--- 6. AUTHENTICATION & OAUTH FLOWS (OAuth-only) ---")
    status, gh_auth = http_get(f"{BASE_URL}/api/auth/github/url?role=STUDENT")
    log_result("Auth", "GitHub OAuth Login URL (Student)", status == 200 and "auth_url" in gh_auth, "Provider: GitHub")

    status, gh_restricted = http_get(f"{BASE_URL}/api/auth/github/url?role=COLLEGE_ADMIN")
    log_result("Auth", "GitHub Rejects Non-GitHub Roles", status == 400, "Provider: GitHub")

    status, goog_auth = http_get(f"{BASE_URL}/api/auth/google/url?role=IT_COMPANY")
    log_result("Auth", "Google OAuth Login URL (Company)", status == 200 and "auth_url" in goog_auth, "Provider: Google Workspace")

    status, goog_restricted = http_get(f"{BASE_URL}/api/auth/google/url?role=STUDENT")
    log_result("Auth", "Google Rejects Non-Google Roles", status == 400, "Provider: Google Workspace")

    status, legacy_register = http_post(f"{BASE_URL}/api/auth/register", {"email": "x@y.z", "password": "secret"})
    log_result("Auth", "Email/Password Register Removed", status in [404, 405], "Should not exist")

    status, legacy_login = http_post(f"{BASE_URL}/api/auth/login", {"email": "student@poos.edu", "password": "secret"})
    log_result("Auth", "Email/Password Login Removed", status in [404, 405], "Should not exist")

    # 7. RECOGNITION & GROUNDED AI ENGINE
    print("\n--- 7. RECOGNITION & GROUNDED AI ENGINE ---")
    status, s_board = http_get(f"{BASE_URL}/api/recognition/leaderboards/students")
    log_result("Recognition", "Student Leaderboard", status == 200 and isinstance(s_board, list), f"Top Student: {s_board[0].get('full_name') if s_board else 'N/A'}")

    status, certs = http_get(f"{BASE_URL}/api/recognition/certificates")
    log_result("Recognition", "Certificates Directory", status == 200 and isinstance(certs, list), f"Total Credentials: {len(certs)}")

    status, events = http_get(f"{BASE_URL}/api/recognition/events")
    log_result("Recognition", "Events & Hackathons", status == 200 and isinstance(events, list), f"Total Events: {len(events)}")

    print("\n" + "=" * 80)
    print("                     ALL MULTI-ROLE FLOWS AUDITED                      ")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
