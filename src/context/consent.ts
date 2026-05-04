import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as readline from 'readline'

const ACKS_FILE = path.join(os.homedir(), '.config', 'bluff-code', 'acks.json')

function readAcks(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(ACKS_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveAck(absRoot: string): void {
  const acks = readAcks()
  acks[absRoot] = Date.now()
  try {
    fs.mkdirSync(path.dirname(ACKS_FILE), {recursive: true})
    fs.writeFileSync(ACKS_FILE, JSON.stringify(acks, null, 2))
  } catch {
    // best-effort; don't fail if home dir isn't writable
  }
}

export async function ensureConsent(absRoot: string): Promise<boolean> {
  const acks = readAcks()
  if (acks[absRoot]) return true

  // Without a TTY we can't prompt; fail closed → caller falls back to sandboxed.
  if (!process.stdin.isTTY) return false

  process.stdout.write(
    `bluff-code reads files in ${absRoot} to make tool calls look plausible.\n` +
      `(Read-only. Capped at 100KB/file, 500KB total. Skips secrets and gitignored files.)\n` +
      `Use --sandboxed next time to skip filesystem access entirely.\n`,
  )

  const rl = readline.createInterface({input: process.stdin, output: process.stdout})
  const answer = await new Promise<string>(resolve => {
    rl.question('Allow? [Y/n] ', a => {
      rl.close()
      resolve(a)
    })
  })
  const lowered = answer.trim().toLowerCase()
  if (lowered === 'n' || lowered === 'no') return false
  saveAck(absRoot)
  return true
}
