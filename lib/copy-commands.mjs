import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates", "commands");

export function copyCommands({ projectRoot, baseUrl, pages, force, dryRun }) {
  const targetDir = join(projectRoot, ".claude", "commands");

  if (!dryRun) {
    mkdirSync(targetDir, { recursive: true });
  }

  const templates = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".md"));

  for (const file of templates) {
    const targetPath = join(targetDir, file);

    if (existsSync(targetPath) && !force) {
      console.log(`  [skip] .claude/commands/${file} — already exists (use --force to overwrite)`);
      continue;
    }

    let content = readFileSync(join(TEMPLATES_DIR, file), "utf8");

    // Replace base URL placeholder
    content = content.replace(/\{\{BASE_URL\}\}/g, baseUrl);

    // Replace pages placeholder if custom pages provided
    if (pages && pages.length > 0) {
      const pagesList = pages
        .map((p) => `- \`${p.path}\` — ${p.name}`)
        .join("\n");
      content = content.replace(/\{\{PAGES\}\}/g, pagesList);
    } else {
      // Default: use root path
      content = content.replace(
        /\{\{PAGES\}\}/g,
        `- \`/\` — Home page\n\nAdd your pages here. Edit this file to customize.`
      );
    }

    if (dryRun) {
      console.log(`  [dry-run] Would ${existsSync(targetPath) ? "overwrite" : "create"} .claude/commands/${file}`);
      continue;
    }

    writeFileSync(targetPath, content, "utf8");
    console.log(`  [created] .claude/commands/${file}`);
  }
}
