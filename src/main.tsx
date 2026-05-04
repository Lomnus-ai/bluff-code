import React, {useEffect, useRef, useState} from 'react'
import {Box, useApp} from 'ink'
import type {Beat} from './beats/types.ts'
import type {SessionState} from './state/session.ts'
import {sleep} from './pacing/jitter.ts'
import {BlockView, type Block} from './ui/Block.tsx'
import {streamBeats} from './ui/streamBeats.ts'

type Props = {
  beats: Beat[]
  session: SessionState
}

// One-shot mode UI: streams a single sequence of beats and exits.
export function App({beats, session}: Props) {
  const {exit} = useApp()
  const [blocks, setBlocks] = useState<Block[]>([])
  const cancelledRef = useRef(false)

  useEffect(() => {
    const addBlock = (b: Block) => setBlocks(prev => [...prev, b])
    const updateBlock = (id: number, fn: (b: Block) => Block) =>
      setBlocks(prev => prev.map(blk => (blk.id === id ? fn(blk) : blk)))

    const run = async () => {
      await streamBeats(
        beats,
        session,
        {addBlock, updateBlock},
        () => cancelledRef.current,
        0,
      )
      await sleep(60)
      if (!cancelledRef.current) exit()
    }
    run()
    return () => {
      cancelledRef.current = true
    }
  }, [])

  return (
    <Box flexDirection="column">
      {blocks.map(block => (
        <BlockView key={block.id} block={block} />
      ))}
    </Box>
  )
}
