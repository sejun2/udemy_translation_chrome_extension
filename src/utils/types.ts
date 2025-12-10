export interface TranslationConfig {
  enabled: boolean;
  showOriginal?: boolean;
  originalPosition?: 'above' | 'below';
  targetLanguage?: string;
  translationEngine?: 'chrome' | 'deepseek' | 'gemini';
  deepseekApiKey?: string;
  geminiApiKey?: string;
  uiLanguage?: 'ko' | 'ja' | 'zh' | 'en';
}

export interface StorageData {
  config: TranslationConfig;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  engine: 'google' | 'deepseek';
}

export interface TranslationResponse {
  translatedText: string;
  success: boolean;
  error?: string;
}
