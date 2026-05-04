import React, {useEffect, useRef, useState} from 'react'
import {Box, Static, render} from 'ink'
import type {RepoContext} from '../context/types.ts'
import type {SessionState} from '../state/session.ts'
import type {Scenario} from '../director/director.ts'
import {createSession, mutateSession} from '../state/session.ts'
import {createRepoContext} from '../context/engine.ts'
import {ensureConsent} from '../context/consent.ts'
import {generalScenario} from '../director/scenarios/general.ts'
import {debugFixScenario} from '../director/scenarios/debugFix.ts'
import {explainCodeScenario} from '../director/scenarios/explainCode.ts'
import {addFeatureScenario} from '../director/scenarios/addFeature.ts'
import {failedTestThenFixScenario} from '../director/scenarios/failedTestThenFix.ts'
import {cargoCultDebugScenario} from '../director/scenarios/cargoCultDebug.ts'
import {defaultVibe} from '../vibes/default.ts'
import {getVibe, listVibes} from '../vibes/registry.ts'
import {sleep} from '../pacing/jitter.ts'
import {BlockView, type Block} from '../ui/Block.tsx'
import {streamBeats} from '../ui/streamBeats.ts'

export type AmbientOptions = {
  cwd: string
  sandboxed: boolean
  seed?: number
  vibe?: string
}

export async function runAmbient(opts: AmbientOptions): Promise<void> {
  let ctx: RepoContext | null = null
  if (!opts.sandboxed) {
    const ok = await ensureConsent(opts.cwd)
    if (ok) {
      ctx = await createRepoContext(opts.cwd)
    }
  }

  let vibe = defaultVibe
  if (opts.vibe) {
    const found = getVibe(opts.vibe)
    if (found) vibe = found
    else
      console.error(
        `Unknown vibe '${opts.vibe}'. Available: ${listVibes().join(', ')}.`,
      )
  }

  const session = createSession({
    vibe,
    seed: opts.seed ?? Date.now(),
  })

  const {waitUntilExit} = render(
    <AmbientApp initialSession={session} initialCtx={ctx} />,
  )
  await waitUntilExit()
}

const BASE_POOL: Scenario[] = [
  generalScenario,
  debugFixScenario,
  explainCodeScenario,
  addFeatureScenario,
  failedTestThenFixScenario,
]

function pickAmbientScenario(state: SessionState): Scenario {
  let pool = BASE_POOL
  if (state.vibe.id === 'doomer') {
    pool = [...pool, cargoCultDebugScenario]
  }
  const recent = state.recentScenarios.slice(0, 2)
  const weights = pool.map(s => (recent.includes(s.id) ? 0.3 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = state.rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

type AppProps = {
  initialSession: SessionState
  initialCtx: RepoContext | null
}

function AmbientApp({initialSession, initialCtx}: AppProps) {
  const sessionRef = useRef(initialSession)
  const ctxRef = useRef(initialCtx)
  const nextIdRef = useRef(0)
  const cancelledRef = useRef(false)
  const [history, setHistory] = useState<Block[]>([])
  const [active, setActive] = useState<Block[]>([])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
    }
  }, [])

  useEffect(() => {
    const root = ctxRef.current?.root ?? '(sandboxed)'
    const fileCount = ctxRef.current?.files.length ?? 0
    const vibeId = sessionRef.current.vibe.id
    const banner =
      fileCount > 0
        ? `bluff-code AMBIENT · vibe=${vibeId} · root=${root} (${fileCount} files)`
        : `bluff-code AMBIENT · vibe=${vibeId} · root=${root}`
    setHistory([
      {
        id: nextIdRef.current++,
        kind: 'system',
        text: `${banner}\nLooping scripted arcs. Ctrl+C to exit.`,
      },
    ])
  }, [])

  useEffect(() => {
    let running = true

    const loop = async () => {
      while (running && !cancelledRef.current) {
        const scenario = pickAmbientScenario(sessionRef.current)
        const beats = scenario.expand(sessionRef.current, ctxRef.current)

        const turnBlocks: Block[] = []
        const addBlock = (b: Block) => {
          turnBlocks.push(b)
          setActive(a => [...a, b])
        }
        const updateBlock = (id: number, fn: (b: Block) => Block) => {
          setActive(a => a.map(blk => (blk.id === id ? fn(blk) : blk)))
          const i = turnBlocks.findIndex(b => b.id === id)
          if (i !== -1) turnBlocks[i] = fn(turnBlocks[i])
        }

        nextIdRef.current = await streamBeats(
          beats,
          sessionRef.current,
          {addBlock, updateBlock},
          () => cancelledRef.current,
          nextIdRef.current,
        )

        if (cancelledRef.current) return

        setHistory(h => [...h, ...turnBlocks])
        setActive([])

        sessionRef.current = mutateSession(sessionRef.current, {
          input: '(ambient)',
          scenarioId: scenario.id,
          beats,
        })

        // Inter-arc pause: 2-6 seconds.
        await sleep(2000 + Math.floor(sessionRef.current.rng() * 4000))
      }
    }

    loop()
    return () => {
      running = false
    }
  }, [])

  return (
    <Box flexDirection="column">
      <Static items={history}>
        {block => <BlockView key={block.id} block={block} />}
      </Static>
      <Box flexDirection="column">
        {active.map(block => (
          <BlockView key={block.id} block={block} />
        ))}
      </Box>
    </Box>
  )
}
