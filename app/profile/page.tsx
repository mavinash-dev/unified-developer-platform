'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EyebrowLabel from '@/components/EyebrowLabel'

interface Snippet { id: number; label: string; content: string }

interface UserConfig {
  name: string | null
  contextFiles: string[]
  createdAt?: string
}

interface Stats {
  totalSessions: number
  totalTokensIn: number
  totalTokensOut: number
  totalApplications: number
  topSkill: string | null
}

const INSTALL_CMD = 'curl -fsSL https://raw.githubusercontent.com/mavinash-dev/unified-developer-platform/main/setup.sh | bash'

const GREEK_SYMBOL: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ',
  nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', rho: 'ρ', sigma: 'σ',
  tau: 'τ', upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
}
function greekSymbol(v: string): string {
  if (v.includes('-')) { const [a, b] = v.split('-'); return (GREEK_SYMBOL[a] ?? a[0]) + (GREEK_SYMBOL[b] ?? b[0]) }
  return GREEK_SYMBOL[v] ?? v[0]
}


export default function ProfilePage() {
  const router = useRouter()
  const [config, setConfig] = useState<UserConfig>({ name: null, contextFiles: [] })
  const [stats, setStats] = useState<Stats | null>(null)
  const [name, setName] = useState('')
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [version, setVersion] = useState<{ version: string | null; prev: string | null; next: string | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then((u: UserConfig) => { setConfig(u); setName(u.name ?? '') })
    fetch('/api/profile/stats').then(r => r.json()).then(setStats)
    fetch('/api/context-snippets').then(r => r.json()).then(setSnippets)
    fetch('/api/version').then(r => r.json()).then(setVersion)
  }, [])

  const saveName = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), contextFiles: [] }),
    })
    setConfig(c => ({ ...c, name: name.trim() }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      <header className="mx-auto max-w-3xl px-6 py-14 flex flex-col gap-4">
        <EyebrowLabel>Profile</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          {config.name ? <><span style={{ color: 'var(--accent-primary)' }}>{config.name}</span>.</> : 'Your profile.'}
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--fg-muted)' }}>
          Your local command center. No cloud. No accounts. Just you and the grind.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <main className="mx-auto max-w-3xl px-6 py-12 flex flex-col gap-10">

        {/* Stats */}
        {stats && (
          <section className="flex flex-col gap-4">
            <p className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>Activity</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Skill runs', value: stats.totalSessions },
                { label: 'Tokens used', value: fmtNum(stats.totalTokensIn + stats.totalTokensOut) },
                { label: 'Applications', value: stats.totalApplications },
                { label: 'Top skill', value: stats.topSkill ? `/${stats.topSkill}` : '—', mono: true },
              ].map(s => (
                <div key={s.label} className="rounded-[12px] p-4 flex flex-col gap-1"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                  <span className={`text-[20px] font-semibold ${s.mono ? 'font-mono text-[15px]' : ''}`} style={{ color: 'var(--accent-primary)' }}>
                    {s.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Name */}
        <section className="flex flex-col gap-4">
          <div>
            <p className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>Display name</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
              Used in greetings and injected into every skill run so Claude knows who it&apos;s helping.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              className="dev-input text-[15px] max-w-xs"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              placeholder="Your name"
            />
            <button onClick={saveName} disabled={saving || !name.trim()} className="btn btn-sm btn-primary">
              {saved ? '✓ Saved' : saving ? '…' : 'Save'}
            </button>
          </div>
        </section>

        {/* Context snippets */}
        <ContextSnippets snippets={snippets} onChange={setSnippets} />

        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Share */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>Share with a friend</p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
                One command — clones, installs, and starts UDD. Requires Node 18+ and Claude CLI.
              </p>
            </div>
            {version && <VersionBadge version={version.version} next={version.next} />}
          </div>
          <div className="rounded-[12px] p-4 flex items-start justify-between gap-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
            <code className="font-mono text-[13px] leading-relaxed break-all" style={{ color: 'var(--accent-primary)' }}>
              {INSTALL_CMD}
            </code>
            <CopyBtn text={INSTALL_CMD} />
          </div>
        </section>

        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Danger zone */}
        <DangerZone onCleaned={() => router.push('/')} />
      </main>
    </div>
  )
}

// ── Context snippets ──────────────────────────────────────────────────────────

const SNIPPET_SUGGESTIONS = [
  { label: 'My Resume',        hint: 'Your work history, skills, achievements' },
  { label: 'About Me',         hint: 'Who you are, what you\'re looking for, preferences' },
  { label: 'Tech Stack',       hint: 'Languages, frameworks, tools you use daily' },
  { label: 'Current Company',  hint: 'Team, product, your role and context there' },
  { label: 'Salary & Goals',   hint: 'Target comp, location, role level, timeline' },
]

function ContextSnippets({ snippets, onChange }: { snippets: Snippet[]; onChange: (s: Snippet[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const deleteSnippet = async (id: number) => {
    await fetch(`/api/context-snippets/${id}`, { method: 'DELETE' })
    onChange(snippets.filter(s => s.id !== id))
  }

  const updateSnippet = async (id: number, content: string) => {
    const res = await fetch(`/api/context-snippets/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const updated = await res.json()
    onChange(snippets.map(s => s.id === id ? updated : s))
    setEditingId(null)
  }

  const addSnippet = async (label: string, content: string) => {
    const res = await fetch('/api/context-snippets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, content }),
    })
    const created = await res.json()
    onChange([...snippets, created])
    setAdding(false)
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>Your context</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
          Claude reads this before every skill run and chat. Add anything that helps it understand who you are and what you&apos;re working on.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {snippets.map(s => (
          <SnippetCard
            key={s.id}
            snippet={s}
            editing={editingId === s.id}
            onEdit={() => setEditingId(s.id)}
            onSave={content => updateSnippet(s.id, content)}
            onCancel={() => setEditingId(null)}
            onDelete={() => deleteSnippet(s.id)}
          />
        ))}

        {adding
          ? <AddSnippetForm suggestions={SNIPPET_SUGGESTIONS} existing={snippets.map(s => s.label)} onAdd={addSnippet} onCancel={() => setAdding(false)} />
          : <button onClick={() => setAdding(true)} className="font-mono text-[12px] self-start" style={{ color: 'var(--accent-primary)' }}>+ Add context</button>
        }
      </div>
    </section>
  )
}

function SnippetCard({ snippet, editing, onEdit, onSave, onCancel, onDelete }: {
  snippet: Snippet; editing: boolean
  onEdit: () => void; onSave: (c: string) => void; onCancel: () => void; onDelete: () => void
}) {
  const [draft, setDraft] = useState(snippet.content)
  const [fileName, setFileName] = useState<string | null>(null)
  useEffect(() => setDraft(snippet.content), [snippet.content])

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setDraft(text)
    setFileName(file.name)
  }

  return (
    <div className="rounded-[12px] flex flex-col overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: editing ? '1px solid var(--border-subtle)' : 'none' }}>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{snippet.label}</span>
        <div className="flex gap-1">
          {!editing && <button onClick={onEdit} className="btn btn-sm btn-ghost font-mono text-[11px]">Edit</button>}
          <button onClick={onDelete} className="btn btn-sm btn-ghost text-[11px]" style={{ color: 'var(--destructive)' }}>✕</button>
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col gap-3 p-4">
          <label
            className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] self-start cursor-pointer"
            style={{ background: 'var(--elevated)', border: '1px dashed var(--border-subtle)', color: fileName ? 'var(--accent-primary)' : 'var(--fg-muted)' }}
          >
            <input type="file" accept=".md,.txt,.pdf,.doc,.docx" className="hidden" onChange={pickFile} />
            📂 {fileName ? `${fileName} — ${draft.length.toLocaleString()} chars` : 'Replace with file…'}
          </label>
          <textarea
            className="dev-input resize-none text-[13px] leading-relaxed"
            rows={6}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Or edit manually…"
          />
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn btn-sm btn-ghost flex-1">Cancel</button>
            <button onClick={() => onSave(draft)} className="btn btn-sm btn-primary flex-1">Save</button>
          </div>
        </div>
      ) : (
        <p className="px-4 py-3 text-[13px] leading-relaxed line-clamp-3 cursor-pointer" style={{ color: 'var(--fg-muted)', opacity: snippet.content ? 1 : 0.4 }} onClick={onEdit}>
          {snippet.content || 'Empty — click Edit to add content'}
        </p>
      )}
    </div>
  )
}

function AddSnippetForm({ suggestions, existing, onAdd, onCancel }: {
  suggestions: { label: string; hint: string }[]
  existing: string[]
  onAdd: (label: string, content: string) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const available = suggestions.filter(s => !existing.includes(s.label))

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setContent(text)
    setFileName(file.name)
  }

  return (
    <div className="rounded-[12px] flex flex-col gap-4 p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
      {available.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Pick a category</p>
          <div className="flex flex-wrap gap-2">
            {available.map(s => (
              <button
                key={s.label}
                onClick={() => { setLabel(s.label); setContent(''); setFileName(null) }}
                title={s.hint}
                className="font-mono text-[11px] px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: label === s.label ? 'rgba(168,85,247,0.2)' : 'var(--elevated)',
                  color: label === s.label ? 'var(--accent-primary)' : 'var(--fg-muted)',
                  border: `1px solid ${label === s.label ? 'rgba(168,85,247,0.4)' : 'var(--border-subtle)'}`,
                }}
              >
                {label === s.label ? '✓ ' : ''}{s.label}
              </button>
            ))}
          </div>
          {label && available.find(s => s.label === label) && (
            <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              {available.find(s => s.label === label)?.hint}
            </p>
          )}
        </div>
      )}

      {/* Custom label if not using a suggestion */}
      {!available.find(s => s.label === label) && (
        <input
          className="dev-input text-[13px]"
          placeholder="Label (e.g. My Resume)"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      )}

      {/* File picker — primary input */}
      {label && (
        <div className="flex flex-col gap-2">
          <label
            className="flex flex-col items-center justify-center gap-2 rounded-[12px] px-6 py-8 cursor-pointer text-center transition-colors"
            style={{
              background: fileName ? 'rgba(168,85,247,0.08)' : 'var(--elevated)',
              border: `2px dashed ${fileName ? 'rgba(168,85,247,0.5)' : 'var(--border-subtle)'}`,
              color: fileName ? 'var(--accent-primary)' : 'var(--fg-muted)',
            }}
          >
            <input type="file" accept=".md,.txt,.pdf,.doc,.docx" className="hidden" onChange={pickFile} />
            <span style={{ fontSize: 28 }}>{fileName ? '✅' : '📂'}</span>
            <span className="text-[14px] font-medium">
              {fileName ? fileName : `Click to select your ${label.toLowerCase()} file`}
            </span>
            {!fileName && (
              <span className="text-[11px]" style={{ color: 'var(--fg-muted)', opacity: 0.6 }}>
                .md · .txt · .pdf · .doc
              </span>
            )}
            {content && (
              <span className="font-mono text-[11px]" style={{ color: '#10b981' }}>
                ✓ {content.length.toLocaleString()} chars — ready
              </span>
            )}
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn btn-sm btn-ghost flex-1">Cancel</button>
        <button onClick={() => onAdd(label, content)} disabled={!label.trim() || !content.trim()} className="btn btn-sm btn-primary flex-1">Add</button>
      </div>
    </div>
  )
}

// ── Danger zone ───────────────────────────────────────────────────────────────

function DangerZone({ onCleaned }: { onCleaned: () => void }) {
  const [updating, setUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<{ upToDate: boolean; commit?: { message: string; date: string }; newRelease?: string | null; error?: string } | null>(null)
  const [showClean, setShowClean] = useState(false)
  const [cleanConfirm, setCleanConfirm] = useState('')
  const [cleaning, setCleaning] = useState(false)
  const [alreadyClean, setAlreadyClean] = useState(false)

  const update = async () => {
    setUpdating(true)
    setUpdateResult(null)
    try {
      const res = await fetch('/api/system/update', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setUpdateResult({ upToDate: data.alreadyUpToDate, commit: data.commit, newRelease: data.newRelease })
      } else {
        setUpdateResult({ upToDate: false, error: data.error })
      }
    } catch {
      setUpdateResult({ upToDate: false, error: 'Request failed' })
    }
    setUpdating(false)
  }

  const clean = async () => {
    if (cleanConfirm !== 'DELETE MY DATA') return
    setCleaning(true)
    try {
      const res = await fetch('/api/system/clean', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setShowClean(false)
        setCleanConfirm('')
        if (data.alreadyClean) {
          setAlreadyClean(true)
        } else {
          setTimeout(() => onCleaned(), 400)
        }
      } else {
        alert(`Clean failed: ${data.errors?.join('\n')}`)
      }
    } catch {
      alert('Request failed')
    }
    setCleaning(false)
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--destructive)' }}>Danger zone</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--fg-muted)' }}>
          These actions are permanent and local. No undo.
        </p>
      </div>

      <div className="rounded-[12px] flex flex-col overflow-hidden" style={{ border: '1px solid rgba(220,70,111,0.3)' }}>
        {/* Update */}
        <div className="flex items-center justify-between gap-4 p-4" style={{ borderBottom: '1px solid rgba(220,70,111,0.15)' }}>
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium" style={{ color: 'var(--fg)' }}>Check for updates</p>
            <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              Fetch the latest version and apply any changes.
            </p>
            {updateResult && (
              <div className="flex flex-col gap-1 mt-1">
                {updateResult.error ? (
                  <p className="font-mono text-[11px]" style={{ color: 'var(--destructive)' }}>
                    ✗ Something went wrong — try running ./setup.sh --update in your terminal
                  </p>
                ) : (
                  <p className="font-mono text-[11px]" style={{ color: '#10b981' }}>
                    {updateResult.upToDate ? '✓ Code is up to date' : `✓ Pulled latest — "${updateResult.commit?.message}"`}
                  </p>
                )}
                {updateResult.newRelease && (
                  <p className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                    ⚡ New release available: {updateResult.newRelease} — restart the server to apply
                  </p>
                )}
                {updateResult.upToDate && !updateResult.newRelease && (
                  <p className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                    No new release yet.
                  </p>
                )}
              </div>
            )}
          </div>
          <button onClick={update} disabled={updating}
            className="btn btn-sm btn-ghost shrink-0 font-mono text-[12px]"
            style={{ border: '1px solid var(--border-default)' }}>
            {updating ? 'Checking…' : 'Update →'}
          </button>
        </div>

        {/* Clean */}
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-[14px] font-medium" style={{ color: 'var(--destructive)' }}>Clean — wipe all my data</p>
            <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>
              Deletes <code className="font-mono text-[11px]">data/career.db</code> and <code className="font-mono text-[11px]">data/udd/</code>.
              All applications, resumes, contacts, and your profile are permanently removed. You&apos;ll be taken back to setup.
            </p>
            {alreadyClean && (
              <p className="font-mono text-[11px] mt-1" style={{ color: '#10b981' }}>
                ✓ You&apos;re pure — nothing here to delete.
              </p>
            )}
          </div>
          <button onClick={() => { setAlreadyClean(false); setShowClean(true) }}
            className="btn btn-sm shrink-0 font-mono text-[12px]"
            style={{ background: 'rgba(220,70,111,0.1)', color: 'var(--destructive)', border: '1px solid rgba(220,70,111,0.3)' }}>
            Clean
          </button>
        </div>
      </div>

      {/* Clean confirm modal */}
      {showClean && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(8,15,17,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-[18px] p-7 flex flex-col gap-5"
            style={{ background: 'var(--surface)', border: '1px solid rgba(220,70,111,0.4)' }}>
            <div className="flex flex-col gap-2">
              <p className="text-[17px] font-semibold" style={{ color: 'var(--destructive)' }}>Wipe all data?</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                Permanently deletes your tracker, resumes, contacts, sessions, and profile. App code and skills are untouched. You&apos;ll be taken back to the first-time setup.
              </p>
              <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
                Type <span className="font-mono font-semibold" style={{ color: 'var(--fg)' }}>DELETE MY DATA</span> to confirm.
              </p>
            </div>
            <input
              className="dev-input font-mono text-[13px]"
              placeholder="DELETE MY DATA"
              value={cleanConfirm}
              onChange={e => setCleanConfirm(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowClean(false); setCleanConfirm('') }} className="btn btn-md btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={clean}
                disabled={cleanConfirm !== 'DELETE MY DATA' || cleaning}
                className="btn btn-md flex-1 font-semibold"
                style={{
                  background: cleanConfirm === 'DELETE MY DATA' ? 'var(--destructive)' : 'rgba(220,70,111,0.2)',
                  color: '#fff', border: 'none',
                  opacity: cleanConfirm !== 'DELETE MY DATA' ? 0.5 : 1,
                }}>
                {cleaning ? 'Wiping…' : 'Wipe everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })}
      className="btn btn-sm btn-ghost shrink-0 font-mono text-[11px]"
      style={{ color: copied ? '#10b981' : 'var(--fg-muted)' }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}


function VersionBadge({ version, next }: { version: string | null; next: string | null }) {
  if (!version) {
    const upNext = next ?? 'alpha'
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-[6px]" style={{ color: 'var(--fg-muted)', background: 'var(--elevated)', border: '1px solid var(--border-subtle)' }}>
          unreleased
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>↑</span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px]"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <span className="text-[16px] leading-none" style={{ color: 'var(--accent-primary)' }}>{greekSymbol(upNext)}</span>
          <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent-primary)' }}>{upNext}</span>
        </div>
      </div>
    )
  }
  const sym = greekSymbol(version)
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px]"
        style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)' }}>
        <span className="text-[20px] leading-none font-semibold" style={{ color: 'var(--accent-primary)' }}>{sym}</span>
        <span className="font-mono text-[12px] font-semibold" style={{ color: 'var(--accent-primary)' }}>{version}</span>
      </div>
      {next && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: 'var(--fg-muted)', opacity: 0.4 }}>
          <span className="text-[15px] leading-none">{greekSymbol(next)}</span>
          <span>{next}</span>
        </div>
      )}
    </div>
  )
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}
