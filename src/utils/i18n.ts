/**
 * i18n utility for manual language selection
 * Chrome extension's chrome.i18n.getMessage() only uses browser locale,
 * so we need custom implementation for user-selectable UI language
 */

export type SupportedLanguage = 'ko' | 'ja' | 'zh' | 'en';

interface Messages {
  [key: string]: string;
}

const translations: Record<SupportedLanguage, Messages> = {
  ko: {
    extName: "Udemy 자막 번역기",
    extDescription: "AI 번역 API를 사용하여 Udemy 자막을 실시간으로 번역합니다",
    enableTranslation: "번역 기능 활성화",
    translationMethod: "번역 방식",
    chromeBuiltin: "크롬 내장 번역",
    deepseekAPI: "DeepSeek API",
    geminiAPI: "Google Gemini API",
    deepseekApiKey: "DeepSeek API 키",
    geminiApiKey: "Google Gemini API 키",
    apiKeySafe: "API 키는 안전하게 저장됩니다.",
    getApiKey: "API 키 받기",
    targetLanguage: "번역 언어",
    saveNote: "설정 저장 시 현재 Udemy 탭이 새로고침됩니다.",
    captionSettingNote: "자막 표시 설정은 비디오 플레이어의 설정 아이콘에서 조정할 수 있습니다.",
    saveButton: "저장",
    loadSettingsFailed: "설정을 불러오는데 실패했습니다",
    deepseekKeyRequired: "DeepSeek API 키를 입력해주세요.",
    geminiKeyRequired: "Gemini API 키를 입력해주세요.",
    settingsSaved: "설정이 저장되었습니다.",
    settingsSaveFailed: "설정 저장에 실패했습니다.",
    translating: "번역 중...",
    translationComplete: "번역 완료!",
    captionSettings: "자막 설정",
    showOriginal: "원본 자막 표시",
    originalPosition: "원본 위치",
    above: "위",
    below: "아래",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    languageFrench: "Français",
    uiLanguage: "UI 언어"
  },
  ja: {
    extName: "Udemy字幕翻訳",
    extDescription: "AI翻訳APIを使用してUdemy字幕をリアルタイムで翻訳します",
    enableTranslation: "翻訳機能を有効にする",
    translationMethod: "翻訳方式",
    chromeBuiltin: "Chrome内蔵翻訳",
    deepseekAPI: "DeepSeek API",
    geminiAPI: "Google Gemini API",
    deepseekApiKey: "DeepSeek APIキー",
    geminiApiKey: "Google Gemini APIキー",
    apiKeySafe: "APIキーは安全に保存されます。",
    getApiKey: "APIキーを取得",
    targetLanguage: "翻訳言語",
    saveNote: "設定を保存すると、現在のUdemyタブが更新されます。",
    captionSettingNote: "字幕表示設定は、ビデオプレーヤーの設定アイコンから調整できます。",
    saveButton: "保存",
    loadSettingsFailed: "設定の読み込みに失敗しました",
    deepseekKeyRequired: "DeepSeek APIキーを入力してください。",
    geminiKeyRequired: "Gemini APIキーを入力してください。",
    settingsSaved: "設定が保存されました。",
    settingsSaveFailed: "設定の保存に失敗しました。",
    translating: "翻訳中...",
    translationComplete: "翻訳完了！",
    captionSettings: "字幕設定",
    showOriginal: "原文字幕を表示",
    originalPosition: "原文の位置",
    above: "上",
    below: "下",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    languageFrench: "Français",
    uiLanguage: "UI言語"
  },
  zh: {
    extName: "Udemy字幕翻译",
    extDescription: "使用AI翻译API实时翻译Udemy字幕",
    enableTranslation: "启用翻译功能",
    translationMethod: "翻译方式",
    chromeBuiltin: "Chrome内置翻译",
    deepseekAPI: "DeepSeek API",
    geminiAPI: "Google Gemini API",
    deepseekApiKey: "DeepSeek API密钥",
    geminiApiKey: "Google Gemini API密钥",
    apiKeySafe: "API密钥将被安全存储。",
    getApiKey: "获取API密钥",
    targetLanguage: "翻译语言",
    saveNote: "保存设置后，当前Udemy标签页将会刷新。",
    captionSettingNote: "字幕显示设置可在视频播放器的设置图标中调整。",
    saveButton: "保存",
    loadSettingsFailed: "加载设置失败",
    deepseekKeyRequired: "请输入DeepSeek API密钥。",
    geminiKeyRequired: "请输入Gemini API密钥。",
    settingsSaved: "设置已保存。",
    settingsSaveFailed: "保存设置失败。",
    translating: "翻译中...",
    translationComplete: "翻译完成！",
    captionSettings: "字幕设置",
    showOriginal: "显示原文字幕",
    originalPosition: "原文位置",
    above: "上方",
    below: "下方",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    languageFrench: "Français",
    uiLanguage: "UI语言"
  },
  en: {
    extName: "Udemy Subtitle Translator",
    extDescription: "Translate Udemy subtitles in real-time using AI translation APIs",
    enableTranslation: "Enable Translation",
    translationMethod: "Translation Method",
    chromeBuiltin: "Chrome Built-in Translation",
    deepseekAPI: "DeepSeek API",
    geminiAPI: "Google Gemini API",
    deepseekApiKey: "DeepSeek API Key",
    geminiApiKey: "Google Gemini API Key",
    apiKeySafe: "API keys are stored securely.",
    getApiKey: "Get API Key",
    targetLanguage: "Target Language",
    saveNote: "The current Udemy tab will refresh when settings are saved.",
    captionSettingNote: "Caption display settings can be adjusted from the settings icon in the video player.",
    saveButton: "Save",
    loadSettingsFailed: "Failed to load settings",
    deepseekKeyRequired: "Please enter your DeepSeek API key.",
    geminiKeyRequired: "Please enter your Gemini API key.",
    settingsSaved: "Settings saved successfully.",
    settingsSaveFailed: "Failed to save settings.",
    translating: "Translating...",
    translationComplete: "Translation Complete!",
    captionSettings: "Caption Settings",
    showOriginal: "Show Original Subtitle",
    originalPosition: "Original Position",
    above: "Above",
    below: "Below",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    languageFrench: "Français",
    uiLanguage: "UI Language"
  }
};

/**
 * Get browser's default language
 */
export function getBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

/**
 * Get translated message for given key and language
 */
export function getMessage(key: string, language?: SupportedLanguage): string {
  const lang = language || getBrowserLanguage();
  return translations[lang]?.[key] || translations.en[key] || key;
}

/**
 * Get all messages for given language
 */
export function getMessages(language?: SupportedLanguage): Messages {
  const lang = language || getBrowserLanguage();
  return translations[lang] || translations.en;
}
