# 🔧 Backend API — FastAPI + Prisma

**Service:** SAHAJ Backend  
**Technology:** Python 3.11 · FastAPI 0.115.6 · Prisma ORM · PostgreSQL 15+  
**Entry Point:** `main.py`  
**API Docs:** http://localhost:8000/docs (Swagger UI)

---

## 📂 Directory Structure

```
backend/
├── main.py                  # FastAPI application entrypoint
├── app/
│   ├── __init__.py
│   ├── api/                 # ✅ API Routers (by role)
│   │   ├── auth.py          → Login, signup, JWT refresh
│   │   ├── admin.py         → Tenant admin endpoints
│   │   ├── teacher.py       → Teacher attendance & class routes
│   │   ├── student.py       → Student marking & profile routes
│   │   └── common.py        → Public routes (health, features)
│   │
│   ├── services/            # ✅ Business Logic (testable layer)
│   │   ├── auth/
│   │   │   ├── jwt_manager.py   → Token generation/validation
│   │   │   └── password.py      → Hashing & verification
│   │   ├── biometric/
│   │   │   ├── face_recognition.py → FaceNet embeddings
│   │   │   ├── liveness_detection.py → Anti-spoofing
│   │   │   └── background_validator.py → Room context
│   │   ├── attendance/
│   │   │   ├── marking.py        → Core attendance logic
│   │   │   ├── verification.py   → Multi-layer checks
│   │   │   └── audit.py          → Mutation logging
│   │   ├── class_management/     → Class/batch/enrollment management
│   │   │   ├── class_term.py
│   │   │   ├── class_member.py
│   │   │   ├── class_section.py
│   │   │   ├── enrollment_sync.py
│   │   │   ├── promotion.py
│   │   │   └── common.py
│   │   ├── admin.py         → Tenant management
│   │   ├── teacher.py       → Teacher-scoped operations
│   │   ├── student.py       → Student profile & history
│   │   └── outlier_scanner.py → Anomaly detection
│   │
│   ├── core/                # ✅ Infrastructure & Security
│   │   ├── config.py        → Environment config
│   │   ├── security.py      → JWT, encryption utilities
│   │   ├── constants.py     → Magic numbers, enums
│   │   └── exceptions.py    → Custom exception classes
│   │
│   ├── middleware/          # ✅ HTTP Middleware
│   │   ├── rbac.py          → Role-based access control
│   │   └── error.py         → Error envelope formatting
│   │
│   ├── db/                  # ✅ Database Layer
│   │   ├── client.py        → Prisma ORM client instance
│   │   ├── session.py       → Async session management
│   │   └── context.py       → Tenant context helper
│   │
│   └── __init__.py
│
├── prisma/                  # ✅ Database Schema & Migrations
│   ├── schema.prisma        → Data model (SOURCE OF TRUTH)
│   ├── migrations/          → Versioned SQL migrations
│   ├── seed.py              → Fixture data (dev/test)
│   └── .env                 → Database connection
│
├── tests/                   # ✅ Pytest Test Suite (73 tests)
│   ├── conftest.py          → Fixtures & mocks
│   ├── test_auth.py         → JWT & password tests
│   ├── test_biometric.py    → Face recognition & liveness
│   ├── test_attendance.py   → Marking & verification logic
│   ├── test_admin.py        → Tenant & user management
│   ├── test_teacher.py      → Teacher operations
│   ├── test_student.py      → Student endpoints
│   ├── test_rbac.py         → Access control
│   ├── class_management/    → Class mgmt tests
│   └── fixtures/            → Mock data & test utilities
│
├── models/                  # ✅ ML Models & Artifacts
│   ├── face_embedding/      → FaceNet weights
│   ├── liveness_detector/   → MobileNetV2 model
│   └── background_validator/ → MobileNetV1 weights
│
├── scripts/                 # ✅ Utilities & Data Tools
│   ├── check_db.py          → Verify connection
│   ├── seed_dev.py          → Load dev fixtures
│   └── migrate_legacy.py    → One-off data migrations
│
├── .env                     # Environment vars (local)
├── .env.prod                # Environment vars (production)
├── .env.example             → Template for contributors
├── requirements.txt         → Python dependencies
└── .venv/                   → Virtual environment (local)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with `pgvector` extension
- Redis 7+
- Virtual environment

### Setup (First Time)

```bash
cd backend

# 1. Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # or: .venv\Scripts\activate (Windows)

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup database
prisma generate
prisma migrate deploy
python scripts/seed_dev.py

# 4. Start development server
python main.py
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Development Server

