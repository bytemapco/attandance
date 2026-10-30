# SAHAJ — Brand & Digital Product Design System

**Version:** 1.0  
**Status:** Selected visual direction — Carbon & Copper  
**Brand name:** SAHAJ  
**Hindi name:** सहज  
**Primary tagline:** Campus, made effortless.  
**Product category:** Campus technology / education SaaS  
**Primary audiences:** Students, faculty, academic administrators and institutional decision-makers  
**Document purpose:** Single source of truth for brand identity, UI/UX, visual design, content, and implementation across SAHAJ web and mobile products.

> **Brand north star:** SAHAJ should feel like a dependable global technology company that makes campus experiences simpler. It must be confident and enterprise-ready without feeling cold, complicated or overly decorative.

---

## 1. Brand foundation

### 1.1 Brand positioning

SAHAJ is a connected campus technology platform that helps students, faculty and institutions manage everyday academic and administrative experiences through dependable, intuitive digital services.

The product may grow beyond attendance. Therefore, the identity must not depend on attendance-specific symbols or language.

### 1.2 Brand promise

**Campus, made effortless.**

The experience should make complex campus processes feel clear, predictable and easy to complete.

### 1.3 Brand vision

Build a globally trusted campus technology platform that connects institutional operations with better student and faculty experiences.

### 1.4 Brand personality

| Attribute | What it means in practice | Avoid |
|---|---|---|
| Trustworthy | Clear feedback, predictable behavior, readable information and responsible data handling | Unsupported security claims or confusing states |
| Confident | Strong hierarchy, decisive actions and consistent patterns | Aggressive color, shouting typography or excessive decoration |
| Intelligent | Useful information, sensible defaults and efficient workflows | Overloaded dashboards and unnecessary complexity |
| Human | Friendly language and approachable interactions | Childish illustrations or excessive emoji |
| Progressive | Modern, responsive and thoughtfully engineered | Short-lived visual trends and gratuitous effects |

### 1.5 Audience promise

| Audience | Desired experience |
|---|---|
| Students | Convenient, welcoming and understandable |
| Faculty | Efficient, organized and dependable |
| Administrators | Clear oversight, control and reliable workflows |
| Institutional leadership | Professional, scalable and credible |
| IT / implementation teams | Consistent, maintainable and technically mature |

### 1.6 Brand voice

- **Clear:** explain what happened and what the user can do next.
- **Calm:** do not alarm users unnecessarily.
- **Respectful:** use direct, natural language.
- **Specific:** prefer meaningful labels over vague copy such as “Something went wrong”.
- **Honest:** never claim an action succeeded before the system confirms it.

Examples:

| Prefer | Avoid |
|---|---|
| “Attendance submitted for review” | “Success!” when approval is still pending |
| “No active sessions” | “Nothing here” |
| “Try again” with a reason where available | “Oops!!!” |
| “Changes saved” after confirmed save | “All done” before the server confirms |

---

## 2. Brand identity at a glance

| Element | Standard |
|---|---|
| Brand name | SAHAJ |
| Hindi signature | सहज |
| Tagline | Campus, made effortless. |
| Selected visual direction | Carbon & Copper |
| Primary brand color | Carbon `#28363B` |
| Secondary brand color | Mineral `#526F78` |
| Signature accent | Copper `#C98260` |
| Main background | Warm Ivory `#F5F2ED` |
| Primary font | Plus Jakarta Sans |
| Hindi font | Noto Sans Devanagari |
| Logo direction | Custom geometric symbol + wordmark; final artwork subject to design and trademark clearance |
| Visual character | Calm, structured, modern, credible, human |

**Important:** The Carbon & Copper palette replaces the earlier orange-led visual exploration as the selected brand direction. Existing screens should be harmonized to this system. Orange can remain in legacy assets only until they are deliberately updated; it should not remain an ungoverned second primary brand color.

---

## 3. Color system

The color system is intentionally restrained. Carbon anchors the identity, Mineral supports interaction and information hierarchy, and Copper provides a distinctive human accent.

### 3.1 Core brand colors

