import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'career.db')

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

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
    relationship TEXT DEFAULT 'referral',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

export default db
