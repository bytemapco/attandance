# 🏗️ SAHAJ System Architecture

**Status:** Production Multi-Tenant SaaS  
**Last Updated:** 2026-10-31

---

## 📊 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      SAHAJ Ecosystem                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 📱 Flutter   │  │ 🎨 Next.js   │  │ 🔧 FastAPI  │         │
│  │  Mobile App  │  │  Web Portal  │  │  Backend    │         │
│  │  (Student)   │  │ (Admin/Prof) │  │  (Core)     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                 │
│         └─────────────────┼──────────────────┘                 │
│                           │ HTTPS/REST                         │
│                    ┌──────▼───────┐                            │
│                    │  Auth Layer  │                            │
│                    │  (JWT/RBAC)  │                            │
│                    └──────┬───────┘                            │
│                           │                                    │
│        ┌──────────────────┼──────────────────┐                │
│        │                  │                  │                │
│  ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐           │
│  │ Attendance│    │    Class    │    │   Admin   │           │
│  │  Service  │    │  Management │    │  Service  │           │
│  │ (Marking) │    │  (Rosters)  │    │(Settings) │           │
│  └─────┬─────┘    └──────┬──────┘    └─────┬─────┘           │
│        │                 │                  │                 │
│        └─────────────────┼──────────────────┘                 │
│                          │                                    │
│        ┌─────────────────▼───────────────┐                   │
│        │   AI & Verification Pipeline    │                   │
│        │ (Face, Liveness, Background)    │                   │
│        └─────────────────┬───────────────┘                   │
│                          │                                    │
│        ┌─────────────────▼───────────────┐                   │
│        │    PostgreSQL + pgvector        │                   │
│        │  (Schema, Face Embeddings)      │                   │
│        └──────────────────────────────────┘                   │
│                                                                 │
│        ┌──────────────────────────────────┐                   │
│        │  Redis + Valkey                  │                   │
│        │ (Cache, Tokens, Notifications)   │                   │
│        └──────────────────────────────────┘                   │
│                                                                 │
│        ┌──────────────────────────────────┐                   │
│        │     AWS S3 / MinIO               │                   │
│        │  (Biometric Artifacts, Docs)     │                   │
│        └──────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Core Data Flow: Attendance Marking

The most critical flow — how a student marks attendance:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. STUDENT SUBMITS SELFIE (Mobile App)                          │
├─────────────────────────────────────────────────────────────────┤
│ • Student sees "Mark Attendance" screen                         │
│ • Opens camera, captures face + environment                     │
│ • Device generates unique hardware UUID (device binding)        │
│ • Captures GPS coordinates (geofence check)                     │
│ • Submits to backend with encrypted payload                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND RECEIVES & VALIDATES (FastAPI)                       │
├─────────────────────────────────────────────────────────────────┤
│ • Check JWT token (student authenticated?)                      │
│ • Verify tenant isolation (student belongs to this tenant?)      │
│ • Check device binding (is this their enrolled device?)         │
│ • Validate geofence (are they physically present?)              │
│ • Verify class is active (not locked/ended)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. MULTI-LAYER BIOMETRIC VERIFICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Layer 1: Anti-Spoofing (Liveness Detection)            │   │
│ │ • MobileNetV2 classifier on video frames                │   │
│ │ • Detects replay attacks (photos, screens, masks)       │   │
│ │ • Returns: liveness_score (0.0 - 1.0)                  │   │
│ │ • Threshold: >= 0.80 (configurable per tenant)          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Layer 2: Face Recognition (FaceNet Embeddings)          │   │
│ │ • Extract 128-D face embedding from submitted image      │   │
│ │ • Compare against pgvector stored embeddings             │   │
│ │ • Calculate cosine similarity (0.0 - 1.0)               │   │
│ │ • Threshold: >= 0.85 (PRD §6.4)                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Layer 3: Background Validation (Room Context)           │   │
│ │ • MobileNetV1 classifier on environment                  │   │
│ │ • Verifies classroom context (not student room/cafe)     │   │
│ │ • Returns: room_confidence_score                         │   │
│ │ • Threshold: >= 0.75                                    │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Result Decision Matrix:                                         │
│ • All 3 layers PASS → PRESENT                                  │
│ • Any layer FAIL → UNVERIFIED (can retry or appeal)            │
│ • Network error → Fall back to Smart Pass (offline mode)       │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CREATE ATTENDANCE RECORD & AUDIT LOG                         │
├─────────────────────────────────────────────────────────────────┤
│ • Insert into AttendanceRecord (one per student+occurrence)     │
│ • Ensure idempotency (retry-safe)                               │
│ • Create AttendanceAuditLog (who marked, when, scores)         │
│ • Update student's streak & gamification points                │
│ • Trigger notification (Firebase Cloud Messaging)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RETURN RESULT TO STUDENT (Mobile App)                        │
├─────────────────────────────────────────────────────────────────┤
│ • Show success/failure screen                                   │
│ • Display verification scores (for debugging)                   │
│ • Update local cache (Hive DB)                                  │
│ • Show streak update & points earned                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Key Service Modules

