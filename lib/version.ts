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

export const VERSION = 'alpha'

const idx = SEQUENCE.indexOf(VERSION)
export const PREV = idx > 0 ? SEQUENCE[idx - 1] : null
export const NEXT = idx < SEQUENCE.length - 1 ? SEQUENCE[idx + 1] : null

// How many versions exist total
export const TOTAL = SEQUENCE.length   // 24 + 576 = 600
export const INDEX = idx + 1           // 1-based position (delta = 4)
