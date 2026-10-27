# Visual QA

## Contents

- Evidence matrix
- Inspection order
- Golden discipline
- Reporting

## Evidence matrix

Capture the smallest set that represents breakpoints, themes, core states, enlarged text, and directionality. Record viewport, pixel ratio, platform, locale, theme, and fixture state.

## Inspection order

1. Core task visibility and reachability.
2. Hierarchy and scan path.
3. Clipping, overlap, insets, and breakpoint behavior.
4. Typography, spacing rhythm, alignment, and surface consistency.
5. State communication, content realism, and interaction feedback.
6. Pixel-level polish.

Compare related screens side by side. Separate factual defects from preference.

## Golden discipline

Freeze fonts, time, animation, network data, and pixel ratio. Review diffs before accepting updates. Prefer focused component goldens plus a few journey-level screens over indiscriminate snapshots.

## Reporting

Name the matrix inspected, material findings fixed, artifacts produced, and combinations not verified. Never use “pixel-perfect” without a defined reference and inspected comparison.

