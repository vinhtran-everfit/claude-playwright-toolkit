Generate and send a daily standup report to Slack.

Input: $ARGUMENTS (optional: notes about what you did/plan to do, or a Slack channel name to send to)

## Instructions

This flow: **Gather Git → Gather Jira → Check Calendar → Build Report → Preview to DM → Send to channel/thread → Log Jira Worklogs (time spent per ticket) → Log HRM Workload (today + tomorrow)**

> **Always check the calendar BEFORE estimating time.** The day is 8h. Meetings come off the top, and the remaining hours are what you split across tasks. Estimating ETAs without knowing the meeting load produces totals that don't add up to 8h — see Step 2.5 and the totals rules below.

### Step 1: Gather Git context

Vinh works across **many git worktrees** of a few repos (`~/vim/bi-dashboard-wt-*`, `~/vim/everfit-react-wt-*`, `~/vim/*-agui`, `~/vim/foundry-wt-*`, …). Never hardcode a handful of paths — discover every checkout, dedupe by origin, and scan **all branches** of each repo. Two rules that bit us before:

- **Author filter:** `git config user.name` is empty on this machine, so `--author="$(git config user.name)"` matches nothing. Always use `--author="vinhtran@everfit.io"` (or `--author="Vinh" -i`).
- **`--all` + fetch first:** work often sits on a local branch that is not checked out anywhere (e.g. `feat/ait-5652-cid-v2-tour` was only visible with `--all`).

**Repos in scope (origin name → what it is):**

| Origin repo | What Vinh does there | Team |
|---|---|---|
| `bi-dashboard` | Check-in Dashboard v2 UI (CID v2) — `bi-dashboard-cidv2` + `bi-dashboard-wt-*` worktrees | AI :ai: |
| `everfit-react` | Parent host for CID v2, Olly connector cards, PTC frontend — `everfit-react-ptc`, `everfit-react-wt-*`, `everfit-react-agui` | AI :ai: |
| `ai-olly-action` | Olly / PTC 2.0 connectors backend (Sheets, Loom, Notion, Gmail), AG-UI spike (`ai-olly-action-agui`) | AI :ai: |
| `foundry` | Temporal workers: `program-copilot-ptc`, `olly-connectors`, `olly-connectors-planner`; experiments | AI :ai: |
| `everfit-ai-api` (`~/vim/be/everfit-ai-api`) | AI API side of the coach dashboard | AI :ai: |
| `everfit-react-booking` | Booking — **off since Jul 2026**, skip unless Vinh names it | Booking :calendar: |

```bash
# 1) Discover every checkout under ~/vim (and ~/vim/be) and group by origin repo
cd ~/vim
for d in */ be/*/; do
  r=$(git -C "$d" remote get-url origin 2>/dev/null | sed -E 's#.*/([^/]+)\.git#\1#')
  [ -n "$r" ] && echo "$r  <-  ${d%/}"
done | sort | grep -E "^(bi-dashboard|everfit-react|ai-olly-action|foundry|everfit-ai-api) "

# 2) Commits: ONE representative checkout per origin repo, fetch, then --all
#    (every worktree of a repo shares the same object store, so one scan covers them all)
for d in ~/vim/bi-dashboard-cidv2 ~/vim/everfit-react-ptc ~/vim/ai-olly-action ~/vim/foundry ~/vim/be/everfit-ai-api; do
  git -C "$d" fetch origin --quiet 2>/dev/null
  echo "=== $(basename "$d") ==="
  git -C "$d" log --all --author="vinhtran@everfit.io" --since="3 days ago" \
      --format="%h %ad %s %d" --date=format:'%Y-%m-%d %H:%M'
done

# 3) Uncommitted / untracked work in EVERY worktree — this is where spikes and research hide
#    (AG-UI spike = untracked src/api/agui.py + src/features/Olly/agui/, foundry connector
#    workers = untracked workers/olly-connectors*/ — none of it shows in git log)
cd ~/vim
for d in */ be/*/; do
  n=$(git -C "$d" status --short 2>/dev/null | grep -v -E "^\?\? (\.venv|node_modules|dist|uv\.lock|body\.tmp)/?$" | wc -l | tr -d ' ')
  [ "$n" != "0" ] && echo "=== ${d%/} ($(git -C "$d" branch --show-current)) — $n changed/untracked ===" \
    && git -C "$d" status --short | grep -v -E "^\?\? (\.venv|node_modules|dist|uv\.lock|body\.tmp)/?$" | head -12
done

# 4) Deploy evidence — what actually reached QA1 (for the "deployed to QA1" note)
git -C ~/vim/everfit-react-ptc log origin/qa1-debug --since="3 days ago" --format="%h %ad %s" --date=format:'%Y-%m-%d %H:%M'
git -C ~/vim/bi-dashboard-cidv2 log origin/develop --merges --since="3 days ago" --format="%h %ad %s" --date=format:'%Y-%m-%d %H:%M'
```

