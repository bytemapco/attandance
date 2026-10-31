# SAHAJ — Product Requirements Document (v0.1 draft)

> Status: Draft for review · Date: 2026-10-31 · Owner: Pratham
> Basis: code review of `main` (commit `cd30d3b` plus uncommitted refactor), docs in `/docs`, and the Q&A decisions in section 2.

---

## 1. Product summary

**SAHAJ** is a multi-tenant attendance SaaS for Indian educational institutions (schools, colleges, universities, coaching centers). Teachers open an attendance window for a class. Students verify presence on the mobile app (face + liveness + location + registered device). Administrators manage the institution. The platform turns attendance into the compliance outputs Indian institutions need: 75% eligibility, shortage and condonation lists, and parent alerts.

**One-line positioning:** *Attendance that is trustworthy enough to base exam eligibility on, and simple enough that a teacher takes it in under 30 seconds.*

### Surfaces
| Surface | Users | Stack today |
|---|---|---|
| Mobile app (Android + iOS) | Students (later: parents) | Flutter, Riverpod |
| Web dashboard | Teachers, Admins, Super-admin | Next.js 16 / React 19 |
| API | All clients | FastAPI, Prisma, PostgreSQL + pgvector, Redis, S3 |
| AI pipeline | Backend | DeepFace/FaceNet, MobileNetV2 liveness, MobileNetV1 background |

### Roles
`SUPER_ADMIN` (platform) → `TENANT_ADMIN` / `ADMIN` → `TEACHER` → `STUDENT`. New: `GUARDIAN` (read-only plus alerts), `CLASS_TEACHER` (a teacher flag for schools, not a separate login role).

---

## 2. Decisions captured from Q&A

| Topic | Decision |
|---|---|
| Customer segment | All four tenant types (school, college, university, coaching), driven by configurable **tenant type + attendance policy** |
| Data model | Replace the dual models with one Indian-education-suited model (section 5) |
| Business model | Sales-led now, self-serve later. Manual tenant provisioning and license approval stay for v1. Billing is out of v1 scope |
| Infra / scale | Out of scope for this PRD, except the baseline in section 11 |
| Capture flow | Teacher opens a window, students self-verify. Teacher can manually mark exceptions with an audit trail |
| Biometrics | **Opt-in per tenant**, explicit versioned consent, **non-biometric fallback is mandatory** |
| Integrations (v1) | CSV/Excel import and export, parent notifications (SMS / WhatsApp / push), exam eligibility and shortage reports |
| Languages / platforms | English only. Android **and** iOS |
| Strategic emphasis | **Reliability of attendance capture.** Weak points and improvements are in section 6 |

---

## 3. Problems and goals

### Problems we solve
1. Proxy attendance (a friend marks for you) and fake attendance (remote marking, GPS spoof, photo of a photo).
2. Paper registers and Excel: slow, error-prone, hard to turn into 75% shortage and condonation decisions.
3. Parents learn about absence late, or never.
4. Admins cannot trust or audit attendance data when it decides exam eligibility.

### Goals (measurable)
| Goal | Target for pilot |
|---|---|
| Teacher time to open and close a class window | < 30 s |
| Student time to mark attendance (good network) | < 10 s p95 end to end |
| False accept rate (proxy accepted) | < 0.1%, measured on a labelled test set |
| False reject rate (genuine student flagged) | < 3%, and every flag has a one-tap teacher resolution |
| Attendance records with a complete audit trail | 100% |
| Eligibility report matches a manual recount | 100% on pilot data |

### Non-goals (v1)
Self-serve signup and online payments, regional language UI, payroll or staff attendance, hostel and transport attendance, exam proctoring, a new infrastructure platform.

---

## 4. Users and core journeys

**Super-admin (platform team):** provision a tenant (type, license count, admin), approve license requests, suspend, view audit. *(Exists.)*

**Tenant admin:** set up the academic year, departments, subjects, classrooms, time slots, holidays, courses and sections. Import students and teachers by CSV. Set the **attendance policy** (section 5.3). Review device-change requests. Run eligibility and shortage reports. Decide condonations. *(Setup exists. Policy, holidays, imports and eligibility are gaps.)*

**Teacher:** see today's schedule, open an attendance window for an occurrence, watch live marks, resolve flagged items, manually mark or edit with a reason, close the window, record a topic covered. *(Partly exists. Today's flow runs on the legacy `Session` model.)*

**Student:** register face (if the tenant enabled it) and device, see today's classes, mark attendance, see subject-wise percentage and what is needed to stay above threshold, request leave or condonation. *(Exists, except the condonation flow.)*

