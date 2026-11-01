# 📚 SAHAJ Workspace Organization Guide

**Last Updated:** 2026-10-31  
**Project:** SAHAJ  
**Status:** Production Multi-Tenant SaaS

---

## 🎯 Quick Navigation

### 📖 Documentation
- **[PRD.md](docs/PRD.md)** — Product requirements, data model, compliance rules
- **[SUMMARY.md](SUMMARY.md)** — Class management feature implementation details
- **[CLAUDE.md](CLAUDE.md)** — Development rules, invariants, skills map
- **[AGENTS.md](AGENTS.md)** — UI/UX engineering rules
- **[Brand Kit](docs/sahaj_brand_kit.md)** — Visual identity, colors, typography

### 💻 Code Locations
| Component | Path | Technology | Entry Point |
|-----------|------|------------|--------------|
| **Backend API** | `backend/` | FastAPI 0.115.6 + Prisma | `backend/main.py` |
| **Web Dashboard** | `frontend/` | Next.js 16 + React 19 | `frontend/src/app` |
| **Mobile App** | `mobile/` | Flutter 3.8+ | `mobile/lib/main.dart` |
| **Database** | `backend/prisma/` | PostgreSQL 15+ | `schema.prisma` |

---

## 📁 Directory Structure Explained

```
SAHAJ/
│
├── 📋 ROOT DOCUMENTATION
│   ├── README.md              → Project overview & features
│   ├── CLAUDE.md              → Development guidelines (MUST READ)
│   ├── AGENTS.md              → UI/UX rules
│   ├── SUMMARY.md             → Feature implementation docs
│   └── WORKSPACE_GUIDE.md     → This file
│
├── 📚 docs/                   → Product & deployment docs
│   ├── PRD.md                 → Product requirements (source of truth)
│   ├── sahaj_brand_kit.md     → Unified brand & product design system
│   ├── devops-ci-cd.md        → CI/CD pipeline & infrastructure
│   ├── deployment-guide.md    → Production deployment steps
│   └── qa_audit_report.md     → QA findings & test coverage
│
├── 🔧 backend/                → FastAPI Python Backend
│   ├── main.py                → Application entrypoint
│   ├── app/
│   │   ├── api/               → Endpoint routers (auth, admin, teacher, student)
│   │   ├── core/              → Security, JWT, encryption, config
│   │   ├── services/          → Business logic (attendance, biometric, class mgmt)
│   │   ├── db/                → Prisma ORM client & session
│   │   └── middleware/        → RBAC, error handling
│   ├── prisma/
│   │   ├── schema.prisma      → Database schema (source of truth)
│   │   ├── migrations/        → Alembic-style versioned migrations
│   │   └── seed.py            → Fixture data for dev/test
│   ├── tests/                 → Pytest unit tests (73 tests)
│   ├── models/                → TensorFlow/ML models
│   ├── scripts/               → One-off utilities & data tools
│   └── README.md              → Backend quickstart
│
├── 🎨 frontend/               → Next.js 16 Web Dashboard
│   ├── src/
│   │   ├── app/               → Next.js App Router routes
│   │   │   ├── (dashboard)/   → Protected routes (admin, teacher)
│   │   │   ├── (auth)/        → Public login/signup
│   │   │   └── api/           → Route handlers & API proxies
│   │   ├── components/        → Reusable UI components (Glass design system)
│   │   ├── hooks/             → Custom React hooks
│   │   ├── lib/               → API clients, validators (Zod schemas)
│   │   ├── store/             → Zustand state management
│   │   ├── tests/             → Vitest unit tests (31 tests)
│   │   └── app.css            → Global styles
│   ├── public/                → Static assets
│   ├── vitest.config.ts       → Test runner config
│   ├── tailwind.config.ts     → Tailwind CSS config
│   ├── tsconfig.json          → TypeScript strict settings
│   └── README.md              → Frontend quickstart
│
├── 📱 mobile/                 → Flutter 3.8+ Student App
│   ├── lib/
│   │   ├── main.dart          → App entrypoint
│   │   ├── screens/           → Screen pages (login, mark attendance, etc)
│   │   ├── providers/         → Riverpod state management
│   │   ├── services/          → API & device services
│   │   ├── models/            → Data classes & DTOs
│   │   ├── widgets/           → Reusable UI components
│   │   ├── utils/             → Helpers & constants
│   │   └── theme/             → Design tokens & colors
│   ├── test/                  → Flutter unit & widget tests
│   ├── android/               → Android native config
│   ├── ios/                   → iOS native config
│   ├── pubspec.yaml           → Flutter dependencies
│   ├── guide.md               → Development guide
│   └── README.md              → Mobile quickstart
│
├── 🎯 scripts/                → Workspace utilities
│   ├── cli/                   → NPM CLI runners (dev, test, build)
│   └── README.md              → Script documentation
│
├── 🎨 assets/                 → Brand assets
│   └── brand/                 → Logos, colors, guidelines
│
├── 🏗️ graphify-out/           → Code structure analysis (AI-generated)
│   ├── GRAPH_REPORT.md        → Architecture & dependency graphs
│   ├── wiki/                  → Indexed knowledge base
│   └── cache/                 → LLM analysis cache
│
├── .github/                   → GitHub Actions CI/CD
│   └── workflows/
│       └── ci.yml             → Test & build pipeline
│
├── .claude/                   → Claude Code configuration
│   ├── CLAUDE.md              → Project-specific rules (checked in)
│   ├── rules/                 → Development guidelines
│   └── skills/                → Custom agent instructions
│
└── .env, .env.example         → Environment config (DO NOT COMMIT SECRETS)
```