Read step 3's output carefully: a branch named `spike/agui-*` with only uncommitted files is still a full day's research. Treat untracked dirs/files as evidence of work-in-progress, cite them as `branch spike/agui-incumbent (WIP, uncommitted)` instead of a commit link, and ask Vinh what the spike was about if the branch/file names don't make it obvious.

### Step 1.5: Research and design work that leaves no commits

A large share of Vinh's day is research/design — AG-UI protocol evaluation, Google Sheets / Loom / Notion connector integration design, "workout templates into the connector connection", BE contract reviews. This produces no commits (at most an untracked spike file), so commit-driven gathering systematically under-counts it. Before building the report:

1. Note every spike branch / untracked dir from step 3 above.
2. Check the day's calendar for sync meetings whose topic implies research (e.g. "CID v2 - daily sync", "Preparation before AI Weekly").
3. If git shows a thin day, **ask Vinh once** what research he did — his own words are valid evidence for a DONE line (see the `No Invented Activity Lines` rule: a planned item is not evidence, but Vinh saying "I researched X" is). Do not pad with guessed research.

Describe these lines concretely ("Deeper research on Google Sheets integration — how a coach's sheet maps onto Everfit data", "AG-UI spike — streamed Olly events into the OllyModal via `src/api/agui.py`"), never as a vague "research" blob.

**Group commits by ticket (required — feeds the `Code:` detail lines).** Managers need to see the actual commits/PRs behind each reported ticket:

1. Extract the ticket key (`AIT-nnnn` / `PAY-nnnn`) from each commit subject and group the commits per ticket. Commits with no key in the subject: infer the ticket from the branch name (`feat/AIT-4567-...`) or from sibling commits in the same push; if still unclear, group them under the ticket whose feature they touch.
2. Capture merged PR numbers + URLs from merge commits (`Merge pull request #N from Everfit-io/<branch>`) — PR URL pattern: `https://github.com/Everfit-io/<repo>/pull/<N>`. `gh pr list --author "@me" --state merged --limit 10` works as a fallback.
3. For work pushed to a branch but not yet merged, note the branch name instead of a PR.

Keep this map (ticket → commit SHAs + their PR/branch) — Step 3 appends a short-hash link per commit (URL = the commit inside its PR) to every DONE/PROGRESS ticket line. A PR usually mixes several tickets' commits, so the per-commit SHAs are what let each ticket line point at exactly its own code.

### Step 2: Gather Jira tickets