### 1. Authentication Service (`app/services/auth/`)

**Responsibility:** JWT token generation, password security

**Flow:**
```
Login Request
  ↓
Verify credentials (password hash match)
  ↓
Load user + roles + tenant
  ↓
Generate JWT with claims: {user_id, tenant_id, role}
  ↓
Return access_token (short-lived: 15 min)
       + refresh_token (long-lived: 30 days)
  ↓
Client stores tokens (localStorage + secure storage)
```

**JWT Structure:**
```json
{
  "user_id": "u123",
  "tenant_id": "t456",
  "role": "TEACHER",
  "email": "prof@institution.edu",
  "exp": 1704067200,
  "iat": 1704066000
}
```

---

### 2. Biometric Verification Service (`app/services/biometric/`)

**Modules:**
- `face_recognition.py` → FaceNet 128-D embeddings
- `liveness_detection.py` → Anti-spoofing (MobileNetV2)
- `background_validator.py` → Room context (MobileNetV1)

**Verification Sequence:**
```
Input: {image, video_frames, encrypted_payload}
  ↓
1. Liveness Check
   - Extract frames from video
   - Run MobileNetV2 classifier
   - Get liveness_score (0.0-1.0)
   - FAIL if < 0.80
  ↓
2. Face Recognition
   - Extract face region from image
   - Generate FaceNet embedding (128-D vector)
   - Query pgvector for closest match
   - Calculate cosine similarity
   - FAIL if < 0.85
  ↓
3. Background Validation
   - Run MobileNetV1 on environment
   - Get room_confidence
   - FAIL if < 0.75
  ↓
Output: {status: PRESENT|UNVERIFIED, scores: {...}}
```

---

### 3. Class Management Service (`app/services/class_management/`)

**Core Concepts:**
- **StudentGroup** → A class: a cohort of students (e.g., CSE-A-1) with a plain semester number
- **ClassMember** → Student enrolled in class
- **CourseSection** → Subject + section
- **TimetableRule** → Recurring schedule (Mon/Wed/Fri 9am)
- **ClassOccurrence** → Single scheduled class instance
- **AttendanceRecord** → Student's attendance for occurrence

**Modules:**
- `class_service.py` → Create/manage classes, change a class's semester number
- `class_member_service.py` → Add/remove students
- `class_section_service.py` → Create subjects & sections
- `class_schedule_service.py` → Weekly schedule slots
- `enrollment_sync.py` → Auto-sync CourseEnrollment

**Example Workflow (Creating a Class):**
```
1. Admin creates the "CSE-A-1" class and gives it semester 3
   → Inserts StudentGroup (CSE-A-1, semester 3)
   
2. Admin enrolls students (50 students)
   → Creates ClassMember rows (ACTIVE status)
   → Trigger enrollment_sync
     - Creates CourseEnrollment for each section
     - source="CLASS" (auto-synced, not manual)
   
3. Admin adds subjects (Algorithms, Databases, etc.)
   → Creates CourseSection rows
   → Trigger enrollment_sync again
     - Enrolls all active students in new subjects
   
4. Admin assigns teachers
   → Updates CourseSection.teacherId
   → Updates TimetableRule.teacherId
   → Updates future ClassOccurrence.facultyId
   
5. Scheduler creates ClassOccurrence instances
   → One per TimetableRule per day
   → Attendance records created as empty (ABSENT)
```

---

### 4. Attendance Service (`app/services/attendance/`)

**Modules:**
- `marking.py` → Main marking logic
- `verification.py` → Biometric checks + decision
- `audit.py` → Audit trail creation

