import { TranslationResponse } from '../types';

/**
 * Translation provider interface
 * All translation services must implement this interface
 */
export interface ITranslationProvider {
  /**
   * Translate plain text
   * @param text Text to translate
   * @param targetLanguage Target language
   * @returns Translation response
   */
  translateText(text: string, targetLanguage: string): Promise<TranslationResponse>;

  /**
   * Translate HTML structure while preserving tags
   * @param html HTML string to translate
   * @param targetLanguage Target language
   * @returns Translation response with translated HTML
   */
  translateHTML(html: string, targetLanguage: string): Promise<TranslationResponse>;

  /**
   * Get the name of the translation provider
   */
  getName(): string;
}
