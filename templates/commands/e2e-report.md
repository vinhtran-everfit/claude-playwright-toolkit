Generate a visual QA report of the app using Playwright MCP browser tools.

Target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Instructions

Use the Playwright MCP browser tools to inspect the app and generate a structured QA report. Save screenshots to `Docs/screenshots/` and the final report to `Docs/`.

### Steps for each page:
1. Navigate to the page URL
2. Take a browser_snapshot (accessibility tree) to understand the page structure
3. Take a browser_screenshot for visual reference
4. Check for:
   - Layout issues (overflow, misalignment, overlapping elements)
   - Missing content or empty states
   - Broken images or icons
   - Console errors (use browser_console_messages)
   - Responsive layout (resize viewport to 375x812, take another screenshot)
5. Resize back to desktop (1280x720)

### Pages:
{{PAGES}}

### Report Format

Save the report as `Docs/QA-Report.md` with this structure per page:

```
## Visual QA Report — [Page Name]

### Screenshots
- Desktop (1280x720): [screenshot]
- Mobile (375x812): [screenshot]

### Structure
- [Accessibility tree summary from browser_snapshot]

### Issues Found
- [ ] Issue description...

### Console Errors
- [Categorized error list]

### Status: PASS / NEEDS ATTENTION
```

Produce one section per page tested, plus a summary table at the top.
