import type {Beat} from '../beats/types.ts'
import type {SessionState} from '../state/session.ts'
import type {RepoContext} from '../context/types.ts'
import {classifyIntent, type Intent} from './intent.ts'

export type Scenario = {
  id: string
  match: (intent: Intent, state: SessionState) => number
  expand: (state: SessionState, ctx: RepoContext | null) => Beat[]
}

export type RunResult = {
  beats: Beat[]
  scenarioId: string
}

export class Director {
  constructor(private scenarios: Scenario[]) {}

  run(prompt: string, state: SessionState, ctx: RepoContext | null): RunResult {
    const intent = classifyIntent(prompt)
    const recent = state.recentScenarios.slice(0, 2)
    const scored = this.scenarios
      .map(s => {
        let score = s.match(intent, state)
        // Recency penalty: halve the score if used in the last two turns.
        if (recent.includes(s.id)) score *= 0.5
        return {scenario: s, score}
      })
      .sort((a, b) => b.score - a.score)
    const winner = scored[0]
    if (!winner) return {beats: [], scenarioId: ''}
    return {
      beats: winner.scenario.expand(state, ctx),
      scenarioId: winner.scenario.id,
    }
  }
}
