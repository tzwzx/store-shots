// `store-shots init` — scaffold a working starter into the consuming project and
// (optionally) add package.json scripts. Implemented as small, pure-ish functions
// so the behavior is unit-testable against a temp directory.

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

// Where the shipped starter lives inside this package.
const SCAFFOLD_DIR = path.join(import.meta.dir, "scaffold");

// Default target, relative to the consumer's project root.
const DEFAULT_TARGET = "scripts/store-shots";

export interface InitOptions {
  force: boolean;
  noScripts: boolean;
  targetDir: string;
}

// Parse `init` argv: an optional positional targetDir plus --force / --no-scripts.
export const parseInitArgs = (args: string[]): InitOptions => {
  const options: InitOptions = { force: false, noScripts: false, targetDir: DEFAULT_TARGET };
  for (const arg of args) {
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--no-scripts") {
      options.noScripts = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      options.targetDir = arg;
    }
  }
  return options;
};

// Add store:preview / store:build to <cwd>/package.json if missing. Idempotent.
// Returns the script keys that were actually added.
export const patchPackageJson = async (cwd: string, targetDir: string): Promise<string[]> => {
  const pkgPath = path.join(cwd, "package.json");
  const pkgFile = Bun.file(pkgPath);
  if (!(await pkgFile.exists())) {
    return [];
  }
  const pkg = (await pkgFile.json()) as { scripts?: Record<string, string> };
  pkg.scripts ??= {};

  const wanted: Record<string, string> = {
    "store:preview": `bun --watch ${targetDir}/index.ts preview`,
    "store:build": `bun ${targetDir}/index.ts build`,
  };

  const added: string[] = [];
  for (const [key, value] of Object.entries(wanted)) {
    if (!(key in pkg.scripts)) {
      pkg.scripts[key] = value;
      added.push(key);
    }
  }
  if (added.length > 0) {
    await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
  return added;
};

export interface InitResult {
  addedScripts: string[];
  conflicts: string[];
  createdFiles: string[];
  message: string;
  ok: boolean;
  targetDir: string;
}

// Recursively list files (paths relative to `base`) under `dir`, including dotfiles.
const listFilesRecursive = async (dir: string, base: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(full, base)));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files;
};

// Scaffold the starter into <cwd>/<targetDir> and optionally patch package.json.
export const runInit = async (args: string[], cwd: string): Promise<InitResult> => {
  const { force, noScripts, targetDir } = parseInitArgs(args);
  const destRoot = path.join(cwd, targetDir);
  const relFiles = await listFilesRecursive(SCAFFOLD_DIR, SCAFFOLD_DIR);

  // Abort before writing anything if any destination already exists (unless --force).
  if (!force) {
    const conflicts: string[] = [];
    for (const rel of relFiles) {
      if (await Bun.file(path.join(destRoot, rel)).exists()) {
        conflicts.push(rel);
      }
    }
    if (conflicts.length > 0) {
      return {
        addedScripts: [],
        conflicts,
        createdFiles: [],
        message:
          `Aborted: ${targetDir} already contains ${conflicts.join(", ")}.\n` +
          `Nothing was written. Re-run with --force to overwrite, or pick another dir:\n` +
          `  bunx store-shots init <dir>`,
        ok: false,
        targetDir,
      };
    }
  }

  // Copy every scaffold file verbatim, creating parent dirs as needed.
  const createdFiles: string[] = [];
  for (const rel of relFiles) {
    const dest = path.join(destRoot, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await Bun.write(dest, Bun.file(path.join(SCAFFOLD_DIR, rel)));
    createdFiles.push(rel);
  }

  // Patch package.json scripts unless suppressed.
  const addedScripts = noScripts ? [] : await patchPackageJson(cwd, targetDir);
  const scriptLine = noScripts
    ? "package.json: skipped (--no-scripts)"
    : addedScripts.length > 0
      ? `package.json scripts added: ${addedScripts.join(", ")}`
      : "package.json scripts: already present";

  return {
    addedScripts,
    conflicts: [],
    createdFiles,
    message:
      `Scaffolded store-shots into ${targetDir}/\n` +
      `  Created: ${createdFiles.join(", ")}\n` +
      `  ${scriptLine}\n\n` +
      `Next steps:\n` +
      `  1. bun run store:build      # placeholders -> ${targetDir}/output/*.png (1242x2688)\n` +
      `  2. bun run store:preview    # live preview at http://localhost:4317\n` +
      `  3. Edit content/config.ts + content/template.ts, then add images to content/assets/.`,
    ok: true,
    targetDir,
  };
};
