'use client'
import Link from 'next/link'
import EyebrowLabel from '@/components/EyebrowLabel'

// ── Types ────────────────────────────────────────────────────────────────────

interface Step {
  label: string
  detail: string
  code?: string
}

interface Flow {
  title: string
  subtitle: string
  steps: Step[]
  link?: { href: string; label: string }
}

interface Callout {
  icon: string
  title: string
  body: string
  code?: string
  link?: { href: string; label: string }
}

// ── Content ───────────────────────────────────────────────────────────────────

const FLOWS: Flow[] = [
  {
    title: 'How context flows into every run',
    subtitle: 'Every skill and every chat message is prefixed with this chain — automatically, every time.',
    steps: [
      {
        label: '1. Your name',
        detail: 'Set once in Profile. Injected as "The user\'s name is: …" so Claude always knows who it\'s talking to.',
      },
      {
        label: '2. Context files',
        detail: 'Files you link in Profile (your master resume, a YAML bio, a skills list) are read live from disk and injected as labelled blocks. Change the file — the next run picks it up instantly.',
        code: '[CONTEXT: master-resume.md]\n…your resume content…\n[/CONTEXT]',
      },
      {
        label: '3. UDD tracker snapshot',
        detail: 'Before every skill run, UDD writes a fresh data/udd/udd-context.md from your live tracker — applications grouped by status, companies, roles, salary ranges. Claude sees your actual job search state, not a stale copy.',
        code: '## Applications being tracked\n### interviewing\n- Stripe — Staff Engineer (SF) [$200K–$240K]\n### applied\n- Linear — Product Engineer',
      },
      {
        label: '4. The skill prompt',
        detail: 'Finally the skill\'s own markdown from ~/.claude/commands/<skill>.md runs, with your $ARGUMENTS substituted in. Everything above it is already loaded.',
      },
    ],
    link: { href: '/profile', label: 'Set up context files →' },
  },
  {
    title: 'The job pipeline: Drop → Track → Resume',
    subtitle: 'Three tools that hand off to each other. Running them in sequence gives you a tailored resume in under two minutes.',
    steps: [
      {
        label: 'Drop a job posting',
        detail: 'Paste a URL, drop a screenshot or PDF, or paste raw JD text in Drop Zone. Claude extracts company, role, location, salary, and key skills automatically.',
        code: 'URL: https://boards.greenhouse.io/stripe/jobs/…\n→ company: Stripe\n→ role: Staff Engineer\n→ key_skills: [Go, Distributed Systems, …]',
      },
      {
        label: 'It lands in Tracker',
        detail: 'The extracted job is saved to SQLite and appears in your Tracker immediately. The UDD context snapshot will include it on the very next skill run.',
      },
      {
        label: 'Run /resume-update with the JD',
        detail: 'Select /resume-update from the sidebar. Paste the job description as the args. Because your master resume is already in context, Claude rewrites it targeted at that exact role.',
        code: '/?skill=resume-update\nargs: Staff Engineer at Stripe — Go, distributed…',
      },
      {
        label: 'Pick a template',
        detail: 'Add template:<name> anywhere in the args to inject a formatting guide from your template library before the skill runs.',
        code: 'args: template:faang-se Staff Engineer at Stripe…',
      },
      {
        label: 'Save the output',
        detail: 'After the skill finishes, save the resume. It appears in Resumes with an ATS score, format tag, and creation date — side by side with other versions for comparison.',
      },
    ],
    link: { href: '/drop', label: 'Open Drop Zone →' },
  },
  {
    title: 'Phone drop: scan → upload → extracted on laptop',
    subtitle: 'The QR on the Drop Zone desktop page is a direct link to your laptop over local WiFi.',
    steps: [
      {
        label: 'Open Drop Zone on your laptop',
        detail: 'The desktop view generates a QR encoding http://<your-local-ip>/drop?mobile=1 — pointing directly at this machine.',
      },
      {
        label: 'Scan with your phone',
        detail: 'The ?mobile=1 param routes your phone to a full-screen mobile UI — no sidebar, no desktop chrome, just File / URL / Paste tiles.',
      },
      {
        label: 'Upload from your phone',
        detail: 'Take a screenshot of a job posting on LinkedIn or anywhere. Upload it from your camera roll. The request hits your laptop\'s local server.',
      },
      {
        label: 'Laptop does the work',
        detail: 'Your laptop runs OCR + Claude on the image. No phone credits, no cloud upload — everything stays on your machine. The job appears in Tracker moments later.',
      },
    ],
    link: { href: '/drop', label: 'Open Drop Zone →' },
  },
]

