import type {VibePack} from '../vibes/types.ts'
import type {Beat} from '../beats/types.ts'
import type {ToolName} from '../tools/types.ts'
import {mulberry32} from '../utils/rng.ts'

export type Turn = {
  prompt: string
  scenarioId: string
}

export type SessionState = {
  vibe: VibePack
  seed: number
  rng: () => number
  turns: Turn[]
  seenFiles: Set<string>
  toolHistory: ToolName[]
  recentScenarios: string[]
}

export function createSession(opts: {vibe: VibePack; seed: number}): SessionState {
  return {
    vibe: opts.vibe,
    seed: opts.seed,
    rng: mulberry32(opts.seed),
    turns: [],
    seenFiles: new Set(),
    toolHistory: [],
    recentScenarios: [],
  }
}

// Returns a new SessionState reflecting a completed REPL turn.
export function mutateSession(
  s: SessionState,
  evt: {input: string; scenarioId: string; beats: Beat[]},
): SessionState {
  const newToolHistory: ToolName[] = [...s.toolHistory]
  const newSeen = new Set(s.seenFiles)
  for (const beat of evt.beats) {
    if (beat.kind !== 'tool') continue
    newToolHistory.push(beat.call.name)
    if (beat.call.name === 'Read' || beat.call.name === 'Edit') {
      newSeen.add(beat.call.path)
    }
  }
  return {
    ...s,
    turns: [...s.turns, {prompt: evt.input, scenarioId: evt.scenarioId}],
    recentScenarios: [evt.scenarioId, ...s.recentScenarios].slice(0, 5),
    toolHistory: newToolHistory,
    seenFiles: newSeen,
  }
}
