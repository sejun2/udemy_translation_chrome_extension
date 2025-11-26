import { StorageManager } from '../utils/storage';

class PopupManager {
  private enableToggle: HTMLInputElement;
  private translationEngineSelect: HTMLSelectElement;
  private deepseekApiKeyInput: HTMLInputElement;
  private geminiApiKeyInput: HTMLInputElement;
  private targetLanguageSelect: HTMLSelectElement;
  private deepseekSection: HTMLDivElement;
  private geminiSection: HTMLDivElement;
  private saveButton: HTMLButtonElement;
  private statusDiv: HTMLDivElement;

  constructor() {
    this.enableToggle = document.getElementById('enableTranslation') as HTMLInputElement;
    this.translationEngineSelect = document.getElementById('translationEngine') as HTMLSelectElement;
    this.deepseekApiKeyInput = document.getElementById('deepseekApiKey') as HTMLInputElement;
    this.geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
    this.targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement;
    this.deepseekSection = document.getElementById('deepseekSection') as HTMLDivElement;
    this.geminiSection = document.getElementById('geminiSection') as HTMLDivElement;
    this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLDivElement;

    this.init();
  }

  private async init() {
    await this.loadSettings();
    this.attachEventListeners();
  }

  private async loadSettings() {
    try {
      const config = await StorageManager.getConfig();

      this.enableToggle.checked = config.enabled;
      this.translationEngineSelect.value = config.translationEngine ?? 'chrome';
      this.deepseekApiKeyInput.value = config.deepseekApiKey ?? '';
      this.geminiApiKeyInput.value = config.geminiApiKey ?? '';
      this.targetLanguageSelect.value = config.targetLanguage ?? 'Korean';

      this.updateApiSectionVisibility();
    } catch (error) {
      this.showStatus('Failed to load settings', 'error');
    }
  }

  private attachEventListeners() {
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
        this.showStatus('DeepSeek API 키를 입력해주세요.', 'error');
        return;
      }

      if (translationEngine === 'gemini' && !this.geminiApiKeyInput.value.trim()) {
        this.showStatus('Gemini API 키를 입력해주세요.', 'error');
        return;
      }

      const existingConfig = await StorageManager.getConfig();
      const config = {
        ...existingConfig,
        enabled: this.enableToggle.checked,
        translationEngine,
        deepseekApiKey: this.deepseekApiKeyInput.value.trim(),
        geminiApiKey: this.geminiApiKeyInput.value.trim(),
        targetLanguage: this.targetLanguageSelect.value
      };

      await StorageManager.saveConfig(config);
      this.showStatus('설정이 저장되었습니다.', 'success');

      if (refreshTab) {
        this.reloadActiveUdemyTab();
      }
    } catch (error) {
      this.showStatus('설정 저장에 실패했습니다.', 'error');
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