| Token | HEX | Role |
|---|---|---|
| `brand.carbon` | `#28363B` | Primary brand color, wordmark, headings, primary navigation and strong actions |
| `brand.mineral` | `#526F78` | Secondary brand color, secondary actions, links, selected elements and data visualization |
| `brand.copper` | `#C98260` | Signature accent, restrained emphasis, decorative details and selected highlights |

### 3.2 Neutral colors

| Token | HEX | Role |
|---|---|---|
| `neutral.warm-ivory` | `#F5F2ED` | Main page background |
| `neutral.white` | `#FFFFFF` | Cards, tables, forms, modals and panels |
| `neutral.ink` | `#202B30` | Main content text |
| `neutral.secondary-text` | `#526F78` | Secondary text on light backgrounds |
| `neutral.muted` | `#718087` | Large or non-critical supporting labels only; not default small body text |
| `neutral.border` | `#E3E1DC` | Dividers, outlines and subtle separators |
| `neutral.surface-subtle` | `#EEECE7` | Hover surfaces, subtle fills and inactive controls |

### 3.3 Semantic colors

Semantic colors communicate system meaning, not brand personality. Do not replace them with Copper or Mineral merely for visual consistency.

| Token | Suggested HEX | Meaning |
|---|---|---|
| `status.success` | `#247653` | Present, completed, approved, synchronized |
| `status.success-bg` | `#E8F3ED` | Success background |
| `status.warning` | `#8A5B12` | Needs attention, pending, approaching a limit |
| `status.warning-bg` | `#FBF1DF` | Warning background |
| `status.danger` | `#B54242` | Absent, failed, rejected, destructive action |
| `status.danger-bg` | `#F9EAEA` | Error background |
| `status.info` | `#306B8A` | Information, tips, neutral notices |
| `status.info-bg` | `#EAF2F6` | Information background |

Use a text label and/or icon with every semantic color. Never communicate Present, Absent, Excused, Flagged or Live using color alone.

### 3.4 Color allocation

Use this as a starting point for a typical light-mode application screen, not as a fixed rule for every component:

| Color family | Approximate visual share |
|---|---:|
| Warm Ivory and white surfaces | 70% |
| Carbon and dark typography | 20% |
| Mineral | 7% |
| Copper | 3% |

The UI should not look copper-colored. Copper is a signature detail, not a large background wash.

### 3.5 Color application rules

- Use Carbon for the main logo, page titles, important headings and high-priority actions.
- Use Mineral for secondary navigation, supporting controls, links and selected interface states where appropriate.
- Use Copper sparingly for selected navigation indicators, small brand marks, icon accents and key highlights.
- Use Warm Ivory for the overall application canvas and White for primary content surfaces.
- Use Carbon text on Copper backgrounds. White text on the current Copper token does not meet normal-text WCAG AA contrast.
- Avoid gradients as a default. If a gradient is genuinely needed, keep it subtle and use colors from the approved palette.
- Do not introduce a new brand color for an individual screen without updating the system.

### 3.6 Contrast guidance

Approximate contrast ratios for key combinations using the current tokens:

| Foreground | Background | Approx. ratio | Guidance |
|---|---|---:|---|
| Carbon `#28363B` | White `#FFFFFF` | 12.49:1 | Suitable for normal text |
| Carbon `#28363B` | Warm Ivory `#F5F2ED` | 11.19:1 | Suitable for normal text |
| Ink `#202B30` | White `#FFFFFF` | 14.49:1 | Suitable for normal text |
| Mineral `#526F78` | White `#FFFFFF` | 5.38:1 | Suitable for normal text |
| Mineral `#526F78` | Warm Ivory `#F5F2ED` | 4.82:1 | Suitable for normal text |
| Copper `#C98260` | White `#FFFFFF` | 3.07:1 | Accent / large text only; not normal text |
| Ink `#202B30` | Copper `#C98260` | 4.72:1 | Suitable for normal text when used as foreground on Copper |

These ratios are token-level checks, not a substitute for testing every rendered state. Validate text, icons, borders, focus indicators and charts against their actual adjacent colors. Target WCAG 2.2 AA as the baseline.

---

## 4. Typography

### 4.1 Typeface families

- **English / Latin:** Plus Jakarta Sans.
- **Hindi / Devanagari:** Noto Sans Devanagari.
- Do not mix multiple Latin font families within the product UI.
- Use system fallback fonts only when the required typeface cannot load.

