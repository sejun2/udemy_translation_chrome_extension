import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

let context: BrowserContext;

test.beforeAll(async () => {
  const extensionPath = path.join(__dirname, '../../dist');

  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

test.describe('Udemy Translation Extension', () => {
  test('extension should be loaded', async () => {
    const page = await context.newPage();
    await page.goto('chrome://extensions/');

    const content = await page.content();
    expect(content).toContain('Udemy Subtitle Translator');
  });

  test('popup should open and display settings', async () => {
    const page = await context.newPage();

    await page.goto('chrome://extensions/');
    await page.waitForTimeout(1000);

    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelectorAll('extensions-item');
      for (const ext of Array.from(extensions)) {
        const nameEl = ext.shadowRoot?.querySelector('#name');
        if (nameEl?.textContent?.includes('Udemy Subtitle Translator')) {
          return ext.getAttribute('id');
        }
      }
      return null;
    });

    if (extensionId) {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await expect(page.locator('h1')).toContainText('Udemy Subtitle Translator');

      await expect(page.locator('#targetLanguage')).toBeVisible();
      await expect(page.locator('#translationEngine')).toBeVisible();
      await expect(page.locator('#enableTranslation')).toBeVisible();
    }
  });

  test('should save settings', async () => {
    const page = await context.newPage();

    await page.goto('chrome://extensions/');
    await page.waitForTimeout(1000);

    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelectorAll('extensions-item');
      for (const ext of Array.from(extensions)) {
        const nameEl = ext.shadowRoot?.querySelector('#name');
        if (nameEl?.textContent?.includes('Udemy Subtitle Translator')) {
          return ext.getAttribute('id');
        }
      }
      return null;
    });

    if (extensionId) {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.selectOption('#targetLanguage', 'ko');
      await page.selectOption('#translationEngine', 'google');
      await page.fill('#googleApiKey', 'test-api-key');

      await page.click('#saveButton');

      await page.waitForTimeout(500);

      const statusText = await page.locator('#status').textContent();
      expect(statusText).toContain('saved');
    }
  });

  test('should switch between translation engines', async () => {
    const page = await context.newPage();

    await page.goto('chrome://extensions/');
    await page.waitForTimeout(1000);

    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelectorAll('extensions-item');
      for (const ext of Array.from(extensions)) {
        const nameEl = ext.shadowRoot?.querySelector('#name');
        if (nameEl?.textContent?.includes('Udemy Subtitle Translator')) {
          return ext.getAttribute('id');
        }
      }
      return null;
    });

    if (extensionId) {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      await page.selectOption('#translationEngine', 'google');
      await expect(page.locator('#googleApiSection')).toBeVisible();

      await page.selectOption('#translationEngine', 'deepseek');
      await expect(page.locator('#deepseekApiSection')).toBeVisible();
    }
  });
});
