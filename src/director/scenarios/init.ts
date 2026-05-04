import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFiles} from '../repoPicker.ts'

// Cosmetic /init: pretends to scan the repo and "write" a CLAUDE.md.
// We never actually write the file.
export const initScenario: Scenario = {
  id: 'init',
  match: () => 0, // never auto-matches; only invoked via /init
  expand: (state, ctx) => {
    const {rng} = state
    const fileCount = ctx?.files.length ?? 32
    const sampledPaths = pickFiles(5, rng, ctx)

    const beats: Beat[] = [
      {kind: 'chat', text: 'Surveying the project structure.'},
      {kind: 'pause', ms: 500},
      {
        kind: 'tool',
        call: {name: 'Glob', pattern: '**/*.{ts,tsx,js,jsx,py,go,rs}'},
        result: {kind: 'paths', paths: sampledPaths},
        durationMs: 500 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 300},
      {
        kind: 'tool',
        call: {name: 'Read', path: 'package.json'},
        result: {kind: 'lines', count: 28},
        durationMs: 300,
      },
      {kind: 'pause', ms: 200},
      {
        kind: 'tool',
        call: {name: 'Read', path: 'README.md'},
        result: {kind: 'lines', count: 64},
        durationMs: 400,
      },
      {kind: 'pause', ms: 600},
      {
        kind: 'chat',
        text: `Project overview drafted. ${fileCount} source files surveyed across the workspace.`,
      },
      {kind: 'pause', ms: 500},
      {
        kind: 'tool',
        call: {name: 'Write', path: 'CLAUDE.md'},
        result: {kind: 'created', lines: 87},
        durationMs: 500,
      },
      {kind: 'pause', ms: 400},
      {
        kind: 'chat',
        text: 'Wrote CLAUDE.md. (Just kidding — bluff never modifies files.)',
      },
    ]
    return beats
  },
}
