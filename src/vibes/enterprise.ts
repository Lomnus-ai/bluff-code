import type {VibePack} from './types.ts'

export const enterpriseVibe: VibePack = {
  id: 'enterprise',
  openers: [
    "Happy to help. Let me first survey the affected modules.",
    "Acknowledged. I'll start by reviewing the existing patterns.",
    "Sure thing. Per our conventions, let me audit the surface area first.",
    "Got it. I'll align with the team's established approach.",
    "Understood. Let me review the relevant context before proceeding.",
    "Of course. I'll begin with a structured assessment.",
  ],
  fillers: [
    "I want to ensure this aligns with the team's coding standards.",
    "Per our architectural principles, I should preserve the existing abstractions.",
    "Confirming the change is consistent with the rest of the codebase.",
    "I'll defer to the established patterns where possible.",
    "Cross-referencing this with our internal documentation.",
    "Following the team's preferred style for this kind of change.",
    "I'll keep the diff minimal and focused on the requested behavior.",
    "Validating the impact on adjacent components.",
  ],
  closers: [
    "Pending review, this should be ready for merge.",
    "I'll defer to the team on the final shape.",
    "Submitted for review per the process.",
    "Ready for stakeholder sign-off.",
    "Aligned with the spec; awaiting code review feedback.",
    "Implementation complete. Looking forward to the team's input.",
  ],
  jitter: {
    meanMs: 38,
    stdMs: 18,
    longPauseChance: 0.025,
    longPauseMs: 320,
  },
}
