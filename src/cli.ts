#!/usr/bin/env bun
// store-shots command-line entry. Currently one subcommand: `init`, which
// scaffolds a working starter into the consuming project. See ./init.ts.

import { runInit } from "./init";

const USAGE = `store-shots — generate App Store screenshots where the live preview is the exact final output.

Usage:
  store-shots <command> [options]

Commands:
  init [dir]      Scaffold the starter into [dir] (default: store-shots)

init options:
  --force         Overwrite files that already exist
  --no-scripts    Skip adding store:preview / store:build to package.json
  --no-command    Skip writing .claude/commands/store-shots.md

Options:
  -h, --help      Show this help and exit
  -v, --version   Show the version and exit

Requires Bun — this package is Bun-only.`;

// Read the version at runtime so it always matches the published package.
const readVersion = async (): Promise<string> => {
  const pkg = (await Bun.file(
    new URL("../package.json", import.meta.url)
  ).json()) as {
    version: string;
  };
  return pkg.version;
};

const [command, ...rest] = process.argv.slice(2);

if (command === "--help" || command === "-h") {
  console.log(USAGE);
} else if (command === "--version" || command === "-v") {
  console.log(await readVersion());
} else if (command === undefined) {
  console.error(USAGE);
  process.exit(1);
} else if (command === "init") {
  try {
    const result = await runInit(rest, process.cwd());
    console.log(result.message);
    if (!result.ok) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
} else {
  console.error(
    `Unknown command: ${command}\nRun \`store-shots --help\` for usage.`
  );
  process.exit(1);
}
