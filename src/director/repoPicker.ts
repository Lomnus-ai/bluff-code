import type {RepoContext} from '../context/types.ts'
import {pickFrom, sampleN} from '../utils/rng.ts'
import {fakeFile, fakeFiles, fakeLineCount} from './fakeRepo.ts'

export function pickFile(rng: () => number, ctx: RepoContext | null): string {
  if (ctx && ctx.files.length > 0) {
    return pickFrom(ctx.files, rng).path
  }
  return fakeFile(rng)
}

export function pickFiles(
  n: number,
  rng: () => number,
  ctx: RepoContext | null,
): string[] {
  if (ctx && ctx.files.length > 0) {
    return sampleN(ctx.files, n, rng).map(f => f.path)
  }
  return fakeFiles(n, rng)
}

export function pickLineCount(
  rng: () => number,
  ctx: RepoContext | null,
  file?: string,
): number {
  if (ctx && file) {
    const real = ctx.lineCountOf(file)
    if (real !== null) return real
  }
  return fakeLineCount(rng)
}
