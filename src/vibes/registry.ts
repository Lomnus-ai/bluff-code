import type {VibePack} from './types.ts'
import {defaultVibe} from './default.ts'
import {enterpriseVibe} from './enterprise.ts'
import {doomerVibe} from './doomer.ts'
import {zenVibe} from './zen.ts'
import {hypeBroVibe} from './hypeBro.ts'

export const VIBES: Record<string, VibePack> = {
  default: defaultVibe,
  enterprise: enterpriseVibe,
  doomer: doomerVibe,
  zen: zenVibe,
  'hype-bro': hypeBroVibe,
}

export function getVibe(name: string): VibePack | null {
  return VIBES[name] ?? null
}

export function listVibes(): string[] {
  return Object.keys(VIBES)
}
