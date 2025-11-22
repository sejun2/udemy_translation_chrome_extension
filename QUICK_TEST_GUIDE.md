# Quick Test Guide - Udemy Translation Extension

## ✅ 수정 완료 사항

### Udemy 실제 자막 구조에 맞게 수정됨:

**정확한 셀렉터:**
```html
<div class="captions-display--captions-container--PqdGQ">
  <div data-purpose="captions-cue-text"
       class="captions-display--captions-cue-text--TQ0DQ">
    자막 텍스트
  </div>
</div>
```

**Primary Selector:** `[data-purpose="captions-cue-text"]`

## 🚀 빠른 테스트 방법

### 1단계: 익스텐션 재로드

1. Chrome에서 `chrome://extensions/` 접속
2. "Udemy Subtitle Translator" 찾기
3. 🔄 새로고침 버튼 클릭 (또는 제거 후 재설치)

### 2단계: 설정 구성

1. 익스텐션 아이콘 클릭
2. 다음 항목 설정:
   - ✅ **Enable Translation**: ON
   - 🌐 **Target Language**: 한국어 (Korean)
   - 🔧 **Translation Engine**: Google 또는 DeepSeek
   - 🔑 **API Key**: 발급받은 API 키 입력
3. 💾 **Save Settings** 클릭

### 3단계: Udemy에서 테스트

1. Udemy 강의 페이지로 이동
   ```
   https://www.udemy.com/course/[강의명]/learn/lecture/[강의ID]
   ```

2. **F12**를 눌러 Developer Tools 열기

3. **Console 탭**에서 확인:
   ```
   [Udemy Translator] Initializing...
   [Udemy Translator] Current URL: https://www.udemy.com/...
   [Udemy Translator] Config loaded: {enabled: true, ...}
   [Udemy Translator] Searching for subtitle container...
   ```

4. **비디오 플레이어에서 자막(CC) 활성화**

5. Console에서 다음 메시지 확인:
   ```
   [Udemy Translator] Found subtitle container: [data-purpose="captions-cue-text"]
   [Udemy Translator] Element classes: captions-display--captions-cue-text--TQ0DQ
   [Udemy Translator] Subtitle detected: So now that we know...
   [Udemy Translator] Translating with google...
   [Udemy Translator] Calling Google Translate API...
   [Udemy Translator] Translation successful
   [Udemy Translator] Updating subtitle display
   [Udemy Translator] Display updated successfully
   ```

6. 화면에서 번역된 자막 확인:
   - **번역된 텍스트** (크고 굵게, 흰색)
   - 원본 텍스트 (작고 흐리게, 회색)

## 🔍 예상되는 동작

### 정상 동작 시:

**자막이 나타날 때마다:**
1. 원본 텍스트 감지
2. API로 번역 요청
3. 번역된 텍스트를 큰 글씨로 표시
4. 원본 텍스트를 작은 글씨로 아래에 표시

**캐시 동작:**
- 같은 자막이 다시 나타나면 API 호출 없이 캐시에서 가져옴
- Console에 "Using cached translation" 메시지

### 화면 표시 예시:

```
┌─────────────────────────────────────┐
│                                     │
│  이제 생명 주기가 무엇인지 알았으니,    │  ← 번역 (크고 굵게)
│  Android 앱의 생명 주기를 요약해봅시다. │
│                                     │
│  So now that we know what life      │  ← 원본 (작고 흐리게)
│  cycle is, let's summarize...       │
│                                     │
└─────────────────────────────────────┘
```

## ❌ 문제 해결

### 문제 1: "No subtitle container found"

**원인:** 자막이 활성화되지 않음

**해결:**
1. Udemy 비디오 플레이어에서 **CC (자막) 버튼** 클릭
2. 자막 언어 선택 (영어 권장)
3. 페이지 새로고침

### 문제 2: "Translation is disabled"

**원인:** 설정에서 번역이 꺼져 있음

**해결:**
1. 익스텐션 아이콘 클릭
2. "Enable Translation" 토글 ON
3. "Save Settings" 클릭

### 문제 3: "API key not set"

**원인:** API 키가 입력되지 않음

