export type ToolCall =
  | {name: 'Read'; path: string}
  | {name: 'Grep'; pattern: string; glob?: string}
  | {name: 'Edit'; path: string}
  | {name: 'Write'; path: string}
  | {name: 'Bash'; cmd: string}
  | {name: 'Glob'; pattern: string}

export type ToolResult =
  | {kind: 'lines'; count: number}
  | {kind: 'matches'; matchCount: number; fileCount: number}
  | {kind: 'edited'; additions: number; removals: number}
  | {kind: 'created'; lines: number}
  | {kind: 'bash'; lines: string[]}
  | {kind: 'paths'; paths: string[]}

export type ToolName = ToolCall['name']

export function formatToolCall(call: ToolCall): string {
  switch (call.name) {
    case 'Read':
      return `Read(${call.path})`
    case 'Grep':
      return call.glob
        ? `Grep(pattern: "${call.pattern}", glob: "${call.glob}")`
        : `Grep(pattern: "${call.pattern}")`
    case 'Edit':
      return `Edit(${call.path})`
    case 'Write':
      return `Write(${call.path})`
    case 'Bash':
      return `Bash(${call.cmd})`
    case 'Glob':
      return `Glob(${call.pattern})`
  }
}

export function formatToolResult(result: ToolResult, call: ToolCall): string {
  switch (result.kind) {
    case 'lines':
      return `Read ${result.count} lines`
    case 'matches': {
      const noun = result.matchCount === 1 ? 'match' : 'matches'
      const files = result.fileCount === 1 ? '1 file' : `${result.fileCount} files`
      return `Found ${result.matchCount} ${noun} in ${files}`
    }
    case 'edited': {
      const path = call.name === 'Edit' ? call.path : ''
      const adds = `${result.additions} addition${result.additions === 1 ? '' : 's'}`
      const dels = `${result.removals} removal${result.removals === 1 ? '' : 's'}`
      return `Updated ${path} with ${adds} and ${dels}`
    }
    case 'created': {
      const path = call.name === 'Write' ? call.path : ''
      return `Created ${path} (${result.lines} lines)`
    }
    case 'bash':
      return result.lines.join('\n')
    case 'paths':
      return result.paths.length === 1
        ? `Found 1 file`
        : `Found ${result.paths.length} files`
  }
}
