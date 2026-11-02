# 🤝 Contributing to SAHAJ

Thank you for contributing to SAHAJ! This guide ensures consistency, quality, and smooth collaboration.

---

## 📋 Before You Start

1. **Read the essentials:**
   - `CLAUDE.md` (§1-§2) — Hard rules & invariants
   - `docs/PRD.md` (§5 & §6) — Data model & business rules
   - `AGENTS.md` (§1) — Responsive design rules
   - `WORKSPACE_GUIDE.md` — Architecture & navigation

2. **Understand the code:**
   - Backend: `backend/README.md`
   - Frontend: `frontend/README.md`
   - Mobile: `mobile/README.md`

3. **Setup locally:**
   ```bash
   npm run setup
   npm run dev
   npm run test
   ```

---

## 🎯 Development Workflow

### 1. Create a Feature Branch

```bash
# Always branch from `dev`
git checkout dev
git pull origin dev
git checkout -b feat/your-feature

# Naming convention:
# feat(scope): short description
# Examples:
# feat(attendance): add geofence validation
# fix(auth): resolve token refresh race condition
# docs(setup): add quickstart guide
```

### 2. Make Changes

**Smallest Correct Change:**
- Solve the stated problem only
- No speculative refactors or cleanups
- Three similar lines beat a premature abstraction
- Match the style of neighboring code

**File Structure Rules:**
- ✅ Backend/Frontend files under 200 lines
- ✅ One responsibility per file
- ✅ Use Edit/Write tools for code changes (not sed/echo)
- ✅ No hardcoded secrets or config

**Tenant Isolation Checklist** (if touching data):
- ✅ All queries filter by `tenantId`
- ✅ New tables have `tenantId NOT NULL`
- ✅ Services take `tenant_id` as first arg
- ✅ Tests verify isolation (mock per tenant)

### 3. Test Your Changes

```bash
# Run narrowest applicable tests
npm run test:backend    # If backend changed
npm run test:frontend   # If frontend changed

# Type check & lint
npm run type-check
npm run lint

# For UI changes, start dev server & test in browser
npm run dev:frontend    # Then visit http://localhost:3000
# Use Reticle or manual browser testing for critical flows
```

### 4. Commit

```bash
# Stage specific files (don't use git add -A)
git add backend/app/services/my_service.py

# Review what you're committing
git diff --staged

# Commit with clear message
git commit -m "feat(attendance): add geofence validation

- Validates student GPS against teacher-set geofence
- Fails closed: missing GPS is UNVERIFIED, not PRESENT
- Added tests for boundary conditions"

# Conventional Commit Format:
# type(scope): short summary
# 
# Detailed explanation of why this change is needed.
# Reference PRD sections if applicable.
# 
# Types: feat, fix, docs, style, refactor, test, chore
```

**Commit Message Guidelines:**
- ✅ First line: `type(scope): summary` (under 70 chars)
- ✅ Blank line, then body (detailed explanation)
- ✅ Reference PRD sections (e.g., "PRD §6.2")
- ✅ Explain WHY, not WHAT (code shows what)
- ❌ No "WIP" or "temp" commits on shared branches

### 5. Push & Create PR

```bash
git push -u origin feat/your-feature
```

Then on GitHub:
1. Create a Pull Request from your branch to `dev`
2. Fill PR template:
   - **Summary:** 2-3 bullet points
   - **Test Plan:** How to verify the changes
   - **Refs:** Issues/PRD sections affected

**PR Guidelines:**
- ✅ Focused scope (one feature/fix per PR)
- ✅ Tests for new logic
- ✅ Before/after for UI changes (Reticle screenshots)
- ✅ All CI checks passing
- ❌ Never merge to `main` (release branch only)

---

## 🚨 Common Mistakes to Avoid

### ❌ Tenant Isolation Violations
```python
# BAD: Not filtering by tenant
students = await db.student.find_many()

# GOOD: Filter by tenant
students = await db.student.find_many(
    where={"tenantId": tenant_id}
)
```

### ❌ Hardcoded Secrets
```typescript
// BAD: Secret in code
const API_KEY = "sk-12345";

// GOOD: Use environment variables
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
```

### ❌ Unverified Biometric Data
```python
# BAD: Assume high confidence
if face_score > 0.5:  # Too low!
    mark_present()

# GOOD: Use proper thresholds (PRD §6.4)
FACE_THRESHOLD = 0.85
if face_score >= FACE_THRESHOLD:
    # Also check liveness + background
```

### ❌ Mutations Without Audit Logs
```python
# BAD: Attendance changed with no record
attendance.mark = "PRESENT"
await db.save()

# GOOD: Create audit trail
await mark_attendance(tenant_id, student_id, ...)
# Service automatically logs via audit_log
```