**CRITICAL RULE: Only report tickets where `assignee = currentUser()`. NEVER include tickets assigned to other people, even if they appear in your git commits (you may have committed for a teammate's ticket). Every JQL query MUST include `assignee = currentUser()`.**

**Always scope to the current sprint epic first.** Ask or check which epic is active (e.g., AIT-3434 for the May 14 launch). Only report tickets under that epic — ignore tickets from old sprints.

**Current sprint epic tickets (primary query):**
```
JQL: assignee = currentUser() AND "Epic Link" = <EPIC_ID> ORDER BY updated DESC
```

**Recent assigned tickets (fallback when epic unknown):**
```
JQL: assignee = currentUser() AND project = AIT AND updated >= -7d ORDER BY updated DESC
```

**Payment & Booking tickets (project PAY):**
```
JQL: assignee = currentUser() AND project = PAY AND status IN ("In Progress", "In Review", "To Do") ORDER BY updated DESC
```

Use `getJiraIssue` to get details for specific tickets if needed. Extract:
- Ticket ID (e.g., AIT-3492, AIT-3516)
- Summary (use as task description — keep it non-technical)
- Status — **always verify the actual Jira status** (do not assume from git commits)
- Assignee — **verify ticket is assigned to you** before including in the report
- Solution design link — scan the ticket **description** for an SDD / solution-design URL (`internal-docs.everfit.io/docs/...solution-design...` or a Confluence page titled "Solution Design"). Keep it in the per-ticket map; Step 3 appends it inline as `· <url|SDD>`. Ignore other doc links (implementation plans, Slack threads) — SDD only, to keep lines short.

**Cross-check:** The JQL results (assignee = currentUser()) are the source of truth. If a ticket from git commits does NOT appear in the JQL results, skip it immediately — do NOT call getJiraIssue to verify. It's not mine. Git commits often touch teammates' tickets — those do NOT belong in the report.

**Always resolve work to a REAL sub-ticket — never write a vague line like "Support X" or "Help with Y".** The launch epics (e.g. `AIT-4104`, `AIT-3956`, `AIT-4073`) are usually assigned to a lead, not you — but your concrete work lives in sub-tickets under them. Pull your own sub-tickets with:

```
JQL: assignee = currentUser() AND parent IN (<EPIC_1>, <EPIC_2>, <EPIC_3>) ORDER BY status ASC
```

Then place each sub-ticket by status (QA READY/Success → DONE; To Do/Q&A → PLAN). Reference the sub-ticket key + summary; cite the parent epic only as the feature-header context (see template). If a piece of work genuinely has no ticket (release handling, cross-team support), tag it but keep it specific.

### Step 2b: Gather Linear tickets (AIP-nnn) — since Oct 2026

Since early Oct 2026 the AI team files **QA bugs and small fixes in Linear**, not Jira. Jira (AIT) still holds the epics / user stories; Linear (`AIP-nnn`) holds the day-to-day bug cards QA raises on staging. A day with zero Jira movement can still have 4–5 Linear bugs fixed.

- **Keys & links:** `AIP-nnn` → `https://linear.app/everfit/issue/AIP-nnn` (Slack link form: `<https://linear.app/everfit/issue/AIP-760|AIP-760>`).
- **Projects:** CID v2 QA bugs → Linear project *Checkin Dashboard V2 (for 20 workspaces)*; Program Copilot / PTC bugs → the PTC project (AIP-5xx/6xx). Both hang under the Jira epics `AIT-5315` / `AIT-4886` for the feature header.
- **Statuses** (use as backtick tags): `Todo`, `In Progress`, `In Review`, `QA Ready`, `QA Failed`, `Done`. Mapping to report sections is the same as Jira (QA Ready/Done → DONE; In Progress/In Review → PROGRESS CHANGED).
- **How cards get created:** QA (Anh Mai / Lam) posts a numbered issue list in a Slack thread in `#ai-checkin-dashboard` (C09DPS0RHDL) or `#ai-workout-program-copilot`, then asks the Linear bot to "log card no1..noN"; the bot replies with the AIP keys. Vinh then posts an *ownership summary* (FE / AI / BE) in the same thread.

**Gathering (no Linear MCP is connected — only `mcp__claude_ai_Linear__authenticate` exists; if Vinh connects it, query `assignee = me AND updated >= -2d` first and skip the fallbacks):**
1. Commit subjects + PR titles/bodies: `AIP-\d+` in `fix(ai-coach): AIP-762 …` or `Closes AIP-760/761/762/763` in the PR body. Group commits per AIP key exactly like AIT keys.
2. Slack: `slack_search_public_and_private` with `filters: from:<@U0A0ANCKWQJ> after:<yesterday>` — Vinh's own PR-request messages in `#ai-review-code` (C07R94FMQLB) list the AIP keys with root cause, and his ownership summary in the QA thread says which cards are his.
3. The Linear bot's thread replies ("Đã tạo 6 issues … No1: AIP-760 …", "assign AIP-763 cho Vinh Tran (FE)") give key ↔ issue-number ↔ title.

**Ownership rule for Linear (replaces the JQL assignee check):** a Linear card is Vinh's only if (a) his commit/PR carries the key, or (b) he claimed it in his ownership summary, or (c) the Linear bot assigned it to him. Cards he merely triaged to BE/AI (e.g. "No5 → BE") are NOT his and never appear as his DONE/PLAN lines — at most they appear in his triage line ("Triaged the 11 staging issues with QA — confirmed FE/AI/BE ownership").

**Reporting Linear work:**
- Several QA bugs fixed in **one PR** go on **one line**: `<AIP-760> / <AIP-761> / <AIP-762> / <AIP-763> QA 5 Oct FE bugs — <what the coach sees fixed> — fixed, merged to release · Spent … · <commit links>`.
- Keep the Jira epic as the feature header (`**Check-in Dashboard v2** (<AIT-5315>)`); Linear lines sit under it next to Jira story lines.
- Open Linear bugs assigned to Vinh go in PLAN with an ETA; ones blocked (e.g. waiting on a Figma frame) go in BLOCKER.
- QA's morning "Testing status" post (`Test Status – Highest case: 20% on STG · Remaining: 11 cards`) can be quoted on the PROGRESS CHANGED feature header line when a release gate is near.

### Step 2.5: Check the calendar (do this BEFORE building the report)

Use `mcp__claude_ai_Google_Calendar__list_events` for today (`startTime`/`endTime` in +07:00, `timeZone: Asia/Ho_Chi_Minh`). Capture each event's `summary`, `start`, `end`, duration.

- **Count** as meetings: AI DSU (count as **45m** — it runs 08:45–09:30 even though the calendar block shows 30m), Payment grooming/sprint review/release meetings, demos, technical alignment, interviews, retros. Do NOT count the Payment daily meeting — Vinh doesn't attend it (as of Jul 2026).
- **Skip** (never count): Deep work / "nín time", all-day reminders, declined events, after-hours social.
- Sum the counted meetings → this is the meeting load. `dev_hours = 8h − meeting_load`. The PLAN ETAs must sum to `dev_hours`, and the PLAN total line must show meetings explicitly (see formatting rules). This makes the day visibly add up to 8h and keeps the report consistent with the Jira worklog step.

### Step 3: Build the report

The report has **4 sections**: DONE, PROGRESS CHANGED, PLAN FOR TODAY, BLOCKER.

**DONE section** — only tickets in terminal/passing states:
- Include tickets with status: `QA Success`, `BA Success`, `Done`, `Released`
- Match commits from yesterday (or last week if Monday) to their Jira tickets
- **Don't let commit count set the hour split.** CID v2's UI is mostly built (as of late Sep 2026); its daily work is small QA polish and API wiring — cap it around **≤3h** unless a genuinely large feature merged that day. PTC 2.0 connector work (Sheets, Loom, Notion, workout templates, AG-UI) is the main daily focus and usually leaves **no commits** — give it **≈3h+** from Step 1.5 evidence. Vinh has corrected this twice ("most of UI already implement, why do every day?"); default the split toward PTC without being told.
- Always show the actual Jira status as a backtick tag (e.g., `QA Success`, `BA Success`)
- Use non-technical language — describe what was done, not how
- Every ticket line ends with its PR link(s) (see formatting rules) — the description stays non-technical, the PR link carries the technical evidence

**PROGRESS CHANGED section** — tickets with active progress but not fully done:
- Include tickets with status: `In Progress`, `In Review`, `QA Ready`
- For In Progress tickets: show ETA as `ETA - DD Mon` (e.g., `ETA - 11 May`)
- For QA Ready tickets: show status tag `QA Ready`
- For In Review tickets: show status tag `In Review`
- Do NOT use percentage ranges (0% → 80%) — use date-based ETA instead

**PLAN section:**
- Check In Progress / To Do tickets for today's plan
- Include any user-provided notes from $ARGUMENTS
- Add `:loading:` for in-progress items

**Date rules:**
- If Monday: header = `DONE LAST WEEK`, date = today's date
- If other day: header = `DONE YESTERDAY`, date = today's date

**Team mapping:**
| Repo / Jira Project | Team | Emoji | Feature examples |
|---|---|---|---|
| bi-dashboard (+ `bi-dashboard-wt-*`) / AIT | AI Team | :ai: | Check-in Dashboard v2 (epic AIT-5315) — polish, to-do lifecycle, onboarding |
| everfit-react (`everfit-react-ptc`, `-wt-*`, `-agui`) / AIT | AI Team | :ai: | CID v2 parent host, Olly connector cards, AG-UI OllyModal spike |
| ai-olly-action (+ `-agui`) / AIT | AI Team | :ai: | Program Copilot — PTC 2.0 connectors (epic AIT-4886): Sheets, Loom, Notion, Gmail; AG-UI spike |
| foundry (+ `foundry-wt-*`) / AIT | AI Team | :ai: | Temporal workers: program-copilot-ptc, olly-connectors, olly-connectors-planner |
| everfit-ai-api / AIT | AI Team | :ai: | AI Coach Dashboard (API side) |
| everfit-react-booking / PAY | Booking Team | :calendar: | **Off since Jul 2026** — skip unless Vinh names it |
| PAY (review only) | Payment Team | :credit_card: | Review code (worklog → AIT-710 since 4 Aug 2026, see memory) |

### Step 4: Preview — send to user's DM first

Send the formatted report to user's Slack DM (user_id: `U0A0ANCKWQJ`) using `slack_send_message`.

Then ask:
> Sent preview to your DM. Check the format and let me know if you want to adjust anything.
> When ready, tell me which Slack channel to send it to.

### Step 5: Send to channel or thread (only after user approval)

Once the user approves and provides a destination:

**If user provides a Slack URL (thread link):**
- Parse `channel_id` and `thread_ts` from the URL
- URL format: `https://everfitt.slack.com/archives/{channel_id}/p{ts_no_dot}?thread_ts={parent_ts}`
- Use `slack_send_message` with both `channel_id` and `thread_ts` to reply in-thread

**If user provides a channel name:**
1. Use `slack_search_channels` to find the channel ID
2. Use `slack_send_message` to post to that channel

Always return the message link so the user can verify.

**IMPORTANT:** Do NOT send to any channel/thread until the user explicitly approves. Always send to user's DM first.

---

## Slack Message Format

Use **standard markdown** (NOT Slack mrkdwn, NOT code blocks). The Slack MCP tool converts standard markdown — using `*bold*` (Slack mrkdwn) renders as italic. The message must have 3 visual levels of indentation using 4 spaces per level.

### Indentation levels

| Level | Indent | Bullet | Content | Style |
|---|---|---|---|---|
| 1 | 0 spaces | `•` | Section header | `*bold*` |
| 2 | 4 spaces | `•` | Team + Feature | emoji + `*bold*` |
| 3 | 8 spaces | `◦` | Task | Jira link + description + PR link(s) |

### Template (copy this exact structure)

```
**DAILY REPORT — {{DD Mon YYYY}}**
**Name: Vinh Tran -- Vim**
**Platform: FE**
------------------------------------------
• **DONE YESTERDAY**
    • :ai: **AI Coach Dashboard**
        ◦ <https://everfit.atlassian.net/browse/AIT-4038|AIT-4038> Notify coach with deep-link when clients are resumed — `QA READY` · Spent `1h30m` · <https://github.com/Everfit-io/bi-dashboard/pull/712/commits/a1b2c3d4|a1b2c3d4>
        ◦ <https://everfit.atlassian.net/browse/AIT-4107|AIT-4107> Display notification when a client is resumed — `QA Success` · deployed · Spent `30m` · <https://github.com/Everfit-io/bi-dashboard/pull/715/commits/e4f5a6b7|e4f5a6b7> (+2)
    • :credit_card: **Payment Team**
        ◦ Just `Review code` · Spent `1h`
    • _Total spent: `8h`_
• **PROGRESS CHANGED**
    ◦ None
• **PLAN FOR TODAY** — _Current week focus: Jun 25 Launch_
    • :ai: **Check-in Dashboard** (<https://everfit.atlassian.net/browse/AIT-4104|AIT-4104> Core Flow · <https://everfit.atlassian.net/browse/AIT-3956|AIT-3956> AI Integration)
        ◦ <https://everfit.atlassian.net/browse/AIT-4196|AIT-4196> Update UI for the period a Client is paused — ETA `2h` :loading:
        ◦ <https://everfit.atlassian.net/browse/AIT-4106|AIT-4106> Fix Inbox popup overlapping Inbox button — ETA `45m`
        ◦ Fix bugs from QA — ETA `45m`
    • :credit_card: **Payment Team**
        ◦ Just `Review code` — ETA `30m`
    • _Total ETA: `4h` + meetings `4h` (AI DSU, Payment daily, Payment Backlog Grooming) = `8h`_
• **BLOCKER / QUESTIONS / ETC**
    ◦ None
```

### Formatting rules

- Date format: `DD Mon YYYY` (e.g., `03 Apr 2026`)
- If Monday: use `DONE LAST WEEK` instead of `DONE YESTERDAY`
- Headers, Team + Feature names: **bold** with `**...**` (standard markdown, NOT `*...*` which renders as italic)
- Jira tickets: clickable links `<https://everfit.atlassian.net/browse/AIT-3046|AIT-3046>`
- Linear tickets: clickable links `<https://linear.app/everfit/issue/AIP-760|AIP-760>` — same inline style; several AIP keys fixed in one PR share one line separated by ` / `
- Status tags: code highlight with backticks — use the **exact Jira status** (e.g., `QA Success`, `BA Success`, `QA READY`, `In Review`, `In Progress`)
- **DONE tasks** show status + **`Spent <time>`** (hours actually worked that day) — NO ETA. Line: `<link> Desc — \`Status\` · Spent \`1h30m\``
  - The DONE day's Spent times + meetings = the actual hours worked (may exceed 8h; confirm the day total with the user)
- **PLAN tasks** show **`ETA <hours>`** = honest estimated hours for today (NOT a calendar date). Line: `<link> Desc — ETA \`2h\` :loading:`
  - PLAN ETAs + today's meetings must sum to **8h**
  - **Estimate honestly — never inflate a ticket's hours to reach 8h.** If honest estimates fall short, pull in another real To Do/Q&A ticket (prefer one related to the day's theme). Give "Fix bugs from QA" a generous block (~2h), not a token amount.
  - No-ticket work is allowed (e.g. release handling, cross-team coordination) — tag it (e.g. `AI To Do`) and give it an ETA.
