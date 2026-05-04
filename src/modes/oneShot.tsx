import React from 'react'
import {render} from 'ink'
import type {RepoContext} from '../context/types.ts'
import {App} from '../main.tsx'
import {Director} from '../director/director.ts'
import {generalScenario} from '../director/scenarios/general.ts'
import {debugFixScenario} from '../director/scenarios/debugFix.ts'
import {explainCodeScenario} from '../director/scenarios/explainCode.ts'
import {addFeatureScenario} from '../director/scenarios/addFeature.ts'
import {defaultVibe} from '../vibes/default.ts'
import {getVibe, listVibes} from '../vibes/registry.ts'
import {createSession} from '../state/session.ts'
import {createRepoContext} from '../context/engine.ts'
import {ensureConsent} from '../context/consent.ts'

export type OneShotOptions = {
  prompt: string
  seed?: number
  cwd: string
  sandboxed: boolean
  vibe?: string
}

export async function runOneShot(opts: OneShotOptions): Promise<void> {
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
  const {beats} = director.run(opts.prompt, session, ctx)

  const {waitUntilExit} = render(<App beats={beats} session={session} />)
  await waitUntilExit()
}
