# Udemy Subtitle Translator

Chrome extension that translates Udemy video subtitles in real-time using Google Translate API or DeepSeek AI.

## Features

- Real-time subtitle translation on Udemy courses
- Support for multiple languages (Korean, English, Japanese, Chinese, Spanish, French, German)
- Two translation engines: Google Translate and DeepSeek AI
- Simple and intuitive UI for settings
- Displays both original and translated subtitles
- Automatic subtitle detection and translation

## Installation

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Production

1. Build for production:
   ```bash
   npm run build
   ```

2. The extension will be built in the `dist` folder

## Usage

1. Get an API key:
   - **Google Translate**: [Google Cloud Console](https://console.cloud.google.com/)
   - **DeepSeek**: [DeepSeek Platform](https://platform.deepseek.com/)

2. Click the extension icon in Chrome toolbar

3. Configure settings:
   - Enable translation toggle
   - Select target language (Korean is default)
   - Choose translation engine (Google or DeepSeek)
   - Enter your API key
   - Click "Save Settings"

4. Navigate to any Udemy course video

5. Enable subtitles on the video player

6. Translations will appear automatically above the original subtitles

## Development

### Watch mode

```bash
npm run dev
```

### Testing

Run E2E tests with Playwright:

```bash
npm test
```

Run tests in UI mode:

```bash
npm run test:ui
```

Debug tests:

```bash
npm run test:debug
```

## Project Structure

```
udemy_translation/
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Content script for Udemy pages
│   ├── popup/            # Extension popup UI
│   └── utils/            # Shared utilities
├── tests/
│   └── e2e/             # Playwright E2E tests
├── public/              # Static files (manifest, icons)
└── dist/                # Built extension (generated)
```

## Technologies

- TypeScript
- Chrome Extension Manifest V3
- Webpack
- Playwright (E2E testing)
- Google Translate API
- DeepSeek API

## API Requirements

### Google Translate API

1. Create a project in Google Cloud Console
2. Enable the Cloud Translation API
3. Create credentials (API Key)
4. Copy the API key to the extension settings

### DeepSeek API

1. Sign up at DeepSeek Platform
2. Generate an API key
3. Copy the API key to the extension settings

## Supported Languages

- 한국어 (Korean) - Default
- English
- 日本語 (Japanese)
- 中文 (Chinese)
- Español (Spanish)
- Français (French)
- Deutsch (German)

## License

MIT
