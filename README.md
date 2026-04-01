# claude-playwright-toolkit

Gives Claude Code the ability to test your web app in your real browser — no test files needed.

Installs Playwright MCP server config and Claude Code commands (`/e2e-test`, `/e2e-screenshot`, `/e2e-report`) into any project.

## How it works

1. You launch Chrome with remote debugging enabled
2. Claude Code connects to your browser via the Playwright MCP server
3. You use slash commands to tell Claude to navigate, click, test, and screenshot your app
4. Claude sees your actual logged-in session — no auth setup needed

## Install

### Option A: npm install (for shared/public use)

```bash
# From GitHub
npm install --save-dev github:YOUR_USERNAME/claude-playwright-toolkit

# Run setup
npx claude-playwright-setup
```

### Option B: Local use without install (recommended for personal use)

If you also use [claude-config](https://github.com/YOUR_USERNAME/claude-config), just run:

```bash
~/vim/claude-config/link.sh
```

This symlinks commands + merges MCP config + adds permissions — no npm install needed.

Or run the toolkit CLI directly with node:

```bash
node /path/to/claude-playwright-toolkit/bin/setup.mjs --base-url http://localhost:3000
```

## Setup Options

```bash
npx claude-playwright-setup [options]

Options:
  --base-url <url>    Base URL of your app (default: http://localhost:3000)
  --cdp-port <port>   Chrome DevTools Protocol port (default: 9222)
  --pages <json>      JSON array of pages to test
  --force             Overwrite existing command files
  --dry-run           Show what would change without writing
```

### Custom pages example

```bash
npx claude-playwright-setup \
  --base-url http://localhost:5173 \
  --pages '[{"name":"Dashboard","path":"/dashboard"},{"name":"Settings","path":"/settings"}]'
```

## What it creates

| File | Purpose |
|------|---------|
| `.mcp.json` | Playwright MCP server config (merges with existing) |
| `.claude/commands/e2e-test.md` | `/e2e-test` — interactive browser testing |
| `.claude/commands/e2e-screenshot.md` | `/e2e-screenshot` — capture page screenshots |
| `.claude/commands/e2e-report.md` | `/e2e-report` — full visual QA report |
| `.gitignore` | Adds `.playwright-mcp/` entry |

## Usage

### 1. Launch Chrome with remote debugging

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### 2. Log in to your app in that Chrome window

### 3. Restart Claude Code (so MCP server connects)

### 4. Use the commands

```
/e2e-test          # Test all pages
/e2e-test /login   # Test a specific page
/e2e-screenshot    # Capture all pages
/e2e-report        # Full QA report with mobile + desktop
```

Claude will control your actual browser — navigating pages, clicking elements, filling forms, and taking screenshots as evidence.

## Updating

To refresh commands after a toolkit update:

```bash
npx claude-playwright-setup --force
```

## Related

- **[claude-config](https://github.com/YOUR_USERNAME/claude-config)** — Centralized Claude Code config folder. Includes this toolkit's commands + MCP + permissions. One `link.sh` to set up any project without npm install.

## License

MIT
