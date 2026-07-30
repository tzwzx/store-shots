import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CLI_PATH = path.join(import.meta.dir, "..", "src", "cli.ts");
const PKG_PATH = path.join(import.meta.dir, "..", "package.json");

// Run the CLI in a child process and capture both streams plus the exit code.
const runCli = async (...args: string[]) => {
  const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
    stderr: "pipe",
    stdout: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stderr, stdout };
};

// Every line the usage text is expected to document.
const expectUsage = (text: string) => {
  expect(text).toContain("Usage:");
  expect(text).toContain("store-shots");
  expect(text).toContain("init [dir]");
  expect(text).toContain("--force");
  expect(text).toContain("--no-scripts");
  expect(text).toContain("--no-command");
  expect(text).toContain("-h, --help");
  expect(text).toContain("-v, --version");
};

test("package.json declares the store-shots bin", async () => {
  const pkg = await Bun.file(
    path.join(import.meta.dir, "..", "package.json")
  ).json();
  // No leading "./" — npm normalizes it away at publish time and warns about it.
  expect(pkg.bin["store-shots"]).toBe("src/cli.ts");
});

test("cli.ts starts with the bun shebang", async () => {
  const source = await Bun.file(
    path.join(import.meta.dir, "..", "src", "cli.ts")
  ).text();
  expect(source.startsWith("#!/usr/bin/env bun\n")).toBe(true);
});

test("running cli.ts init scaffolds into the target and exits 0", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "store-shots-cli-"));
  writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "demo" })
  );
  const proc = Bun.spawn(
    ["bun", path.join(import.meta.dir, "..", "src", "cli.ts"), "init"],
    { cwd: dir }
  );
  const code = await proc.exited;
  expect(code).toBe(0);
  expect(await Bun.file(path.join(dir, "store-shots/index.ts")).exists()).toBe(
    true
  );
  rmSync(dir, { force: true, recursive: true });
});

test("running cli.ts with an unknown command exits 1", async () => {
  const proc = Bun.spawn(
    ["bun", path.join(import.meta.dir, "..", "src", "cli.ts"), "wat"],
    {
      stderr: "pipe",
      stdout: "pipe",
    }
  );
  const code = await proc.exited;
  expect(code).toBe(1);
});

test("--help prints usage to stdout and exits 0", async () => {
  const { code, stderr, stdout } = await runCli("--help");
  expect(code).toBe(0);
  expect(stderr).toBe("");
  expectUsage(stdout);
});

test("-h behaves like --help", async () => {
  const { code, stdout } = await runCli("-h");
  expect(code).toBe(0);
  expectUsage(stdout);
});

test("--version prints the package.json version and exits 0", async () => {
  const pkg = (await Bun.file(PKG_PATH).json()) as { version: string };
  const { code, stderr, stdout } = await runCli("--version");
  expect(code).toBe(0);
  expect(stderr).toBe("");
  expect(stdout).toBe(`${pkg.version}\n`);
});

test("-v behaves like --version", async () => {
  const pkg = (await Bun.file(PKG_PATH).json()) as { version: string };
  const { code, stdout } = await runCli("-v");
  expect(code).toBe(0);
  expect(stdout).toBe(`${pkg.version}\n`);
});

test("running cli.ts without arguments prints usage and exits 1", async () => {
  const { code, stderr } = await runCli();
  expect(code).toBe(1);
  expectUsage(stderr);
});

test("an unknown command reports it and points at --help", async () => {
  const { code, stderr } = await runCli("wat");
  expect(code).toBe(1);
  expect(stderr).toContain("Unknown command: wat");
  expect(stderr).toContain("Run `store-shots --help` for usage.");
});