**Marking Logic:**
```python
async def mark_attendance(tenant_id, student_id, occurrence_id, data):
    # 1. Idempotency check
    existing = await find_existing_record(
        tenant_id, occurrence_id, student_id
    )
    if existing:
        return existing  # Retry-safe
    
    # 2. Verify prerequisites
    - Student exists in tenant
    - ClassOccurrence exists & active (not locked)
    - Lock window not closed
    - Not outside grace period
    
    # 3. Multi-layer verification
    scores = await verify_biometrics(
        image=data.image,
        video_frames=data.frames,
        gps=data.location,
        device_uuid=data.device_uuid
    )
    
    # 4. Apply rules (per tenant config)
    if scores.face >= threshold and scores.liveness >= threshold:
        status = "PRESENT"
    else:
        status = "UNVERIFIED"
    
    # 5. Create record + audit log
    record = await db.attendance_record.create({
        tenantId: tenant_id,
        occurrenceId: occurrence_id,
        studentId: student_id,
        status: status,
        scores: scores,
        markedAt: now()
    })
    
    await audit_log.create({
        tenantId: tenant_id,
        actor: student_id,
        change: {from: None, to: status},
        reason: "student_selfie",
        scores: scores
    })
    
    return record
```

---

## 📊 Data Model (Simplified)

```sql
-- Multi-Tenancy
Tenant
  ├── id (UUID)
  ├── name (String)
  ├── email_domain (String)
  └── settings (JSON) → attendance_threshold, geofence_radius, etc.

-- Users
User
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── email (String, unique per tenant)
  ├── role (ADMIN | TEACHER | STUDENT)
  ├── password_hash (Bcrypt/Argon2)
  └── device_uuid (String, for device binding)

-- Academic Structure
StudentGroup (a class)
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── departmentId (FK)
  ├── batch (String) → "CSE-A-1"
  ├── semester (Int, 1–8, edited by an admin)
  └── status (ACTIVE | ARCHIVED)

ClassMember
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── groupId (FK StudentGroup)
  ├── studentId (FK)
  └── status (ACTIVE | TRANSFERRED)

CourseSection
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── groupId (FK StudentGroup, nullable)
  ├── subjectId (FK)
  ├── teacherId (FK User)
  └── section (String) → "A", "B"

CourseEnrollment
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── studentId (FK)
  ├── courseSectionId (FK)
  ├── source (CLASS | BACKLOG | MANUAL)
  ├── startedAt (DateTime)
  └── endedAt (DateTime, nullable)

TimetableRule
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── courseSectionId (FK)
  ├── day_of_week (0-6)
  ├── start_time (Time)
  ├── duration_minutes (Int)
  └── teacherId (FK)

ClassOccurrence
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── timetableRuleId (FK)
  ├── scheduled_date (Date)
  ├── status (SCHEDULED | CONDUCTED | CANCELLED)
  ├── geofence_lat (Decimal)
  ├── geofence_lon (Decimal)
  ├── geofence_radius_meters (Int)
  └── facultyId (FK User, nullable)

-- Core Attendance
AttendanceRecord
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── occurrenceId (FK)
  ├── studentId (FK)
  ├── status (PRESENT | ABSENT | UNVERIFIED)
  ├── face_score (Decimal 0.0-1.0)
  ├── liveness_score (Decimal 0.0-1.0)
  ├── background_score (Decimal 0.0-1.0)
  ├── distance_meters (Decimal, nullable)
  ├── markedAt (DateTime)
  └── unique(tenantId, occurrenceId, studentId)

AttendanceAuditLog
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── actorId (FK)
  ├── occurrenceId (FK)
  ├── studentId (FK)
  ├── from_status (String)
  ├── to_status (String)
  ├── reason (String)
  ├── scores (JSON)
  └── timestamp (DateTime)

-- Biometrics
FaceEmbedding
  ├── id (UUID)
  ├── tenantId (UUID)
  ├── studentId (FK)
  ├── embedding (pgvector, 128-D)
  ├── image_url (String, S3)
  ├── created_at (DateTime)
  └── is_primary (Boolean)
```

---

## 🔐 Tenant Isolation Pattern

Every operation is scoped by tenant:

```
REQUEST FLOW:
  ↓
Extract JWT token
  ↓
Validate signature & extract claims
  ↓
Inject tenant_id from token
  ↓
Dependency: tenant_id = get_tenant_context(request)
  ↓
Pass tenant_id to service layer
  ↓
Service filters ALL queries by tenantId
  ↓
Example:
  db.student.find_unique({
    where: {
      id: student_id,
      tenantId: tenant_id  ← MANDATORY FILTER
    }
  })
  ↓
Response (tenant A sees only tenant A data)
```

**Enforcement:**
- ✅ Tables with `tenantId NOT NULL`
- ✅ All queries filter by `tenantId`
- ✅ Foreign keys verified in tenant
- ✅ Tests verify isolation per tenant

