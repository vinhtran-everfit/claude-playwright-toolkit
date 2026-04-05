import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();
  const context = contexts[0];
  const pages = context.pages();

  let page = null;
  for (const p of pages) {
    if (p.url().includes('staging.everfit.io')) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.error('No Everfit tab found');
    process.exit(1);
  }

  console.log('URL:', page.url());
  console.log('Title:', await page.title());

  // Inspect all buttons with their text
  console.log('\n=== BUTTONS ===');
  const buttons = await page.$$eval('button', els => els.map(el => ({
    text: el.innerText?.trim().substring(0, 80),
    class: el.className?.substring(0, 100),
    ariaLabel: el.getAttribute('aria-label'),
    dataTip: el.getAttribute('data-tip'),
    visible: el.offsetParent !== null
  })).filter(b => b.visible));
  buttons.forEach((b, i) => console.log(`  ${i}: "${b.text}" class="${b.class}" aria="${b.ariaLabel}" tip="${b.dataTip}"`));

  // Inspect textareas and inputs
  console.log('\n=== TEXTAREAS & INPUTS ===');
  const inputs = await page.$$eval('textarea, input[type="text"], [contenteditable="true"]', els => els.map(el => ({
    tag: el.tagName,
    class: el.className?.substring(0, 100),
    placeholder: el.getAttribute('placeholder'),
    value: el.value?.substring(0, 50) || el.innerText?.substring(0, 50),
    visible: el.offsetParent !== null
  })).filter(b => b.visible));
  inputs.forEach((inp, i) => console.log(`  ${i}: <${inp.tag}> placeholder="${inp.placeholder}" class="${inp.class}" value="${inp.value}"`));

  // Look for AI-related elements
  console.log('\n=== AI-RELATED ELEMENTS ===');
  const aiEls = await page.$$eval('[class*="ai" i], [class*="AI"], [class*="generate" i], [class*="Generate"], [data-testid*="ai" i]', els => els.map(el => ({
    tag: el.tagName,
    text: el.innerText?.trim().substring(0, 80),
    class: el.className?.substring(0, 120),
    visible: el.offsetParent !== null
  })).filter(b => b.visible));
  aiEls.forEach((el, i) => console.log(`  ${i}: <${el.tag}> "${el.text?.substring(0, 60)}" class="${el.class}"`));

  // Look for the "Everfit AI" text/button
  console.log('\n=== "Everfit AI" text locations ===');
  const efAi = await page.$$eval('*', els => els.filter(el => el.innerText?.includes('Everfit AI') && el.children.length < 3 && el.offsetParent !== null).map(el => ({
    tag: el.tagName,
    class: el.className?.substring(0, 100),
    text: el.innerText?.trim().substring(0, 100),
    rect: el.getBoundingClientRect()
  })));
  efAi.forEach((el, i) => console.log(`  ${i}: <${el.tag}> "${el.text}" class="${el.class}" pos=(${Math.round(el.rect.x)},${Math.round(el.rect.y)})`));

  // Check for "Start Over", "Feedback", tabs
  console.log('\n=== SPECIAL ELEMENTS ===');
  const specials = ['Start Over', 'Feedback', 'AI Assistant', 'Standard Builder', 'Save', 'Cancel', 'Close', 'Generate', 'Workout Arrangement'];
  for (const label of specials) {
    const found = await page.locator(`text="${label}"`).count();
    console.log(`  "${label}": ${found} found`);
    if (found > 0) {
      const el = page.locator(`text="${label}"`).first();
      try {
        const box = await el.boundingBox();
        console.log(`    at (${Math.round(box?.x || 0)}, ${Math.round(box?.y || 0)}) ${Math.round(box?.width || 0)}x${Math.round(box?.height || 0)}`);
      } catch (e) {}
    }
  }

  // Look for the "+" plus icon in calendar
  console.log('\n=== PLUS/ADD ICONS ===');
  const plusEls = await page.$$eval('[class*="plus" i], [class*="Plus"], [class*="add-" i], [class*="Add"], [data-tip*="add" i], svg', els => els.filter(el => {
    const cl = (el.className?.toString() || '').toLowerCase();
    return (cl.includes('plus') || cl.includes('add')) && el.offsetParent !== null;
  }).map(el => ({
    tag: el.tagName,
    class: (el.className?.toString() || '').substring(0, 100),
    text: el.innerText?.trim().substring(0, 50),
    rect: el.getBoundingClientRect()
  })));
  plusEls.forEach((el, i) => console.log(`  ${i}: <${el.tag}> class="${el.class}" text="${el.text}" pos=(${Math.round(el.rect.x)},${Math.round(el.rect.y)})`));

  console.log('\nDone inspecting.');
}

main().catch(console.error);
