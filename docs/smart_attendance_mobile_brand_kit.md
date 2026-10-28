# Smart Attendance — Mobile App Brand Kit

**Version:** 1.0  
**Purpose:** The single source of truth for designing and implementing consistent Smart Attendance screens in Flutter.  
**Design direction:** Premium, friendly, academic, clear, and practical — visually distinctive without being flashy or overly minimal.

---

## 1. Brand essence

### Product personality

Smart Attendance should feel:

- **Trustworthy:** attendance and identity-related information should feel secure and clear.
- **Academic:** visual choices should fit a modern campus environment.
- **Approachable:** students should understand the next action without needing instructions.
- **Premium but restrained:** careful spacing, typography, and surfaces create quality; effects should never compete with the content.
- **Efficient:** prioritize current attendance, upcoming classes, records, and useful actions.

### Core design principle

> Make the important information obvious, the next action easy to find, and every screen feel like part of the same product.

The interface should not be “mind-blowing” because it uses lots of effects. It should feel impressive through strong hierarchy, clear information architecture, consistent components, readable typography, intentional imagery, and polished interaction states.

---

## 2. Visual direction

### Signature look

- Warm campus photography used selectively, especially in the Home screen header and onboarding/authentication screens.
- Light, cool-neutral or warm-white content surfaces.
- Deep navy typography for strong contrast.
- Orange as the primary brand accent and primary-action color.
- Rounded cards with subtle borders and restrained shadows.
- Clean outline icons with consistent stroke weight.
- Green, red, amber, and blue used semantically, not decoratively.
- Plus Jakarta Sans throughout the app.

### Avoid

- Large dark gradient panels on ordinary content screens.
- Heavy glassmorphism, neon glows, excessive gradients, and decorative blur.
- Too many colors competing within one screen.
- Placing every item inside a separate card.
- Multiple oversized headings or competing focal points.
- Repeating the same action in several places without a reason.
- Imaginary or unsupported features (for example, biometric sign-in, QR flows, password recovery, or social login) when they are not implemented in the app.
- Using generated mockup text or mockup values as real application data.

---

## 3. Color system

Use semantic tokens instead of hard-coding colors independently in every widget. The hexadecimal values below are the baseline brand palette.

### Brand and surface colors

| Token | Hex | Usage |
|---|---|---|
| `brandOrange` | `#FF8A00` | Primary actions, active navigation, key highlights, selected controls |
| `brandCoral` | `#FF4D24` | Optional secondary orange/coral emphasis; use sparingly |
| `brandNavy` | `#111B32` | Main headings, primary text, important icons |
| `appBackground` | `#F4F7FB` | Main page background and light neutral canvas |
| `surface` | `#FFFFFF` | Cards, sheets, fields, navigation surfaces |
| `textSecondary` | `#687791` | Supporting copy, labels, metadata |
| `borderSubtle` | `#E3E9F1` | Dividers, field outlines, restrained card borders |
| `trackNeutral` | `#E9EEF5` | Progress tracks, chart baselines, inactive slider tracks |
| `orangeTint` | `#FFF0D9` | Soft orange icon containers, selected-state backgrounds |
| `coralTint` | `#FFF0EC` | Optional soft coral surface |

### Semantic status colors

| Token | Suggested hex | Usage |
|---|---|---|
| `statusPresent` | `#08A875` | Present, successful verification, synced/complete state |
| `statusAbsent` | `#F0445E` | Absent or clearly negative attendance status |
| `statusExcused` | `#F59E0B` | Excused, flagged, or attention-needed states when appropriate |
| `statusInfo` | `#2583E8` | Informational hints, identity or technical information |
| `statusNeutral` | `#7C8BA1` | No class, unavailable, or neutral metadata |

**Semantic color rules**

- Always pair a status color with a text label or icon; never communicate meaning by color alone.
- Use green only when something is genuinely successful or present.
- Use red for absent/error/critical states; avoid red for ordinary decoration.
- Use amber/orange for warnings, excused/flagged statuses, and primary brand emphasis, but keep status badges visually distinct from primary buttons.
- Verify all foreground/background combinations for WCAG contrast, especially small labels and muted text.

### Gradient policy

Gradients are optional and should be restrained. If used, keep them to small areas such as a primary button or a carefully designed hero card. A suggested orange action gradient is `#FF9A12` to `#FF4D24`; solid `brandOrange` is the default. Do not use large decorative gradients on every screen.

