#!/bin/bash
# Launch Chrome with remote debugging for Playwright MCP
# Usage: ~/vim/claude-config/scripts/chrome-debug.sh [port]

PORT="${1:-9222}"

if [[ "$OSTYPE" == "darwin"* ]]; then
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --remote-debugging-port="$PORT" \
    "$@"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  google-chrome --remote-debugging-port="$PORT" "$@"
else
  echo "Unsupported OS: $OSTYPE"
  exit 1
fi
