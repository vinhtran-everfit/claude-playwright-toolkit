Run E2E tests on the app using the Playwright MCP browser tools.

Test target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Instructions

Use the Playwright MCP browser tools (browser_navigate, browser_snapshot, browser_screenshot, browser_click, browser_type, etc.) to test the app interactively in the user's existing Chrome browser.

### Pages to test:
{{PAGES}}

### For each page:
1. Navigate to the page URL
2. Wait for the page to fully load (no loading skeletons or spinners)
3. Take a browser_snapshot to understand the page structure
4. Verify key elements exist (headings, navigation, main content, forms)
5. Take a full-page screenshot
6. Test interactions:
   - Click buttons and links
   - Fill in search/filter inputs
   - Test dropdowns and selections
   - Verify the UI updates correctly after each action
7. Take screenshots after each interaction as evidence
8. Check for console errors using browser_console_messages

### Reporting

After testing, provide a summary:
- Total checks performed
- PASS/FAIL for each check
- List of screenshots taken with descriptions
- Any issues or broken UI found
- Console errors (categorized by severity)
