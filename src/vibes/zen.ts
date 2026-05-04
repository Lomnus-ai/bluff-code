import type {VibePack} from './types.ts'

export const zenVibe: VibePack = {
  id: 'zen',
  openers: [
    "Reading.",
    "Looking.",
    "Hm.",
    "I see.",
    "Let me observe.",
    "Yes.",
  ],
  fillers: [
    "The shape becomes clear.",
    "The path is here.",
    "Patience reveals the structure.",
    "What was hidden, surfaces.",
    "The flow is simpler than it appears.",
    "Less is sufficient.",
    "Precision over haste.",
    "The change is small.",
  ],
  closers: [
    "Done.",
    "It is finished.",
    "Quiet now.",
    "Balanced.",
    "Resolved.",
    "Complete.",
  ],
  jitter: {
    meanMs: 60,
    stdMs: 25,
    longPauseChance: 0.06,
    longPauseMs: 500,
  },
}
