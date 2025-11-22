# Udemy Translation Extension - Debugging Guide

## 문제 해결 단계

익스텐션이 동작하지 않을 때 다음 단계를 따라 문제를 찾으세요.

### 1단계: 익스텐션이 제대로 로드되었는지 확인

1. Chrome에서 `chrome://extensions/` 접속
2. "Udemy Subtitle Translator" 익스텐션 찾기
3. 익스텐션이 **활성화(Enabled)** 되어 있는지 확인
4. 에러가 있다면 "Errors" 버튼을 클릭하여 확인

**예상 문제:**
- ❌ manifest.json 에러: 빌드를 다시 실행 (`npm run build`)
- ❌ Service worker 에러: background.js 로그 확인

### 2단계: Content Script가 실행되는지 확인

1. Udemy 강의 페이지로 이동
   - URL 형식: `https://www.udemy.com/course/[course-name]/learn/lecture/[id]`

2. F12를 눌러 Developer Tools 열기

3. Console 탭에서 다음 메시지를 확인:
   ```
   [Udemy Translator] Initializing...
   [Udemy Translator] Current URL: https://www.udemy.com/...
   [Udemy Translator] Config loaded: {...}
   ```

**예상 문제:**
- ❌ 로그가 없음 → Content script가 주입되지 않음
  - 해결: 익스텐션을 다시 로드하고 페이지 새로고침
- ❌ "Translation is disabled" 메시지
  - 해결: Popup에서 번역 활성화

### 3단계: 설정(Config) 확인

1. 익스텐션 아이콘 클릭하여 Popup 열기

2. 다음 항목 확인:
   - ✅ "Enable Translation" 토글이 **ON**
   - ✅ Target Language 선택됨 (기본: 한국어)
   - ✅ Translation Engine 선택됨
   - ✅ API 키 입력됨

3. "Save Settings" 클릭

4. Console에서 확인:
   ```
   [Udemy Translator] Config updated: {enabled: true, ...}
   ```

**예상 문제:**
- ❌ 설정이 저장 안됨
  - 해결: Chrome 동기화 권한 확인
- ❌ API 키 없음
  - 해결: Google Cloud 또는 DeepSeek에서 API 키 발급

### 4단계: 자막 컨테이너 찾기

Console에서 다음 메시지 확인:
```
[Udemy Translator] Searching for subtitle container...
[Udemy Translator] Found subtitle container with selector: ...
```

**문제: 자막 컨테이너를 찾지 못함**

해결 방법:
1. Udemy 비디오에서 **자막(CC)을 활성화**했는지 확인
2. Elements 탭에서 자막 요소 찾기:
   - 자막이 화면에 표시되는 동안 Elements 검사
   - "caption", "subtitle" 등의 클래스명 찾기

3. 찾은 셀렉터를 코드에 추가:
   ```typescript
   // src/content/content.ts의 findSubtitleContainer() 수정
   const selectors = [
     '여기에-찾은-셀렉터-추가',
     '[data-purpose="captions-cue-text"]',
     ...
   ];
   ```

### 5단계: 번역 API 호출 확인

자막이 감지되면 Console에 다음 메시지가 나타나야 함:
```
[Udemy Translator] Subtitle detected: Hello world...
[Udemy Translator] Translating with google...
[Udemy Translator] Calling Google Translate API...
[Udemy Translator] Translation successful
[Udemy Translator] Updating subtitle display
```

**예상 문제:**

**1. API 키 에러**
```
[Udemy Translator] Google API key not set
```
→ Popup에서 API 키 입력 및 저장

**2. API 호출 실패**
```
[Udemy Translator] Translation failed: 403
```
→ API 키 권한 및 할당량 확인

**3. CORS 에러**
```
Access to fetch ... has been blocked by CORS policy
```
→ manifest.json의 host_permissions 확인

**4. Network 에러**
```
Failed to fetch
```
→ 인터넷 연결 확인

### 6단계: 번역된 자막 표시 확인

번역이 성공하면:
- 화면에 번역된 자막이 **굵은 글씨**로 표시
- 원본 자막이 아래에 **흐리게** 표시

Elements 탭에서 확인:
```html
<div class="udemy-translation">번역된 텍스트</div>
<div class="udemy-original">Original text</div>
```

## 일반적인 문제와 해결책

### 문제 1: 익스텐션이 로드되지 않음
**증상:** chrome://extensions/에서 에러 표시

