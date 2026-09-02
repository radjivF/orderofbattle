---
name: clarity-ux-review
description: >-
  Reviews Microsoft Clarity for dead clicks, rage clicks, and other user
  friction, then opens a draft PR with the session recording that motivated the
  fix. Use when checking Clarity, dead clicks, rage clicks, UX frustration,
  or running the recurring Clarity UX review.
---

# Clarity UX review

Recurring loop for [orderofbattle.app](https://orderofbattle.app). Clarity project `y8rbeg2r71`. MCP: `user-clarity-orderofbattle` (`@microsoft/clarity-mcp-server`).

Do **not** paste or log `CLARITY_API_TOKEN`.

## When to run

- User asks to check Clarity / dead clicks / user problems
- Scheduled automation (every 2–3 days — the API only returns the last 3 days)
- Skip if `CLARITY_API_TOKEN` is empty in `~/.cursor/mcp.json`

## Quota

- About **10 Clarity API requests per project per day**
- Spend at most **3–4** calls per review
- No PR if nothing material showed up

## Workflow

1. **Metrics** (1–2 calls) via `query-analytics-dashboard`:
   - Dead clicks last 3 days **by URL**
   - Same for rage clicks / error clicks if dead-click volume is low
2. **Recordings** (1 call) via `list-session-recordings` (or HTTP fallback):
   - `deadClickPresent: true` (or `rageClickPresent` if that is the signal)
   - Prefer mobile if Device split is mostly mobile
   - Take the **best 1–2 recordings** for the hottest URL
   - Each item has `link` (the session video) and `timeline[].timelineEvents[]` with `eventtype` + `text`. Use `eventtype: "Dead click"` — that copy is what they tapped.
3. **Decide**
   - Map URL → screen/component in `src/components/` / `src/app/`
   - Confirm it is a real miss (looks tappable, no handler, overlay eating clicks, truncated text that looks like a link)
   - Skip false positives (taps on inert labels/art with no confusion in the recording)
   - Skip if a recent PR already shipped the same fix and production may not have it yet
4. **Fix** — one hotspot per PR. Make it a real control, or drop the false affordance.
5. **Verify** — `yarn lint` + tests for touched files. Browser-check the flow if UI changed.
6. **Draft PR** with the recording as evidence (template below). Do not merge.

## PR body (required)

The reviewer must be able to play the session that caused the fix. Clarity does not export an MP4 via API — put the **player URL** from `list-session-recordings` at the top.

```markdown
## Why

[one sentence: what the user clicked and what failed]

## Session recording

Watch this Clarity session (log in to Clarity if prompted):

{RECORDING_URL}

GitHub cannot embed the player. The URL **is** the video — do not omit it.

- Signal: dead click | rage click | error click
- URL: {page url}
- Device: {mobile|PC|tablet}
- What they clicked: {element / copy on screen}
- Last 3 days: {deadClickCount} dead clicks on this URL

## Fix

- {what changed in which component}

## Test plan

- [ ] Reproduce the tap on {element}
- [ ] Confirm it now does {expected} (or no longer looks tappable)
```

Title: `fix(ux): {short description of the dead click}`
Branch: `fix/clarity-{short-slug}` from **`origin/dev`**
Base: **`dev`**. Never `main`. Open as **draft**.

## If MCP is down

Cursor may fail to discover `user-clarity-orderofbattle` even with a valid token (stdio MCP). Fall back to the same HTTP APIs the server uses — **do not** print the token:

- Insights: `GET https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3&dimension1=URL` with `Authorization: Bearer $CLARITY_API_TOKEN`
- Recordings: `POST https://clarity.microsoft.com/mcp/recordings/sample` with `deadClickPresent: true`, `count` ≤ 8, `sortBy: 5` (most clicks). Response `link` fields are the session videos.

Read the token from `~/.cursor/mcp.json` → `clarity-orderofbattle.env.CLARITY_API_TOKEN` in process only.

Still stop if the token is empty. Do not put it in git or in the PR.
