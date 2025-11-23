import { TranslationConfig } from '../types';
import { ITranslationProvider } from './ITranslationProvider';
import { ChromeProvider } from './ChromeProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { GeminiProvider } from './GeminiProvider';

/**
 * Factory for creating translation providers
 */
export class TranslatorFactory {
  /**
   * Create a translation provider based on config
   * @param config Translation configuration
   * @returns Translation provider instance
   */
  static createProvider(config: TranslationConfig): ITranslationProvider {
    const engine = config.translationEngine || 'chrome';

    switch (engine) {
      case 'deepseek':
        if (!config.deepseekApiKey) {
          console.warn('[Translator Factory] DeepSeek selected but no API key provided, falling back to Chrome');
          return new ChromeProvider();
        }
        return new DeepSeekProvider(config.deepseekApiKey);

      case 'gemini':
        if (!config.geminiApiKey) {
          console.warn('[Translator Factory] Gemini selected but no API key provided, falling back to Chrome');
          return new ChromeProvider();
        }
        return new GeminiProvider(config.geminiApiKey);

      case 'chrome':
      default:
        return new ChromeProvider();
    }
  }
}
