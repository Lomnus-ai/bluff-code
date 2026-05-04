import type {JitterCurve} from '../vibes/types.ts'

export function sampleDelay(curve: JitterCurve, rng: () => number): number {
  if (rng() < curve.longPauseChance) {
    return curve.longPauseMs
  }
  // Box-Muller transform → approximately normal jitter around meanMs.
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.max(5, Math.round(curve.meanMs + z * curve.stdMs))
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Slice text into 1–4 char chunks to mimic sub-word token streaming.
export function chunkIntoFakeTokens(text: string, rng: () => number): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const len = 1 + Math.floor(rng() * 4)
    chunks.push(text.slice(i, i + len))
    i += len
  }
  return chunks
}
