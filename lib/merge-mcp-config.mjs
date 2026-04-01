import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export function mergeMcpConfig({ projectRoot, cdpPort, force, dryRun }) {
  const mcpPath = join(projectRoot, ".mcp.json");

  const newServer = {
    playwright: {
      command: "npx",
      args: [
        "@playwright/mcp@latest",
        "--cdp-endpoint",
        `http://localhost:${cdpPort}`,
      ],
    },
  };

  let existing = {};
  let fileExists = false;

  if (existsSync(mcpPath)) {
    fileExists = true;
    try {
      existing = JSON.parse(readFileSync(mcpPath, "utf8"));
    } catch {
      console.log(`  Warning: Could not parse existing .mcp.json, will create new one`);
      existing = {};
    }
  }

  if (!existing.mcpServers) {
    existing.mcpServers = {};
  }

  if (existing.mcpServers.playwright && !force) {
    console.log(`  [skip] .mcp.json — playwright server already configured (use --force to overwrite)`);
    return;
  }

  existing.mcpServers.playwright = newServer.playwright;

  if (dryRun) {
    console.log(`  [dry-run] Would ${fileExists ? "update" : "create"} .mcp.json`);
    return;
  }

  writeFileSync(mcpPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
  console.log(`  [${fileExists ? "updated" : "created"}] .mcp.json — added playwright MCP server (CDP port ${cdpPort})`);
}
