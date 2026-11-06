Create Jira tickets (epics, stories, tasks, subtasks) from a description or implementation plan.

Input: $ARGUMENTS
Expected format: `<PROJECT-KEY> <description or plan reference>`

Examples:
- `AIT create subtasks for AIT-3300 based on the implementation plan`
- `PAY new story: Video Call Link on Session Type`
- `AIT epic: AI Coach Dashboard v3 with stories for each feature`

## Instructions

### Step 0: Ask for the summary header prefix (MANDATORY)

Before doing anything else, **ask the user** for:
1. The summary header prefix — REQUIRED for every ticket
2. The Figma design link — if applicable (for UI/UX tickets)

**Header format:** `[PLATFORM][Version/Module]`

The header has two parts:
- `[PLATFORM]` — where the work happens: `WEB`, `API`, `AI`, `Mobile`
- `[Version/Module]` — the feature or module name (this is the version label, not a semver)

**Real examples from the project:**
- `[WEB][Ai- dashboard]` — frontend dashboard work
- `[API][Ai- dashboard]` — backend dashboard work
- `[Web][Coach Dashboard]` — frontend coach dashboard
- `[AI][Coach Dashboard]` — AI/ML coach dashboard work
- `[WEB][Booking-video-call]` — booking feature
- `[WEB][Session-credits-P1]` — payment feature

Ask:
> Before I create tickets, I need:
> 1. **Header prefix** — format: `[PLATFORM][Version/Module]` (e.g. `[WEB][Ai- dashboard]`)
> 2. **Figma link** — design URL if applicable (will be linked in each ticket description)

Do NOT proceed until the user provides at least the header prefix. All ticket summaries will be prefixed with this header.

### Step 1: Gather context

Determine what to create based on `$ARGUMENTS`:

**If referencing an existing ticket or plan:**
- Fetch the parent ticket with `mcp__claude_ai_Atlassian__getJiraIssue`
- Read the implementation plan from `docs/stories/` if one exists
- Extract the sequencing/deliverables as subtask candidates

**If creating from scratch:**
- Use the description from $ARGUMENTS
- Ask clarifying questions if the scope is unclear

**Always fetch project metadata first:**
- Use `mcp__claude_ai_Atlassian__getJiraProjectIssueTypesMetadata` to get available issue types
- Use `mcp__claude_ai_Atlassian__getJiraIssueTypeMetaWithFields` to get required fields for the chosen issue type

### Step 2: Draft the tickets

Build a ticket plan table:

```
# Ticket Creation Plan — <PROJECT-KEY>

| # | Type | Parent | Summary | Priority | Labels | Est |
|---|------|--------|---------|----------|--------|-----|
| 1 | Story | — | <summary> | Medium | [...] | 3 |
| 2 | Sub-task | #1 | <summary> | Medium | [...] | 1 |
| ... |
```

For each ticket, draft:
- **Summary** — concise, actionable (e.g., "Add coach note editor component")
- **Description** — acceptance criteria, context, links to spec/plan docs
- **Issue type** — Epic, Story, Task, Sub-task, Bug
- **Priority** — Highest, High, Medium, Low, Lowest
- **Labels** — relevant labels (e.g., `ai-coach`, `booking`, `frontend`)
- **Story points** — estimate if applicable
- **Parent** — link to parent epic/story for subtasks

### Ticket writing guidelines

- **Every summary MUST start with the header prefix** from Step 0
  - Format: `[PLATFORM][Version/Module] Description`
  - Example: `[WEB][Ai- dashboard] Check-in Form – Response's status incorrectly changes to Reviewed when coach clicks Mark as Reviewed`
  - Example: `[API][Ai- dashboard] Training Tab – Workout assigned/completed count incorrect due to timezone conversion issue`
  - Example: `[Web][Coach Dashboard] Update Form (UI & UX behavior)`
  - Example: `[Web][Coach Dashboard] Support URL-based week filtering`
  - Example: `[AI][Coach Dashboard] Implement Dashboard Reset Time - Weekly Board Reset at 8PM UTC Sunday`