### ❌ Breaking Changes Without Migration
```python
# BAD: Removed column without migration
# Existing code breaks immediately

# GOOD: Add migration, then deprecate, then remove
prisma migrate dev --name drop_old_column
```

### ❌ Inconsistent Error Handling
```typescript
// BAD: Silent failures
try {
  await api.post(...)
} catch {
  // Silently ignored!
}

// GOOD: Notify user or propagate
try {
  await api.post(...)
} catch (error) {
  showNotification("Error uploading file");
  logger.error("Upload failed:", error);
}
```

---

## 📝 Code Quality Checklist

Before submitting a PR, verify:

### Correctness
- [ ] Business logic matches PRD
- [ ] All test cases pass (edge cases included)
- [ ] No infinite loops or race conditions
- [ ] Tenant isolation enforced

### Type Safety
- [ ] No `any` in TypeScript
- [ ] No `@ts-ignore` comments
- [ ] Python types pass mypy
- [ ] Dart analyzer clean

### Performance
- [ ] No N+1 database queries
- [ ] API responses under 1s
- [ ] No large computations on UI thread
- [ ] Pagination for large lists

### Security
- [ ] No secrets in code
- [ ] SQL injection prevented (use ORM)
- [ ] XSS protection in React (use JSX, not innerHTML)
- [ ] CSRF tokens for state-changing requests
- [ ] Rate limiting on auth endpoints

### Testing
- [ ] Unit tests for business logic
- [ ] Edge cases covered
- [ ] Test data per tenant (isolation verified)
- [ ] Tests pass locally before push

### Documentation
- [ ] Code comments for non-obvious logic only
- [ ] Docstrings for public functions
- [ ] Updated README if architecture changed
- [ ] Referenced PRD/CLAUDE.md where applicable

### Style & Cleanliness
- [ ] Code matches neighboring style
- [ ] No debug `console.log` / `print()` / `println!()`
- [ ] No commented-out code
- [ ] Unused imports removed
- [ ] Files under 200 lines
- [ ] No trailing whitespace

---

## 🐛 Bug Reports

Found a bug? Create an issue with:

1. **Clear title:** "Login fails with special characters in password"
2. **Reproduction steps:**
   - Environment (dev/staging/prod)
   - Exact steps to reproduce
   - Expected vs actual behavior
3. **Logs & screenshots:**
   - Error messages from browser console
   - Backend logs if available
   - Screenshots for UI issues
4. **PRD reference:** Link to relevant section if applicable

Example:
```
**Title:** Attendance mark fails after lock window closes

**Steps:**
1. Teacher locks class at 2:00 PM
2. Student attempts to mark attendance at 2:05 PM
3. Student sees "Attendance Closed" error

**Expected:** Should work within lock window or show clear grace period

**Actual:** Fails immediately after lock time

**Logs:** [paste error from console]
**Refs:** PRD §6.3 (lock windows)
```

---

## 🔄 Code Review Process

When your PR is reviewed:

1. **Address feedback:** Collaborate with reviewer
   - ✅ "Good catch, fixing now"
   - ❌ Don't dismiss without discussion
2. **Commit fixes:** Create new commits (don't amend)
3. **Re-request review:** Mark as ready
4. **Merge to dev:** After approval

---

## 🚀 Deployment Process

When releasing to production:

1. **Create release PR:** `dev` → `main`
2. **Bump version:** Update `package.json` version
3. **Update CHANGELOG:** List major changes
4. **Merge & tag:** Create git tag (v1.2.3)
5. **Deploy:** Automated CI/CD via `.github/workflows/`

See `docs/deployment-guide.md` for details.

---

## 📚 Learning Resources

### Project-Specific
- `WORKSPACE_GUIDE.md` — Architecture & navigation
- `CLAUDE.md` — Development rules
- `docs/ARCHITECTURE.md` — System architecture

### Technology Docs
- [FastAPI](https://fastapi.tiangolo.com/)
- [Prisma](https://www.prisma.io/docs)
- [Next.js](https://nextjs.org/docs)
- [React 19](https://react.dev/)
- [Flutter](https://flutter.dev/docs)
- [PostgreSQL](https://www.postgresql.org/docs)

### Code Search
```bash
# Find code by keyword
grep -rn "enrollment_sync" backend/
grep -rn "AttendanceRecord" backend/
```

---

## 🤔 Got Questions?

1. **Requirements unclear?** → Read `docs/PRD.md` (§13 has open questions)
2. **Code patterns?** → Check neighboring code or ask in PR discussion
3. **Architecture?** → Read `docs/ARCHITECTURE.md` or `WORKSPACE_GUIDE.md`
4. **Rules?** → Check `CLAUDE.md` (§2 has hard rules)

---

## 🎉 Thank You!

Your contributions make SAHAJ better for thousands of students and teachers. We appreciate your attention to detail, testing rigor, and thoughtful code!

**Happy contributing! 🚀**
