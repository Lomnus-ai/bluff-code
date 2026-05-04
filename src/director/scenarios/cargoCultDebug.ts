import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFrom} from '../../utils/rng.ts'
import {fakeFailingTestOutput} from '../fakeRepo.ts'
import {pickFile} from '../repoPicker.ts'

// The classic cargo-cult debugging arc: edit, test, fail, edit, test, fail,
// repeat, never converge. Doomer-only (gated by the ambient picker).
export const cargoCultDebugScenario: Scenario = {
  id: 'cargo-cult-debug',
  match: () => 0,
  expand: (state, ctx) => {
    const {rng} = state
    const file = pickFile(rng, ctx)

    const desperate = [
      'Why is this still broken.',
      "I have no idea. Just trying things.",
      "This shouldn't be possible.",
      'Maybe if I just...',
      'Why is this still failing.',
      'Let me try the opposite.',
      "I'm gonna change something random.",
      'Oh god what if I revert.',
    ]

    const beats: Beat[] = []
    const rounds = 3 + Math.floor(rng() * 2) // 3-4 rounds
    for (let i = 0; i < rounds; i++) {
      beats.push({
        kind: 'tool',
        call: {name: 'Edit', path: file},
        result: {
          kind: 'edited',
          additions: 1 + Math.floor(rng() * 3),
          removals: Math.floor(rng() * 3),
        },
        durationMs: 200 + Math.floor(rng() * 300),
      })
      beats.push({kind: 'pause', ms: 200 + Math.floor(rng() * 200)})
      beats.push({
        kind: 'tool',
        call: {name: 'Bash', cmd: 'npm test'},
        result: {kind: 'bash', lines: fakeFailingTestOutput(rng)},
        durationMs: 1000 + Math.floor(rng() * 1000),
      })
      beats.push({kind: 'pause', ms: 300 + Math.floor(rng() * 300)})
      beats.push({kind: 'chat', text: pickFrom(desperate, rng)})
      beats.push({kind: 'pause', ms: 600 + Math.floor(rng() * 400)})
    }
    return beats
  },
}
