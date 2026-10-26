# Smart Attendance System — Comprehensive Test-Case Spreadsheet

> **Version:** 1.0 | **Date:** 2026-10-26
> **Legend:** Priority: P1=Critical P2=High P3=Medium P4=Low | Severity: S1=Blocker S2=Major S3=Minor S4=Trivial | Status: ⬜ Not Run

---

## Module 1 — Authentication

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Login with valid email & password | User exists, isActive=true, tenant ACTIVE | POST /auth/login {email, password} | 200 + JWT token returned | P1 | S1 | Yes | — |
| AUTH-002 | Login with enrollment number (student) | Student with enrollmentNumber exists | POST /auth/login {email: "EN001", password} | 200 + JWT with role=STUDENT | P1 | S1 | Yes | — |
| AUTH-003 | Login with employee ID (teacher) | Teacher with employeeId exists | POST /auth/login {email: "EMP001", password} | 200 + JWT with role=TEACHER | P2 | S2 | Yes | — |
| AUTH-004 | Login with wrong password | User exists | POST /auth/login {email, password: "wrong"} | 401 Unauthorized | P1 | S1 | Yes | — |
| AUTH-005 | Login with non-existent email | — | POST /auth/login {email: "ghost@x.com", password} | 401 Unauthorized | P1 | S1 | Yes | — |
| AUTH-006 | Login with inactive user account | isActive=false | POST /auth/login {email, password} | 403 "Account is inactive" | P1 | S1 | Yes | — |
| AUTH-007 | Login student from mismatched device | student.deviceUuid="A", request device_uuid="B" | POST /auth/login {email, password, device_uuid: "B"} | 403 "Account is bound to another device" | P1 | S1 | Yes | BUG-001 (Resolved) |
| AUTH-008 | **[BUG-001]** Login student WITHOUT device_uuid when UUID already registered | student.deviceUuid="A" | POST /auth/login {email, password} — no device_uuid field | 403 "Device UUID is required for this student account" (Fixed) | P1 | S1 | Yes | BUG-001 (Resolved) |
| AUTH-009 | Login with suspended tenant | tenant.status=SUSPENDED | POST /auth/login {email, password} | 403 "institution...suspended" | P1 | S1 | Yes | — |
| AUTH-010 | Login with TRIAL tenant | tenant.status=TRIAL | POST /auth/login | 200 OK (trial is allowed) | P2 | S2 | Yes | — |
| AUTH-011 | Login student — first login, no device_uuid in DB | student.deviceUuid=null | POST /auth/login {email, password, device_uuid: "NEW_UUID"} | 200 + deviceUuid saved to DB | P1 | S1 | Yes | — |
| AUTH-012 | Login — missing required fields | — | POST /auth/login {} | 422 VALIDATION_ERROR with details array | P2 | S2 | Yes | — |
| AUTH-013 | Auth rate limit (IP-based) | Dev mode OFF / prod settings | 11+ POST /auth/login from same IP within 60s | 429 after 11th request | P1 | S2 | Yes | — |
| AUTH-014 | GET /auth/me — valid token | Valid JWT | GET /auth/me with Bearer token | 200 + user profile with role-specific data | P1 | S1 | Yes | — |
| AUTH-015 | GET /auth/me — expired token | Expired JWT | GET /auth/me | 401 Unauthorized | P1 | S1 | Yes | — |
| AUTH-016 | GET /auth/me — tampered token | Manipulated JWT signature | GET /auth/me | 401 Unauthorized | P1 | S1 | Yes | — |
| AUTH-017 | GET /auth/me — revoked token (post-logout) | Token added to denylist | GET /auth/me | 401 "Token has been revoked" | P1 | S1 | Yes | — |
| AUTH-018 | Logout — valid token | Logged in | POST /auth/logout | 200 + token in denylist | P1 | S1 | Yes | — |
| AUTH-019 | **[BUG-005]** Logout — Redis down, then reuse token | Redis offline, TOKEN_REVOCATION_FAIL_CLOSED=True | POST /auth/logout, then GET /auth/me | 503 "Authentication service temporarily unavailable" with critical security alert logged (Fixed) | P1 | S1 | Yes | BUG-005 (Resolved) |
| AUTH-020 | Forgot password — registered email | User exists | POST /auth/forgot-password {email} | 200 + reset email sent | P2 | S2 | Yes | — |
| AUTH-021 | Forgot password — unregistered email | User does not exist | POST /auth/forgot-password {email} | 200 (no user enumeration) | P2 | S2 | Yes | — |
| AUTH-022 | Reset password — valid token | Reset token in Redis | POST /auth/reset-password {token, new_password} | 200 + password updated, token deleted | P1 | S1 | Yes | — |
| AUTH-023 | Reset password — expired token | Redis TTL elapsed (15 min default) | POST /auth/reset-password {token, new_password} | 400 "Invalid or expired" | P1 | S1 | Yes | — |
| AUTH-024 | Verify token — valid invite | invite:{token} in Redis | GET /auth/verify-token?token=X&token_type=invite | 200 valid=true + email/role | P2 | S2 | Yes | — |
| AUTH-025 | Verify token — invalid type | — | GET /auth/verify-token?token=X&token_type=banana | 400 "Invalid token type" | P3 | S3 | Yes | — |
| AUTH-026 | Complete onboarding — valid invite | Invite token in Redis, user.isActive=false | POST /auth/complete-onboarding {token, password} | 200 + isActive=true | P1 | S1 | Yes | — |
| AUTH-027 | **[BUG-012]** Complete onboarding — mustChangePassword flag | Invite token valid | Complete onboarding; then login and GET /auth/me | 200 + must_change_password=false (Fixed) | P1 | S2 | Yes | BUG-012 (Resolved) |
| AUTH-028 | **[BUG-020]** Re-use completed invite link | User already isActive=true | POST /auth/complete-onboarding with used token | 400 "This invitation link has already been used" (Fixed) | P1 | S1 | Yes | BUG-020 (Resolved) |
| AUTH-029 | Change password — correct current password | Logged in, mustChangePassword=false | POST /auth/change-password {current_password, new_password} | 200 + password updated | P1 | S1 | Yes | — |
| AUTH-030 | Change password — wrong current password | — | POST /auth/change-password {current_password: "wrong", new_password} | 400 "Current password is incorrect" | P1 | S1 | Yes | — |
| AUTH-031 | SSO config — valid tenant slug | SSO configured | GET /auth/sso/config?tenant_slug=X | 200 + SSO config object | P2 | S2 | No | — |
| AUTH-032 | SAML ACS — missing SAMLResponse | — | POST /auth/sso/saml/acs with empty body | 400 "Missing SAMLResponse" | P2 | S2 | No | — |