### 4.2 Typography scale

The following values are design starting points in logical pixels. Adapt them for responsive layouts and accessibility text scaling.

| Token | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| `display` | 32 px | 700 | 1.15 | Rare major page headline |
| `h1` | 28 px | 700 | 1.2 | Main page title |
| `h2` | 22 px | 700 | 1.25 | Major section heading |
| `h3` | 18 px | 600 | 1.3 | Card and panel title |
| `title` | 16 px | 600 | 1.35 | Row title / form subsection |
| `body` | 14 px | 400 | 1.5 | Default content |
| `body-medium` | 14 px | 500 | 1.5 | Emphasized body text |
| `label` | 13 px | 600 | 1.35 | Form labels and metadata headings |
| `caption` | 12 px | 400 | 1.4 | Supporting metadata; preserve readable contrast |
| `micro` | 11 px | 500 | 1.35 | Compact metadata only; avoid for essential information |

### 4.3 Typography rules

- Use sentence case for page titles, buttons and section labels.
- Use bold sparingly; hierarchy should come from size, weight and spacing together.
- Avoid long uppercase labels. Small uppercase eyebrow labels may be used for grouping, with increased letter spacing.
- Do not use ultra-light weights for important information.
- Keep line lengths comfortable. Avoid wide paragraphs across desktop content areas.
- Allow text to wrap naturally on narrow screens; do not clip important text.
- Respect system text scaling and platform accessibility settings.

---

## 5. Logo and identity system

### 5.1 Recommended logo architecture

1. **Primary lockup:** geometric symbol + SAHAJ wordmark.
2. **Secondary lockup:** wordmark with the Hindi signature `सहज` where context benefits from it.
3. **Symbol-only:** custom geometric mark for app icons, favicons and compact placements.
4. **Monochrome:** single-color version for constrained applications and official documents.

The logo artwork has not yet been finalized. Do not treat a placeholder letter “S” or generated mockup mark as final approved artwork.

### 5.2 Logo color usage

- Primary light-background logo: Carbon wordmark and symbol with a restrained Copper detail.
- Dark-background logo: White or Warm Ivory wordmark with a Copper detail.
- Single-color logo: Carbon on light backgrounds or White on dark backgrounds.
- Do not use the Copper color for the entire wordmark on light backgrounds.

### 5.3 Clear space and minimum size

- Maintain clear space around the logo at least equal to the height of the symbol's key internal unit (to be defined after final vector artwork is approved).
- Do not stretch, skew, rotate, outline, add shadows to or rearrange logo elements.
- Create dedicated vector assets for web, Android and iOS rather than using screenshots.
- Verify the symbol at 16, 24, 32 and 48 px before approving it for small placements.

### 5.4 Avoid

- Clocks, attendance ticks, graduation caps, books, QR codes or location pins as the main brand mark.
- Generic gradients, stock icon marks or overly complex illustrations.
- Decorative Devanagari lettering that harms readability.
- Multiple competing accent colors in the logo.

---

## 6. Layout and spacing system

### 6.1 Spacing scale

Use a 4 px base unit. Standard tokens:

| Token | Size |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |
| `space-16` | 64 px |

Use consistent spacing within repeated components and between related sections. Avoid arbitrary one-off values unless a layout requires them.

### 6.2 Corner radius

| Token | Radius | Typical use |
|---|---:|---|
| `radius-sm` | 6 px | Small tags, compact controls |
| `radius-md` | 10 px | Inputs, buttons, table controls |
| `radius-lg` | 14 px | Standard cards and menus |
| `radius-xl` | 18 px | Large panels and dialogs |
| `radius-2xl` | 24 px | Hero panels or mobile bottom sheets, used selectively |
| `radius-pill` | 999 px | Status badges and small chips |

Do not make every element pill-shaped. Use the radius scale to establish component hierarchy.

### 6.3 Borders and elevation

- Standard border: `1px solid #E3E1DC`.
- Prefer a subtle border over a strong shadow for enterprise desktop cards.
- Use soft, low-opacity shadows only when they improve grouping or layering.
- Avoid heavy neumorphism, glowing edges, excessive glassmorphism and multiple nested shadows.
- Separate sections using whitespace before adding more borders.

