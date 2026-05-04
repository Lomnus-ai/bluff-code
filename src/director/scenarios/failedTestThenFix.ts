import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'
import {pickFrom} from '../../utils/rng.ts'
import {
  fakeBashOutput,
  fakeEditCounts,
  fakeFailingTestOutput,
} from '../fakeRepo.ts'
import {pickFile, pickLineCount} from '../repoPicker.ts'

export const failedTestThenFixScenario: Scenario = {
  id: 'failed-test-then-fix',
  // Ambient-only — never fires from a user prompt.
  match: () => 0,
  expand: (state, ctx) => {
    const {vibe, rng} = state
    const file = pickFile(rng, ctx)

    const triagePhrases = [
      "Yeah, that's broken. Let me trace it.",
      'Something is off in the request handler.',
      'I see — the assertion is wrong because of the recent refactor.',
      'Looks like the error path lost a guard.',
    ]

    const beats: Beat[] = [
      {kind: 'chat', text: 'Running the suite to see where we stand.'},
      {kind: 'pause', ms: 400 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Bash', cmd: 'npm test'},
        result: {kind: 'bash', lines: fakeFailingTestOutput(rng)},
        durationMs: 1200 + Math.floor(rng() * 1500),
      },
      {kind: 'pause', ms: 500 + Math.floor(rng() * 300)},
      {kind: 'chat', text: pickFrom(triagePhrases, rng)},
      {kind: 'pause', ms: 400 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Read', path: file},
        result: {kind: 'lines', count: pickLineCount(rng, ctx, file)},
        durationMs: 300 + Math.floor(rng() * 300),
      },
      {kind: 'pause', ms: 300 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Edit', path: file},
        result: {kind: 'edited', ...fakeEditCounts(rng)},
        durationMs: 400 + Math.floor(rng() * 300),
      },
      {kind: 'pause', ms: 300 + Math.floor(rng() * 300)},
      {
        kind: 'tool',
        call: {name: 'Bash', cmd: 'npm test'},
        result: {kind: 'bash', lines: fakeBashOutput('npm test', rng)},
        durationMs: 1500 + Math.floor(rng() * 1500),
      },
      {kind: 'pause', ms: 400 + Math.floor(rng() * 300)},
      {kind: 'chat', text: pickFrom(vibe.closers, rng)},
    ]
    return beats
  },
}
