import { TranslationConfig, StorageData } from './types';

export class StorageManager {
  private static readonly CONFIG_KEY = 'translationConfig';

  static async getConfig(): Promise<TranslationConfig> {
    const defaultConfig: TranslationConfig = {
      enabled: false,
      showOriginal: true,
      originalPosition: 'below'
    };

    try {
      const result = await chrome.storage.sync.get(this.CONFIG_KEY);
      return result[this.CONFIG_KEY] || defaultConfig;
    } catch (error) {
      console.error('Failed to get config:', error);
      return defaultConfig;
    }
  }

  static async saveConfig(config: TranslationConfig): Promise<void> {
    try {
      await chrome.storage.sync.set({ [this.CONFIG_KEY]: config });
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  static async updateConfig(updates: Partial<TranslationConfig>): Promise<void> {
    const config = await this.getConfig();
    const newConfig = { ...config, ...updates };
    await this.saveConfig(newConfig);
  }
}
