Generate and send a daily standup report to Slack.

Input: $ARGUMENTS (optional: notes about what you did/plan to do, or a Slack channel name to send to)

## Instructions

This is a 7-step flow: **Gather Git → Gather Jira → Build Report → Preview to DM → Send to channel → Log HRM Workload (today + tomorrow)**

### Step 1: Gather Git context

Check recent commits across all relevant repos to understand what was done:

```bash
# AI Coach Dashboard UI (bi-dashboard)
git -C ~/vim/bi-dashboard log --author="$(git config user.name)" --since="3 days ago" --format="%h %s (%ad)" --date=short

# AI Coach Dashboard API (everfit-ai-api)
git -C ~/vim/be/everfit-ai-api log --author="$(git config user.name)" --since="3 days ago" --format="%h %s (%ad)" --date=short

# Booking (everfit-react-booking)
git -C ~/vim/everfit-react-booking log --author="$(git config user.name)" --since="3 days ago" --format="%h %s (%ad)" --date=short
```

Also check current branches and uncommitted work:
```bash
git -C ~/vim/bi-dashboard status --short && git -C ~/vim/bi-dashboard branch --show-current
git -C ~/vim/be/everfit-ai-api status --short && git -C ~/vim/be/everfit-ai-api branch --show-current
```

### Step 2: Gather Jira tickets

Search for assigned tickets using Atlassian MCP tools:

**AI Team tickets (project AIT):**
```
JQL: assignee = currentUser() AND project = AIT AND status IN ("In Progress", "In Review", "To Do", "QA READY") ORDER BY updated DESC
```

**Payment & Booking tickets (project PAY):**
```
JQL: assignee = currentUser() AND project = PAY AND status IN ("In Progress", "In Review", "To Do") ORDER BY updated DESC
```

**Coach Dashboard specific:**
```
JQL: assignee = currentUser() AND text ~ "coach dashboard" AND updated >= -7d ORDER BY updated DESC
```

**Booking Video Call Link specific:**
```
JQL: assignee = currentUser() AND text ~ "video call" AND status IN ("In Progress", "To Do") ORDER BY updated DESC
```

Use `getJiraIssue` to get details for specific tickets if needed. Extract:
- Ticket ID (e.g., AIT-3046, PAY-1851)
- Summary (use as task description — keep it non-technical)
- Status (In Progress, QA Ready, To Do, etc.)

### Step 3: Build the report

Map git commits + Jira tickets to the report sections:

**DONE section:**
- Match commits from yesterday (or last week if Monday) to their Jira tickets
- Group by team + feature
- Use non-technical language — describe what was done, not how

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
| bi-dashboard / AIT | AI Team | :ai: | AI Coach Dashboard, AI Consolidate |
| everfit-ai-api / AIT | AI Team | :ai: | AI Coach Dashboard (API side) |
| everfit-react-booking / PAY | Booking Team | :calendar: | Video Call Link, Session Credits |
| PAY (review only) | Payment Team | :credit_card: | Review code |

### Step 4: Preview — send to user's DM first

Send the formatted report to user's Slack DM (user_id: `U0A0ANCKWQJ`) using `slack_send_message`.

Then ask:
> Sent preview to your DM. Check the format and let me know if you want to adjust anything.
> When ready, tell me which Slack channel to send it to.

### Step 5: Send to channel (only after user approval)

Once the user approves and provides a channel:
1. Use `slack_search_channels` to find the channel ID
2. Use `slack_send_message` to post the report to that channel
3. Return the message link to the user so they can verify

**IMPORTANT:** Do NOT send to any channel until the user explicitly approves. Always send to user's DM first.

---

## Slack Message Format

Use Slack mrkdwn (NOT code blocks). The message must have 3 visual levels of indentation using 4 spaces per level.

### Indentation levels

| Level | Indent | Bullet | Content | Style |
|---|---|---|---|---|
| 1 | 0 spaces | `•` | Section header | `*bold*` |
| 2 | 4 spaces | `•` | Team + Feature | emoji + `*bold*` |
| 3 | 8 spaces | `◦` | Task | Jira link + description |

