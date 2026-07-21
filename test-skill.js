#!/usr/bin/env node
/**
 * Skill test runner — validates a skill's output against assertions.
 *
 * Usage:
 *   node test-skill.js <skill-name>
 *   node test-skill.js cold-message
 *   node test-skill.js all
 *
 * Test files live at: skills/tests/<skill-name>.test.json
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const SKILLS_DIR = path.join(__dirname, 'skills')
const TESTS_DIR = path.join(SKILLS_DIR, 'tests')
const TIMEOUT_MS = 120_000

function readSkillPrompt(skillName) {
  const p = path.join(SKILLS_DIR, `${skillName}.md`)
  if (!fs.existsSync(p)) throw new Error(`Skill file not found: ${p}`)
  return fs.readFileSync(p, 'utf-8')
}

function buildPrompt(skillContent, args) {
  // Strip YAML frontmatter
  const stripped = skillContent.replace(/^---[\s\S]*?---\n/, '').trim()
  return stripped.replace(/\$ARGUMENTS/g, args || '')
}

function runClaude(prompt) {
  const escaped = prompt.replace(/'/g, "'\\''")
  const cmd = `claude -p '${escaped}' --output-format text 2>/dev/null`
  try {
    return execSync(cmd, { timeout: TIMEOUT_MS, encoding: 'utf-8' })
  } catch (e) {
    throw new Error(`Claude invocation failed: ${e.message}`)
  }
}

function assert(name, output, assertion) {
  const { type, value, description } = assertion
  switch (type) {
    case 'contains':
      if (!output.toLowerCase().includes(value.toLowerCase())) {
        return { pass: false, msg: `Expected output to contain "${value}"` }
      }
      break
    case 'not_contains':
      if (output.toLowerCase().includes(value.toLowerCase())) {
        return { pass: false, msg: `Expected output NOT to contain "${value}"` }
      }
      break
    case 'min_length':
      if (output.length < value) {
        return { pass: false, msg: `Expected output length >= ${value}, got ${output.length}` }
      }
      break
    case 'matches_regex':
      if (!new RegExp(value, 'i').test(output)) {
        return { pass: false, msg: `Expected output to match regex /${value}/i` }
      }
      break
    default:
      return { pass: false, msg: `Unknown assertion type: ${type}` }
  }
  return { pass: true, msg: description || type }
}

function runTests(skillName) {
  const testFile = path.join(TESTS_DIR, `${skillName}.test.json`)
  if (!fs.existsSync(testFile)) {
    console.log(`⚠  No test file for "${skillName}" — skipping`)
    return { skipped: true }
  }

  const tests = JSON.parse(fs.readFileSync(testFile, 'utf-8'))
  const skillContent = readSkillPrompt(skillName)

  let passed = 0
  let failed = 0

  console.log(`\n▶ Testing skill: ${skillName}`)
  console.log(`  ${tests.length} test case(s)\n`)

  for (const tc of tests) {
    const label = tc.name || tc.args || '(no label)'
    process.stdout.write(`  • ${label} ... `)

    let output
    try {
      const prompt = buildPrompt(skillContent, tc.args)
      output = runClaude(prompt)
    } catch (e) {
      console.log(`FAIL\n    ${e.message}`)
      failed++
      continue
    }

    const results = (tc.assertions || []).map(a => assert(skillName, output, a))
    const allPass = results.every(r => r.pass)

    if (allPass) {
      console.log('PASS')
      passed++
    } else {
      console.log('FAIL')
      results.filter(r => !r.pass).forEach(r => console.log(`    ✗ ${r.msg}`))
      if (process.env.VERBOSE) {
        console.log('\n--- output ---')
        console.log(output.slice(0, 500))
        console.log('--- end ---\n')
      }
      failed++
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: node test-skill.js <skill-name|all>')
  process.exit(1)
}

fs.mkdirSync(TESTS_DIR, { recursive: true })

let skillNames
if (arg === 'all') {
  skillNames = fs.readdirSync(SKILLS_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => f.replace('.md', ''))
} else {
  skillNames = [arg]
}

let totalPassed = 0
let totalFailed = 0
let totalSkipped = 0

for (const name of skillNames) {
  try {
    const result = runTests(name)
    if (result.skipped) { totalSkipped++; continue }
    totalPassed += result.passed
    totalFailed += result.failed
  } catch (e) {
    console.error(`\n✗ Error running tests for "${name}": ${e.message}`)
    totalFailed++
  }
}

if (skillNames.length > 1) {
  console.log(`\n═══════════════════════════`)
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`)
}

process.exit(totalFailed > 0 ? 1 : 0)