```bash
python main.py
# or with auto-reload:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🏛️ Architecture Layers

### 1️⃣ API Router Layer (`app/api/`)
**Responsibility:** HTTP request handling, input validation, response formatting

**Pattern:**
```python
# Example: backend/app/api/student.py
@router.post("/attendance/mark")
async def mark_attendance(
    student_id: str,
    body: MarkAttendanceRequest,
    tenant_id: str = Depends(get_tenant_context)
) -> MarkAttendanceResponse:
    # 1. Validate input (Pydantic)
    # 2. Delegate to service layer
    result = await attendance_service.mark(
        tenant_id=tenant_id,
        student_id=student_id,
        ...
    )
    # 3. Format & return
    return MarkAttendanceResponse(**result)
```

**Rules:**
- ✅ Validate inputs with Pydantic models
- ✅ Inject `tenant_id` via `get_tenant_context()` dependency
- ✅ Delegate business logic to services
- ✅ Return typed responses (Pydantic models)
- ❌ No raw SQL or direct Prisma queries
- ❌ No business logic in routers

---

### 2️⃣ Service Layer (`app/services/`)
**Responsibility:** Pure business logic, tenant isolation, testability

**Pattern:**
```python
# Example: backend/app/services/attendance/marking.py
async def mark_attendance(
    tenant_id: str,
    student_id: str,
    occurrence_id: str,
    verification_data: dict
) -> dict:
    # 1. Verify tenant context (all queries filter by tenant_id)
    student = await prisma.student.find_unique(
        where={"id": student_id, "tenantId": tenant_id}
    )
    if not student:
        raise ValueError(f"Student not found in tenant {tenant_id}")
    
    # 2. Execute business logic
    occurrence = await prisma.class_occurrence.find_unique(...)
    scores = await verify_biometrics(verification_data)
    
    # 3. Create audit record
    await audit_log.create(
        tenant_id=tenant_id,
        actor=student_id,
        change={"from": None, "to": "PRESENT"},
        reason="student_selfie"
    )
    
    # 4. Return result (dict or model)
    return {"status": "present", "scores": scores}
```

**Rules:**
- ✅ Take `tenant_id` as first parameter
- ✅ Filter all queries by `tenantId`
- ✅ Return typed dicts or models
- ✅ Raise `ValueError` / `HTTPException` for errors
- ❌ No HTTP dependencies (no FastAPI, no request/response)
- ❌ No raw database queries (use Prisma only)

---

### 3️⃣ Database Layer (`app/db/`, `prisma/`)
**Responsibility:** Data persistence, schema, migrations

**Schema Rules:**
- ✅ Tenant-scoped tables have `tenantId String @db.Uuid` NOT NULL
- ✅ All fields have appropriate types & constraints
- ✅ Composite unique indexes where needed
- ✅ Relationships with proper `@relation` directives
- ❌ No `output` in `generator client` block

**Migrations:**
```bash
# Create migration
prisma migrate dev --name <description>

# Apply to production
prisma migrate deploy

# Rollback (dev only)
prisma migrate resolve --rolled-back <migration_name>
```

---

### 4️⃣ Security Layer (`app/core/`)
**Responsibility:** JWT, encryption, configuration

**Core Components:**
- `config.py` → Reads `.env` vars (DATABASE_URL, JWT_SECRET, etc.)
- `security.py` → JWT encoding/decoding, password hashing
- `constants.py` → Magic numbers, enums (roles, verification thresholds)
- `exceptions.py` → Custom exceptions (TenantNotFound, etc.)

---

### 5️⃣ Middleware Layer (`app/middleware/`)
**Responsibility:** Cross-cutting concerns

**Key Middleware:**
- `rbac.py` → Role-based access control (verify user role)
- `error.py` → Unified error response envelope
- `auth.py` → JWT extraction & validation (dependency)

---

## 🧪 Testing

### Running Tests

```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_attendance.py -v

# Specific test function
pytest tests/test_attendance.py::test_mark_present -v

# With coverage
pytest --cov=app tests/

# Watch mode (requires pytest-watch)
ptw tests/
```

### Test Structure

```python
# tests/test_attendance.py
import pytest
from app.services.attendance import marking
from tests.fixtures import student_factory, occurrence_factory

@pytest.mark.asyncio
async def test_mark_attendance_present(
    db_mock,  # Mocked Prisma client
    student_factory,
    occurrence_factory
):
    # Arrange
    student = student_factory(tenant_id="t1")
    occurrence = occurrence_factory(tenant_id="t1")
    
    # Act
    result = await marking.mark_attendance(
        tenant_id="t1",
        student_id=student.id,
        occurrence_id=occurrence.id,
        verification_data={"face_score": 0.92}
    )
    
    # Assert
    assert result["status"] == "PRESENT"
    assert result["scores"]["face"] == 0.92
