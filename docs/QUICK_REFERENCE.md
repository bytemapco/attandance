# ⚡ SAHAJ Quick Reference Guide

**Cheat sheet for developers** — Bookmark this!

---

## 🚀 Getting Started (First 5 Minutes)

```bash
# 1. Clone & setup
git clone <repo>
cd "Smart Attandance System"
npm run setup
npm run dev

# Now open:
# - http://localhost:8000/docs (Backend Swagger)
# - http://localhost:3000 (Frontend)
# - http://localhost:5555 (Prisma Studio, if running)
```

---

## 📂 File Locations (Where to Find What)

| Need | Location | Command |
|------|----------|---------|
| **Product rules** | `docs/PRD.md` | `cat docs/PRD.md` |
| **Dev rules** | `CLAUDE.md` | Read § 1-3 |
| **UI rules** | `AGENTS.md` | Read § 1 |
| **Architecture** | `ARCHITECTURE.md` | Full system design |
| **API endpoints** | `backend/app/api/` | List files |
| **Database schema** | `backend/prisma/schema.prisma` | View schema |
| **Backend services** | `backend/app/services/` | Business logic |
| **Frontend routes** | `frontend/src/app/` | Page routing |
| **UI components** | `frontend/src/components/` | Reusable UI |
| **Tests (backend)** | `backend/tests/` | Pytest suite |
| **Tests (frontend)** | `frontend/src/tests/` | Vitest suite |
| **Config** | `.env`, `.env.prod`, `.env.example` | Env vars |

---

## 🔍 Code Search

```bash
# Search by keyword
graphify query "attendance marking"

# Find relationships
graphify path "Student" "AttendanceRecord"

# Explain concept
graphify explain "tenant isolation"

# Or use grep
grep -r "function_name" backend/app/services/
grep -r "ComponentName" frontend/src/components/
```

---

## 📝 Common Tasks

### Creating a New API Endpoint

1. **Check PRD** → `docs/PRD.md` (is this feature in scope?)
2. **Add router** → `backend/app/api/[role].py`
3. **Add service** → `backend/app/services/[domain]/`
4. **Update schema** (if needed) → `backend/prisma/schema.prisma`
5. **Write tests** → `backend/tests/test_[domain].py`
6. **Update frontend** → `frontend/src/lib/api.ts` (client)

### Creating a New Page (Frontend)

1. **Create route** → `frontend/src/app/(dashboard)/[path]/page.tsx`
2. **Create component** → `frontend/src/components/[domain]/`
3. **Create form** (if needed) → `frontend/src/components/forms/`
4. **Update API client** → `frontend/src/lib/api.ts`
5. **Write tests** → `frontend/src/tests/components/`
6. **Test in browser** → `npm run dev:frontend`

### Adding a Database Table

1. **Update schema** → `backend/prisma/schema.prisma`
2. **Add tenantId if tenant-scoped** → `tenantId String @db.Uuid` (NOT NULL)
3. **Create migration** → `cd backend && prisma migrate dev --name <desc>`
4. **Update service** → Add query helpers
5. **Write tests** → Mock the new table
6. **Seed dev data** → Update `backend/prisma/seed.py`

### Fixing a Bug

1. **Understand issue** → Read error logs
2. **Locate code** → Use `graphify query` or `grep`
3. **Write failing test** → `backend/tests/test_[domain].py`
4. **Fix code** → Make test pass
5. **Verify fix** → Run full test suite
6. **Commit** → `git commit -m "fix(scope): description"`

### Making a UI Change

1. **Understand requirement** → Check `docs/PRD.md`
2. **Check branding** → `docs/sahaj_brand_kit.md`
3. **Review responsive rules** → `AGENTS.md` (§1)
4. **Modify component** → `frontend/src/components/[domain]/`
5. **Start dev server** → `npm run dev:frontend`
6. **Test in browser** → Visit `http://localhost:3000`
7. **Test responsive** → Resize browser / use mobile emulator
8. **Commit** → `git commit -m "feat(scope): description"`

---

## 🧪 Testing Cheat Sheet

```bash
# Backend tests
cd backend
.venv/bin/pytest tests/ -v              # Run all
pytest tests/test_auth.py -v            # Single file
pytest tests/test_auth.py::test_login -v # Single test
pytest --cov=app tests/                 # With coverage
ptw tests/                               # Watch mode

# Frontend tests
cd frontend
npm test                  # Run all
npm test hooks/use-api    # Single module
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage

# Full suite (root)
npm run test             # Backend + frontend
npm run type-check      # TypeScript
npm run lint            # Linting
```

---

## 🔐 Tenant Isolation Checklist

