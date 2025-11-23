# Chrome Web Store Listing Information

이 문서는 Chrome 웹 스토어 등록 시 필요한 정보들을 정리한 것입니다.

## 기본 정보

### Extension Name (익스텐션 이름)
```
Udemy Subtitle Translator
```

### Short Description (짧은 설명) - 최대 132자
```
Translate Udemy video subtitles in real-time to your preferred language with Chrome or DeepSeek AI
```

### Detailed Description (상세 설명) - 최대 16,000자

```
📚 Udemy Subtitle Translator - Learn in Your Language

Transform your Udemy learning experience by translating video subtitles in real-time to any language you prefer!

✨ KEY FEATURES

• Real-time Translation: Subtitles are translated instantly as the video plays
• Dual Display: Show both original and translated text side-by-side
• Multiple Translation Engines:
  - Chrome Built-in Translation (Free, no setup required)
  - DeepSeek AI Translation (High quality, requires API key)
• Language Support: Korean, English, Spanish, French, German, Japanese, Chinese, and many more
• Smart Sentence Merging: Handles fragmented subtitles intelligently for accurate translation
• Progress Indicator: See real-time translation progress
• No Data Collection: All settings stored locally on your device

🎯 HOW TO USE

1. Install the extension
2. Go to any Udemy course video
3. Click the extension icon
4. Choose your translation method:
   - Chrome Translation: Enable and start watching immediately
   - DeepSeek Translation: Enter your API key (get one at deepseek.com)
5. Select your target language
6. Enjoy learning in your preferred language!

🔒 PRIVACY & SECURITY

• Your data stays on your device
• API keys stored securely in Chrome's local storage
• No tracking or analytics
• Open source (check our GitHub repository)

💡 PERFECT FOR

• International students learning from English courses
• Professionals taking courses in foreign languages
• Language learners who want to compare original and translated text
• Anyone who wants to learn more comfortably in their native language

🌟 WHY CHOOSE THIS EXTENSION?

Unlike other translation tools, we specifically designed this for Udemy's subtitle system, handling technical challenges like:
- Sentence fragmentation across multiple subtitle containers
- Real-time synchronization with video playback
- Maintaining subtitle timing accuracy
- Preserving formatting and context

📝 NOTE

- DeepSeek API key is optional (free Chrome translation works without it)
- Works only on Udemy course video pages
- Requires internet connection for translation

🔗 LINKS

Privacy Policy: [Your hosted privacy policy URL]
GitHub: [Your GitHub repository URL]
Support: [Your support email or GitHub issues URL]

Start learning without language barriers today! 🚀
```

### Category (카테고리)
```
Education & Productivity
```

### Language (언어)
```
English (또는 Korean - 타겟 사용자에 따라 선택)
```

## 스크린샷 준비 사항

최소 1개, 최대 5개의 스크린샷 필요:
- 크기: 1280×800px 또는 640×400px
- 형식: PNG 또는 JPEG

**권장 스크린샷**:
1. 번역 전/후 비교 화면
2. Popup 설정 화면
3. 진행 상태 표시 화면
4. Chrome vs DeepSeek 번역 비교
5. 다양한 언어로 번역된 화면

## 프로모션 이미지 (선택)

### Small Promotional Tile
- 크기: 440×280px
- 형식: PNG 또는 JPEG
- 용도: Chrome 웹 스토어 featured section

### Marquee Promotional Tile (선택)
- 크기: 1400×560px
- 형식: PNG 또는 JPEG

## 추가 정보

### Official URL (공식 웹사이트)
```
[GitHub repository URL 또는 개인 웹사이트]
```

### Support Email
```
[본인의 이메일 주소]
```

### Privacy Policy URL (필수)
```
[PRIVACY_POLICY.md를 호스팅할 URL]
예: https://github.com/username/repo/blob/main/PRIVACY_POLICY.md
```

## 심사 참고사항

### Permissions Justification (권한 사용 정당화)

**storage**
```
Used to save user preferences (language settings, API keys, display options) locally on the user's device.
```

**activeTab**
```
Required to access and modify Udemy subtitle elements on the active tab for real-time translation.
```

**tabs**
```
Used to reload the Udemy tab when settings are changed, ensuring translations are properly applied.
```

**host_permissions (https://www.udemy.com/*)**
```
Extension only works on Udemy course pages. Required to inject translation functionality into Udemy's subtitle system.
```

### Single Purpose Description
```
This extension has a single purpose: to translate Udemy video subtitles in real-time to help users learn in their preferred language.
```

## 출시 전 체크리스트

- [ ] 모든 아이콘 이미지 준비 (16px, 48px, 128px)
- [ ] 스크린샷 최소 1개 준비 (1280×800px)
- [ ] Privacy Policy 온라인 호스팅 (GitHub 또는 개인 웹사이트)
- [ ] manifest.json에 아이콘 경로 추가
- [ ] dist 폴더 압축 (zip 파일 생성)
- [ ] Chrome 개발자 계정 등록 ($5 결제)
- [ ] Store Listing 정보 입력
- [ ] 심사 제출

## 예상 심사 기간

- 보통 1-3일 (빠르면 당일, 늦으면 1주일)
- 거부 시 수정 후 재제출 가능
