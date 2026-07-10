// `store-shots init` — scaffold a working starter into the consuming project and
// (optionally) add package.json scripts. Implemented as small, pure-ish functions
// so the behavior is unit-testable against a temp directory.

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

// Where the shipped starter lives inside this package.
const SCAFFOLD_DIR = path.join(import.meta.dir, "..", "scaffold");

// Default target, relative to the consumer's project root.
const DEFAULT_TARGET = "store-shots";

export interface InitOptions {
  force: boolean;
  noCommand: boolean;
  noScripts: boolean;
  targetDir: string;
}

// Parse `init` argv: an optional positional targetDir plus --force / --no-scripts / --no-command.
export const parseInitArgs = (args: string[]): InitOptions => {
  const options: InitOptions = {
    force: false,
    noCommand: false,
    noScripts: false,
    targetDir: DEFAULT_TARGET,
  };
  for (const arg of args) {
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--no-scripts") {
      options.noScripts = true;
    } else if (arg === "--no-command") {
      options.noCommand = true;
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
export const patchPackageJson = async (
  cwd: string,
  targetDir: string
): Promise<string[]> => {
  const pkgPath = path.join(cwd, "package.json");
  const pkgFile = Bun.file(pkgPath);
  if (!(await pkgFile.exists())) {
    return [];
  }
  const pkg = (await pkgFile.json()) as { scripts?: Record<string, string> };
  pkg.scripts ??= {};

  const wanted: Record<string, string> = {
    "store:build": `bun ${targetDir}/index.ts build`,
    "store:preview": `bun --watch ${targetDir}/index.ts preview`,
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

const CLAUDE_COMMAND_REL = ".claude/commands/store-shots.md";

// Body of the Claude Code slash command (interpolates the RUNBOOK path from targetDir).
export const buildClaudeCommandContent = (targetDir: string): string => {
  const runbookPath = `${targetDir}/RUNBOOK.md`;
  return `---
description: Store screenshot loop — read ${runbookPath} and follow it
argument-hint: [task, e.g. "recapture screen-c (jp)"]
---

Read \`${runbookPath}\` and follow it end to end.

Task: $ARGUMENTS

If no task is given, run the full loop (preview -> critique -> refine -> build),
capturing missing or stale assets per the runbook's capture workflow.
Always finish with the runbook's cleanup steps.
`;
};

export type CommandWriteResult = "created" | "skipped" | "overwritten";

// Write .claude/commands/store-shots.md. An existing file is only overwritten with --force.
export const writeClaudeCommand = async (
  cwd: string,
  targetDir: string,
  force: boolean
): Promise<CommandWriteResult> => {
  const dest = path.join(cwd, CLAUDE_COMMAND_REL);
  const exists = await Bun.file(dest).exists();
  if (exists && !force) {
    return "skipped";
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await Bun.write(dest, buildClaudeCommandContent(targetDir));
  return exists ? "overwritten" : "created";
};

export interface InitResult {
  addedScripts: string[];
  commandResult: CommandWriteResult | "disabled";
  conflicts: string[];
  createdFiles: string[];
  message: string;
  ok: boolean;
  targetDir: string;
}

// Recursively list files (paths relative to `base`) under `dir`, including dotfiles.
const listFilesRecursive = async (
  dir: string,
  base: string
): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory()
        ? listFilesRecursive(full, base)
        : Promise.resolve([path.relative(base, full)]);
    })
  );
  return nested.flat();
};

// Collect scaffold files that already exist under destRoot.
const findConflicts = async (
  destRoot: string,
  relFiles: string[]
): Promise<string[]> => {
  const exists = await Promise.all(
    relFiles.map((rel) => Bun.file(path.join(destRoot, rel)).exists())
  );
  return relFiles.filter((_, index) => exists[index]);
};

// Result returned when existing files block the scaffold (no --force).
const buildConflictResult = (
  targetDir: string,
  conflicts: string[]
): InitResult => ({
  addedScripts: [],
  commandResult: "disabled",
  conflicts,
  createdFiles: [],
  message:
    `Aborted: ${targetDir} already contains ${conflicts.join(", ")}.\n` +
    `Nothing was written. Re-run with --force to overwrite, or pick another dir:\n` +
    `  bunx store-shots init <dir>`,
  ok: false,
  targetDir,
});

// Copy every scaffold file verbatim, creating parent dirs as needed.
const copyScaffold = async (
  destRoot: string,
  relFiles: string[]
): Promise<void> => {
  await Promise.all(
    relFiles.map(async (rel) => {
      const dest = path.join(destRoot, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await Bun.write(dest, Bun.file(path.join(SCAFFOLD_DIR, rel)));
    })
  );
};

// Summary line for the package.json patch step.
const describeScriptPatch = (
  noScripts: boolean,
  addedScripts: string[]
): string => {
  if (noScripts) {
    return "package.json: skipped (--no-scripts)";
  }
  return addedScripts.length > 0
    ? `package.json scripts added: ${addedScripts.join(", ")}`
    : "package.json scripts: already present";
};

// Summary line for the Claude command write step, keyed by its outcome.
const COMMAND_LINES: Record<CommandWriteResult | "disabled", string> = {
  created: `Claude command created: ${CLAUDE_COMMAND_REL}`,
  disabled: "Claude command: skipped (--no-command)",
  overwritten: `Claude command overwritten: ${CLAUDE_COMMAND_REL}`,
  skipped: `Claude command: already present (${CLAUDE_COMMAND_REL})`,
};

// Scaffold the starter into <cwd>/<targetDir> and optionally patch package.json.
export const runInit = async (
  args: string[],
  cwd: string
): Promise<InitResult> => {
  const { force, noCommand, noScripts, targetDir } = parseInitArgs(args);
  const destRoot = path.join(cwd, targetDir);
  const relFiles = await listFilesRecursive(SCAFFOLD_DIR, SCAFFOLD_DIR);

  // Abort before writing anything if any destination already exists (unless --force).
  if (!force) {
    const conflicts = await findConflicts(destRoot, relFiles);
    if (conflicts.length > 0) {
      return buildConflictResult(targetDir, conflicts);
    }
  }

  await copyScaffold(destRoot, relFiles);
  const createdFiles = relFiles;

  // Patch package.json scripts unless suppressed.
  const addedScripts = noScripts ? [] : await patchPackageJson(cwd, targetDir);
  const commandResult = noCommand
    ? "disabled"
    : await writeClaudeCommand(cwd, targetDir, force);

  return {
    addedScripts,
    commandResult,
    conflicts: [],
    createdFiles,
    message:
      `Scaffolded store-shots into ${targetDir}/\n` +
      `  Created: ${createdFiles.join(", ")}\n` +
      `  ${describeScriptPatch(noScripts, addedScripts)}\n` +
      `  ${COMMAND_LINES[commandResult]}\n\n` +
      `Next steps:\n` +
      `  1. bun run store:build      # placeholders -> ${targetDir}/output/*.png (1242x2688)\n` +
      `  2. bun run store:preview    # live preview at http://localhost:4317\n` +
      `  3. Edit content/config.ts + content/template.ts\n` +
      `  4. Capture real screenshots per ${targetDir}/RUNBOOK.md, then drop them in content/assets/.\n` +
      `  5. In Claude Code, run /store-shots to drive the agent loop.`,
    ok: true,
    targetDir,
  };
};
