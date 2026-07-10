import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseInitArgs, patchPackageJson, runInit, buildClaudeCommandContent, writeClaudeCommand } from "../src/init";

test("parseInitArgs defaults to store-shots with no flags", () => {
  const opts = parseInitArgs([]);
  expect(opts).toEqual({ force: false, noCommand: false, noScripts: false, targetDir: "store-shots" });
});

test("parseInitArgs reads a positional target dir", () => {
  expect(parseInitArgs(["scripts/shots"]).targetDir).toBe("scripts/shots");
});

test("parseInitArgs reads --force and --no-scripts", () => {
  const opts = parseInitArgs(["custom", "--force", "--no-scripts"]);
  expect(opts).toEqual({ force: true, noCommand: false, noScripts: true, targetDir: "custom" });
});

test("parseInitArgs reads --no-command", () => {
  const opts = parseInitArgs(["--no-command"]);
  expect(opts.noCommand).toBe(true);
});

test("parseInitArgs throws on an unknown flag", () => {
  expect(() => parseInitArgs(["--bogus"])).toThrow("Unknown flag: --bogus");
});

const tempProject = (pkg: unknown): string => {
  const dir = mkdtempSync(join(tmpdir(), "store-shots-"));
  if (pkg !== undefined) {
    writeFileSync(join(dir, "package.json"), JSON.stringify(pkg));
  }
  return dir;
};

test("patchPackageJson adds both scripts when absent", async () => {
  const dir = tempProject({ name: "demo" });
  const added = await patchPackageJson(dir, "store-shots");
  expect(added).toEqual(["store:preview", "store:build"]);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  expect(pkg.scripts["store:preview"]).toBe("bun --watch store-shots/index.ts preview");
  expect(pkg.scripts["store:build"]).toBe("bun store-shots/index.ts build");
  rmSync(dir, { force: true, recursive: true });
});

test("patchPackageJson is idempotent on a second run", async () => {
  const dir = tempProject({ name: "demo" });
  await patchPackageJson(dir, "store-shots");
  const added = await patchPackageJson(dir, "store-shots");
  expect(added).toEqual([]);
  rmSync(dir, { force: true, recursive: true });
});

test("patchPackageJson leaves an existing store:build untouched", async () => {
  const dir = tempProject({ name: "demo", scripts: { "store:build": "my own command" } });
  const added = await patchPackageJson(dir, "store-shots");
  expect(added).toEqual(["store:preview"]);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  expect(pkg.scripts["store:build"]).toBe("my own command");
  rmSync(dir, { force: true, recursive: true });
});

test("patchPackageJson reflects a custom target dir in the script paths", async () => {
  const dir = tempProject({ name: "demo" });
  await patchPackageJson(dir, "tools/shots");
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  expect(pkg.scripts["store:build"]).toBe("bun tools/shots/index.ts build");
  rmSync(dir, { force: true, recursive: true });
});

test("patchPackageJson is a no-op when package.json is missing", async () => {
  const dir = tempProject(undefined);
  const added = await patchPackageJson(dir, "store-shots");
  expect(added).toEqual([]);
  rmSync(dir, { force: true, recursive: true });
});

const SCAFFOLD_FILES = [
  "RUNBOOK.md",
  "content/config.ts",
  "content/template.ts",
  "content/index.ts",
  "index.ts",
  "content/assets/.gitkeep",
];

test("runInit scaffolds every starter file and adds scripts", async () => {
  const dir = tempProject({ name: "demo" });
  const result = await runInit([], dir);
  expect(result.ok).toBe(true);
  for (const rel of SCAFFOLD_FILES) {
    expect(await Bun.file(join(dir, "store-shots", rel)).exists()).toBe(true);
  }
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  expect(pkg.scripts["store:preview"]).toBe("bun --watch store-shots/index.ts preview");
  expect(pkg.scripts["store:build"]).toBe("bun store-shots/index.ts build");
  rmSync(dir, { force: true, recursive: true });
});

test("runInit aborts without writing when a destination file exists", async () => {
  const dir = tempProject({ name: "demo" });
  mkdirSync(join(dir, "store-shots/content"), { recursive: true });
  writeFileSync(join(dir, "store-shots/content/config.ts"), "PRE-EXISTING");
  const result = await runInit([], dir);
  expect(result.ok).toBe(false);
  expect(result.conflicts).toContain("content/config.ts");
  // The existing file is untouched and package.json is NOT patched.
  expect(readFileSync(join(dir, "store-shots/content/config.ts"), "utf8")).toBe("PRE-EXISTING");
  expect(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).scripts).toBeUndefined();
  rmSync(dir, { force: true, recursive: true });
});