---

## Module 2 — Student: Attendance Marking

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| ATT-001 | Mark attendance — all verifications disabled | Session active, GPS=off, Face=off, Bg=off | POST /student/attendance/mark {session_id, lat, lon, accuracy} | 200 status=Present | P1 | S1 | Yes | — |
| ATT-002 | Mark attendance — GPS verification, student inside geofence | GPS=on, geofence set, student within radius | POST /student/attendance/mark {session_id, lat, lon, accuracy} | 200 status=Present | P1 | S1 | Yes | — |
| ATT-003 | Mark attendance — GPS verification, student outside geofence | GPS=on, geofence set, student outside | POST mark | 200 status=Flagged | P1 | S1 | Yes | — |
| ATT-004 | Mark attendance — no geofence defined for class | GPS=on, no Geofence record | POST mark | 200 (geofence_missing=True → Flagged) | P2 | S2 | Yes | — |
| ATT-005 | Mark attendance — face recognition, valid face | Face=on, embedding registered | POST mark with image | 200 status=Present (face_score >= 0.60) | P1 | S1 | No | — |
| ATT-006 | Mark attendance — face recognition, wrong face | Face=on | POST mark with image of different person | 200 status=Flagged | P1 | S1 | No | — |
| ATT-007 | Mark attendance — face recognition, no image | Face=on | POST mark without image | 400 "Image is required" | P1 | S1 | Yes | — |
| ATT-008 | Mark attendance — session already expired | session.endTime < now | POST mark | 400 "session not active" | P1 | S1 | Yes | — |
| ATT-009 | Mark attendance — duplicate submission | Already marked for session | POST mark again | 400 "Attendance already submitted" | P1 | S1 | Yes | — |
| ATT-010 | **[BUG-002]** Concurrent duplicate submission race | Two requests simultaneously | Two concurrent POST mark requests | Exactly one saved (200), second rejected with 400 "Attendance already submitted" via DB unique constraint (Fixed) | P1 | S1 | Yes | BUG-002 (Resolved) |
| ATT-011 | Mark attendance — student not enrolled in class | Session for a different class | POST mark | 400 or Flagged | P1 | S1 | Yes | — |
| ATT-012 | Mark attendance — image too large (>5MB) | — | POST mark with 6MB JPEG | 413 Payload Too Large | P2 | S2 | Yes | — |
| ATT-013 | Mark attendance — invalid image type | — | POST mark with PDF file | 415 Unsupported Media Type | P2 | S2 | Yes | — |
| ATT-014 | **[BUG-018]** Mark attendance — spoofed content-type | PDF with JPEG content-type header | POST mark | 415 "Unsupported media type. Upload must be a valid JPEG, PNG, or WebP image" via magic-byte validation (Fixed) | P2 | S2 | Yes | BUG-018 (Resolved) |
| ATT-015 | Mark attendance — rate limit | >10 requests/60s per student | 11 POST marks | 429 Too Many Requests | P2 | S2 | Yes | — |
| ATT-016 | Analyze attendance — returns review token | All checks pass | POST /student/attendance/analyze | 200 + review_token (5-min JWT) | P1 | S1 | Yes | — |
| ATT-017 | Confirm attendance — valid review token | review_token from analyze | POST /student/attendance/confirm {review_token} | 200 attendance saved | P1 | S1 | Yes | — |
| ATT-018 | Confirm attendance — expired review token | review_token > 5 min old | POST confirm | 400 "Invalid, expired, or mismatched" | P1 | S1 | Yes | — |
| ATT-019 | Confirm attendance — wrong student's token | Token from student A used by student B | POST confirm by student B | 400 "mismatched review token" | P1 | S1 | Yes | — |
| ATT-020 | Async mark — enqueue job | Session active | POST /student/attendance/async-mark | 202 + job_id | P2 | S2 | Yes | — |
| ATT-021 | Async mark — get job status | Job submitted | GET /student/attendance/jobs/{job_id} | 200 + job status | P2 | S2 | Yes | — |
| ATT-022 | Get job status — wrong student accessing another's job | Job owned by student A | GET job by student B | 403 Forbidden | P1 | S1 | Yes | — |
| ATT-023 | Get job status — non-existent job ID | — | GET jobs/doesnotexist | 404 Not Found | P3 | S3 | Yes | — |

