Generate a visual QA report of the app using Playwright MCP browser tools.

Target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Quick Reference

```
Phase 1: SCAN    — Navigate, snapshot, screenshot each page
Phase 2: INSPECT — Check layout, content, console errors, responsive
Phase 3: ANALYZE — Categorize findings, compare panels, note patterns
Phase 4: REPORT  — Generate structured QA report with evidence
```

## Instructions

Use the Playwright MCP browser tools to inspect the app and generate a structured QA report. Follow the 4-phase workflow below.

### Pages:
{{PAGES}}

### Phase 1: SCAN — Capture baseline state

For each page:
1. `browser_navigate` to the page URL, wait for full load
2. `browser_snapshot` to capture the accessibility tree
3. `browser_take_screenshot` for a full-page desktop capture (1280x720)
4. Note the current UI state: is the user logged in? What's visible?

### Phase 2: INSPECT — Test quality dimensions

For each page, check these dimensions:

**Layout & Visual**
- Overflow, misalignment, overlapping elements
- Missing content or empty states where content is expected
- Broken images or icons (look for alt text without images)
- Font rendering, color contrast issues

**Functional**
- Key buttons and links are clickable
- Forms accept input and validate correctly
- Navigation works between pages/sections

**Responsive**
- `browser_resize` to 375x812 (mobile), take screenshot
- Check for horizontal scroll, truncated text, inaccessible buttons
- `browser_resize` back to 1280x720 (desktop)

**Console & Errors**
- `browser_console_messages` — collect errors and warnings
- Categorize: Critical (app-breaking) vs Warning (cosmetic) vs Info (benign)

### Phase 3: ANALYZE — Think about what you observed

For each page, provide analytical observations:
- **What works well** — features functioning correctly
- **What needs attention** — issues found, with severity
- **Patterns** — recurring issues across pages (e.g., all forms missing validation)
- **Categorize issues:** "Bug" (broken functionality) vs "UX Issue" (works but confusing) vs "Enhancement" (suggestion)

### Phase 4: REPORT — Generate the report

Save screenshots as WebP to `Docs/screenshots/`:
- Use `sharp` (Node.js): `node -e "require('sharp')('in.png').webp({quality:80}).toFile('out.webp')"`
- Fallback: `ffmpeg -i in.png out.webp`

Save the report as `Docs/QA-Report.md`:

```markdown
# Visual QA Report

**Date:** [date]
**Base URL:** [url]
**Pages Tested:** [count]
**Overall:** [X PASS / Y NEEDS ATTENTION]

## Executive Summary
[2-3 sentences: overall quality, critical findings, patterns observed]

## Summary Table

| Page | Layout | Responsive | Console | Status | Key Finding |
|------|--------|------------|---------|--------|-------------|
| ...  | OK/Issue | OK/Issue | 0 errors | PASS | [brief note] |

---

## [Page Name] — [PASS / NEEDS ATTENTION]

### Analysis
[2-3 observations about this page's quality]

### Desktop (1280x720)
![Desktop](screenshots/page-desktop.webp)

### Mobile (375x812)
![Mobile](screenshots/page-mobile.webp)

### Issues Found
- [ ] [Severity] Description — [category: Bug/UX/Enhancement]

### Console Errors
- [Categorized list or "None"]

---
```

Produce one section per page, plus summary table at top. Use relative paths for screenshots.
