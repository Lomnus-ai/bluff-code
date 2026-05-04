import * as path from 'path'
import * as fs from 'fs'

const SECRET_GLOBS = [
  '**/.env',
  '**/.env.*',
  '**/*.pem',
  '**/*.key',
  '**/id_rsa*',
  '**/*.crt',
  '**/*.p12',
  '**/*.pfx',
  '**/.ssh/**',
  '**/.aws/**',
  '**/.gnupg/**',
  '**/.config/gh/**',
  '**/credentials*',
  '**/secrets*',
  '**/*token*',
  '**/*password*',
  '**/.netrc',
  '**/.npmrc',
  '**/.pypirc',
  '**/.docker/config.json',
]

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.scala',
  '.c', '.h', '.cpp', '.hpp', '.cs', '.swift',
  '.md', '.mdx', '.txt', '.rst',
  '.json', '.yaml', '.yml', '.toml', '.xml',
  '.html', '.css', '.scss', '.sass', '.less',
  '.sql', '.sh', '.bash', '.zsh', '.fish',
  '.lua', '.pl', '.r', '.dart', '.elm',
  '.vue', '.svelte', '.astro',
])

export const COMMON_IGNORES = new Set([
  'node_modules', '.git', 'dist', 'build', 'out',
  '.next', '.nuxt', '.cache', '.parcel-cache', '.turbo',
  'coverage', '.nyc_output',
  '.idea', '.vscode', '.DS_Store',
  'target', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache',
  'vendor', '.bundle', 'Pods',
])

export const MAX_FILE_BYTES = 100_000
export const MAX_SESSION_BYTES = 500_000

const secretMatchers = SECRET_GLOBS.map(g => new (Bun as any).Glob(g))

export function isSecretPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/')
  for (const m of secretMatchers) {
    if (m.match(normalized)) return true
  }
  return false
}

export function isTextExtension(p: string): boolean {
  return TEXT_EXTS.has(path.extname(p).toLowerCase())
}

export function looksBinary(buf: Buffer): boolean {
  const sample = buf.subarray(0, 1024)
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) return true
  }
  return false
}

// Resolve relPath against root, ensuring real-path containment.
// Returns absolute path or null if it would escape root.
export function resolveContained(relPath: string, root: string): string | null {
  try {
    const abs = path.resolve(root, relPath)
    const realAbs = fs.realpathSync(abs)
    const realRoot = fs.realpathSync(root)
    if (realAbs === realRoot) return realAbs
    if (realAbs.startsWith(realRoot + path.sep)) return realAbs
    return null
  } catch {
    return null
  }
}