- Keep summaries descriptive but concise — no strict char limit, clarity over brevity
- For bugs: describe what's wrong in the summary (e.g., "X incorrectly does Y when Z")
- For tasks: describe what to do (e.g., "Update X", "Implement Y", "Support Z")
- For stories: describe the user story (e.g., "US5. Send message to Client")
- Description MUST include:
  - **Context:** Why this work is needed (1-2 sentences)
  - **Acceptance criteria:** Checklist of what "done" means
  - **Figma link:** If provided in Step 0, include as a clickable link at the top of description
  - **Technical notes:** Key files, dependencies, or constraints (if relevant)
  - **Links:** Related tickets, Confluence pages
- Use Jira wiki markup for description formatting (not markdown):
  - `h3.` for headings
  - `*bold*` for bold
  - `{code}...{code}` for code blocks
  - `* item` for bullet lists
  - `# item` for numbered lists

### Figma link in descriptions

If the user provided a Figma link in Step 0, add it to **every ticket description** at the top:

```
h3. Design
[Figma Design|<figma-url>]

h3. Context
...
```

For tickets that reference specific frames/screens in the Figma, note which frame applies if known.

### Step 3: Preview and get EXPLICIT confirmation (MANDATORY)

Show the ticket plan table to the user. Then ask:
> Here are N tickets to create. **Please confirm before I proceed.**
> - Type `yes` or `confirm` to create all
> - Type `adjust <description>` to modify a ticket
> - Type `remove #X` to skip a ticket

**CRITICAL: NEVER auto-create tickets. ALWAYS wait for explicit user confirmation.**
**Do NOT proceed to Step 4 until the user types "yes", "confirm", "ok", "go", "do it", or similar explicit approval.**
**If the user just says "looks good" without explicitly confirming creation, ask again: "Should I go ahead and create these tickets now?"**

### Step 4: Create the tickets

For each approved ticket, use `mcp__claude_ai_Atlassian__createJiraIssue` with:
- `cloudId`: `everfit.atlassian.net`
- `projectKey`: the project key
- `issueType`: the issue type name
- `summary`: ticket summary
- `description`: ticket description (ADF format)
- Additional fields as needed (priority, labels, parent, story points)

**Creation order matters:**
1. Create parent tickets (Epics, Stories) first
2. Then create child tickets (Sub-tasks) using the parent's key
3. If creating linked tickets, use `mcp__claude_ai_Atlassian__createIssueLink` after both exist

Collect each returned ticket key. If any creation fails, stop and report.

### Step 5: Link related tickets

If tickets should be linked to existing issues:
- Use `mcp__claude_ai_Atlassian__getIssueLinkTypes` to find the right link type
- Use `mcp__claude_ai_Atlassian__createIssueLink` with appropriate link type (e.g., "blocks", "is blocked by", "relates to")

### Step 6: Final report

```
# Tickets Created

| # | Key | Type | Summary | Parent | Link |
|---|-----|------|---------|--------|------|
| 1 | AIT-3301 | Story | ... | — | <url> |
| 2 | AIT-3302 | Sub-task | ... | AIT-3301 | <url> |
| ... |

Total: N tickets created in <PROJECT-KEY>
```

Present each ticket as a clickable Jira link: `https://everfit.atlassian.net/browse/<KEY>`

---

## Templates for common ticket types

### Story from implementation plan
When creating stories from a plan's sequencing section, map each commit step to a subtask:
- Commit 1 → Sub-task 1: "feat(scope): description"
- Commit 2 → Sub-task 2: "feat(scope): description"

### Bug ticket
```
Summary: Fix <what's broken>
Description:
h3. Bug
<What's happening vs what should happen>

h3. Steps to reproduce
# Step 1
# Step 2

h3. Expected behavior
<What should happen>

h3. Environment
<Browser, device, account>
```

### Spike / Research ticket
```
Summary: Spike: <what to investigate>
Description:
h3. Goal
<What question needs answering>

h3. Time-box
<N hours/days>

h3. Output
<Expected deliverable: doc, POC, decision>
```
