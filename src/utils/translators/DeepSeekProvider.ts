import { TranslationResponse } from '../types';
import { ITranslationProvider } from './ITranslationProvider';

/**
 * DeepSeek translation provider
 */
export class DeepSeekProvider implements ITranslationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'DeepSeek';
  }

  async translateText(text: string, targetLanguage: string): Promise<TranslationResponse> {
    if (!this.apiKey) {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        'https://api.deepseek.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
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
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('Empty response from DeepSeek API');
      }

      return {
        translatedText,
        success: true
      };
    } catch (error: any) {
      console.error('[DeepSeek Provider] Translation error:', error);

      let errorMessage = 'Translation failed';
      if (error.name === 'AbortError') {
        errorMessage = 'Translation timeout';
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

  async translateHTML(html: string, targetLanguage: string): Promise<TranslationResponse> {
    if (!this.apiKey) {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const response = await fetch(
        'https://api.deepseek.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
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
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      let translatedHTML = data.choices[0]?.message?.content?.trim();

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
      console.error('[DeepSeek Provider] HTML translation error:', error);

      let errorMessage = 'Translation failed';
      if (error.name === 'AbortError') {
        errorMessage = 'Translation timeout';
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
}
