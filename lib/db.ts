import Database from 'better-sqlite3'
import fs from 'fs'
import { DATA_DIR, DB_PATH } from './paths'

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS token_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    skill TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    role TEXT,
    ats_score REAL,
    format TEXT DEFAULT 'markdown',
    file_path TEXT,
    compatibility TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ats_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER REFERENCES resumes(id),
    score REAL,
    tfidf_score REAL,
    keyword_score REAL,
    keyword_data TEXT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scout_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_company TEXT,
    target_role TEXT,
    tc_baseline INTEGER,
    report_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill TEXT NOT NULL,
    category TEXT DEFAULT '',
    model TEXT DEFAULT '',
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    args TEXT DEFAULT '',
    output TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    url TEXT DEFAULT '',
    status TEXT DEFAULT 'wishlist',
    location TEXT DEFAULT '',
    remote INTEGER DEFAULT 0,
    salary_range TEXT DEFAULT '',
    jd_summary TEXT DEFAULT '',
    key_skills TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT DEFAULT '',
    company TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    relationship TEXT DEFAULT 'referral',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Additive migrations for existing DBs
try { db.exec(`ALTER TABLE contacts ADD COLUMN email TEXT DEFAULT ''`) } catch { /* already exists */ }
try { db.exec(`ALTER TABLE contacts ADD COLUMN phone TEXT DEFAULT ''`) } catch { /* already exists */ }