---

## 4. Typography

### Font family

**Primary typeface: Plus Jakarta Sans**  
Use it consistently for headings, body text, controls, labels, metrics, and navigation.

Font reference: https://fonts.google.com/specimen/Plus+Jakarta+Sans

### Typography scale

| Style token | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| `displayLarge` | 34 px | 700 | 1.12 | Large welcome headline or exceptional key metric only |
| `headlineLarge` | 30 px | 700 | 1.20 | Main screen title when the layout supports it |
| `headlineMedium` | 24 px | 700 | 1.20 | Major metric or hero heading |
| `titleLarge` | 20 px | 600 | 1.30 | Section heading or key card title |
| `titleMedium` | 16 px | 600 | 1.35 | Card title, list-item primary text |
| `bodyLarge` | 16 px | 400 | 1.50 | Main explanatory text |
| `bodyMedium` | 14–15 px | 400 | 1.45–1.50 | Main body copy and metadata |
| `labelLarge` | 14–16 px | 700 | 1.25 | Primary button text |
| `labelMedium` | 12–13 px | 600 | 1.35 | Input labels, badges, compact controls |
| `caption` | 11–12 px | 500 | 1.35 | Timestamps and low-priority metadata only |

Treat these as design reference sizes in logical pixels, not physical screen pixels. Respect Flutter text scaling and accessibility settings. Avoid tiny text for essential details.

### Typography rules

- Use 700 for primary headings and key numeric values, 600 for section/card headings, and 400–500 for body/supporting text.
- Use tight negative letter spacing only on large display headings where it improves balance; do not apply it globally.
- Keep sentence case for most UI labels. Avoid unnecessary ALL CAPS.
- Do not make all text bold. Clear contrast between heading, body, and metadata creates hierarchy.
- Keep long school/institution names from forcing layouts to overflow; allow sensible wrapping or ellipsis for secondary lines.

---

## 5. Layout, spacing, and shape

### Spacing scale

Use a consistent 4-point base scale.

| Token | Value | Typical use |
|---|---:|---|
| `space1` | 4 px | Icon-to-label micro spacing |
| `space2` | 8 px | Tight inline gaps |
| `space3` | 12 px | Compact control padding |
| `space4` | 16 px | Standard card/content gap |
| `space5` | 20 px | Group separation |
| `space6` | 24 px | Main section spacing |
| `space8` | 32 px | Large section separation |
| `space10` | 40 px | Occasional hero spacing |

### Screen margins

- Standard horizontal screen padding: **20–24 px** on typical phones.
- Keep text and controls aligned to a small number of shared vertical edges.
- Prefer a consistent spacing rhythm over arbitrary values for every widget.
- Use `SafeArea` for system status/navigation areas.
- Design for narrow phones and larger text sizes. Do not assume all devices have the same usable height.

### Corner radii

| Token | Value | Use |
|---|---:|---|
| `radiusSmall` | 8 px | Small chips, compact badges |
| `radiusMedium` | 12 px | Inputs, buttons, small elements |
| `radiusLarge` | 16 px | Standard cards and tiles |
| `radiusXLarge` | 20 px | Hero/feature cards and major surfaces |
| `radiusPill` | 999 px | Status pills, chips, segmented controls where appropriate |

Avoid mixing many different radii in the same view. Select a small, consistent set.

### Elevation and borders

- Cards should primarily use a white surface, a subtle border, and/or a very light shadow.
- Shadows should separate layers, not create a floating, glossy effect.
- Prefer a 1 px `borderSubtle` line when a card needs definition against a light background.
- Avoid strong shadows on every small element. Reserve more elevation for menus, dialogs, and prominent floating surfaces.

---

## 6. Iconography

- Use one consistent icon family (prefer Material Symbols/Material Icons or a single established outline icon set).
- Keep stroke weight, optical size, and corner style consistent.
- Standard icon sizes: 18–20 px inline, 22–24 px buttons/navigation, 28–32 px in feature tiles.
- Use the same icon for the same concept throughout the app.
- Avoid emoji as the primary interface icon. A greeting emoji can be used sparingly if it matches the friendly brand personality.
- Icon-only buttons need accessible labels and sufficiently large hit areas.

---

## 7. Core components

### 7.1 Primary button

