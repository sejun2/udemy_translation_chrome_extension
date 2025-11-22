# Testing Checklist - Udemy Translation Extension

## 🎯 Pre-Test Setup

### 1. Load Extension
- [ ] Open Chrome: `chrome://extensions/`
- [ ] Enable "Developer mode" (top right)
- [ ] Click "Load unpacked"
- [ ] Select `/Users/imsejun/Documents/udemy_translation/dist` folder
- [ ] Verify extension appears with green toggle ON

### 2. Configure Settings
- [ ] Click extension icon in toolbar
- [ ] Enable Translation toggle: **ON**
- [ ] Set Target Language: **한국어 (Korean)**
- [ ] Select Translation Engine: **Google** or **DeepSeek**
- [ ] Enter valid API key
- [ ] Click **Save Settings**
- [ ] Check console for "Settings saved successfully"

## 🧪 Core Functionality Tests

### Test 1: Transcript Panel Auto-Open
**URL**: `https://www.udemy.com/course/[any-course]/learn/lecture/[any-lecture]`

**Steps**:
1. Navigate to Udemy lecture page
2. Open DevTools (F12) → Console tab
3. Wait for page load

**Expected Console Logs**:
```
[Udemy Translator] Initializing with transcript panel strategy...
[Udemy Translator] Current URL: https://www.udemy.com/...
[Udemy Translator] Config loaded: {enabled: true, ...}
[Udemy Translator] Checking transcript panel...
[Udemy Translator] Opening transcript panel... (if closed)
[Udemy Translator] Transcript panel already open (if open)
```

**Visual Check**:
- [ ] Transcript panel is visible on right side
- [ ] List of subtitles/cues is displayed

---

### Test 2: Batch Translation Initiation
**Continue from Test 1**

**Expected Console Logs** (within 5 seconds):
```
[Udemy Translator] Waiting for transcript panel...
[Udemy Translator] Transcript panel found!
[Udemy Translator] Processing transcript items...
[Udemy Translator] Found 50 transcript items (number varies)
[Udemy Translator] Starting batch translation of 50 items...
```

**Visual Check**:
- [ ] Console shows "Found X transcript items" (X > 0)
- [ ] Batch translation starts automatically

---

### Test 3: Real-time Transcript Panel Updates
**Continue from Test 2**

**Expected Console Logs** (progressive):
```
[Udemy Translator] Translating 1/50: "So now that we know..."
[Udemy Translator] ✓ Success: "이제 생명 주기가 무엇인지 알았으니..."
[Udemy Translator] Translating 2/50: "Android apps have..."
[Udemy Translator] ✓ Success: "Android 앱에는..."
...
[Udemy Translator] Batch translation completed! Success: 48, Failed: 2
```

