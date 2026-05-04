import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFrom} from '../../utils/rng.ts'
import {fakeBashOutput, fakeEditCounts} from '../fakeRepo.ts'
import {pickFile, pickLineCount} from '../repoPicker.ts'

export const addFeatureScenario: Scenario = {
  id: 'add-feature',
  match: intent => (intent.category === 'add-feature' ? 10 : 0),
  expand: (state, ctx) => {
    const {vibe, rng} = state
    const existing = pickFile(rng, ctx)
    const newFile = pickFile(rng, ctx)
    const wireUp = pickFile(rng, ctx)

    const planPhrases = [
      'Plan: 1) read the existing module, 2) add the new file, 3) wire it into the entrypoint, 4) run tests.',
      'Sketching the shape: a small module alongside the existing ones, plus a wire-up at the entrypoint.',
      'Going to take this in three steps — define, integrate, verify.',
    ]

    const beats: Beat[] = [
      {kind: 'chat', text: pickFrom(vibe.openers, rng)},
      {kind: 'pause', ms: 500 + Math.floor(rng() * 400)},
      {kind: 'chat', text: pickFrom(planPhrases, rng)},
      {kind: 'pause', ms: 700 + Math.floor(rng() * 400)},
      {
        kind: 'tool',
        call: {name: 'Read', path: existing},
        result: {kind: 'lines', count: pickLineCount(rng, ctx, existing)},
        durationMs: 300 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Edit', path: newFile},
        result: {kind: 'edited', ...fakeEditCounts(rng)},
        durationMs: 400 + Math.floor(rng() * 400),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Edit', path: wireUp},
        result: {kind: 'edited', ...fakeEditCounts(rng)},
        durationMs: 300 + Math.floor(rng() * 300),
      },
      {kind: 'pause', ms: 200 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Bash', cmd: 'npm test'},
        result: {kind: 'bash', lines: fakeBashOutput('npm test', rng)},
        durationMs: 1800 + Math.floor(rng() * 2000),
      },
      {kind: 'pause', ms: 300 + Math.floor(rng() * 300)},
      {kind: 'chat', text: pickFrom(vibe.closers, rng)},
    ]
    return beats
  },
}
