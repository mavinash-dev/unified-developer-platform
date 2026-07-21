# Contributing to UDD

## Golden rule: no direct commits to `main`

All changes go through pull requests. This keeps the dashboard stable for everyone using it as a daily tool.

## Workflow

```
git checkout -b feat/your-feature-name
# make changes
git push origin feat/your-feature-name
# open PR on GitHub → review → merge
```

**Never** `git push origin main` or `git commit --amend` on a shared branch.

## Adding or editing skills

Skills live in `skills/*.md`. Each skill must:

1. Have YAML frontmatter with `description` and `category` fields (see `skills/README.md`)
2. Pass its self-test before being shipped — run `node test-skill.js <skill-name>` and verify all assertions pass
3. Include or update a test file at `skills/tests/<skill-name>.test.json`

Skills that fail their tests should not be merged.

## Editing dashboard code (`app/`, `components/`, `lib/`)

- Run `npm run build` locally before opening a PR — the build must be clean (no TypeScript errors, no missing exports)
- Test the UI in a browser: `npm run dev` → visit `localhost:3004`
- If you change a shared module (`lib/db.ts`, `lib/claude-cli.ts`, `components/Sidebar.tsx`), call out the impact in your PR description

## PR checklist (filled out in the PR template)

- [ ] Build passes (`npm run build`)
- [ ] Skill tests pass if skills were added/edited (`node test-skill.js`)
- [ ] No hardcoded names or paths (use `~/.udd/user.json` for user config)
- [ ] No secrets or API keys committed

## Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/` | `feat/skill-followup` |
| Bug fix | `fix/` | `fix/token-display` |
| Skill | `skill/` | `skill/ats-scorer` |
| Docs | `docs/` | `docs/setup-guide` |

## Protecting `main` (one-time admin setup)

In GitHub → Settings → Branches → Add branch protection rule:
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require at least 1 approval
- ✅ Do not allow bypassing the above settings
