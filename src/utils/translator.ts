import { TranslationResponse } from './types';
import axios from 'axios';

export class Translator {
  /**
   * Translate text using DeepSeek API
   * @param text Text to translate
   * @param apiKey DeepSeek API key
   * @param targetLanguage Target language (default: Korean)
   * @returns Translation response
   */
  static async translateWithDeepSeek(
    text: string,
    apiKey: string,
    targetLanguage: string = 'Korean'
  ): Promise<TranslationResponse> {
    if (!apiKey) {
      return {
        translatedText: text,
        success: false,
        error: 'DeepSeek API key is required'
      };
    }

    if (!text || text.trim() === '') {
      return {
        translatedText: '',
        success: true
      };
    }

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Your task is to translate text to ${targetLanguage}. Rules:
1. Only output the translated text, nothing else
2. Do not add explanations, notes, or commentary
3. Preserve the original meaning and tone
4. Keep formatting as close to the original as possible`
            },
            {
              role: 'user',
              content: `Translate this to ${targetLanguage}:\n\n${text}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000
        }
      );

      const translatedText = response.data.choices[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('Empty response from DeepSeek API');
      }

      return {
        translatedText,
        success: true
      };
    } catch (error: any) {
      console.error('[Udemy Translator] DeepSeek API error:', error);

      let errorMessage = 'Translation failed';
      if (error.response) {
        errorMessage = `DeepSeek API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach DeepSeek API';
      } else {
        errorMessage = error.message || 'Unknown error';
      }

      return {
        translatedText: text,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Chrome translation fallback (no API call)
   * @param text Text to return as-is
   * @returns Original text
   */
  static async translateWithChrome(text: string): Promise<TranslationResponse> {
    console.log('[Udemy Translator] Using Chrome built-in translation');
    return {
      translatedText: text,
      success: true
    };
  }
}
