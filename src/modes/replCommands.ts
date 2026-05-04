export type SlashResult =
  | {kind: 'exit'}
  | {kind: 'clear'}
  | {kind: 'message'; text: string}
  | {kind: 'changeSeed'; seed: number}
  | {kind: 'changeVibe'; vibe: string}
  | {kind: 'changeCwd'; path: string}
  | {kind: 'runScenario'; scenarioId: 'init' | 'plan'}

export function parseSlashCommand(input: string): SlashResult {
  const trimmed = input.trim()
  const [cmd, ...args] = trimmed.slice(1).split(/\s+/)
  switch (cmd) {
    case 'exit':
    case 'quit':
      return {kind: 'exit'}
    case 'clear':
      return {kind: 'clear'}
    case 'seed': {
      const n = Number.parseInt(args[0] ?? '', 10)
      if (Number.isNaN(n)) return {kind: 'message', text: 'Usage: /seed <number>'}
      return {kind: 'changeSeed', seed: n}
    }
    case 'vibe':
      if (!args[0]) return {kind: 'message', text: 'Usage: /vibe <name>'}
      return {kind: 'changeVibe', vibe: args[0]}
    case 'cd':
      if (!args[0]) return {kind: 'message', text: 'Usage: /cd <path>'}
      return {kind: 'changeCwd', path: args.join(' ')}
    case 'init':
      return {kind: 'runScenario', scenarioId: 'init'}
    case 'plan':
      return {kind: 'runScenario', scenarioId: 'plan'}
    case 'help':
      return {
        kind: 'message',
        text: 'commands: /clear  /seed <n>  /vibe <name>  /cd <path>  /init  /plan  /exit  /help',
      }
    default:
      return {kind: 'message', text: `Unknown command: /${cmd}. Try /help.`}
  }
}
