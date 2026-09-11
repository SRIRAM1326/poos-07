import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, SessionLocal
from app.models import models

def init_db(force_reseed: bool = False):
    print("Initializing database tables in Supabase PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Tables verified/created successfully!")

    # Seeding injects a fabricated demo dataset into the live database. It is
    # intentionally disabled unless explicitly requested via POOS_ALLOW_SEED,
    # so production data is never wiped or polluted with mock records.
    if os.getenv("POOS_ALLOW_SEED") != "1":
        print("Seeding is disabled. Set POOS_ALLOW_SEED=1 to populate the demo dataset.")
        return

    db = SessionLocal()
    try:
        if not force_reseed and db.query(models.User).first():
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding rich mock dataset (Students, Mentors, Colleges, IT/Non-IT Companies, Projects, Notifications)...")

        # 1. Clear existing seed records if reseeding
        if force_reseed:
            try:
                db.query(models.NotificationItem).delete()
                db.query(models.MentorSession).delete()
                db.query(models.Message).delete()
                db.query(models.Contribution).delete()
                db.query(models.ProjectIssue).delete()
                db.query(models.ProjectTask).delete()
                db.query(models.ProjectMember).delete()
                db.query(models.Project).delete()
                db.query(models.Shortlist).delete()
                db.query(models.ContactRequest).delete()
                db.query(models.Certificate).delete()
                db.query(models.Badge).delete()
                db.query(models.Event).delete()
                db.query(models.StudentProfile).delete()
                db.query(models.CollegeProfile).delete()
                db.query(models.MentorProfile).delete()
                db.query(models.CompanyProfile).delete()
                db.query(models.User).delete()
                db.commit()
                print("Existing database tables cleared for clean mock data reset.")
            except Exception as clean_err:
                db.rollback()
                print(f"Clean reset notice: {clean_err}")

        # Default mock OAuth identity for seed accounts (never used for login).
        oauth_provider = "seed"

        # -------------------------------------------------------------
        # 1. STUDENT USERS & PROFILES
        # -------------------------------------------------------------
        student1 = models.User(
            email="student@poos.edu",
            username="aarav-sharma-dev",
            full_name="Aarav Sharma",
            role="STUDENT",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-student-1",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            linkedin_url="https://linkedin.com/in/aaravsharma",
            portfolio_url="https://aaravsharma.dev",
            github_url="https://github.com/aarav-sharma-dev",
            profile_completed=True
        )
        student2 = models.User(
            email="diya.nair@poos.edu",
            username="diya-nair-ai",
            full_name="Diya Nair",
            role="STUDENT",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-student-2",
            avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
            linkedin_url="https://linkedin.com/in/diyanair-ai",
            portfolio_url="https://diyanair.ai",
            github_url="https://github.com/diya-nair-ai",
            profile_completed=True
        )
        student3 = models.User(
            email="rohan.verma@poos.edu",
            username="rohan-verma-robotics",
            full_name="Rohan Verma",
            role="STUDENT",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-student-3",
            avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
            linkedin_url="https://linkedin.com/in/rohanverma-robotics",
            portfolio_url="https://rohanverma.me",
            github_url="https://github.com/rohan-verma-robotics",
            profile_completed=True
        )
        student4 = models.User(
            email="ananya.d@poos.edu",
            username="ananya-deshmukh-cloud",
            full_name="Ananya Deshmukh",
            role="STUDENT",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-student-4",
            avatar_url="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
            linkedin_url="https://linkedin.com/in/ananyadeshmukh",
            portfolio_url="https://ananyacloud.io",
            github_url="https://github.com/ananya-deshmukh-cloud",
            profile_completed=True
        )
        db.add_all([student1, student2, student3, student4])
        db.flush()

        p_student1 = models.StudentProfile(
            user_id=student1.id,
            roll_number="CS2023-8891",
            college_name="Indian Institute of Technology, Madras",
            department="Computer Science & Engineering",
            year_of_study="4th Year B.Tech",
            bio="Full-stack open-source contributor passionate about high-throughput distributed systems, WebAssembly runtime engines, and Rust.",
            github_handle="aarav-sharma-dev",
            linkedin_url="https://linkedin.com/in/aaravsharma",
            portfolio_url="https://aaravsharma.dev",
            reputation_score=1280,
            verified_by_college=True,
            verification_status="VERIFIED",
            skills_json=[
                {"name": "Rust & WebAssembly", "level": "Expert", "category": "Core Systems", "verified": True},
                {"name": "FastAPI & Python", "level": "Advanced", "category": "Backend", "verified": True},
                {"name": "Next.js & TypeScript", "level": "Advanced", "category": "Frontend", "verified": True},
                {"name": "PostgreSQL & pgvector", "level": "Advanced", "category": "Database", "verified": True},
                {"name": "Docker & Kubernetes", "level": "Intermediate", "category": "DevOps", "verified": True}
            ]
        )
        p_student2 = models.StudentProfile(
            user_id=student2.id,
            roll_number="DS2024-4012",
            college_name="National Institute of Technology, Trichy",
            department="Data Science & AI",
            year_of_study="3rd Year B.Tech",
            bio="AI engineer specializing in LLM fine-tuning, retrieval-augmented generation (RAG), PyTorch model quantization, and data analytics pipelines.",
            github_handle="diya-nair-ai",
            linkedin_url="https://linkedin.com/in/diyanair-ai",
            portfolio_url="https://diyanair.ai",
            reputation_score=940,
            verified_by_college=True,
            verification_status="VERIFIED",
            skills_json=[
                {"name": "PyTorch & Deep Learning", "level": "Advanced", "category": "AI/ML", "verified": True},
                {"name": "Python & FastAPI", "level": "Advanced", "category": "Backend", "verified": True},
                {"name": "Scikit-Learn & Pandas", "level": "Expert", "category": "Data Science", "verified": True},
                {"name": "Vector Databases (Chroma/FAISS)", "level": "Intermediate", "category": "AI Infrastructure", "verified": True}
            ]
        )
        p_student3 = models.StudentProfile(
            user_id=student3.id,
            roll_number="ME2022-1055",
            college_name="Birla Institute of Technology and Science, Pilani",
            department="Mechanical & Robotics Engineering",
            year_of_study="4th Year B.Tech",
            bio="Robotics and embedded software developer building autonomous navigation controllers, ROS2 micro-nodes, and real-time C++ drivers.",
            github_handle="rohan-verma-robotics",
            linkedin_url="https://linkedin.com/in/rohanverma-robotics",
            portfolio_url="https://rohanverma.me",
            reputation_score=810,
            verified_by_college=False, # Unverified to demonstrate College Admin verification queue!
            verification_status="PENDING",
            skills_json=[
                {"name": "C++ & Embedded Systems", "level": "Expert", "category": "Systems", "verified": False},
                {"name": "ROS2 & Gazebo Simulator", "level": "Advanced", "category": "Robotics", "verified": False},
                {"name": "Python Kinematics", "level": "Advanced", "category": "Simulation", "verified": False}
            ]
        )
        p_student4 = models.StudentProfile(
            user_id=student4.id,
            roll_number="SE2025-9920",
            college_name="Delhi Technological University",
            department="Software Engineering",
            year_of_study="2nd Year M.Tech",
            bio="Cloud native developer working on Go microservices, gRPC protocol streaming, and eBPF kernel network monitoring.",
            github_handle="ananya-deshmukh-cloud",
            linkedin_url="https://linkedin.com/in/ananyadeshmukh",
            portfolio_url="https://ananyacloud.io",
            reputation_score=1120,
            verified_by_college=True,
            verification_status="VERIFIED",
            skills_json=[
                {"name": "Go & gRPC", "level": "Expert", "category": "Backend", "verified": True},
                {"name": "Kubernetes & Helm", "level": "Advanced", "category": "Cloud Native", "verified": True},
                {"name": "eBPF & Linux Kernel", "level": "Intermediate", "category": "Systems", "verified": True}
            ]
        )
        db.add_all([p_student1, p_student2, p_student3, p_student4])

        # -------------------------------------------------------------
        # 2. COLLEGE ADMIN USERS & PROFILES
        # -------------------------------------------------------------
        college1_user = models.User(
            email="admin@iitm.ac.in",
            username="iitm-admin",
            full_name="Dr. Rajesh Raman (IIT Madras)",
            role="COLLEGE_ADMIN",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-college-1",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        )
        college2_user = models.User(
            email="admin@nitt.edu",
            username="nitt-admin",
            full_name="Dr. Sunita Krishnan (NIT Trichy)",
            role="COLLEGE_ADMIN",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-college-2",
            avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
        )
        db.add_all([college1_user, college2_user])
        db.flush()

        p_college1 = models.CollegeProfile(
            user_id=college1_user.id,
            college_name="Indian Institute of Technology, Madras",
            college_code="IITM-01",
            location="Chennai, Tamil Nadu",
            website="https://www.iitm.ac.in",
            is_verified=True,
            student_count=4500,
            active_projects_count=128,
            departments_json=[
                {"name": "Computer Science & Engineering", "students": 850, "projects": 42},
                {"name": "Electrical & Electronics Engineering", "students": 720, "projects": 28},
                {"name": "Data Science & AI", "students": 600, "projects": 34},
                {"name": "Mechanical & Robotics", "students": 950, "projects": 24}
            ]
        )
        p_college2 = models.CollegeProfile(
            user_id=college2_user.id,
            college_name="National Institute of Technology, Trichy",
            college_code="NITT-02",
            location="Tiruchirappalli, Tamil Nadu",
            website="https://www.nitt.edu",
            is_verified=True,
            student_count=3800,
            active_projects_count=94,
            departments_json=[
                {"name": "Computer Science & Engineering", "students": 650, "projects": 31},
                {"name": "Data Science & AI", "students": 500, "projects": 26},
                {"name": "Electronics & Communication", "students": 800, "projects": 22}
            ]
        )
        db.add_all([p_college1, p_college2])

        # -------------------------------------------------------------
        # 3. MENTOR USERS & PROFILES
        # -------------------------------------------------------------
        mentor1_user = models.User(
            email="mentor@techcorp.com",
            username="priya-ananth",
            full_name="Priya Ananth",
            role="MENTOR",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-mentor-1",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        )
        mentor2_user = models.User(
            email="siddharth.mehta@aws.com",
            username="siddharth-mehta",
            full_name="Siddharth Mehta",
            role="MENTOR",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-mentor-2",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        )
        db.add_all([mentor1_user, mentor2_user])
        db.flush()

        p_mentor1 = models.MentorProfile(
            user_id=mentor1_user.id,
            title="Principal System Architect",
            company="Google Cloud Platform / ex-Uber",
            experience_years=12,
            domain_expertise="Distributed Systems, Cloud Native Infrastructure, Microservices",
            hourly_rate=0.0,
            bio="Mentoring open-source projects, code review standards, system design interviews, and career growth for engineering students.",
            rating=4.95,
            total_sessions=68,
            skills_json=["System Design", "Cloud Infrastructure", "Kubernetes", "Golang", "Rust"]
        )
        p_mentor2 = models.MentorProfile(
            user_id=mentor2_user.id,
            title="Senior Staff ML Engineer",
            company="AWS AI Labs / ex-Meta",
            experience_years=10,
            domain_expertise="Deep Learning Infrastructure, Distributed Model Training, PyTorch SIMD",
            hourly_rate=0.0,
            bio="Guiding students on production ML engineering, vector similarity search, and high-performance GPU backend design.",
            rating=4.92,
            total_sessions=45,
            skills_json=["Machine Learning", "PyTorch", "CUDA", "FastAPI", "Vector Indexes"]
        )
        db.add_all([p_mentor1, p_mentor2])

        # -------------------------------------------------------------
        # 4. IT & NON-IT COMPANY USERS & PROFILES
        # -------------------------------------------------------------
        it_company_user = models.User(
            email="talent@acmetech.io",
            username="acme-talent",
            full_name="Sophia Vance (Acme Cloud Labs)",
            role="IT_COMPANY",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-it-company-1",
            avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
        )
        non_it_company_user = models.User(
            email="talent@finlogix.com",
            username="finlogix-talent",
            full_name="Vikramaditya Rao (FinLogix)",
            role="NON_IT_COMPANY",
            oauth_provider=oauth_provider,
            oauth_provider_uid="seed-non-it-company-1",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        )
        db.add_all([it_company_user, non_it_company_user])
        db.flush()

        p_it_company = models.CompanyProfile(
            user_id=it_company_user.id,
            company_name="Acme Cloud & AI Labs",
            company_type="IT",
            industry="Enterprise Software & AI Infrastructure",
            company_size="1000+ employees",
            location="Bengaluru / San Francisco",
            website="https://acmetech.io",
            description="Leading provider of high-throughput vector database search and real-time backend infrastructure.",
            tech_stack_json=["Python", "FastAPI", "Rust", "TypeScript", "PostgreSQL", "OpenSearch"],
            domains_json=["Cloud Native", "AI/ML Engineering", "High Performance Backend"]
        )
        p_non_it_company = models.CompanyProfile(
            user_id=non_it_company_user.id,
            company_name="FinLogix Supply Chain & Capital",
            company_type="NON_IT",
            industry="Global Supply Chain Logistics & Financial Services",
            company_size="5000+ employees",
            location="Mumbai / Singapore",
            website="https://finlogix.com",
            description="Multinational supply chain operator integrating automated data analytics, ERP systems, and warehouse automation.",
            tech_stack_json=["Business Analytics", "SQL Data Warehousing", "Python Automation", "Financial Modeling"],
            domains_json=["Operations Tech", "Supply Chain Data Analytics", "FinTech Integration"]
        )
        db.add_all([p_it_company, p_non_it_company])

        # -------------------------------------------------------------
        # 5. PROJECTS (OPEN SOURCE, COLLEGE & INDUSTRY)
        # -------------------------------------------------------------
        proj1 = models.Project(
            title="HyperVector — Vector Search Engine for pgvector",
            tagline="Sub-millisecond high-dimensional embedding indexer built for Supabase PostgreSQL",
            description="HyperVector is an open-source technical project optimized for fast similarity search across LLM embeddings. It integrates directly with PostgreSQL pgvector and FastAPI backend services.",
            project_type="OPEN_SOURCE",
            owner_id=student1.id,
            owner_name="Aarav Sharma",
            college_name="Indian Institute of Technology, Madras",
            repo_url="https://github.com/poos-ecosystem/hypervector-engine",
            rights_tag="MIT Open Source",
            status="ACTIVE",
            stars_count=124,
            forks_count=32,
            tech_stack_json=["Python", "FastAPI", "PostgreSQL", "pgvector", "Rust"]
        )
        proj2 = models.Project(
            title="SmartGrid Logistics — Real-time Supply Chain Simulator",
            tagline="Event-driven route optimization and inventory forecasting platform for logistics operators",
            description="Designed for non-IT logistics firms to model freight congestion, warehouse capacities, and automated dispatch routines with interactive visualization.",
            project_type="INDUSTRY_PROJECT",
            owner_id=non_it_company_user.id,
            owner_name="FinLogix Engineering Group",
            company_name="FinLogix Supply Chain",
            repo_url="https://github.com/poos-ecosystem/smartgrid-logistics",
            rights_tag="Industry Collaborative",
            status="ACTIVE",
            stars_count=68,
            forks_count=14,
            tech_stack_json=["Python", "Next.js", "SQL", "Data Analytics"]
        )
        proj3 = models.Project(
            title="AutoROS2 — Autonomous Drone Swarm Controller",
            tagline="Distributed ROS2 mesh communication engine for multi-agent swarm trajectory planning",
            description="Built by robotics developers at BITS Pilani to simulate multi-agent collision avoidance algorithms on ROS2 and C++ embedded platforms.",
            project_type="COLLEGE_PROJECT",
            owner_id=student3.id,
            owner_name="Rohan Verma",
            college_name="Birla Institute of Technology and Science, Pilani",
            repo_url="https://github.com/poos-ecosystem/autoros2-swarm",
            rights_tag="Academic Open Research",
            status="ACTIVE",
            stars_count=45,
            forks_count=9,
            tech_stack_json=["C++", "ROS2", "Python", "Gazebo Simulator"]
        )
        db.add_all([proj1, proj2, proj3])
        db.flush()

        # -------------------------------------------------------------
        # 6. PROJECT TASKS & ISSUES
        # -------------------------------------------------------------
        task1 = models.ProjectTask(
            project_id=proj1.id,
            title="Implement HNSW index generator for pgvector 0.7+",
            description="Optimize HNSW graph construction timing during batch vector inserts.",
            status="IN_PROGRESS",
            priority="High",
            assignee_name="Aarav Sharma"
        )
        task2 = models.ProjectTask(
            project_id=proj1.id,
            title="Add SIMD vector distance calculation bench",
            description="Benchmarking L2 distance against Cosine distance for 1536-dim OpenAI embeddings.",
            status="CODE_REVIEW",
            priority="Critical",
            assignee_name="Aarav Sharma"
        )
        task3 = models.ProjectTask(
            project_id=proj2.id,
            title="Build route congestion forecasting model using PyTorch",
            description="Predict delay probabilities across major highway freight corridors.",
            status="IN_PROGRESS",
            priority="High",
            assignee_name="Diya Nair"
        )
        db.add_all([task1, task2, task3])

        issue1 = models.ProjectIssue(
            project_id=proj1.id,
            title="Memory leak in async batch embedding ingestion worker",
            body="When processing 50k vectors per minute, worker memory consumption ramps up without garbage collection.",
            status="OPEN",
            label="BUG",
            author_name="Priya Ananth",
            assignee_name="Aarav Sharma"
        )
        issue2 = models.ProjectIssue(
            project_id=proj2.id,
            title="CSV ingestion fails on missing timestamp column in FinLogix schema",
            body="Historical logistics logs missing ISO format dates raise unhandled parsing exceptions.",
            status="RESOLVED",
            label="GOOD_FIRST_ISSUE",
            author_name="Vikramaditya Rao",
            assignee_name="Diya Nair"
        )
        db.add_all([issue1, issue2])

        # -------------------------------------------------------------
        # 7. CONTRIBUTIONS
        # -------------------------------------------------------------
        contrib1 = models.Contribution(
            project_id=proj1.id,
            contributor_id=student1.id,
            contributor_name="Aarav Sharma",
            commit_hash="a7f8c9b2",
            commit_message="feat(pgvector): add lock-free concurrent index updates for embedding batches",
            pr_number=14,
            pr_title="Concurrent Vector Indexing & Memory Optimization",
            status="MERGED",
            lines_added=450,
            lines_deleted=32
        )
        contrib2 = models.Contribution(
            project_id=proj2.id,
            contributor_id=student2.id,
            contributor_name="Diya Nair",
            commit_hash="e3d9f1c4",
            commit_message="feat(analytics): add PyTorch time-series predictor for freight arrival times",
            pr_number=8,
            pr_title="Freight Delay Forecasting Engine Integration",
            status="MERGED",
            lines_added=280,
            lines_deleted=14
        )
        db.add_all([contrib1, contrib2])

        # -------------------------------------------------------------
        # 8. MENTOR SESSIONS
        # -------------------------------------------------------------
        sess1 = models.MentorSession(
            student_id=student1.id,
            mentor_id=mentor1_user.id,
            student_name="Aarav Sharma",
            mentor_name="Priya Ananth",
            topic="Distributed Systems Architecture & Vector Indexing Benchmarks",
            description="Reviewing HyperVector lock-free indexing performance under 100k QPS load.",
            scheduled_at="2026-09-08 15:00",
            duration_minutes=45,
            status="ACCEPTED"
        )
        sess2 = models.MentorSession(
            student_id=student2.id,
            mentor_id=mentor2_user.id,
            student_name="Diya Nair",
            mentor_name="Siddharth Mehta",
            topic="PyTorch Model Quantization & TensorRT Inference Optimization",
            description="Guidance on reducing LLM latency from 45ms to <10ms for edge API services.",
            scheduled_at="2026-09-10 16:30",
            duration_minutes=60,
            status="PENDING"
        )
        db.add_all([sess1, sess2])

        # -------------------------------------------------------------
        # 9. NOTIFICATIONS
        # -------------------------------------------------------------
        n1 = models.NotificationItem(
            user_id=student1.id,
            title="GitHub Pull Request Merged 🎉",
            message="Your PR #14 'Concurrent Vector Indexing' was merged into HyperVector main branch (+450 lines).",
            category="GITHUB",
            is_read=False
        )
        n2 = models.NotificationItem(
            user_id=student1.id,
            title="Mentorship Session Confirmed",
            message="Priya Ananth (Principal System Architect @ Google) accepted your session request for Sept 8 at 15:00.",
            category="MENTORSHIP",
            is_read=True
        )
        n3 = models.NotificationItem(
            user_id=student1.id,
            title="IT Company Outreach Received",
            message="Acme Cloud & AI Labs sent you a direct outreach inquiry regarding AI Infrastructure Internship.",
            category="OUTREACH",
            is_read=False
        )
        db.add_all([n1, n2, n3])

        # -------------------------------------------------------------
        # 10. CERTIFICATES, BADGES & EVENTS
        # -------------------------------------------------------------
        cert1 = models.Certificate(
            cert_hash="POOS-CERT-2026-889100",
            recipient_id=student1.id,
            recipient_name="Aarav Sharma",
            issuer_name="PoOS Technical Open-Source Governing Council",
            title="Certified Open-Source Project Lead & Core System Contributor",
            description="Awarded for outstanding technical contribution, merged pull requests, and architecture design in the HyperVector Open Source Engine.",
            issue_date="2026-08-31",
            verification_url="https://poos.platform/verify/POOS-CERT-2026-889100"
        )
        cert2 = models.Certificate(
            cert_hash="POOS-CERT-2026-401299",
            recipient_id=student2.id,
            recipient_name="Diya Nair",
            issuer_name="PoOS AI & Data Science Advisory Board",
            title="Certified AI & Machine Learning Contributor",
            description="Awarded for excellence in developing open-source supply chain predictive ML models.",
            issue_date="2026-08-28",
            verification_url="https://poos.platform/verify/POOS-CERT-2026-401299"
        )
        db.add_all([cert1, cert2])

        badge1 = models.Badge(
            user_id=student1.id,
            badge_key="PROJECT_LEAD",
            title="Top Project Maintainer",
            description="Maintained a high-impact open-source technical repository with >10 merged PRs",
            icon="award"
        )
        badge2 = models.Badge(
            user_id=student1.id,
            badge_key="CODE_REVIEWER",
            title="Master Code Reviewer",
            description="Reviewed over 25 technical pull requests across college and open-source projects",
            icon="check-circle"
        )
        badge3 = models.Badge(
            user_id=student2.id,
            badge_key="AI_SPECIALIST",
            title="AI Model Innovator",
            description="Built verified open-source PyTorch models integrated into production logistics",
            icon="sparkles"
        )
        db.add_all([badge1, badge2, badge3])

        event1 = models.Event(
            title="PoOS National Open-Source Contribution Sprint 2026",
            organizer_name="IIT Madras & Acme AI Labs",
            event_type="HACKATHON",
            description="48-hour collaborative engineering sprint solving real open-source issues and building production features.",
            location="Virtual / IIT Madras Campus",
            event_date="2026-09-20",
            participant_count=320
        )
        event2 = models.Event(
            title="Cloud Native & Vector Search Systems Summit",
            organizer_name="Google Cloud & PoOS Community",
            event_type="WORKSHOP",
            description="Hands-on masterclass on building sub-millisecond similarity search engines using pgvector and FastAPI.",
            location="Bengaluru Tech Park / Hybrid",
            event_date="2026-10-05",
            participant_count=250
        )
        db.add_all([event1, event2])

        db.commit()
        print("Database populated successfully with rich mock test data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    if os.getenv("POOS_ALLOW_SEED") != "1":
        print("Refusing to seed. Set POOS_ALLOW_SEED=1 to explicitly allow loading the demo dataset.")
    else:
        init_db(force_reseed=os.getenv("POOS_FORCE_RESEED") == "1")
