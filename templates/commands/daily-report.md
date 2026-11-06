Generate and send a daily standup report to Slack.

Input: $ARGUMENTS (optional: notes about what you did/plan to do, or a Slack channel name to send to)

## Instructions

This flow: **Gather Git → Gather Jira → Check Calendar → Build Report → Preview to DM → Send to channel/thread → Log HRM Workload (today + tomorrow)**

> **Jira worklogs are NOT part of this flow** (Vinh, 5 Nov 2026: "daily report not relates logwork, logwork should be another bot"). The report's `Spent` lines stay — managers read them — but nothing is logged to Jira here. The **Logwork bot** owns that with `/log-work`: it reads the whole month from Jira, finds the days that are missing or short, and plans what to log from the posted reports, calendar and git.

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

**Verify every Linear key before it goes in the report (mandatory, PLAN included).** Call `get_issue` for each AIP key and check `status` and `assignee`. A card that is `Done`/`Canceled`, or assigned to someone else, never appears in DONE or PLAN — no matter what a branch or worktree is named. A worktree like `bi-dashboard-wt-aip800` is NOT evidence the card is open or Vinh's: on 2 Nov 2026 AIP-800 (Done 21 Oct, assignee Viet Mai BE) was put in PLAN from the worktree name alone and the report had to be corrected after posting ("wtf AIP-800 done bro?").

**Reporting Linear work:**
- Several QA bugs fixed in **one PR** go on **one line**: `<AIP-760> / <AIP-761> / <AIP-762> / <AIP-763> QA 5 Oct FE bugs — <what the coach sees fixed> — fixed, merged to release · Spent … · <commit links>`.
- Keep the Jira epic as the feature header (`**Check-in Dashboard v2** (<AIT-5315>)`); Linear lines sit under it next to Jira story lines.
- Open Linear bugs assigned to Vinh go in PLAN with an ETA; ones blocked (e.g. waiting on a Figma frame) go in BLOCKER.
- QA's morning "Testing status" post (`Test Status – Highest case: 20% on STG · Remaining: 11 cards`) can be quoted on the PROGRESS CHANGED feature header line when a release gate is near.

### Step 2.5: Check the calendar (do this BEFORE building the report)

Use `mcp__claude_ai_Google_Calendar__list_events` for today (`startTime`/`endTime` in +07:00, `timeZone: Asia/Ho_Chi_Minh`). Capture each event's `summary`, `start`, `end`, duration.

- **Count** as meetings: AI DSU (count as **45m** — it runs 08:45–09:30 even though the calendar block shows 30m), Payment grooming/sprint review/release meetings, demos, technical alignment, interviews, retros. Do NOT count the Payment daily meeting — Vinh doesn't attend it (as of Jul 2026).
- **Skip** (never count): Deep work / "nín time", all-day reminders, declined events, after-hours social.
- Sum the counted meetings → this is the meeting load. `dev_hours = 8h − meeting_load`. The PLAN ETAs must sum to `dev_hours`, and the PLAN total line must show meetings explicitly (see formatting rules). This makes the day visibly add up to 8h and gives the Logwork bot (`/log-work`) consistent Spent lines to log from later.

### Step 3: Build the report

The report has **4 sections**: DONE, PROGRESS CHANGED, PLAN FOR TODAY, BLOCKER.

**DONE section** — only tickets in terminal/passing states:
- Include tickets with status: `QA Success`, `BA Success`, `Done`, `Released`
- Match commits from the **unreported days only** — yesterday, or on Monday just Friday (+ weekend work, if any). Mon–Thu were already reported in their own daily reports; never re-report them.
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
- If Monday: header = `DONE LAST WEEK` _(Fri DD Mon)_, date = today's date. **DONE covers only the days not yet reported — normally just Friday (plus any weekend work).** Mon–Thu were each covered by their own daily report (Tue's report covers Mon, …, Fri's report covers Thu), so re-listing the whole week double-reports and inflates the total. Vinh, 1 Nov 2026: "last is only friday, because friday is reported by fri."
- If other day: header = `DONE YESTERDAY`, date = today's date
- **Cutoff check (every day, mandatory):** search Slack for Vinh's most recent `DAILY REPORT` in #ai-product-team (`from:<@U0A0ANCKWQJ> "DAILY REPORT"`), read which day its DONE section covered, and report everything *after* that day. After an OOO day or a skipped report the gap is wider than one day — cover it all (e.g. 26 Oct 2026 covered Thu 22 + weekend because Fri 23 was OOO).

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

