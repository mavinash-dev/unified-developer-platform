'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EyebrowLabel from '@/components/EyebrowLabel'
import Spinner from '@/components/Spinner'

type Status = 'wishlist' | 'applied' | 'referral_pending' | 'interviewing' | 'offer' | 'rejected' | 'ghosted'

interface Contact {
  id: number
  application_id: number
  name: string
  title: string
  company: string
  linkedin_url: string
  email: string
  phone: string
  relationship: string
  notes: string
  created_at: string
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

const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: 'wishlist',         label: 'Wishlist',       color: '#888c8d' },
  { value: 'applied',          label: 'Applied',        color: '#3d9dff' },
  { value: 'referral_pending', label: 'Referral',       color: '#a855f7' },
  { value: 'interviewing',     label: 'Interviewing',   color: '#f59e0b' },
  { value: 'offer',            label: 'Offer',          color: '#10b981' },
  { value: 'rejected',         label: 'Rejected',       color: '#dc466f' },
  { value: 'ghosted',          label: 'Ghosted',        color: '#555' },
]

const RELATIONSHIP_LABEL: Record<string, string> = {
  referral:       '🤝 Referral',
  recruiter:      '📋 Recruiter',
  hiring_manager: '👤 Hiring Mgr',
  connection:     '🔗 Connection',
}

function statusMeta(s: Status) {
  return STATUSES.find(x => x.value === s) ?? STATUSES[0]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>{label}</p>
      {children}
    </div>
  )
}

