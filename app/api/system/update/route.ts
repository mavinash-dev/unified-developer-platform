import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { VERSION } from '@/lib/version'

function run(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: 'utf-8' }).trim()
}

function latestCommit(cwd: string): { message: string; date: string } {
  try {
    const out = run('git log -1 --format=%s|%ci', cwd)
    const pipe = out.indexOf('|')
    const message = out.slice(0, pipe).trim()
    const rawDate = out.slice(pipe + 1).trim()
    const date = new Date(rawDate).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    return { message, date }
  } catch {
    return { message: '', date: '' }
  }
}

function latestReleaseTag(cwd: string): string | null {
  try {
    const tags = run("git tag --sort=-creatordate", cwd)
      .split('\n')
      .map(t => t.trim())
      .filter(t => /^[a-z]+(-[a-z]+)?$/.test(t))
    return tags[0] ?? null
  } catch {
    return null
  }
}

export async function POST() {
  const cwd = process.cwd()
  try {
    // Fetch latest tags and commits without changing anything yet
    run('git fetch --tags --quiet', cwd)

    const latestTag = latestReleaseTag(cwd)
    const alreadyUpToDate = latestTag === VERSION || (!latestTag && !VERSION)

    if (!alreadyUpToDate && latestTag) {
      run(`git checkout ${latestTag} --quiet`, cwd)
      execSync('npm install --silent', { cwd, encoding: 'utf-8' })
    }

    const commit = latestCommit(cwd)
    const newRelease = latestTag && latestTag !== VERSION ? latestTag : null

    return NextResponse.json({ ok: true, alreadyUpToDate, commit, runningVersion: VERSION, latestTag, newRelease })
  } catch (e) {
    const msg = (e as { message?: string }).message ?? 'unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
