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
