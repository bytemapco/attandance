# CLAUDE.md — SAHAJ

Multi-tenant attendance SaaS for Indian institutions. Backend: FastAPI + Prisma + PostgreSQL/pgvector + Redis. Web: Next.js 16 / React 19. Mobile: Flutter (Riverpod).
**Source of truth for product intent: [docs/PRD.md](docs/PRD.md).** UI and engineering rules: this document. Brand: `docs/sahaj_brand_kit.md`.

---

## 1. Responsive & Adaptive UI (Mandatory)
- **Fluid Layouts**: Never hardcode rigid fixed heights on parent containers without `BoxConstraints` or `Flexible`/`Expanded` wrappers.
- **Screen Size Adaptation**:
  - Compact screens (height < 700dp): Scale headings (24–28dp), tighten spacing (8–16dp), ensure keyboard open views scroll without overflow (`SingleChildScrollView` + `ClampingScrollPhysics`).
  - Standard/Large screens (height >= 700dp): Scale headings (28–34dp), use proportional pacing (24–36dp).
  - Tablet/Foldable/Web (width >= 600dp): Wrap forms in `ConstrainedBox(constraints: BoxConstraints(maxWidth: 480))` centered on screen.
- **Safe Area & System Insets**:
  - Always account for bottom insets (`MediaQuery.of(context).viewInsets.bottom` or `SafeArea(bottom: true)`).
  - Ensure floating buttons and bottom sheets have dynamic clearance above Android 3-button navigation bars and gesture pill bars.
- **Scroll Safety**: All forms and input screens must be wrapped in scroll views so keyboard appearances never trigger `A RenderFlex overflowed by ... pixels`.

## 2. Typography & Design System
- **Font Family**: GoogleFonts.plusJakartaSans across the entire application.
- **Weight Hierarchy**:
  - Headlines: FontWeight.w600 (balanced, clean, modern).
  - Form & Component Labels: FontWeight.w600.
  - Buttons & Interactive Elements: FontWeight.w600 or w700.
  - Body & Subtitles: FontWeight.w400 / w500.
- **Palette**: Dark canvas `#0F172A`, primary warm orange `#F95721`, dark surfaces `#1E293B`, brilliance `#F8FAFC`.

## 3. How to work (read first)

1. **PRD first.** Before any feature, schema, or attendance-logic change, check it against `docs/PRD.md` (data model §5, capture reliability §6, privacy §8, phasing §10). If code and PRD disagree, say so; don't silently pick one.
2. **Ask, don't guess.** If a requirement, edge case, policy rule (e.g. attendance %, condonation, lock windows) or scope boundary is unclear, or the PRD has an open question (§13) that affects the task, **stop and ask the user** with a short question and a recommended default. Never invent business rules.
2a. **Conflict rule.** If the user's request, `docs/PRD.md`, or this file disagree with each other, or the request would break either, stop and ask the user which one wins, with a short question and a recommended default. Wait for the final answer, then do the work to match it. If the answer changes the PRD or this file, update that document in the same change so they stay consistent. Never resolve a conflict silently.
3. **Smallest correct change.** Solve the stated problem with the least code. No new abstractions, config flags, layers, or dependencies unless the task needs them now. Three similar lines beat a premature helper. No speculative refactors, no "while I'm here" cleanups: mention unrelated issues instead.
4. **Fix root causes.** No workarounds, no suppressed type errors or lint rules, no mocks to bypass real behavior.
5. **Read before writing.** Look at neighbouring code and match its style, naming, and patterns. Reuse existing services and helpers.
6. **Verify before claiming done.** Run the relevant checks (§5) and report real results. If something failed or was skipped, say so.
7. **Plan only when it pays.** For multi-file or schema changes, give a 2–4 line plan with a verify step each. For trivial edits, just do it.

## 2. Hard rules

