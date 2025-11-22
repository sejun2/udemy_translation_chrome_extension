// Udemy 실제 HTML 구조 분석 스크립트
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting Udemy HTML structure analysis...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 무료 Udemy 강의 예시 (실제 URL로 변경 필요)
  const testUrl = 'https://www.udemy.com/course/git-started-with-github/';

  console.log(`📍 Navigating to: ${testUrl}`);
  await page.goto(testUrl, { waitUntil: 'networkidle' });

  console.log('⏳ Waiting for page to load...');
  await page.waitForTimeout(3000);

  // 강의 미리보기 또는 샘플 영상 찾기
  console.log('\n🎥 Looking for video player...\n');

  // 모든 video 태그 찾기
  const videos = await page.locator('video').count();
  console.log(`Found ${videos} video element(s)`);

  // iframe 찾기 (Udemy는 iframe을 사용할 수 있음)
  const iframes = await page.locator('iframe').count();
  console.log(`Found ${iframes} iframe(s)`);

  // 자막 관련 모든 요소 찾기
  console.log('\n📝 Searching for caption/subtitle elements...\n');

  const captionElements = await page.evaluate(() => {
    const results = [];
    const allElements = document.querySelectorAll('*');

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const className = el.className.toString().toLowerCase();
      const id = el.id ? el.id.toLowerCase() : '';
      const dataPurpose = el.getAttribute('data-purpose') || '';

      // caption, subtitle, cc 등의 키워드 찾기
      if (className.includes('caption') ||
          className.includes('subtitle') ||
          className.includes('cc') ||
          id.includes('caption') ||
          id.includes('subtitle') ||
          dataPurpose.includes('caption')) {

        results.push({
          tag: el.tagName,
          className: el.className.toString(),
          id: el.id,
          dataPurpose: dataPurpose,
          textContent: el.textContent ? el.textContent.substring(0, 50) : '',
          xpath: getXPath(el)
        });
      }
    }

    function getXPath(element) {
      if (element.id !== '') {
        return 'id("' + element.id + '")';
      }
      if (element === document.body) {
        return element.tagName;
      }
      let ix = 0;
      const siblings = element.parentNode.childNodes;
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === element) {
          return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
          ix++;
        }
      }
    }

    return results;
  });

  console.log('Caption/Subtitle elements found:', captionElements.length);
  console.log(JSON.stringify(captionElements, null, 2));

  // 비디오 플레이어 구조 분석
  console.log('\n🎬 Analyzing video player structure...\n');

  const playerInfo = await page.evaluate(() => {
    const players = [];

    // video.js 플레이어 찾기
    const vjsPlayers = document.querySelectorAll('[class*="video-js"]');
    vjsPlayers.forEach(p => {
      players.push({
        type: 'video-js',
        className: p.className,
        id: p.id
      });
    });

    // 일반 video 태그
    const videoTags = document.querySelectorAll('video');
    videoTags.forEach(v => {
      players.push({
        type: 'video-tag',
        className: v.className,
        id: v.id,
        src: v.src || v.currentSrc
      });
    });

    return players;
  });

  console.log('Video players:', JSON.stringify(playerInfo, null, 2));

  // 스크린샷 저장
  await page.screenshot({
    path: 'test-results/udemy-page.png',
    fullPage: true
  });
  console.log('\n📸 Screenshot saved: test-results/udemy-page.png');

  // 페이지 HTML 일부 저장
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('test-results/udemy-page.html', html);
  console.log('💾 HTML saved: test-results/udemy-page.html');

  console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
  console.log('👀 Please check the page and look for subtitle elements!');
  await page.waitForTimeout(30000);

  await browser.close();

  console.log('\n✅ Analysis complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Check test-results/udemy-page.png');
  console.log('2. Review test-results/udemy-page.html');
  console.log('3. Update content script selectors based on findings');

})();
