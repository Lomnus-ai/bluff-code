import type {Beat} from '../../beats/types.ts'
import type {Scenario} from '../director.ts'

// Cosmetic /plan: enters a fake "plan mode" with a markdown plan and a
// pretend approval prompt. No real planning happens.
export const planScenario: Scenario = {
  id: 'plan',
  match: () => 0,
  expand: state => {
    const {rng} = state

    const beats: Beat[] = [
      {kind: 'chat', text: 'Entering plan mode.'},
      {kind: 'pause', ms: 500},
      {kind: 'thinking', label: 'planning', ms: 1500 + Math.floor(rng() * 1500)},
      {
        kind: 'chat',
        text:
          '## Plan\n\n' +
          '**Phase 1 — Survey**\n' +
          '- Read the existing module and surrounding callers\n' +
          '- Identify integration points\n\n' +
          '**Phase 2 — Implement**\n' +
          '- Add the new abstraction\n' +
          '- Wire it into the entry point\n' +
          '- Mirror the existing test patterns\n\n' +
          '**Phase 3 — Verify**\n' +
          '- Run unit tests\n' +
          '- Run integration tests\n' +
          '- Spot-check the diff for stray side effects\n\n' +
          'Approve plan? [y/N]',
      },
      {kind: 'pause', ms: 1000},
      {kind: 'chat', text: '> y'},
      {kind: 'pause', ms: 400},
      {kind: 'chat', text: 'Plan approved. Ready to execute.'},
    ]
    return beats
  },
}
