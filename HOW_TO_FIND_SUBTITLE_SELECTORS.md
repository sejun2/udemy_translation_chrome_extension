# Udemy 자막 셀렉터 찾는 방법

## 🎯 목표
실제 Udemy 강의 페이지에서 자막이 표시되는 HTML 요소의 정확한 셀렉터를 찾기

## 📋 단계별 가이드

### 1단계: Udemy 강의 페이지 열기
```
https://www.udemy.com/course/android-lifecycles/learn/lecture/29969096
```

### 2단계: 비디오 재생 및 자막 활성화
1. 비디오 재생 버튼 클릭
2. CC (자막) 버튼 클릭하여 자막 켜기
3. 자막이 화면에 나타나는 것 확인

### 3단계: DevTools로 자막 요소 검사

#### 방법 A: 직접 검사
1. **F12** 또는 **Cmd+Option+I** (Mac)로 DevTools 열기
2. **Elements** 탭 선택
3. **Select element** 버튼 클릭 (왼쪽 위 화살표 아이콘)
4. 화면에 나타난 **자막 텍스트 위에 마우스 올리기**
5. **클릭**하여 해당 요소 선택
6. DevTools에서 해당 요소의 HTML 구조 확인

#### 방법 B: Console에서 검색
1. **F12**로 DevTools 열기
2. **Console** 탭 선택
3. 다음 코드 실행:

```javascript
// 자막/캡션 관련 요소 모두 찾기
const captionElements = [...document.querySelectorAll('*')].filter(el => {
  const className = el.className?.toString().toLowerCase() || '';
  const dataPurpose = el.getAttribute('data-purpose') || '';
  return className.includes('caption') ||
         className.includes('subtitle') ||
         className.includes('cue') ||
         dataPurpose.includes('caption') ||
         dataPurpose.includes('cue');
});

console.log('Found caption elements:', captionElements.length);
captionElements.forEach((el, i) => {
  console.log(`\n[${i}]`, {
    tag: el.tagName,
    className: el.className,
    dataPurpose: el.getAttribute('data-purpose'),
    textContent: el.textContent?.substring(0, 50)
  });
});
```

### 4단계: 중요 정보 수집

다음 정보를 찾아서 기록하세요:

#### ✅ 자막 컨테이너 요소
- **태그명** (예: div, span, p)
- **클래스명** (예: `vjs-text-track-display`, `caption-text`)
- **data-purpose** 속성 (예: `captions-cue-text`)
- **ID** (있다면)

#### 예시 결과:
```html
<div class="vjs-text-track-display" aria-live="off">
  <div class="captions-text-track--captions-cue--fOW8k">
    Hello, this is a subtitle
  </div>
</div>
```

위 예시에서:
- **컨테이너 셀렉터**: `.vjs-text-track-display`
- **텍스트 셀렉터**: `[class*="captions-cue"]` 또는 `.captions-text-track--captions-cue--fOW8k`

### 5단계: 셀렉터 테스트

Console에서 셀렉터가 올바른지 테스트:

```javascript
// 테스트할 셀렉터
const testSelectors = [
  '.vjs-text-track-display',
  '[data-purpose="captions-cue-text"]',
  '[class*="captions-cue"]',
  '.captions-text-track',
  // 찾은 셀렉터 추가
];

testSelectors.forEach(selector => {
  const el = document.querySelector(selector);
  if (el) {
    console.log(`✅ ${selector} - Found!`);
    console.log('   Text:', el.textContent?.substring(0, 50));
  } else {
    console.log(`❌ ${selector} - Not found`);
  }
});
```

### 6단계: 동적 변화 관찰

자막이 변경될 때 어떤 일이 일어나는지 확인:

```javascript
// MutationObserver로 자막 변경 감지
const subtitleContainer = document.querySelector('.vjs-text-track-display'); // 찾은 셀렉터 사용

if (subtitleContainer) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      console.log('Subtitle changed!', {
        type: mutation.type,
        target: mutation.target,
        newText: mutation.target.textContent?.substring(0, 50)
      });
    });
  });

  observer.observe(subtitleContainer, {
    childList: true,
    subtree: true,
    characterData: true
  });

  console.log('✅ Observer attached. Watching for subtitle changes...');
} else {
  console.log('❌ Subtitle container not found!');
}
```

## 📝 결과 보고 양식

찾은 정보를 다음 형식으로 정리해주세요:

```
=== Udemy 자막 셀렉터 정보 ===

1. 자막 컨테이너:
   - 셀렉터:
   - 클래스명:
   - data-purpose:

2. 자막 텍스트 요소:
   - 셀렉터:
   - 클래스명:
   - 텍스트 샘플:

3. 작동하는 CSS 셀렉터:
   -

4. 추가 관찰 사항:
   -
```

## 🔍 일반적인 Udemy 자막 패턴

과거 Udemy에서 사용한 패턴들:

1. **Video.js 기반**
   ```
   .vjs-text-track-display
   .vjs-text-track-cue
   ```

2. **Custom 클래스**
   ```
   [data-purpose="captions-cue-text"]
   [class*="captions-cue"]
   .captions-text-track
   ```

3. **모듈 CSS (해시된 클래스명)**
   ```
   .captions-text-track--captions-cue--abc123
   [class^="captions-text-track"]
   ```

## 💡 팁

1. **클래스명이 해시되어 있다면** (예: `--abc123`)
   - 부분 일치 사용: `[class*="captions-cue"]`
   - 시작 문자 일치: `[class^="captions-text"]`

2. **여러 셀렉터 준비**
   - 메인 셀렉터 1개
   - 백업 셀렉터 2-3개
   - 일반적 패턴 1개

3. **로그 확인**
   - Console에 로그가 나타나는지 확인
   - 에러가 있다면 기록

## 🚀 다음 단계

셀렉터를 찾았다면:

1. `src/content/content.ts`의 `findSubtitleContainer()` 함수 수정
2. 찾은 셀렉터 추가
3. 빌드: `npm run build`
4. 익스텐션 새로고침
5. 실제 Udemy에서 테스트

---

**중요**: 자막이 화면에 표시되는 동안 검사해야 합니다!
