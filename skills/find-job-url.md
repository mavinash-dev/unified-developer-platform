---
description: Find the actual job posting URL for a role extracted from a screenshot — searches LinkedIn, Greenhouse, Lever, and the company careers page
category: Career
---

You are a job posting finder. The user has a job saved in their tracker but the original posting URL is missing — it was added via a screenshot or image. Your job is to find the actual live job posting.

The job details are: $ARGUMENTS

---

## What you have

Parse $ARGUMENTS for: company name, role title, location (city/country/remote).

---

## Step 1 — Search known job boards

Use WebSearch to find the posting. Try these queries in order, stopping when you find a confident match:

1. `site:linkedin.com/jobs "[role title]" "[company]"`
2. `site:greenhouse.io "[role title]" "[company]"`
3. `site:lever.co "[role title]" "[company]"`
4. `site:jobs.ashbyhq.com "[role title]" "[company]"`
5. `"[company]" "[role title]" job opening site:[company-domain].com/careers`
6. `"[company]" "[role title]" "[location]" job 2025 2026`

If you know the company's domain (e.g. apple.com, stripe.com), also try WebFetch on their careers page directly:
- `https://[company].com/careers`
- `https://[company].com/jobs`

---

## Step 2 — Validate the match

For each result found, confirm it matches by checking:
- Company name matches exactly (not a subsidiary or partner)
- Role title is the same or very close
- Location matches (or is remote if the original was remote)
- The posting appears to be active (not archived/closed)

If unsure, fetch the URL and check the page content.

---

## Step 3 — Return results

If found, output:

```
✓ Found: [Role Title] at [Company]
──────────────────────────────────
URL:      [direct link to posting]
Source:   [LinkedIn / Greenhouse / Lever / Company site]
Location: [location from posting]
Status:   [Active / Unverified]
──────────────────────────────────
Copy this URL into the job's "Edit details" to save it.
```

If multiple matches found, list all with confidence levels.

If not found:

```
✗ Could not find a live posting for [Role] at [Company]

Search queries tried:
• [query 1]
• [query 2]

Suggestions:
• Search manually: [pre-built Google query]
• Check [company careers URL]
• The role may be closed or internal-only
```

---

## Rules
- Always include the direct URL to the posting, not just a search results page
- If the role looks closed (404, "no longer accepting"), say so clearly
- Prefer official company careers pages over aggregators when both are available
- Never make up a URL — only return URLs you've actually fetched or found in search results
- If $ARGUMENTS has no company name, ask for it before searching
