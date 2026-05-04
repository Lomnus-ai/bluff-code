export type JitterCurve = {
  meanMs: number
  stdMs: number
  longPauseChance: number
  longPauseMs: number
}

export type VibePack = {
  id: string
  openers: string[]
  fillers: string[]
  closers: string[]
  jitter: JitterCurve
}
