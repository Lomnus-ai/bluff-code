// Mulberry32: tiny, fast, deterministic 32-bit PRNG.
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickFrom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function sampleN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = arr.slice()
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}
