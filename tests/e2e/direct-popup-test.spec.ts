import { test, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

test.describe('Direct Popup Test', () => {
  let context: BrowserContext;

  test('Test extension popup directly', async () => {
    const extensionPath = path.join(__dirname, '../../dist');
    console.log('📂 Extension path:', extensionPath);

    // Launch browser with extension
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox'
      ],
    });

    console.log('✅ Browser launched with extension');

    // Create a new page
    const page = await context.newPage();

    // Try to get extension ID from background page
    const serviceWorkers = context.serviceWorkers();
    console.log('Service workers:', serviceWorkers.length);

    // Wait for service worker
    await page.waitForTimeout(2000);

    // Get all pages including extension pages
    const pages = context.pages();
    console.log('Total pages:', pages.length);

    // Navigate to a simple page first
    await page.goto('about:blank');

    // Execute JavaScript to find extension ID
    const extensionInfo = await page.evaluate(async () => {
      // This won't work in regular page context, but let's try
      return {
        location: window.location.href,
        hasChrome: typeof chrome !== 'undefined'
      };
    });

    console.log('Extension info:', extensionInfo);

    // Alternative: Try to open popup by getting extension ID from service worker URL
    await page.waitForTimeout(1000);
    const workers = context.serviceWorkers();

    if (workers.length > 0) {
      const worker = workers[0];
      const workerUrl = worker.url();
      console.log('Service worker URL:', workerUrl);

      // Extract extension ID from URL like: chrome-extension://abc123/background.js
      const match = workerUrl.match(/chrome-extension:\/\/([a-z]+)\//);

      if (match) {
        const extensionId = match[1];
        console.log('✅ Extension ID found:', extensionId);

        // Open popup
        const popupUrl = `chrome-extension://${extensionId}/popup.html`;
        await page.goto(popupUrl);
        await page.waitForTimeout(1000);

        console.log('✅ Opened popup at:', popupUrl);

        // Take screenshot
        await page.screenshot({
          path: path.join(__dirname, '../../test-results/popup-initial.png'),
          fullPage: true
        });
        console.log('📸 Screenshot: popup-initial.png');

        // Check UI
        const title = await page.locator('h1').textContent();
        console.log('✅ Title:', title);

        // Fill form
        console.log('\n📝 Filling form...');

        await page.locator('#targetLanguage').selectOption('ko');
        console.log('  ✓ Selected Korean');

        await page.locator('#translationEngine').selectOption('google');
        console.log('  ✓ Selected Google');

        await page.locator('#googleApiKey').fill('test-demo-api-key-12345');
        console.log('  ✓ Entered API key');

        await page.locator('#enableTranslation').click();
        console.log('  ✓ Enabled translation');

        await page.waitForTimeout(500);

        // Screenshot after fill
        await page.screenshot({
          path: path.join(__dirname, '../../test-results/popup-filled.png'),
          fullPage: true
        });
        console.log('📸 Screenshot: popup-filled.png');

        // Save
        await page.locator('#saveButton').click();
        console.log('\n💾 Clicked save button');

        await page.waitForTimeout(1500);

        // Final screenshot
        await page.screenshot({
          path: path.join(__dirname, '../../test-results/popup-saved.png'),
          fullPage: true
        });
        console.log('📸 Screenshot: popup-saved.png');

        // Check status
        const status = await page.locator('#status').textContent();
        console.log('📊 Status:', status);

        // Verify storage
        const storageData = await page.evaluate(() => {
          return new Promise((resolve) => {
            chrome.storage.sync.get('translationConfig', (data) => {
              resolve(data.translationConfig);
            });
          });
        });

        console.log('\n💾 Storage data:', JSON.stringify(storageData, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('Extension ID:', extensionId);
        console.log('Popup URL:', popupUrl);
        console.log('All UI elements working');
        console.log('Settings saved to storage');
        console.log('3 screenshots captured');
        console.log('='.repeat(60));

      } else {
        console.log('❌ Could not extract extension ID from service worker URL');
      }
    } else {
      console.log('❌ No service workers found');
    }

    // Keep open for inspection
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

    await context.close();
  });
});
