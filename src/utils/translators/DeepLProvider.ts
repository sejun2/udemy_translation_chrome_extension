import { TranslationResponse } from '../types';
import { ITranslationProvider } from './ITranslationProvider';
import axios from 'axios';

/**
 * DeepL translation provider
 */
export class DeepLProvider implements ITranslationProvider {
  private apiKey: string;
  private isFreeApi: boolean;

  constructor(apiKey: string, isFreeApi: boolean = false) {
    this.apiKey = apiKey;
    this.isFreeApi = isFreeApi;
  }

  getName(): string {
    return 'DeepL';
  }

  /**
   * Get the appropriate DeepL API endpoint
   */
  private getApiEndpoint(): string {
    return this.isFreeApi
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2';
  }

  /**
   * Map language codes to DeepL format
   */
  private mapLanguageCode(language: string): string {
    const languageMap: { [key: string]: string } = {
      'Korean': 'KO',
      'English': 'EN',
      'Japanese': 'JA',
      'Chinese': 'ZH',
      'Spanish': 'ES',
      'French': 'FR',
      'German': 'DE',
      'Italian': 'IT',
      'Portuguese': 'PT',
      'Russian': 'RU',
      'Dutch': 'NL',
      'Polish': 'PL'
    };

    return languageMap[language] || language.toUpperCase();
  }

  async translateText(text: string, targetLanguage: string): Promise<TranslationResponse> {
    if (!this.apiKey) {
      return {
        translatedText: text,
        success: false,
        error: 'DeepL API key is required'
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
        `${this.getApiEndpoint()}/translate`,
        {
          text: [text],
          target_lang: this.mapLanguageCode(targetLanguage)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `DeepL-Auth-Key ${this.apiKey}`
          },
          timeout: 10000
        }
      );

      const translatedText = response.data.translations[0]?.text;

      if (!translatedText) {
        throw new Error('Empty response from DeepL API');
      }

      return {
        translatedText,
        success: true
      };
    } catch (error: any) {
      console.error('[DeepL Provider] Translation error:', error);

      let errorMessage = 'Translation failed';
      if (error.response) {
        errorMessage = `DeepL API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach DeepL API';
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
        error: 'DeepL API key is required'
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
        `${this.getApiEndpoint()}/translate`,
        {
          text: [html],
          target_lang: this.mapLanguageCode(targetLanguage),
          tag_handling: 'html',
          preserve_formatting: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `DeepL-Auth-Key ${this.apiKey}`
          },
          timeout: 300000
        }
      );

      const translatedHTML = response.data.translations[0]?.text;

      if (!translatedHTML) {
        throw new Error('Empty response from DeepL API');
      }

      // DeepL preserves HTML structure, but we need to handle sentence groups
      // Parse and ensure complete sentences are in each cue of a group
      return {
        translatedText: this.postProcessHTML(translatedHTML),
        success: true
      };
    } catch (error: any) {
      console.error('[DeepL Provider] HTML translation error:', error);

      let errorMessage = 'Translation failed';
      if (error.response) {
        errorMessage = `DeepL API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach DeepL API';
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
   * Post-process HTML to ensure sentence groups have complete translations in each cue
   */
  private postProcessHTML(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sentenceGroups = doc.querySelectorAll('[data-sentence-group]');

    sentenceGroups.forEach(groupDiv => {
      const cuesInGroup = Array.from(groupDiv.querySelectorAll('[data-cue-index]'));

      if (cuesInGroup.length === 0) return;

      // Collect all text fragments in this group
      const fragments = cuesInGroup.map(cue => cue.textContent?.trim() || '');

      // Combine fragments to get the complete translation
      // DeepL should have already translated them as a connected sentence
      const completeTranslation = fragments.join(' ').trim();

      // Put the complete translation in each cue
      cuesInGroup.forEach(cue => {
        cue.textContent = completeTranslation;
      });
    });

    return doc.body.innerHTML;
  }
}