- The DM is the **exact full report text** (the same text that will be posted): header, Name, Platform, all 4 sections, totals, signature. **Never a shortened summary, intro line or "preview of…" wrapper** (6 Nov 2026: a hand-written summary was DM'd instead of the report).
- Inside vimdevtool: run `vdt report lint --date <report date>` until it says format OK, then `vdt report dm` (sends slack-report.json verbatim, skips when unchanged). Do not call `slack_send_message` yourself for the preview there.

Then ask:
> Sent preview to your DM. Check the format and let me know if you want to adjust anything.
> When ready, tell me which Slack channel to send it to.

### Step 5: Send to channel or thread (only after user approval)

Once the user approves ("send", "sent it", "sent AI report"…):

**Default destination: the right Daily Report thread (no link needed).** The report dated **D** goes in **#ai-product-team (C052Z30TQ13)** as a reply to the parent posted by the *Daily Report* bot (B07HPE83EP2, "Please post your daily report at here…") at **17:30 on the previous work day of D**: Tue–Fri → the day before, **Mon → Friday** (the bot posts no weekend threads). Examples: 03 Nov (Tue) → Mon 02 Nov 17:30 thread `1793615417.298149`; 02 Nov (Mon) → Fri 30 Oct 17:30 thread `1793356217.373009`.
- Find it with `slack_read_channel` on C052Z30TQ13 with `oldest` = previous work day 00:00 +07 and `latest` = D 00:00 +07, and pick the bot's 17:30 parent from that window. **Never reuse the thread of Vinh's last report and never take "the latest thread" blindly**: on 3 Nov 2026 the 03 Nov report was first posted into the 30 Oct thread and had to be deleted by hand (Vinh: "sent failed date target").
- #payment-product-core-and-mp (C09BEGH6HSL) gets a copy only when Vinh asks for it; its thread follows the same date rule.

**Pre-send guard (all must pass, otherwise STOP and ask Vinh, do not post):**
1. The header date `DAILY REPORT — DD Mon YYYY` equals D, and the thread parent's date equals the previous work day of D (convert the parent ts to +07 and compare the day, not just "recent").
2. Vinh has no post in that thread yet (`slack_read_thread`). If he does, ask whether to post a correction instead of a second copy.
3. The numbers add up: the DONE Spent lines (dev + review) plus meetings equal the stated DONE total, and the PLAN ETAs plus meetings equal the stated PLAN total. Recompute them; never send totals that don't match their lines.
4. The text is the exact text Vinh approved in the DM preview (same version), with the `*Sent using* @Kurōvim` signature written as `**Sent using** @Kurōvim` in the markdown so Slack renders it bold, not italic.

After posting, read the thread back, confirm the message is there under the right parent, and return its permalink.

**If user provides a Slack URL (thread link):**
- Parse `channel_id` and `thread_ts` from the URL
- URL format: `https://everfitt.slack.com/archives/{channel_id}/p{ts_no_dot}?thread_ts={parent_ts}`
- Use `slack_send_message` with both `channel_id` and `thread_ts` to reply in-thread
- Still run the pre-send guard: if the link's parent date doesn't match the date rule above, say so and ask before posting.

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
- If Monday: use `DONE LAST WEEK` _(Fri DD Mon)_ instead of `DONE YESTERDAY` — content is Friday (+ weekend) only, see Date rules
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
  - DONE → `_Total spent: \`8h\`_`. **A normal working day is 8h — do NOT inflate. Default the DONE total to 8h** (per Vinh: "yesterday just 8h"). On Monday, DONE LAST WEEK is Friday only, so it is still one 8h day (plus weekend hours only if Vinh actually worked them); allocate per-task spent so they sum to the total. A 40h Monday total is a bug.
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
> **Vinh is FE only — never put BE in his lines.** Vinh does not touch backend. Never write "BE contract questions", "API contract review", "confirmed with BE", or any BE ticket/ownership as his DONE/PLAN/BLOCKER work, even when he posted questions to a BE engineer in Slack. If a BE answer gates FE work, describe the FE side only ("Sessions card parked until the spec is confirmed") and do not name BE deliverables. Vinh's words, 2 Nov 2026: "i need i dont touch BE". Foundry (Temporal workers, BE repo) cards assigned to him — e.g. the Factory L4 handoff AIP-1283–AIP-1291 — stay out of the report too; he dropped them on 2 Nov 2026 ("drop it").
>
> **Linear statuses map the same way:** `QA Ready` / `Done` → DONE · `In Progress` / `In Review` → PROGRESS CHANGED · `Todo` (mine, starting today) → PLAN · `QA Failed` → PLAN as a re-fix with ETA.

---

## Jira worklogs — not here

Jira worklogs moved out of this command on 5 Nov 2026. Do **not** call `addWorklogToJiraIssue` from the daily report flow, and do not offer to. The Logwork bot runs `/log-work` (same toolkit repo, `templates/commands/log-work.md`): it audits the month through the Jira REST API, lists what is missing, and logs only after Vinh approves its plan. If Vinh asks the Report bot to "log work", point him to the Logwork bot.

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
