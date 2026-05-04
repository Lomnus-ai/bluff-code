import type {VibePack} from './types.ts'

export const defaultVibe: VibePack = {
  id: 'default',
  openers: [
    "I'll take a look at this.",
    'Sure, let me dig into this.',
    'Got it. Let me work through this.',
    'Alright, walking through this now.',
    'Okay, let me think about this carefully.',
    'Hmm, let me trace through this.',
  ],
  fillers: [
    'Looking at the structure, this looks like a fairly standard pattern.',
    'The key thing is the interaction between the moving pieces here.',
    'Let me trace through the call graph more carefully before changing anything.',
    'I want to make sure I understand the constraints first.',
    "There's a subtle detail worth flagging on this approach.",
    'I think the cleanest path is to handle this incrementally.',
    'This should be straightforward once the data flow is clear.',
    'Worth checking how the existing tests cover this path.',
    "Looks like the surrounding code already handles a similar case — I'll follow that shape.",
  ],
  closers: [
    'That should do it.',
    'I think this approach handles the edge cases.',
    'Should be straightforward to verify with a quick test.',
    "Let me know if you'd like me to refine anything further.",
    'Done — should be working as expected now.',
    'Tests pass locally; ready for review when you are.',
  ],
  jitter: {
    meanMs: 28,
    stdMs: 18,
    longPauseChance: 0.015,
    longPauseMs: 280,
  },
}
