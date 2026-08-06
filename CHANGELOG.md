# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-08-06

### Added

- The scaffolded `RUNBOOK.md` now opens its loop with a **"Choose a direction"** step — sketch 2–3 contrasting layout directions on a single slide before refining — and its design brief gains a `Layout direction` row, so generated sets stop converging on the starter's look.
- [`examples/directions`](https://github.com/tzwzx/store-shots/tree/main/examples/directions) — an art-direction sampler rendering the same fictional app in three contrasting looks (full-bleed, editorial, collage) with zero engine changes, referenced from the runbook and the READMEs.

### Changed

- The scaffolded `template.ts` and `config.ts` comments now show how slides can branch into completely different compositions via a slide field (e.g. `layout`).

## [1.0.0] - 2026-07-30

### Added

- Initial release.
- `runPreview` — a hot-reloading preview server that renders every slide through the same `/slide/:id` route the build screenshots, so the preview and the submitted image can never drift. Serves a gallery with optional spec tables alongside the single-slide view.
- `runBuild` — renders the slides to App Store-ready PNGs with headless Chrome (auto-detected on macOS, Linux, and Windows, or set `CHROME_PATH`), plus an `index.html` contact sheet. Accepts specific slide ids to rebuild a subset.
- `store-shots init` CLI that scaffolds a working starter into the consuming project (`content/config.ts`, `content/template.ts`, `content/assets/`, a tiny `index.ts` CLI, and `RUNBOOK.md`), adds `store:preview` / `store:build` scripts, and generates `.claude/commands/store-shots.md` for Claude Code. Existing files are never overwritten; `--force`, `--no-scripts`, `--no-command`, and a custom target directory are supported.
- Library API: `CANVAS`, `expandSlides`, and the `StoreShotsContent`, `SlideBase`, `SpecRow`, `RenderContext`, `Asset`, and `Canvas` types.
- `@tzwzx/store-shots/html` — `escapeHtml` and `accentHtml` helpers for templates.
- `@tzwzx/store-shots/testing` — `makeTestContext`, a render-context test double for unit-testing templates.

[Unreleased]: https://github.com/tzwzx/store-shots/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/tzwzx/store-shots/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tzwzx/store-shots/releases/tag/v1.0.0
