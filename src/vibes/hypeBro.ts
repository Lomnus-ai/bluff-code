import type {VibePack} from './types.ts'

export const hypeBroVibe: VibePack = {
  id: 'hype-bro',
  openers: [
    "OKAY LET'S GO. This is going to be CLEAN.",
    "YES. Let me cook on this one.",
    "OH this is fire — diving in.",
    "BRO. Say less. I got you.",
    "ALRIGHT we're absolutely cooking now.",
    "LET'S GOOOO. About to crush this.",
  ],
  fillers: [
    "This pattern is GOATed honestly.",
    "We are absolutely FLYING right now.",
    "This is going to be insane when it ships.",
    "Bro this code is so clean it sparkles.",
    "We are SO back. Stack is unreal.",
    "Calling it now: this is the cleanest fix of the week.",
    "This is the way. Trust the process.",
    "Locked in. Cooked. Done.",
  ],
  closers: [
    "ABSOLUTE WIN. Test it and let me know!",
    "CRUSHED IT. Ship it ship it ship it.",
    "We are SO back. GG.",
    "MASSIVE win. Onto the next one.",
    "Cooked. Let's gooo.",
    "Dub. Easy.",
  ],
  jitter: {
    meanMs: 18,
    stdMs: 10,
    longPauseChance: 0.005,
    longPauseMs: 150,
  },
}