test("runInit --force overwrites and stays idempotent on scripts", async () => {
  const dir = tempProject({ name: "demo" });
  await runInit([], dir);
  const result = await runInit(["--force"], dir);
  expect(result.ok).toBe(true);
  expect(result.addedScripts).toEqual([]);
  rmSync(dir, { force: true, recursive: true });
});

test("runInit --no-scripts leaves package.json untouched", async () => {
  const dir = tempProject({ name: "demo" });
  const result = await runInit(["--no-scripts"], dir);
  expect(result.ok).toBe(true);
  expect(JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).scripts).toBeUndefined();
  rmSync(dir, { force: true, recursive: true });
});

test("runInit honors a custom target dir", async () => {
  const dir = tempProject({ name: "demo" });
  const result = await runInit(["tools/shots"], dir);
  expect(result.ok).toBe(true);
  expect(await Bun.file(join(dir, "tools/shots/index.ts")).exists()).toBe(true);
  rmSync(dir, { force: true, recursive: true });
});

test("buildClaudeCommandContent interpolates targetDir in runbook path", () => {
  const content = buildClaudeCommandContent("tools/shots");
  expect(content).toContain("tools/shots/RUNBOOK.md");
  expect(content).not.toContain("store-shots/RUNBOOK.md");
});

test("writeClaudeCommand creates store-shots command file", async () => {
  const dir = tempProject({ name: "demo" });
  const result = await writeClaudeCommand(dir, "store-shots", false);
  expect(result).toBe("created");
  const content = readFileSync(join(dir, ".claude/commands/store-shots.md"), "utf8");
  expect(content).toContain("store-shots/RUNBOOK.md");
  rmSync(dir, { force: true, recursive: true });
});

test("writeClaudeCommand skips when file exists without --force", async () => {
  const dir = tempProject({ name: "demo" });
  mkdirSync(join(dir, ".claude/commands"), { recursive: true });
  writeFileSync(join(dir, ".claude/commands/store-shots.md"), "CUSTOM");
  const result = await writeClaudeCommand(dir, "store-shots", false);
  expect(result).toBe("skipped");
  expect(readFileSync(join(dir, ".claude/commands/store-shots.md"), "utf8")).toBe("CUSTOM");
  rmSync(dir, { force: true, recursive: true });
});

test("writeClaudeCommand overwrites with --force", async () => {
  const dir = tempProject({ name: "demo" });
  mkdirSync(join(dir, ".claude/commands"), { recursive: true });
  writeFileSync(join(dir, ".claude/commands/store-shots.md"), "CUSTOM");
  const result = await writeClaudeCommand(dir, "tools/shots", true);
  expect(result).toBe("overwritten");
  expect(readFileSync(join(dir, ".claude/commands/store-shots.md"), "utf8")).toContain(
    "tools/shots/RUNBOOK.md",
  );
  rmSync(dir, { force: true, recursive: true });
});

test("runInit creates Claude command by default", async () => {
  const dir = tempProject({ name: "demo" });
  const result = await runInit([], dir);
  expect(result.ok).toBe(true);
  expect(result.commandResult).toBe("created");
  expect(await Bun.file(join(dir, ".claude/commands/store-shots.md")).exists()).toBe(true);
  rmSync(dir, { force: true, recursive: true });
});

test("runInit --no-command skips Claude command", async () => {
  const dir = tempProject({ name: "demo" });
  const result = await runInit(["--no-command"], dir);
  expect(result.ok).toBe(true);
  expect(result.commandResult).toBe("disabled");
  expect(await Bun.file(join(dir, ".claude/commands/store-shots.md")).exists()).toBe(false);
  rmSync(dir, { force: true, recursive: true });
});

test("runInit custom targetDir interpolates runbook path in Claude command", async () => {
  const dir = tempProject({ name: "demo" });
  await runInit(["tools/shots"], dir);
  const content = readFileSync(join(dir, ".claude/commands/store-shots.md"), "utf8");
  expect(content).toContain("tools/shots/RUNBOOK.md");
  rmSync(dir, { force: true, recursive: true });
});
