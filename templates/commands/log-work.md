Audit and log Vinh's Jira worklogs — the whole month by default, one day on request.

Input: $ARGUMENTS (optional: nothing = the current month up to today · `YYYY-MM` = that month · `yesterday` / `today` / `YYYY-MM-DD` = one day · `YYYY-MM-DD..YYYY-MM-DD` = a range · `verify` = only re-read Jira and show the day table, log nothing)

> This flow is owned by the **Logwork bot** in vimdevtool. The daily report (`/daily-report`) does NOT log worklogs any more — it only posts the standup. Worklogs are checked and logged here, from the evidence the month left behind.

## Flow overview

**Scope → Read Jira (what is logged) → Find the gaps → Gather evidence per gap day → Plan (what is missing, what to log) → Approve → Log → Verify**

Nothing is written to Jira before Vinh approves the plan. Never.

---

## Config and traps (read before touching Jira)

- **Working day = 8h.** A weekday that is not OOO must total exactly 8h in Jira. Weekend work is informational only — never logged (Vinh's standing rule).
- **Timezone trap (cost a whole afternoon on 30 Oct 2026):** Vinh's Jira account timezone is **America/Los_Angeles**. A worklog `started` at `T00:00:00.000+0700` is stored as 10:00 the *previous* day and shows on the wrong date in his timesheet. Always use **`YYYY-MM-DDT00:00:00.000-0700`** for the intended date, and convert every `started` you read back to the `-0700` day before you count it.
- **Durations need a space:** `"5h 15m"`, `"1h 30m"`. `"5h15m"` fails with "Invalid time duration entered". Single units (`"7h"`, `"45m"`) work either way.
- **The Atlassian MCP cannot audit a month.** `getJiraIssue` / `searchJiraIssuesUsingJql` return only the **oldest 20 worklogs per issue** and there is no delete. On the general tickets (AIT-710, AIT-5315, AIT-4886, PAY-2203) that cap is reached within days. **Read and verify through the Jira REST API in a logged-in Playwright browser** (below). Use the MCP only to *add* worklogs (`addWorklogToJiraIssue`).
- **Vinh's Jira accountId:** `712020:56a2d461-368f-45a1-a1b1-fdee52dc0460` (filter every worklog list by `author.accountId`).
- **OOO days:** check OpenMemory (`search_memory "OOO day off"`) before counting a weekday as missing — e.g. Wed 21 Oct 2026 and Fri 23 Oct 2026 were full days off, never log them. If a weekday has no report, no commits and no meetings, ask Vinh once whether it was a day off instead of planning 8h for it.

### Reading Jira through REST (Playwright)

1. `browser_navigate` to `https://everfit.atlassian.net/jira/your-work`. If it shows a login page, tell Vinh to log in in that browser window and wait (do not type his password).
2. Issue keys with his worklogs in the range (same-origin `fetch` via `browser_evaluate`):
   `GET /rest/api/3/search/jql?jql=worklogAuthor = currentUser() AND worklogDate >= "<from>" AND worklogDate <= "<to>"&fields=key,summary,status&maxResults=200`
   Add the general tickets (`AIT-710`, `AIT-5315`, `AIT-4886`, `PAY-2203`) to the key set even if the JQL misses them.
3. Per key: `GET /rest/api/3/issue/{key}/worklog?startedAfter=<epoch ms of from-day 00:00 -0700 minus 1 day>&maxResults=1000`, keep `author.accountId == <Vinh>`, convert `started` to the `-0700` calendar day, keep `id`, `timeSpentSeconds`, `comment`.
4. Total per day and per ticket. This table is the truth; the MCP is not.

---

## Step 1: Scope

- Default: the current month from the 1st to today (today included only if `today` is asked for; otherwise yesterday is the last day).
- List the working days (Mon–Fri) in scope, minus OOO days from OpenMemory. Keep the list; every later table is keyed by it.

## Step 2: Read what is logged

Run the REST read above for the scope. Render the **day table** right away, before any planning, so Vinh sees the state of the month first:

```
# Worklog audit — November 2026 (01 → 05 Nov)

| Day | Logged | Target | Status | Tickets |
|-----|--------|--------|--------|---------|
| Mon 02 Nov | 8h | 8h | ✅ | AIT-5315 6h15m · AIT-710 45m · PAY-2203 1h |
| Tue 03 Nov | 3h | 8h | ⚠ under 5h | AIT-5315 3h |
| Wed 04 Nov | 0 | 8h | ❌ nothing | — |
| Thu 05 Nov | 12h | 8h | ⚠ over 4h (duplicates?) | AIT-710 2×45m … |
```

Over-logged days: list the duplicate-looking worklogs (same ticket, same day, same minutes or same comment) with their ids. They are only *deleted* on an explicit "delete <ids>" from Vinh: `DELETE /rest/api/3/issue/{key}/worklog/{id}` with header `X-Atlassian-Token: no-check`, then re-read.

If `$ARGUMENTS` is `verify`, stop here and report.

## Step 3: Evidence for every gap day

For each day that is not ✅, gather what actually happened, in this order of trust:

1. **His posted daily reports.** The report posted on the *next* work day carries that day in its DONE section with `Spent` lines — the hours he already told the team. Search Slack: `slack_search_public_and_private` with `from:<@U0A0ANCKWQJ> "DAILY REPORT" after:<day-1> before:<day+3>` in #ai-product-team (C052Z30TQ13), read the thread, take the DONE lines and their Spent values. Also read `~/.vimdevtool/reports/<date>.md` when it exists (the bot's draft, with Vinh's notes).
2. **Calendar.** `mcp__claude_ai_Google_Calendar__list_events` for that day (`time_min`/`time_max` in +07:00; do NOT pass `single_events` — it is rejected). Keep summary, start, end, duration, Vinh's `responseStatus`.
3. **Git.** Discover every checkout under `~/vim` and `~/vim/be`, dedupe by origin, `git fetch --all --quiet`, then `git log --all --author="vinhtran@everfit.io" --since="<day> 00:00 +0700" --until="<day> 23:59 +0700" --format="%h %s"` per repo. Map commits to ticket keys (`AIT-\d+`, `PAY-\d+`, `AIP-\d+` in the message or branch).
4. **Board history.** `~/.vimdevtool/worklog.jsonl` (ticket stage changes, handled Slack asks, review sends with times) and `~/.vimdevtool/handled.json`.

Vinh is **frontend only**: backend tickets, BE repos (foundry, everfit-ai-api, ai-olly-action) and BE questions he relayed are never his hours.

## Step 4: Mapping rules (these override anything generic)

**General / meeting tickets:**

| Work | Log to | Note |
|---|---|---|
| AI DSU / AI standup | `AIT-710` | **45m every weekday** (runs 08:45–09:30 even if the calendar block says 30m). No DSU on a day AI Weekly replaces it (Wednesdays). |
| AI Weekly, AI Hour, AI discussions, AI release meetings | `AIT-710` | event length |
| Support review code | `PAY-2203` | **30m every weekday**, comment `DEV - Support review code` |
| Payment-team meetings (Sprint Review & Planning, Release meeting, Technical Discussion) | `PAY-2203` | event length |
| Interviews, retros, intros, social (Happy Hour, AI Hour & Birthday) | `PAY-2203` | event length |

- ⛔ **Never `PAY-1466`** — it is the Booking team's card; Vinh is off Booking since Jul 2026.
- ⛔ **Vinh does not attend the Payment daily meeting** — never log it, even if it is on the calendar.
- Skip: deep-work blocks ("nín time"), all-day reminders, after-hours social, "Recheck Security", declined events.

**Feature work:**
- Jira tickets (`AIT-`, `PAY-`): log directly on the ticket worked that day.
- **Linear cards (`AIP-nnn`) have no Jira worklog.** Log their hours on the parent epic — CID v2 work → `AIT-5315` (or the specific AIT story if the card clearly sits inside one); Program Copilot / PTC → `AIT-4886` — and list the AIP keys in the comment: `DEV - CID v2: AIP-1303 anniversary verb, AIP-1306 booking status dot`.
- `dev_hours = 8h − meetings − 30m review` (floor 0), split across the day's feature tickets by the Spent values in his report when it exists, else by commit weight. Round to 15 minutes. Comment: `DEV - <concise, non-technical>`.

## Step 5: Plan — say what is missing in plain words

Write the plan as a file AND print it:

- `~/.vimdevtool/logwork/<YYYY-MM>-plan.md` (mkdir -p first) — the full text below.
- `~/.vimdevtool/logwork-state.json` — `{"updated":"<ISO now>","scope":"<from>..<to>","days":[{"date":"2026-11-04","logged":0,"target":480,"status":"missing"|"under"|"over"|"ok"|"off"}],"missing":["Wed 04 Nov: nothing logged (report says 8h: AIT-5315 6h15m, AWS incident 1h30m…)"],"plan":[{"date":"2026-11-04","ticket":"AIT-5315","time":"6h 15m","comment":"DEV - …"}],"text":"<the plain-words summary>"}` so the vimdevtool board can show it.

```
# Worklog plan — November 2026

## What is missing (plain words)
- Wed 04 Nov has nothing logged. Your 05 Nov report says 8h: CID v2 release prep 1h, internal workspaces 30m, AWS incident FE keys 1h30m, Payment review 45m, AI Weekly 1h + …  → 6 entries below.
- Tue 03 Nov is 5h short: only AIT-5315 3h is logged; the report also had PAY-2379 emails 3h15m and the DSU.
- Thu 05 Nov is 4h over: AIT-710 has the DSU twice (ids 12345, 12351). Say `delete 12351` to fix it.

## Entries to log

| Day | Ticket | Time | Comment |
|-----|--------|------|---------|
| Wed 04 Nov | AIT-5315 | 4h 15m | DEV - CID v2 release 0.4.10 prep, internal workspaces list |
| Wed 04 Nov | AIT-710 | 1h | DEV - AI Weekly Meeting |
| … |

## Day totals after logging
| Day | Now | + Plan | = | Status |
```

Then ask exactly: `Log it? (yes / only <day> / adjust <what> / skip <ticket>)` and **wait**. Do not log on silence, on "looks good" said about something else, or on a message that is not clearly approval.

## Step 6: Log (after approval only)

For each approved row call `mcp__claude_ai_Atlassian__addWorklogToJiraIssue`:
- `cloudId`: `everfit.atlassian.net`
- `issueIdOrKey`: the ticket
- `timeSpent`: spaced, e.g. `"6h 15m"`
- `started`: `YYYY-MM-DDT00:00:00.000-0700`
- `commentBody`: `DEV - …` with `contentFormat: "markdown"`

Collect each returned `worklog.id`. On the first failure **stop and report** — do not continue blindly. Warn before logging to a `Done` / `Closed` ticket (some projects block it).

## Step 7: Verify — through REST, never through the MCP

Re-read the scope with the REST steps above and print the day table again. Every working day must be exactly 8h; flag anything else. Update `logwork-state.json` (`days`, `missing`, `updated`) and append a line to `~/.vimdevtool/logwork/<YYYY-MM>-plan.md`: `Logged <n> entries on <ISO>: <ids>`. Do not say "done" until the re-read shows the totals.

## One-day mode

`yesterday` / `today` / `YYYY-MM-DD` runs the same steps for that single day (Step 2 reads only that day, Step 3 gathers only its evidence). The approval question and the REST verify still apply.

## Error handling

- Login page in the browser → ask Vinh to log in there, then retry the read. Never ask for the password.
- Zero events, zero commits and no report on a weekday → ask once if it was a day off; never plan 8h of guesses.
- `addWorklogToJiraIssue` error → stop, show the error and the row, wait.
- Never silently skip a day or an entry — every gap is either planned, logged, or named in "What is missing".