### 6.4 Desktop layout

For the teacher / administration portal:

- Persistent left sidebar on wide desktop layouts.
- Top bar with global search and signed-in user information.
- Main content aligned to a consistent grid with a readable maximum width.
- Use a 12-column grid or equivalent responsive layout.
- Keep important actions near the page title or inside the relevant panel.
- Use tables for dense operational records; use cards for summary and task-oriented content.

Recommended starting measurements:

| Element | Starting value |
|---|---:|
| Expanded sidebar | 240–260 px |
| Top bar | 64–72 px |
| Main content max width | 1440 px |
| Desktop page horizontal padding | 32–40 px |
| Section gap | 24–32 px |
| Card padding | 20–24 px |
| Dense table row | 48–56 px |

These are starting tokens, not fixed pixel constraints. Use available width intelligently.

### 6.5 Mobile layout

- Use a single-column primary content flow.
- Keep navigation and key actions reachable with one hand where practical.
- Respect safe areas, display cutouts, system bars and keyboard insets.
- Replace desktop sidebars with an appropriate mobile navigation pattern.
- Stack dashboard cards and convert wide tables into readable cards or horizontally scrollable tables only when necessary.
- Do not shrink desktop layouts until they fit mobile; reflow the information architecture.

---

## 7. Responsive breakpoints

Use content-driven breakpoints and validate the actual layouts. Suggested starting points:

| Breakpoint | Width | Layout behavior |
|---|---:|---|
| Small mobile | < 360 px | Single column, compact spacing, wrap labels, essential actions remain visible |
| Mobile | 360–599 px | Single column, mobile navigation, full-width controls |
| Large mobile / small tablet | 600–767 px | Wider cards, optional two-column summaries when readable |
| Tablet | 768–1023 px | Collapsible navigation, adaptive grids, stacked panels as needed |
| Small desktop | 1024–1279 px | Compact sidebar, two-column workspace where content permits |
| Desktop | 1280–1599 px | Full sidebar, 12-column content grid |
| Wide desktop | 1600 px+ | Constrained content width; do not stretch text and tables edge-to-edge |

Test at common widths, not just the designer's main monitor. Also test browser zoom and system text scaling.

---

## 8. Iconography and imagery

### 8.1 Icons

- Use one consistent icon library and stroke style throughout the product.
- Prefer simple outline icons with consistent optical weight.
- Suggested default icon sizes: 16 px inline, 18–20 px controls, 22–24 px navigation, 28–32 px feature illustration.
- Icon buttons must have accessible labels and visible focus states.
- Do not use emoji as interface icons.
- Use Copper only as a restrained accent, not as the color of every icon.

### 8.2 Photography and illustration

- Use authentic, relevant campus photography sparingly for welcome or brand-led surfaces.
- Operational screens should prioritize content and task completion over decorative photographs.
- If a campus image is used, preserve enough contrast behind text; apply a neutral overlay only where needed.
- Prefer simple line illustrations or restrained diagrams for empty states and onboarding.
- Avoid mixing photorealistic imagery, 3D icons, cartoon illustrations and unrelated stock styles on one screen.

---

## 9. Core component system

### 9.1 Buttons

| Variant | Appearance | Use |
|---|---|---|
| Primary | Carbon fill, white text | Main page action |
| Secondary | White / Ivory surface, Carbon text and border | Alternative action |
| Tertiary | Transparent, Mineral text | Low-emphasis actions |
| Accent | Copper fill, Ink text | Rare highlighted action where emphasis is needed |
| Destructive | Semantic danger fill with accessible text | Delete, stop or sign-out actions when destructive |

Button rules:
- Use clear verbs: “Start session”, “Save changes”, “Review record”.
- Use one dominant primary action per local decision area.
- Include hover, pressed, focus, disabled and loading states.
- Prevent repeated submissions while an action is in progress.
- Do not use color alone to communicate disabled or destructive state.
- On mobile, aim for touch targets of at least 44 × 44 logical px; follow platform accessibility guidance.

### 9.2 Cards and panels

- White surface on Warm Ivory background.
- Border `#E3E1DC` where separation is needed.
- Radius `14–18 px` for most cards.
- Padding `16–24 px`, depending on density.
- Use a clear heading, supporting content and one coherent action area.
- Avoid unnecessary card nesting. If two pieces of content belong together, group them through spacing and typography before adding another card.