**해결:**
```bash
cd /Users/imsejun/Documents/udemy_translation
npm run build
```
그 후 익스텐션 새로고침

### 문제 2: Content script가 실행 안됨
**증상:** Console에 로그 없음

**해결:**
1. Udemy 강의 URL 확인 (lecture 페이지여야 함)
2. 익스텐션 새로고침 후 페이지 새로고침
3. manifest.json의 content_scripts.matches 확인

### 문제 3: 자막을 찾지 못함
**증상:** "No subtitle container found" 메시지

**해결:**
1. Udemy에서 자막(CC) 버튼 클릭하여 활성화
2. 자막이 화면에 표시되는지 확인
3. 다른 언어의 자막으로 변경해보기

### 문제 4: 번역이 안됨
**증상:** 자막은 감지되지만 번역 안됨

**해결:**
1. API 키가 올바른지 확인
2. API 할당량 확인 (Google Cloud Console)
3. Network 탭에서 API 요청 상태 확인

### 문제 5: 번역이 느림
**증상:** 자막 변경 후 번역까지 시간이 오래 걸림

**원인:** API 응답 시간

**해결:**
- DeepSeek 대신 Google Translate 사용 (더 빠름)
- 이미 번역된 자막은 캐시됨 (두 번째부터 빠름)

## 디버깅 팁

### Chrome DevTools 활용

**1. Service Worker 로그 확인**
```
chrome://extensions/ → Udemy Subtitle Translator → Service Worker → Inspect
```

**2. Content Script 로그 확인**
```
Udemy 페이지에서 F12 → Console 탭
```

**3. Storage 확인**
```
F12 → Application 탭 → Storage → Chrome Storage → Sync
```
"translationConfig" 키 확인

**4. Network 요청 확인**
```
F12 → Network 탭 → Fetch/XHR
```
Google Translate 또는 DeepSeek API 요청 확인

### Console 명령어로 디버깅

Udemy 페이지 Console에서 실행:

**설정 확인:**
```javascript
chrome.storage.sync.get('translationConfig', (data) => {
  console.log('Config:', data.translationConfig);
});
```

**수동으로 자막 요소 찾기:**
```javascript
document.querySelector('[data-purpose="captions-cue-text"]');
```

**모든 caption 관련 요소 찾기:**
```javascript
[...document.querySelectorAll('*')]
  .filter(el => el.className.toString().toLowerCase().includes('caption'))
  .forEach(el => console.log(el.className, el));
```

## API 키 테스트

### Google Translate API 테스트

Console에서 실행:
```javascript
fetch('https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    q: 'Hello world',
    target: 'ko',
    format: 'text'
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

### DeepSeek API 테스트

```javascript
fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{
      role: 'system',
      content: 'Translate to Korean. Only respond with translation.'
    }, {
      role: 'user',
      content: 'Hello world'
    }]
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

## 로그 레벨 확인

모든 주요 단계에서 로그가 출력됩니다:

1. ✅ `[Udemy Translator] Initializing...` - 시작
2. ✅ `[Udemy Translator] Config loaded: ...` - 설정 로드
3. ✅ `[Udemy Translator] Searching for subtitle container...` - 자막 검색
4. ✅ `[Udemy Translator] Found subtitle container...` - 자막 발견
5. ✅ `[Udemy Translator] Subtitle detected: ...` - 자막 감지
6. ✅ `[Udemy Translator] Translating with ...` - 번역 시작
7. ✅ `[Udemy Translator] Translation successful` - 번역 성공
8. ✅ `[Udemy Translator] Updating subtitle display` - 화면 업데이트

어느 단계에서 멈췄는지 확인하여 문제를 진단하세요.

## 여전히 작동하지 않는다면?

1. **전체 재시작:**
   ```bash
   npm run build
   ```
   - 익스텐션 제거 후 재설치
   - Chrome 재시작

2. **API 키 확인:**
   - Google Cloud Console에서 API 활성화 확인
   - 청구 계정 연결 확인
   - 할당량 확인

3. **Udemy 페이지 확인:**
   - 다른 강의에서 테스트
   - 다른 언어 자막으로 테스트

4. **로그 수집:**
   - Console의 모든 로그 복사
   - Network 탭의 실패한 요청 확인
   - 문제 보고 시 로그 첨부

---

**참고:** 익스텐션은 Udemy 강의 lecture 페이지에서만 작동합니다.
URL이 `https://www.udemy.com/course/*/learn/lecture/*` 형식인지 확인하세요.
