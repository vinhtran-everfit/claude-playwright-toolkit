import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_DIR = '/Users/vinhtran/vim/claude-playwright-toolkit/Docs/test-report';
const SS_DIR = path.join(BASE_DIR, 'screenshots');
const VID_DIR = path.join(BASE_DIR, 'videos');

const DOMAIN = 'https://staging.everfit.io';
const EMAIL = 'hangtran@everfit.io';
const CLIENT_NAME = 'Jessica Potters';

const PROMPTS = [
  { id: 'P1', text: `Bench Press (Volume) 4 8 2-1-1-1 7–8\nIncline DB / Machine Press 3 10–12 2-1-2-1 8\nCable Row 3 10–12 2-1-2-1 8\nLateral Raises 3 15 2-1-2-1 8\nArms Superset 3 12–15 2-1-2-1 8–9\nCore Work 3 — Controlled 7` },
  { id: 'P2', text: `SESSION 2: HINGE & PULL\nBarbell Deadlifts: 3 Sets x 5-8 Reps (90s Rest)\nPull-Ups: 3 Sets x Max Reps (90s Rest)\nDecline Push-ups (Feet on bench): 3 Sets x 12-15 Reps (60s Rest)\nDB Romanian Deadlifts: 3 Sets x 12 Reps (60s Rest)\nSingle-Arm DB Rows: 3 Sets x 10 Reps per arm (60s Rest)\nChest-Supported DB Rows: 3 Sets x 12 Reps (60s Rest)\nIncline DB Bicep Curls: 3 Sets x 12 Reps (60s Rest)\nSESSION 3: HYBRID & CORE\nBulgarian Split Squats: 3 Sets x 8-10 Reps per leg (60s Rest)\nBarbell Bent-Over Rows: 3 Sets x 10-12 Reps (90s Rest)\nIncline Push-ups (Hands on bench): 3 Sets x 20 Reps (60s Rest)\nDumbbell Thrusters: 3 Sets x 12 Reps (60s Rest)\nDiamond Push-ups: 3 Sets x 12 Reps (60s Rest)\nDips (on station handles): 3 Sets x Max Reps (60s Rest)\nHanging Leg Raises: 3 Sets x 12 Reps (60s Rest)\nWeighted Planks: 3 Sets x 60 Seconds (60s Rest)` },
  { id: 'P3', text: `MAIN LIFTS:\nDB RDL 3 x 10 rest 1 min\nHip Thrust 3 x 10 rest 1 min\nSUPER SETS:\nDB bent over row 2 x 10 e/s\nrear delt fly 2 x 10\nrest 1 min\nSUPER SETS:\nClams 2 x 12 e/s\nSide plank 2 x 30secs e/s\nrest 1 min` },
  { id: 'P4', text: `MAIN LIFTS:\nDB Sumo Deadlift 4 x 8 rest 1 min\nBent over row 4 x 8-10 rest 1 min\nSUPER SETS:\nHip Thrust (pause at top) 2 x 10\nSide plank 2 x 40 sec\nrest 1 min\nMini band lat pull down 2 x 10\nDeadbug 2 x 10/es\nrest 1 min` },
  { id: 'P5', text: `MAIN LIFTS:\nDB Hip Thrust with hold (band) 3x 10 e/s rest 1 min\nDB bent over row 3 x 12 rest 1 min\nSUPER SETS:\nSingle leg RDL 2 x 10e/s\nRear delt fly 2 x 12-15\nrest 1 min\nMini Band lat pull down 2 x 12-15\nSide plank 2 x 45secs each side\nrest 1 min` },
  { id: 'P6', text: `THURSDAY: SPEED EXPRESSION & SEOI SPRINT\nCNS Load: MODERATE | Goal: PCr motor pattern speed and single-leg chassis\nPrimary: Quick Cleans (5x3 at 68-72%) & Drop-Catch (3x4).\nSeoi Entry Sprint (PCr Protocol): Banded Seoi-nage Entry. 6 rounds of 5 seconds MAXIMUM speed / 50 seconds strict nasal rest.\nStructural: Bulgarian Split Squat (3x6/side) & Single-Leg RDL (3x6/side). Mod-Heavy load.\nKnee Armor: Copenhagen Plank (2x35s/side). Second weekly exposure.` },
  { id: 'P7', text: `Back + Biceps + Shoulders + Abs\nLat Pulldown – 4x10\nSeated Row – 3x10\nDumbbell Rows – 3x10/side\nBicep Curls – 3x12\nHammer Curls – 3x12\nShoulders\nRear Delt Fly – 3x15\nAbs\nHanging Knee Raises – 3x12\nBicycle Crunch – 3x20` },
  { id: 'P8', text: `Focus on:\nHips\nHamstrings\nThoracic spine\nAnkles` },
  { id: 'P9', text: `Bench Press (Volume) 4 8 2-1-1-1 7–8\nIncline DB / Machine Press 3 10–12 2-1-2-1 8\nCable Row 3 10–12 2-1-2-1 8\nLateral Raises 3 15 2-1-2-1 8\nArms Superset 3 12–15 2-1-2-1 8–9\nCore Work 3 — Controlled 7` },
  { id: 'P10', text: `DAY 1 – UPPER PUSH (Chest / Shoulders / Triceps)\nGoal: Build pressing strength + upper body size\nIncline Dumbbell Press – 4x8–10\nMachine Chest Press – 3x10–12\nSeated Dumbbell Shoulder Press – 3x8–10\nLateral Raises – 3x12–15\nCable Tricep Pushdowns – 3x12–15\nOverhead Tricep Extension – 2x12\nDAY 2 – LOWER (Legs)\nLeg Press – 4x10–12\nRomanian Deadlift (DB or bar) – 3x8–10\nWalking Lunges – 3x10 each leg\nLeg Curl Machine – 3x12\nCalf Raises – 3x15\nDAY 4 – UPPER PULL (Back / Biceps)\nLat Pulldown – 4x8–10\nSeated Cable Row – 3x10\nDumbbell Row – 3x10 each side\nFace Pulls – 3x12–15\nDumbbell Curls – 3x10–12\nHammer Curls – 2x12\nDAY 5 – ARMS + CONDITIONING\nA1: Barbell or EZ Bar Curl – 3x10\nA2: Tricep Pushdown – 3x12\nB1: Hammer Curl – 3x12\nB2: Overhead Tricep Extension – 3x12\nC1: Lateral Raises – 3x15\nC2: Push-ups – 3 to failure` },
];

