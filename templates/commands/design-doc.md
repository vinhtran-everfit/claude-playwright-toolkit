Create a Frontend Technical Design Document (FE TDD) for a new feature, large refactor, or significant change to existing frontend functionality.

Input: $ARGUMENTS
Expected format: `<feature-name or TICKET-KEY> [jira/confluence/figma links] [extra context]`

- `feature-name / TICKET-KEY` — short feature name or Jira ticket key (e.g., AIT-4283)
- Links (optional) — Jira ticket, Confluence spec/PRD, Figma mocks
- Extra context (optional) — any notes from the user

**When to use this command:** new features, large refactors, or changes that touch shared components, routing, state architecture, or API contracts. For small bug fixes, skip the TDD — a PR description is enough.

## Output contract

Produce **one** design doc at `docs/design/<TICKET-KEY-or-slug>-tdd.md`, then **stop and wait for review**. Do not start writing implementation code — the doc must pass review first.

**Review model — defined per team:** each team defines its own reviewer list (who acts as lead/approver, and which specialist reviewers apply). Look for a team convention in `CLAUDE.md` or `docs/design/REVIEWERS.md`; if none exists, ask the user who the reviewers are for their team. Regardless of team, every TDD requires **at least one peer review** (a teammate at the same level, not only the lead) before approval.

The doc has two gated sections:
1. **Section 1 — WHAT** (requirements): reviewed first → go/no-go decision
2. **Section 2 — HOW** (solution design): only fleshed out after a "go"

If the user asks for only Section 1, stop after Section 1.

Rules for filling the template:
- For sections that don't apply, write `N/A — <reason>`. Never silently delete a section.
- Every claim about the current codebase must include a `file:line` or repo link as evidence.
- Don't write implementation code in the doc — only signatures, props/types, and pseudocode where a flow is complex.

## Step 1: Gather context

- If a Jira key is given: fetch it with `mcp__claude_ai_Atlassian__getJiraIssue` (cloudId: `everfit.atlassian.net`). Extract summary, description, ACs, linked issues.
- If a Confluence URL is given: fetch with `mcp__claude_ai_Atlassian__getConfluencePage` (`contentFormat: "markdown"`).
- If Figma links are given, record them for the UI table (fetch design context only if needed to enumerate screens).
- Explore the codebase: grep for related components, routes, stores/slices, services. Identify prior art that the design should reuse. Stop once you have enough — don't pre-read speculatively.

## Step 2: Write the design doc

Path: `docs/design/<TICKET-KEY-or-slug>-tdd.md`

