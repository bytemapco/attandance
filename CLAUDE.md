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

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
