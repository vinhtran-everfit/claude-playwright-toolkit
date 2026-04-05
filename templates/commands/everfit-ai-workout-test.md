Test the Everfit AI Workout Builder by generating workouts from prompts and verifying panel synchronization.

Target: $ARGUMENTS (optional: specific prompt ID like "P1" or "all", defaults to "all")

## Quick Reference

```
Phase 1: SETUP     — Login, navigate to client, open Training tab
Phase 2: GENERATE  — For each prompt: paste → generate → wait for completion
Phase 3: VERIFY    — Mirror Test: compare Center Panel vs Right Panel exercise-by-exercise
Phase 4: ANALYZE   — Parsing accuracy, structure preservation, unmatched exercises
Phase 5: REPORT    — Generate analytical report with WebP evidence
```

## Context

You are testing the **Everfit AI Workout Builder** on staging. The test checklist is defined in:
`file:///Users/vinhtran/Downloads/WOB-generate%20workout/Sheet1.html`

### Test Data (Staging Environment)
- **Domain:** staging.everfit.io (requires HTTP Basic Auth — use the existing authenticated Chrome session via CDP)
- **Coach Account:** hangtran@everfit.io / P@ss1699
- **Client:** Jessica Potters

### What You're Testing
The AI generates workouts from free-text prompts. After generation:
- The **Center Panel** (Standard Builder) shows the full workout with exercises, sets, reps, rest times
- The **Right Panel** (Workout Arrangement) shows a summarized list of all exercises

### Expected Result
> The Right panel (Rearrangement section) SHOULD show the correct exercise & full exercises same as the center panel

---

## Test Steps (per prompt)

1. **Navigate to Client Training Tab**
   - Go to Jessica Potters → Training tab → Calendar view

2. **Open New Workout**
   - Hover over an empty calendar cell to reveal the "+" button
   - Click the add button → "Find a Workout" dialog opens
   - Click the **"Everfit AI"** button (class: `button.everfit-ai-btn`)

3. **Paste the Prompt**
   - Find the textarea in the AI panel (`.ai-left-panel [contenteditable="true"]` or `textarea`)
   - Clear any existing text and paste the prompt

4. **Generate**
   - Click the **"Generate"** button
   - Wait for AI generation to complete (watch for loading indicators to disappear and "Start Over" button to appear)
   - Generation typically takes 10-30 seconds

5. **Capture Evidence & Compare**
   - Take a screenshot showing both the center panel and right panel
   - Scroll through center panel to capture all exercises
   - Scroll through the Workout Arrangement panel to capture all exercises
   - **Compare:** Are the exercises in the right panel identical to the center panel?

6. **Analyze & Document**
   - Count exercises in both panels
   - Note any missing, extra, or mismatched exercises
   - Check if sections (e.g., "SUPER SETS", "DAY 1", "SESSION 2") are preserved
   - Note any "unmatched exercises" warnings from the AI
   - Check if special instructions (tempo, rest times, "each side") were parsed correctly

7. **Reset for Next Prompt**
   - Click "Start Over" button (class: `button.start-btn`)
   - Confirm in the "Create a new workout" dialog (click "Start Over" again)

---

## Key UI Selectors (Everfit Staging)

| Element | Selector |
|---------|----------|
| Add workout button | `div.add-workout-button` (visible on hover) |
| Everfit AI button | `button.everfit-ai-btn` |
| AI prompt textarea | `.ai-left-panel [contenteditable="true"]` or `textarea` |
| Generate button | `button:has-text("Generate")` |
| Start Over button | `button.start-btn` or `button:has-text("Start Over")` |
| Center panel exercises | `.search-exercise-container .label-exercise-name-display` |
| Right panel | `.workoutBuilder__workoutArrangementContainer` |
| Close button | `button.close-button` |
| AI tab | `div.ai-tab-item:has-text("AI Assistant")` |
| Confirmation modal Start Over | Second `button:has-text("Start Over")` in modal |

---

## Analysis Guidelines

For each prompt, provide analytical observations (not just pass/fail):

1. **Parsing Accuracy:** Did the AI correctly interpret exercise names, sets, reps, rest times?
2. **Structure Preservation:** Were sections (SUPER SETS, DAY labels, SESSION numbers) maintained?
3. **Panel Synchronization:** Does the Workout Arrangement exactly mirror the center builder?
4. **Exercise Matching:** Were exercises matched to the Everfit database? Note any "Create this exercise" or "unmatched" warnings.
5. **Special Cases:** How did the AI handle:
   - Tempo notation (e.g., "2-1-1-1")
   - "each side" / "e/s" instructions
   - Time-based exercises (e.g., "30secs", "45secs each side")
   - Vague prompts (e.g., P8 "Focus on: Hips, Hamstrings...")
   - Multi-day programs (e.g., P10 with DAY 1-7)

---

## Report Format

Save to `Docs/test-report/Report.md` with WebP screenshots.

### Convert Screenshots to WebP
Use `sharp` (Node.js) or `ffmpeg` or `sips`:
```bash
# sharp (preferred)
node -e "require('sharp')('input.png').webp({quality:80}).toFile('output.webp')"
# ffmpeg
ffmpeg -i input.png -quality 80 output.webp
```

### Report Structure
```markdown
# Everfit AI Workout Builder - Test Report

**Date:** [date]
**Environment:** staging.everfit.io
**Client:** Jessica Potters
**Total Prompts:** [count]
**Overall Result:** [X PASS / Y FAIL]

## Executive Summary
[2-3 sentences about overall findings]

## Summary Table
| Case | Category | Exercises | Panel Sync | Special Notes | Result |
|------|----------|-----------|------------|---------------|--------|

## Detailed Findings

### P1 — [Category]
**Prompt:** [first line of prompt]
**Result:** PASS/FAIL
**Analysis:** [2-3 analytical observations]
**Evidence:**
![description](screenshots/P1-comparison.webp)

---
```

## Prompts to Test

P1: Bench Press (Volume) 4 8 2-1-1-1 7–8 / Incline DB / Machine Press... (6 exercises with tempo)
P2: SESSION 2: HINGE & PULL + SESSION 3: HYBRID & CORE (15 exercises, 2 sessions)
P3: MAIN LIFTS + SUPER SETS (6 exercises with supersets)
P4: MAIN LIFTS + SUPER SETS with pauses (6 exercises)
P5: MAIN LIFTS with bands + SUPER SETS (6 exercises)
P6: SPEED EXPRESSION & SEOI SPRINT (martial arts/speed training)
P7: Back + Biceps + Shoulders + Abs (9 exercises, multi-muscle)
P8: Focus on: Hips, Hamstrings, Thoracic spine, Ankles (vague prompt)
P9: Same as P1 (regression/consistency check)
P10: 7-Day full program DAY 1-7 (15+ exercises, complex multi-day)