**Guardian (new):** receive absence and low-attendance alerts, view a child's attendance read-only.

---

## 5. Data model (recommended)

### 5.1 Why change
The repo holds two parallel models:
- **Legacy:** `AcademicClass → Session → Attendance(status: String)`. The student mark flow, geofence and gamification still use it.
- **New:** `CourseSection → TimetableRule → ClassOccurrence → AttendanceRecord(status: enum, method: enum)` plus `AttendanceAuditLog`. Timetable and register code use it.

Running both causes drift and two sources of truth for percentages. The new model is the right base. It matches the common pattern (period → timetable rule → dated occurrence → per-student record), adds holidays, substitution and cancellation, and has audit. **Decision: migrate everything to the new model and remove the legacy tables.**

### 5.2 Entities
```
Tenant (type, status, attendancePolicyId, settings)
 └ AcademicYear / Term (status PLANNING→ACTIVE→LOCKED→ARCHIVED)
    ├ CalendarEvent (HOLIDAY, EXAM_DAY, NON_INSTRUCTIONAL, TIMETABLE_OVERRIDE)
    └ CourseSection (subject, batch/section, default room, components)
        ├ CourseFaculty        (teacher ↔ section, role: PRIMARY / CO / SUBSTITUTE)
        ├ CourseEnrollment     (student ↔ section, status, from/to dates)
        └ TimetableRule        (day, TimeSlot, room, teacher, effective range)
            └ ClassOccurrence  (date, slot, faculty, substitute, status, component,
                                 isAttendanceLocked, verification window)
                └ AttendanceRecord (student, status, method, scores, GPS, evidence)
                    └ AttendanceAuditLog (who, from→to, reason, when)

AttendancePolicy       (per tenant, section 5.3)
DailyRegister (schools) (date, class section, half: AM/PM, derived or teacher-set)
LeaveRequest           (student, range, reason, document, status)
CondonationRequest     (student, subject or term, shortfall, reason, document,
                        fee, status, decided by)
Guardian / StudentGuardian (contact, relation, consent, notification channels)
BiometricConsent       (student or guardian, version, granted/revoked at, by whom)
```

### 5.3 Attendance policy (the key to "all tenant types")
One configurable policy object per tenant. Defaults differ by tenant type.

| Field | College / University | School | Coaching |
|---|---|---|---|
| Counting basis | `PER_SUBJECT` (and per component: theory / practical / tutorial) | `DAILY` (working days) with optional per-period detail | `PER_BATCH` |
| Minimum % | 75 (configurable) | 75 | configurable |
| Condonation band | 65–74.99, requires request and approval, optional fee | limited, with a medical document | none |
| Late handling | `LATE` counts as present up to N minutes | same | same |
| Excused (leave) | Counts as present, or excluded from the denominator (configurable) | same | same |
| Window lock | Locks after N hours, then edit needs reason plus approval | Locks end of day | Locks after N hours |

Counting formula (documented and tested): `percentage = (PRESENT + LATE_counted + EXCUSED_if_counted) / conducted_occurrences`, **excluding** `CANCELLED` occurrences and holidays. Conducted means the occurrence status is `CONDUCTED` or the window was opened.

> **To verify before launch:** the exact UGC/AICTE wording, each university's ordinance, and the CBSE circular on whether CBSE counts days or periods. Searches confirmed the 75% rule and a typical 65–74% condonation band, but not the primary texts. See sources in section 13.

### 5.4 Schema fixes needed
- `AttendanceStatus` as an enum everywhere (legacy uses a free string).
- `StudentBiometric.consentGiven` currently **defaults to `true`**. Change the default to `false`, and move consent to a versioned `BiometricConsent` table.
- Enforce `tenantId` NOT NULL on tenant-scoped tables (many are nullable `String?`).
- Add unique `(occurrenceId, studentId)` (present) and idempotency key per mark request (new).
- Add `APAAR ID`, `enrollmentNo` / `rollNo` and `admissionNo` on Student (the APAAR ID is the national student ID for schools).

---

## 6. Attendance capture reliability (primary focus)

### 6.1 How capture works today (from code)
The student submits a selfie plus GPS. The server checks, in order: active session, geofence, registered face embedding, duplicate, then AI scores (face ≥ 0.60 and liveness ≥ 0.50, background ≥ 0.50) → `Present` or `Flagged`. Flagged items go to teacher review. Device binding is by `device_uuid`. An offline Smart Pass QR exists as a fallback.

