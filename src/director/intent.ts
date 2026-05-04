export type IntentCategory =
  | 'debug'
  | 'explain'
  | 'refactor'
  | 'add-feature'
  | 'review'
  | 'plan'
  | 'general'

export type Intent = {
  category: IntentCategory
  keywords: string[]
  fileHints: string[]
}

const KEYWORDS: Record<Exclude<IntentCategory, 'general'>, string[]> = {
  debug: [
    'fix',
    'bug',
    'error',
    'broken',
    'issue',
    'wrong',
    'crash',
    'fails',
    'failing',
    'debug',
  ],
  explain: [
    'explain',
    'what does',
    'what is',
    'how does',
    'how do',
    'why does',
    'understand',
    'walk me through',
  ],
  refactor: ['refactor', 'clean up', 'cleanup', 'extract', 'simplify', 'restructure', 'rename'],
  'add-feature': ['add', 'implement', 'build', 'create', 'introduce', 'new feature'],
  review: ['review', 'audit', 'inspect', 'look at'],
  plan: ['plan', 'design', 'architect', 'how should we'],
}

export function classifyIntent(input: string): Intent {
  const lower = input.toLowerCase()
  let bestCategory: IntentCategory = 'general'
  let bestScore = 0

  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    let score = 0
    for (const kw of kws) {
      if (lower.includes(kw)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat as IntentCategory
    }
  }

  const keywords = lower.split(/\s+/).filter(w => w.length > 3)
  return {category: bestCategory, keywords, fileHints: []}
}