Before committing any code touching data:

- [ ] All queries filter by `tenantId`
- [ ] New tables have `tenantId NOT NULL`
- [ ] Services take `tenant_id` as first arg
- [ ] Foreign keys verified in tenant
- [ ] Tests verify isolation (mock per tenant)

---

## 📊 Database Commands

```bash
# Explore database
cd backend
prisma studio  # GUI explorer (http://localhost:5555)

# Create migration
prisma migrate dev --name <description>

# Apply migrations (prod)
prisma migrate deploy

# Rollback (dev only)
prisma migrate resolve --rolled-back <name>

# Seed dev data
python prisma/seed.py

# View schema
cat prisma/schema.prisma
```

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout dev
git pull origin dev
git checkout -b feat/your-feature

# Make changes & commit
git add [files]
git commit -m "feat(scope): description"

# Push & create PR
git push -u origin feat/your-feature
# Then create PR on GitHub (dev ← feat/...)

# Merge (after review)
# PR merged by reviewer → delete branch
git checkout dev
git pull origin dev
git branch -d feat/your-feature
```

---

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError` | Missing import | `pip install -r requirements.txt` |
| `JSONDecodeError` | Invalid JSON response | Check backend is running: `http://localhost:8000/docs` |
| `PrismaError: Unknown column` | Schema mismatch | `prisma migrate deploy` |
| `TypeError: Cannot read property 'x' of undefined` | Missing tenant_id in query | Add `where: { tenantId: tenant_id }` |
| `RenderFlex overflowed by X pixels` | Flutter layout issue | Wrap in `SingleChildScrollView` + `SafeArea` |
| `401 Unauthorized` | Expired token | Refresh token or re-login |

---

## 🎯 Architecture at a Glance

```
CLIENT LAYER
  ├─ Mobile (Flutter): screens + providers
  └─ Web (Next.js): pages + components

HTTP / REST API
  ↓
API LAYER (FastAPI)
  ├─ auth.py, admin.py, teacher.py, student.py
  └─ Input validation (Pydantic)

SERVICE LAYER (Python)
  ├─ biometric/, attendance/, class_management/
  └─ Business logic (tenant_id first param)

DATABASE LAYER
  ├─ Prisma ORM (schema.prisma)
  ├─ PostgreSQL (pgvector for embeddings)
  └─ Redis (cache, tokens)
```

---

## 💡 Important Principles

| Principle | Why | How |
|-----------|-----|-----|
| **Tenant Isolation** | Security | Filter all queries by `tenantId` |
| **Fail Closed** | Safety | Missing data = UNVERIFIED, not PRESENT |
| **Audit Everything** | Compliance | Log every mutation |
| **Idempotent Ops** | Resilience | Retries return same result |
| **Smallest Change** | Clarity | Solve stated problem only |
| **Test First** | Correctness | Write failing test, then fix |
| **Type Safety** | Reliability | No `any` in TypeScript, typed Python |

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| **Swagger API Docs** | http://localhost:8000/docs |
| **Prisma Studio** | http://localhost:5555 |
| **Frontend Dev** | http://localhost:3000 |
| **FastAPI Docs** | https://fastapi.tiangolo.com/ |
| **Next.js Docs** | https://nextjs.org/docs |
| **Prisma Docs** | https://www.prisma.io/docs |
| **React Docs** | https://react.dev/ |
| **Flutter Docs** | https://flutter.dev/docs |

---

## 📋 PRD Quick Reference

| Section | Contains |
|---------|----------|
| §5 | Data model (must read!) |
| §6 | Verification pipeline & rules |
| §8 | Privacy & compliance |
| §10 | Feature phasing (what's in/out) |
| §13 | Open questions (ask before assuming) |

---

## 🚀 Before You Commit

```bash
# 1. Run tests (narrowest applicable)
npm run test:backend    # Backend changes
npm run test:frontend   # Frontend changes

# 2. Type check & lint
npm run type-check
npm run lint

# 3. Update graph if architecture changed
graphify update .

# 4. Verify no secrets in code
grep -r "password\|api_key\|secret" [files you changed]

# 5. Commit with clear message
git commit -m "type(scope): description"
```

---

## 🆘 Need Help?

1. **Quick question?** → Check CLAUDE.md §2 (rules)
2. **Architecture?** → Read ARCHITECTURE.md
3. **API endpoints?** → Visit http://localhost:8000/docs
4. **Code patterns?** → Look at similar code in the repo
5. **Requirements?** → Check docs/PRD.md (§13 has open questions)
6. **Can't find code?** → `graphify query "<keyword>"`

---

**Happy coding! 🎉**

Last updated: 2026-10-31