- Background: `brandOrange` by default.
- Text: white, Plus Jakarta Sans 700, typically 15–16 px.
- Height: approximately 48–52 px.
- Radius: 12–16 px.
- Horizontal padding: 16–20 px.
- Use one primary action per screen or main task area whenever possible.
- Include loading, disabled, pressed, and success/error states as appropriate.
- Do not use a gradient unless the screen design specifically benefits from it.

### 7.2 Secondary button

- White or transparent surface, navy text/icon, subtle border.
- Same height and radius as the primary button when placed beside it.
- Use for a secondary action such as Face Match when Smart Pass QR is the primary option, assuming both features are implemented.

### 7.3 Cards

- Surface: white on `appBackground`.
- Radius: 16 px standard; 20 px for primary content cards.
- Padding: generally 16 px, increasing to 20 px for hero summaries.
- Use an understandable heading, concise content, and an optional action.
- Do not create a card for every text row. Group related information into coherent sections.

### 7.4 Inputs

- Height: normally 48–54 px.
- Radius: 12 px.
- Use a visible label separate from placeholder text.
- Border: `borderSubtle`; focused border may use `brandOrange`.
- Error state: show a specific message and appropriate icon; do not rely on border color alone.
- Preserve readable contrast and usable touch target size.

### 7.5 Status badges

- Compact rounded pill with a pale semantic background and a readable label.
- Example: Present = pale green + green text; Absent = pale red + red text; Excused = pale amber + amber text.
- Avoid excessive saturation or oversized pills.
- Keep text explicit (e.g., “Present”, “Absent”, “Excused”, “Live”).

### 7.6 Progress indicators

- Use the numeric value and label alongside a progress ring/bar.
- For attendance, prominently show the current percentage and the configured target (typically 75%).
- If a user is below target, show a concise warning such as “Below 75%” and a useful next-step message when the data supports it.
- Ensure progress bars have a text equivalent for accessibility.
- Never imply a value is calculated if the implementation has no reliable data for it.

### 7.7 Notification button

- White or lightly tinted circular/rounded-square surface.
- Navy bell icon; small red/orange dot only when there are unread notifications.
- Avoid showing a badge count if the app cannot provide a real count.

### 7.8 Bottom navigation

The app’s main navigation is consistent across Home, History, Analytics, and More.

- Surface: white, visually separated from scrollable content.
- Four destinations: **Home, History, Analytics, More**.
- Active destination: orange icon and label, with a subtle pale-orange pill/background or indicator.
- Inactive destinations: navy/slate icon and label.
- Keep icon and label aligned and similarly sized across destinations.
- Keep navigation fixed while the main page content scrolls, where the app architecture supports it.
- Use a real navigation component or accessible custom navigation rather than decorative icons.

---

## 8. Home dashboard specification

### Header

- Use the approved campus-at-sunset image as the Home screen’s signature visual.
- Put the greeting, initials/avatar, institution name, and notification action over the image.
- Prefer a readable light or subtly tinted text area, or a restrained overlay if required for contrast.
- Keep text on a calm part of the image; do not place important copy over high-detail building/window areas.
- Use the image as a header treatment, not as the background of the entire scrolling page.
- Crop responsively with `BoxFit.cover`; confirm the avatar, institution name, and notification action remain visible on narrow screens.

### Content order

1. **Student header:** greeting, institution, avatar/initials, notification action.
2. **Term Compliance:** current percentage, 75% target, progress indicator, and below-target state.
3. **Compact metrics:** attendance streak and classes attended this week.
4. **Today’s Classes:** date, course code, course name, instructor, time, and live/scheduled status.
5. **Attendance actions:** Smart Pass QR and Face Match only if both are real supported actions. Clearly indicate the primary action.
6. **Optional encouragement card:** concise positive message; keep it secondary to attendance information.
7. **Bottom navigation:** consistent across the app.

### Home layout rules

- White cards and light background should dominate the content area.
- Use navy for hierarchy and orange for key actions/highlights.
- The header can contain photography; avoid oversized decorative dark gradients in the compliance card.
- Do not make the main class card excessively tall. Fit course identity and actions in an efficient hierarchy.
- If the current class is not live, do not show a Live badge or a running timer.
- All attendance figures, timestamps, and course information must come from real app data.

---

## 9. Screen-specific patterns

### 9.1 Attendance Log — History

**Primary user goal:** understand what happened on a particular date or review past records.