```markdown
# FE TDD: <Feature Title>

**Author(s):** <name>
**Date:** <created date> (created), <updated date> (updated)
**Ticket:** <Jira link> | **PRD/Spec:** <Confluence link or N/A> | **Design:** <Figma link or N/A>
**Status:** Draft | In review | Approved | No-go

## Approvals

<Reviewer list is defined by each team (see team convention). Minimum: one peer reviewer + the team's approver. Add specialist reviewers as the change requires.>

| Reviewer | Role | Review status | Last updated |
|---|---|---|---|
| <peer> | Peer reviewer (required) | Not started | |
| <approver> | Team lead / approver (per team) | Not started | |
| <specialist> | Specialist (a11y / i18n / shared components — if applicable) | Not started | |

## Overview

<~3 sentences: what this is, what problem it solves, what the proposed approach is. A reader should be able to decide from this alone whether the doc concerns them.>

## Problem Statement

| | |
|---|---|
| **Target audience** | <who: trainers, clients, coaches, internal devs — be specific> |
| **Core user need** | <phrased as the user's need: "As a trainer, I need…", not "we want to show…"> |

---

# Section 1: WHAT

## User Journeys (CUJs)

<For each user journey this feature adds or changes, list concrete steps and expectations. These become the acceptance/E2E test cases — make them specific and deterministic (exact page, exact data, exact expected text), not "element shows up".>

**User type:** <e.g., Trainer>

| Goal | Steps | Expectations |
|---|---|---|
| <goal> | 1. <specific action> | <specific, verifiable outcome incl. data shown> |
| | 2. … | … |

## API Contract (calls made by the frontend)

<Enumerate every new or changed call the frontend makes. If the BE contract isn't final, write "TBD — awaiting BE spec" and list it in Open Questions.>

| # | Endpoint | Method | New / Existing | Request/response shape & why it's needed |
|---|---|---|---|---|
| 1 | | | | |

## UI Screens / Components

<One row per new or changed screen/component. i18n and a11y columns are mandatory — a11y support is required for all components.>

| # | Screen / Component | Description of change | Desktop + mobile mocks | i18n required? | a11y support (keyboard nav, ARIA, contrast, screen reader) |
|---|---|---|---|---|---|
| 1 | | | <Figma links> | | |

## Client-Side State & Data Handling

- **New client state:** <store slices / query caches / localStorage-sessionStorage keys added, and why>
- **New user data collected or sent:** <any new PII, analytics events, or tracking — or "None; this feature sends no new user data because …">
- **Persistence & cleanup:** <what survives reload, what is cleared on logout>

## Connection to Existing Work

<Prior art in the codebase this design reuses or replaces, with `file:line` links. State explicitly if a new pattern is being introduced.>

## Other Requirements

<Performance budgets, browser support, feature-flag needs, offline behavior, things that must not break — or N/A.>

## Open Questions

1. <question> — **Answer:** <fill in once resolved>

---

> **STOP — Section 1 review gate.** Get a go/no-go from the team's approver, with at least one peer review, before writing Section 2.
> Reviewers verify: Is this worth doing now? Do requirements match the PRD/ticket? Can it be built with existing patterns? Are the CUJ tests specific enough to catch regressions?

## Section 1 Review Result

| | |
|---|---|
| **Decision** | Go / No-go |
| **Rationale / added constraints** | |

---

# Section 2: HOW

## Existing Status Quo

<How this area of the frontend works today, with `file:line` evidence. What's wrong with it / why it can't support the feature as-is.>

## Solution Overview

<High-level breakdown of the change: component tree, data flow (a sequence or dependency diagram if multiple parts interact), which parts are new vs modified. Keep it a "table of contents" that links to detail sections below. Prefer the simplest design — don't over-engineer.>

### New Third-Party Libraries

<Fill the table, or write "No new third-party libraries are required.">

| # | Library + version | Link | Why needed | License | Bundle-size impact |
|---|---|---|---|---|---|

## Key Design Decisions

<One subsection per decision that has real alternatives (state management approach, component composition, routing, caching strategy…). For each: list alternatives, the chosen one, and a comparison table.>

### Decision 1: <title>

Alternatives considered:
1. <alt 1>
2. <alt 2>

Chosen: **<alt>** because <reasons>.

| Criteria | Alt 1 | Alt 2 |
|---|---|---|
| Consistency with existing codebase | | |
| Complexity / maintainability | | |
| Performance (re-renders, bundle, network) | | |
| Migration / refactor required | | |

## Risks & Mitigations

| Potential risk | Mitigation |
|---|---|
| <security: XSS via user input, auth on routes…> | |
| <reliability: breaking existing flows, edge cases…> | |
| <maintainability: new pattern, dev workflow cost…> | |

## Implementation Detail

<For each changed area, list new/changed components, hooks, services, and store slices with their public API (names, props/params, return types — signatures only, no implementation). Describe error handling at each layer (API error → state → UI). Cover: responsive (desktop + mobile), cross-browser (Chrome + Firefox + Safari), i18n (incl. RTL if applicable), and a11y behavior.>

## Test Plan

- **Unit:** <components/hooks/utils to cover>
- **Integration / E2E:** <which CUJ rows from Section 1 become automated tests>
- **Manual QA:** <what QA verifies, incl. a11y + responsive checks>

## Implementation Plan (Milestones)

<One row per PR or action. Each PR must be small and independently mergeable without breaking main. UI PRs handle responsive + a11y + i18n in the same PR, not as follow-ups. E2E tests land in the PR that introduces the behavior they test.>

| # | PR / action (start with a verb; state what a user can do after merge) | Prereqs | Target date |
|---|---|---|---|
| 1 | | | |

## Feature Flags

<Gate all user-facing changes. Or "N/A — no user-facing change / released atomically because …">

| # | Flag name | What turning it on does | Key stakeholders |
|---|---|---|---|

## Future Work

<Deliberately deferred items. File tickets for anything we definitely want, and link them here.>

---

> **STOP — final review gate.** Get final approval (peer review + team approver) before starting implementation.
> Reviewers verify: is the design understandable, are decisions justified by the comparison data, can it be simplified, are errors handled at every layer, does the milestone breakdown keep main releasable?
```

## Step 3: Fill it in

- Resolve the reviewer list first (team convention file, or ask the user) and fill the Approvals table with real names — always including at least one peer reviewer.
- Fill Section 1 completely from the gathered context. Mark unknowns as Open Questions rather than guessing.
- Fill Section 2 only if the user confirms a "go" (or explicitly asks for the full doc in one pass).
- Keep every table row concrete — no placeholder text left behind except intentional `TBD` entries that also appear in Open Questions.

## Step 4: Present for review and STOP

Post a short summary:
- The saved file path
- The 3-sentence overview
- Open questions that block a go/no-go
- Who needs to review (per the team's reviewer list: peer reviewer + approver + any specialists)

Do NOT start editing source code until the doc is approved.
