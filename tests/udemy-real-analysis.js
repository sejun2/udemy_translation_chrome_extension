// Udemy 실제 강의 페이지 HTML 구조 분석
const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting Udemy lecture page analysis...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100  // 디버깅을 위해 천천히
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const lectureUrl = 'https://www.udemy.com/course/android-lifecycles/learn/lecture/29969096';

  console.log(`📍 Navigating to: ${lectureUrl}`);

  try {
    await page.goto(lectureUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✅ Page loaded');
    console.log('⏳ Waiting for video player to load...');
    await page.waitForTimeout(5000);

    // 비디오 플레이어가 있는지 확인
    const hasVideo = await page.locator('video').count();
    console.log(`\n🎥 Video elements found: ${hasVideo}`);

    if (hasVideo > 0) {
      console.log('✅ Video player detected\n');

      // 비디오 재생 버튼 찾아서 클릭 시도
      const playButton = page.locator('button[data-purpose="play-button"], button[aria-label*="Play"], .play-overlay');
      const playButtonCount = await playButton.count();

      if (playButtonCount > 0) {
        console.log('▶️  Attempting to play video...');
        await playButton.first().click();
        await page.waitForTimeout(3000);
      }
    }

    // 모든 자막/캡션 관련 요소 찾기
    console.log('📝 Analyzing caption/subtitle elements...\n');

    const captionAnalysis = await page.evaluate(() => {
      const results = {
        captionElements: [],
        videoPlayerInfo: {},
        textTrackElements: []
      };

      // 모든 요소 검사
      const allElements = document.querySelectorAll('*');

      for (let el of allElements) {
        const className = el.className?.toString().toLowerCase() || '';
        const id = el.id?.toLowerCase() || '';
        const dataPurpose = el.getAttribute('data-purpose') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';

        // caption, subtitle, cue 관련 키워드 찾기
        if (className.includes('caption') ||
            className.includes('subtitle') ||
            className.includes('cue') ||
            className.includes('text-track') ||
            id.includes('caption') ||
            id.includes('subtitle') ||
            dataPurpose.includes('caption') ||
            dataPurpose.includes('cue')) {

          results.captionElements.push({
            tag: el.tagName,
            className: el.className?.toString() || '',
            id: el.id || '',
            dataPurpose: dataPurpose,
            ariaLabel: ariaLabel,
            textContent: el.textContent?.substring(0, 100) || '',
            innerHTML: el.innerHTML?.substring(0, 200) || ''
          });
        }
      }

      // Video.js 플레이어 정보
      const videoJsPlayer = document.querySelector('.video-js, [class*="video-player"]');
      if (videoJsPlayer) {
        results.videoPlayerInfo = {
          className: videoJsPlayer.className,
          id: videoJsPlayer.id,
          hasTextTrackDisplay: !!videoJsPlayer.querySelector('.vjs-text-track-display')
        };
      }

      // Text track 요소들
      const textTracks = document.querySelectorAll('.vjs-text-track-display, [class*="text-track"]');
      textTracks.forEach(track => {
        results.textTrackElements.push({
          className: track.className,
          innerHTML: track.innerHTML?.substring(0, 200)
        });
      });

      return results;
    });

    console.log('📊 Analysis Results:\n');
    console.log('Caption Elements:', JSON.stringify(captionAnalysis.captionElements, null, 2));
    console.log('\nVideo Player Info:', JSON.stringify(captionAnalysis.videoPlayerInfo, null, 2));
    console.log('\nText Track Elements:', JSON.stringify(captionAnalysis.textTrackElements, null, 2));

    // DOM 구조 출력
    console.log('\n🌳 Looking for subtitle container in DOM...\n');

    const subtitleSelectors = await page.evaluate(() => {
      const selectors = [];

      // 일반적인 자막 셀렉터들 테스트
      const testSelectors = [
        '.vjs-text-track-display',
        '[data-purpose="captions-cue-text"]',
        '[class*="captions-cue"]',
        '[class*="caption"]',
        '[class*="subtitle"]',
        'div[style*="position: absolute"][style*="bottom"]'
      ];

      testSelectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          selectors.push({
            selector: selector,
            found: true,
            className: el.className,
            textContent: el.textContent?.substring(0, 50)
          });
        } else {
          selectors.push({
            selector: selector,
            found: false
          });
        }
      });

      return selectors;
    });

    console.log('Selector Test Results:');
    subtitleSelectors.forEach(s => {
      console.log(`  ${s.found ? '✅' : '❌'} ${s.selector}`);
      if (s.found) {
        console.log(`     Class: ${s.className}`);
        console.log(`     Text: ${s.textContent}`);
      }
    });

    // 스크린샷 저장
    console.log('\n📸 Taking screenshots...');
    await page.screenshot({
      path: 'test-results/udemy-lecture-full.png',
      fullPage: true
    });
    console.log('  ✓ Full page: test-results/udemy-lecture-full.png');

    await page.screenshot({
      path: 'test-results/udemy-lecture-viewport.png'
    });
    console.log('  ✓ Viewport: test-results/udemy-lecture-viewport.png');

    // HTML 저장
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('test-results/udemy-lecture.html', html);
    console.log('\n💾 HTML saved: test-results/udemy-lecture.html');

    // 페이지 유지하여 수동 검사 가능
    console.log('\n👀 Browser will stay open for 60 seconds for manual inspection...');
    console.log('   Please turn on subtitles and inspect the elements!');
    console.log('\n💡 To inspect subtitle elements:');
    console.log('   1. Turn on CC (subtitles) in the video player');
    console.log('   2. Right-click on the subtitle text');
    console.log('   3. Select "Inspect" to see the HTML structure');

    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();

  console.log('\n✅ Analysis complete!');
  console.log('\n📋 Check the results:');
  console.log('   - test-results/udemy-lecture-full.png');
  console.log('   - test-results/udemy-lecture-viewport.png');
  console.log('   - test-results/udemy-lecture.html');

})();