- Keep **Calendar** and **List View** as two modes of the same screen, never both displayed at once.
- For first-time users, consider making **List View** the default because dated records and status labels are easier to interpret. Use Calendar as an alternative for date-based exploration.
- Keep the course selector or course context clear if records can be course-specific.
- Calendar view: month navigation, weekday labels, selected date, attendance markers, a compact legend, and selected-date records.
- List view: date, course/subject, time, clear attendance status, and a tap target for details.
- Use simple filters such as All, Present, Absent, and Excused only if those states exist in the underlying data.
- Avoid repeating the same counts in multiple cards. Use one concise summary area if totals are useful.
- Maintain enough contrast and spacing for dates to be easy to tap.

### 9.2 Performance — Analytics

**Primary user goal:** understand their current attendance, how it is changing, and which course needs attention.

Recommended order:

1. Page title and time-range selector.
2. Overall attendance vs. target (clear current percentage and concise status).
3. Summary metrics (Total, Present, Absent, Flagged if the app uses Flagged).
4. Weekly performance chart with labels and a clear legend.
5. Course targets/progress.
6. Optional leaderboard and activity heatmap farther down the scroll.

Rules:

- Make the attendance percentage and target more prominent than the decorative chart.
- Label axes and dates clearly; do not use ambiguous unlabeled bars.
- Avoid placing every analytics element in its own equally prominent card. Use spacing and heading hierarchy to group sections.
- Use a vertically scrollable page with bottom navigation fixed.
- Keep a heatmap below the main metrics; it is a secondary analytical tool, not the first thing a student needs to understand.
- Ensure figures such as “need 11 more classes” are computed from reliable attendance rules and data, not hard-coded mockup copy.

### 9.3 Profile / More

**Primary user goal:** access identity details, common actions, and settings.

Recommended order:

1. Profile page title and settings shortcut (if supported).
2. Student identity card: name, roll number, department/semester, institution, and verified state if verified data exists.
3. Quick actions in a consistent grid: Smart Pass, Notifications, Request Leave, Leave History, provided those features exist.
4. Settings & Support in a single structured list: Appearance, Goals & Targets, Notification Preferences, Offline Sync Status, Help & FAQ.
5. Sign Out separated visually from routine settings, using a clear destructive-action style and confirmation where appropriate.

Rules:

- Keep settings list rows consistently aligned, with icon, title, short description, and trailing arrow/status.
- Do not exaggerate color variation between settings icons; use soft tinted icon backgrounds with restrained hues.
- Only show “Face ID Verified” or sync-success labels when backed by actual app state.

### 9.4 Goals & Targets

**Primary user goal:** set a personal minimum attendance target and understand the recommendation.

- Use a clear page title, one strong target card, a large current percentage, and an easy-to-use slider.
- Label the slider bounds (e.g., 50%, 75% recommended, 100%) and expose the value accessibly.
- The displayed percentage must update as the slider changes.
- Explain the recommendation with a short information panel; keep advice factual and institution-configurable where appropriate.
- Separate an optional “recommended target” action from the slider only if it has a real function.
- Provide a clear save/apply action if the app requires confirmation. Do not imply changes persist if they do not.

### 9.5 Smart Pass Scanner

**Primary user goal:** grant required permission and scan the teacher’s classroom QR code reliably.

Permission state:

- Explain why permission is needed in plain language.
- Provide one clear action to request permission.
- Explain what the app uses the permission for and avoid overclaiming privacy guarantees.

Scanner state:

- Make the camera preview the main focus.
- Use restrained orange scan guides and concise copy such as “Scan classroom QR.”
- Show permission/location/device verification status only when it is actually known.
- Provide flash or camera-switch controls only when implemented and needed.
- Place procedural explanation below the camera, not above it.
- Handle permission denied, camera unavailable, invalid QR, expired QR, verification failure, and success states.
- Do not use a mock QR image in the real scanning interface; the camera view must be functional.

---

## 10. Photography and image assets

### Campus sunset image

Use the generated campus sunset image as the approved visual reference for the Home header and welcome/authentication areas when appropriate.

- Keep the image warm and welcoming, with a modern academic building and sunset tones.
- Use the image in a limited, intentional area; it should not overwhelm data-heavy screens.
- Crop responsively and test on different aspect ratios.
- Keep text and controls readable against the image, using positioning and a subtle overlay if necessary.
- Avoid placing text directly on busy windows or high-contrast edges.
- Do not stretch the source image. Use `BoxFit.cover` and tune alignment per screen.
- Do not generate or embed text, fake buttons, or UI labels inside the background asset.

