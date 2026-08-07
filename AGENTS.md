# AGENTS.md

## Cursor Cloud specific instructions

This repo is the `@tzwzx/store-shots` package: a **Bun-only** TypeScript engine that generates App Store screenshot PNGs (live preview == final render). Standard dev commands live in `CONTRIBUTING.md` and `package.json` `scripts`; example usage is in `examples/showcase/index.ts`. Notes below are only the non-obvious gotchas.

### Runtime / toolchain

- **Bun (not Node) runs everything.** `bun` is installed at `~/.bun/bin` and added to `~/.bashrc` for interactive shells. Non-interactive scripts should call it by absolute path (`~/.bun/bin/bun`). The startup update script runs `bun install`.
- **Lint needs a newer Node than the default one on `PATH`.** `bun run lint` runs `oxfmt`, which loads the `.ts` config files (`oxfmt.config.ts`, `oxlint.config.ts`) via Node and requires Node `^20.19.0 || >=22.18.0`. The base image's `/exec-daemon/node` is `v22.14.0` and fails with _"TypeScript config files require Node.js ..."_. nvm's default `v22.22.2` satisfies it and is sourced by `~/.bashrc`, so lint works in a normal interactive shell. If lint fails with that error, put the nvm node ahead of `/exec-daemon/node` on `PATH` (e.g. `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`). `bun test` and `bun run typecheck` do **not** need this.

### Running / testing

- Lint / typecheck / test: see `CONTRIBUTING.md` (`bun run codesweep:check` runs all in parallel, same as CI). Tests use `bun test` with happy-dom (no browser).
- **Preview server** (hot-reloading gallery, no Chrome needed): `bun examples/showcase/index.ts preview` → http://localhost:4317 (directions example is on 4318). Override with `PORT`.
- **Build / PNG capture** needs a real Chrome. Chrome is preinstalled; pass `CHROME_PATH=/usr/bin/google-chrome-stable bun examples/showcase/index.ts build`. Output PNGs land in `examples/showcase/output/` (App Store portrait, 1320x2868).