const CALLOUTS: Callout[] = [
  {
    icon: '$',
    title: 'The $ARGUMENTS variable',
    body: 'Every skill markdown file contains $ARGUMENTS somewhere — usually near the end. Whatever you type in the args field gets substituted there before the prompt runs. This is how you pass job descriptions, URLs, or instructions to any skill.',
    code: '# resume-update.md\n…rewrite the resume for this role:\n\n$ARGUMENTS',
  },
  {
    icon: '⛓',
    title: 'Skills carry context forward via ?args=',
    body: 'You can link to a skill with args pre-filled by appending ?skill=<id>&args=<text> to any URL. Use this to hand off from one tool to another — e.g. a button that opens /resume-update with the job title already in the args field.',
    code: '/?skill=resume-update&args=Staff+Engineer+at+Stripe',
  },
  {
    icon: '✦',
    title: 'Chat knows your full tracker state',
    body: 'The same context chain (profile files + UDD snapshot) is prepended to every Chat message. Ask "which of my active applications should I prioritise?" and Claude answers from your live data — not generically.',
    link: { href: '/chat', label: 'Open Chat →' },
  },
  {
    icon: '+',
    title: 'Add your own skills',
    body: 'Drop any .md file into ~/.claude/commands/. Add a YAML frontmatter block with description and category. UDD picks it up on the next page load — no restart needed. Use $ARGUMENTS for the user\'s input.',
    code: '---\ndescription: Draft a cold outreach email\ncategory: Outreach\n---\nWrite a concise cold email for:\n\n$ARGUMENTS',
  },
  {
    icon: '⊙',
    title: 'Every run is saved — revisit anytime',
    body: 'Every skill run is written to SQLite with full output, model name, token counts, and args. Open History to replay, copy, or use any past output as context for a new run.',
    link: { href: '/history', label: 'View history →' },
  },
  {
    icon: '▤',
    title: 'Templates inject into the prompt',
    body: 'Resume templates are not just visual — when you pass template:<name> in the args, UDD fetches the template\'s formatting guidelines from the database and injects them before the skill runs. Claude formats the resume accordingly.',
    link: { href: '/resume/templates', label: 'Browse templates →' },
  },
  {
    icon: '🤝',
    title: 'Referral scout → add contacts to the tracker',
    body: '/referral-scout gives you LinkedIn search strategies and ranked contact profiles. It doesn\'t auto-add to the tracker — it\'s advisory. Once you find someone real, open the job in Tracker and add them manually with name, title, LinkedIn, email, and phone. Then /cold-message picks up their details from your args.',
    link: { href: '/tracker', label: 'Open Tracker →' },
  },
  {
    icon: '🔍',
    title: '/find-job-url — recover the posting link from a screenshot drop',
    body: 'When a job is added from a screenshot or image, the original URL is often missing. Open the job in Tracker — if there\'s no URL saved, a banner appears with a "Find job posting →" button. It runs /find-job-url pre-filled with company, role and location, then searches LinkedIn, Greenhouse, Lever and the company\'s careers page to find the live link. Paste it back via Edit details.',
    link: { href: '/tracker', label: 'Open Tracker →' },
  },
  {
    icon: '✦',
    title: 'The home greeting is generated live',
    body: 'Every time you load the dashboard, Claude writes a 1–2 sentence subtitle from your live tracker data — actual companies, statuses, and recent activity. New installs get a static welcome. Once you have applications, the subtitle references them specifically. "offer" highlights green, "interview" amber, "skills" violet.',
    link: { href: '/', label: 'Back to home →' },
  },
]