### Asset management

Suggested project structure:

```text
assets/
  images/
    campus_header.png
  fonts/
    PlusJakartaSans-Regular.ttf
    PlusJakartaSans-Medium.ttf
    PlusJakartaSans-SemiBold.ttf
    PlusJakartaSans-Bold.ttf
```

Use locally bundled fonts for deterministic offline rendering in production. If using a font package that fetches fonts at runtime, verify offline behavior and licensing before release.

---

## 11. Motion and interaction

Motion should clarify state, not decorate the UI.

- Button feedback: subtle pressed-state color/elevation change.
- Navigation: brief, restrained transitions.
- Progress: animate changes only when the value updates, and avoid long animations.
- Cards: do not animate unless the interaction benefits from it.
- Scanner: clear visual feedback for scanning, success, or failure.
- Respect reduced-motion/accessibility settings where relevant.
- Do not use bouncing, spinning, glowing, or parallax effects by default.

A useful starting point is 150–250 ms for ordinary UI transitions, adjusted for the interaction and user preference.

---

## 12. Accessibility and usability

- Aim for WCAG AA contrast for text and important controls.
- Minimum touch target: target at least 48 × 48 logical pixels for primary interactions where feasible.
- Support system text scaling; use flexible layouts instead of fixed-height text containers.
- Respect device safe areas, keyboard insets, and Android system navigation.
- Provide semantic labels for icons, charts, progress indicators, and custom controls.
- Do not rely only on color to explain Present/Absent/Excused/Flagged states.
- Ensure keyboard focus is visible where keyboard navigation applies.
- Give form fields persistent labels, specific validation messages, and clear focus/error states.
- Avoid clipping important content when text is enlarged.
- Ensure modal sheets and dialogs can be dismissed and navigated accessibly.

---

## 13. Responsive behavior

- Use `SafeArea`, `LayoutBuilder`, flexible rows/columns, and scroll views instead of assuming a fixed phone size.
- Prevent horizontal overflow for long subject, institution, and instructor names.
- At smaller widths, stack content rather than compressing text and buttons to unreadable sizes.
- If two actions share a row, ensure both have comfortable touch widths; stack them when needed.
- Keep bottom navigation readable and fixed while the page content scrolls, when appropriate.
- Check at minimum: a narrow Android phone, a typical Android phone, and a larger screen or tablet layout if the app supports it.
- Test large text scaling and landscape behavior for any screens expected to support them.

---

## 14. Flutter implementation guidance

### Recommended architecture

Centralize styles instead of scattering values throughout widgets:

```text
lib/
  theme/
    app_colors.dart
    app_text_styles.dart
    app_spacing.dart
    app_radii.dart
    app_theme.dart
  widgets/
    app_card.dart
    primary_button.dart
    secondary_button.dart
    status_badge.dart
    section_header.dart
    app_bottom_navigation.dart
  features/
    home/
    history/
    analytics/
    profile/
    goals/
    smart_pass/
```

Adapt these names to the existing project architecture rather than restructuring the whole app without need.

### Example color tokens

```dart
import 'package:flutter/material.dart';

abstract final class AppColors {
  static const brandOrange = Color(0xFFFF8A00);
  static const brandCoral = Color(0xFFFF4D24);
  static const brandNavy = Color(0xFF111B32);
  static const appBackground = Color(0xFFF4F7FB);
  static const surface = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFF687791);
  static const borderSubtle = Color(0xFFE3E9F1);
  static const trackNeutral = Color(0xFFE9EEF5);
  static const orangeTint = Color(0xFFFFF0D9);
  static const statusPresent = Color(0xFF08A875);
  static const statusAbsent = Color(0xFFF0445E);
  static const statusExcused = Color(0xFFF59E0B);
  static const statusInfo = Color(0xFF2583E8);
  static const statusNeutral = Color(0xFF7C8BA1);
}
```

### Theme principles