db.exec(`
  CREATE TABLE IF NOT EXISTS resume_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    description TEXT DEFAULT '',
    guidelines TEXT NOT NULL,
    is_builtin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Seed built-in templates once
const templateCount = (db.prepare('SELECT COUNT(*) as n FROM resume_templates WHERE is_builtin = 1').get() as { n: number }).n
if (templateCount === 0) {
  const insert = db.prepare(`INSERT INTO resume_templates (name, category, description, guidelines, is_builtin) VALUES (?, ?, ?, ?, 1)`)
  insert.run(
    'Software Engineer (FAANG/Big Tech)',
    'Tech',
    'Two-page max, impact metrics, scope statements, TC context.',
    `## Format Guidelines: Software Engineer (FAANG/Big Tech)

- **Length**: 1–2 pages max. Never exceed 2 pages regardless of experience.
- **Summary**: Skip the objective. Open directly with Work Experience.
- **Bullets**: 4–6 per role using STAR/XYZ format — "Accomplished [X] as measured by [Y] by doing [Z]".
- **Metrics are mandatory**: Every bullet must include a number (latency, scale, cost, %, team size, revenue impact).
- **Scope signals**: Call out system scale — "serving 50M DAU", "500K QPS", "99.99% uptime".
- **Skills section**: Group by category — Languages, Frameworks, Infrastructure, ML/AI if relevant. No proficiency bars.
- **ATS keywords to hit**: system design, distributed systems, microservices, CI/CD, on-call, cross-functional, roadmap.
- **Avoid**: Photos, colors, tables, headers/footers, textboxes — ATS parsers choke on these.
- **Font**: 10–11pt, single column, clean sans-serif (Calibri, Arial, Helvetica).`
  )
  insert.run(
    'Software Engineer (Startup)',
    'Tech',
    'One page, fast pace, breadth, ownership, shipping cadence.',
    `## Format Guidelines: Software Engineer (Startup)

- **Length**: 1 page only — startups signal efficiency; 2 pages reads as bloat.
- **Tone**: Builder, owner, shipper. Use verbs: shipped, owned, led, rebuilt, cut, grew.
- **Bullets**: 3–5 per role. Focus on breadth + speed — "Shipped X feature solo in Y weeks".
- **Metrics**: Revenue, user growth, uptime, latency wins. Even rough numbers ("~40% faster").
- **Stack section**: List everything — FE, BE, infra, data. Startups want versatile generalists.
- **Projects**: Add a 2–3 line Projects section if relevant (open source, side projects, hackathons).
- **Culture fit signals**: Autonomy, ambiguity, zero-to-one, "no playbook", fast iteration.
- **Avoid**: Long corporate descriptions, committee language, passive voice ("was responsible for").`
  )
  insert.run(
    'Data Scientist / ML Engineer',
    'Tech',
    'Projects-first layout, publications, skills matrix, model metrics.',
    `## Format Guidelines: Data Scientist / ML Engineer

- **Length**: 1–2 pages. Senior/research roles may include a publications list (separate page).
- **Lead with impact**: "Built churn model that reduced customer loss by 18% ($2M ARR saved)".
- **Bullet structure**: Method → Data scale → Business result. E.g. "Trained XGBoost classifier on 10M rows; improved precision by 12pp vs baseline".
- **Skills matrix**: List by category — Languages (Python, R, SQL), Frameworks (PyTorch, Sklearn, HuggingFace), MLOps (MLflow, Weights & Biases, SageMaker), Data (Spark, BigQuery, dbt).
- **Projects section**: 2–4 projects with model type, dataset size, metric improvement, and GitHub link.
- **ATS keywords**: feature engineering, A/B testing, statistical modeling, production ML, model monitoring, data pipeline.
- **Metrics to always include**: accuracy/F1/AUC delta vs baseline, dataset size, inference latency, model serving scale.
- **Avoid**: Vague claims ("strong ML background"), listing every Python library you've touched.`
  )
  insert.run(
    'Product Manager',
    'Product',
    'Business metrics focus, STAR format, cross-functional scope, roadmap ownership.',
    `## Format Guidelines: Product Manager

- **Length**: 1 page (IC PM), up to 1.5 pages (Director+).
- **Summary** (optional, 2 lines): "PM with X years building [domain] products, most recently at [Company] growing [metric] by [number]."
- **Bullets**: STAR format strictly. Always show: the problem → your decision → the outcome.
- **Metrics**: GMV, DAU/MAU, retention, NPS, revenue, conversion, time-to-market. If you led it, you own the number.
- **Scope signals**: Team size, budget owned, number of engineers/designers managed (even cross-functionally).
- **Roadmap language**: "Defined 12-month roadmap for X", "prioritized backlog of 60+ requests using RICE".
- **ATS keywords**: roadmap, OKRs, go-to-market, stakeholder management, discovery, A/B testing, data-driven, cross-functional.
- **Skills**: Keep short — no need to list every tool. Mention: analytics tools (Amplitude, Mixpanel), Jira/Linear, SQL basics if real.
- **Avoid**: Engineering implementation details, feature lists without outcomes, "wore many hats" filler.`
  )
  insert.run(
    'General / ATS-Safe',
    'General',
    'Keyword-dense, minimal formatting, safe for all ATS parsers.',
    `## Format Guidelines: General / ATS-Safe

- **Length**: 1 page (< 10 years), up to 2 pages (10+ years or executive).
- **Format**: Single column, no tables, no text boxes, no graphics, no colors. Plain text hierarchy only.
- **Sections in order**: Contact Info → Summary (3 lines max) → Work Experience → Skills → Education.
- **Bullets**: 3–5 per role. Lead with strong action verbs. Include at least one metric per role.
- **Keywords**: Mirror exact language from the JD — do not paraphrase. ATS matches on exact strings.
- **Skills section**: Plain list, comma-separated. Group by: Technical Skills | Tools | Soft Skills.
- **Dates**: Use "Jan 2022 – Mar 2024" format (not "2022–2024" alone — ATS may not parse month gaps).
- **File format**: Save as .docx or plain .txt for portal uploads. PDF is fine for human readers.
- **Avoid**: Headers/footers (ATS often strips them), fancy bullets (use • or -), columns (parsed left-to-right as garbage).`
  )
}

db.exec(`
  CREATE TABLE IF NOT EXISTS context_snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// Migrations — safe to re-run, SQLite ignores duplicate columns
try { db.exec(`ALTER TABLE applications ADD COLUMN source TEXT DEFAULT 'manual'`) } catch {}

export default db
