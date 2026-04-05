# claude-playwright-toolkit

One command to give Claude Code full browser testing powers in any project.

Connects to your real Chrome browser — no new browser, no auth issues, no test files in your repo.

## What it sets up

| File | Purpose |
|------|---------|
| `.mcp.json` | Playwright MCP server (merges with existing) |
| `.claude/commands/e2e-test.md` | `/e2e-test` — interactive browser testing |
| `.claude/commands/e2e-screenshot.md` | `/e2e-screenshot` — capture page screenshots |
| `.claude/commands/e2e-report.md` | `/e2e-report` — visual QA report |
| `.claude/commands/e2e-test-report.md` | `/e2e-test-report` — full test report with WebP + video evidence |
| `.claude/settings.json` | Auto-allow all 22 playwright + common dev permissions |
| `.gitignore` | Adds `.playwright-mcp/` |

## Install

### Option A: Local link (no npm, recommended)

```bash
git clone https://github.com/YOUR_USERNAME/claude-playwright-toolkit.git ~/claude-playwright-toolkit

# Link into any project (symlinks commands, merges configs)
~/claude-playwright-toolkit/link.sh
~/claude-playwright-toolkit/link.sh /path/to/another/repo
```

Commands are **symlinked** — edit once in the toolkit, applies everywhere.

### Option B: npm install (for teams)

```bash
npm install --save-dev github:YOUR_USERNAME/claude-playwright-toolkit
npx claude-playwright-setup
```

Commands are **copied** — each project gets its own files.

## Setup options (npm mode)

```bash
npx claude-playwright-setup [options]

  --base-url <url>    Base URL (default: http://localhost:3000)
  --cdp-port <port>   Chrome debug port (default: 9222)
  --pages <json>      Pages to test: '[{"name":"Home","path":"/"}]'
  --force             Overwrite existing files
  --dry-run           Preview changes
```

## Usage

### 1. Launch Chrome with remote debugging

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Or use the included helper
~/claude-playwright-toolkit/scripts/chrome-debug.sh
```

### 2. Log in to your app in that Chrome

### 3. Restart Claude Code

### 4. Use the commands

```
/e2e-test                    # Test all pages interactively
/e2e-test /dashboard         # Test specific page
/e2e-screenshot              # Capture all pages
/e2e-report                  # Visual QA report (desktop + mobile)
/e2e-test-report             # Full test report with WebP images + video
```

Claude controls your actual browser — navigates, clicks, fills forms, takes screenshots, and provides **analytical observations** (not just pass/fail).

## Testing methodology

The toolkit follows a proven testing methodology:

### Evidence standards
Every test case should include:
- **Status screenshot** — clear view of the result
- **Comparison screenshot** — side-by-side if verifying sync between UI panels
- **Scroll captures** — for long content: Top, Middle, Bottom positions
- **Video recording** — `.webm` captured via CDP screencast or Playwright `recordVideo`

### Analytical approach
Tests produce **observations**, not just pass/fail:
- What worked well and what's notable
- Behavioral patterns (e.g., how the app handles edge cases)
- Comparison with prior runs to detect regressions
- Categorized issues: "System Error" vs "Design Limitation"

### Image optimization
Screenshots are converted to WebP for smaller reports:
- **Preferred:** `sharp` (Node.js) — `npm install sharp`
- **Fallback:** `ffmpeg`, `cwebp`, or `sips`

### Input handling tips
- Use `element.fill()` over `element.type()` for reliability
- Sanitize special characters (em-dashes, emojis) before keyboard simulation
- For hover-revealed elements: hover parent first, wait, then click
- For confirmation dialogs: look for a second button with the same text

## Writing custom test commands

Create `.claude/commands/my-test.md` in your project for app-specific tests. Include:

1. **Test data** — credentials, URLs, target users/accounts
2. **UI selectors** — document key element selectors discovered during testing
3. **Step-by-step flow** — the exact interaction sequence
4. **Expected results** — what "pass" looks like
5. **Analysis guidelines** — what to observe and report on

See `templates/commands/e2e-test-report.md` for a complete example.

## Repo structure

```
claude-playwright-toolkit/
├── bin/setup.mjs                  # CLI: npx claude-playwright-setup
├── link.sh                        # Local linker (no npm needed)
├── lib/
│   ├── merge-mcp-config.mjs
│   ├── copy-commands.mjs
│   ├── merge-settings.mjs
│   └── update-gitignore.mjs
├── templates/
│   ├── commands/
│   │   ├── e2e-test.md            # Interactive testing
│   │   ├── e2e-screenshot.md      # Screenshot capture
│   │   ├── e2e-report.md          # Visual QA report
│   │   └── e2e-test-report.md     # Full report with WebP + video
│   ├── settings/
│   │   ├── playwright-permissions.json
│   │   └── common-permissions.json
│   └── mcp.json
├── scripts/
│   └── chrome-debug.sh
├── package.json
└── README.md
```

## Shell alias (optional)

```bash
# Add to ~/.zshrc
alias claude-pw="~/claude-playwright-toolkit/link.sh"
alias chrome-debug="~/claude-playwright-toolkit/scripts/chrome-debug.sh"
```

Then: `cd any-project && claude-pw`

## Unlink

```bash
~/claude-playwright-toolkit/link.sh --unlink
```

## Update commands in linked projects

Just edit the templates in this repo — symlinked projects pick up changes instantly.

For npm-installed projects: `npx claude-playwright-setup --force`

## License

MIT
