import { TranslationConfig } from '../utils/types';
import { ATTRIBUTES, CLASSES, IDS, SELECTORS } from '../utils/constants';

export class UIManager {
  private config: TranslationConfig;
  private progressIndicator: HTMLElement | null = null;
  public settingsButton: HTMLElement | null = null;
  public settingsMenu: HTMLElement | null = null;

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: TranslationConfig) {
    this.config = newConfig;
  }

  public getCleanText(container: Element): string {
    const clone = container.cloneNode(true) as Element;
    const translations = clone.querySelectorAll(CLASSES.REMOVAL_CANDIDATE);
    translations.forEach(el => el.remove());
    return clone.textContent?.trim() || '';
  }

  public displayTranscriptText(container: Element, text: string, originalText: string) {
    if (!text) {
      return;
    }

    const currentStyle = window.getComputedStyle(container);
    const baseFontSize = currentStyle.fontSize;

    let translatedDiv = container.querySelector('.' + CLASSES.CAPTION_DISPLAY.TRANSLATED) as HTMLDivElement | null;
    let originalDiv = container.querySelector('.' + CLASSES.CAPTION_DISPLAY.ORIGINAL) as HTMLDivElement | null;

    if (!translatedDiv) {
      translatedDiv = document.createElement('div');
      translatedDiv.className = CLASSES.CAPTION_DISPLAY.TRANSLATED;
      container.innerHTML = ''; // Clear existing content
      container.appendChild(translatedDiv);
    }

    translatedDiv.textContent = text;
    translatedDiv.style.fontSize = baseFontSize;

    const shouldShowOriginal = this.config?.showOriginal ?? true;

    if (shouldShowOriginal && originalText) {
      if (!originalDiv) {
        originalDiv = document.createElement('div');
        originalDiv.className = CLASSES.CAPTION_DISPLAY.ORIGINAL;
      }
      originalDiv.textContent = originalText;
      originalDiv.style.fontSize = `calc(${baseFontSize} * 0.8)`;

      const position = this.config?.originalPosition ?? 'below';
      if (position === 'above') {
        container.insertBefore(originalDiv, translatedDiv);
      } else {
        container.appendChild(originalDiv);
      }
    } else if (originalDiv) {
      originalDiv.remove();
    }
  }

  public showProgressIndicator() {
    if (this.progressIndicator) {
      return;
    }

    const indicator = document.createElement('div');
    indicator.id = IDS.PROGRESS_INDICATOR;
    indicator.innerHTML = `
      <div class="content-wrapper">
        <div class="${CLASSES.SPINNER}"></div>
        <div class="text-wrapper">
          <div class="status">번역 중...</div>
          <div id="${IDS.PROGRESS_TEXT}" class="progress-text">0%</div>
        </div>
      </div>
    `;
    document.body.appendChild(indicator);
    this.progressIndicator = indicator;
  }

  public updateProgressIndicator(completed: number, total: number) {
    if (!this.progressIndicator) {
      return;
    }
    const percentage = Math.round((completed / total) * 100);
    const progressText = this.progressIndicator.querySelector('#' + IDS.PROGRESS_TEXT);
    if (progressText) {
      progressText.textContent = `${completed}/${total} (${percentage}%)`;
    }
  }

  public hideProgressIndicator() {
    if (!this.progressIndicator) {
      return;
    }

    this.progressIndicator.innerHTML = `
      <div class="completion-wrapper">
        <span class="icon">✓</span>
        <span class="text">번역 완료!</span>
      </div>
    `;

    setTimeout(() => {
      if (this.progressIndicator) {
        this.progressIndicator.classList.add('fading-out');
        setTimeout(() => {
          this.progressIndicator?.remove();
          this.progressIndicator = null;
        }, 300);
      }
    }, 2000);
  }

  public addSettingsButton(
      toggleShowOriginal: () => void,
      toggleOriginalPosition: () => void
  ) {
    if (this.settingsButton && document.body.contains(this.settingsButton)) {
      return;
    }

    const controlBar = document.querySelector(SELECTORS.VIDEO.CONTROLS);
    const transcriptToggle = controlBar?.querySelector(SELECTORS.TRANSCRIPT.TOGGLE_BUTTON[0]);

    if (!transcriptToggle?.parentElement) {
      console.warn('[Udemy Translator] Could not find a suitable place to add the settings button.');
      return;
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = CLASSES.SETTINGS_MENU.BUTTON_CONTAINER;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = CLASSES.SETTINGS_MENU.BUTTON;
    button.setAttribute(ATTRIBUTES.DATA_PURPOSE, 'caption-settings-toggle');
    button.innerHTML = `<svg aria-label="자막 설정" role="img" focusable="false" class="ud-icon ud-icon-medium"><use xlink:href="#icon-settings"></use></svg>`;

    const menu = this.createSettingsMenu(toggleShowOriginal, toggleOriginalPosition);

    buttonContainer.appendChild(button);
    buttonContainer.appendChild(menu);
    transcriptToggle.parentElement.insertAdjacentElement('afterend', buttonContainer);

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSettingsMenu();
    });

    document.addEventListener('click', (e) => {
      if (menu.classList.contains('visible') && !buttonContainer.contains(e.target as Node)) {
        this.closeSettingsMenu();
      }
    });

    this.settingsButton = button;
    this.settingsMenu = menu;
    console.log('[Udemy Translator] Settings button added.');
  }

  private createSettingsMenu(
      toggleShowOriginal: () => void,
      toggleOriginalPosition: () => void
  ): HTMLElement {
    const menu = document.createElement('div');
    menu.className = `${CLASSES.SETTINGS_MENU.MENU_CONTAINER} udemy-translator-settings-menu`;

    menu.innerHTML = `
      <div class="header">자막 설정</div>
      <div class="menu-body">
        <button type="button" class="ud-btn ud-btn-medium ud-btn-ghost ud-text-sm ud-block-list-item ud-block-list-item-small ud-block-list-item-neutral" data-action="toggle-original" style="width: 100%; justify-content: flex-start; padding: 8px 16px;">
          <div class="ud-block-list-item-content">
            <span>원본 자막 표시</span>
            <span class="control-bar-dropdown--checkbox-slider--3T-2W"></span>
          </div>
        </button>
        <button type="button" class="ud-btn ud-btn-medium ud-btn-ghost ud-text-sm ud-block-list-item ud-block-list-item-small ud-block-list-item-neutral" data-action="toggle-position" style="width: 100%; justify-content: flex-start; padding: 8px 16px;">
          <div class="ud-block-list-item-content">
            <span>원본 위치</span>
            <span class="position-indicator">아래</span>
          </div>
        </button>
      </div>
    `;

    menu.querySelector(SELECTORS.SETTINGS_MENU.TOGGLE_ORIGINAL_BUTTON)?.addEventListener('click', toggleShowOriginal);
    menu.querySelector(SELECTORS.SETTINGS_MENU.TOGGLE_POSITION_BUTTON)?.addEventListener('click', toggleOriginalPosition);

    return menu;
  }

  public updateMenuState() {
    if (!this.settingsMenu || !this.config) return;

    const toggleButton = this.settingsMenu.querySelector(SELECTORS.SETTINGS_MENU.TOGGLE_ORIGINAL_BUTTON);
    const positionIndicator = this.settingsMenu.querySelector(SELECTORS.SETTINGS_MENU.POSITION_INDICATOR);

    toggleButton?.setAttribute(ATTRIBUTES.ARIA_CHECKED, String(this.config.showOriginal));
    if (positionIndicator) {
      positionIndicator.textContent = this.config.originalPosition === 'above' ? '위' : '아래';
    }
  }

  public toggleSettingsMenu() {
    if (!this.settingsMenu) return;
    this.settingsMenu.classList.toggle('visible');
    if (this.settingsMenu.classList.contains('visible')) {
      this.updateMenuState();
    }
  }

  public closeSettingsMenu() {
    this.settingsMenu?.classList.remove('visible');
  }
  
  public destroy() {
    this.progressIndicator?.remove();
    this.settingsButton?.parentElement?.remove();
    this.settingsMenu?.remove();
    this.progressIndicator = null;
    this.settingsButton = null;
    this.settingsMenu = null;
  }
}
