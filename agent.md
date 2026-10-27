# Agent Guidelines & Engineering Standards

## 1. Environment & Configuration Sync
- **Root `.env.prod` is the Source of Truth**: Whenever configuration keys, third-party credentials, or environment variables are added or modified, update the root `.env.prod` immediately along with the respective sub-service `.env` files (`backend/.env`, `backend/.env.prod`, `backend/.env.example`, `backend/.env.prod.example`).
- **All Changes Propagated**: Never leave environment variables isolated in one subfolder. All environments must stay synchronized and properly documented.

## 2. No Hardcoding
- **Never Hardcode Secrets or Credentials**: API keys, DSNs, database URLs, JWT secrets, and AWS credentials must always be loaded through environment variables via configuration classes or `os.getenv` with standard fallbacks only when safe.
- **Dynamic Overrides**: Always respect runtime environment variable overrides over default or development values.

## 3. Senior Engineering Rigor & Zero-Bypass Standard
- **Senior Software Engineer Mindset**: Act at all times as a Staff/Senior Software Engineer. Write clean, elegant, readable, and self-documenting code. Never rush or introduce superficial hacks.
- **0% Patches & 0% Bypasses**: Never use workaround monkey patches, suppressed type checks, disabled linters, mock bypasses, or quick hacks to mask errors. Solve root causes at the architectural layer.
- **Strict Scope & Permission**: Never perform unsolicited side quests, speculative refactors, or out-of-scope work without explicit user permission. Stick precisely to the required task.
- **Dead Code Cleanup on Removal**: Whenever a feature, endpoint, or code block is modified or removed, perform complete cascading cleanups: delete all orphaned helper functions, unused imports, dead types, orphaned styles, redundant config keys, and unused test fixtures. Leave zero dead code behind.
- **Architectural Integrity**: Maintain clean separation of concerns across layers (routes, services, core, database models, middleware).
- **Simplicity**: Write the simplest code that completely solves the problem. Use early returns, avoid nested conditionals/ternaries, and keep functions single-purpose.

## 4. File Structure & Quality Rules
- **File Length Limit**: Keep every file concise (under 200 lines). If a file exceeds this, break it down logically into modular components/services.
- **Strict Typing & Diagnostics**: Avoid `any` in TypeScript. Ensure Python code complies with strict typing and ruff/flake8 standards.
- **No Residual Debug Code**: Remove all temporary `console.log`, arbitrary `print()` statements, and one-off debug test routes before finalizing production releases.

## 5. Version Control & Dual-Repository Architecture
- **Work on `dev`**: All ongoing features, refactoring, and bug fixes are committed to `dev`.
- **Production via `main`**: Verified and stable work from `dev` is merged into `main`.
- **Dual-Repository Architecture (Monorepo & Standalone Mobile)**:
  - **Main Repository (`bytemapco/attandance`)**: The root repository containing the entire system (`backend`, `frontend`, `mobile`, `docs`, `scripts`).
  - **Dedicated Mobile Repository (`bytemapco/attandance_mobile`)**: The standalone repository mapped directly to `./mobile` (via its own `.git`).
  - **Mandatory Two-Way Sync**: Any modification made to the mobile Flutter application (`./mobile`) must be kept in sync across both repositories. When committing/pushing mobile changes, commits must be created and pushed to both:
    1. The root repository: `bytemapco/attandance`
    2. The mobile repository: `bytemapco/attandance_mobile` (inside `./mobile`)

## 6. Database & Prisma Schema Standards
- **Never Add `output` in `schema.prisma`**: The `generator client` block in `backend/prisma/schema.prisma` must never contain hardcoded `output` directory paths (e.g. `output = ...`). Custom output paths break containerized builds where Python packages and site-packages are resolved dynamically.
