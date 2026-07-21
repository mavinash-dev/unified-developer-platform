import path from 'path'
import fs from 'fs'
import os from 'os'

// All user-generated files live inside the repo under data/
// This keeps the install self-contained — one folder, easy to move or delete.
export const DATA_DIR     = path.join(process.cwd(), 'data')
export const UDD_DIR      = path.join(DATA_DIR, 'udd')
export const USER_FILE    = path.join(UDD_DIR, 'user.json')
export const CONTEXT_FILE = path.join(UDD_DIR, 'udd-context.md')
export const DB_PATH      = path.join(DATA_DIR, 'career.db')

// One-time migration: move ~/.udd → data/udd for existing installs
const legacyUddDir = path.join(os.homedir(), '.udd')
if (fs.existsSync(legacyUddDir) && !fs.existsSync(UDD_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.renameSync(legacyUddDir, UDD_DIR)
    console.log('[UDD] Migrated ~/.udd → data/udd')
  } catch (e) {
    console.warn('[UDD] Migration failed, copying instead:', (e as Error).message)
    try {
      fs.cpSync(legacyUddDir, UDD_DIR, { recursive: true })
    } catch { /* best-effort */ }
  }
}
