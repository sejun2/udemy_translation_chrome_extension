import { TranslationResponse, TranslationConfig } from './types';
import { ITranslationProvider } from './translators/ITranslationProvider';
import { TranslatorFactory } from './translators/TranslatorFactory';

/**
 * Main Translator class that delegates to specific providers
 * This maintains backward compatibility with existing code
 */
export class Translator {
  /**
   * Translate HTML using the configured provider
   * @param html HTML string to translate
   * @param apiKey API key (for backward compatibility, prefer using config)
   * @param targetLanguage Target language
   * @param config Optional translation config to determine provider
   * @returns Translation response
   */
  static async translateHTML(
    html: string,
    apiKey: string,
    targetLanguage: string = 'Korean',
    config?: TranslationConfig
  ): Promise<TranslationResponse> {
    let provider: ITranslationProvider;

    if (config) {
      provider = TranslatorFactory.createProvider(config);
    } else {
      // Backward compatibility: assume DeepSeek if apiKey is provided
      const { DeepSeekProvider } = await import('./translators/DeepSeekProvider');
      provider = new DeepSeekProvider(apiKey);
    }

    return provider.translateHTML(html, targetLanguage);
  }

  /**
   * Translate text using the configured provider
   * @param text Text to translate
   * @param apiKey API key (for backward compatibility)
   * @param targetLanguage Target language
   * @param config Optional translation config to determine provider
   * @returns Translation response
   */
  static async translateText(
    text: string,
    apiKey: string,
    targetLanguage: string = 'Korean',
    config?: TranslationConfig
  ): Promise<TranslationResponse> {
    let provider: ITranslationProvider;

    if (config) {
      provider = TranslatorFactory.createProvider(config);
    } else {
      // Backward compatibility: assume DeepSeek if apiKey is provided
      const { DeepSeekProvider } = await import('./translators/DeepSeekProvider');
      provider = new DeepSeekProvider(apiKey);
    }

    return provider.translateText(text, targetLanguage);
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  static async translateWithDeepSeek(
    text: string,
    apiKey: string,
    targetLanguage: string = 'Korean'
  ): Promise<TranslationResponse> {
    return this.translateText(text, apiKey, targetLanguage);
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  static async translateWithChrome(text: string): Promise<TranslationResponse> {
    const { ChromeProvider } = await import('./translators/ChromeProvider');
    const provider = new ChromeProvider();
    return provider.translateText(text, 'Korean');
  }
}
