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
   * Translate HTML structure with DeepSeek API
   * Preserves HTML structure and translates only text content
   * @param html HTML string to translate
   * @param apiKey DeepSeek API key
   * @param targetLanguage Target language
   * @returns Translation response with translated HTML
   */
  static async translateHTML(
    html: string,
    apiKey: string,
    targetLanguage: string = 'Korean'
  ): Promise<TranslationResponse> {
    if (!apiKey) {
      return {
        translatedText: html,
        success: false,
        error: 'DeepSeek API key is required'
      };
    }

    if (!html || html.trim() === '') {
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
              content: `You are a professional translator. Your task is to translate HTML content to ${targetLanguage}.

CRITICAL RULES:
1. Maintain the EXACT HTML structure - do not add, remove, or modify any HTML tags, attributes, or classes
2. Only translate the text content inside the tags
3. Output ONLY the translated HTML - no explanations, no markdown code blocks, no additional text
4. Preserve all whitespace and formatting exactly as in the original
5. Do not translate HTML attributes or data attributes

SPECIAL RULE FOR SENTENCE GROUPS:
- When you see <div data-sentence-group="N">...</div>, this means ALL cues inside belong to ONE sentence
- The text in these cues is fragmented (split across multiple subtitles)
- You MUST translate them as ONE complete sentence
- Then put the SAME complete translated sentence in EACH cue within that group

Example with sentence groups:
Input:
<div data-sentence-group="0">
  <div data-cue-index="0">I love Tom and</div>
  <div data-cue-index="1">Lilly.</div>
</div>
<div data-sentence-group="1">
  <div data-cue-index="2">How are you?</div>
</div>

Output:
<div data-sentence-group="0">
  <div data-cue-index="0">나는 Tom과 Lilly를 사랑합니다.</div>
  <div data-cue-index="1">나는 Tom과 Lilly를 사랑합니다.</div>
</div>
<div data-sentence-group="1">
  <div data-cue-index="2">어떻게 지내세요?</div>
</div>

Notice: Both cue-index 0 and 1 have the SAME complete translation because they are in the same sentence group.`
            },
            {
              role: 'user',
              content: `Translate the following HTML to ${targetLanguage}. Remember: preserve the EXACT HTML structure, translate only text content:\n\n${html}`
            }
          ],
          temperature: 0.1,
          max_tokens: 8000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 300000
        }
      );

      let translatedHTML = response.data.choices[0]?.message?.content?.trim();

      if (!translatedHTML) {
        throw new Error('Empty response from DeepSeek API');
      }

      // Remove markdown code blocks if DeepSeek added them despite instructions
      translatedHTML = translatedHTML
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      return {
        translatedText: translatedHTML,
        success: true
      };
    } catch (error: any) {
      console.error('[Udemy Translator] DeepSeek HTML translation error:', error);

      let errorMessage = 'Translation failed';
      if (error.response) {
        errorMessage = `DeepSeek API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach DeepSeek API';
      } else {
        errorMessage = error.message || 'Unknown error';
      }

      return {
        translatedText: html,
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
