Run E2E tests and generate a visual report with WebP screenshots and video evidence using Playwright MCP browser tools.

Target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Instructions

Use the Playwright MCP browser tools to test the app interactively. For each page, you should **see the screen, reason about what you observe, and write analytical findings** — not just pass/fail.

### Pages to test:
{{PAGES}}

### For each page:

1. **Navigate & Load**
   - Use `browser_navigate` to go to the page URL
   - Wait for the page to fully load (no loading skeletons or spinners)

2. **Inspect Structure**
   - Use `browser_snapshot` to capture the accessibility tree
   - Verify key elements exist (headings, navigation, main content, forms)

3. **Capture Desktop Screenshot**
   - Use `browser_take_screenshot` for a full-page visual capture
   - Save the raw screenshot data

4. **Test Interactions**
   - Click buttons and links using `browser_click`
   - Fill in search/filter inputs using `browser_type`
   - Test dropdowns using `browser_select_option`
   - Verify the UI updates correctly after each action
   - Capture a screenshot after each significant interaction
   - **Analyze what you see** — note layout issues, missing elements, unexpected behavior

5. **Responsive Check**
   - Use `browser_resize` to 375x812 (mobile viewport)
   - Take a mobile screenshot
   - Resize back to 1280x720 (desktop)

6. **Check Console**
   - Use `browser_console_messages` to collect errors and warnings

### Evidence Standards

Every test case must include:
- **Status screenshot** — clear view of the result
- **Comparison screenshot** — side-by-side if verifying sync/match between panels
- **Scroll captures** — for long content, capture Top, Middle, Bottom positions

### Convert Screenshots to WebP

After capturing all screenshots, convert every PNG to WebP:

- Create the output directory: `Docs/test-report/`
- **Preferred:** Use `sharp` (Node.js) — install with `npm install sharp` if needed:
  ```bash
  node -e "require('sharp')('input.png').webp({quality:80}).toFile('output.webp')"
  ```
- **Fallback 1:** Use `ffmpeg`:
  ```bash
  ffmpeg -i input.png -quality 80 output.webp
  ```
- **Fallback 2:** Use `cwebp`:
  ```bash
  cwebp -q 80 input.png -o output.webp
  ```
- Name files descriptively: `{page-name}-desktop.webp`, `{page-name}-mobile.webp`, `{page-name}-{interaction}.webp`
- Delete PNGs after successful conversion to save space

### Video Recording

If running automated tests via a Playwright script (not MCP tools), capture video evidence:

- Use Playwright's built-in `recordVideo` option when creating a browser context
- Or use CDP `Page.startScreencast` to capture frames, then convert:
  ```bash
  ffmpeg -y -framerate 10 -i "frames/frame-%05d.png" -c:v libvpx-vp9 -b:v 1M output.webm
  ```
- Save video as `.webm` in `Docs/test-report/videos/`

### Input Sanitization

Before pasting text into inputs:
- Replace em-dashes (`–`) with regular dashes (`-`) if keyboard simulation is used
- Escape or remove emojis that may cause input errors
- Use `element.fill()` instead of `element.type()` where possible for reliability

### Generate Report

Save the report as `Docs/test-report/Report.md` with this structure:

```markdown
# E2E Test Report

**Date:** [current date]
**Base URL:** [base url]
**Total Pages Tested:** [count]
**Overall Result:** PASS / FAIL

## Executive Summary
[2-3 sentences about overall findings, key observations, behavioral patterns]

## Summary

| Page | Category | Status | Key Finding |
|------|----------|--------|-------------|
| ...  | ...      | PASS   | [brief observation] |

---

## [Page Name] — [PASS/FAIL]

### Analysis
[2-3 analytical observations — what worked, what didn't, what's notable]

### Desktop (1280x720)
![Desktop](screenshots/page-name-desktop.webp)

### Mobile (375x812)
![Mobile](screenshots/page-name-mobile.webp)

### Interactions Tested
- [x] Clicked [element] — result: [description]
  ![Interaction](screenshots/page-name-interaction.webp)

### Console Errors
- [Categorized error list or "None"]

---
```

### Analysis Guidelines

For each test case, provide **analytical observations** (not just pass/fail):

1. **What worked well** — features that function correctly
2. **What's notable** — unexpected behaviors, edge cases, patterns worth monitoring
3. **Comparison** — if repeating a test, note consistency with prior runs
4. **Categorize issues** — distinguish "System Error" (crash/bug) from "Design Limitation" (expected constraint)

Produce one section per page tested, plus the summary table at the top. All screenshot references must use relative paths to the WebP files.
