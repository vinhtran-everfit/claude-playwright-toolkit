Capture screenshots of app pages using the Playwright MCP browser tools.

Target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Instructions

Use the Playwright MCP browser tools to navigate and capture screenshots. Save all screenshots to a `Docs/screenshots/` folder.

### Pages to capture:
{{PAGES}}

### For each page:
1. Navigate to the page URL
2. Wait for full page load (no loading skeletons or spinners)
3. Take a full-page screenshot — label it "[Page Name] - Full Page"
4. Screenshot key sections (hero, navigation, main content, footer)
5. Resize to mobile (375x812) and take another screenshot — label "[Page Name] - Mobile"
6. Resize back to desktop (1280x720)

## Output

Present each screenshot with:
- A descriptive label
- The viewport size used
- Any notable observations about the UI state