- Set `useMaterial3: true` and configure `colorScheme`, `textTheme`, `inputDecorationTheme`, `appBarTheme`, `cardTheme`, and button themes centrally.
- Use Plus Jakarta Sans for all text styles; ensure the font is actually included in the build.
- Use `Theme.of(context)` and semantic color tokens rather than embedding colors inside every widget.
- Prefer reusable stateless components for repeated patterns.
- Keep UI separate from attendance calculations, API/state management, and routing.
- Preserve existing business logic, navigation, data sources, and state management while redesigning.
- Do not claim a UI is complete until it has been run and inspected on an emulator/device when possible.

---

## 15. Content and microcopy

Use short, direct, supportive copy.

Preferred examples:

- “Term Compliance”
- “Goal 75%”
- “Below 75%”
- “Today’s Classes”
- “View All Classes”
- “Scan classroom QR”
- “Location access is needed to verify your classroom”
- “No attendance records yet”
- “You’re all caught up” (only when true)

Rules:

- Use sentence case.
- Prefer one short sentence over multiple paragraphs in cards.
- Avoid jargon where a student-facing phrase works.
- Do not promise guaranteed privacy, security, or outcomes unless the implementation and policy support the statement.
- Use consistent names for the same feature across screens (e.g., always “Smart Pass QR,” not several variants).

---

## 16. Data integrity and states

Every data-driven component needs more than a happy-path design.

Design and implement:

- Loading state.
- Empty state.
- Error state and retry where appropriate.
- Offline/sync state where supported.
- Disabled state when an action cannot currently be used.
- Permission denied/unavailable states for camera/location.
- Success/confirmation after an action completes.

Do not use placeholder values such as 0%, 5 sessions, sample times, “Live,” or leaderboard rank as production values unless those values are supplied by the actual application state. Mockup content is only illustrative.

---

## 17. Visual QA checklist

Before approving a screen, check:

### Brand consistency
- [ ] Plus Jakarta Sans is used consistently.
- [ ] Main text uses navy; orange is used intentionally for primary emphasis.
- [ ] Background and card colors match the neutral surface system.
- [ ] Icon style, card radius, button height, and spacing are consistent.
- [ ] Bottom navigation matches Home, History, Analytics, and More.
- [ ] Campus photography is only used where it helps the experience.

### UX clarity
- [ ] The primary user goal is obvious within a few seconds.
- [ ] The screen has a clear heading and section order.
- [ ] Important actions are easy to find and have adequate touch targets.
- [ ] Related information is grouped; unnecessary duplicate cards/actions are removed.
- [ ] Status labels are explicit and are not communicated by color alone.
- [ ] Empty, loading, error, disabled, and success states are considered.

### Technical quality
- [ ] No overflow, clipped text, or broken safe areas.
- [ ] Long names and large text scales are handled.
- [ ] Main controls have accessible semantics and labels.
- [ ] Existing routes, data, and business logic still work.
- [ ] Flutter analysis and relevant tests pass.
- [ ] Screenshots have been reviewed at real device sizes when available.

---

## 18. Design handoff rules for AI and developers

When redesigning or implementing a Smart Attendance screen:

1. Read this brand kit first.
2. Inspect the existing screen, functionality, and project structure before editing.
3. Identify the screen’s primary user goal and organize the hierarchy around it.
4. Reuse existing design tokens and components before creating new ones.
5. Keep only features that exist in the app or have been explicitly approved.
6. Preserve routes, APIs, state management, permissions, and attendance logic.
7. Use generated mockups as visual references, not as literal app assets containing fake text/UI.
8. Build real responsive Flutter widgets rather than static images.
9. Run the app, inspect screenshots, fix the most visible issues, and re-check.
10. Explain any remaining gaps honestly; do not claim device verification if it was not performed.

### One-line design prompt

> Redesign this screen as part of the Smart Attendance mobile app using Plus Jakarta Sans, deep navy typography, restrained orange accents, light neutral backgrounds, white rounded cards, subtle shadows, consistent spacing and icons, clear information hierarchy, accessible touch targets, and the established Home/History/Analytics/More navigation. Keep it premium and distinctive but not flashy, preserve all real functionality and data, and verify the rendered Flutter UI for responsive layout and visual quality.

---

## 19. Brand kit summary

**Smart Attendance = warm campus identity + navy clarity + orange action + light neutral surfaces + consistent components.**

The campus sunset header is the signature visual. The rest of the app should stay calm and functional, using orange to guide attention, navy for readable hierarchy, semantic status colors for attendance meaning, and Plus Jakarta Sans for a coherent typographic voice.
