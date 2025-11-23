import { TranslationResponse } from '../types';
import { ITranslationProvider } from './ITranslationProvider';

/**
 * Chrome built-in translation provider (fallback)
 * This doesn't actually translate but returns original text
 * Relies on Chrome's native subtitle translation feature
 */
export class ChromeProvider implements ITranslationProvider {
  getName(): string {
    return 'Chrome Built-in';
  }

  async translateText(text: string, targetLanguage: string): Promise<TranslationResponse> {
    console.log('[Chrome Provider] Using Chrome built-in translation');
    return {
      translatedText: text,
      success: true
    };
  }

  async translateHTML(html: string, targetLanguage: string): Promise<TranslationResponse> {
    console.log('[Chrome Provider] Using Chrome built-in translation');
    return {
      translatedText: html,
      success: true
    };
  }
}