### 6.2 Weaknesses found and recommended fixes

| # | Weakness | Why it matters | Recommendation | Priority |
|---|---|---|---|---|
| 1 | **Selfie plus GPS does not prove the student is in the room.** GPS can be spoofed (mock location apps). A friend can hold both phones | Core fraud path | Add a **rotating in-class proof**: the teacher's screen shows a short-lived code/QR (refreshes about every 15–30 s) that the student app must scan or enter. Optional BLE beacon later. This is the strongest proximity signal and works without GPS | P0 |
| 2 | **No device integrity check.** `device_uuid` is client-supplied and a rooted or emulated device can fake it | Defeats device binding | Android **Play Integrity**, iOS **App Attest / DeviceCheck** tokens verified server side. Reject or flag rooted, emulated and mock-location devices | P0 |
| 3 | **Passive liveness only** (MobileNetV2 on one frame). Photo or screen replay can pass | Spoofing | Add a randomized **active challenge** (blink, turn left/right) validated across several frames. Keep MobileNet as a second signal. Set thresholds from measured data, not constants | P1 |
| 4 | **Face model and thresholds are unvalidated.** FaceNet-128 and fixed cutoffs (0.60 / 0.50) have no measured FAR/FRR, and none on Indian demographics, low light or school-age faces | Wrongly flagged or accepted students | Build a labelled evaluation set. Report FAR/FRR. Make thresholds **per-tenant configurable** and calibrate. Evaluate a stronger embedding (ArcFace-class). Add re-enrolment prompts when match scores drift | P1 |
| 5 | **Fail-open and inconsistent paths.** `analyze_attendance` assigns scores of `1.0` when AI is disabled, while `mark_attendance` records `0.0` (BUG-010 was fixed in only one path). Missing geofence data returns only a "flag" | Silent trust inflation | One shared verification pipeline, one result object. When a signal is disabled, record it as `NOT_CHECKED` (null), never a score | P0 |
| 6 | **Verification config appears global** (`SystemConfigService().get_config()`), not per tenant (verify in code) | One tenant's settings affect others | Move toggles and thresholds into the tenant's `AttendancePolicy` | P0 |
| 7 | **Binary Present / Flagged.** Teachers review everything flagged with no ranking | Review fatigue | Compute a **risk score** from signals (face, liveness, proximity code, GPS accuracy, device integrity, time since window opened). Policy: auto-accept / needs review / reject. Show the reasons, not just the status | P1 |
| 8 | **Poor networks.** Many Indian classrooms have weak connectivity. The Smart Pass exists, but its behavior and expiry rules are undocumented | Genuine students fail to mark | Idempotent submit with a client key, **local retry queue**, server timestamps, grace period, and clear UI states. Document Smart Pass: signed, single-use, tied to occurrence and student, reconciled later and marked `SMART_PASS_OFFLINE` | P1 |
| 9 | **Teacher is a single point of failure.** If the teacher forgets to open or close a window, or the phone or web app fails | Missing attendance | Fallbacks: teacher marks by roster, by QR scan at the door (the admin scanner page exists), or bulk "all present, uncheck absentees". Auto-close windows. Reminder if no window opened 10 minutes into class | P0 |
| 10 | **Edits are not governed.** Anyone with access can change records, and the lock policy is unclear | Data cannot be trusted for exam eligibility | Window lock after N hours. After lock, edits need a reason and an approver. Every change writes an `AttendanceAuditLog` row. Eligibility reports show "edited after lock" | P0 |
| 11 | **Biometric consent defaults to true** and the refresh/revocation flow is unclear | DPDP exposure, particularly for minors | Section 8 | P0 |
| 12 | **Leaderboards and streaks** can push students to game attendance | Behavior risk, and a child-data concern in schools | Make gamification opt-in per tenant and off for school tenants by default | P2 |

### 6.3 Capture modes per occurrence
`AI_BIOMETRIC` (face plus proof code), `CODE_ONLY` (rotating code, for tenants without biometrics), `SMART_PASS_OFFLINE`, `MANUAL_REGISTER`, `MANUAL_OVERRIDE`, `SYSTEM_EXCUSED` (approved leave). The tenant policy decides which modes are allowed. **Every tenant must have at least one non-biometric mode.**

### 6.4 Acceptance criteria for capture
- A student cannot mark twice for one occurrence (the DB unique constraint holds under concurrency).
- A mark outside the window is rejected. A mark within the grace period is `LATE`.
- A request replayed with the same idempotency key returns the original result.
- With every signal disabled, no score is fabricated, and the record shows which checks ran.
- A teacher can resolve all flagged items for an occurrence in one screen, with evidence and reasons shown.
- An outage test shows a student's offline mark reconciles within N minutes of reconnecting, with no duplicates.