```

### Mocking Pattern

```python
# conftest.py — Pytest fixtures
@pytest.fixture
def db_mock(mocker):
    """Mock Prisma client for all tests"""
    client = AsyncMock()
    mocker.patch("app.db.client.prisma", client)
    return client

@pytest.fixture
def student_factory(db_mock):
    """Factory to create test student fixtures"""
    def create(tenant_id="t1", **kwargs):
        return StudentModel(
            id="s1",
            tenantId=tenant_id,
            email="test@yopmail.com",
            **kwargs
        )
    return create
```

---

## 🔄 Key Service Modules

### Authentication (`services/auth/`)
- **jwt_manager.py** → Generate/validate JWTs
  - `generate_token(user_id, role, tenant_id)` → Returns access + refresh tokens
  - `validate_token(token)` → Extracts payload, raises on invalid
- **password.py** → Secure password handling
  - `hash_password(plain)` → Argon2 hashing
  - `verify_password(plain, hashed)` → Constant-time comparison

### Biometric Verification (`services/biometric/`)
- **face_recognition.py** → FaceNet embeddings
  - `generate_embedding(image)` → 128-D vector
  - `compute_similarity(embedding1, embedding2)` → Cosine distance
- **liveness_detection.py** → Anti-spoofing
  - `check_liveness(video_frames)` → MobileNetV2 classification
- **background_validator.py** → Room context
  - `validate_background(image)` → MobileNetV1 classification

### Attendance Marking (`services/attendance/`)
- **marking.py** → Core attendance logic
  - `mark_attendance(tenant_id, student_id, occurrence_id, data)` → Main entry
  - Handles idempotency (one record per student+occurrence)
  - Creates audit trail
- **verification.py** → Multi-layer checks
  - Face match, liveness, background, geofence, device binding
  - Returns scores + final decision (PRESENT/ABSENT/UNVERIFIED)
- **audit.py** → Mutation logging
  - `log_change(tenant_id, actor, from_value, to_value, reason)`

### Class Management (`services/class_management/`)
- **class_term.py** → Semester management
- **class_member.py** → Student enrollment in classes
- **class_section.py** → Subject + section creation
- **enrollment_sync.py** → Auto-sync when roster changes
- **promotion.py** → Promote students to next semester
- **common.py** → Shared helpers

---

## 🔐 Tenant Isolation Checklist

- ✅ All tenant-scoped tables have `tenantId NOT NULL`
- ✅ Every service method takes `tenant_id` as first arg
- ✅ All queries filter by `tenantId`
- ✅ Foreign keys verified in tenant before operations
- ✅ Tests verify isolation (mock data per tenant)
- ✅ No leakage between tenants in any operation

---

## 📋 Environment Variables

Create `.env` in `backend/`:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sahaj"

# JWT
JWT_SECRET="your-secret-key-change-in-prod"
JWT_ALGORITHM="HS256"

# Redis
REDIS_URL="redis://localhost:6379"

# AWS S3 (for biometric artifacts)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="sahaj-prod"
AWS_REGION="us-east-1"

# Sentry (error tracking)
SENTRY_DSN="https://..."

# Feature flags
ENABLE_BIOMETRIC=true
ENABLE_GEOFENCE=true
ENABLE_DEVICE_BINDING=true
```

**Never commit secrets!** Use `.env.example` for template.

---

## 🛠️ Common Commands

```bash
# Development
python main.py                         # Start dev server
prisma studio                          # GUI database explorer
python scripts/check_db.py             # Test DB connection

# Database
prisma migrate dev --name <desc>       # Create & apply migration
prisma migrate deploy                  # Apply pending migrations
python scripts/seed_dev.py             # Load dev fixtures
prisma db seed                         # Run seed.py

# Testing
pytest tests/ -v                       # Run all tests
pytest tests/test_attendance.py -v     # Specific module
pytest --cov=app tests/                # With coverage

# Code Quality
ruff check .                            # Lint (fast)
python -m mypy app                    # Type check (optional)
```

---

## 🎯 Design Patterns Used

### 1. Service Layer Pattern
Business logic decoupled from HTTP layer → easy testing.

### 2. Tenant Isolation Pattern
Every query scoped by `tenantId` → no data leakage.

### 3. Audit Log Pattern
Every mutation creates audit record → compliance & debugging.

### 4. Idempotent Operations
Retries return original result → resilience.

### 5. Dependency Injection
Mocked Prisma client in tests → isolation.

---

## 📞 Support

- **PRD Questions** → `/docs/PRD.md`
- **Architecture** → `/graphify-out/GRAPH_REPORT.md` or `graphify query "..."`
- **Code Patterns** → Look at existing code in neighboring modules
- **Development Rules** → `/CLAUDE.md` (§1-§5)

---

**Happy coding! 🚀**