- **No secrets in code.** Keys, DSNs, JWT secrets, AWS creds come from env vars. `credentials.txt` is git-ignored; never read it into output or commit it.
- **Env sync.** Root `.env.prod` is the source of truth. When adding or changing a key, update `backend/.env`, `backend/.env.prod`, `backend/.env.example`, `backend/.env.prod.example`.
- **Prisma.** Never add `output = ...` to the `generator client` block in `backend/prisma/schema.prisma`.
- **Files stay under 200 lines.** Split by responsibility, not arbitrarily.
- **Strict typing.** No `any` in TypeScript. Typed Python (ruff clean). Dart analyzer clean.
- **No debug leftovers.** No `console.log`, `print()`, commented-out code, or TODO litter.
- **Clean your own orphans.** Remove imports, helpers, types, and fixtures that your change made unused. Leave pre-existing dead code alone and mention it.
- **Style of code:** single-purpose functions, early returns, no nested ternaries, no deep nesting.
- **Edit with the file tools** (Edit/Write), not `sed`, `echo >`, heredocs or scripts.

## 3. Domain invariants (from the PRD — do not violate)

- **Tenant isolation:** every tenant-scoped query filters by `tenantId`. New tenant tables get `tenantId` NOT NULL and a test.
- **Single model:** new attendance work targets `CourseSection → TimetableRule → ClassOccurrence → AttendanceRecord` (+ `AttendanceAuditLog`). Do not extend the legacy `AcademicClass → Session → Attendance` flow beyond what migration needs.
- **Never fabricate verification scores.** A disabled or unavailable signal is recorded as not-checked (null), never `1.0` or `0.0`. Fail closed: if AI/Redis is down, fall back to a non-biometric mode and flag.
- **Every attendance mutation is audited** (actor, from→to, reason, time). Edits after lock need a reason.
- **Idempotent marking:** one record per `(occurrenceId, studentId)`; retries with the same key return the original result.
- **Biometrics are opt-in:** consent defaults to `false`, is versioned and revocable, and a non-biometric path must always exist.
- **One percentage function**, unit-tested with hand-computed fixtures; cancelled occurrences are excluded from the denominator (a holiday calendar is not in v1).
- **Thresholds and policy are per tenant**, not global.

## 4. Skills — when to use which

Use a skill only when the task matches. Do not load skills "just in case".

| Task | Skill |
|---|---|
| Library / framework / SDK / CLI docs (Next, Prisma, FastAPI, Flutter packages…) | Context7 MCP (`context7-mcp`) |
| Flutter UI: new screen / redesign | `flutter-design` (routes to the rest) |
| Flutter UI: build approved design | `flutter-implementation` |
| Flutter tokens, theme, dark mode | `flutter-design-system` |
| Flutter animation | `flutter-motion` |
| Flutter a11y, text scaling, RTL | `flutter-accessibility` |
| Review Flutter UI (read-only) | `flutter-audit`, then `flutter-visual-qa` for rendered checks |
| Web UI (Next.js dashboard) design or polish | `impeccable`; `shadcn` for shadcn/ui components |
| HIG / mobile UX critique | `apple-design` |
| New or changed REST endpoints | `api-design-reviewer`; `api-test-suite-builder` for tests |
| Schema, migrations, ERD | `database-schema-designer` (must respect PRD §5) |
| Face / liveness pipeline | `senior-computer-vision` (PRD §6: measure FAR/FRR, no fixed magic thresholds) |
| Auth, threat model, secrets | `senior-security`, `env-secrets-manager` |
| Dependency or CVE audit | `dependency-auditor` |
| Slow endpoint / memory | `performance-profiler` (measure before and after) |
| Logging, metrics, alerts | `observability-designer` |
| Diff review | `code-review`; `simplify` for cleanup; `security-review` before merging auth/PII changes |
| User-facing copy / docs prose | `no-ai-slop` |

Not used in this project unless the user asks: all `clerk*` skills (auth is custom JWT, not Clerk).

## 5. Verify (match CI in `.github/workflows/ci.yml`)

| Area | Commands |
|---|---|
| Backend (`backend/`) | `ruff check .` · `pytest tests -v` |
| Web (`frontend/`) | `npm run lint` · `npm test` · `npm run build` for route/type changes |
| Mobile (`mobile/`) | `flutter analyze --no-fatal-infos` · `flutter test` |

Run the narrowest check that covers the change, then the area suite before finishing. For UI changes, look at the rendered result (Reticle for web, screenshots for Flutter) instead of assuming.
Bug fix → write a failing test first when practical. Attendance logic changes need tests for the edge cases in PRD §6.4.