### 9.3 Forms and inputs

- Persistent labels above fields; placeholders are examples, not the only label.
- Use Carbon text and a clear border.
- Focus state should be visible and consistent; use Mineral or a restrained Copper outline.
- Provide inline validation close to the relevant field.
- Explain format expectations before users submit where possible.
- Preserve user input after recoverable errors.
- Use suitable input types, autofill and keyboard settings on mobile.

### 9.4 Status badges

- Use compact pill badges with text labels.
- Present / approved: green semantic tokens.
- Absent / rejected: red semantic tokens.
- Excused / pending: amber semantic tokens.
- Flagged: appropriate warning or danger token depending on severity.
- Live: green label and dot; never rely only on animation or a green dot.

### 9.5 Tables

- Use a clear header row and aligned columns.
- Keep row heights consistent, with sufficient vertical padding.
- Use tabular numerals for counts, dates, durations and monetary values.
- Right-align numeric columns where it improves comparison.
- Keep actions in a predictable final column or row menu.
- Provide sorting, filtering and pagination only when supported by the existing feature set.
- On small screens, convert rows to labeled cards or allow controlled horizontal scrolling with a clear cue.
- Provide empty, loading, error and no-results states.

### 9.6 Navigation

**Desktop:**
- Carbon or dark neutral text on a light surface.
- Active item uses a restrained Copper marker or pale Copper background.
- Group navigation by the user's tasks, as in Teaching Operations and Analytics & Reports.
- Keep labels visible; do not make icon-only navigation the default on desktop.

**Mobile:**
- Use a stable bottom navigation for the app's main areas where appropriate.
- Selected state uses a subtle Copper tint and Carbon label.
- Keep labels short and consistent.
- Maintain the same ordering across screens.

---

## 10. Data visualization and analytics

- Charts should prioritize accurate interpretation over decoration.
- Use Mineral and Carbon as core chart colors; use semantic colors only where the data represents status.
- Copper can highlight a selected period, target marker or key data point.
- Provide legends, labels, units and meaningful time ranges.
- Do not rely on color alone; use shape, label, pattern or direct annotation where necessary.
- Avoid 3D charts, decorative gradients and excessive gridlines.
- Make tooltips and chart values keyboard- and screen-reader-accessible where the platform supports it.
- Keep chart scales honest and avoid visual distortion.

---

## 11. Motion and interaction

- Motion should explain state changes or preserve spatial continuity.
- Use short, restrained transitions; avoid animations that delay task completion.
- Use consistent easing and duration tokens across the application.
- Respect reduced-motion preferences.
- Provide immediate visual feedback for taps, selections, loading and successful completion.
- Do not animate every card or icon for decoration.

Suggested starting durations:

| Token | Duration | Use |
|---|---:|---|
| `motion-fast` | 120 ms | Press / hover feedback |
| `motion-standard` | 180 ms | Small state change |
| `motion-emphasis` | 240 ms | Panel or navigation transition |

---

## 12. Content design and microcopy

### 12.1 General rules

- Be concise, but never remove information needed to make a decision.
- Prefer specific language over generic system terminology.
- Use sentence case.
- Use consistent terms for the same feature throughout the product.
- Distinguish between submitted, pending, approved, rejected and completed states.
- Show dates and times in the user's local format, with timezone awareness where necessary.
- Avoid jargon unless the intended audience understands it.

### 12.2 Example status wording

| State | Preferred copy |
|---|---|
| Submitted | “Attendance submitted” |
| Awaiting approval | “Pending instructor review” |
| Approved | “Attendance approved” |
| Failed | “We couldn't submit your attendance. Check your connection and try again.” |
| Empty session list | “No sessions yet” + a relevant next step |
| No review items | “No records need review” |

### 12.3 Notifications and confirmations

- Confirm meaningful actions with clear, short feedback.
- For irreversible actions, explain the consequence before confirmation.
- Never show a success toast while the server operation is still pending.
- Where an action fails, say what happened and what the user can do next.

---

## 13. Desktop teacher portal design guidance

