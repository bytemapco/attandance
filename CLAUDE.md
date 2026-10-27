# CLAUDE.md - Project Guidelines & Dual-Repository Setup

## Repository Architecture
This project follows a dual-repository model:
1. **Root Monorepo (`bytemapco/attandance`)**: Contains the full stack (`backend/`, `frontend/`, `mobile/`, `docs/`, `scripts/`).
2. **Dedicated Mobile Repository (`bytemapco/attandance_mobile`)**: Located at `./mobile` with its own Git tracking (`./mobile/.git`).

### Dual-Repository Rule (Mandatory Two-Way Sync)
- Any modification made to the Flutter mobile application in `./mobile` must be committed and pushed to **both**:
  1. The root repository: `bytemapco/attandance`
  2. The mobile repository: `bytemapco/attandance_mobile` (running `git` commands from within `./mobile`)
- Never leave mobile updates isolated in one repository.

---

## Engineering & Development Guidelines

### 1. Environment & Configuration Sync
- **Root `.env.prod` is Source of Truth**: When configuration keys, third-party credentials, or environment variables are added/modified, update the root `.env.prod` and all sub-service `.env` files (`backend/.env`, `backend/.env.prod`, `backend/.env.example`, `backend/.env.prod.example`).
- Ensure all environments remain synchronized and documented.

### 2. No Hardcoding
- **Never Hardcode Secrets**: API keys, DSNs, database URLs, JWT secrets, and AWS credentials must always be loaded through environment variables.
- Dynamic overrides must always be respected.

### 3. Senior Engineering Rigor & Zero-Bypass Standard
- **Zero Workarounds**: Never use temporary monkey patches, suppressed type checks, disabled linters, or mock bypasses. Fix root causes.
- **Strict Scope**: Do not perform speculative refactors or unsolicited changes without permission.
- **Dead Code Cleanup**: When modifying or removing code, clean up orphaned helpers, unused imports, dead types, and unused test fixtures.
- **Simplicity & Separation of Concerns**: Single-purpose functions, early returns, no nested ternaries or deeply nested conditionals.

### 4. File Structure & Quality
- **File Length Limit**: Keep every file concise (under 200 lines). Break down into modular components or services when needed.
- **Strict Typing**: No `any` in TypeScript. Comply with strict typing in Python (`ruff`/`flake8`) and Dart analysis options.
- **No Residual Debug Code**: Remove `console.log`, `print()`, or debug markers before finishing tasks.

### 5. Branch Workflow
- **Development**: Feature work, refactoring, and bug fixes are committed to `dev`.
- **Production**: Stable, verified releases from `dev` merge into `main`.

### 6. Database & Prisma Schema Standards
- **Never Add `output` in `schema.prisma`**: The `generator client` block in `backend/prisma/schema.prisma` must never contain hardcoded `output` directory paths (`output = ...`) to prevent breaking dynamic Docker and container builds.
