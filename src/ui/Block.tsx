import React from 'react'
import {Box, Text} from 'ink'
import type {ToolCall, ToolResult} from '../tools/types.ts'
import {formatToolCall, formatToolResult} from '../tools/types.ts'
import {Spinner} from './Spinner.tsx'

export type Block =
  | {id: number; kind: 'chat'; text: string}
  | {id: number; kind: 'tool-running'; call: ToolCall}
  | {id: number; kind: 'tool-done'; call: ToolCall; result: ToolResult}
  | {id: number; kind: 'system'; text: string}
  | {id: number; kind: 'thinking'; label: string}
  | {id: number; kind: 'thinking-done'; label: string}

export function BlockView({block}: {block: Block}) {
  if (block.kind === 'chat') {
    return (
      <Box marginBottom={1}>
        <Text>{block.text}</Text>
      </Box>
    )
  }

  if (block.kind === 'system') {
    return (
      <Box marginBottom={1}>
        <Text dimColor>{block.text}</Text>
      </Box>
    )
  }

  if (block.kind === 'thinking') {
    return (
      <Box marginBottom={1}>
        <Spinner />
        <Text dimColor>{` ${block.label}…`}</Text>
      </Box>
    )
  }

  if (block.kind === 'thinking-done') {
    return (
      <Box marginBottom={1}>
        <Text dimColor>{`✓ ${block.label}`}</Text>
      </Box>
    )
  }

  if (block.kind === 'tool-running') {
    return (
      <Box>
        <Text color="cyan" bold>{'● '}</Text>
        <Text>{formatToolCall(block.call)}{' '}</Text>
        <Spinner />
      </Box>
    )
  }

  // tool-done
  const resultText = formatToolResult(block.result, block.call)
  const lines = resultText.split('\n')
  const firstLine = lines[0]
  let firstLineColor: string | undefined
  if (firstLine.startsWith('FAIL')) firstLineColor = 'red'
  else if (firstLine.startsWith('PASS')) firstLineColor = 'green'

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color="cyan" bold>{'● '}</Text>
        <Text>{formatToolCall(block.call)}</Text>
      </Box>
      <Box>
        <Text color="gray">{'  ⎿  '}</Text>
        <Text color={firstLineColor}>{firstLine}</Text>
      </Box>
      {lines.slice(1).map((line, i) => (
        <Text key={i}>{`     ${line}`}</Text>
      ))}
    </Box>
  )
}