The current teacher portal uses a persistent navigation rail, global search, a signed-in teacher area, and structured operational content. Preserve this information architecture unless a usability review demonstrates a clear problem.

### 13.1 Shared application shell

- Left sidebar: logo, grouped navigation and signed-in account summary.
- Top bar: global search, keyboard shortcut hint and profile information.
- Main canvas: Warm Ivory background.
- Content panels: White surfaces with subtle border and low elevation.
- Active navigation: restrained Copper emphasis.

### 13.2 Teacher dashboard

Preserve existing sections:
- Welcome area with date, institution and teacher name.
- Summary metrics: Classes, Live Sessions, Flagged Records and Leave Requests.
- Quick Actions.
- Assigned Classes.
- Review Queue.
- Recent Sessions.

UX requirements:
- Summary cards should have consistent dimensions and alignment.
- Show the number first, then the label and a short supporting description.
- Do not add graphs or new sections unless the product requirements justify them.
- Keep the main task actions near the top of the content.
- Empty review queues should be calm and clearly state that no action is required.

### 13.3 Class Sessions page

Preserve existing sections and controls:
- Page title and breadcrumb.
- Start New Session form.
- Active Sessions panel.
- Past Sessions table.
- Existing actions: Smart Pass QR, Roster, Manual, Stop and session history actions.

UX requirements:
- Make the start-session form easy to scan, with visible labels and a strong primary action.
- Keep active-session state unmistakable, with a text label such as “Live”.
- Make Stop visually distinct as a destructive action and require confirmation if stopping is consequential.
- Align past-session table columns consistently.
- Avoid making actions look like plain text links when they are important controls.

### 13.4 Responsive teacher portal

- At wide widths, use the expanded sidebar and multi-column content.
- At tablet widths, collapse the sidebar or provide an appropriate compact navigation mode.
- At mobile widths, use a mobile navigation pattern; avoid squeezing a desktop table into a narrow screen.
- Keep start-session and active-session controls usable on touch devices.

---

## 14. Mobile application design guidance

The mobile application shares the same brand tokens but has different layout and interaction needs.

### 14.1 Mobile visual treatment

- Main background: Warm Ivory or a very light neutral surface.
- Cards: White, with Carbon headings and Mineral supporting text.
- Primary action: Carbon fill with white text by default; use Copper accent selectively.
- Selected navigation: subtle Copper surface/indicator with Carbon or Ink label.
- Status labels: semantic colors with text and icons.
- Use campus photography only in appropriate brand-led areas such as welcome or selected profile headers. Do not put decorative photography on every operational screen.

### 14.2 Mobile navigation

Keep the established main areas consistent where applicable:
- Home
- History
- Analytics
- More

Avoid reordering tabs between pages. Ensure the selected tab is visually obvious and accessible.

### 14.3 Mobile-specific quality

- Support Android and iOS safe areas and system bars.
- Handle keyboard appearance, form scrolling and focus order correctly.
- Support dynamic text size and screen-reader semantics.
- Use platform-appropriate back navigation and permissions.
- Do not let bottom navigation cover scroll content or primary actions.
- Test portrait layouts on small and large devices; support landscape only where it provides a real benefit.

---

## 15. Light and dark themes

### 15.1 Light theme

Use the core tokens in Sections 3 and 4. Light mode is the reference appearance for the selected Carbon & Copper identity.

### 15.2 Dark theme — proposed starting tokens

| Token | HEX |
|---|---|
| `dark.background` | `#171F22` |
| `dark.surface` | `#222D32` |
| `dark.surface-elevated` | `#2A373D` |
| `dark.text-primary` | `#F2F0EA` |
| `dark.text-secondary` | `#C0C9C8` |
| `dark.border` | `#3D4B50` |
| `dark.brand-accent` | `#D99575` |
| `dark.brand-secondary` | `#91A9AD` |

Dark theme values are proposed tokens and require contrast testing, visual review and state-by-state validation before release.

---

## 16. Accessibility and inclusive design

Target **WCAG 2.2 AA** for web experiences and apply equivalent platform accessibility guidance to mobile applications.

