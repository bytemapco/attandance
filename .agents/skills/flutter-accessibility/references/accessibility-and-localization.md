# Accessibility and Localization

## Contents

- Semantics and focus
- Text and targets
- Motion and status
- Localization and RTL

## Semantics and focus

Prefer semantic Flutter controls. Give custom controls roles, labels, values, states, and actions. Exclude decoration and merge related content intentionally. Keep traversal order aligned with the task and restore focus after dialogs or composition changes.

## Text and targets

Support platform text scaling without disabling it. Allow reflow, wrapping, scrolling, or alternate composition. Use accessible target sizes while allowing compact visual bounds. Verify contrast and non-color cues.

## Motion and status

Honor reduced motion. Announce material asynchronous changes and errors without repeated chatter. Ensure temporary feedback remains available long enough or through persistent state.

## Localization and RTL

Use generated/localized strings, plural rules, locale-aware dates and numbers, logical padding/alignment, and direction-aware icons. Test long translations and mixed-direction user content. Do not mirror media or universally meaningful symbols blindly.

