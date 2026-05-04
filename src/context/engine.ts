import * as fs from 'fs'
import * as path from 'path'
import {spawnSync} from 'child_process'
import type {FileEntry, GitInfo, RepoContext} from './types.ts'
import {
  COMMON_IGNORES,
  MAX_FILE_BYTES,
  MAX_SESSION_BYTES,
  isSecretPath,
  isTextExtension,
  looksBinary,
  resolveContained,
} from './safety.ts'

export async function createRepoContext(root: string): Promise<RepoContext> {
  const absRoot = path.resolve(root)
  const files = listFiles(absRoot)
  const git = readGitInfo(absRoot)
  return new RepoContextImpl(absRoot, files, git)
}

class RepoContextImpl implements RepoContext {
  private cache = new Map<string, string>()
  private budgetUsed = 0

  constructor(
    public root: string,
    public files: FileEntry[],
    public git: GitInfo | null,
  ) {}

  read(relPath: string): string | null {
    const cached = this.cache.get(relPath)
    if (cached !== undefined) return cached
    if (isSecretPath(relPath)) return null
    if (!isTextExtension(relPath)) return null

    const abs = resolveContained(relPath, this.root)
    if (!abs) return null

    let stat: fs.Stats
    try {
      stat = fs.statSync(abs)
    } catch {
      return null
    }
    if (!stat.isFile()) return null
    if (stat.size > MAX_FILE_BYTES) return null
    if (this.budgetUsed + stat.size > MAX_SESSION_BYTES) return null

    let content: Buffer
    try {
      content = fs.readFileSync(abs)
    } catch {
      return null
    }
    if (looksBinary(content)) return null

    const text = content.toString('utf-8')
    this.cache.set(relPath, text)
    this.budgetUsed += stat.size
    return text
  }

  lineCountOf(relPath: string): number | null {
    const text = this.cache.get(relPath) ?? this.read(relPath)
    if (text === null) return null
    return text.split('\n').length
  }
}

function listFiles(absRoot: string): FileEntry[] {
  const rels = listViaGit(absRoot) ?? listViaFs(absRoot, 3)
  return rels
    .filter(rel => !isSecretPath(rel))
    .map(rel => {
      const abs = path.join(absRoot, rel)
      let size = 0
      try {
        size = fs.statSync(abs).size
      } catch {
        // skip — will end up with size: 0
      }
      return {path: rel, abs, size, ext: path.extname(rel)}
    })
}

function listViaGit(absRoot: string): string[] | null {
  const r = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    {cwd: absRoot, encoding: 'utf-8'},
  )
  if (r.status !== 0) return null
  const out = (r.stdout ?? '').trim()
  if (!out) return []
  return out.split('\n').filter(Boolean)
}

function listViaFs(absRoot: string, maxDepth: number): string[] {
  const out: string[] = []
  const queue: Array<{abs: string; rel: string; depth: number}> = [
    {abs: absRoot, rel: '', depth: 0},
  ]
  while (queue.length > 0) {
    const {abs, rel, depth} = queue.shift()!
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(abs, {withFileTypes: true})
    } catch {
      continue
    }
    for (const entry of entries) {
      if (COMMON_IGNORES.has(entry.name)) continue
      const childRel = rel ? path.join(rel, entry.name) : entry.name
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        if (depth + 1 <= maxDepth) {
          queue.push({
            abs: path.join(abs, entry.name),
            rel: childRel,
            depth: depth + 1,
          })
        }
      } else if (entry.isFile()) {
        out.push(childRel)
      }
    }
  }
  return out
}

function readGitInfo(absRoot: string): GitInfo | null {
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], absRoot)
  if (branch === null) return null
  const head = runGit(['rev-parse', 'HEAD'], absRoot)
  const log = runGit(['log', '-10', '--oneline'], absRoot)
  const status = runGit(['status', '--porcelain'], absRoot)
  return {
    branch: branch.trim(),
    head: (head ?? '').trim(),
    recentCommits: (log ?? '').trim().split('\n').filter(Boolean),
    dirty: (status ?? '').trim().length > 0,
  }
}

function runGit(args: string[], cwd: string): string | null {
  const r = spawnSync('git', args, {cwd, encoding: 'utf-8'})
  if (r.status !== 0) return null
  return r.stdout
}