## 6. Git

- Work on `dev`; stable, verified releases merge into `main`. Don't commit or push unless asked.
- **Dual repository for mobile.** Root repo is `bytemapco/attandance`; `./mobile` is its own repo, `bytemapco/attandance_mobile`. Any change under `./mobile` must be committed and pushed to **both** (run the mobile one from inside `./mobile`). Never leave them out of sync.
- Commit messages: conventional style (`feat(scope):`, `fix(scope):`), one concern per commit.

## 7. Communication

- Be brief and concrete. Lead with the result, then anything the user must decide.
- State assumptions you made. Offer a recommendation, not a menu of options.
- Push back if a request conflicts with the PRD, the invariants above, or looks over-engineered.

## 8. Class Management Feature (Implemented Oct 2026)

Admin page for creating and managing classes across departments and batches. A class is a `StudentGroup` (department + batch) with a plain `semester` number (1–8) that an admin edits. There is no academic year, semester table, class term, or promotion. See [docs/SUMMARY.md](docs/SUMMARY.md) for the feature overview.

### Key Implementation Patterns

**Enrolment sync:** When class roster changes (add/move/remove), CourseEnrollment rows for that class's sections are auto-synced (source=CLASS). Backlog/manual enrollments are never touched. Students added to a class later enroll in all existing sections.

**Batch placement:** a student created, imported or moved to another batch joins the active class of that batch (`services/class_management/batch_placement.py`), leaving the old class. A batch with no class leaves the student in none, and they see no timetable until an admin creates the class. A student has no semester of their own: it is the semester of their class (`class_semester`), so add, edit and import forms take none. `students.semester` is an unused column, kept because `db push` cannot drop a populated column without data-loss approval.

**Teacher propagation:** TimetableRule.teacherId and future (SCHEDULED/unlocked) ClassOccurrence.facultyId are updated when a teacher is changed. Past (CONDUCTED) classes keep the original teacher.

**Atomicity in create:** If class creation fails (e.g., student already in another class), the StudentGroup is rolled back so no orphan exists. Validated in tests.

**Semester:** a number on the class, changed with `PATCH /admin/class-management/classes/{id}`. Students move to a new semester by editing the class, not by promotion. Timetable rules start the day they are created and run until removed (`effectiveUntil` is null).

**Attendance protection:** Subject removal is blocked once AttendanceRecord exists for that section. History is preserved.

### Prisma Quirks Encountered

- **Nested include ordering:** use `order_by` inside includes, not top-level `order`. Example: `include={"courseSections": {"order_by": {"createdAt": "desc"}}}`.
- **Composite unique constraint names:** generated as `<field1>_<field2>` by Prisma. Used in migrations and when referencing the index.
- **Venv generation issue:** if running `prisma generate` outside venv, it writes to system Python site-packages. Always use: `env -i HOME=$HOME PATH=$PWD/.venv/bin:/usr/bin:/bin VIRTUAL_ENV=$PWD/.venv .venv/bin/prisma generate`.

### Tenant Isolation Checklist

✅ StudentGroup and ClassMember tables have `tenantId NOT NULL`  
✅ All service methods take `tenant_id` as first arg  
✅ All queries filter `tenantId` (use `get_tenant_context` for HTTP endpoints)  
✅ Foreign keys (department, student, teacher, subject) verified in tenant before operations  
✅ Partial unique index on ClassMember enforces one ACTIVE per student per class  

### Testing Approach

- **Backend:** `tests/class_management/` with a mocked Prisma client; tests cover tenant isolation, duplicates, semester edits, enrolment sync, schedule conflicts, attendance protection.
- **Frontend:** vitest for validation schemas; manual browser testing for UI flows (Reticle).
- **Live:** 45-check Python script against running server + DB; covers all API flows including auth, edge cases, cleanup.

### Files to Know

- `backend/prisma/schema.prisma` — StudentGroup (with `semester`), ClassMember, CourseSection.groupId, CourseEnrollment.source/endedAt
- `backend/app/services/class_management/` — 6 modules (common, class, class_member, class_section, class_schedule, enrollment_sync)
- `backend/app/api/admin/class_management.py` — class, member, subject, and schedule endpoints
- `frontend/src/app/(dashboard)/admin/class-management/` — routes & components