- **Section totals (required).** Each section ends with an italic total line so the day visibly adds up:
  - DONE → `_Total spent: \`8h\`_`. **A normal working day is 8h — do NOT inflate. Default the DONE total to 8h** (per Vinh: "yesterday just 8h"). On Monday, DONE LAST WEEK still summarizes to ~8h unless Vinh says otherwise; allocate per-task spent so they sum to the total.
  - PLAN → `_Total ETA: \`<dev>\` + meetings \`<meeting_load>\` (<meeting names>) = \`8h\`_`. The dev ETAs + the meeting load MUST equal 8h. Pull the meeting load and names from Step 2.5 (the calendar).
- **Inline commit link (required — managers need the code evidence).** Every ticket in **DONE** and every `In Progress`/`In Review` ticket in **PROGRESS CHANGED** ends with its code link(s) from the Step 1 commit map, appended after the Spent/ETA part with ` · `. The **label is just the short commit hash** — no PR number in the text — but the URL still opens that commit **inside its PR** so the reviewer keeps PR context:
  - Link format: `<https://github.com/Everfit-io/<repo>/pull/<N>/commits/<sha>|<short-sha>>` — e.g. `<https://github.com/Everfit-io/bi-dashboard/pull/800/commits/126de7f2|126de7f2>`
  - One link per commit the ticket owns, max 2 per ticket, space-separated; more → append `(+N)`: `<...|126de7f2> <...|fdcd9946> (+3)`
  - A PR often mixes several tickets' commits — that's why each ticket links its own SHAs, never the bare PR front page
  - Pushed but no PR yet: link the plain commit page `<https://github.com/Everfit-io/<repo>/commit/<sha>|<short-sha>>`
  - No pushed code that day (investigation, design, QA support): append nothing — the ticket line stays clean
  - Meetings and `Just Review code` lines never get a code link
  - **Solution design:** if the ticket has an SDD link (from Step 2), append it after the code links as `· <sdd-url|SDD>` — same inline style, label always `SDD`
  - Example: `◦ <jira-link|AIT-4693> Integrate Booking & Scheduling API — \`In Progress\` ETA - EOD · <https://github.com/Everfit-io/bi-dashboard/pull/791/commits/6fda7eb5|6fda7eb5> <https://github.com/Everfit-io/bi-dashboard/pull/794/commits/7c8ad61c|7c8ad61c> · <https://internal-docs.everfit.io/docs/ai-coach-dashboard/solution-design-booking-aggregation-via-bi-api-check-in-dashboard-v1|SDD>`
