# SAHAJ backend

FastAPI + Prisma (Python client) + PostgreSQL/pgvector + Redis. Entry point: `main.py`. Interactive API docs: `http://localhost:8000/docs`.

## How a request flows

```
request → middleware (request log, security headers, tenant) → route (app/api) → service (app/services) → Prisma (app/db) / Redis
```

- **Tenant middleware** binds one institution to the request from the signed token, then the `X-Tenant-ID` header, then the subdomain. Every tenant-scoped query filters by `tenantId`.
- **Routes** only parse the request, pick the dependency (`get_current_user`, `get_tenant_context`) and call one service.
- **Services** hold the business rules. A `ValueError` from a service becomes an HTTP error through `@value_error_as` in `app/api/errors.py`.
- **Attendance** runs on `CourseSection → TimetableRule → ClassOccurrence → AttendanceRecord`. Every mutation is audited.

## Folder map

```
backend/
├── main.py                 app factory, router registration, error envelope
├── app/
│   ├── api/                routes
│   │   ├── admin/          departments, students, teachers, subjects, classes, batches, licences, setup
│   │   ├── student/        marking, profile, subjects, leaves, gamification
│   │   ├── teacher/        teacher workflows
│   │   ├── auth.py  sso.py  reports.py  search.py  scim.py  websocket.py  super_admin.py ...
│   │   ├── dependencies.py auth + tenant dependencies
│   │   └── errors.py       ValueError → HTTPException decorator
│   ├── core/               config, security (JWT), client IP, tenancy constants, rate limit
│   ├── db/                 Prisma client and Redis helpers
│   ├── middleware/         tenant resolution, request logging, security headers
│   ├── repositories/       small data-access helpers (users, students, teachers, leave, config)
│   ├── schemas/            Pydantic request and response models
│   ├── services/
│   │   ├── admin/          student and teacher accounts, bulk import, master data
│   │   ├── class_management/  classes, members, sections, schedules, enrolment sync
│   │   ├── reports/        shortage, lecture register and subject summary reports
│   │   ├── attendance/     face registration
│   │   ├── search/         role-scoped search
│   │   ├── super_admin/    institution provisioning
│   │   └── auth_service.py token_revocation.py tenant_resolver.py connection_manager.py ...
│   ├── templates/          e-mail templates
│   └── utils/              geofencing helpers
├── models/                 face liveness and background-check model files
├── prisma/                 schema.prisma and SQL migrations
├── scripts/                create_super_admin, wipe_data, reset_database, run_migrations, check_services, check_ai_device
└── tests/                  pytest suite (mocked Prisma client)
```

## Run it

Needs Python 3.11+, PostgreSQL 15+ with `pgvector`, and Redis 7+.

```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env                    # then fill in the values
env -i HOME=$HOME PATH=$PWD/.venv/bin:/usr/bin:/bin VIRTUAL_ENV=$PWD/.venv .venv/bin/prisma generate
uvicorn main:app --reload --port 8000
python -m arq app.worker.WorkerSettings --watch app   # in a second terminal
```

The API only queues e-mail (invitations, device-change notices). The worker sends it, so without the worker an invitation waits in Redis and never arrives. `npm run dev` and `./run.sh` start the worker for you. Password-reset e-mail is sent by the API itself.

From the repository root, `./run.sh` is a menu for a local or hosted target: it shows the target's status, creates the super admin (the first account), empties the database, and starts the local backend. It creates no sample data.

## Database

`prisma/migrations/` holds the SQL for reference. Do not run `prisma migrate dev`: it would drop the triggers and CHECK constraints that live only in SQL.

The schema comes from `prisma db push`. A change it refuses, such as dropping a column that holds values, or that moves data, is a file in `prisma/sql_changes/before_push/` or `after_push/`. `python scripts/apply_sql_changes.py before_push` (then `prisma db push`, then `after_push`) applies each file once and records it. The production deploy does this for you, after a backup. Run it against a dev database the same way when you pull a change that adds one.

`scripts/reset_database.py --force-destructive-wipe --confirm-target-db=<name>` wipes a local database and creates a clean schema with a default super admin.

## Check your work

```bash
ruff check .
pytest tests -v
```
