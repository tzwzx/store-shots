# Contributing

Thanks for your interest in store-shots! Issues and pull requests are welcome.

## Development setup

```sh
bun install        # install dev dependencies (Bun 1.3+)
bun test           # run the test suite
bun run typecheck  # tsc --noEmit
```

The engine has **zero runtime dependencies** — please keep it that way. Only Bun built-ins and an
external Chrome are allowed at runtime.

## Project layout

- `src/` — the engine (published API + `store-shots init` CLI)
- `scaffold/` — the starter copied verbatim into consumer projects by `init`
- `test/` — `bun test` suite; `test/setup.ts` registers happy-dom globally

## Guidelines

- Add or update tests for any behavior change (`bun test` must pass).
- Keep the engine ↔ content contract minimal: the engine must only ever depend on `slide.id`
  (see `src/types.ts`).
- CI runs typecheck + tests on every push and pull request.
