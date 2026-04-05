Capture screenshots of app pages using the Playwright MCP browser tools.

Target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Quick Reference

```
1. Navigate → Wait for load → Desktop screenshot (1280x720)
2. Scroll capture: Top / Middle / Bottom for long pages
3. Mobile screenshot (375x812) → Resize back to desktop
4. Convert to WebP → Save to Docs/screenshots/
```

## Instructions

Use the Playwright MCP browser tools to navigate and capture screenshots.

### Pages to capture:
{{PAGES}}

### For each page:

1. **Navigate & Wait**
   - `browser_navigate` to the page URL
   - Wait for full page load (no loading skeletons or spinners)

2. **Desktop Capture (1280x720)**
   - Full-page screenshot — label `{page-name}-desktop`
   - For long pages, scroll and capture at 3 positions:
     - Top: `{page-name}-desktop-top`
     - Middle: `{page-name}-desktop-mid`
     - Bottom: `{page-name}-desktop-bottom`
   - Screenshot key sections if relevant (hero, navigation, main content, footer)

3. **Mobile Capture (375x812)**
   - `browser_resize` to 375x812
   - Full-page screenshot — label `{page-name}-mobile`
   - `browser_resize` back to 1280x720

4. **Convert to WebP**
   - Save all screenshots to `Docs/screenshots/`
   - Convert PNG to WebP using:
     ```bash
     node -e "require('sharp')('input.png').webp({quality:80}).toFile('output.webp')"
     ```
   - Fallback: `ffmpeg -i input.png output.webp`
   - Delete PNGs after successful conversion

## Output

Present each screenshot with:
- A descriptive label
- The viewport size used
- Any notable observations about the UI state (e.g., "navigation collapses to hamburger menu on mobile")
