#!/usr/bin/env node

import { mergeMcpConfig } from "../lib/merge-mcp-config.mjs";
import { copyCommands } from "../lib/copy-commands.mjs";
import { updateGitignore } from "../lib/update-gitignore.mjs";
import { resolve } from "path";

const args = process.argv.slice(2);

function getFlag(name, defaultValue) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return defaultValue;
  return args[idx + 1] || defaultValue;
}

const hasFlag = (name) => args.includes(`--${name}`);

if (hasFlag("help") || hasFlag("h")) {
  console.log(`
  claude-playwright-setup — Set up Claude Code + Playwright MCP for E2E testing

  Usage:
    npx claude-playwright-setup [options]

  Options:
    --base-url <url>    Base URL of your app (default: http://localhost:3000)
    --cdp-port <port>   Chrome DevTools Protocol port (default: 9222)
    --pages <json>      JSON array of pages, e.g. '[{"name":"Home","path":"/"}]'
    --force             Overwrite existing command files
    --dry-run           Show what would be changed without writing
    --help              Show this help message

  Examples:
    npx claude-playwright-setup
    npx claude-playwright-setup --base-url http://localhost:5173
    npx claude-playwright-setup --cdp-port 9333 --force
  `);
  process.exit(0);
}

const baseUrl = getFlag("base-url", "http://localhost:3000");
const cdpPort = getFlag("cdp-port", "9222");
const pagesRaw = getFlag("pages", null);
const force = hasFlag("force");
const dryRun = hasFlag("dry-run");

let pages = null;
if (pagesRaw) {
  try {
    pages = JSON.parse(pagesRaw);
  } catch {
    console.error("Error: --pages must be valid JSON array");
    process.exit(1);
  }
}

const projectRoot = resolve(process.cwd());

console.log(`\n  Claude Playwright Toolkit Setup`);
console.log(`  ================================`);
console.log(`  Project:  ${projectRoot}`);
console.log(`  Base URL: ${baseUrl}`);
console.log(`  CDP Port: ${cdpPort}`);
if (dryRun) console.log(`  Mode:     DRY RUN (no files will be written)`);
console.log();

const config = { projectRoot, baseUrl, cdpPort, pages, force, dryRun };

mergeMcpConfig(config);
copyCommands(config);
updateGitignore(config);

console.log(`\n  Done! Next steps:`);
console.log(`  1. Launch Chrome with: google-chrome --remote-debugging-port=${cdpPort}`);
console.log(`     Or on macOS: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${cdpPort}`);
console.log(`  2. Restart Claude Code to pick up the new MCP config`);
console.log(`  3. Use /e2e-test, /e2e-screenshot, or /e2e-report commands\n`);
