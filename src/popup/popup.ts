import { StorageManager } from '../utils/storage';
import { getMessage, getBrowserLanguage, SupportedLanguage } from '../utils/i18n';

class PopupManager {
  private uiLanguageSelect: HTMLSelectElement;
  private enableToggle: HTMLInputElement;
  private translationEngineSelect: HTMLSelectElement;
  private deepseekApiKeyInput: HTMLInputElement;
  private geminiApiKeyInput: HTMLInputElement;
  private targetLanguageSelect: HTMLSelectElement;
  private deepseekSection: HTMLDivElement;
  private geminiSection: HTMLDivElement;
  private saveButton: HTMLButtonElement;
  private statusDiv: HTMLDivElement;
  private currentLanguage: SupportedLanguage;

  constructor() {
    this.uiLanguageSelect = document.getElementById('uiLanguage') as HTMLSelectElement;
    this.enableToggle = document.getElementById('enableTranslation') as HTMLInputElement;
    this.translationEngineSelect = document.getElementById('translationEngine') as HTMLSelectElement;
    this.deepseekApiKeyInput = document.getElementById('deepseekApiKey') as HTMLInputElement;
    this.geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
    this.targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement;
    this.deepseekSection = document.getElementById('deepseekSection') as HTMLDivElement;
    this.geminiSection = document.getElementById('geminiSection') as HTMLDivElement;
    this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;
    this.currentLanguage = getBrowserLanguage();

    this.init();
  }

  private async init() {
    await this.loadSettings();
    this.localizeUI(this.currentLanguage);
    this.attachEventListeners();
  }

  /**
   * Localize all UI elements with data-i18n attributes
   */
  private localizeUI(language: SupportedLanguage) {
    this.currentLanguage = language;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const message = getMessage(key, language);
        if (message) {
          element.textContent = message;
        }
      }
    });
  }

  private async loadSettings() {
    try {
      const config = await StorageManager.getConfig();

      // Set UI language (use saved language or browser language)
      this.currentLanguage = config.uiLanguage || getBrowserLanguage();
      this.uiLanguageSelect.value = this.currentLanguage;

      this.enableToggle.checked = config.enabled;
      this.translationEngineSelect.value = config.translationEngine ?? 'chrome';
      this.deepseekApiKeyInput.value = config.deepseekApiKey ?? '';
      this.geminiApiKeyInput.value = config.geminiApiKey ?? '';
      this.targetLanguageSelect.value = config.targetLanguage ?? 'Korean';

      this.updateApiSectionVisibility();
    } catch (error) {
      this.showStatus(getMessage('loadSettingsFailed', this.currentLanguage), 'error');
    }
  }

  private attachEventListeners() {
    // UI Language change - update UI immediately
    this.uiLanguageSelect.addEventListener('change', () => {
      const newLanguage = this.uiLanguageSelect.value as SupportedLanguage;
      this.localizeUI(newLanguage);
      this.saveSettings(false);
    });

    this.saveButton.addEventListener('click', () => {
      this.saveSettings(true);
    });

    this.translationEngineSelect.addEventListener('change', () => {
      this.updateApiSectionVisibility();
    });

    [
      this.enableToggle,
      this.translationEngineSelect,
      this.targetLanguageSelect
    ].forEach(el => {
      el.addEventListener('change', () => this.saveSettings(false));
    });

    this.deepseekApiKeyInput.addEventListener('change', () => this.saveSettings(false));
    this.geminiApiKeyInput.addEventListener('change', () => this.saveSettings(false));
  }

  private updateApiSectionVisibility() {
    const engine = this.translationEngineSelect.value;
    this.deepseekSection.style.display = engine === 'deepseek' ? 'block' : 'none';
    this.geminiSection.style.display = engine === 'gemini' ? 'block' : 'none';
  }

  private async saveSettings(refreshTab = false) {
    try {
      const translationEngine = this.translationEngineSelect.value as 'chrome' | 'deepseek' | 'gemini';

      // Validate API keys based on selected engine
      if (translationEngine === 'deepseek' && !this.deepseekApiKeyInput.value.trim()) {
        this.showStatus(getMessage('deepseekKeyRequired', this.currentLanguage), 'error');
        return;
      }

      if (translationEngine === 'gemini' && !this.geminiApiKeyInput.value.trim()) {
        this.showStatus(getMessage('geminiKeyRequired', this.currentLanguage), 'error');
        return;
      }

      const existingConfig = await StorageManager.getConfig();
      const config = {
        ...existingConfig,
        enabled: this.enableToggle.checked,
        translationEngine,
        deepseekApiKey: this.deepseekApiKeyInput.value.trim(),
        geminiApiKey: this.geminiApiKeyInput.value.trim(),
        targetLanguage: this.targetLanguageSelect.value,
        uiLanguage: this.uiLanguageSelect.value as SupportedLanguage
      };

      await StorageManager.saveConfig(config);
      this.showStatus(getMessage('settingsSaved', this.currentLanguage), 'success');

      if (refreshTab) {
        this.reloadActiveUdemyTab();
      }
    } catch (error) {
      this.showStatus(getMessage('settingsSaveFailed', this.currentLanguage), 'error');
    }
  }

  private reloadActiveUdemyTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const activeTab = tabs[0];
      if (!activeTab?.id || !activeTab.url) {
        return;
      }

      if (activeTab.url.includes('udemy.com')) {
        chrome.tabs.reload(activeTab.id);
      }
    });
  }

  private showStatus(message: string, type: 'success' | 'error') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;

    setTimeout(() => {
      this.statusDiv.className = 'status';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