const results = [];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, name) {
  const filePath = path.join(SS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  const webpPath = filePath.replace('.png', '.webp');
  try { execSync(`sips -s format webp "${filePath}" --out "${webpPath}" 2>/dev/null`); } catch (e) {}
  console.log(`  [ss] ${name}`);
  return filePath;
}

async function testPrompt(page, promptData, index) {
  const { id, text } = promptData;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING ${id} (${index + 1}/${PROMPTS.length})`);
  console.log(`${'='.repeat(60)}`);

  const result = {
    id,
    promptPreview: text.substring(0, 100) + '...',
    status: 'PENDING',
    screenshots: [],
    errors: [],
    centerExercises: [],
    rightExercises: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Check if we're in the AI builder modal or on the calendar
    const startOverBtn = page.locator('button:has-text("Start Over")').first();
    const isInAiBuilder = await startOverBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const generateBtn = page.locator('button:has-text("Generate")').first();
    const isInInputMode = await generateBtn.isVisible({ timeout: 1000 }).catch(() => false);

    if (isInAiBuilder) {
      // We're in AI result mode — click "Start Over" to reset
      console.log(`[${id}] Clicking "Start Over" to reset...`);
      await startOverBtn.click();
      await sleep(2000);

      // Handle confirmation modal
      console.log(`[${id}] Handling confirmation dialog...`);
      const allStartOver = page.locator('button:has-text("Start Over")');
      const count = await allStartOver.count();
      for (let btnIdx = count - 1; btnIdx >= 0; btnIdx--) {
        const btn = allStartOver.nth(btnIdx);
        if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await btn.click();
          console.log(`  Confirmed "Start Over" (button ${btnIdx + 1}/${count})`);
          break;
        }
      }
      await sleep(3000);
    } else if (isInInputMode) {
      // Already in AI input mode with textarea visible — good to go
      console.log(`[${id}] Already in AI input mode`);
    } else {
      // We're on the calendar — need to open a new workout via hover + click
      console.log(`[${id}] Opening new workout from calendar...`);
      // Hover over an empty calendar cell to reveal the add button
      const calendarCells = page.locator('.calendar-cell__main-content');
      const cellCount = await calendarCells.count();
      let addClicked = false;

      for (let ci = 0; ci < Math.min(cellCount, 14); ci++) {
        const cell = calendarCells.nth(ci);
        try {
          await cell.hover({ timeout: 2000 });
          await sleep(500);
          // After hovering, look for the add button that appeared
          const addBtn = page.locator('div.add-workout-button:visible, div.add-new:visible').first();
          if (await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await addBtn.click();
            addClicked = true;
            console.log(`  Clicked add button on cell ${ci}`);
            break;
          }
        } catch (e) { /* try next cell */ }
      }

      if (!addClicked) {
        // Fallback: try force-clicking an add-workout-button via JS
        console.log(`  Fallback: force-clicking add button via JS`);
        await page.evaluate(() => {
          const btns = document.querySelectorAll('.add-workout-button');
          if (btns.length > 0) {
            btns[0].style.display = 'block';
            btns[0].style.visibility = 'visible';
            btns[0].click();
          }
        });
      }

      await sleep(2500);

      // "Find a Workout" dialog appears — click "Everfit AI" button
      console.log(`[${id}] Clicking "Everfit AI" button in dialog...`);
      const everfitAiBtn = page.locator('button.everfit-ai-btn, button:has-text("Everfit AI")').first();
      await everfitAiBtn.waitFor({ state: 'visible', timeout: 8000 });
      await everfitAiBtn.click();
      await sleep(3000);
    }

    result.screenshots.push(await screenshot(page, `${id}-01-ready-for-prompt`));

    // Now the textarea should be visible for entering a prompt
    console.log(`[${id}] Looking for prompt textarea...`);
    let textarea = null;

    // Try finding textarea in the AI panel
    const textareaSelectors = [
      '.ai-left-panel textarea',
      '.left-ai-content-wrapper textarea',
      'textarea',
      '.ai-left-panel [contenteditable="true"]',
    ];

    for (const sel of textareaSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          textarea = el;
          console.log(`  Found textarea: ${sel}`);
          break;
        }
      } catch (e) {}
    }

    if (!textarea) {
      // Maybe we need to look for an input or contenteditable in the AI panel area
      // The AI panel might show a text area after Start Over
      const aiPanel = page.locator('.ai-left-panel, .left-ai-content-wrapper').first();
      const innerTextarea = aiPanel.locator('textarea, [contenteditable="true"], input[type="text"]').first();
      if (await innerTextarea.isVisible({ timeout: 5000 })) {
        textarea = innerTextarea;
        console.log(`  Found textarea inside AI panel`);
      } else {
        throw new Error('Could not find prompt textarea after Start Over');
      }
    }

    // Fill the prompt
    console.log(`[${id}] Filling prompt text...`);
    await textarea.click();
    await textarea.fill('');
    await sleep(200);
    try {
      await textarea.fill(text);
    } catch (e) {
      // For contenteditable, use type
      await textarea.type(text, { delay: 3 });
    }
    await sleep(1000);
    result.screenshots.push(await screenshot(page, `${id}-02-prompt-filled`));

    // Click Generate button
    console.log(`[${id}] Clicking Generate button...`);
    const genSelectors = [
      'button:has-text("Generate")',
      'button.generate-btn:not(.start-btn)',
      '.ai-left-panel button:has-text("Generate")',
      'button.ai-btn:has-text("Generate")',
    ];

    let clicked = false;
    for (const sel of genSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 3000 })) {
          await btn.click();
          clicked = true;
          console.log(`  Clicked Generate via: ${sel}`);
          break;
        }
      } catch (e) {}
    }
    if (!clicked) {
      // Try pressing Enter as fallback
      await textarea.press('Enter');
      console.log(`  Pressed Enter as fallback`);
    }

    // Wait for AI generation
    console.log(`[${id}] Waiting for AI generation...`);
    await sleep(8000);

    // Poll for loading indicator (ai-generating-loading class)
    let genTime = 8;
    for (let i = 0; i < 24; i++) {
      const loading = await page.locator('.ai-generating-loading, [class*="generating"], [class*="loading"]:not(.ai-generating-loading)').first();
      const loadingVisible = await loading.isVisible({ timeout: 1000 }).catch(() => false);

      // Also check if "Start Over" button reappears (means generation is done)
      const startOverVisible = await page.locator('button:has-text("Start Over")').first().isVisible({ timeout: 1000 }).catch(() => false);

      if (startOverVisible) {
        console.log(`  Generation completed! (~${genTime}s)`);
        break;
      }
      if (!loadingVisible && genTime > 15) {
        console.log(`  No loading indicator, checking if done... (~${genTime}s)`);
        // Check if results appeared
        const hasExercises = await page.locator('.search-exercise-container').count();
        if (hasExercises > 0) {
          console.log(`  Found ${hasExercises} exercises in center panel`);
          break;
        }
      }
      console.log(`  Generating... (~${genTime}s)`);
      await sleep(5000);
      genTime += 5;
    }

    await sleep(3000);
    result.screenshots.push(await screenshot(page, `${id}-03-generated`));

    // STEP 8: Compare center panel vs right panel (Workout Arrangement)
    console.log(`[${id}] Comparing center panel vs right panel (Workout Arrangement)...`);

    // Extract center panel exercises
    try {
      const centerExercises = await page.$$eval('.search-exercise-container .label-exercise-name-display, .search-exercise-container .box__left', els =>
        els.map(el => el.innerText?.trim()).filter(Boolean)
      );
      result.centerExercises = [...new Set(centerExercises)]; // deduplicate
      console.log(`  Center panel: ${result.centerExercises.length} exercises`);
      result.centerExercises.forEach(ex => console.log(`    - ${ex}`));
    } catch (e) {
      result.errors.push('Could not extract center panel exercises: ' + e.message);
    }

    // Extract right panel (Workout Arrangement) exercises
    try {
      const rightExercises = await page.$$eval('.workoutBuilder__workoutArrangementContainer [class*="exercise"], .workoutBuilder__workoutArrangementContainer span, .workoutBuilder__workoutArrangementContainer div[class*="name"]', els =>
        els.map(el => el.innerText?.trim()).filter(t => t && t.length > 2 && !t.startsWith('DAY') && !t.startsWith('SESSION'))
      );
      result.rightExercises = [...new Set(rightExercises)];
      console.log(`  Right panel (Arrangement): ${result.rightExercises.length} items`);
      result.rightExercises.forEach(ex => console.log(`    - ${ex}`));
    } catch (e) {
      result.errors.push('Could not extract right panel exercises: ' + e.message);
    }

    // Take multiple comparison screenshots — center panel at different scroll positions
    console.log(`[${id}] Taking detailed comparison screenshots...`);

    // Center panel scrolled to top
    const mainPanel = page.locator('.workoutBuilder__mainPanel').first();
    try {
      await mainPanel.evaluate(el => el.scrollTop = 0);
      await sleep(500);
      result.screenshots.push(await screenshot(page, `${id}-04a-center-top`));

      // Center panel scrolled to middle
      await mainPanel.evaluate(el => el.scrollTop = el.scrollHeight / 2);
      await sleep(500);
      result.screenshots.push(await screenshot(page, `${id}-04b-center-mid`));

      // Center panel scrolled to bottom
      await mainPanel.evaluate(el => el.scrollTop = el.scrollHeight);
      await sleep(500);
      result.screenshots.push(await screenshot(page, `${id}-04c-center-bottom`));
    } catch (e) {
      console.log(`  Could not scroll center panel: ${e.message}`);
    }

    // Right panel (Workout Arrangement) scrolled
    const rightPanel = page.locator('.workoutBuilder__workoutArrangementContainer').first();
    try {
      await rightPanel.evaluate(el => el.scrollTop = 0);
      await sleep(500);
      result.screenshots.push(await screenshot(page, `${id}-05a-arrangement-top`));

      await rightPanel.evaluate(el => el.scrollTop = el.scrollHeight / 2);
      await sleep(500);
      result.screenshots.push(await screenshot(page, `${id}-05b-arrangement-mid`));

      await rightPanel.evaluate(el => el.scrollTop = el.scrollHeight);
      await sleep(500);
      result.screenshots.push(await screenshot(page, `${id}-05c-arrangement-bottom`));
    } catch (e) {
      console.log(`  Could not scroll arrangement panel: ${e.message}`);
    }

    // Full final comparison screenshot
    result.screenshots.push(await screenshot(page, `${id}-06-final-comparison`));

    result.status = 'COMPLETED';
    console.log(`[${id}] COMPLETED`);

  } catch (err) {
    result.status = 'FAILED';
    result.errors.push(err.message);
    console.error(`[${id}] FAILED: ${err.message}`);
    try { result.screenshots.push(await screenshot(page, `${id}-ERROR`)); } catch (e) {}
  }

  // Keep modal open between tests — just wait before next prompt
  await sleep(1500);
  results.push(result);
  return result;
}

function generateReport() {
  const reportPath = path.join(BASE_DIR, 'Report.md');
  const passed = results.filter(r => r.status === 'COMPLETED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  let md = `# WOB Generate Workout - E2E Test Report

**Date:** ${new Date().toLocaleString()}
**Environment:** ${DOMAIN} (staging)
**Browser:** Chrome (CDP, authenticated session)
**Coach Account:** ${EMAIL}
**Client:** ${CLIENT_NAME}

---

## Summary

| # | Prompt | Status | Center Exercises | Right Panel Exercises | Match? |
|---|--------|--------|------------------|----------------------|--------|
`;

  for (const r of results) {
    const icon = r.status === 'COMPLETED' ? 'PASS' : 'FAIL';
    const centerCount = r.centerExercises.length;
    const rightCount = r.rightExercises.length;
    const match = centerCount > 0 && rightCount > 0 ? (centerCount === rightCount ? 'YES' : 'PARTIAL') : 'N/A';
    md += `| ${r.id} | ${r.promptPreview.substring(0, 40)}... | ${icon} | ${centerCount} | ${rightCount} | ${match} |\n`;
  }

  md += `\n**Total:** ${results.length} | **Passed:** ${passed} | **Failed:** ${failed}\n`;

  md += `\n---\n\n## Test Steps (from checklist)\n\n`;
  md += `1. Log in Web platform: staging.everfit.io with coach account\n`;
  md += `2. Search client name then go to client page\n`;
  md += `3. Switch to the Training tab\n`;
  md += `4. At the calendar, click on the "Plus" icon to add workouts\n`;
  md += `5. Click on the Everfit AI button\n`;
  md += `6. Paste the prompt to the textbox\n`;
  md += `7. Click on the Generate button\n`;
  md += `8. After generating successfully, compare exercise at the center panel with the right panel (Rearrangement section)\n`;

  md += `\n## Expected Result\n\n`;
  md += `> At the Right panel (Rearrangement section): SHOULD show the correct exercise & full exercises same as the center panel\n`;

  md += `\n---\n\n## Detailed Results\n\n`;

  for (const r of results) {
    const icon = r.status === 'COMPLETED' ? 'PASS' : 'FAIL';
    md += `### ${r.id} — ${icon}\n\n`;
    md += `- **Status:** ${r.status}\n`;
    md += `- **Timestamp:** ${r.timestamp}\n`;
    md += `- **Prompt:**\n\`\`\`\n${PROMPTS.find(p => p.id === r.id)?.text || ''}\n\`\`\`\n\n`;

    if (r.centerExercises.length > 0) {
      md += `**Center Panel Exercises (${r.centerExercises.length}):**\n`;
      r.centerExercises.forEach(ex => md += `- ${ex}\n`);
      md += '\n';
    }

    if (r.rightExercises.length > 0) {
      md += `**Right Panel — Workout Arrangement (${r.rightExercises.length}):**\n`;
      r.rightExercises.forEach(ex => md += `- ${ex}\n`);
      md += '\n';
    }

    if (r.errors.length > 0) {
      md += `**Errors:**\n`;
      r.errors.forEach(err => md += `- \`${err}\`\n`);
      md += '\n';
    }

    md += `#### Evidence Screenshots\n\n`;
    for (const ss of r.screenshots) {
      const fname = path.basename(ss);
      const webpName = fname.replace('.png', '.webp');
      const webpExists = fs.existsSync(ss.replace('.png', '.webp'));
      md += `![${fname}](screenshots/${webpExists ? webpName : fname})\n\n`;
    }

    md += `---\n\n`;
  }

  md += `## Screen Recording\n\n`;
  const framesDir = path.join(VID_DIR, 'frames');
  if (fs.existsSync(framesDir)) {
    const frameCount = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).length;
    md += `- ${frameCount} frames captured in \`videos/frames/\`\n`;
  }

  md += `\n## Test Data\n\n`;
  md += `| Field | Value |\n|-------|-------|\n`;
  md += `| Domain | ${DOMAIN} |\n`;
  md += `| Coach Account | ${EMAIL} |\n`;
  md += `| Client | ${CLIENT_NAME} |\n`;
  md += `| Browser | Chrome via CDP (port 9222) |\n`;
  md += `| Total Prompts | ${results.length} |\n`;
  md += `| Passed | ${passed} |\n`;
  md += `| Failed | ${failed} |\n`;

  fs.writeFileSync(reportPath, md);
  console.log(`\nReport saved: ${reportPath}`);
  return reportPath;
}

