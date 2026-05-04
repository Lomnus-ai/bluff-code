import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFrom} from '../../utils/rng.ts'
import {fakeMatchCounts, fakeSymbol} from '../fakeRepo.ts'
import {pickFile, pickLineCount} from '../repoPicker.ts'

export const explainCodeScenario: Scenario = {
  id: 'explain-code',
  match: intent => (intent.category === 'explain' ? 10 : 0),
  expand: (state, ctx) => {
    const {vibe, rng} = state
    const file = pickFile(rng, ctx)
    const symbol = fakeSymbol(rng)
    const matches = fakeMatchCounts(rng)
    const lineA = 20 + Math.floor(rng() * 60)
    const lineB = lineA + 10 + Math.floor(rng() * 40)

    const explanationPhrases = [
      `The flow starts at ${file}:${lineA}, where ${symbol} initializes the request context.`,
      `Most of the work happens in ${symbol} — it normalizes input, validates it, then dispatches to the handler.`,
      `The interesting bit is the early-exit branch around line ${lineB}: it short-circuits when the cache hits.`,
    ]

    const beats: Beat[] = [
      {kind: 'chat', text: pickFrom(vibe.openers, rng)},
      {kind: 'pause', ms: 500 + Math.floor(rng() * 400)},
      {
        kind: 'tool',
        call: {name: 'Read', path: file},
        result: {kind: 'lines', count: pickLineCount(rng, ctx, file)},
        durationMs: 300 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Grep', pattern: symbol, glob: '**/*.ts'},
        result: {kind: 'matches', ...matches},
        durationMs: 500 + Math.floor(rng() * 500),
      },
      {kind: 'pause', ms: 400 + Math.floor(rng() * 400)},
      {kind: 'chat', text: pickFrom(explanationPhrases, rng)},
      {kind: 'pause', ms: 600 + Math.floor(rng() * 400)},
      {kind: 'chat', text: pickFrom(vibe.fillers, rng)},
      {kind: 'pause', ms: 500 + Math.floor(rng() * 400)},
      {kind: 'chat', text: pickFrom(vibe.closers, rng)},
    ]
    return beats
  },
}