- **Mark deployed tickets.** If a `QA Success` ticket has already shipped, append ` · deployed` after the status tag (e.g. `QA Success` · deployed).
- **`Current week focus` header.** When there's an active launch/sprint, append `— _Current week focus: <Launch name>_` to the PLAN section header, and put the launch epic links in each feature-line header (e.g. `**Check-in Dashboard** (<AIT-4104> Core Flow · <AIT-3956> AI Integration)`).
- **AI release vs Payment release.** Release handling Vinh did goes under the team it belongs to — AI release → `:ai:` section, not Payment. Confirm which release with Vinh if ambiguous.
- In-progress tasks in PLAN section: append `:loading:` emoji
- Simple tasks (no sub-items): use `Just` prefix (e.g., Just `Review code`)
- Team emojis: `:ai:` AI Team, `:credit_card:` Payment Team, `:calendar:` Booking Team
- Combine team + feature into one line (e.g., `**Booking — Video Call Link**`)
- Keep task descriptions concise — one line per task, non-technical language
- Bullet characters: `•` for level 1-2, `◦` for level 3
- Indentation: exactly 4 spaces per level (Slack collapses larger gaps)
- Do NOT use code blocks — use standard markdown only
- **Signature: end every message with `*Sent using* @Kurōvim`** (plain text — no real mention). Never type `@Kurōdo`: Slack already auto-appends its own server-side footer `Sent using @Kurōdo` (the app bot's display name, changeable only in Slack app settings), so typing that name duplicates it. Kurōvim is Vinh's chosen signature and is accepted alongside the auto-footer.

### Section placement rules

| Jira Status | Section |
|---|---|
| `QA READY`, `QA Success`, `BA Success`, `Done`, `Released` | DONE |
| `In Progress`, `In Review` | PROGRESS CHANGED |
| `To Do` (starting today) | PLAN FOR TODAY |
| `To Do` (blocked / not started) | omit or BLOCKER |

> **QA READY → DONE**, not PROGRESS CHANGED — once dev work is done and it's handed to QA, it counts as done for the day.
>
> **Linear statuses map the same way:** `QA Ready` / `Done` → DONE · `In Progress` / `In Review` → PROGRESS CHANGED · `Todo` (mine, starting today) → PLAN · `QA Failed` → PLAN as a re-fix with ETA.

---

## Jira Worklog Log (time spent per ticket)

After the Slack report is sent, log **time spent on each ticket** in Jira — every ticket in the report (and every meeting) must have its hours booked so the day totals **8h**. This mirrors the `log-work` flow: **Calendar → Plan → Approve → Log**.

**Default target dates:** yesterday (the report's DONE day) **and** today. Confirm scope with the user.

### Step A: Gather time context

1. **Calendar** — `mcp__claude_ai_Google_Calendar__list_events` for the target date (`startTime`/`endTime` in +07:00; do NOT pass `single_events` — that param is rejected). Capture each event's `summary`, `start`, `end`, duration, and your own `responseStatus`.
2. **Existing worklogs** — fetch the candidate tickets with the `worklog` field and filter `.fields.worklog.worklogs[]` where `author.emailAddress == vinhtran@everfit.io` AND `started` falls on the target date. Skip anything already logged (avoid duplicates).
3. **Git + Jira** — reuse the commits and assigned tickets already gathered in Steps 1–2 of the report.

> JQL/issue results are often too large for one response — they get saved to a file. Use `jq` on the saved file to extract `key | status | timespent | worklog` instead of re-reading the whole thing.

### Step B: Map to worklog tickets

**General / meeting tickets** (per Vinh's worklog conventions — these override generic defaults):

| Work type | Log to |
|---|---|
| AI DSU / AI standup / AI discussions / AI Weekly / AI release meetings | `AIT-710` |
| Payment-team meetings (Sprint Review & Planning, Release meeting, Technical Discussion) | `PAY-2203` |
| **Support review code (every weekday, 30m)** | `PAY-2203` |
| Interviews, retros, intros, social events (Happy Hour, AI Hour) | `PAY-2203` |

> ⛔ **NEVER log to `PAY-1466`** — despite the PAY key, it is the **Web Core Booking Team's** general card ("Booking feature preparation"); anything logged there rolls up under Booking. Vinh is off Booking work since Jul 2026. Also: **Vinh does not attend the Payment daily meeting — never log it**, even if it appears on the calendar.

**Feature tickets** — log dev time directly on the AIT-/PAY- ticket worked that day (extract key from commit messages / branch name).

**Linear cards (AIP-nnn)** have no Jira worklog. Log their time on the **parent Jira epic / story** the feature belongs to — CID v2 QA bugs → `AIT-5315` (or the specific AIT story if the bug is clearly inside one), Program Copilot / PTC bugs → `AIT-4886` — and list the AIP keys in the comment, e.g. `DEV - CID v2 QA 5 Oct: AIP-760/761/762/763 brief count, View all count, detail status, brief UI`.

**Skip (never log):** Deep work blocks ("nín time"), all-day reminders, after-hours social/dine-out events, "Recheck Security", declined events.

### Step C: Build the worklog plan

1. Map each attended meeting → general ticket; duration = event length.
2. Always add **`PAY-2203` 30m `DEV - Support review code`** for every weekday.
3. Add **`AIT-710` 45m `DEV - AI DSU`** for every weekday — the DSU actually runs 08:45–09:30 (45m), even though the calendar block shows only 30m. Exception: no DSU on days AI Weekly replaces it (Wednesdays).
4. `dev_hours_remaining = 8h − meetings − 30m review` (floor 0); assign to the day's feature ticket(s), weighted by commit count. Round to 15-min increments.
5. Comment format: **`DEV - <concise, non-technical description>`**.

Present the plan as a table (Time | Ticket | Status | Comment) with day total, and **wait for approval** before logging.

### Step D: Execute worklogs

For each approved row, call `mcp__claude_ai_Atlassian__addWorklogToJiraIssue`:
- `cloudId`: `everfit.atlassian.net`
- `issueIdOrKey`: ticket key
- `timeSpent`: e.g. `"30m"`, `"1h"`, `"5h 45m"`
- `started`: `YYYY-MM-DDT00:00:00.000+0700` (midnight of the target date)
- `commentBody`: `DEV - <description>` (use `contentFormat: "markdown"`)

Collect each returned `worklog.id`. If a call fails, **stop and report** — do not continue blindly. Warn before logging to `Done`/`Closed` tickets (some projects block it).

### Step E: Confirm coverage

Re-fetch affected tickets and report per-ticket `timespent` + day total. Each day must total **8h** — flag ⚠ if under/over. Repeat A–E for the next target date (today).

---

## HRM Workload Log

After logging Jira worklogs, log the workload plan on the HRM system.

### Step 6: Log today's workload on HRM

1. **Navigate** to `https://hr.everfit.vn/dashboard` using Playwright MCP browser tools
2. **Login** — click "Continue with Google" (auto-authenticates with vinhtran@everfit.io)
3. **Go to Workload Logs** — click "Today's Workload" → "Plan your day" or navigate to `/workload-logs`
4. **Select the correct date** — use the date navigation arrows or week overview buttons
5. **Add entries** using Recent Tasks shortcuts or "+ Add Workload" button

### Step 7: Log tomorrow's workload on HRM

Repeat the same process for the next working day.

### HRM Task Mapping

Map the daily report teams/features to HRM task codes:

| Daily Report Team + Feature | HRM Task Code | Typical Hours |
|---|---|---|
| :ai: AI Coach Dashboard | `[AI-207] Data Dashboard\| Financial Dashboard` | 7h |
| :ai: AI Consolidate | `[AI-207] Data Dashboard\| Financial Dashboard` | (included in AI-207) |
| :calendar: Booking — Video Call Link | `[PMT-97] CORE \| Booking \| P1.4 Video call link` | 1h |
| :credit_card: Payment Team (review) | `[PMT-60] PAY \| Booking \| Session Credits P1` | 1h |
| :credit_card: Payment Team (MacroSnap) | `[PMT-34] PAY \| MacroSnap Payment \| P1 Self-Serve Coach Subscriptions` | 1h |

### HRM Note Format

For each entry, write a plain-text note (max 500 chars) as a **list** with `- ` prefix. One task per line. Never write notes as a paragraph.

**AI entry example:**
```
- Daily Meeting
- AIT-3046 Continue AI Coach Dashboard UI - NotePanel positioning, habit signal updates
- AIT-3047 Continue API integration - update task-habit response mapper
- Support Automation Test for AI Coach Dashboard and AI consolidate
- Update feedback from BA and Designer for new UI/API
```

**Booking entry example:**
```
- PAY-1851 Update UI Video Call Link on Session Type to latest design
- PAY-1852 Update UI Video Call Link in Book Session flow to latest design
```

**Payment review entry example:**
```
- Review code for Payment team
```

### Backfill HRM from Slack (when logging past days)

When logging HRM for days that were missed:
1. Read the Slack daily report channel thread for each missing day
2. Use "DONE YESTERDAY" from the NEXT day's report as the source of truth for what was actually done
3. Extract Jira ticket numbers and descriptions from the report
4. Map to HRM tasks using the task mapping table above
5. Default split: AI-207 (7h) + 1h other (PMT-97 for booking work, PMT-60 for review code)
6. If no specific booking work that day, use PMT-60 (review code) for the 1h slot

### HRM Interaction Steps (Playwright)

1. `browser_navigate` to `https://hr.everfit.vn/dashboard`
2. `browser_click` "Continue with Google" button (if on login page)
3. Wait for redirect to `/dashboard`
4. `browser_click` "Today's Workload" link → goes to `/workload-logs`
5. Navigate to target date using arrow buttons or week day buttons
6. Click a Recent Task button (e.g., `[AI-207] Data Dashboard| Fi...`) to add entry
7. Use `browser_fill_form` to set Hours and Note fields
8. Click another Recent Task to add second entry
9. Use `browser_fill_form` for second entry's Hours and Note
10. `browser_click` "Save" button
11. Verify "Workload plan saved successfully" toast message
12. Repeat steps 5-11 for the next day

### Total Hours Target

Each day should total **8.00 hours**. Typical split:
- AI Team work: 7h
- Booking / Payment: 1h
