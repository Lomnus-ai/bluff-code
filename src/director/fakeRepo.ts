// Fabricated repo data for sandboxed scenarios (v0.3).
// Replaced by real RepoContext readings in v0.4.

import {pickFrom, sampleN} from '../utils/rng.ts'

const SAMPLE_PATHS = [
  'src/auth/login.ts',
  'src/auth/session.ts',
  'src/auth/tokens.ts',
  'src/api/client.ts',
  'src/api/handlers.ts',
  'src/api/schema.ts',
  'src/components/Button.tsx',
  'src/components/Modal.tsx',
  'src/components/Header.tsx',
  'src/utils/format.ts',
  'src/utils/validate.ts',
  'src/utils/logger.ts',
  'src/db/schema.ts',
  'src/db/queries.ts',
  'src/db/migrations.ts',
  'src/server/middleware.ts',
  'src/server/routes.ts',
  'src/server/index.ts',
  'src/store/userStore.ts',
  'src/store/cartStore.ts',
  'src/index.ts',
  'tests/auth.test.ts',
  'tests/api.test.ts',
  'tests/integration.test.ts',
]

const SAMPLE_SYMBOLS = [
  'validateSession',
  'loginUser',
  'fetchUserProfile',
  'parseConfig',
  'normalizePath',
  'handleRequest',
  'computeHash',
  'verifyToken',
  'serializeState',
  'invalidateCache',
  'authorizeRequest',
  'refreshSession',
]

const TEST_DESCRIPTIONS = [
  'accepts valid input',
  'rejects expired sessions',
  'handles concurrent requests',
  'sanitizes user input',
  'returns the expected shape',
  'fails closed on missing config',
  'normalizes whitespace correctly',
  'short-circuits on cache hit',
]

const FAIL_REASONS = [
  'expected "user" but received undefined',
  'TypeError: Cannot read property "id" of null',
  'AssertionError: 401 !== 200',
  'Timeout - Async callback was not invoked within the 5000 ms timeout',
  'Expected truthy value but got false',
  'ReferenceError: cache is not defined',
]

export function fakeFile(rng: () => number): string {
  return pickFrom(SAMPLE_PATHS, rng)
}

export function fakeFiles(n: number, rng: () => number): string[] {
  return sampleN(SAMPLE_PATHS, n, rng)
}

export function fakeSymbol(rng: () => number): string {
  return pickFrom(SAMPLE_SYMBOLS, rng)
}

export function fakeLineCount(rng: () => number): number {
  // Plausible source-file size; squared rng skews toward smaller files.
  return 30 + Math.floor(rng() * rng() * 600)
}

export function fakeEditCounts(rng: () => number): {
  additions: number
  removals: number
} {
  return {
    additions: 1 + Math.floor(rng() * 12),
    removals: Math.floor(rng() * 6),
  }
}

export function fakeMatchCounts(rng: () => number): {
  matchCount: number
  fileCount: number
} {
  const fileCount = 1 + Math.floor(rng() * 5)
  const matchCount = fileCount + Math.floor(rng() * 6)
  return {matchCount, fileCount}
}

export function fakeBashOutput(cmd: string, rng: () => number): string[] {
  const lower = cmd.toLowerCase()
  if (lower.includes('test') || lower.includes('jest') || lower.includes('vitest')) {
    return fakeTestOutput(rng)
  }
  if (lower.includes('tsc')) {
    return ['(no output)']
  }
  if (lower.startsWith('git status')) {
    return [
      'On branch main',
      'Your branch is up to date with origin/main.',
      '',
      'nothing to commit, working tree clean',
    ]
  }
  if (lower.startsWith('git log')) {
    return [
      'commit 4f2a9e1c (HEAD -> main)',
      'Author: Lomnus AI <noreply@lomnus.ai>',
      'Date:   Mon May 4 09:21:13 2026 -0700',
      '',
      '    fix: handle expired sessions in login flow',
    ]
  }
  if (lower.startsWith('ls')) {
    return ['package.json  README.md  src/  tests/  tsconfig.json']
  }
  return ['(done)']
}

export function fakeFailingTestOutput(rng: () => number): string[] {
  const slug = pickFrom(['login', 'auth', 'session', 'api', 'user'], rng)
  const total = 3 + Math.floor(rng() * 4)
  const failed = 1 + Math.floor(rng() * 2)
  const passed = total - failed
  const reason = pickFrom(FAIL_REASONS, rng)
  const desc = pickFrom(TEST_DESCRIPTIONS, rng)
  const ms = 8 + Math.floor(rng() * 30)
  return [
    `FAIL  src/__tests__/${slug}.test.ts`,
    `  ✗ ${desc} (${ms} ms)`,
    `    ${reason}`,
    `Tests: ${failed} failed, ${passed} passed, ${total} total`,
  ]
}

function fakeTestOutput(rng: () => number): string[] {
  const passes = 2 + Math.floor(rng() * 4)
  const slug = pickFrom(['login', 'auth', 'session', 'api', 'user'], rng)
  const lines = [`PASS  src/__tests__/${slug}.test.ts`]
  for (let i = 0; i < passes; i++) {
    const ms = 3 + Math.floor(rng() * 25)
    const desc = pickFrom(TEST_DESCRIPTIONS, rng)
    lines.push(`  ✓ ${desc} (${ms} ms)`)
  }
  lines.push(`Tests: ${passes} passed, ${passes} total`)
  return lines
}