**해결:**
1. Google Cloud Console 또는 DeepSeek Platform에서 API 키 발급
2. 익스텐션 Popup에서 API 키 입력
3. "Save Settings" 클릭

### 문제 4: "Translation failed: 403"

**원인:** API 키 권한 문제

**해결 (Google):**
1. Google Cloud Console에서 Cloud Translation API 활성화 확인
2. 청구 계정 연결 확인
3. API 키 제한 설정 확인

**해결 (DeepSeek):**
1. DeepSeek 계정에 크레딧이 있는지 확인
2. API 키가 유효한지 확인

### 문제 5: 번역이 느림

**원인:** API 응답 시간

**해결:**
- Google Translate 사용 (DeepSeek보다 빠름)
- 이미 번역된 자막은 즉시 표시됨 (캐시)

## 📊 디버깅 체크리스트

### Chrome DevTools Console 확인:

- [ ] `[Udemy Translator] Initializing...` - 스크립트 로드됨
- [ ] `[Udemy Translator] Config loaded: {enabled: true}` - 설정 활성화됨
- [ ] `[Udemy Translator] Found subtitle container` - 자막 요소 발견됨
- [ ] `[Udemy Translator] Subtitle detected:` - 자막 텍스트 감지됨
- [ ] `[Udemy Translator] Translation successful` - 번역 성공
- [ ] `[Udemy Translator] Display updated successfully` - 화면 업데이트됨

### Elements 탭 확인:

1. Elements 탭 열기
2. 자막 요소 검사:
   ```html
   <div data-purpose="captions-cue-text">
     <div class="udemy-translation">번역된 텍스트</div>
     <div class="udemy-original">Original text</div>
   </div>
   ```

### Network 탭 확인:

1. Network 탭 열기
2. Fetch/XHR 필터 선택
3. 자막이 나타날 때 API 요청 확인:
   - Google: `translation.googleapis.com`
   - DeepSeek: `api.deepseek.com`

## 🎯 테스트 시나리오

### 시나리오 1: 기본 번역 테스트

1. Udemy 강의 재생
2. 자막 활성화
3. 번역된 자막 표시 확인
4. Console에서 로그 확인

### 시나리오 2: 캐시 테스트

1. 같은 강의를 처음부터 다시 재생
2. 이전에 나왔던 자막이 즉시 번역되는지 확인
3. Console에서 "Using cached translation" 확인

### 시나리오 3: 언어 변경 테스트

1. Target Language를 일본어로 변경
2. Save Settings
3. 새로운 언어로 번역되는지 확인

### 시나리오 4: API 전환 테스트

1. Google에서 DeepSeek으로 변경 (또는 반대)
2. Save Settings
3. 번역이 정상 동작하는지 확인

## 📝 Console 명령어로 수동 테스트

### 설정 확인:
```javascript
chrome.storage.sync.get('translationConfig', (data) => {
  console.log('Current Config:', data.translationConfig);
});
```

### 자막 요소 확인:
```javascript
const subtitle = document.querySelector('[data-purpose="captions-cue-text"]');
console.log('Subtitle element:', subtitle);
console.log('Subtitle text:', subtitle?.textContent);
console.log('Subtitle classes:', subtitle?.className);
```

### 번역 테스트 (Google):
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
.then(d => console.log('Translation:', d));
```

## ✨ 성공 확인

익스텐션이 정상 동작하면:

✅ Console에 모든 단계의 로그 표시
✅ 자막이 나타날 때마다 자동으로 번역
✅ 번역된 텍스트가 큰 글씨로 표시
✅ 원본 텍스트가 작은 글씨로 표시
✅ 같은 자막은 캐시에서 즉시 로드
✅ 다른 강의로 이동해도 계속 동작

## 🎉 완료!

모든 단계가 성공적으로 완료되었다면, Udemy의 모든 강의에서 자막 번역을 사용할 수 있습니다!

---

**참고:**
- 익스텐션은 Udemy 강의 lecture 페이지에서만 작동합니다
- 자막(CC)이 활성화되어 있어야 합니다
- API 키가 필요합니다 (Google 또는 DeepSeek)
- 인터넷 연결이 필요합니다