Requirements:
- Normal text contrast target: at least 4.5:1.
- Large text contrast target: at least 3:1.
- Important graphical controls and state indicators should meet applicable non-text contrast requirements.
- Do not use color alone to convey attendance status, validation, errors or selection.
- Provide visible keyboard focus states on web.
- Ensure all interactive controls have accessible names and appropriate semantics.
- Support keyboard navigation and logical focus order.
- Respect user text scaling and zoom.
- Use adequate touch target sizes; aim for at least 44 × 44 logical px on mobile and follow platform-specific guidance.
- Provide captions or text alternatives for meaningful media and charts.
- Respect reduced-motion settings.
- Test with screen readers, keyboard-only operation and color-vision simulation.

Copper `#C98260` should not be used as small text on white or Warm Ivory. Use Ink `#202B30` on Copper fills when text contrast is required.

---

## 17. Product states that every screen must consider

Where relevant, every data-driven screen should have designed states for:

1. Initial loading.
2. Refreshing / background update.
3. Success.
4. Empty state.
5. No search results.
6. Validation error.
7. API / server error.
8. Offline or poor connectivity.
9. Permission denied or unavailable.
10. Disabled / unavailable action.
11. Partial data or delayed data.
12. Destructive-action confirmation.

Use concise, actionable language. Preserve user input after recoverable errors and do not silently discard unsaved work.

---

## 18. Design tokens and implementation reference

### 18.1 CSS variables

```css
:root {
  /* Brand */
  --color-brand-carbon: #28363B;
  --color-brand-mineral: #526F78;
  --color-brand-copper: #C98260;

  /* Neutral */
  --color-background: #F5F2ED;
  --color-surface: #FFFFFF;
  --color-text-primary: #202B30;
  --color-text-secondary: #526F78;
  --color-text-muted: #718087;
  --color-border: #E3E1DC;
  --color-surface-subtle: #EEECE7;

  /* Semantic */
  --color-success: #247653;
  --color-success-bg: #E8F3ED;
  --color-warning: #8A5B12;
  --color-warning-bg: #FBF1DF;
  --color-danger: #B54242;
  --color-danger-bg: #F9EAEA;
  --color-info: #306B8A;
  --color-info-bg: #EAF2F6;

  /* Typography */
  --font-sans: "Plus Jakarta Sans", sans-serif;
  --font-devanagari: "Noto Sans Devanagari", sans-serif;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-2xl: 24px;
  --radius-pill: 999px;

  /* Borders and elevation */
  --border-default: 1px solid var(--color-border);
  --shadow-card: 0 2px 8px rgba(40, 54, 59, 0.05);
  --shadow-popover: 0 8px 24px rgba(40, 54, 59, 0.12);
}
```

### 18.2 Flutter theme guidance

- Define brand colors in one central `AppColors` or token file.
- Define typography in a centralized `TextTheme` using Plus Jakarta Sans.
- Use theme extensions for semantic/status colors not covered by the standard `ColorScheme`.
- Create reusable components for buttons, cards, fields, badges, navigation items and dialogs.
- Avoid hard-coded colors and arbitrary spacing values throughout widgets.
- Keep business logic out of presentational widgets.
- Bundle font files locally for reliable production rendering and offline behavior.

Example token structure:

```dart
abstract final class SahajColors {
  static const carbon = Color(0xFF28363B);
  static const mineral = Color(0xFF526F78);
  static const copper = Color(0xFFC98260);

  static const warmIvory = Color(0xFFF5F2ED);
  static const white = Color(0xFFFFFFFF);
  static const ink = Color(0xFF202B30);
  static const secondaryText = Color(0xFF526F78);
  static const muted = Color(0xFF718087);
  static const border = Color(0xFFE3E1DC);

  static const success = Color(0xFF247653);
  static const warning = Color(0xFF8A5B12);
  static const danger = Color(0xFFB54242);
  static const info = Color(0xFF306B8A);
}
```

Ensure the implementation uses a single source of truth for tokens. Do not duplicate color definitions across features.

---

## 19. Brand consistency rules

### Always do

- Use Carbon for primary brand presence and important headings.
- Use Mineral as the supporting brand color.
- Use Copper sparingly and consistently.
- Use Warm Ivory and White as the primary surfaces.
- Use Plus Jakarta Sans consistently for Latin text.
- Maintain clear hierarchy, aligned grids and predictable spacing.
- Keep desktop and mobile experiences related but purpose-built for their platforms.
- Use semantic colors for system status.
- Preserve familiar navigation patterns across screens.
- Keep controls and wording consistent across the application.

