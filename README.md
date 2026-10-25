# Smart Attendance System

An asynchronous, AI-powered multi-layered attendance verification system engineered to eliminate proxy check-ins, buddy punching, and attendance manipulation. The system pairs a high-performance **FastAPI** Python backend with **DeepFace** and custom computer vision pipelines, a responsive **Next.js 16 (React 19)** web dashboard for Administrators and Teachers, and a **Flutter 3.8+** mobile application for Students.

---

## 🚀 Key Features

### 1. Multi-Layered AI Verification
To mark attendance, student selfie submissions undergo three automated verification checkpoints:
- **Facial Biometric Recognition**: Extracts live face embeddings using **FaceNet** (via DeepFace) and performs cosine similarity matching against 128-dimensional vector embeddings stored in PostgreSQL using `pgvector`.
- **Anti-Spoofing Liveness Detection**: Evaluates frame texture and depth cues via a custom-trained **MobileNetV2** classifier to prevent photo/screen/mask replay attacks.
- **Background Environment Validation**: Verifies physical classroom context via a custom **MobileNetV1** background recognition model.

### 2. Dynamic Location & Geofencing
- Calculates high-precision distance between student GPS telemetry and active lecture hall coordinates using the **Haversine formula**.
- Teachers can dynamically adjust session geofence radius (meters) and pinpoint coordinates in real time.
- Submissions violating boundary limits are flagged or rejected with detailed telemetry logs.

### 3. Hardware Device Binding (Anti-Proxy)
- Restricts each student profile to a single verified physical device via unique hardware UUID bindings (`device_uuid`).
- Preventative lockout on credential sharing: new device logins require a formal **Device Change Request** approved by faculty or administration.

### 4. Offline Smart Pass (Encrypted Fallback)
- Time-based, cryptographically signed Smart Pass QR codes allow attendance verification during network connectivity drops or device camera malfunctions.
- Signed using asymmetric/symmetric token secrets with embedded expiration and session parameters.

### 5. Automated Outlier Scanning & Absentee Analytics
- ML-driven **Isolation Forest** anomaly detection algorithms scan attendance history to detect abnormal absenteeism and sudden drop-offs.
- Automated CSV audit log exports and role-based administrative logs.

### 6. Gamification & Student Engagement
- Fosters regular attendance through streak tracking (Bronze, Silver, Gold, Diamond tiers), leaderboard rankings, and instant notifications via Firebase Cloud Messaging (FCM).

---

## 🛠️ Technology Stack & Specifications

| Layer | Framework / Technology | Version | Key Components & Libraries |
| :--- | :--- | :--- | :--- |
| **Backend** | Python 3.11 / FastAPI | `0.115.6` | Prisma ORM, TensorFlow `2.15.0`, DeepFace `0.0.93`, Scikit-Learn `1.6.1`, OpenCV `4.10.0`, Redis `5.2.1`, Sentry |
| **Frontend** | Next.js / React 19 | `16.2.6` | Tailwind CSS `4.x`, Recharts `3.8.1`, Zustand `5.0.13`, Leaflet Map `1.9.4`, Radix UI, Zod |
| **Mobile** | Flutter SDK (Dart) | `^3.8.0` | Riverpod `^2.6.1`, Dio `^5.7.0`, Geolocator `^13.0.2`, Hive `^2.2.3`, QR Code Scanner |
| **Database** | PostgreSQL | `15+` | `pgvector` extension for 128-dimensional biometric embeddings |
| **Cache & Bus**| Redis Server | `7+` | Token denylist, token revocation, rate-limiting, and Pub/Sub notifications |

---

## 📂 Project Structure

```
.
├── backend/                  # FastAPI python application, database migrations, and AI models
│   ├── app/
│   │   ├── api/              # API routers (auth, admin, teacher, student, common)
│   │   ├── core/             # JWT security, config, and encryption
│   │   ├── db/               # Prisma database client & session management
│   │   ├── middleware/       # RBAC role checker and error envelope middlewares
│   │   └── services/         # Business logic (admin, teacher, biometric, outlier scanner, etc.)
│   ├── prisma/               # Database schema and seed scripts
│   ├── tests/                # Pytest test suite (73 tests)
│   └── main.py               # FastAPI application entrypoint
├── frontend/                 # Next.js 16 web application (Admin & Teacher portals)
│   ├── src/
│   │   ├── app/              # Next.js App Router (dashboard, classes, audit, approvals)
│   │   ├── components/       # UI design system and role-specific modular components
│   │   ├── hooks/            # Custom hooks (table query, debounce, notifications)
│   │   ├── lib/              # API clients and Zod validation schemas
│   │   ├── store/            # Zustand state stores (auth, theme)
│   │   └── tests/            # Setup and shared test fixtures
│   └── vitest.config.ts      # Vitest test configuration
├── mobile/                   # Flutter student companion app
│   ├── lib/                  # Screens, providers, and biometric scanner
│   └── pubspec.yaml          # Flutter dependency configuration
├── scripts/                  # Automated workspace CLI runners and setup helpers
└── package.json              # Workspace root orchestration scripts
```

---

## 🧪 Comprehensive Unit Test Suite

The repository includes a comprehensive, isolated unit test suite covering 100% of core backend services, API routers, RBAC middlewares, and frontend state stores, hooks, and components.

### Test Execution Commands

```bash
# Run both test suites concurrently from root
npm run test

# Run backend unit tests (73 tests)
npm run test:backend
# or: cd backend && .venv/bin/pytest tests/ -v

# Run frontend unit tests (31 tests)
npm run test:frontend
# or: cd frontend && npm run test
```

### Safety & Isolation Guarantees
- **Zero Production Contact:** Runs against mock database layers and an in-memory Redis mock adapter.
- **Fixture Format:** All mock user and credential fixtures adhere to realistic `@yopmail.com` domain conventions.

---

## ⚙️ Quick Start & Local Setup

### 1. Prerequisites
- **Python 3.11** + `pip`
- **Node.js 20+** + `npm`
- **PostgreSQL 15+** with `pgvector`
- **Redis Server**

### 2. One-Command Setup
Run the automated workspace CLI setup:

```bash
npm run setup
```

### 3. Running Development Servers

```bash
# Run backend and frontend concurrently
npm run dev

# Or run individual services:
npm run dev:backend    # FastAPI server on http://localhost:8000
npm run dev:frontend   # Next.js dashboard on http://localhost:3000
npm run dev:mobile     # Flutter app runner
```

Interactive OpenAPI Swagger docs are available at `http://localhost:8000/docs`.

---

## 🔒 Security & Verification Controls

- **Role-Based Access Control (RBAC):** Strict hierarchy enforcing `ADMIN`, `TEACHER`, and `STUDENT` scopes across all endpoints and UI views.
- **JWT & Session Revocation:** Token blacklisting managed in Redis for immediate logout and credential invalidation.
- **Password Security:** Multi-round cryptographic hashing with Argon2/Bcrypt and temporary password generation utilities.
- **Audit Logging:** System actions, overrides, and security events logged with origin IP, user-agent, and structured payloads.