---

## 🔄 API Layer Pattern

```
CLIENT REQUEST (Axios/HTTP)
  ↓
Router validates request (Pydantic model)
  ↓
Inject tenant_id via dependency
  ↓
Delegate to Service layer
  ↓
Service executes business logic
  ↓
Create audit log
  ↓
Return result (dict or model)
  ↓
Router formats response (Pydantic output model)
  ↓
Return HTTP 200 with JSON
```

**Example:**
```python
# backend/app/api/student.py
@router.post("/attendance/mark")
async def mark_attendance(
    req: MarkAttendanceRequest,
    tenant_id: str = Depends(get_tenant_context)
) -> MarkAttendanceResponse:
    # 1. Router validates input
    # 2. Inject tenant_id
    result = await marking_service.mark_attendance(
        tenant_id=tenant_id,
        student_id=req.student_id,
        occurrence_id=req.occurrence_id,
        verification_data=req.verification_data
    )
    # 3. Format response
    return MarkAttendanceResponse(**result)
```

---

## 🧪 Testing Strategy

### Unit Tests (Isolated, Mocked)

**Backend:** `backend/tests/`
- Mock Prisma client
- Test services independently
- Verify tenant isolation
- 73 tests, 100% coverage of core logic

```python
# Example test
@pytest.mark.asyncio
async def test_mark_attendance_tenant_isolation(db_mock):
    # Tenant 1: mark attendance
    result1 = await marking.mark_attendance(
        tenant_id="t1",
        student_id="s1",
        ...
    )
    
    # Tenant 2: can't see tenant 1's data
    with pytest.raises(ValueError):
        await marking.mark_attendance(
            tenant_id="t2",
            student_id="s1",  # Doesn't exist in t2
            ...
        )
```

**Frontend:** `frontend/src/tests/`
- Test hooks in isolation
- Test components with mocked API
- 31 tests

**Mobile:** `mobile/test/`
- Test providers with mock API
- Test UI widgets

### Integration Tests

- Run against real database (PostgreSQL)
- Verify full flow: login → mark → audit log
- Test error scenarios
- Verify performance

---

## 🚀 Deployment Architecture

```
GitHub (Repo)
  ↓
GitHub Actions CI/CD (.github/workflows/ci.yml)
  ├─ Lint & type-check
  ├─ Run tests
  ├─ Build containers
  └─ Push to registry
  ↓
Production Environment
  ├─ Kubernetes cluster
  │  ├─ FastAPI backend (replicas)
  │  ├─ Next.js frontend (static + edge)
  │  ├─ PostgreSQL (managed)
  │  ├─ Redis (managed)
  │  └─ S3 (storage)
  └─ CDN (CloudFront / Cloudflare)
```

See `docs/deployment-guide.md` for details.

---

## 📈 Performance Characteristics

| Operation | Target | Implementation |
|-----------|--------|-----------------|
| **Login** | < 500ms | JWT + Redis cache |
| **Mark Attendance** | < 2s | Parallel face + liveness checks |
| **List Classes** | < 1s | Paginated query, indexed by tenantId |
| **Face Similarity** | < 500ms | pgvector cosine similarity |
| **Geofence Check** | < 100ms | Haversine formula |

---

## 🛡️ Security Layers

1. **Transport:** HTTPS only
2. **Authentication:** JWT with claims (tenant, role)
3. **Authorization:** RBAC middleware (verify role per endpoint)
4. **Data:** Tenant isolation at query level
5. **Secrets:** Environment variables (no hardcoded keys)
6. **Logging:** Audit trail for all mutations
7. **Rate Limiting:** Per-user rate limits on auth endpoints
8. **Encryption:** Sensitive payloads encrypted (e.g., device UUIDs)

---

## 📞 Understanding the System

### For a Quick Overview
1. Read this file (ARCHITECTURE.md)
2. Read `WORKSPACE_GUIDE.md` (navigation)
3. Check `docs/PRD.md` (business logic)

### For Implementation Details
1. Read service module docs in backend/README.md
2. Check the code in `backend/app/services/`
3. Look at tests in `backend/tests/`
4. Use `graphify query "<topic>"` for code search

### For Questions
- **Data model:** `backend/prisma/schema.prisma`
- **API endpoints:** `backend/app/api/`
- **Frontend:** `frontend/src/app/` (routes) & `frontend/src/components/`
- **Mobile:** `mobile/lib/` (screens, providers)

---

**Happy building! 🚀**