// ── Components ────────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <pre
      className="rounded-[10px] px-4 py-3 font-mono text-[12px] leading-relaxed overflow-x-auto mt-3"
      style={{ background: 'var(--elevated)', color: 'var(--fg-body)', border: '1px solid var(--border-subtle)' }}
    >
      {children}
    </pre>
  )
}

function FlowCard({ flow }: { flow: Flow }) {
  return (
    <div className="util-card flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>{flow.title}</h2>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{flow.subtitle}</p>
      </div>

      <div className="flex flex-col gap-0">
        {flow.steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            {/* Connector line */}
            <div className="flex flex-col items-center shrink-0" style={{ width: 28 }}>
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1"
                style={{ background: 'var(--accent-primary)' }}
              />
              {i < flow.steps.length - 1 && (
                <div className="flex-1 w-px mt-1" style={{ background: 'var(--border-subtle)', minHeight: 24 }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 flex-1 min-w-0">
              <p className="font-mono text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--accent-primary)' }}>
                {step.label}
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{step.detail}</p>
              {step.code && <Code>{step.code}</Code>}
            </div>
          </div>
        ))}
      </div>

      {flow.link && (
        <Link
          href={flow.link.href}
          className="self-start font-mono text-[11px] px-3 py-1.5 rounded-[8px] transition-colors hover:bg-white/5"
          style={{ color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          {flow.link.label}
        </Link>
      )}
    </div>
  )
}

function CalloutCard({ c }: { c: Callout }) {
  return (
    <div className="util-card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 flex items-center justify-center rounded-[10px] font-mono text-[14px] font-bold"
          style={{ width: 38, height: 38, background: 'rgba(168,85,247,0.1)', color: 'var(--accent-primary)' }}
        >
          {c.icon}
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>{c.title}</p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{c.body}</p>
        </div>
      </div>
      {c.code && <Code>{c.code}</Code>}
      {c.link && (
        <Link
          href={c.link.href}
          className="self-start font-mono text-[11px] px-3 py-1.5 rounded-[8px] transition-colors hover:bg-white/5"
          style={{ color: 'var(--accent-primary)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          {c.link.label}
        </Link>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TipsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
      {/* Hero */}
      <header className="mx-auto max-w-3xl flex flex-col gap-4 px-6 py-16 md:py-20">
        <EyebrowLabel>How UDD works</EyebrowLabel>
        <h1 className="text-sub-large" style={{ color: 'var(--fg)' }}>
          Wired together.
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
          Every piece of UDD feeds the next. Your tracker state flows into skills. Skills hand off to resumes.
          Context files load live on every run. Here's how it all connects.
        </p>
      </header>

      <hr className="border-t mx-6" style={{ borderColor: 'var(--border-subtle)' }} />

      <div className="mx-auto max-w-3xl px-6 py-14 flex flex-col gap-6">

        {/* Flows — full-width step cards */}
        {FLOWS.map(flow => (
          <FlowCard key={flow.title} flow={flow} />
        ))}

        {/* Divider */}
        <div className="py-4">
          <p className="font-mono text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>
            Good to know
          </p>
        </div>

        {/* Callout grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CALLOUTS.map(c => (
            <CalloutCard key={c.title} c={c} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="rounded-[20px] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>Start the pipeline.</p>
            <p className="text-[14px]" style={{ color: 'var(--fg-muted)' }}>Drop a job, run a skill, save a resume.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/drop" className="btn btn-md btn-primary text-[13px]">⬇ Drop Zone</Link>
            <Link href="/profile" className="btn btn-md btn-ghost text-[13px]">◉ Set up context</Link>
            <Link href="/tracker" className="btn btn-md btn-ghost text-[13px]">◈ Tracker</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
