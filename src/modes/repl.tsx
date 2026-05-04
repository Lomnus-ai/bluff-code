import React, {useEffect, useRef, useState} from 'react'
import * as path from 'path'
import {Box, Static, render, useApp, useStdout} from 'ink'
import type {RepoContext} from '../context/types.ts'
import type {SessionState} from '../state/session.ts'
import type {Beat} from '../beats/types.ts'
import {createSession, mutateSession} from '../state/session.ts'
import {createRepoContext} from '../context/engine.ts'
import {ensureConsent} from '../context/consent.ts'
import {Director} from '../director/director.ts'
import {generalScenario} from '../director/scenarios/general.ts'
import {debugFixScenario} from '../director/scenarios/debugFix.ts'
import {explainCodeScenario} from '../director/scenarios/explainCode.ts'
import {addFeatureScenario} from '../director/scenarios/addFeature.ts'
import {initScenario} from '../director/scenarios/init.ts'
import {planScenario} from '../director/scenarios/plan.ts'
import {defaultVibe} from '../vibes/default.ts'
import {getVibe, listVibes} from '../vibes/registry.ts'
import {mulberry32} from '../utils/rng.ts'
import {BlockView, type Block} from '../ui/Block.tsx'
import {streamBeats} from '../ui/streamBeats.ts'
import {PromptBox} from '../ui/PromptBox.tsx'
import {parseSlashCommand} from './replCommands.ts'

export type ReplOptions = {
  cwd: string
  sandboxed: boolean
  seed?: number
  vibe?: string
}

export async function runRepl(opts: ReplOptions): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error('REPL mode requires an interactive terminal (TTY).')
    console.error('Use one-shot mode (bluff <prompt>) for non-interactive contexts.')
    process.exit(1)
  }

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
    if (found) {
      vibe = found
    } else {
      console.error(
        `Unknown vibe '${opts.vibe}'. Available: ${listVibes().join(', ')}. Falling back to default.`,
      )
    }
  }

  const session = createSession({
    vibe,
    seed: opts.seed ?? Date.now(),
  })

  const director = new Director([
    debugFixScenario,
    explainCodeScenario,
    addFeatureScenario,
    generalScenario,
  ])

  const {waitUntilExit} = render(
    <ReplApp initialCtx={ctx} initialSession={session} director={director} />,
  )
  await waitUntilExit()
}

type ReplAppProps = {
  initialCtx: RepoContext | null
  initialSession: SessionState
  director: Director
}

function ReplApp({initialCtx, initialSession, director}: ReplAppProps) {
  const {exit} = useApp()
  const {stdout} = useStdout()
  const sessionRef = useRef(initialSession)
  const ctxRef = useRef(initialCtx)
  const nextIdRef = useRef(0)
  const cancelledRef = useRef(false)
  const [history, setHistory] = useState<Block[]>([])
  const [active, setActive] = useState<Block[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
    }
  }, [])

  // Initial banner.
  useEffect(() => {
    const root = ctxRef.current?.root ?? '(sandboxed)'
    const fileCount = ctxRef.current?.files.length ?? 0
    const vibeId = sessionRef.current.vibe.id
    const banner =
      fileCount > 0
        ? `bluff-code REPL · vibe=${vibeId} · root=${root} (${fileCount} files indexed)`
        : `bluff-code REPL · vibe=${vibeId} · root=${root}`
    setHistory([
      {
        id: nextIdRef.current++,
        kind: 'system',
        text: `${banner}\nType /help for commands, /exit to quit.`,
      },
    ])
  }, [])

  const appendHistory = (block: Block) =>
    setHistory(h => [...h, block])

  const appendSystem = (text: string) =>
    appendHistory({id: nextIdRef.current++, kind: 'system', text})

  const runBeats = async (
    beats: Beat[],
    scenarioId: string,
    inputForSession: string,
  ) => {
    setBusy(true)
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

    setHistory(h => [...h, ...turnBlocks])
    setActive([])
    setBusy(false)

    sessionRef.current = mutateSession(sessionRef.current, {
      input: inputForSession,
      scenarioId,
      beats,
    })
  }

  const handleSubmit = async (input: string) => {
    appendHistory({id: nextIdRef.current++, kind: 'chat', text: `> ${input}`})

    if (input.startsWith('/')) {
      const r = parseSlashCommand(input)
      switch (r.kind) {
        case 'exit':
          appendSystem('bye.')
          setTimeout(() => exit(), 30)
          return
        case 'clear':
          setHistory([])
          setActive([])
          stdout.write('\x1b[2J\x1b[H')
          return
        case 'changeSeed':
          sessionRef.current = {
            ...sessionRef.current,
            seed: r.seed,
            rng: mulberry32(r.seed),
          }
          appendSystem(`seed → ${r.seed}`)
          return
        case 'changeVibe': {
          const newVibe = getVibe(r.vibe)
          if (!newVibe) {
            appendSystem(
              `unknown vibe '${r.vibe}'. available: ${listVibes().join(', ')}`,
            )
            return
          }
          sessionRef.current = {...sessionRef.current, vibe: newVibe}
          appendSystem(`vibe → ${newVibe.id}`)
          return
        }
        case 'changeCwd': {
          const newRoot = path.resolve(r.path)
          appendSystem(`switching root to ${newRoot}…`)
          try {
            const newCtx = await createRepoContext(newRoot)
            ctxRef.current = newCtx
            appendSystem(
              `root → ${newRoot} (${newCtx.files.length} files indexed)`,
            )
          } catch (e) {
            appendSystem(`failed to switch root: ${(e as Error).message}`)
          }
          return
        }
        case 'runScenario': {
          const scenario = r.scenarioId === 'init' ? initScenario : planScenario
          const beats = scenario.expand(sessionRef.current, ctxRef.current)
          await runBeats(beats, scenario.id, input)
          return
        }
        case 'message':
          appendSystem(r.text)
          return
      }
    }

    const {beats, scenarioId} = director.run(
      input,
      sessionRef.current,
      ctxRef.current,
    )
    await runBeats(beats, scenarioId, input)
  }

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
      {!busy && <PromptBox onSubmit={handleSubmit} />}
    </Box>
  )
}