function AddContactForm({ appId, onAdded }: { appId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName]         = useState('')
  const [title, setTitle]       = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [rel, setRel]           = useState<string>('referral')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)

  const reset = () => { setName(''); setTitle(''); setLinkedin(''); setEmail(''); setPhone(''); setNotes(''); setRel('referral') }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(`/api/tracker/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'add_contact', name, title, linkedin_url: linkedin, email, phone, relationship: rel, notes }),
    })
    reset(); setSaving(false); setOpen(false); onAdded()
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="btn btn-sm btn-ghost self-start font-mono text-[12px]"
      style={{ color: 'var(--accent-primary)', borderColor: 'rgba(168,85,247,0.3)' }}
    >
      + Add contact
    </button>
  )

  return (
    <div className="flex flex-col gap-3 p-4 rounded-[12px]" style={{ background: 'var(--elevated)', border: '1px solid var(--border-default)' }}>
      <p className="font-mono text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'var(--fg-muted)' }}>New contact</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Name *</label>
          <input className="dev-input text-[13px]" placeholder="Karri Saarinen" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Title</label>
          <input className="dev-input text-[13px]" placeholder="Co-founder" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>LinkedIn URL</label>
          <input className="dev-input text-[13px]" placeholder="linkedin.com/in/…" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Email</label>
          <input className="dev-input text-[13px]" placeholder="name@company.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Phone</label>
          <input className="dev-input text-[13px]" placeholder="+1 555 000 0000" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Relationship</label>
          <select className="dev-input text-[13px]" value={rel} onChange={e => setRel(e.target.value)}>
            <option value="referral">Referral</option>
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="connection">Connection</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 col-span-2">
          <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Notes</label>
          <input className="dev-input text-[13px]" placeholder="Met at meetup, very responsive on LinkedIn…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setOpen(false); reset() }} className="btn btn-sm btn-ghost flex-1">Cancel</button>
        <button onClick={save} disabled={!name.trim() || saving} className="btn btn-sm btn-primary flex-1">
          {saving ? 'Saving…' : 'Add contact'}
        </button>
      </div>
    </div>
  )
}

function ContactCard({ contact, appId, onDeleted, appRole, appCompany }: {
  contact: Contact
  appId: number
  onDeleted: () => void
  appRole: string
  appCompany: string
}) {
  const router = useRouter()
  const coldMsgArgs = `LinkedIn DM to ${contact.name}${contact.title ? `, ${contact.title}` : ''}${contact.company ? ` at ${contact.company}` : ''}, asking for a referral for ${appRole} at ${appCompany}`

  const del = async () => {
    await fetch(`/api/tracker/${appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'delete_contact', contact_id: contact.id }),
    })
    onDeleted()
  }

  return (
    <div className="rounded-[12px] p-4 flex flex-col gap-3" style={{ background: 'var(--elevated)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>{contact.name}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)' }}>
              {RELATIONSHIP_LABEL[contact.relationship] ?? contact.relationship}
            </span>
          </div>
          {(contact.title || contact.company) && (
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
              {[contact.title, contact.company].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <button onClick={del} className="btn btn-sm btn-ghost shrink-0 text-[11px]" style={{ color: 'var(--destructive)' }}>✕ Remove</button>
      </div>

      {/* Contact links */}
      <div className="flex flex-wrap gap-2">
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-mono text-[12px] transition-colors hover:bg-white/5"
            style={{ background: 'var(--surface)', color: '#3d9dff', border: '1px solid var(--border-subtle)' }}>
            in LinkedIn
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-mono text-[12px] transition-colors hover:bg-white/5"
            style={{ background: 'var(--surface)', color: 'var(--accent-primary)', border: '1px solid var(--border-subtle)' }}>
            ✉ {contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-mono text-[12px] transition-colors hover:bg-white/5"
            style={{ background: 'var(--surface)', color: 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
            ☏ {contact.phone}
          </a>
        )}
      </div>

      {contact.notes && (
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{contact.notes}</p>
      )}

      {contact.relationship === 'referral' || contact.relationship === 'connection' ? (
        <button
          onClick={() => router.push(`/?skill=cold-message&args=${encodeURIComponent(coldMsgArgs)}`)}
          className="btn btn-sm btn-primary self-start text-[12px]"
        >
          Draft cold message →
        </button>
      ) : null}
    </div>
  )
}

export default function TrackerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [app, setApp] = useState<Application | null>(null)
  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [editDetails, setEditDetails] = useState(false)
  const [editForm, setEditForm] = useState({ company: '', role: '', url: '', location: '', salary_range: '', remote: false })

  useEffect(() => {
    fetch(`/api/tracker/${id}`).then(r => r.json()).then(d => {
      setApp(d)
      setNotes(d.notes ?? '')
      setEditForm({ company: d.company, role: d.role, url: d.url ?? '', location: d.location ?? '', salary_range: d.salary_range ?? '', remote: !!d.remote })
    })
  }, [id])

  const saveDetails = async () => {
    setSaving(true)
    const res = await fetch(`/api/tracker/${app!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setApp(await res.json())
    setSaving(false)
    setEditDetails(false)
  }

  if (!app) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--canvas)' }}>
      <Spinner size="lg" />
    </div>
  )

  const meta = statusMeta(app.status)

  const updateStatus = async (status: Status) => {
    const res = await fetch(`/api/tracker/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setApp(await res.json())
  }

  const saveNotes = async () => {
    setSaving(true)
    const res = await fetch(`/api/tracker/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setApp(await res.json())
    setSaving(false)
    setEditNotes(false)
  }

  const deleteApp = async () => {
    await fetch(`/api/tracker/${app.id}`, { method: 'DELETE' })
    router.push('/tracker')
  }

  const reloadContacts = async () => {
    const res = await fetch(`/api/tracker/${app.id}`)
    const updated = await res.json()
    setApp(updated)
  }

  const tailorArgs = `Tailor resume for ${app.role} at ${app.company}${app.jd_summary ? `. JD summary: ${app.jd_summary}` : ''}${app.key_skills.length ? `. Key skills: ${app.key_skills.join(', ')}` : ''}`
  const scoutArgs  = `${app.role} at ${app.company}${app.location ? ` (${app.location})` : ''}${app.jd_summary ? `. Role: ${app.jd_summary}` : ''}`

  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Header */}
      <header className="mx-auto max-w-3xl px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/tracker" className="font-mono text-[12px] transition-colors hover:opacity-70" style={{ color: 'var(--fg-muted)' }}>
            ← Tracker
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <EyebrowLabel>{app.company}</EyebrowLabel>
          <button onClick={() => setEditDetails(true)} className="btn btn-sm btn-ghost font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>
            ✎ Edit details
          </button>
        </div>
        <h1 className="text-sub-large mt-2" style={{ color: 'var(--fg)', lineHeight: 1.1 }}>{app.role}</h1>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span
            className="font-mono text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
          >
            {meta.label}
          </span>
          {app.remote ? (
            <span className="font-mono text-[11px] px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Remote</span>
          ) : null}
          {app.location && <span className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>{app.location}</span>}
          {app.salary_range && <span className="font-mono text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{app.salary_range}</span>}
          {app.url && (
            <a href={app.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px]" style={{ color: 'var(--accent-blue)' }}>
              View posting ↗
            </a>
          )}
        </div>
      </header>

      <hr className="mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <main className="mx-auto max-w-3xl px-6 py-10 flex flex-col gap-10">

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <select
            className="font-mono text-[12px] rounded-[8px] px-3 py-2 cursor-pointer"
            style={{ background: 'var(--surface)', color: 'var(--fg-body)', border: '1px solid var(--border-default)' }}
            value={app.status}
            onChange={e => updateStatus(e.target.value as Status)}
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => router.push(`/?skill=resume-update&args=${encodeURIComponent(tailorArgs)}`)} className="btn btn-md btn-ghost text-[13px]">
            ▤ Tailor resume
          </button>
          <button onClick={() => router.push(`/?skill=referral-scout&args=${encodeURIComponent(scoutArgs)}`)} className="btn btn-md btn-ghost text-[13px]">
            🔍 Scout referrals
          </button>
          <button onClick={() => setDeleteConfirm(true)} className="btn btn-md btn-ghost ml-auto text-[13px]" style={{ color: 'var(--destructive)', borderColor: 'rgba(220,70,111,0.3)' }}>
            Delete
          </button>
        </div>

        {/* JD Summary */}
        {app.jd_summary && (
          <Field label="Role summary">
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--fg-body)' }}>{app.jd_summary}</p>
          </Field>
        )}

        {/* Skills */}
        {app.key_skills.length > 0 && (
          <Field label="Key skills">
            <div className="flex flex-wrap gap-2">
              {app.key_skills.map(skill => (
                <span key={skill} className="font-mono text-[12px] px-3 py-1 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  {skill}
                </span>
              ))}
            </div>
          </Field>
        )}

        {/* Contacts */}
        <Field label={`Contacts & referrals (${app.contacts.length})`}>
          <div className="flex flex-col gap-3">
            {app.contacts.length === 0 && (
              <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>No contacts yet — add someone who can refer you or fast-track your application.</p>
            )}
            {app.contacts.map(c => (
              <ContactCard key={c.id} contact={c} appId={app.id} onDeleted={reloadContacts} appRole={app.role} appCompany={app.company} />
            ))}
            <AddContactForm appId={app.id} onAdded={reloadContacts} />
          </div>
        </Field>

        {/* Notes */}
        <Field label="Notes">
          {editNotes ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="dev-input resize-none text-[14px]"
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setEditNotes(false)} className="btn btn-sm btn-ghost flex-1">Cancel</button>
                <button onClick={saveNotes} disabled={saving} className="btn btn-sm btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          ) : (
            <div
              className="text-[14px] leading-relaxed rounded-[10px] px-4 py-3 cursor-pointer min-h-[52px]"
              style={{ background: 'var(--surface)', color: app.notes ? 'var(--fg-body)' : 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}
              onClick={() => setEditNotes(true)}
            >
              {app.notes || 'Click to add notes — interview prep, contacts to chase, deadlines…'}
            </div>
          )}
        </Field>

        {/* Meta */}
        <div className="flex gap-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex flex-col gap-0.5">
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Added</p>
            <p className="font-mono text-[12px]" style={{ color: 'var(--fg-body)' }}>{new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Last updated</p>
            <p className="font-mono text-[12px]" style={{ color: 'var(--fg-body)' }}>{new Date(app.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </main>

      {/* Edit details modal */}
      {editDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(8,15,17,0.85)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-[18px] p-7 flex flex-col gap-5" style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
            <p className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>Edit details</p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Company</label>
                  <input className="dev-input text-[13px]" value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Role</label>
                  <input className="dev-input text-[13px]" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Job posting URL</label>
                <input className="dev-input text-[13px]" type="url" placeholder="https://jobs.apple.com/…" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Location</label>
                  <input className="dev-input text-[13px]" placeholder="San Francisco, CA" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--fg-muted)' }}>Salary range</label>
                  <input className="dev-input text-[13px]" placeholder="$180K–$220K" value={editForm.salary_range} onChange={e => setEditForm(f => ({ ...f, salary_range: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.remote} onChange={e => setEditForm(f => ({ ...f, remote: e.target.checked }))} />
                <span className="font-mono text-[12px]" style={{ color: 'var(--fg-muted)' }}>Remote role</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditDetails(false)} className="btn btn-md btn-ghost flex-1">Cancel</button>
              <button onClick={saveDetails} disabled={saving || !editForm.company.trim() || !editForm.role.trim()} className="btn btn-md btn-primary flex-1">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(8,15,17,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm rounded-[18px] p-7 flex flex-col gap-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex flex-col gap-2">
              <p className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>Delete this application?</p>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                <span style={{ color: 'var(--fg)' }}>{app.role}</span> at <span style={{ color: 'var(--fg)' }}>{app.company}</span> will be permanently removed along with all contacts and notes.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="btn btn-md btn-ghost flex-1">Keep it</button>
              <button onClick={deleteApp} className="btn btn-md btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
