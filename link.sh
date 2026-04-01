#!/bin/bash
# claude-playwright-toolkit/link.sh
# Links toolkit configs into any project — no npm install needed.
#
# Usage:
#   ~/vim/claude-playwright-toolkit/link.sh              # current directory
#   ~/vim/claude-playwright-toolkit/link.sh /path/to/repo
#   ~/vim/claude-playwright-toolkit/link.sh --unlink

set -e

TOOLKIT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-.}"

# Handle --unlink
if [ "$TARGET" = "--unlink" ]; then
  TARGET="${2:-.}"
  TARGET="$(cd "$TARGET" && pwd)"
  echo "Unlinking toolkit from: $TARGET"
  for cmd in "$TARGET/.claude/commands"/e2e-*.md; do
    [ -L "$cmd" ] && rm "$cmd" && echo "  removed $(basename "$cmd")"
  done
  echo "Done. (.mcp.json and settings.json were merged — edit manually if needed)"
  exit 0
fi

TARGET="$(cd "$TARGET" && pwd)"
echo ""
echo "  Claude Playwright Toolkit — linking into: $TARGET"
echo "  Source: $TOOLKIT_DIR"
echo ""

# 1. Symlink commands
mkdir -p "$TARGET/.claude/commands"
for cmd in "$TOOLKIT_DIR/templates/commands"/*.md; do
  name="$(basename "$cmd")"
  dest="$TARGET/.claude/commands/$name"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    echo "  [skip] .claude/commands/$name — file exists (not a symlink, use --force via node setup)"
  else
    ln -sf "$cmd" "$dest"
    echo "  [linked] .claude/commands/$name"
  fi
done

# 2. Merge .mcp.json
if [ -f "$TARGET/.mcp.json" ]; then
  if grep -q '"playwright"' "$TARGET/.mcp.json" 2>/dev/null; then
    echo "  [skip] .mcp.json — playwright already configured"
  else
    node -e "
      const fs = require('fs');
      const existing = JSON.parse(fs.readFileSync('$TARGET/.mcp.json', 'utf8'));
      const pw = JSON.parse(fs.readFileSync('$TOOLKIT_DIR/templates/mcp.json', 'utf8'));
      existing.mcpServers = { ...existing.mcpServers, ...pw.mcpServers };
      fs.writeFileSync('$TARGET/.mcp.json', JSON.stringify(existing, null, 2) + '\n');
    "
    echo "  [merged] .mcp.json — added playwright server"
  fi
else
  cp "$TOOLKIT_DIR/templates/mcp.json" "$TARGET/.mcp.json"
  echo "  [created] .mcp.json"
fi

# 3. Merge .claude/settings.json — add permissions
SETTINGS="$TARGET/.claude/settings.json"
node -e "
  const fs = require('fs');
  const pw = JSON.parse(fs.readFileSync('$TOOLKIT_DIR/templates/settings/playwright-permissions.json', 'utf8'));
  const common = JSON.parse(fs.readFileSync('$TOOLKIT_DIR/templates/settings/common-permissions.json', 'utf8'));
  const allNew = [...pw.permissions.allow, ...common.permissions.allow];

  let settings = {};
  const exists = fs.existsSync('$SETTINGS');
  if (exists) {
    try { settings = JSON.parse(fs.readFileSync('$SETTINGS', 'utf8')); } catch {}
  }
  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];

  const existing = new Set(settings.permissions.allow);
  const toAdd = allNew.filter(p => !existing.has(p));

  if (toAdd.length === 0) {
    console.log('  [skip] .claude/settings.json — permissions already present');
  } else {
    settings.permissions.allow.push(...toAdd);
    fs.writeFileSync('$SETTINGS', JSON.stringify(settings, null, 2) + '\n');
    console.log('  [' + (exists ? 'merged' : 'created') + '] .claude/settings.json — added ' + toAdd.length + ' permissions');
  }
"

# 4. Update .gitignore
if [ -f "$TARGET/.gitignore" ]; then
  if grep -q '.playwright-mcp/' "$TARGET/.gitignore"; then
    echo "  [skip] .gitignore — .playwright-mcp/ already present"
  else
    printf "\n# Playwright MCP temp files\n.playwright-mcp/\n" >> "$TARGET/.gitignore"
    echo "  [updated] .gitignore — added .playwright-mcp/"
  fi
else
  printf "# Playwright MCP temp files\n.playwright-mcp/\n" > "$TARGET/.gitignore"
  echo "  [created] .gitignore"
fi

echo ""
echo "  All set! What was configured:"
echo "    Commands:     /e2e-test, /e2e-screenshot, /e2e-report (symlinked)"
echo "    MCP:          Playwright browser control via CDP :9222"
echo "    Permissions:  All playwright + common dev tools auto-allowed"
echo ""
echo "  Next: Launch Chrome with --remote-debugging-port=9222, then restart Claude Code."
echo ""
