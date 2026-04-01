# claude-playwright-toolkit

One command to give Claude Code full browser testing powers in any project.

Connects to your real Chrome browser — no new browser, no auth issues, no test files in your repo.

## What it sets up

| File | Purpose |
|------|---------|
| `.mcp.json` | Playwright MCP server (merges with existing) |
| `.claude/commands/e2e-test.md` | `/e2e-test` — interactive browser testing |
| `.claude/commands/e2e-screenshot.md` | `/e2e-screenshot` — capture page screenshots |
| `.claude/commands/e2e-report.md` | `/e2e-report` — full visual QA report |
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
/e2e-test                    # Test all pages
/e2e-test /dashboard         # Test specific page
/e2e-screenshot              # Capture all pages
/e2e-report                  # Full QA report (desktop + mobile)
```

Claude controls your actual browser — navigates, clicks, fills forms, takes screenshots.

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
│   │   ├── e2e-test.md
│   │   ├── e2e-screenshot.md
│   │   └── e2e-report.md
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