---

## 7. Functional requirements by area

### 7.1 Tenant and academic setup (admin)
- Tenant type presets that load default attendance policy and labels (for example, "Section" versus "Class").
- Academic year and term lifecycle with locking and archiving.
- Holiday and event calendar with bulk import. Holidays and exam days are excluded from the denominator.
- Departments, subjects (with components), classrooms (with geofence), time slots, courses and sections, faculty assignment, substitution.
- **Bulk CSV/Excel import** for students, teachers, enrollments and timetables. Validation report with row-level errors, dry run before commit, and downloadable templates.

### 7.2 Attendance (teacher / student)
As in section 6. Plus live roster, topic covered, and cancel or reschedule an occurrence with a reason (this notifies students).

### 7.3 Leave and condonation
- Student leave request with document upload, approval by teacher or admin, which sets `SYSTEM_EXCUSED` records.
- **Condonation workflow** (new): student sees the shortfall → submits a request with a reason and document → admin or committee approves → the report reflects the condoned status without altering raw attendance. Optional fee field and a once-per-N-terms cap.

### 7.4 Eligibility and reports (admin / teacher / exam cell)
- Per student, per subject and aggregate percentage with the policy applied.
- **Shortage list** (below threshold), **condonation list** (inside the band), **detention list**, for a chosen date range and cut-off date.
- Export to Excel and PDF. A report snapshot is stored with its generated time and policy version, so results are reproducible.
- Teacher analytics: attendance trend per section, low-attendance students, flagged rates.

### 7.5 Notifications
- Channels: push (FCM, exists), SMS, WhatsApp (via a provider such as a WhatsApp Business API partner).
- Triggers: absent today, below-threshold warning (for example, at 80% and 76%), leave decisions, condonation decisions, class cancelled, device-change requests.
- Guardian preferences and opt-out. Quiet hours. Delivery log. Templates are approved in advance, which WhatsApp and Indian SMS (DLT registration) require.

