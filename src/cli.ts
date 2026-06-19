#!/usr/bin/env bun
// store-shots command-line entry. Currently one subcommand: `init`, which
// scaffolds a working starter into the consuming project. See ./init.ts.

import { runInit } from "./init";

const [command, ...rest] = process.argv.slice(2);

if (command === "init") {
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
  console.error(`Unknown command: ${command ?? "(none)"}. Expected: init`);
  process.exit(1);
}
