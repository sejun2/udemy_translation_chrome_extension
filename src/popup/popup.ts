import { StorageManager } from '../utils/storage';

class PopupManager {
  private enableToggle: HTMLInputElement;
  private showOriginalToggle: HTMLInputElement;
  private originalPositionSelect: HTMLSelectElement;
  private saveButton: HTMLButtonElement;
  private statusDiv: HTMLDivElement;

  constructor() {
    this.enableToggle = document.getElementById('enableTranslation') as HTMLInputElement;
    this.showOriginalToggle = document.getElementById('showOriginal') as HTMLInputElement;
    this.originalPositionSelect = document.getElementById('originalPosition') as HTMLSelectElement;
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
      this.showOriginalToggle.checked = config.showOriginal ?? true;
      this.originalPositionSelect.value = config.originalPosition ?? 'below';
    } catch (error) {
      this.showStatus('Failed to load settings', 'error');
    }
  }

  private attachEventListeners() {
    this.saveButton.addEventListener('click', () => {
      this.saveSettings(true);
    });

    [this.enableToggle, this.showOriginalToggle, this.originalPositionSelect].forEach(el => {
      el.addEventListener('change', () => this.saveSettings(true));
    });
  }

  private async saveSettings(refreshTab = false) {
    try {
      const existingConfig = await StorageManager.getConfig();
      const config = {
        ...existingConfig,
        enabled: this.enableToggle.checked,
        showOriginal: this.showOriginalToggle.checked,
        originalPosition: this.originalPositionSelect.value as 'above' | 'below'
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
