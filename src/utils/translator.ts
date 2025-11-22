import { TranslationResponse } from './types';

// Stub translator: all API calls are disabled. If mistakenly invoked,
// we simply return the original text to avoid network usage.
export class Translator {
  static async translateWithGoogle(text: string): Promise<TranslationResponse> {
    console.warn('[Udemy Translator] API translation disabled, returning original text.');
    return { translatedText: text, success: true };
  }

  static async translateWithDeepSeek(text: string): Promise<TranslationResponse> {
    console.warn('[Udemy Translator] API translation disabled, returning original text.');
    return { translatedText: text, success: true };
  }
}