### Known Limitations

1. **No teacher removal:** only reassign. (Timetable needs a teacher.)
2. **Backlog enrollments:** backend supports them; no UI yet.
3. **Move student:** no button in Students tab; POST endpoint works.
4. **Semester range:** classes accept 1–8. The semester master (`AcademicLevel`) is not enforced when a class is created.
5. **Dev DB schema:** modified manually via psql; migration SQL in `prisma/migrations/` for reference only (venv-scoped generation).

### What Was Removed

**Oct 31 Round 1 (Lab batches):**
- ❌ LabBatch and LabBatchMember tables (replaced by subject-level enrollment)
- ❌ Lab batches UI tab, API endpoints, services
- ❌ `course_sections.lab_batch_id` column
- ✅ Subjects & Teachers tab now handles all enrollment

**Oct 31 Round 2 (Promotion):**
- ❌ Promote button and dialog from class detail page
- ❌ PromoteDialog.tsx component removed from UI
- Class detail page now has 2 tabs instead of 3: Students, Subjects & teachers

**Nov 1 (Academic year and term system):**
- ❌ `AcademicYear`, `Semester`, `ClassTerm` tables and the `AcademicPeriodStatus` enum
- ❌ Promotion service and endpoint, and the `PROMOTED`, `DETAINED`, `GRADUATED` statuses
- ❌ Year activation, semesters per year, and the academic years admin pages
- ✅ Attendance rules (minimum %, window, Saturday) live on `SystemConfiguration`, per institution
- ✅ Migration: `prisma/migrations/20261101290000_remove_academic_year_and_terms/`

**Nov 1 (Time slots and holidays):**
- ❌ `TimeSlot` and `AcademicCalendarEvent` tables, the `CalendarEventType` enum, the Academic Calendar admin page, and the setup "class periods" check
- ✅ `TimetableRule` and `ClassOccurrence` store their own `startTime` and `endTime` ("HH:MM"); rules conflict when their times overlap on the same day
- ✅ A teacher can start a class that is not scheduled: it is recorded as a one-hour class starting now
- ✅ A day off is a cancelled occurrence. Holiday calendar and a shared time slot list are post-v1 (PRD section 10)
- ✅ Migration: `prisma/migrations/20261101300000_remove_time_slots_and_holidays/`

**Nov 2 (v1 hardening):**
- ❌ Legacy `AcademicClass`, `Enrollment`, `Session`, `Geofence`, `Attendance`, `StudentBiometric` tables, the `/admin/classes` API and web pages, and the old async-mark pipeline. Everything runs on `CourseSection → ClassOccurrence → AttendanceRecord`.
- ✅ `enrollmentNumber` and `employeeId` are unique **per tenant**. Login by such an ID can match several institutions: `services/login_identity.py` picks the account whose password matches, else answers 409 asking for `tenant_slug` (mobile shows an "Institution code" field).
- ✅ `tenant_id` is NOT NULL on tenant tables (only a `SUPER_ADMIN` user has none, enforced by a CHECK). A DB trigger (`enforce_same_tenant`) refuses rows that link records of two tenants. These triggers and CHECKs live in SQL only, not in `schema.prisma`; `prisma migrate dev` would drop them.
- ✅ Attendance history cannot be deleted by deleting a student, lesson or institution (`NO ACTION` foreign keys). Deactivate users instead; deleting an institution with attendance is refused (409).
- ✅ Biometric consent is the `biometric_consents` table (one active grant per student, revoking deletes the face template). It was only in Redis before.
- ✅ A closed register can be corrected **with a reason** (audited). Closing (by teacher or by the scheduler when the window ends) records absent/excused for everyone without a mark and refreshes streaks. Streaks and stats count only closed classes (`services/student_class_ledger.py`).
- Migrations: `20261102000000_schema_hardening/`, `20261102010000_retire_legacy_attendance/`. Both are applied by hand to the dev DB, like the earlier ones.
- Database reset: `backend/scripts/reset_database.py --force-destructive-wipe --confirm-target-db=<db>` wipes the local DB and initializes a clean schema with a default superadmin account.
- Not built (needs a policy decision, PRD §13): per-programme thresholds, condonation workflow, guardians.

---
