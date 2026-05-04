import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFrom} from '../../utils/rng.ts'
import {fakeBashOutput, fakeEditCounts, fakeMatchCounts, fakeSymbol} from '../fakeRepo.ts'
import {pickFile, pickLineCount} from '../repoPicker.ts'

export const debugFixScenario: Scenario = {
  id: 'debug-fix',
  match: intent => (intent.category === 'debug' ? 10 : 0),
  expand: (state, ctx) => {
    const {vibe, rng} = state
    const file1 = pickFile(rng, ctx)
    const file2 = pickFile(rng, ctx)
    const symbol = fakeSymbol(rng)
    const matches = fakeMatchCounts(rng)
    const edit = fakeEditCounts(rng)

    const insightPhrases = [
      `I see the issue — ${symbol} is being called before the session is verified.`,
      `Found it. The error path in ${file1} doesn't propagate the original cause.`,
      `Got it. There's a race between the cache update and the read.`,
      `The bug is in ${symbol} — it returns early when the input is empty.`,
    ]

    const beats: Beat[] = [
      {kind: 'chat', text: pickFrom(vibe.openers, rng)},
      {kind: 'pause', ms: 500 + Math.floor(rng() * 400)},
      {
        kind: 'tool',
        call: {name: 'Read', path: file1},
        result: {kind: 'lines', count: pickLineCount(rng, ctx, file1)},
        durationMs: 300 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 200)},
      {
        kind: 'tool',
        call: {name: 'Grep', pattern: symbol, glob: '**/*.ts'},
        result: {kind: 'matches', ...matches},
        durationMs: 500 + Math.floor(rng() * 600),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Read', path: file2},
        result: {kind: 'lines', count: pickLineCount(rng, ctx, file2)},
        durationMs: 300 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 400 + Math.floor(rng() * 400)},
      {kind: 'chat', text: pickFrom(insightPhrases, rng)},
      {kind: 'pause', ms: 600 + Math.floor(rng() * 400)},
      {
        kind: 'tool',
        call: {name: 'Edit', path: file1},
        result: {kind: 'edited', ...edit},
        durationMs: 300 + Math.floor(rng() * 300),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 200)},
      {
        kind: 'tool',
        call: {name: 'Bash', cmd: 'npm test -- auth'},
        result: {kind: 'bash', lines: fakeBashOutput('npm test', rng)},
        durationMs: 1500 + Math.floor(rng() * 2000),
      },
      {kind: 'pause', ms: 300 + Math.floor(rng() * 300)},
      {kind: 'chat', text: pickFrom(vibe.closers, rng)},
    ]
    return beats
  },
}