---

## Module 3 — Student: Face Registration

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| FACE-001 | Register face — valid frontal image | Student logged in | POST /student/register-face with clear image | 200 "Face embedding registered" | P1 | S1 | No | — |
| FACE-002 | Register face — no face detected | Submitted image with no face | POST /student/register-face | 400 "Could not extract a valid face" | P1 | S1 | No | — |
| FACE-003 | Register face — invalid image type | — | POST /student/register-face with PDF | 415 Unsupported Media Type | P2 | S2 | Yes | — |
| FACE-004 | Register face — image >5MB | — | POST with 6MB file | 413 Payload Too Large | P2 | S2 | Yes | — |
| FACE-005 | Register face — requires prior biometric consent | No prior consent given | POST /student/register-face (valid) | 403 "Biometric consent is required prior to registering facial biometrics" (Fixed) | P1 | S2 | Yes | BUG-003 (Resolved) |
| FACE-006 | **[BUG-003]** Consent check — Redis down | Redis unavailable, consent in DB | GET /student/biometric/consent-status | 200 has_consent=true via DB fallback on StudentBiometric table (Fixed) | P1 | S1 | Yes | BUG-003 (Resolved) |
| FACE-007 | **[BUG-004]** Verify reference photo persistence | S3 connected | POST /student/register-face (success) | 200 + Reference photo retained in S3, deleted only on failure (Fixed) | P1 | S2 | Yes | BUG-004 (Resolved) |
| FACE-008 | Register face — rate limit (>5/min) | — | 6 POST register-face within 60s | 429 Too Many Requests | P2 | S2 | Yes | — |
| FACE-009 | Biometric consent — submit explicit consent | Student logged in | POST /student/biometric/consent | 200 + consent recorded | P2 | S2 | Yes | — |
| FACE-010 | Biometric consent status — has consent | Consent exists in Redis | GET /student/biometric/consent-status | 200 has_consent=true | P2 | S3 | Yes | — |
| FACE-011 | Biometric consent status — no consent | No consent in Redis | GET /student/biometric/consent-status | 200 has_consent=false, consent_required=true | P2 | S3 | Yes | — |

---

## Module 4 — Student: Leave Management

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| LEAVE-001 | Create leave request — valid dates, no document | Student logged in | POST /student/leaves {start_date, end_date, reason} | 201 leave with status=PENDING | P1 | S1 | Yes | — |
| LEAVE-002 | Create leave request — with PDF document | Valid PDF <10MB | POST /student/leaves + file | 201 leave + document_url | P1 | S1 | Yes | — |
| LEAVE-003 | Create leave — end_date before start_date | — | POST {start_date: "2026-11-10", end_date: "2026-11-05"} | 400 "End date must be after" | P1 | S1 | Yes | — |
| LEAVE-004 | Create leave — reason too short (<5 chars) | — | POST {reason: "sick"} | 400 "Reason must be between 5 and 500" | P2 | S2 | Yes | — |
| LEAVE-005 | Create leave — reason too long (>500 chars) | — | POST {reason: "a" * 501} | 400 Validation error | P2 | S2 | Yes | — |
| LEAVE-006 | Create leave — invalid date format | — | POST {start_date: "11-01-2026"} | 400 "Invalid date format. Use YYYY-MM-DD" | P2 | S2 | Yes | — |
| LEAVE-007 | Create leave — document >10MB | — | POST with 11MB PDF | 413 Payload Too Large | P2 | S2 | Yes | — |
| LEAVE-008 | Create leave — unsupported doc type (EXE) | — | POST with EXE file | 415 Unsupported Media Type | P2 | S2 | Yes | — |
| LEAVE-009 | List my leaves — empty result | No leaves created | GET /student/leaves | 200 leaves=[], total=0 | P2 | S3 | Yes | — |
| LEAVE-010 | List my leaves — with data | Leaves exist | GET /student/leaves | 200 correct totals (pending/approved/rejected) | P2 | S2 | Yes | — |
| LEAVE-011 | Teacher views pending leaves — authorized | Teacher teaches student's class | GET /teacher/leaves/pending | 200 list of pending leaves | P1 | S1 | Yes | — |
| LEAVE-012 | **[BUG-008]** Teacher with no classes approves leave | teacher_class_ids is empty | PUT /teacher/leaves/{id}/approve {status: "APPROVED"} | 403 / approval denied due to lack of class ownership (Fixed) | P1 | S1 | Yes | BUG-008 (Resolved) |
| LEAVE-013 | Teacher approves leave — marks sessions Excused | Leave covers past sessions | Approve leave | Attendance records in date range updated to Excused | P1 | S1 | Yes | — |
| LEAVE-014 | Teacher rejects leave | Leave pending | PUT /teacher/leaves/{id}/approve {status: "REJECTED"} | 200 leave.status=REJECTED | P2 | S2 | Yes | — |
| LEAVE-015 | Approve non-existent leave ID | — | PUT /teacher/leaves/doesnotexist/approve | 404 Not Found | P3 | S3 | Yes | — |
| LEAVE-016 | Streak after leave approval — leave was absence | Session during leave, student was absent | Approve leave | Streak recalculated (absence becomes Excused, streak intact) | P1 | S1 | Yes | — |