---

## 🚀 Common Tasks & Where to Look

### Feature Development
1. **Understand requirements** → `docs/PRD.md` §5 (data model) & §6 (rules)
2. **Check invariants** → `CLAUDE.md` §3 (domain rules)
3. **Locate relevant code** → Search by module in backend/frontend above
4. **Verify with tests** → Run narrowest applicable test suite (see §5 in CLAUDE.md)

### Bug Investigation
1. **Read error** → Check `docs/devops-ci-cd.md` for logging/monitoring
2. **Locate source** → `graphify query "<error/keyword>"` for code search
3. **Write failing test** → Add to `backend/tests/` or `frontend/src/tests/`
4. **Fix & verify** → Run `npm run test:backend` or `npm run test:frontend`

### API Changes
1. **Check endpoint** → `backend/app/api/` routers
2. **Verify schema** → `backend/prisma/schema.prisma`
3. **Update frontend** → `frontend/src/lib/api.ts` clients
4. **Test coverage** → Backend tests + frontend integration tests

### Database Changes
1. **Update schema** → `backend/prisma/schema.prisma`
2. **Create migration** → Prisma CLI generates versioned migrations
3. **Sync tenant context** → Ensure `tenantId NOT NULL` + query filters
4. **Run fixtures** → `backend/prisma/seed.py` for test data

### UI Changes (Web)
1. **Design review** → Check `docs/sahaj_brand_kit.md`
2. **Component location** → `frontend/src/components/` (Glass design system)
3. **Route location** → `frontend/src/app/(dashboard)/` for protected views
4. **Test in browser** → `npm run dev:frontend` + Reticle or manual browser test

### UI Changes (Mobile)
1. **Design review** → Check `docs/sahaj_brand_kit.md`
2. **Screen location** → `mobile/lib/screens/`
3. **Theme tokens** → `mobile/lib/theme/app_theme.dart`
4. **Responsive rules** → See `AGENTS.md` (mandatory on all screens)

---

## 📊 Project Structure Insights

### Backend Layers

**API Layer** (`app/api/`)
- Routers by role: `auth.py`, `admin.py`, `teacher.py`, `student.py`, `common.py`
- Handles request validation, auth checks, response formatting
- Delegates business logic to services

**Service Layer** (`app/services/`)
- Pure business logic (no FastAPI/HTTP dependencies)
- Examples: `attendance_marking.py`, `biometric_verification.py`, `class_management/`
- Takes `tenant_id` as first argument for isolation
- Unit-testable without HTTP/DB mocks

**Database Layer** (`app/db/`, `prisma/`)
- Prisma ORM client manages all queries
- Schema is source of truth for data model
- Migrations are versioned and reversible
- Seed scripts populate dev/test fixtures

**Security** (`app/core/`)
- JWT generation/validation
- Password hashing (Argon2/Bcrypt)
- Encryption for sensitive payloads
- RBAC middleware enforces role checks

### Frontend Layers

**App Router** (`src/app/`)
- Next.js 16 App Router (not Pages Router)
- `(auth)` layout → public login/signup
- `(dashboard)` layout → protected admin/teacher routes
- API route handlers for proxies & webhooks

**Components** (`src/components/`)
- Glass design system (Tailwind + Radix UI)
- Modular, single-responsibility components
- No hardcoded domain logic
- Storybook-ready for visual testing

**State** (`src/store/`)
- Zustand stores (auth, theme, UI state)
- Not for API data (use React Query instead)
- Persisted to localStorage where needed

