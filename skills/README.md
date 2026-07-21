# Skills

Skills are Claude Code slash commands that the dashboard discovers automatically.
Each `.md` file in this directory becomes a skill tab in the sidebar.

## How it works

1. `./setup.sh` creates a symlink from each file here into `~/.claude/commands/`
2. `git pull` updates the symlinks automatically — no re-run needed
3. The dashboard reads `~/.claude/commands/` at runtime — new skills appear without rebuilding

## File format

```markdown
---
description: One-line description shown in the sidebar and terminal
category: Career
---

You are a [role] helping [user] with [task].

The input is: $ARGUMENTS

## Step 1 — ...
```

### Frontmatter fields

| Field | Required | Description |
|---|---|---|
| `description` | Yes | Shown in sidebar tooltip and terminal idle state |
| `category` | Yes | Groups skills in sidebar (Career, Dev Tools, General, etc.) |

### `$ARGUMENTS`

`$ARGUMENTS` is replaced with whatever the user types in the input box before running.
Parse it flexibly — URLs, file paths, plain text, or empty.

## Skill handoff

To suggest jumping to another skill at the end of a run, output a `SKILL_ACTION:` line:

```
SKILL_ACTION: {"next": "job-scout", "label": "Find similar roles with /job-scout"}
```

The dashboard strips this line from the visible output and renders it as a clickable button.
You can emit multiple `SKILL_ACTION:` lines — each becomes a separate button.

## Adding a new skill

1. Create `skills/my-skill.md` with frontmatter + prompt
2. Run `./setup.sh` once (or re-run if it's a new file, not a git-pull update)
3. Refresh the dashboard — the skill appears in its category group

## Skills in this repo

| File | Category | Description |
|---|---|---|
| `resume-update.md` | Career | Professional resume coach with ATS validation gate at 85% |
| `job-scout.md` | Career | Job market intelligence via levels.fyi TC benchmarks |

## ATS scorer

`resume-update` uses `~/.claude/scripts/ats_score.py` — a TF-IDF + keyword-match scorer.
Threshold is 85%. The resume is not delivered until it passes.

Install dependency once: `pip3 install scikit-learn`