---

## Module 5 — Smart Pass

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| SP-001 | Student gets Smart Pass QR | Student logged in | GET /student/smart-pass | 200 + qr_token (30s JWT) + expires_at | P1 | S1 | Yes | — |
| SP-002 | Student Smart Pass expires | 30+ seconds after generation | Student scans token after 30s | 400 "Invalid" or expired token | P1 | S1 | Yes | — |
| SP-003 | Teacher generates session Smart Pass | Active session exists, teacher owns class | GET /teacher/sessions/{id}/smart-pass | 200 + teacher QR token | P1 | S1 | Yes | — |
| SP-004 | Student scans teacher Smart Pass | Teacher QR token valid | POST /student/smart-pass/scan {qr_token, lat, lon, accuracy, device_uuid} | 200 attendance marked | P1 | S1 | No | — |
| SP-005 | Teacher verifies student Smart Pass | Student QR token valid | POST /teacher/smart-pass/verify {session_id, qr_token} | 200 student identity verified | P1 | S1 | No | — |
| SP-006 | Scan expired Smart Pass | 30s elapsed | POST /student/smart-pass/scan (expired token) | 400 error | P1 | S1 | Yes | — |
| SP-007 | Smart Pass — cross-student usage | Student A's QR used by Student B's scan | POST scan with student A token by student B | 400 error (sub mismatch) | P1 | S1 | Yes | — |
| SP-008 | Smart Pass rate limit | >15 scans/60s | 16 POST smart-pass/scan requests | 429 Too Many Requests | P2 | S2 | Yes | — |

---

## Module 6 — Teacher: Session & Class Management

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| SESS-001 | Start session — valid class | Teacher owns class | POST /teacher/sessions/start {academic_class_id, duration_minutes} | 200 SessionResponse | P1 | S1 | Yes | — |
| SESS-002 | Start session — unauthorized (wrong teacher) | Teacher does not own class | POST /teacher/sessions/start | 400 "Class not found or unauthorized" | P1 | S1 | Yes | — |
| SESS-003 | **[BUG-009]** Start session — existing active session blocks duplicate start | Active session exists | POST /teacher/sessions/start (same class) | 409 Conflict "An active session already exists for this class. Please stop the active session first." (Fixed) | P2 | S2 | Yes | BUG-009 (Resolved) |
| SESS-004 | Stop session — valid | Active session, teacher owns | POST /teacher/sessions/{id}/stop | 200 + absent students auto-marked | P1 | S1 | Yes | — |
| SESS-005 | Stop session — already stopped | isActive=false | POST /teacher/sessions/{id}/stop | 400 "already stopped" | P2 | S2 | Yes | — |
| SESS-006 | Stop session — unauthorized teacher | Different teacher | POST /teacher/sessions/{id}/stop | 400 Unauthorized | P1 | S1 | Yes | — |
| SESS-007 | Session close — absent students marked | 3 students enrolled, 1 attended | Stop session | 2 absent records created, 1 on-leave student marked Excused | P1 | S1 | Yes | — |
| SESS-008 | Get session attendance roster | Session stopped | GET /teacher/sessions/{id}/attendance | 200 roster with all students' statuses | P1 | S1 | Yes | — |
| SESS-009 | Get absent students during active session | Session active | GET /teacher/sessions/{id}/absent-students | 200 list of students not yet marked | P2 | S2 | Yes | — |
| SESS-010 | Bulk mark attendance — valid | Active session, valid student IDs | POST /teacher/sessions/{id}/mark-bulk | 200 count of marked students | P1 | S1 | Yes | — |
| SESS-011 | Manual override — change Flagged to Present | Attendance record exists | POST /teacher/sessions/{id}/override {student_id, status: "Present"} | 200 status updated | P1 | S1 | Yes | — |
| SESS-012 | Review flagged attendance — approve | Flagged record | PUT /teacher/attendance/{id}/review {status: "Approved"} | 200 + streak recalculated | P1 | S1 | Yes | — |
| SESS-013 | Review flagged attendance — wrong teacher | Flagged record owned by different class | PUT /teacher/attendance/{id}/review | 400 review failed | P1 | S1 | Yes | — |
| SESS-014 | Upsert geofence | Teacher owns class | POST /teacher/classes/{id}/geofence {lat, lon, radius} | 200 GeofenceResponse | P1 | S1 | Yes | — |
| SESS-015 | Get class stats | Class with sessions | GET /teacher/classes/{id}/stats | 200 + total/present/absent counts | P2 | S2 | Yes | — |
| SESS-016 | Export class attendance — date range | Sessions exist in range | GET /teacher/classes/{id}/export-attendance?from_date=X&to_date=Y | 200 list of export items | P2 | S2 | Yes | — |
| SESS-017 | Get attendance matrix | Multiple sessions | GET /teacher/classes/{id}/matrix | 200 matrix rows | P2 | S2 | Yes | — |

