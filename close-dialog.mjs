import { chromium } from 'playwright';
async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = browser.contexts()[0].pages().find(p => p.url().includes('staging.everfit.io'));
  // Close the Find a Workout dialog
  const closeBtn = page.locator('button.close-button').first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    console.log('Closed dialog');
  } else {
    console.log('No dialog to close');
  }
}
main().catch(console.error);
