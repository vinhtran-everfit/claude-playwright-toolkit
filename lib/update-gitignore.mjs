import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export function updateGitignore({ projectRoot, dryRun }) {
  const gitignorePath = join(projectRoot, ".gitignore");
  const entry = ".playwright-mcp/";
  const block = `\n# Playwright MCP temp files\n${entry}\n`;

  if (!existsSync(gitignorePath)) {
    if (dryRun) {
      console.log(`  [dry-run] Would create .gitignore with ${entry}`);
      return;
    }
    writeFileSync(gitignorePath, block.trimStart(), "utf8");
    console.log(`  [created] .gitignore — added ${entry}`);
    return;
  }

  const content = readFileSync(gitignorePath, "utf8");

  if (content.includes(entry)) {
    console.log(`  [skip] .gitignore — ${entry} already present`);
    return;
  }

  if (dryRun) {
    console.log(`  [dry-run] Would append ${entry} to .gitignore`);
    return;
  }

  const suffix = content.endsWith("\n") ? block.slice(1) : block;
  writeFileSync(gitignorePath, content + suffix, "utf8");
  console.log(`  [updated] .gitignore — added ${entry}`);
}