---

## Module 7 — Teacher: Device Change Requests

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| DEV-001 | Student requests device change | Valid credentials, enrollment in class | POST /auth/request-device-change {email, password, new_device_uuid, reason} | 200 + request created | P1 | S1 | Yes | — |
| DEV-002 | Device change — wrong password | — | POST with wrong password | 401 "Invalid email or password" | P1 | S1 | Yes | — |
| DEV-003 | Device change — student not enrolled | No active enrollment | POST request-device-change | 400 "No teacher assigned yet" | P2 | S2 | Yes | — |
| DEV-004 | Device change — duplicate pending request updated | Pending request exists | POST request-device-change again | 200 + existing request updated (not duplicate created) | P2 | S2 | Yes | — |
| DEV-005 | Teacher approves device change | Pending request, teacher teaches student | PUT /teacher/device-changes/{id}/approve {status: "APPROVED"} | 200 + student.deviceUuid updated | P1 | S1 | Yes | — |
| DEV-006 | Teacher rejects device change | Pending request | PUT {status: "REJECTED"} | 200 + request.status=REJECTED | P2 | S2 | Yes | — |
| DEV-007 | Cross-tenant device change block | Teacher and student in different tenants | Teacher approves | Return false (cross-tenant blocked) | P1 | S1 | Yes | — |
| DEV-008 | **[BUG-019]** Device change — automated credential stuffing | Attempt limiter active | 6+ requests with different new_device_uuid | 429 Too Many Requests after 5th attempt (Fixed) | P1 | S1 | Yes | BUG-019 (Resolved) |

---

