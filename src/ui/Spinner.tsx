import React, {useEffect, useState} from 'react'
import {Text} from 'ink'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function Spinner() {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length)
    }, 80)
    return () => clearInterval(interval)
  }, [])
  return <Text color="cyan">{FRAMES[frame]}</Text>
}