### Template (copy this exact structure)

```
*DAILY REPORT — {{DD Mon YYYY}}*
*Name: Vinh Tran -- Vim*
*Platform: FE*
*------------------------------------------*
• *DONE YESTERDAY* 
    • :ai: *AI Coach Dashboard*
        ◦ <https://everfit.atlassian.net/browse/AIT-3046|AIT-3046> Update UI — restructure components, fix form status, update badge colors
        ◦ <https://everfit.atlassian.net/browse/AIT-3047|AIT-3047> Update API — add compound indexes, improve form review logic
    • :ai: *AI Consolidate*
        ◦ <https://everfit.atlassian.net/browse/AIT-3081|AIT-3081> AI Consolidate with AI Coach Dashboard — `QA Ready`
    • :credit_card: *Payment Team*
        ◦ Just `Review code`
    • :calendar: *Booking — Video Call Link*
        ◦ <https://everfit.atlassian.net/browse/PAY-1851|PAY-1851> Waiting for API ready — US3.1 Video Call Link on Session Type
        ◦ <https://everfit.atlassian.net/browse/PAY-1852|PAY-1852> Waiting for API ready — US10.1 Video Call Link in Book Session flow
• *PLAN FOR TODAY* 
    • :ai: *AI Coach Dashboard*
        ◦ <https://everfit.atlassian.net/browse/AIT-3046|AIT-3046> Discussion with BA and Designer for new UI :loading:
        ◦ <https://everfit.atlassian.net/browse/AIT-3047|AIT-3047> Discussion with BA and Designer for new API :loading:
    • :ai: *AI Consolidate*
        ◦ Update if have any feedback from team and L/J :loading:
    • :credit_card: *Payment Team*
        ◦ Just `Review code`
    • :calendar: *Booking — Video Call Link*
        ◦ <https://everfit.atlassian.net/browse/PAY-1851|PAY-1851> Update UI to latest design :loading:
        ◦ <https://everfit.atlassian.net/browse/PAY-1852|PAY-1852> Update UI to latest design :loading:
• *BLOCKER / QUESTIONS / ETC*
    ◦ None
```

### Formatting rules

- Date format: `DD Mon YYYY` (e.g., `03 Apr 2026`)
- If Monday: use `DONE LAST WEEK` instead of `DONE YESTERDAY`
- Team + Feature names: **bold** with `*...*`
- Jira tickets: clickable links `<https://everfit.atlassian.net/browse/AIT-3046|AIT-3046>`
- Status tags: code highlight with backticks (e.g., `QA Ready`, `Review code`)
- In-progress tasks: append `:loading:` emoji
- Simple tasks (no sub-items): use `Just` prefix (e.g., Just `Review code`)
- Team emojis: `:ai:` AI Team, `:credit_card:` Payment Team, `:calendar:` Booking Team
- Combine team + feature into one line (e.g., `*Booking — Video Call Link*`)
- Keep task descriptions concise — one line per task, non-technical language
- Bullet characters: `•` for level 1-2, `◦` for level 3
- Indentation: exactly 4 spaces per level (Slack collapses larger gaps)
- Do NOT use code blocks — use Slack mrkdwn only

---

## HRM Workload Log (Step 6 & 7)

After sending the Slack report, log the workload plan on the HRM system.

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

For each entry, write a plain-text note (max 500 chars) listing the tasks:

**AI entry example:**
```
Daily Meeting
AIT-3046 Continue AI Coach Dashboard UI - NotePanel positioning, habit signal updates
AIT-3047 Continue API integration - update task-habit response mapper
Support Automation Test for AI Coach Dashboard and AI consolidate
Update feedback from BA and Designer for new UI/API
```

**Booking entry example:**
```
PAY-1851 Update UI Video Call Link on Session Type to latest design
PAY-1852 Update UI Video Call Link in Book Session flow to latest design
```

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
