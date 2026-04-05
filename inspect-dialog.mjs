import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes('staging.everfit.io'));
  if (!page) { console.error('No Everfit tab'); process.exit(1); }

  // Look at the "Find a Workout" dialog
  console.log('=== MODAL CONTENT ===');
  const modal = page.locator('.ui.modal.visible, [class*="modal"][class*="visible"]').first();
  const modalText = await modal.innerText({ timeout: 5000 }).catch(() => 'modal not found');
  console.log(modalText.substring(0, 500));

  console.log('\n=== BUTTONS IN MODAL ===');
  const btns = await modal.locator('button, a, [role="button"], [class*="tab"], [class*="btn"]').all();
  for (const btn of btns) {
    const text = await btn.innerText().catch(() => '');
    const cls = await btn.getAttribute('class').catch(() => '');
    const vis = await btn.isVisible().catch(() => false);
    if (vis) console.log(`  "${text.trim().substring(0, 50)}" class="${cls?.substring(0, 80)}"`);
  }

  console.log('\n=== "Everfit AI" ELEMENTS ===');
  const aiEls = await page.locator('text="Everfit AI"').all();
  for (const el of aiEls) {
    const tag = await el.evaluate(e => e.tagName);
    const cls = await el.evaluate(e => e.className?.substring(0, 80));
    const vis = await el.isVisible().catch(() => false);
    const box = await el.boundingBox().catch(() => null);
    console.log(`  <${tag}> class="${cls}" visible=${vis} pos=(${Math.round(box?.x||0)},${Math.round(box?.y||0)})`);
  }

  console.log('\n=== "Create New" ELEMENTS ===');
  const cnEls = await page.locator('text="Create New"').all();
  for (const el of cnEls) {
    const tag = await el.evaluate(e => e.tagName);
    const cls = await el.evaluate(e => e.className?.substring(0, 80));
    const vis = await el.isVisible().catch(() => false);
    console.log(`  <${tag}> class="${cls}" visible=${vis}`);
  }

  console.log('\n=== ALL CLICKABLE IN DIALOG ===');
  const clickable = await modal.locator('button, a, [role="button"], [class*="tab-item"], [class*="TabItem"]').all();
  for (const el of clickable) {
    const text = await el.innerText().catch(() => '');
    const cls = await el.getAttribute('class').catch(() => '');
    const tag = await el.evaluate(e => e.tagName);
    const vis = await el.isVisible().catch(() => false);
    if (vis && text.trim()) console.log(`  <${tag}> "${text.trim().substring(0, 40)}" class="${cls?.substring(0, 80)}"`);
  }

  console.log('\nDone.');
}

main().catch(console.error);
