'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import EyebrowLabel from '@/components/EyebrowLabel'
import QRCode from 'qrcode'

// ── Types ────────────────────────────────────────────────────────────────────

type Status = 'wishlist' | 'applied' | 'referral_pending' | 'interviewing' | 'offer' | 'rejected' | 'ghosted'

interface Contact {
  id: number
  application_id: number
  name: string
  title: string
  company: string
  linkedin_url: string
  relationship: 'referral' | 'recruiter' | 'hiring_manager' | 'connection'
  notes: string
}

interface Application {
  id: number
  company: string
  role: string
  url: string
  status: Status
  location: string
  remote: number
  salary_range: string
  jd_summary: string
  key_skills: string[]
  notes: string
  contacts: Contact[]
  created_at: string
  updated_at: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES: { value: Status | 'all'; label: string; color: string }[] = [
  { value: 'all',              label: 'All',            color: 'var(--fg-muted)' },
  { value: 'wishlist',         label: 'Wishlist',       color: '#888c8d' },
  { value: 'applied',          label: 'Applied',        color: '#3d9dff' },
  { value: 'referral_pending', label: 'Referral',       color: '#a855f7' },
  { value: 'interviewing',     label: 'Interviewing',   color: '#f59e0b' },
  { value: 'offer',            label: 'Offer',          color: '#10b981' },
  { value: 'rejected',         label: 'Rejected',       color: '#dc466f' },
  { value: 'ghosted',          label: 'Ghosted',        color: '#555' },
]

const STATUS_NEXT: Partial<Record<Status, Status>> = {
  wishlist:         'applied',
  applied:          'referral_pending',
  referral_pending: 'interviewing',
  interviewing:     'offer',
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  referral:        '🤝 Referral',
  recruiter:       '📋 Recruiter',
  hiring_manager:  '👤 Hiring Mgr',
  connection:      '🔗 Connection',
}

function statusMeta(s: Status) {
  return STATUSES.find(x => x.value === s) ?? STATUSES[0]
}

// ── Phone Drop Panel ─────────────────────────────────────────────────────────

function PhoneDropPanel() {
  const [dropUrl, setDropUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/local-ip').then(r => r.json()).then(async (data) => {
      setDropUrl(data.dropUrl)
      const url = await QRCode.toDataURL(data.dropUrl, { width: 160, margin: 1, color: { dark: '#fdfcf0', light: '#0e1518' } })
      setQrDataUrl(url)
    })
  }, [])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] font-mono text-[12px] transition-all cursor-pointer"
        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: 'var(--accent-primary)' }}
      >
        📱 Add from phone
      </button>
    )
  }

  return (
    <div className="rounded-[14px] p-5 flex flex-col gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>Add from phone or tablet</p>
          <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            Scan on any device on the same WiFi — paste a URL, job description, or upload a screenshot.
            OCR runs locally via Apple Vision (Mac) or Windows WinRT — zero tokens.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <code className="font-mono text-[12px] px-2 py-1 rounded-[6px]" style={{ background: 'var(--elevated)', color: 'var(--accent-primary)' }}>
              {dropUrl}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(dropUrl)}
              className="font-mono text-[11px]"
              style={{ color: 'var(--fg-muted)' }}
            >
              copy
            </button>
          </div>
        </div>
        {qrDataUrl && (
          <div className="shrink-0">
            <img src={qrDataUrl} alt="QR code for drop zone" width={120} height={120} className="rounded-[10px]" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <a href={dropUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary text-[12px]">
          Open drop zone ↗
        </a>
        <button onClick={() => setOpen(false)} className="btn btn-sm btn-ghost text-[12px]">Close</button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// ── Ingest bar ───────────────────────────────────────────────────────────────

function IngestBar({ onExtracted }: { onExtracted: (data: Partial<Application>) => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const extract = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const isUrl = input.trim().startsWith('http')
      const res = await fetch('/api/tracker/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { url: input.trim() } : { text: input.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onExtracted(data)
      setInput('')
    } catch (e) {
      setError((e as Error).message)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <textarea
          className="dev-input flex-1 resize-none text-[14px]"
          rows={2}
          placeholder="Paste a job URL or job description text — Claude will extract the details…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.metaKey && e.key === 'Enter') { e.preventDefault(); extract() } }}
        />
        <button
          onClick={extract}
          disabled={!input.trim() || loading}
          className="btn btn-md btn-primary self-end shrink-0"
        >
          {loading ? 'Extracting…' : '⚡ Extract'}
        </button>
      </div>
      {error && <p className="text-[12px]" style={{ color: 'var(--destructive)' }}>{error}</p>}
      <p className="font-mono text-[11px]" style={{ color: 'var(--fg-muted)' }}>⌘↵ to extract · paste a URL or full JD text</p>
    </div>
  )
}

// ── Contact row ──────────────────────────────────────────────────────────────

function ContactRow({ contact, appId, appCompany, appRole, onDeleted }: {
  contact: Contact
  appId: number
  appCompany: string
  appRole: string
  onDeleted: () => void
}) {
  const router = useRouter()

  const coldMessageArgs = `LinkedIn connection request to ${contact.name}${contact.title ? `, ${contact.title}` : ''}${contact.company ? ` at ${contact.company}` : ''}, asking for a referral for ${appRole} at ${appCompany}`

  const del = async () => {
    await fetch(`/api/tracker/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'delete_contact', contact_id: contact.id }),
    })
    onDeleted()
  }

  return (
    <div
      className="flex items-center justify-between gap-3 py-2 px-3 rounded-[8px]"
      style={{ background: 'var(--elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium truncate" style={{ color: 'var(--fg)' }}>{contact.name}</span>
          <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--fg-muted)' }}>
            {RELATIONSHIP_LABEL[contact.relationship] ?? contact.relationship}
          </span>
        </div>
        {(contact.title || contact.company) && (
          <span className="text-[12px] truncate" style={{ color: 'var(--fg-muted)' }}>
            {[contact.title, contact.company].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost font-mono text-[11px]"
          >
            in↗
          </a>
        )}
        {contact.relationship === 'referral' && (
          <button
            className="btn btn-sm btn-primary text-[11px]"
            onClick={() => router.push(`/?skill=cold-message&args=${encodeURIComponent(coldMessageArgs)}`)}
          >
            Cold msg →
          </button>
        )}
        <button onClick={del} className="btn btn-sm btn-ghost text-[11px]" style={{ color: 'var(--destructive)' }}>✕</button>
      </div>
    </div>
  )
}

// ── Add contact form ─────────────────────────────────────────────────────────

function AddContactForm({ appId, onAdded }: { appId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [rel, setRel] = useState<Contact['relationship']>('referral')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/tracker/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'add_contact', name, title, linkedin_url: linkedin, relationship: rel }),
    })
    setName(''); setTitle(''); setLinkedin(''); setRel('referral')
    setSaving(false)
    setOpen(false)
    onAdded()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-[12px] font-mono" style={{ color: 'var(--accent-primary)' }}>
      + Add contact
    </button>
  )

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[10px]" style={{ background: 'var(--elevated)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex gap-2">
        <input className="dev-input flex-1 text-[13px]" placeholder="Name *" value={name} onChange={e => setName(e.target.value)} />
        <input className="dev-input flex-1 text-[13px]" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <input className="dev-input flex-1 text-[13px]" placeholder="LinkedIn URL" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
        <select
          className="dev-input text-[13px]"
          value={rel}
          onChange={e => setRel(e.target.value as Contact['relationship'])}
        >
          <option value="referral">Referral</option>
          <option value="recruiter">Recruiter</option>
          <option value="hiring_manager">Hiring Manager</option>
          <option value="connection">Connection</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn btn-sm btn-ghost flex-1">Cancel</button>
        <button onClick={save} disabled={!name.trim() || saving} className="btn btn-sm btn-primary flex-1">
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

// ── Application card ─────────────────────────────────────────────────────────

function AppCard({ app, onUpdated, onDeleted }: {
  app: Application
  onUpdated: (updated: Application) => void
  onDeleted: (id: number) => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState(app.notes)
  const meta = statusMeta(app.status)
  const next = STATUS_NEXT[app.status]

  const updateStatus = async (status: Status) => {
    const res = await fetch(`/api/tracker/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onUpdated(await res.json())
  }

  const saveNotes = async () => {
    const res = await fetch(`/api/tracker/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    onUpdated(await res.json())
    setEditNotes(false)
  }

  const del = async () => {
    if (!confirm(`Delete "${app.role} at ${app.company}"?`)) return
    await fetch(`/api/tracker/${app.id}`, { method: 'DELETE' })
    onDeleted(app.id)
  }

  const tailorArgs = `Tailor resume for ${app.role} at ${app.company}${app.jd_summary ? `. JD summary: ${app.jd_summary}` : ''}${app.key_skills.length ? `. Key skills: ${app.key_skills.join(', ')}` : ''}`
  const referralScoutArgs = `${app.role} at ${app.company}${app.location ? ` (${app.location})` : ''}${app.jd_summary ? `. Role: ${app.jd_summary}` : ''}`

  const reloadContacts = async () => {
    const res = await fetch(`/api/tracker/${app.id}`)
    onUpdated(await res.json())
  }

  return (
    <div
      className="rounded-[14px] flex flex-col overflow-hidden transition-all"
      style={{ background: 'var(--surface)', border: `1px solid var(--border-subtle)` }}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${meta.color}20`, color: meta.color }}
              >
                {meta.label}
              </span>
              {app.remote ? (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Remote</span>
              ) : null}
              {app.salary_range && (
                <span className="font-mono text-[10px]" style={{ color: 'var(--fg-muted)' }}>{app.salary_range}</span>
              )}
            </div>
            <p className="text-[16px] font-semibold mt-1 leading-tight" style={{ color: 'var(--fg)' }}>{app.role}</p>
            <p className="text-[14px] font-medium" style={{ color: 'var(--fg-muted)' }}>
              {app.company}
              {app.location && <span className="font-normal"> · {app.location}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {app.url && (
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost font-mono text-[11px]">↗</a>
            )}
            <button onClick={() => setExpanded(p => !p)} className="btn btn-sm btn-ghost font-mono text-[12px]">
              {expanded ? '▲' : '▼'}
            </button>
            <button onClick={del} className="btn btn-sm btn-ghost text-[11px]" style={{ color: 'var(--destructive)' }}>✕</button>
          </div>
        </div>

        {/* Key skills */}
        {app.key_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {app.key_skills.slice(0, 6).map(skill => (
              <span key={skill} className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Primary actions */}
        <div className="flex gap-2 flex-wrap">
          {next && (
            <button
              onClick={() => updateStatus(next)}
              className="btn btn-sm btn-primary text-[12px]"
            >
              Mark as {statusMeta(next).label} →
            </button>
          )}
          <button
            onClick={() => router.push(`/?skill=referral-scout&args=${encodeURIComponent(referralScoutArgs)}`)}
            className="btn btn-sm btn-ghost text-[12px]"
          >
            🔍 Scout referrals
          </button>
          <button
            onClick={() => router.push(`/?skill=resume-update&args=${encodeURIComponent(tailorArgs)}`)}
            className="btn btn-sm btn-ghost text-[12px]"
          >
            Tailor resume
          </button>
          <select
            className="font-mono text-[11px] rounded-[6px] px-2 py-1 cursor-pointer"
            style={{ background: 'var(--elevated)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}
            value={app.status}
            onChange={e => updateStatus(e.target.value as Status)}
          >
            {STATUSES.filter(s => s.value !== 'all').map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="pt-4" />

          {/* JD summary */}
          {app.jd_summary && (
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Role summary</p>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-body)' }}>{app.jd_summary}</p>
            </div>
          )}

          {/* Contacts */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Contacts & referrals</p>
            {app.contacts.length === 0 && (
              <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>No contacts yet — add someone who can refer you.</p>
            )}
            {app.contacts.map(c => (
              <ContactRow
                key={c.id}
                contact={c}
                appId={app.id}
                appCompany={app.company}
                appRole={app.role}
                onDeleted={reloadContacts}
              />
            ))}
            <AddContactForm appId={app.id} onAdded={reloadContacts} />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Notes</p>
            {editNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className="dev-input resize-none text-[13px]"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditNotes(false)} className="btn btn-sm btn-ghost flex-1">Cancel</button>
                  <button onClick={saveNotes} className="btn btn-sm btn-primary flex-1">Save</button>
                </div>
              </div>
            ) : (
              <div
                className="text-[13px] leading-relaxed cursor-pointer rounded-[8px] px-3 py-2 min-h-[36px]"
                style={{ background: 'var(--elevated)', color: app.notes ? 'var(--fg-body)' : 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}
                onClick={() => setEditNotes(true)}
              >
                {app.notes || 'Click to add notes…'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Create application form ───────────────────────────────────────────────────

function CreateForm({ prefill, onCreated, onClose }: {
  prefill?: Partial<Application>
  onCreated: (app: Application) => void
  onClose: () => void
}) {
  const [company, setCompany] = useState(prefill?.company ?? '')
  const [role, setRole] = useState(prefill?.role ?? '')
  const [url, setUrl] = useState(prefill?.url ?? '')
  const [location, setLocation] = useState(prefill?.location ?? '')
  const [remote, setRemote] = useState(!!prefill?.remote)
  const [salary, setSalary] = useState(prefill?.salary_range ?? '')
  const [summary, setSummary] = useState(prefill?.jd_summary ?? '')
  const [skills, setSkills] = useState((prefill?.key_skills ?? []).join(', '))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!company.trim() || !role.trim()) return
    setSaving(true)
    const res = await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company, role, url, location, remote,
        salary_range: salary, jd_summary: summary,
        key_skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        contacts: [],
      }),
    })
    const app = await res.json()
    setSaving(false)
    onCreated(app)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(8,15,17,0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-[18px] flex flex-col gap-5 p-7 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
            {prefill?.company ? `Add — ${prefill.company}` : 'Add application'}
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Company *</label>
            <input className="dev-input text-[14px]" value={company} onChange={e => setCompany(e.target.value)} placeholder="Stripe" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Role *</label>
            <input className="dev-input text-[14px]" value={role} onChange={e => setRole(e.target.value)} placeholder="Staff Engineer" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Job URL</label>
            <input className="dev-input text-[14px]" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Location</label>
            <input className="dev-input text-[14px]" value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco, CA" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Salary range</label>
            <input className="dev-input text-[14px]" value={salary} onChange={e => setSalary(e.target.value)} placeholder="$180K–$220K" />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="remote-cb" checked={remote} onChange={e => setRemote(e.target.checked)} className="cursor-pointer" />
            <label htmlFor="remote-cb" className="text-[14px] cursor-pointer" style={{ color: 'var(--fg-body)' }}>Remote role</label>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Key skills (comma-separated)</label>
            <input className="dev-input text-[14px]" value={skills} onChange={e => setSkills(e.target.value)} placeholder="TypeScript, Go, Kubernetes" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Role summary</label>
            <textarea className="dev-input resize-none text-[14px]" rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="What does this role do?" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-md btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={!company.trim() || !role.trim() || saving} className="btn btn-md btn-primary flex-1">
            {saving ? 'Saving…' : 'Add application'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [prefill, setPrefill] = useState<Partial<Application> | undefined>()
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch('/api/tracker')
    setApps(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const onUpdated = (updated: Application) => setApps(p => p.map(a => a.id === updated.id ? updated : a))
  const onDeleted = (id: number) => setApps(p => p.filter(a => a.id !== id))
  const onCreated = (app: Application) => { setApps(p => [app, ...p]); setShowCreate(false); setPrefill(undefined) }

  const onExtracted = (data: Partial<Application>) => {
    setPrefill(data)
    setShowCreate(true)
  }

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = s.value === 'all' ? apps.length : apps.filter(a => a.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Header */}
      <header className="mx-auto max-w-5xl px-6 py-14 flex flex-col gap-4">
        <EyebrowLabel>Application Tracker</EyebrowLabel>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
            Your pipeline.
          </h1>
          <button onClick={() => { setPrefill(undefined); setShowCreate(true) }} className="btn btn-md btn-primary shrink-0">
            + Add
          </button>
        </div>

        {/* Stats strip */}
        {apps.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {STATUSES.filter(s => s.value !== 'all' && counts[s.value] > 0).map(s => (
              <div
                key={s.value}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
                style={{
                  background: `${s.color}15`,
                  border: `1px solid ${s.color}40`,
                }}
                onClick={() => setFilter(f => f === s.value ? 'all' : s.value as Status)}
              >
                <span className="font-mono text-[12px] font-semibold" style={{ color: s.color }}>{counts[s.value]}</span>
                <span className="font-mono text-[11px]" style={{ color: s.color }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <main className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-8">
        {/* Ingest */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <EyebrowLabel>Quick add from job posting</EyebrowLabel>
            <PhoneDropPanel />
          </div>
          <IngestBar onExtracted={onExtracted} />
        </div>

        <hr className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value as Status | 'all')}
              className="font-mono text-[12px] px-3 py-1.5 rounded-full transition-all cursor-pointer"
              style={{
                background: filter === s.value ? `${s.color}20` : 'transparent',
                color: filter === s.value ? s.color : 'var(--fg-muted)',
                border: filter === s.value ? `1px solid ${s.color}50` : '1px solid transparent',
              }}
            >
              {s.label}
              {counts[s.value] > 0 && <span className="ml-1.5 opacity-70">{counts[s.value]}</span>}
            </button>
          ))}
        </div>

        {/* Applications grid */}
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-32 rounded-[14px]" style={{ background: 'var(--surface)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ opacity: 0.5 }}>
            <span className="font-mono text-[40px]">📋</span>
            <p className="font-mono text-[14px]" style={{ color: 'var(--fg-muted)' }}>
              {apps.length === 0
                ? 'No applications yet — paste a job posting above to get started'
                : `No applications with status "${filter}"`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(app => (
              <AppCard key={app.id} app={app} onUpdated={onUpdated} onDeleted={onDeleted} />
            ))}
          </div>
        )}
      </main>

      {/* Create / prefill form modal */}
      {showCreate && (
        <CreateForm
          prefill={prefill}
          onCreated={onCreated}
          onClose={() => { setShowCreate(false); setPrefill(undefined) }}
        />
      )}
    </div>
  )
}
