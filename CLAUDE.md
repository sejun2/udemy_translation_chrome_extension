# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that translates Udemy video subtitles in real-time. It supports three translation methods:
- Chrome built-in translation (no API key required)
- DeepSeek API (cost-effective AI translation)
- Google Gemini API (recommended, free tier available)

## Build & Development Commands

```bash
# Install dependencies
npm install

# Production build (outputs to dist/)
npm run build

# Development build with watch mode
npm run dev

# Generate icons from logo
npm run generate-icons

# Run tests
npm test
npm run test:ui      # Interactive test UI
npm run test:debug   # Debug mode
```

## Loading the Extension

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

## Architecture

### Translation Provider Pattern

The extension uses a **Factory pattern** for translation providers. All translation services implement the `ITranslationProvider` interface:

- `ITranslationProvider` - Interface defining `translateText()`, `translateHTML()`, `getName()`
- `ChromeProvider` - Returns original text (relies on Chrome's native translation)
- `DeepSeekProvider` - Calls DeepSeek API
- `GeminiProvider` - Calls Google Gemini API
- `TranslatorFactory` - Creates appropriate provider based on user config

**To add a new translation API:**
1. Create a new provider class implementing `ITranslationProvider`
2. Add the provider to `TranslatorFactory.createProvider()`
3. Update `TranslationConfig` type to include new engine option
4. Add UI controls in `popup.html` and `popup.ts`

### Core Components

**Content Script (`src/content/content.ts`):**
- Main orchestrator - runs on Udemy course pages
- Opens transcript panel automatically
- Observes transcript panel for active cue changes using `MutationObserver`
- For API-based translation engines, batch translates all cues on load
- Updates caption display in real-time based on active transcript cue
- Adds settings button to video controls for real-time caption customization

**Sentence Merging (`src/utils/sentenceMerger.ts`):**
- Critical for quality: Udemy often splits sentences across multiple caption containers
- Detects incomplete sentences (e.g., ending with "and", "the", "to")
- Groups fragmented cues into complete sentences before translation
- Example: `["I love Tom and", "Lilly."]` → grouped as one sentence

**Translation Flow:**
1. Content script waits for transcript panel to load
2. Extracts all cues: `[data-purpose="transcript-cue"]`
3. Groups cues by sentence using `SentenceMerger.groupCuesBySentence()`
4. Splits groups into batches (10 groups per batch to avoid timeouts)
5. Builds HTML structure with `data-sentence-group` and `data-cue-index` attributes
6. Sends HTML to translation API with instructions to preserve structure
7. Parses translated HTML and applies to DOM
8. Each cue in a group gets the SAME complete translated sentence

**Storage (`src/utils/storage.ts`):**
- Uses `chrome.storage.sync` for cross-device settings sync
- Stores: API keys, translation engine choice, target language, display preferences

**Popup (`src/popup/popup.ts`):**
- Settings UI for user configuration
- Validates API keys before saving
- Triggers page reload when settings change

### Key Implementation Details

**Timeout Handling:**
- HTML translation timeout: 300000ms (5 minutes)
- Batch size: 10 sentence groups per batch
- Batches are processed in parallel using `Promise.all()`

**DOM Observation Strategy:**
- Uses `MutationObserver` to watch for active cue changes
- Debounces updates using `requestAnimationFrame`
- Maintains reference to caption container and transcript panel
- Re-attaches observers if DOM elements are replaced (maintenance loop every 1.5s)

**Caption Display:**
- Injects translated text into `[data-purpose="captions-cue-text"]`
- Supports showing original text above or below translation
- Updates occur without page reload when user changes display settings via video controls

## File Structure

```
src/
├── content/
│   └── content.ts                 # Main content script (runs on Udemy pages)
├── popup/
│   ├── popup.ts                   # Settings UI logic
│   ├── popup.html                 # Settings UI markup
│   └── popup.css                  # Settings UI styles
├── background/
│   └── background.ts              # Service worker (minimal, placeholder)
└── utils/
    ├── types.ts                   # TypeScript interfaces
    ├── storage.ts                 # Chrome storage wrapper
    ├── sentenceMerger.ts          # Sentence grouping logic
    ├── translator.ts              # Main translator class (backward compatibility)
    └── translators/
        ├── ITranslationProvider.ts      # Provider interface
        ├── TranslatorFactory.ts         # Factory for creating providers
        ├── ChromeProvider.ts            # Chrome built-in translation
        ├── DeepSeekProvider.ts          # DeepSeek API
        ├── GeminiProvider.ts            # Google Gemini API
        └── DeepLProvider.ts             # DeepL API (not actively used)

public/
├── manifest.json                  # Chrome extension manifest
├── icon16.png                     # Extension icons (generated)
├── icon48.png
└── icon128.png

scripts/
└── generate-icons.js              # Generates icons from logo1.png
```

## Translation API Prompts

When adding or modifying translation providers, ensure the prompt includes:

1. **Structure preservation:** Must maintain exact HTML structure
2. **Sentence group handling:** Instructions to translate groups as ONE sentence
3. **Output format:** Only translated HTML, no markdown code blocks or explanations
4. **Data attribute preservation:** Do not translate `data-*` attributes

See `GeminiProvider.ts` or `DeepSeekProvider.ts` for reference prompts.

## Testing on Udemy

1. Navigate to any Udemy course video page
2. Open browser console (F12) to see extension logs
3. Logs are prefixed with `[Udemy Translator]`
4. Check for transcript panel detection, cue grouping, and translation status

## Common Issues

**Transcript panel not opening:**
- Check if `[data-purpose="transcript-toggle"]` exists on the page
- Udemy's DOM structure may have changed

**Translations not applying:**
- Verify API key is valid and has credits
- Check browser console for API errors
- Ensure batch size isn't causing timeouts

**Sentence merging incorrect:**
- Review `SentenceMerger.isIncompleteText()` patterns
- Add new incomplete patterns as needed

## Configuration

User settings are stored in `TranslationConfig`:
```typescript
{
  enabled: boolean;
  showOriginal?: boolean;              // Show original text
  originalPosition?: 'above' | 'below'; // Position of original text
  targetLanguage?: string;
  translationEngine?: 'chrome' | 'deepseek' | 'gemini';
  deepseekApiKey?: string;
  geminiApiKey?: string;
}
```
