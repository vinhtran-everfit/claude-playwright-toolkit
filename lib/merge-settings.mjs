import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_DIR = join(__dirname, "..", "templates", "settings");

export function mergeSettings({ projectRoot, force, dryRun }) {
  const settingsPath = join(projectRoot, ".claude", "settings.json");

  // Ensure .claude directory exists
  if (!dryRun) {
    mkdirSync(join(projectRoot, ".claude"), { recursive: true });
  }

  const pwPerms = JSON.parse(
    readFileSync(join(SETTINGS_DIR, "playwright-permissions.json"), "utf8"),
  );
  const commonPerms = JSON.parse(
    readFileSync(join(SETTINGS_DIR, "common-permissions.json"), "utf8"),
  );

  const allNewPerms = [
    ...pwPerms.permissions.allow,
    ...commonPerms.permissions.allow,
  ];

  if (existsSync(settingsPath)) {
    let settings;
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      settings = {};
    }

    if (!settings.permissions) settings.permissions = {};
    if (!settings.permissions.allow) settings.permissions.allow = [];

    const existing = new Set(settings.permissions.allow);
    const toAdd = allNewPerms.filter((p) => !existing.has(p));

    if (toAdd.length === 0 && !force) {
      console.log(
        `  [skip] .claude/settings.json — permissions already present`,
      );
      return;
    }

    if (dryRun) {
      console.log(
        `  [dry-run] Would add ${toAdd.length} permissions to .claude/settings.json`,
      );
      return;
    }

    settings.permissions.allow.push(...toAdd);
    writeFileSync(
      settingsPath,
      JSON.stringify(settings, null, 2) + "\n",
      "utf8",
    );
    console.log(
      `  [merged] .claude/settings.json — added ${toAdd.length} permissions`,
    );
  } else {
    if (dryRun) {
      console.log(
        `  [dry-run] Would create .claude/settings.json with ${allNewPerms.length} permissions`,
      );
      return;
    }

    const settings = {
      permissions: {
        allow: allNewPerms,
      },
    };
    writeFileSync(
      settingsPath,
      JSON.stringify(settings, null, 2) + "\n",
      "utf8",
    );
    console.log(
      `  [created] .claude/settings.json — ${allNewPerms.length} permissions`,
    );
  }
}