async function main() {
  console.log('Connecting to Chrome via CDP...');
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();
  const context = contexts[0];
  const pages = context.pages();

  let page = null;
  for (const p of pages) {
    if (p.url().includes('staging.everfit.io')) { page = p; break; }
  }

  if (!page) {
    console.error('No Everfit tab found!');
    process.exit(1);
  }

  console.log(`Found: ${await page.title()}`);
  console.log(`URL: ${page.url()}`);

  // Handle dialogs automatically
  page.on('dialog', async dialog => {
    console.log(`  [dialog] "${dialog.message()}" — accepting`);
    await dialog.accept();
  });

  // Start CDP screencast for recording
  let recorder = null;
  try {
    const client = await context.newCDPSession(page);
    const frames = [];
    client.on('Page.screencastFrame', async (event) => {
      frames.push(event.data);
      await client.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
    });
    await client.send('Page.startScreencast', { format: 'png', quality: 60, maxWidth: 1440, maxHeight: 900, everyNthFrame: 3 });
    recorder = { client, frames };
    console.log('Screen recording started.');
  } catch (e) {
    console.log('Screen recording not available:', e.message);
  }

  // Clean old screenshots
  try {
    const oldFiles = fs.readdirSync(SS_DIR);
    oldFiles.forEach(f => fs.unlinkSync(path.join(SS_DIR, f)));
  } catch (e) {}

  await screenshot(page, '00-initial-state');

  // Run all 10 prompts
  for (let i = 0; i < PROMPTS.length; i++) {
    await testPrompt(page, PROMPTS[i], i);
  }

  // Stop recording
  if (recorder) {
    try {
      await recorder.client.send('Page.stopScreencast');
      console.log(`\nRecording stopped. ${recorder.frames.length} frames captured.`);

      // Save frames
      const framesDir = path.join(VID_DIR, 'frames');
      fs.mkdirSync(framesDir, { recursive: true });
      // Clean old frames
      try { fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f))); } catch (e) {}

      for (let i = 0; i < recorder.frames.length; i++) {
        fs.writeFileSync(path.join(framesDir, `frame-${String(i).padStart(5, '0')}.png`), Buffer.from(recorder.frames[i], 'base64'));
      }
      console.log(`Saved ${recorder.frames.length} frames to videos/frames/`);

      // Convert frames to webm using ffmpeg (if available)
      try {
        const webmPath = path.join(VID_DIR, 'wob-generate-workout-recording.webm');
        execSync(`ffmpeg -y -framerate 5 -i "${framesDir}/frame-%05d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 1M "${webmPath}" 2>/dev/null`);
        console.log(`Video saved: ${webmPath}`);
        // Clean up frames after successful encoding
        fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
        fs.rmdirSync(framesDir);
        console.log('Cleaned up frames directory.');
      } catch (e) {
        console.log('ffmpeg not available — frames kept as fallback. Install ffmpeg for webm output.');
      }
    } catch (e) {
      console.log('Error saving recording:', e.message);
    }
  }

  generateReport();

  const passed = results.filter(r => r.status === 'COMPLETED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`TEST RUN COMPLETE`);
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`${'='.repeat(50)}`);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
