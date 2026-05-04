import React, {useState} from 'react'
import {Box, Text, useInput} from 'ink'

type Props = {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function PromptBox({onSubmit, disabled}: Props) {
  const [value, setValue] = useState('')

  useInput((input, key) => {
    if (disabled) return

    if (key.return) {
      const trimmed = value.trim()
      if (trimmed) {
        onSubmit(trimmed)
        setValue('')
      }
      return
    }

    if (key.backspace || key.delete) {
      setValue(v => v.slice(0, -1))
      return
    }

    if (key.ctrl && input === 'c') {
      process.exit(0)
    }

    // Plain printable characters.
    if (input && !key.ctrl && !key.meta && !key.escape) {
      setValue(v => v + input)
    }
  })

  return (
    <Box borderStyle="round" paddingX={1} marginTop={1}>
      <Text color="cyan">{'> '}</Text>
      <Text>{value}</Text>
      <Text inverse>{' '}</Text>
    </Box>
  )
}
