#!/usr/bin/env node
// Cross-platform skill setup — works on Mac, Linux, and Windows.
// Creates symlinks from skills/*.md into ~/.claude/commands/ so git pull auto-updates skills.
const fs = require('fs')
const path = require('path')
const os = require('os')

const REPO_DIR = __dirname
const SKILLS_SRC = path.join(REPO_DIR, 'skills')
const SKILLS_DIR = path.join(os.homedir(), '.claude', 'commands')

if (!fs.existsSync(SKILLS_SRC)) {
  console.error(`Error: ${SKILLS_SRC} not found. Run from the repo root.`)
  process.exit(1)
}

fs.mkdirSync(SKILLS_DIR, { recursive: true })
console.log(`Linking skills: ${SKILLS_SRC} → ${SKILLS_DIR}\n`)

let linked = 0, skipped = 0

for (const name of fs.readdirSync(SKILLS_SRC)) {
  if (!name.endsWith('.md') || name === 'README.md') continue
  const src = path.join(SKILLS_SRC, name)
  const target = path.join(SKILLS_DIR, name)

  // Remove existing symlink (stale or pointing elsewhere), skip real files
  if (fs.existsSync(target)) {
    const stat = fs.lstatSync(target)
    if (!stat.isSymbolicLink()) {
      console.log(`  ⚠  ${name} — exists and is not a symlink. Remove manually:\n     del "${target}"  (Windows)  or  rm "${target}"  (Mac/Linux)`)
      skipped++
      continue
    }
    fs.unlinkSync(target)
  }

  try {
    // Windows requires 'file' type for symlinks to files; ignored on Unix
    fs.symlinkSync(src, target, 'file')
    console.log(`  ✓  ${name}`)
    linked++
  } catch (err) {
    if (err.code === 'EPERM' && process.platform === 'win32') {
      console.error(`  ✗  ${name} — Windows symlinks require Developer Mode or Admin rights.`)
      console.error(`     Enable: Settings → System → Developer Mode → on`)
      console.error(`     Or run this script as Administrator.`)
    } else {
      console.error(`  ✗  ${name} — ${err.message}`)
    }
    skipped++
  }
}

console.log(`\n${linked} skill(s) linked, ${skipped} skipped.`)
console.log(`\ngit pull now auto-updates skills without re-running setup.`)
console.log(`Start the dashboard: npm run dev`)
