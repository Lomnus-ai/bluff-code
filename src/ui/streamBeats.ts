import type {Beat} from '../beats/types.ts'
import type {SessionState} from '../state/session.ts'
import {chunkIntoFakeTokens, sampleDelay, sleep} from '../pacing/jitter.ts'
import type {Block} from './Block.tsx'

export type StreamEmit = {
  addBlock: (block: Block) => void
  updateBlock: (id: number, fn: (b: Block) => Block) => void
}

// Streams a sequence of beats into the UI emitter, returning the next id to use.
// Used by one-shot App, REPL, and ambient.
export async function streamBeats(
  beats: Beat[],
  session: SessionState,
  emit: StreamEmit,
  isCancelled: () => boolean,
  startId: number,
): Promise<number> {
  let nextId = startId
  for (const beat of beats) {
    if (isCancelled()) return nextId

    if (beat.kind === 'chat') {
      const id = nextId++
      emit.addBlock({id, kind: 'chat', text: ''})
      const chunks = chunkIntoFakeTokens(beat.text, session.rng)
      for (const chunk of chunks) {
        if (isCancelled()) return nextId
        emit.updateBlock(id, b =>
          b.kind === 'chat' ? {...b, text: b.text + chunk} : b,
        )
        await sleep(sampleDelay(session.vibe.jitter, session.rng))
      }
    } else if (beat.kind === 'pause') {
      await sleep(beat.ms)
    } else if (beat.kind === 'tool') {
      const id = nextId++
      emit.addBlock({id, kind: 'tool-running', call: beat.call})
      await sleep(beat.durationMs)
      if (isCancelled()) return nextId
      emit.updateBlock(id, () => ({
        id,
        kind: 'tool-done',
        call: beat.call,
        result: beat.result,
      }))
    } else if (beat.kind === 'thinking') {
      const id = nextId++
      emit.addBlock({id, kind: 'thinking', label: beat.label ?? 'thinking'})
      await sleep(beat.ms)
      if (isCancelled()) return nextId
      emit.updateBlock(id, () => ({
        id,
        kind: 'thinking-done',
        label: beat.label ?? 'thinking',
      }))
    }
  }
  return nextId
}
