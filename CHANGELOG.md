# Changelog

All notable changes to bluff-code. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-05-04

Feature-complete release.

### Added
- Comprehensive README with examples, CLI reference, and architecture overview
- `CHANGELOG.md` (this file)
- Build scripts: `bun run build` (JS bundle), `bun run build:binary` (single-binary via `bun build --compile`)

## [0.8.0] — internal

### Added
- Cosmetic `/init` slash command — fakes scanning the repo and writing CLAUDE.md
- Cosmetic `/plan` slash command — enters fake plan mode with markdown phases and approval prompt
- `Write` tool with `Created <path> (N lines)` result rendering
- Thinking-block rendering: spinner + label during `thinking` beats
- FAIL/PASS coloring on bash output (red/green for first line)

## [0.7.0] — internal

### Added
- Ambient mode: bare `bluff` (and `--ambient`) loops scripted arcs indefinitely
- `failed-test-then-fix` scenario (ambient-only): runs tests, sees a failure, edits, re-runs, passes
- `cargo-cult-debug` scenario (ambient-only, doomer-only): edits and re-tests in a loop, never converging
- `fakeFailingTestOutput` for plausible test-failure rendering
- Weighted ambient picker with recency damping

## [0.6.0] — internal

### Added
- Four new vibe packs: `enterprise`, `doomer`, `zen`, `hype-bro`
- Each vibe has its own phrase pools (openers, fillers, closers) and pacing curve
- Vibe registry (`src/vibes/registry.ts`) with `getVibe()` and `listVibes()`
- `--vibe <name>` CLI flag
- `/vibe <name>` REPL slash command actually switches vibes (was placeholder in v0.5)

## [0.5.0] — internal

### Added
- REPL mode with boxed input at the bottom and scrollback above (Ink `<Static>`)
- Slash commands: `/clear`, `/seed <n>`, `/vibe <name>`, `/cd <path>`, `/exit`, `/help`
- Session state: `turns`, `seenFiles`, `toolHistory`, `recentScenarios`
- `mutateSession()` helper to update state after each turn
- Director recency penalty: 50% score reduction for scenarios used in last 2 turns
- Director.run now returns `{beats, scenarioId}`
- `--repl` / `-i` CLI flag
- TTY guard: REPL fails fast with a friendly message in non-interactive contexts
- Shared `streamBeats()` function used by all modes
- New `system` block type for slash-command feedback

## [0.4.0] — internal

### Added
- Repo Context Engine: lazy file listing (via `git ls-files --cached --others --exclude-standard`, fallback to filesystem walk depth 3) and git state
- Safety Guardrails: path containment, 20-pattern secret blocklist, gitignore-aware, 100KB/file cap, 500KB session budget, binary detection
- First-run consent prompt → `~/.config/bluff-code/acks.json`; non-TTY fails closed → sandboxed
- `-C` / `--cwd <path>` CLI flag for explicit codebase root
- `--sandboxed` CLI flag to disable filesystem access
- Real line counts in `Read` tool results when files are accessible
- `repoPicker.ts` chooses real-or-fake based on `RepoContext` availability

## [0.3.0] — internal

### Added
- Tool-call mimicry: `Read`, `Grep`, `Edit`, `Bash`, `Glob` blocks rendered in `●` / `⎿` format
- Three new scenarios: `debug-fix`, `explain-code`, `add-feature`
- Real keyword-based intent classifier (replaces v0.2 stub that always returned `general`)
- `fakeRepo.ts`: fabricated paths, symbols, edit counts, scripted bash output
- Custom braille spinner (cyan, 80ms cadence)
- Block-based rendering (chat / tool-running / tool-done)

## [0.2.0] — internal

### Added
- One-shot mode end-to-end with default vibe and `general` scenario
- Streaming text with Box-Muller jitter and fake-token chunking (1–4 char chunks)
- Seedable mulberry32 RNG
- Session state and beat sequence types

## [0.1.0] — internal

### Added
- Initial scaffold (Bun + TypeScript + React + Ink)
- `package.json`, `tsconfig.json`, `.gitignore`, MIT `LICENSE`, README
- `DESIGN.md` and Chinese translation `DESIGN.zh.md`
