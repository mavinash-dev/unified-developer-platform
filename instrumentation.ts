export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { VERSION, PREV, NEXT } = await import('./lib/version')

    const c = {
      violet: '\x1b[38;5;141m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
      white: '\x1b[97m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
    }

    const versionLine = [
      PREV ? `${c.gray}${PREV}${c.reset}` : null,
      `${c.violet}${c.bold}${VERSION}${c.reset}`,
      NEXT ? `${c.gray}${NEXT}${c.reset}` : null,
    ].filter(Boolean).join(`  ${c.gray}→${c.reset}  `)

    const lines = [
      '',
      `${c.violet}${c.bold}  ██╗   ██╗██████╗ ██████╗ ${c.reset}`,
      `${c.violet}${c.bold}  ██║   ██║██╔══██╗██╔══██╗${c.reset}`,
      `${c.violet}${c.bold}  ██║   ██║██║  ██║██║  ██║${c.reset}`,
      `${c.violet}${c.bold}  ██║   ██║██║  ██║██║  ██║${c.reset}`,
      `${c.violet}${c.bold}  ╚██████╔╝██████╔╝██████╔╝${c.reset}`,
      `${c.violet}${c.bold}   ╚═════╝ ╚═════╝ ╚═════╝ ${c.reset}  ${c.white}${c.bold}Unified Developer Dashboard${c.reset}`,
      '',
      `${c.gray}  version  ${c.reset}${versionLine}`,
      `${c.gray}  by ${c.white}Avinash${c.gray} · ${c.cyan}mavinash.dev@gmail.com${c.reset}`,
      `${c.gray}  ${c.cyan}https://github.com/mavinash-dev/unified-developer-platform${c.reset}`,
      `${c.gray}  http://localhost:${process.env.PORT ?? 3004}${c.reset}`,
      '',
    ]

    console.log(lines.join('\n'))
  }
}
