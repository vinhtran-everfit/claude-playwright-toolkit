Read a Jira ticket and create a structured implementation plan before writing code.

Input: $ARGUMENTS
Expected format: `<TICKET-KEY> [confluence-url] [extra context]`

- `TICKET-KEY` — Jira ticket key (e.g., AIT-3300, PAY-1851)
- `confluence-url` (optional) — Confluence page URL with detailed spec/user story
- Extra context (optional) — any additional notes from the user

## Output contract

Produce these artifacts, in order:

1. **Spec doc** → `docs/stories/<TICKET-KEY>-<feature-slug>-spec.md`
2. **Implementation plan** → `docs/stories/<TICKET-KEY>-<feature-slug>-plan.md`
3. **BE integration guide** (if provided) → `docs/api-integration/<feature-slug>-<TICKET-KEY>.md`

Then **stop and wait for review** — do not start editing code until the user explicitly approves.

---

## Step 1: Fetch the Jira ticket

Use `mcp__claude_ai_Atlassian__getJiraIssue` with:
- `cloudId`: `everfit.atlassian.net`
- `issueIdOrKey`: ticket key from $ARGUMENTS

Extract: summary, description, acceptance criteria, linked issues, subtasks, status, assignee, story points, sprint.

If a Confluence URL is provided, also fetch it with `mcp__claude_ai_Atlassian__getConfluencePage` using `contentFormat: "markdown"`.

## Step 2: Explore the codebase

Before planning, understand what exists:
- Grep for keywords, component names, or patterns from the ticket
- Read relevant files (types, slices, services, components) — use line offsets, don't load entire large files
- Identify what's reusable vs what needs new code
- Find placeholder or legacy code the new feature should replace

Stop exploring once you have enough context — don't pre-read speculatively.

## Step 3: Write the spec doc

Path: `docs/stories/<TICKET-KEY>-<feature-slug>-spec.md`

```markdown
# <TICKET-KEY>: <Summary>

**Source:** <Jira link> | <Confluence link if any>
**Status:** <current status>
**Sprint:** <sprint name if any>
**Date:** <today>

## What
<What the ticket asks for — copy key details from Jira description>

## Why
<Motivation or user problem being solved>

## Acceptance Criteria
<Each AC as a Given/When/Then or checklist item>

## Data Contract
<API endpoints, request/response shapes — from BE docs or Jira description>
<If no BE contract available, note "TBD — awaiting BE spec">

## Design
<Figma link or design notes if referenced in ticket>
<Layout, components, visual decisions>

## Out of Scope
<What this ticket does NOT cover>

## Open Questions
<Anything ambiguous that needs clarification>
```

## Step 4: Brainstorm approaches

Consider 2-3 implementation approaches. For each:
- **Name** — short label
- **How it works** — 2-3 sentences
- **Pros** — why it's good
- **Cons** — tradeoffs or risks

Pick the best approach and explain why.

## Step 5: Write the implementation plan

Path: `docs/stories/<TICKET-KEY>-<feature-slug>-plan.md`

```markdown
# Implementation Plan: <TICKET-KEY>

## TL;DR
<One paragraph — what changes at a high level>

## Chosen Approach
<Name and brief rationale>

## Current State
<What's already in the repo (file:line references) that this feature replaces or extends>

## Deliverables

| File | Action | Description |
|------|--------|-------------|
| `src/...` | modify | <what changes> |
| `src/...` | create | <new file purpose> |

### Code sketches
<Types, function signatures, component props — match existing codebase style>

## Sequencing
<Split into small commits, each passing lint/typecheck/tests>

1. `feat(<scope>): <TICKET-KEY> <description>`
2. `feat(<scope>): <TICKET-KEY> <description>`
3. ...

## Risks & Open Questions

**Risks** (will handle):
- ...

**Open questions** (need answers):
- ...

## Test Plan
- Unit: ...
- Integration: ...
- Manual QA: ...

## What I'm NOT Doing
<Out-of-scope items to prevent scope creep>

## Review Checklist
- [ ] Does this match the acceptance criteria?
- [ ] Are there any breaking changes?
- [ ] Is the data contract confirmed with BE?
- [ ] ...
```

## Step 6: Save BE integration guide (if provided)

If the user pasted BE docs or the Jira ticket contains API specs, save verbatim to `docs/api-integration/<feature-slug>-<TICKET-KEY>.md`. Do NOT rewrite — BE team owns that content.

## Step 7: Present for review and STOP

Post a short summary:
- List the saved file paths
- Highlight the chosen approach
- Surface open questions
- Ask for approval before proceeding to implementation

Do NOT start editing source code until the user explicitly says to proceed.
