import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

test("package.json declares the store-shots bin", async () => {
  const pkg = await Bun.file(
    path.join(import.meta.dir, "..", "package.json")
  ).json();
  expect(pkg.bin["store-shots"]).toBe("./src/cli.ts");
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
