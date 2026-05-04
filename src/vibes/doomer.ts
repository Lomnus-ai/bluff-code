import type {VibePack} from './types.ts'

export const doomerVibe: VibePack = {
  id: 'doomer',
  openers: [
    "Alright. This codebase is cursed but I'll try.",
    "Sigh. Let me see what we're working with.",
    "Okay. Bracing myself.",
    "Fine. Pulling up the wreckage.",
    "Yeah, alright. Let me dig in.",
    "Here we go again.",
  ],
  fillers: [
    "Yeah, this is exactly what I expected — a mess.",
    "I'm not optimistic but here goes.",
    "This is going to break something else, I can feel it.",
    "Why is this even like this. Whatever.",
    "The original author clearly gave up halfway through.",
    "I keep finding new ways for this to be wrong.",
    "Let me just patch it and run before it notices.",
    "It's all duct tape down here.",
  ],
  closers: [
    "It's done. It'll probably break tomorrow.",
    "Tests pass. For now.",
    "Good enough. Moving on before something else implodes.",
    "Shipped. May the on-call gods have mercy.",
    "That's as much as I can salvage.",
    "Done. I need a coffee.",
  ],
  jitter: {
    meanMs: 36,
    stdMs: 24,
    longPauseChance: 0.05,
    longPauseMs: 400,
  },
}
