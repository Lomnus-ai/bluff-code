export type FileEntry = {
  path: string // relative to root
  abs: string
  size: number
  ext: string
}

export type GitInfo = {
  branch: string
  head: string
  recentCommits: string[]
  dirty: boolean
}

export type RepoContext = {
  root: string
  files: FileEntry[]
  git: GitInfo | null
  read: (relPath: string) => string | null
  lineCountOf: (relPath: string) => number | null
}