### 7.6 Identity and access
- Invitation onboarding and password reset (exists).
- Device binding with an approval workflow for change (exists). Add integrity attestation (6.2 #2).
- SSO (SAML) and SCIM provisioning exist in code. **Keep out of the v1 promise** until tested with a real IdP.
- Strict tenant isolation on every query, covered by tests.

### 7.7 Platform admin
Tenant provisioning, license seat accounting, license requests, suspension, platform audit log, broadcasts. *(Exists.)* Billing is deferred (section 10).

---

## 8. Privacy, consent and compliance (India)

- **DPDP Act 2023 / Rules 2025** (notified November 2025, phased). Treat face templates as sensitive. Searches did not confirm that biometric attendance falls under the educational-institution exemption for minors, so **assume explicit consent is required** and confirm with counsel.
- Consent is explicit, versioned, revocable, and stored with timestamp and actor. Default is not granted. For minors, the institution records guardian consent.
- Revoking consent deletes the face template and switches the student to a non-biometric mode. Nobody is penalized for opting out.
- Retention: define periods for templates, evidence photos (only flagged ones are kept), and attendance. Auto-purge on schedule. Honor deletion requests.
- Data minimization: store the embedding and only the evidence needed for flagged review. Encrypt at rest. Access to evidence is role-restricted and logged.
- A data processing agreement per tenant, and a published privacy notice. Breach-response runbook.
- Data residency: India region.

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| Correctness | One percentage calculation function, unit-tested against hand-computed fixtures from real policies |
| Security | Close all findings in section 12. RS256 or rotated secrets. Rate limits. Fail-closed token revocation in production. No secrets in the repo |
| Auditability | Every attendance mutation, policy change and consent change is logged with actor, time and reason |
| Reliability | Idempotent writes. Safe retries. Graceful degradation when AI or Redis is down: **fall back to a non-biometric mode and flag**, never silently pass |
| Performance | p95 mark latency < 10 s (inference included) under pilot load |
| Accessibility | Mobile and web meet basic WCAG AA. Text scaling. Screen-reader labels |
| Testing | Backend, web and mobile suites in CI (exist). Add end-to-end tests for the full class-day journey and tenant isolation |
| Observability | Structured logs, Sentry (exists), per-tenant metrics for flag rate and failure reasons |

Infrastructure and scaling are explicitly out of scope here (see Q&A). The one baseline requirement: **tested database backups and a documented restore**, because attendance may decide exam eligibility.

---

## 10. Scope and phasing

**Phase 0 — Stabilize (blocker for everything else)**
- Finish the in-flight refactor (55 deleted, 186 modified, 77 untracked files in the working tree) and get CI green.
- Migrate the mark flow, geofence and gamification to the new occurrence model. Remove legacy tables. Write a data migration.
- Single verification pipeline. Remove fail-open paths (6.2 #5, #6).
- Consent default and schema fixes (5.4). Remove `credentials.txt` from the repo and rotate any credential in it.

**Phase 1 — Trustworthy capture (pilot-ready)**
- Rotating in-class code, device attestation, idempotent submit and retry queue, teacher fallbacks, edit lock and audit, and a risk score with review UI.
- Attendance policy object, tenant presets, percentage engine.
- CSV/Excel import, holiday calendar.

**Phase 2 — Compliance and communication**
- Eligibility, shortage, condonation and detention reports.
- Condonation workflow. Guardian role, SMS / WhatsApp / push alerts.
- School daily register mode.

**Phase 3 — Quality and growth**
- Active liveness, model evaluation and calibration, stronger embedding.
- SSO/SCIM hardening for universities. Self-serve signup and billing. Regional languages.

---

## 11. Success metrics
Teacher adoption (percent of occurrences with attendance taken by app), student first-try success rate, flag rate and flag-resolution time, FAR/FRR from audit samples, percent of alerts delivered, support tickets per 100 students, and report accuracy against manual recounts in the pilot.

---

## 12. Known issues to fix (from the code review)
1. Two attendance models in parallel (section 5.1).
2. `analyze_attendance` vs `mark_attendance` inconsistent when verification is disabled (6.2 #5).
3. Verification config likely not tenant-scoped (6.2 #6).
4. Biometric consent default `true` (5.4).
5. Nullable `tenantId` on many tenant-scoped tables.
6. `credentials.txt` at the repo root. Check git history and rotate.
7. Fixed model thresholds in code with no calibration.
8. Docs drift: README says 73 backend tests and `docs/qa_audit_report.md` says 39, and the report says "all bugs fixed" while the code is mid-refactor. Refresh after Phase 0.
9. Legacy `README` describes roles `ADMIN`/`TEACHER`/`STUDENT`, while the schema has five roles. Align the docs.

---

## 13. Open questions for you
1. **Pilot customer:** which tenant type is first, and can you share their real attendance policy (threshold, condonation rules, register format)? This fixes defaults and the report formats.
2. **Proximity proof:** are you happy with a teacher-displayed rotating code as mandatory for biometric mode? (It needs a screen in the classroom, which the teacher's laptop or phone can provide.)
3. **Guardian channel:** WhatsApp needs a Business API provider and approved templates, and SMS needs DLT registration. Which do you want first?
4. **School daily register:** is the class teacher's morning roll call the source of truth, with period-wise being optional?
5. **Evidence retention:** how long may flagged selfies be kept? Suggested default is 30–90 days.
6. **Model evaluation:** can you collect a labelled set (consented) from the pilot to measure FAR/FRR?
7. **Legal review:** who confirms DPDP treatment of biometrics for minors?

---

## 14. Sources (research, not primary texts)
- Condonation and 75% norms: [Rajagiri](https://rajagiritech.ac.in/Home/exam/Condonation_and_Promotion.asp), [MS University](https://www.msuniv.ac.in/images\academic\centre%20academic%20affairs/Condonation.pdf)
- CBSE 75% rule: [Free Press Journal](https://www.freepressjournal.in/education/cbse-mandates-75-attendance-for-class-x-xii-exams-know-what-happens-if-students-fall-short). APAAR: [Careers360](https://school.careers360.com/articles/cbse-apaar-id-implementation)
- DPDP Rules 2025: [Biometric Update](https://www.biometricupdate.com/202511/india-notifies-its-sweeping-digital-personal-data-protection-rules), [Tsaaro](https://tsaaro.com/blogs/teaching-in-the-age-of-dpdpa-when-child-safety-becomes-edtech%E2%80%99s-competitive-advantage)
- Timetable/attendance schema pattern: [DEV Community walkthrough](https://dev.to/pocharis/relational-database-design-to-store-university-timetables-and-record-of-students-attendance-3jg4)

*Verify the primary regulations (UGC/AICTE, university ordinances, CBSE circular dated 04.08.2025, DPDP Rules text) before relying on these numbers.*
