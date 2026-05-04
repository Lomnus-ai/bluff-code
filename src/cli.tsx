#!/usr/bin/env bun
import * as path from 'path'
import {runOneShot} from './modes/oneShot.tsx'
import {runRepl} from './modes/repl.tsx'
import {runAmbient} from './modes/ambient.tsx'

const args = process.argv.slice(2)

function hasFlag(...names: string[]): boolean {
  return names.some(n => args.includes(n))
}

function flagValue(...names: string[]): string | undefined {
  for (const name of names) {
    const idx = args.indexOf(name)
    if (idx !== -1 && idx < args.length - 1) {
      return args[idx + 1]
    }
  }
  return undefined
}

if (hasFlag('--version', '-v')) {
  console.log('bluff-code 1.0.0')
  process.exit(0)
}

if (hasFlag('--help', '-h')) {
  console.log(
    [
      'Usage: bluff [options] [<prompt>]',
      '',
      'A pretend AI coding CLI. Looks the part. Codes nothing.',
      '',
      'Modes:',
      '  bluff <prompt>            One-shot: stream a single response and exit',
      '  bluff -i, --repl          Interactive REPL with slash commands',
      '  bluff (no args)           Ambient: loops scripted arcs forever',
      '',
      'Options:',
      '  -v, --version             Print version',
      '  -h, --help                Show this help',
      '      --seed <n>            Pin RNG for reproducible output',
      '  -C, --cwd <path>          Codebase root (default: current directory)',
      '      --sandboxed           Skip filesystem reads (use fabricated paths)',
      '      --vibe <name>         Pick a vibe (default, enterprise, doomer, zen, hype-bro)',
      '      --ambient             Force ambient mode (same as no-args)',
      '',
      "REPL slash commands: /clear  /seed <n>  /vibe <name>  /cd <path>",
      "                     /init  /plan  /exit  /help",
      '',
      'v1.0 — feature-complete. See README.md for full docs.',
    ].join('\n'),
  )
  process.exit(0)
}

const seedStr = flagValue('--seed')
const seed = seedStr === undefined ? undefined : Number.parseInt(seedStr, 10)
const cwdFlag = flagValue('--cwd', '-C')
const cwd = path.resolve(cwdFlag ?? process.cwd())
const sandboxed = hasFlag('--sandboxed')
const repl = hasFlag('--repl', '-i')
const ambient = hasFlag('--ambient')
const vibe = flagValue('--vibe')

const flagsThatConsumeNext = new Set(['--seed', '--cwd', '-C', '--vibe'])
const prompt = args.find((a, i) => {
  if (a.startsWith('-')) return false
  const prev = i > 0 ? args[i - 1] : ''
  if (flagsThatConsumeNext.has(prev)) return false
  return true
})

if (repl) {
  await runRepl({cwd, sandboxed, seed, vibe})
} else if (ambient || !prompt) {
  await runAmbient({cwd, sandboxed, seed, vibe})
} else {
  await runOneShot({prompt, seed, cwd, sandboxed, vibe})
}
