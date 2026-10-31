# AGENTS.md — Global Engineering & UX Rules

## RESPONSIVE & ADAPTIVE UI (MANDATORY)
- **Fluid Layouts**: Never hardcode rigid fixed heights on parent containers without `BoxConstraints` or `Flexible`/`Expanded` wrappers.
- **Screen Size Adaptation**:
  - Compact screens (height < 700dp): Scale headings (24–28dp), tighten spacing (8–16dp), ensure keyboard open views scroll without overflow (`SingleChildScrollView` + `ClampingScrollPhysics`).
  - Standard/Large screens (height >= 700dp): Scale headings (28–34dp), use proportional pacing (24–36dp).
  - Tablet/Foldable/Web (width >= 600dp): Wrap forms in `ConstrainedBox(constraints: BoxConstraints(maxWidth: 480))` centered on screen.
- **Safe Area & System Insets**:
  - Always account for bottom insets (`MediaQuery.of(context).viewInsets.bottom` or `SafeArea(bottom: true)`).
  - Ensure floating buttons and bottom sheets have dynamic clearance above Android 3-button navigation bars and gesture pill bars.
- **Scroll Safety**: All forms and input screens must be wrapped in scroll views so keyboard appearances never trigger `A RenderFlex overflowed by ... pixels`.

## TYPOGRAPHY & DESIGN SYSTEM
- **Font Family**: GoogleFonts.plusJakartaSans across the entire application.
- **Weight Hierarchy**:
  - Headlines: FontWeight.w600 (balanced, clean, modern).
  - Form & Component Labels: FontWeight.w600.
  - Buttons & Interactive Elements: FontWeight.w600 or w700.
  - Body & Subtitles: FontWeight.w400 / w500.
- **Palette**: Dark canvas `#0F172A`, primary warm orange `#F95721`, dark surfaces `#1E293B`, brilliance `#F8FAFC`.

## CODE QUALITY & ARCHITECTURE
- Strict rule: **No file over 200 lines** — split into focused reusable components.
- Zero analyzer warnings (`flutter analyze --no-fatal-infos`).
- Keep code test-backed (`flutter test` 100% passing).
- Run `graphify update .` after touching code files.
- **File Modifications**: Must always use dedicated file editing tools (`replace_file_content`, `write_to_file`) to add or edit code. Never use terminal/bash commands (`cat << EOF`, `sed`, `echo >`, python scripts, etc.) to modify code files.

## ENVIRONMENT & CONFIGURATION SYNC
- **Root `.env.prod` is the Source of Truth**: Whenever configuration keys or environment variables are added or modified, update the root `.env.prod` immediately along with the respective sub-service `.env` files.
- **Never Hardcode Secrets**: API keys, database URLs, and JWT secrets must always be loaded via environment variables / configuration classes.

## VERSION CONTROL & DUAL-REPOSITORY ARCHITECTURE
- **Dual Repositories**: Main repository (`bytemapco/attandance`) and dedicated mobile repository (`bytemapco/attandance_mobile` inside `./mobile`).
- **Two-Way Sync**: Any modifications made to `./mobile` must be committed and pushed to both the root repo and the mobile standalone repo.

## DATABASE & PRISMA STANDARDS
- **Never Add `output` in `schema.prisma`**: The `generator client` block in `backend/prisma/schema.prisma` must never contain hardcoded `output` directory paths.


