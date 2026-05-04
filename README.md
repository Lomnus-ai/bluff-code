# bluff-code

A pretend AI coding CLI. Looks the part. Codes nothing.

> All performance, no implementation.

```
● Read(src/auth/login.ts)
  ⎿  Read 142 lines

● Grep(pattern: "validateSession", glob: "**/*.ts")
  ⎿  Found 4 matches in 3 files

● Edit(src/auth/login.ts)
  ⎿  Updated src/auth/login.ts with 7 additions and 2 removals

● Bash(npm test -- auth)
  ⎿  PASS  src/__tests__/login.test.ts
       ✓ accepts valid credentials (14 ms)
       ✓ rejects expired sessions (8 ms)
     Tests: 2 passed, 2 total

That should do it.
```

## Why

`bluff-code` mimics the visual experience of an AI coding assistant — streaming
tokens, scripted tool calls, spinners, a boxed input — without any model behind
it. Use it for:

- Demos and screen recordings without leaking real code or burning API credits
- Conference talks where the demo gods can't smite you
- Tutorial screenshots with deterministic output
- Comedy and satire content
- Looking busy at the coffee shop while your manager walks by
- Lofi coding stream backgrounds
- Movie & TV "hacker" shots that finally look like 2026
- Air-gapped environments where real assistants aren't allowed
- Rate-limit fallback: keep the muscle memory flowing

## Install

```bash
bun install
```

Optional global symlink:

```bash
bun link
```

## Quick start

Three modes:

```bash
# One-shot: stream a single response and exit
bluff "fix the auth bug in login flow"

# Interactive REPL with slash commands
bluff --repl

# Ambient: loop scripted arcs forever (cafe-bluffer mode)
bluff
```

Or without `bun link`, just substitute `bun src/cli.tsx` for `bluff`.

## Modes

### One-shot (`bluff <prompt>`)

Runs a single scripted arc end-to-end then exits. Best for screenshots,
recordings, scripts, and one-liner demos.

The intent classifier looks at your prompt and picks one of four scenarios:
`debug-fix`, `explain-code`, `add-feature`, or `general` (fallback).

### REPL (`bluff --repl` or `bluff -i`)

Multi-turn interactive session with a boxed input at the bottom and scrollback
above. Tracks turn history, files "seen", and recent scenarios so the same arc
doesn't fire twice in a row.

Slash commands:

| Command | Effect |
|---|---|
| `/clear` | Clear history (also writes ANSI screen-clear) |
| `/seed <n>` | Re-seed RNG mid-session |
| `/vibe <name>` | Switch vibe pack |
| `/cd <path>` | Switch codebase root |
| `/init` | Cosmetic — fakes scanning the repo and writing CLAUDE.md |
| `/plan` | Cosmetic — fakes plan mode with phases and approval prompt |
| `/exit` | Quit |
| `/help` | Show command list |

### Ambient (`bluff` with no args, or `bluff --ambient`)

Loops scripted arcs forever with realistic inter-arc pauses. Designed for the
cafe-bluffer use case — leave the laptop open and walk away. Adds two
ambient-only scenarios:

- `failed-test-then-fix` — runs tests, sees a failure, traces, edits, re-runs, passes
- `cargo-cult-debug` — only fires under `--vibe doomer`; edits and re-tests in a loop, never converging

## Vibes

Five voices ship in v1.0:

| Vibe | Tone | Sample opener |
|---|---|---|
| `default` | Mimics Claude Code | "I'll take a look at this." |
| `enterprise` | Corporate, hedged | "Happy to help. Let me first survey the affected modules." |
| `doomer` | Bleak, defeated competence | "Alright. This codebase is cursed but I'll try." |
| `zen` | Minimalist, koan-like | "Reading." |
| `hype-bro` | Overcaffeinated | "OKAY LET'S GO. This is going to be CLEAN." |

Each vibe has its own phrase pools and pacing curve — `zen` streams slowly with
long pauses; `hype-bro` rips at ~50 tok/s.

## Tool-call mimicry

bluff fakes six tools, rendered in the same `●` / `⎿` style as Claude Code:

| Tool | Result format |
|---|---|
| `Read` | `Read N lines` |
| `Grep` | `Found N matches in M files` |
| `Edit` | `Updated <path> with X additions and Y removals` |
| `Write` | `Created <path> (N lines)` |
| `Bash` | scripted output (PASS in green, FAIL in red) |
| `Glob` | `Found N files` |

When pointed at a real codebase (the default), file paths in tool calls come
from `git ls-files` (or a filesystem walk for non-git directories), and `Read`
results report actual line counts. With `--sandboxed`, paths are fabricated.

## Safety

When reading files for plausibility, bluff applies hard guardrails:

- **Path containment.** Resolved real-path must be inside the codebase root; symlinks escaping are rejected.
- **Secret blocklist.** `.env*`, `*.pem`, `*.key`, `id_rsa*`, `**/.ssh/**`, `**/.aws/**`, `**/credentials*`, etc. are never read.
- **Gitignore-aware.** Files git ignores are skipped (via `git ls-files --exclude-standard`).
- **Size cap.** Skips any file > 100 KB.
- **Session budget.** Total bytes read per session ≤ 500 KB; once hit, falls silently to fabricated content.
- **Binary skip.** Detected by extension allowlist + null-byte sniff.
- **Read-only by construction.** No `write`/`unlink`/`exec` paths in the codebase.
- **First-run consent.** Per-directory `~/.config/bluff-code/acks.json`; no TTY → silently sandboxed.

`--sandboxed` disables filesystem access entirely.

## CLI reference

```
Usage: bluff [options] [<prompt>]

Modes:
  bluff <prompt>            One-shot: stream a single response and exit
  bluff -i, --repl          Interactive REPL with slash commands
  bluff (no args)           Ambient: loops scripted arcs forever

Options:
  -v, --version             Print version
  -h, --help                Show this help
      --seed <n>            Pin RNG for reproducible output
  -C, --cwd <path>          Codebase root (default: current directory)
      --sandboxed           Skip filesystem reads (use fabricated paths)
      --vibe <name>         Pick a vibe (default, enterprise, doomer, zen, hype-bro)
      --ambient             Force ambient mode (same as no-args)
```

## Architecture

```
CLI Entry → Mode (one-shot / REPL / ambient)
              ↓
         Session State ←─ mutateSession after each turn
              ↓
          Director ── intent → scenario (with recency penalty)
              ↓
          Scenario.expand() → Beat[]
              ↓
       Renderer (Ink) ←─ streamBeats with per-vibe jitter
```

## Tech stack

- [Bun](https://bun.sh) — runtime + bundler (single-binary builds via `bun build --compile`)
- TypeScript
- [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) — terminal UI

## Build

Standalone executable:

```bash
bun build --compile src/cli.tsx --outfile bluff
./bluff "fix the bug"
```

JS bundle for npm:

```bash
bun build src/cli.tsx --target=bun --outfile dist/bluff.js
```

## Status

v1.0 — feature-complete per the [DESIGN.md](./DESIGN.md) roadmap. Released
under [MIT](./LICENSE).

## License

[MIT](./LICENSE) — Copyright (c) 2026 Lomnus AI.

This project parodies Claude Code's visual conventions for comedic and
demonstrative purposes. It is not affiliated with Anthropic.
