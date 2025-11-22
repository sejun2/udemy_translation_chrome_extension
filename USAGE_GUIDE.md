# Udemy Translation Extension - Usage Guide

## Quick Start

### 1. Build and Install

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder

### 3. Get API Keys

#### Option A: Google Translate API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Cloud Translation API"
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "API Key"
6. Copy the API key

#### Option B: DeepSeek API

1. Go to [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

### 4. Configure Extension

1. Click the extension icon in Chrome toolbar
2. Toggle "Enable Translation" ON
3. Select your target language (Korean is default)
4. Choose translation engine (Google or DeepSeek)
5. Paste your API key
6. Click "Save Settings"

### 5. Use on Udemy

1. Go to any Udemy course: `https://www.udemy.com/course/[course-name]/learn/lecture/[lecture-id]`
2. Enable subtitles in the video player (CC button)
3. Translated subtitles will appear automatically!

## Features

### Real-time Translation
- Subtitles are translated as they appear
- Original text shown below translation
- Translation cache for better performance

### Multiple Languages
- Korean (한국어) - Default
- English
- Japanese (日本語)
- Chinese (中文)
- Spanish (Español)
- French (Français)
- German (Deutsch)

### Two Translation Engines

**Google Translate**
- Fast and accurate
- Supports 100+ languages
- Requires Google Cloud API key
- Pay-as-you-go pricing

**DeepSeek AI**
- Context-aware translation
- Natural language output
- Requires DeepSeek API key
- Competitive pricing

## Troubleshooting

### Subtitles not appearing?

1. Make sure extension is enabled
2. Verify API key is correct
3. Check that subtitles are enabled in video player
4. Open DevTools (F12) and check console for errors

### Translation not working?

1. Verify your API key has proper permissions
2. Check that you have API credits/quota remaining
3. Make sure the correct translation engine is selected
4. Try disabling and re-enabling the extension

### Extension not loading?

1. Rebuild the extension: `npm run build`
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension card
4. Check for any errors in the extension details

## Development

### Watch Mode
```bash
npm run dev
```
Changes will be recompiled automatically. Remember to refresh the extension in Chrome.

### Running Tests
```bash
npm test
```

### Test in UI Mode
```bash
npm run test:ui
```

## API Costs

### Google Translate API
- $20 per million characters
- First 500,000 characters per month are free
- [Pricing details](https://cloud.google.com/translate/pricing)

### DeepSeek API
- Varies by model and usage
- Check [DeepSeek Pricing](https://platform.deepseek.com/pricing)

## Privacy & Security

- API keys are stored locally in Chrome's sync storage
- No data is sent to any third-party except the chosen translation API
- Original subtitles are cached locally for performance
- The extension only runs on Udemy lecture pages

## Support

For issues or questions:
- Check the console for error messages
- Review the README.md
- Create an issue on GitHub (if applicable)

## Tips for Best Experience

1. Use Google Translate for general content
2. Use DeepSeek for technical or specialized content
3. Clear cache if translations seem incorrect (disable/enable extension)
4. Choose appropriate target language based on video content
5. Keep API keys secure and don't share them