### Never do

- Introduce a different primary palette on a single screen.
- Use bright orange as a second uncontrolled primary brand color.
- Use multiple gradients, glows or glassmorphism effects for decoration.
- Overload dashboards with unnecessary cards or charts.
- Use color alone for status or meaning.
- Mix unrelated icon styles or font families.
- Add features or interface controls that the product does not support.
- Change backend behavior merely to match a visual mockup.
- use mockup text or fabricated metrics as real production data.
- Treat generated logo mockups as final brand assets.

---

## 20. Screen design checklist

Before approving any new or redesigned screen, confirm:

### Brand
- [ ] Uses SAHAJ Carbon & Copper colors.
- [ ] Uses Plus Jakarta Sans / Noto Sans Devanagari as appropriate.
- [ ] Uses approved iconography and component styles.
- [ ] Has no unapproved decorative colors or effects.

### UX
- [ ] Has one clear primary purpose.
- [ ] Important information appears before secondary information.
- [ ] Primary action is easy to identify.
- [ ] Labels are clear and consistent.
- [ ] Empty, loading, error and disabled states are covered.
- [ ] Existing workflows and business logic are preserved.

### Responsive behavior
- [ ] Works on small and large mobile screens.
- [ ] Works on tablet and desktop where applicable.
- [ ] No clipped text, overflow or overlapping controls.
- [ ] Safe areas, keyboard and system navigation are handled.
- [ ] Tables and complex panels adapt appropriately.

### Accessibility
- [ ] Contrast checked.
- [ ] Keyboard and focus behavior checked for web.
- [ ] Screen-reader labels and semantics supplied.
- [ ] Text scaling and zoom checked.
- [ ] Status is not communicated by color alone.

### Engineering
- [ ] Uses shared design tokens and reusable components.
- [ ] Does not introduce unnecessary dependencies.
- [ ] Does not duplicate business logic.
- [ ] UI states are connected to actual data and API outcomes.
- [ ] Regression tests and relevant visual checks pass.

---

## 21. Reusable AI design prompt

Use this prompt when asking an AI coding or design agent to create or redesign a SAHAJ screen:

> Act as a senior product designer and frontend engineer working on SAHAJ, a global campus technology SaaS platform. Follow `sahaj_brand_kit.md` as the single source of truth. Use the Carbon & Copper identity: Carbon `#28363B`, Mineral `#526F78`, Copper `#C98260`, Warm Ivory `#F5F2ED`, White `#FFFFFF`, and Ink `#202B30`. Use Plus Jakarta Sans for Latin text and Noto Sans Devanagari for Hindi. Create a confident, clear, enterprise-quality interface that remains welcoming and easy to use. Use structured layouts, consistent spacing, restrained borders and shadows, accessible contrast, meaningful status colors and responsive behavior. Preserve the existing product features, API contracts, business logic and navigation. Do not invent features, data or actions. Do not make the design overly decorative, generic, excessively colorful or unnecessarily card-heavy. Inspect the current implementation first, identify UX issues, implement the redesign with reusable components and shared tokens, then test responsiveness, accessibility and the actual user workflows.

---

## 22. Governance and versioning

This document is the current brand and digital product design reference for SAHAJ.

- **Version 1.0:** Carbon & Copper direction selected; initial palette, typography, UI principles and desktop portal guidance defined.
- Logo artwork, exact logo geometry, favicon, app icon and final marketing lockups remain to be designed and approved.
- Dark-mode tokens and semantic colors are proposed and require full accessibility validation.
- New colors, typography or component rules should be added centrally and documented here before being adopted across screens.
- Update the version number and change log whenever a core identity decision changes.

### Change log

| Version | Status | Summary |
|---|---|---|
| 1.0 | Current | Carbon & Copper selected; core brand, typography, layout, component and implementation standards documented. |

---

## 23. Final brand principle

**SAHAJ should feel effortless to use and dependable to rely on.**

The visual identity should never compete with the user's task. It should create confidence through clarity, consistency, accessibility and quality—not through decoration alone.
