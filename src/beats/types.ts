import type {ToolCall, ToolResult} from '../tools/types.ts'

// A scripted output unit.
export type Beat =
  | {kind: 'chat'; text: string}
  | {kind: 'pause'; ms: number}
  | {kind: 'tool'; call: ToolCall; result: ToolResult; durationMs: number}
  | {kind: 'thinking'; label?: string; ms: number}
