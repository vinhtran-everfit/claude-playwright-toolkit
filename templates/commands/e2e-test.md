Run E2E tests on the app using the Playwright MCP browser tools.

Test target: $ARGUMENTS (optional: page path or "all", defaults to "all")
Base URL: {{BASE_URL}}

## Instructions

Use the Playwright MCP browser tools (browser_navigate, browser_snapshot, browser_take_screenshot, browser_click, browser_type, etc.) to test the app interactively in the user's existing Chrome browser.

**Important:** You are testing in a real browser. Look at each screenshot, reason about what you see, and provide analytical observations — not just pass/fail.

### Pages to test:
{{PAGES}}

### For each page:

1. **Navigate & Wait**
   - Navigate to the page URL
   - Wait for the page to fully load (no loading skeletons or spinners)

2. **Inspect & Understand**
   - Take a `browser_snapshot` to understand the page structure (accessibility tree)
   - Verify key elements exist (headings, navigation, main content, forms)
   - Note the current state — is a modal open? Is the user logged in? What tab is active?

3. **Visual Capture**
   - Take a full-page screenshot
   - For long pages, scroll and capture at multiple positions (Top, Middle, Bottom)

4. **Test Interactions**
   - Click buttons and links
   - Fill in search/filter inputs
   - Test dropdowns and selections
   - Verify the UI updates correctly after each action
   - Take screenshots after each significant interaction as evidence

5. **Input Handling**
   - Use `element.fill()` over `element.type()` when possible for reliability
   - Sanitize special characters (em-dashes, emojis) before keyboard simulation
   - For `contenteditable` elements, try `fill()` first, fall back to `type()`

6. **Error Checking**
   - Check for console errors using `browser_console_messages`
   - Distinguish between critical errors and benign warnings

### Hover-Revealed Elements

Some UI elements only appear on hover (e.g., add buttons, action menus, tooltips). To interact with these:
1. Hover over the parent container using `browser_hover`
2. Wait briefly for the element to appear
3. Then click the revealed element
4. If hover doesn't work, use JavaScript to force visibility:
   ```js
   document.querySelector('.hidden-element').style.display = 'block';
   ```

### Handling Modals & Dialogs

- After triggering a modal, wait for it to fully render before interacting
- Check for confirmation dialogs (e.g., "Are you sure?" prompts) — look for a second button with the same text
- Use `page.on('dialog')` to auto-accept browser dialogs if running via script
- Close modals between test cases to reset state, or keep them open and use "reset" buttons if available

### Reporting

After testing, provide a summary with analytical observations:
- Total checks performed
- PASS/FAIL for each check with **brief analysis** of what you observed
- List of screenshots taken with descriptions
- Notable behaviors or patterns worth monitoring
- Console errors (categorized by severity)
- Comparison with any prior test runs if applicable