**API Client** (`src/lib/api.ts`)
- Axios/Fetch wrappers for backend endpoints
- Typed with TypeScript + Zod validation
- Handles auth token injection & refresh

### Mobile Layers

**Screens** (`lib/screens/`)
- Full-page Flutter widgets (stateful)
- Manage local navigation & composition
- Use Riverpod providers for state

**Providers** (`lib/providers/`)
- Riverpod state management
- API calls, authentication, permission states
- Cached & memoized across widget tree

**Services** (`lib/services/`)
- Device binding, biometric capture
- API communication (Dio HTTP client)
- Offline data persistence (Hive local DB)

---

## 🧪 Testing Quick Reference

### Backend Tests
```bash
# All tests
cd backend && .venv/bin/pytest tests/ -v

# Specific module
pytest tests/test_attendance.py -v

# With coverage
pytest --cov=app tests/
```

### Frontend Tests
```bash
# All tests
cd frontend && npm test

# Watch mode
npm run test -- --watch

# With coverage
npm run test -- --coverage
```

### Run All Tests (Root)
```bash
npm run test  # Backend + Frontend concurrently
```

---

## 🔄 Development Workflow

### Starting Development
```bash
# 1. Setup (one-time)
npm run setup

# 2. Start dev servers
npm run dev          # All services
# or individually:
npm run dev:backend  # http://localhost:8000
npm run dev:frontend # http://localhost:3000
```

### Before Committing
```bash
# Lint & type-check
npm run lint         # All areas
npm run type-check   # TypeScript & strict Python

# Run tests for area you modified
npm run test:backend    # If backend changed
npm run test:frontend   # If frontend changed

# Update code graph (if architecture changed)
graphify update .
```

### Creating a Commit
```bash
git add [files]
git commit -m "type(scope): description"
# Examples:
# feat(auth): add multi-factor authentication
# fix(attendance): correct timezone bug in marking
# docs(prescheduling): update feature overview
```

---

## 🏛️ Domain Concepts

### Core Data Model
- **Tenant** → Isolated organization
- **Student** → Belongs to Tenant + Batch (via StudentGroup)
- **ClassSection** → Subject + semester combination
- **TimetableRule** → Occurrence pattern (mon/wed/fri at 9am)
- **ClassOccurrence** → Scheduled single class instance
- **AttendanceRecord** → Student marked ✓/✗ + verification scores
- **AttendanceAuditLog** → Mutation trail (who changed what, when, why)

### Verification Pipeline (§6 PRD)
1. **Liveness Check** → MobileNetV2 detects replay attacks
2. **Face Embedding** → FaceNet 128-D vector vs PostgreSQL pgvector index
3. **Background Context** → MobileNetV1 validates classroom
4. **Geofence** → Haversine distance check vs lecture hall
5. **Device Binding** → Hardware UUID matches enrolled device
6. **Rule Enforcement** → Attendance % thresholds, lock windows (per tenant)

### Isolation & Multi-Tenancy
- Every table with tenant-scoped data has `tenantId NOT NULL`
- Every query filters by `tenantId` (use `get_tenant_context()`)
- Foreign keys checked in tenant before operations
- Tests verify isolation (mock data per tenant)

---

## 📞 Support & References

### Getting Help
- **PRD Questions** → `docs/PRD.md` (source of truth)
- **Dev Rules** → `CLAUDE.md` (checked in project)
- **UI Rules** → `AGENTS.md` (responsive, typography, quality)
- **Code Search** → `graphify query "<keyword>"` (AI-powered graph search)
- **Architecture** → `graphify-out/GRAPH_REPORT.md` (dependency analysis)

### External Links
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Flutter Docs](https://flutter.dev/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### CI/CD & Deployment
- **Pipeline Config** → `.github/workflows/ci.yml`
- **Deployment Steps** → `docs/deployment-guide.md`
- **Infrastructure** → `docs/devops-ci-cd.md`

---

## ✅ Checklist for New Contributors

- [ ] Read `CLAUDE.md` (§1 & §2 — essential rules)
- [ ] Read `docs/PRD.md` (at least §5 & §6)
- [ ] Read `AGENTS.md` (§1 — responsive design rules)
- [ ] Run `npm run setup` (local environment)
- [ ] Run `npm run dev` (verify all services start)
- [ ] Run `npm run test` (verify test suite passes)
- [ ] Create a branch from `dev` (main is stable releases)
- [ ] Make changes following patterns in neighboring code
- [ ] Write tests for new logic
- [ ] Run linters & type-checks before pushing
- [ ] Submit PR with description referencing PRD sections

---

**Happy coding! 🚀**
