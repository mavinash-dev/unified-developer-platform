interface Resume {
  id: number; company: string; role: string; ats_score: number | null
  format: string; compatibility: string | null; created_at: string
}

function scoreStyle(s: number | null) {
  if (!s)    return { color: 'var(--fg-muted)', bg: 'var(--elevated)' }
  if (s >= 85) return { color: '#3fb950', bg: 'rgba(63,185,80,0.12)' }
  if (s >= 70) return { color: 'var(--accent-yellow)', bg: 'rgba(247,211,84,0.12)' }
  return { color: 'var(--destructive)', bg: 'rgba(248,81,73,0.12)' }
}

function compatColor(c: string | null) {
  const m: Record<string, string> = { STRONG: '#3fb950', MODERATE: 'var(--accent-blue)', STRETCH: 'var(--accent-yellow)', MISMATCH: 'var(--destructive)' }
  return m[c ?? ''] ?? 'var(--fg-muted)'
}

export default function ResumeCard({ resume }: { resume: Resume }) {
  const date = new Date(resume.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const ss = scoreStyle(resume.ats_score)

  return (
    <div className="util-card flex items-center justify-between gap-4 cursor-pointer">
      <div className="min-w-0">
        <p className="text-[16px] font-medium truncate" style={{ color: 'var(--fg)' }}>
          {resume.company || 'General'}{resume.role ? ` — ${resume.role}` : ''}
        </p>
        <p className="font-mono text-[12px] mt-1" style={{ color: 'var(--fg-muted)' }}>
          {date} · {resume.format}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {resume.compatibility && (
          <span className="font-mono text-[12px] px-2.5 py-1 rounded-full"
            style={{ color: compatColor(resume.compatibility), background: `${compatColor(resume.compatibility)}18` }}>
            {resume.compatibility}
          </span>
        )}
        {resume.ats_score != null && (
          <span className="font-mono text-[13px] font-semibold px-3 py-1 rounded-full"
            style={{ color: ss.color, background: ss.bg }}>
            ATS {resume.ats_score.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  )
}
