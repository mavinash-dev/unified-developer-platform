import { execSync } from 'child_process'

const GREEK = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi',
  'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
]

// Build the full ordered sequence: alpha … omega, then alpha-alpha … omega-omega
const SEQUENCE: string[] = [
  ...GREEK,
  ...GREEK.flatMap(a => GREEK.map(b => `${a}-${b}`)),
]

function resolveVersion(): string | null {
  try {
    const tag = execSync(
      "git tag --sort=-creatordate | grep -E '^[a-z]+(-[a-z]+)?$' | head -1",
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()
    if (tag && SEQUENCE.includes(tag)) return tag
  } catch { /* no git or no tags */ }
  return null // no release yet
}

export const VERSION = resolveVersion()

const idx = VERSION ? SEQUENCE.indexOf(VERSION) : -1
export const PREV = idx > 0 ? SEQUENCE[idx - 1] : null
export const NEXT = idx >= 0 && idx < SEQUENCE.length - 1 ? SEQUENCE[idx + 1] : SEQUENCE[0]

export const TOTAL = SEQUENCE.length  // 600
export const INDEX = idx + 1