**Visual Check in Transcript Panel** (right sidebar):
- [ ] **IMMEDIATELY** after each "✓ Success" log, check transcript panel
- [ ] Original text appears in default color (black/dark gray)
- [ ] Translated text appears **below** original in **purple** (#5624d0)
- [ ] Translations appear **one by one**, not all at once
- [ ] Margin between original and translation is ~4px
- [ ] Translation font size is slightly smaller (0.9em)

**Example Visual**:
```
┌─────────────────────────────────────┐
│ So now that we know what life...   │ ← Original (black)
│ 이제 생명 주기가 무엇인지 알았으니... │ ← Translation (purple, smaller)
│                                     │
│ Android apps have different...     │ ← Original (black)
│ Android 앱에는 다양한...             │ ← Translation (purple, smaller)
└─────────────────────────────────────┘
```

---

### Test 4: Video Caption Display (Pre-translated)
**Continue from Test 3**

**Steps**:
1. Wait for batch translation to complete (all items)
2. Enable video captions (CC button on video player)
3. Play video

**Expected Console Logs**:
```
[Udemy Translator] Waiting for caption display...
[Udemy Translator] Caption display found!
[Udemy Translator] Active subtitle changed: "So now that we know..."
[Udemy Translator] ⚡ Displaying pre-translated subtitle (instant!)
```

**Visual Check on Video**:
- [ ] **Large, bold, white text**: Translated Korean subtitle
- [ ] **Smaller, faded gray text below**: Original English subtitle
- [ ] Subtitle changes are **instant** (no delay)
- [ ] No "(번역 중...)" indicator appears (because already translated)

**Example Visual**:
```
┌─────────────────────────────────────┐
│         VIDEO PLAYING HERE          │
│                                     │
│  이제 생명 주기가 무엇인지 알았으니,  │ ← Translation (large, bold, white)
│  Android 앱의 생명 주기를 요약해봅시다│
│                                     │
│  So now that we know what life      │ ← Original (small, faded, gray)
│  cycle is, let's summarize...       │
└─────────────────────────────────────┘
```

---

### Test 5: Real-time Caption Updates During Batch
**Requires fresh page load**

**Steps**:
1. Reload Udemy lecture page (Ctrl+R or Cmd+R)
2. Open Console
3. **Immediately** enable video captions (CC)
4. Play video **before** batch translation completes

**Expected Console Logs**:
```
[Udemy Translator] Starting batch translation of 50 items...
[Udemy Translator] Active subtitle changed: "Welcome to this lecture"
[Udemy Translator] ⏳ Translation not ready yet (transcriptItems size: 50, isBatchTranslating: true)
[Udemy Translator] Waiting for translation to complete...
(2 seconds pass)
[Udemy Translator] ✓ Success: "이 강의에 오신 것을 환영합니다"
[Udemy Translator] ✨ Translation now ready, updating display!
```

**Visual Check on Video**:
- [ ] **Initially**: Shows original text + "(번역 중...)" in yellow
- [ ] **After 1-3 seconds**: Switches to translated text (large, bold, white)
- [ ] Original text moves below (small, faded, gray)
- [ ] Transition is smooth without flicker

---

### Test 6: Active Subtitle Synchronization
**Continue from any test with video playing**

**Steps**:
1. Play video for 30 seconds
2. Watch both:
   - Video caption at bottom of video
   - Transcript panel on right side

**Expected Console Logs**:
```
[Udemy Translator] 📍 Active transcript cue changed: "Let's talk about..."
[Udemy Translator] ✓ Translation ready, updating caption display
[Udemy Translator] Active subtitle changed: "Let's talk about..."
[Udemy Translator] ⚡ Displaying pre-translated subtitle (instant!)
```

**Visual Check**:
- [ ] Highlighted item in transcript panel **matches** video caption text
- [ ] As video plays, highlight moves down transcript panel
- [ ] Video caption updates **instantly** when highlight changes
- [ ] Both show same translation simultaneously

---

### Test 7: Language Switch Test
**Steps**:
1. Click extension icon
2. Change Target Language to **日本語 (Japanese)**
3. Click Save Settings
4. Refresh Udemy page
5. Wait for batch translation

**Expected**:
- [ ] Console shows new config with Japanese language
- [ ] Transcript panel shows Japanese translations
- [ ] Video captions show Japanese translations

---

### Test 8: API Switch Test (Google ↔ DeepSeek)
**Steps**:
1. Note current engine (e.g., Google)
2. Click extension icon
3. Switch to other engine (e.g., DeepSeek)
4. Enter valid API key for new engine
5. Save Settings
6. Refresh Udemy page

**Expected**:
- [ ] Translations use new engine (check Network tab)
- [ ] Translations still appear correctly
- [ ] No errors in console

---

### Test 9: Cache Test
**Steps**:
1. Play video for 30 seconds (transcripts get translated)
2. Seek video back to 00:00
3. Play again from start

**Expected Console Logs**:
```
[Udemy Translator] Active subtitle changed: "Welcome to this lecture"
[Udemy Translator] ⚡ Displaying pre-translated subtitle (instant!)
(NO API calls, NO "Translating..." logs)
```

**Visual Check**:
- [ ] Subtitles appear **instantly** (no delay)
- [ ] Network tab shows **no** new API requests
- [ ] Same translations as first playthrough

---

### Test 10: Error Handling Test
**Test 10a: Invalid API Key**

**Steps**:
1. Enter invalid API key (e.g., "invalid123")
2. Save Settings
3. Refresh Udemy page

**Expected Console Logs**:
```
[Udemy Translator] Starting batch translation of 50 items...
[Udemy Translator] Translating 1/50: "..."
[Udemy Translator] Translation failed: (error details)
[Udemy Translator] ✗ Failed to translate
[Udemy Translator] Batch translation completed! Success: 0, Failed: 50
```

**Visual Check**:
- [ ] Original subtitles still display
- [ ] No crashes or infinite loops
- [ ] Clear error messages in console

**Test 10b: Network Offline**

**Steps**:
1. Open DevTools → Network tab
2. Select "Offline" in throttling dropdown
3. Refresh page

**Expected**:
- [ ] Extension loads without crashing
- [ ] Original subtitles still visible
- [ ] Console shows translation errors
- [ ] No infinite retry loops

---

## 🔍 Advanced Checks

### Performance Check
**Open Performance Monitor**:
- DevTools → Performance → Start Recording
- Play video for 60 seconds
- Stop Recording

**Expected**:
- [ ] CPU usage < 20% on average
- [ ] No memory leaks (check Memory tab)
- [ ] Smooth 60fps video playback
- [ ] Subtitle updates don't cause frame drops

### Memory Check
**Steps**:
1. Open DevTools → Memory tab
2. Take heap snapshot (before)
3. Play video for 5 minutes
4. Take heap snapshot (after)
5. Compare

**Expected**:
- [ ] Memory increase < 50MB
- [ ] No detached DOM nodes accumulating
- [ ] `transcriptItems` Map size matches subtitle count (not growing infinitely)

---

## 📊 Success Criteria

All tests must pass with:
- ✅ No JavaScript errors in console
- ✅ All console logs appear in correct order
- ✅ Visual elements match expected appearance
- ✅ Translation quality is acceptable
- ✅ Performance is smooth (no lag or stuttering)

---

## 🐛 Common Issues & Solutions

### Issue: "Transcript panel not found"
**Solution**:
- Ensure you're on a lecture page (URL contains `/learn/lecture/`)
- Wait 10 seconds for page to fully load
- Check if transcript button exists: `document.querySelector('[data-purpose="transcript-toggle"]')`

### Issue: "No subtitle container found"
**Solution**:
- Enable captions (CC button on video player)
- Select English language for captions
- Refresh page

### Issue: Translations appear but video caption doesn't update
**Solution**:
- Check console for `captionContainer` reference
- Verify `[data-purpose="captions-cue-text"]` element exists
- Check if `observeCaptionDisplay()` was called

### Issue: Batch translation stalls
**Solution**:
- Check API key validity
- Check Network tab for 403/401 errors
- Verify internet connection
- Check API quota limits

---

## 📝 Test Results Template

```
=== Test Results ===
Date: 2025-11-23
Tester:
Extension Version: 1.0.0

Test 1: Transcript Panel Auto-Open    [ PASS / FAIL ]
Test 2: Batch Translation Initiation   [ PASS / FAIL ]
Test 3: Real-time Transcript Updates   [ PASS / FAIL ]
Test 4: Video Caption Display          [ PASS / FAIL ]
Test 5: Real-time Caption Updates      [ PASS / FAIL ]
Test 6: Active Subtitle Sync           [ PASS / FAIL ]
Test 7: Language Switch                [ PASS / FAIL ]
Test 8: API Switch                     [ PASS / FAIL ]
Test 9: Cache Test                     [ PASS / FAIL ]
Test 10: Error Handling                [ PASS / FAIL ]

Performance Check:                     [ PASS / FAIL ]
Memory Check:                          [ PASS / FAIL ]

Overall: [ PASS / FAIL ]

Notes:
-
-
```