## Module 8 — Gamification & Leaderboard

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| GAM-001 | Streak — 3 consecutive Present | 3 sessions, all Present | GET /student/stats | current_streak=3 | P1 | S1 | Yes | — |
| GAM-002 | Streak — broken by Absent | 2 Present, then Absent | GET /student/stats | current_streak=0, highest_streak preserved | P1 | S1 | Yes | — |
| GAM-003 | Streak — Approved leave does not break streak | Present, Leave, Present | GET /student/stats | current_streak=2 | P1 | S1 | Yes | — |
| GAM-004 | Streak — Flagged session treated as skip | Flagged record exists | Recalculate streak | Flagged sessions skipped (not break) | P2 | S2 | Yes | — |
| GAM-005 | Streak — active session pending (not checked in) excluded | Active session, no attendance | Recalculate | Active unanswered session excluded from streak calc | P2 | S2 | Yes | — |
| GAM-006 | Leaderboard — top 10 from Redis | Leaderboard built | GET /student/leaderboard | 200 + ranked list, user_rank, user_points | P2 | S2 | Yes | — |
| GAM-007 | Leaderboard — Redis empty, DB fallback | Redis empty | GET /student/leaderboard | 200 from DB fallback | P2 | S2 | Yes | — |
| GAM-008 | Points formula correctness | 2 present, streak=3, highest=5 | Verify points = 2*50 + 5*100 + 3*20 = 660 | Correct calculation | P2 | S2 | Yes | — |
| GAM-009 | **[BUG-014]** Cross-tenant leaderboard isolation | Two tenants, students in both | GET leaderboard (tenant A student) | Only tenant A students returned, isolated Redis key and DB filter (Fixed) | P1 | S2 | Yes | BUG-014 (Resolved) |
| GAM-010 | Student stats — zero attendance | No records | GET /student/stats | attendance_percentage=0, all counts=0 | P2 | S3 | Yes | — |
| GAM-011 | Add note to flagged attendance | record.status=Flagged, student is owner | POST /student/attendance/{id}/note {note} | 200 note saved | P2 | S2 | Yes | — |
| GAM-012 | Add note to non-flagged attendance | record.status=Present | POST /student/attendance/{id}/note | 400 "Notes can only be added to flagged records" | P2 | S2 | Yes | — |
| GAM-013 | Add note — wrong student (other student's record) | Student A tries note on Student B's record | POST note | 404 Not Found | P1 | S1 | Yes | — |

---

## Module 9 — Admin Operations

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| ADM-001 | Create student | Admin logged in | POST /admin/students {email, enrollment_number, ...} | 201 student created + invite email sent | P1 | S1 | Yes | — |
| ADM-002 | Create student — duplicate email | Student with email exists | POST /admin/students | 400 error | P1 | S1 | Yes | — |
| ADM-003 | Create teacher | Admin logged in | POST /admin/teachers | 201 teacher created | P1 | S1 | Yes | — |
| ADM-004 | Update student | Student exists | PUT /admin/students/{id} | 200 updated | P2 | S2 | Yes | — |
| ADM-005 | Delete student | Student exists | DELETE /admin/students/{id} | 200 + cascade delete (attendance, enrollments) | P1 | S1 | Yes | — |
| ADM-006 | Enroll student in class | Student and class exist | POST /admin/classes/{id}/enroll | 200 enrollment created | P1 | S1 | Yes | — |
| ADM-007 | Enroll student — duplicate | Already enrolled | POST /admin/classes/{id}/enroll | 400 error | P2 | S2 | Yes | — |
| ADM-008 | Assign teacher to class | Teacher and class exist | POST /admin/classes/{id}/assign-teacher | 200 | P1 | S1 | Yes | — |
| ADM-009 | Create class | Subject and teacher exist | POST /admin/classes | 201 class created | P1 | S1 | Yes | — |
| ADM-010 | Bulk create students (CSV/array) | Valid data array | POST /admin/students/bulk | 200 + BulkImportResponse | P2 | S2 | Yes | — |
| ADM-011 | Bulk create — partial failure | Some items invalid | POST /admin/students/bulk (mixed valid/invalid) | 200 + success_count + failure details | P2 | S2 | Yes | — |
| ADM-012 | Get admin stats | Data exists | GET /admin/stats | 200 + counts for students/teachers/sessions | P2 | S2 | Yes | — |
| ADM-013 | Audit logs — paginated | Logs exist | GET /admin/audit-logs?page=1&page_size=10 | 200 paginated response | P2 | S2 | Yes | — |
| ADM-014 | Non-admin access to admin endpoint | Student JWT | GET /admin/stats | 403 Forbidden | P1 | S1 | Yes | — |
| ADM-015 | TENANT_ADMIN access to admin endpoint | TENANT_ADMIN role | GET /admin/stats | 200 (allowed by RoleChecker) | P2 | S2 | Yes | — |
| ADM-016 | System config — toggle face recognition | Admin | PUT /admin/system-config | 200 config saved | P1 | S1 | Yes | — |
| ADM-017 | View absentee anomalies | Sessions with high absence | GET /admin/absentee-anomalies | 200 list | P2 | S2 | Yes | — |

---

## Module 10 — Super Admin Operations

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| SA-001 | Provision new tenant | SUPER_ADMIN logged in | POST /super-admin/tenants {name, slug, type, ...} | 201 TenantDetailResponse | P1 | S1 | Yes | — |
| SA-002 | Provision duplicate slug | Tenant with slug exists | POST /super-admin/tenants same slug | 400 error | P1 | S1 | Yes | — |
| SA-003 | List tenants — paginated | Tenants exist | GET /super-admin/tenants?page=1&q=uni | 200 filtered list | P2 | S2 | Yes | — |
| SA-004 | Suspend tenant | Active tenant | PUT /super-admin/tenants/{id} {status: "SUSPENDED"} | 200 + WebSocket force-close all tenant connections | P1 | S1 | Yes | — |
| SA-005 | Delete tenant | Tenant exists | DELETE /super-admin/tenants/{id} | 200 + cascade delete | P1 | S1 | Yes | — |
| SA-006 | Add tenant admin | Tenant exists | POST /super-admin/tenants/{id}/admins {email, name, role} | 201 admin user created | P1 | S1 | Yes | BUG-007 (Resolved) |
| SA-007 | **[BUG-007]** Add tenant admin — unvalidated JSON | — | POST /super-admin/tenants/{id}/admins {garbage: 123} | 422 Unprocessable Entity (strict TenantAdminInput validation) (Fixed) | P1 | S1 | Yes | BUG-007 (Resolved) |
| SA-008 | Global user status update | User exists | PATCH /super-admin/users/{id}/status {is_active: false} | 200 user deactivated | P1 | S1 | Yes | — |
| SA-009 | Platform health check | Services running | GET /super-admin/system-health | 200 health report | P2 | S2 | Yes | — |
| SA-010 | Global broadcast | SUPER_ADMIN | POST /super-admin/broadcast | 200 broadcast sent | P2 | S2 | Yes | — |
| SA-011 | Non-SUPER_ADMIN access to super-admin endpoint | ADMIN JWT | GET /super-admin/stats | 403 Forbidden | P1 | S1 | Yes | — |
| SA-012 | License request — process (approve) | Pending license request | POST /super-admin/license-requests/{id}/process {approve: true} | 200 license updated | P2 | S2 | Yes | — |

---

## Module 11 — WebSocket & Real-time

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| WS-001 | Connect — valid token | Valid JWT | WS connect → send {type: "auth", token} | {type: "connected"} message | P1 | S1 | Yes | — |
| WS-002 | Connect — expired token | Expired JWT | WS connect → send auth | Connection closed code 1008 | P1 | S1 | Yes | — |
| WS-003 | Connect — revoked token | Token in denylist | WS connect → send auth | Connection closed 1008 | P1 | S1 | Yes | — |
| WS-004 | Connect — missing auth message | First message is not auth type | WS connect → send garbage | Connection closed 1008 "Authentication required" | P1 | S1 | Yes | — |
| WS-005 | Heartbeat ping/pong | Connected | Client sends "ping" | Server replies {type: "pong"} | P2 | S2 | Yes | — |
| WS-006 | **[BUG-006]** Personal WS message delivery to student | Student connected | Attendance marked (triggers notifier) | Personal notification delivered directly to student's profile_id (Fixed) | P1 | S1 | Yes | BUG-006 (Resolved) |
| WS-007 | Tenant suspension force-close | Tenant suspended via super-admin | PUT suspend tenant | All tenant WS connections closed code 4403 | P1 | S1 | Yes | — |
| WS-008 | Broadcast to role | Admin broadcasts to STUDENT | Broadcast with target_role="STUDENT" | All connected students receive message | P2 | S2 | Yes | — |
| WS-009 | WS connect — suspended tenant | tenant.status=SUSPENDED | WS connect with valid token | Connection closed 4403 "Tenant suspended" | P1 | S1 | Yes | — |

---

## Module 12 — Security, Rate-Limiting & Cross-Cutting

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable | Bug Ref |
|---|---|---|---|---|---|---|---|---|
| SEC-001 | Security headers present | Any request | GET /health | HSTS, X-Frame-Options, X-Content-Type-Options present | P2 | S2 | Yes | — |
| SEC-002 | CORS — allowed origin | Frontend URL matches | GET /api/v1/auth/me from allowed origin | CORS headers present, 200 | P2 | S2 | Yes | — |
| SEC-003 | CORS — disallowed origin | Different origin | GET /api/v1/auth/me from unknown origin | CORS rejected | P1 | S1 | Yes | — |
| SEC-004 | Tenant spoofing — JWT tid ≠ X-Tenant-ID header | Valid JWT with tid=A, header tid=B | Any authenticated request | 403 "Cross-tenant context manipulation detected" | P1 | S1 | Yes | — |
| SEC-005 | Tenant middleware — missing tenant context (prod) | Non-exempt path, no tenant ID | Request without X-Tenant-ID, no subdomain, env=production | 400 "Tenant context missing" | P1 | S1 | Yes | — |
| SEC-006 | **[BUG-015]** Deep subdomain tenant extraction | Host: api.tenant.university.edu | Any request | Tenant slug "tenant" extracted correctly (skipping api prefix) (Fixed) | P2 | S2 | Yes | BUG-015 (Resolved) |
| SEC-007 | Auth rate limit — per IP | Production env | 11 POST /auth/login from same IP | 429 + Retry-After | P1 | S1 | Yes | — |
| SEC-008 | Sliding-window rate limiter logic | Custom limiter | Make requests at boundary | Exactly at limit: allowed; limit+1: blocked | P2 | S2 | Yes | — |
| SEC-009 | **[BUG-017]** Review token — S3 URL encoded in JWT | analyze endpoint | POST /student/attendance/analyze, decode returned review_token | S3 internal URL not present in JWT; review data stored in Redis under review_id (Fixed) | P2 | S2 | Yes | BUG-017 (Resolved) |
| SEC-010 | SUPER_ADMIN bypasses RoleChecker | SUPER_ADMIN token | Access any admin endpoint | 200 allowed | P1 | S1 | Yes | — |
| SEC-011 | STUDENT accessing teacher endpoint | STUDENT JWT | GET /teacher/sessions/all | 403 Forbidden | P1 | S1 | Yes | — |
| SEC-012 | TEACHER accessing admin endpoint | TEACHER JWT | GET /admin/stats | 403 Forbidden | P1 | S1 | Yes | — |
| SEC-013 | Password complexity enforcement | — | POST /auth/reset-password {new_password: "a"} | 422 / 400 complexity error (min 8 chars, 1 uppercase, 1 digit) (Fixed) | P2 | S2 | Yes | — (Resolved) |
| SEC-014 | Account lockout on brute force | Multiple failed logins | 5 consecutive failed logins for same email | 429 Account temporarily locked for 15 minutes (Fixed) | P1 | S1 | Yes | — (Resolved) |
| SEC-015 | Validation error shape | Any malformed request | POST with missing required field | 422 {success:false, error:{code:"VALIDATION_ERROR", details:[]}} | P2 | S2 | Yes | — |
| SEC-016 | Global exception handler | Force an unhandled exception | Trigger 500 | 500 {success:false, error:{code:"INTERNAL_SERVER_ERROR"}} | P2 | S2 | Yes | — |
| SEC-017 | **[BUG-016]** Teacher broadcasts to all students (no tenant scope) | TEACHER JWT | POST /notifications/broadcast {target_role:"STUDENT"} | Broadcast strictly scoped to teacher's tenant; cross-tenant delivery prevented (Fixed) | P2 | S2 | Yes | BUG-016 (Resolved) |

---

## Module 13 — Notifications

| TC-ID | Scenario | Preconditions | Steps | Expected Result | Priority | Severity | Automatable |
|---|---|---|---|---|---|---|---|
| NOTIF-001 | List notifications — paginated | Notifications exist for user | GET /notifications?page=1&page_size=5 | 200 paginated list | P2 | S2 | Yes |
| NOTIF-002 | List notifications — unread only | Mix of read/unread | GET /notifications?unread_only=true | 200 only unread notifications | P2 | S2 | Yes |
| NOTIF-003 | List notifications — by category | Category "attendance" exists | GET /notifications?category=attendance | 200 filtered list | P3 | S3 | Yes |
| NOTIF-004 | Mark notification read | Unread notification owned by user | PATCH /notifications/{id}/read | 200 success | P2 | S2 | Yes |
| NOTIF-005 | Mark notification read — wrong user | Notification owned by user B | PATCH as user A | 404 Not Found | P1 | S1 | Yes |
| NOTIF-006 | Mark all notifications read | User has notifications | PATCH /notifications/mark-all-read | 200 + count | P2 | S2 | Yes |
| NOTIF-007 | Delete single notification | Notification owned by user | DELETE /notifications/{id} | 200 success | P2 | S2 | Yes |
| NOTIF-008 | Bulk delete notifications | Multiple owned notifications | POST /notifications/bulk-delete {ids: []} | 200 + count | P2 | S2 | Yes |
| NOTIF-009 | Clear all notifications | User has notifications | DELETE /notifications/all | 200 + count | P2 | S3 | Yes |
| NOTIF-010 | Admin broadcasts to STUDENT role | ADMIN JWT, students connected | POST /notifications/broadcast | 200 + WS message to students | P2 | S2 | Yes |
| NOTIF-011 | FCM token registration | Student logged in | POST /student/fcm-token {token: "FCM_TOKEN"} | 200 + token saved | P2 | S2 | Yes |

---

## Module 14 — Mobile App (Flutter)

| TC-ID | Scenario | Platform | Steps | Expected Result | Priority | Severity | Automatable |
|---|---|---|---|---|---|---|---|
| MOB-001 | Login flow — valid credentials | iOS / Android | Enter credentials, tap Login | JWT stored in Hive, navigate to home | P1 | S1 | No |
| MOB-002 | Login flow — wrong password | iOS / Android | Enter wrong password | Error message displayed | P1 | S1 | No |
| MOB-003 | Login — device UUID sent automatically | iOS / Android | Login (first time) | Device UUID from platform included in request | P1 | S1 | No |
| MOB-004 | Attendance marking — camera permission denied | iOS / Android | Deny camera, attempt attendance | Clear permission denied message, not crash | P1 | S1 | No |
| MOB-005 | Attendance marking — GPS permission denied | iOS / Android | Deny location, attempt attendance | Clear permission denied message | P1 | S1 | No |
| MOB-006 | Attendance marking — success flow | All permissions granted, valid session | Mark attendance | Success + UI confirmation | P1 | S1 | No |
| MOB-007 | Offline attendance queue | No internet | Mark attendance offline | Queued in Hive, synced when online | P1 | S1 | No |
| MOB-008 | Offline sync — background Workmanager | App backgrounded | Wait 15 min or trigger task | Queue synced to server | P2 | S2 | No |
| MOB-009 | Network restore — sync on reconnect | Was offline, now online | Restore network | Queued items sync automatically | P1 | S1 | No |
| MOB-010 | App lifecycle — app backgrounded mid-session | Active session | Background app, return | Session state preserved | P2 | S2 | No |
| MOB-011 | Smart Pass QR — 30s expiry visible | Student logged in | Open Smart Pass | Timer countdown visible; QR refreshes | P2 | S2 | No |
| MOB-012 | Push notification — foreground | App foreground | Server sends FCM message | In-app notification displayed | P2 | S2 | No |
| MOB-013 | Push notification — background | App backgrounded | Server sends FCM message | System notification displayed | P2 | S2 | No |
| MOB-014 | Session expired — re-login prompt | JWT expired | Open app | Redirected to login | P1 | S1 | No |
| MOB-015 | Leave request submission with document | Image file selected | Submit leave + document | 201 + document_url in response | P2 | S2 | No |
| MOB-016 | Dark/light mode — UI readability | Toggle theme | Navigate through app | No text contrast issues | P3 | S4 | No |

---

## Summary Statistics

| Module | Total TCs | P1 | P2 | P3 | Automatable |
|---|---|---|---|---|---|
| Authentication | 32 | 20 | 9 | 3 | 30 |
| Student Attendance | 23 | 14 | 9 | — | 20 |
| Face Registration | 11 | 6 | 5 | — | 9 |
| Leave Management | 16 | 8 | 7 | 1 | 15 |
| Smart Pass | 8 | 6 | 2 | — | 7 |
| Teacher Sessions | 17 | 10 | 7 | — | 17 |
| Device Change | 8 | 6 | 2 | — | 8 |
| Gamification | 13 | 7 | 5 | 1 | 12 |
| Admin Operations | 17 | 8 | 9 | — | 17 |
| Super Admin | 12 | 8 | 4 | — | 12 |
| WebSocket | 9 | 7 | 2 | — | 9 |
| Security/Rate-limit | 17 | 10 | 7 | — | 17 |
| Notifications | 11 | 2 | 7 | 2 | 11 |
| Mobile | 16 | 8 | 6 | 2 | 0 |
| **TOTAL** | **210** | **120** | **81** | **9** | **184** |

> ⚠ **Status column omitted from table display for brevity — all cases are ⬜ Not Run.**
> All test cases referencing BUG-NNN correspond directly to the findings in the [Audit Report](qa_audit_report.md).
