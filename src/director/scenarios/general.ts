import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFrom, sampleN} from '../../utils/rng.ts'
import {pickFiles} from '../repoPicker.ts'

export const generalScenario: Scenario = {
  id: 'general',
  // Lowest non-zero score — used as the fallback when nothing more specific matches.
  match: () => 1,
  expand: (state, ctx) => {
    const {vibe, rng} = state
    const opener = pickFrom(vibe.openers, rng)
    const middles = sampleN(vibe.fillers, 2, rng)
    const closer = pickFrom(vibe.closers, rng)
    const paths = pickFiles(2 + Math.floor(rng() * 3), rng, ctx)

    const beats: Beat[] = [
      {kind: 'chat', text: opener},
      {kind: 'pause', ms: 500 + Math.floor(rng() * 400)},
      {
        kind: 'tool',
        call: {name: 'Glob', pattern: '**/*.{ts,tsx}'},
        result: {kind: 'paths', paths},
        durationMs: 300 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 400 + Math.floor(rng() * 400)},
      {kind: 'chat', text: middles[0]},
      {kind: 'pause', ms: 400 + Math.floor(rng() * 500)},
      {kind: 'chat', text: middles[1]},
      {kind: 'pause', ms: 500 + Math.floor(rng() * 400)},
      {kind: 'chat', text: closer},
    ]
    return beats
  },
}
