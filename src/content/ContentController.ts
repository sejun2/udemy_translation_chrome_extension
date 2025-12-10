import { StorageManager } from '../utils/storage';
import { TranslationConfig } from '../utils/types';
import { Translator } from '../utils/translator';
import { SentenceMerger } from '../utils/sentenceMerger';
import { UIManager } from './UIManager';
import { ObserverManager } from './ObserverManager';
import { waitForElement, waitForAnyElement } from '../utils/dom';
import { ATTRIBUTES, CLASSES, CONFIG, SELECTORS } from '../utils/constants';

class ContentController {
  private config: TranslationConfig | null = null;
  private uiManager: UIManager | null = null;
  private observerManager: ObserverManager | null = null;
  
  private captionContainer: Element | null = null;
  private transcriptPanel: Element | null = null;
  
  private currentActiveText = '';
  private originalCaptionText = '';
  private isTranslating = false;

  async init() {
    console.log('[Udemy Translator] Initializing...');
    this.config = await StorageManager.getConfig();

    if (!this.config.enabled) {
      console.log('[Udemy Translator] Disabled.');
      return;
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.translationConfig) {
        this.handleConfigChange(changes.translationConfig.newValue);
      }
    });

    this.start();
  }

  private handleConfigChange(newConfig: TranslationConfig) {
    console.log('[Udemy Translator] Config updated:', newConfig);
    const wasEnabled = this.config?.enabled;
    this.config = newConfig;

    if (!wasEnabled && newConfig.enabled) {
      this.start();
    } else if (wasEnabled && !newConfig.enabled) {
      this.destroy();
    } else {
      this.uiManager?.updateConfig(newConfig);
      this.uiManager?.updateMenuState();
    }
  }

  private async start() {
    console.log('[Udemy Translator] Starting...');
    if (!this.config) return;

    this.uiManager = new UIManager(this.config);
    this.observerManager = new ObserverManager({
      onActiveCueChange: this.handleActiveCueChange.bind(this),
      onCaptionContainerReady: (container) => {
        this.captionContainer = container;
        this.observerManager?.setIsUpdatingCaption(true);
        this.uiManager?.displayTranscriptText(container, this.currentActiveText, this.originalCaptionText);
        this.observerManager?.setIsUpdatingCaption(false);
      }
    });

    try {
      await this.ensureTranscriptPanelOpen();
      
      this.transcriptPanel = await waitForElement(SELECTORS.TRANSCRIPT.PANEL);
      console.log('[Udemy Translator] Transcript panel found.');
      
      this.observerManager.observeTranscriptPanel(this.transcriptPanel);
      this.processTranscriptPanel(this.transcriptPanel);

      const captionContainer = await waitForElement(SELECTORS.CAPTION.CONTAINER);
      console.log('[Udemy Translator] Caption container found.');
      this.observerManager.observeCaptionDisplay(captionContainer);

      this.uiManager.addSettingsButton(
          this.toggleShowOriginal.bind(this),
          this.toggleOriginalPosition.bind(this)
      );

    } catch (error) {
      console.error('[Udemy Translator] Initialization failed:', error);
      this.destroy();
    }
  }

  private handleActiveCueChange(activeText: string, originalText: string) {
    if (activeText !== this.currentActiveText) {
        this.currentActiveText = activeText;
        this.originalCaptionText = originalText;
        console.log(`[Udemy Translator] 📍 Active cue: "${activeText.substring(0, 50)}..."`);
        if (this.captionContainer) {
            this.observerManager?.setIsUpdatingCaption(true);
            this.uiManager?.displayTranscriptText(this.captionContainer, activeText, originalText);
            this.observerManager?.setIsUpdatingCaption(false);
        }
    }
  }

  private async ensureTranscriptPanelOpen() {
    try {
        const transcriptButton = await waitForAnyElement(SELECTORS.TRANSCRIPT.TOGGLE_BUTTON) as HTMLButtonElement;
        if (transcriptButton.getAttribute(ATTRIBUTES.ARIA_EXPANDED) !== 'true') {
            console.log('[Udemy Translator] Opening transcript panel...');
            transcriptButton.click();
        } else {
            console.log('[Udemy Translator] Transcript panel already open.');
        }
    } catch (error) {
        console.warn('[Udemy Translator] Transcript toggle button not found. Assuming panel is open or will open.');
    }
  }

  private async processTranscriptPanel(panel: Element) {
    const apiEngines = ['deepseek', 'gemini'];
    if (this.config?.translationEngine && apiEngines.includes(this.config.translationEngine) && !this.isTranslating) {
      this.isTranslating = true;
      this.uiManager?.showProgressIndicator();
      await this.translateTranscriptPanel(panel);
      this.isTranslating = false;
      this.uiManager?.hideProgressIndicator();
    }
  }
  
  private async translateTranscriptPanel(panel: Element) {
    const apiKey = this.config?.deepseekApiKey || this.config?.geminiApiKey;
    if (!apiKey || !this.config?.targetLanguage) {
      console.warn('[Udemy Translator] API key or target language not configured');
      return;
    }
    
    const allCues = Array.from(panel.querySelectorAll(SELECTORS.TRANSCRIPT.CUE));
    if (allCues.length === 0) return;

    console.log(`[Udemy Translator] Found ${allCues.length} cues to translate.`);
    const groupedCues = SentenceMerger.groupCuesBySentence(allCues);
    const batches: typeof groupedCues[] = [];
    for (let i = 0; i < groupedCues.length; i += CONFIG.TRANSLATION_BATCH_SIZE) {
      batches.push(groupedCues.slice(i, i + CONFIG.TRANSLATION_BATCH_SIZE));
    }

    let completedBatches = 0;
    this.uiManager?.updateProgressIndicator(completedBatches, batches.length);
    
    const batchPromises = batches.map((batch, batchIndex) =>
      this.translateBatch(batch, batchIndex * CONFIG.TRANSLATION_BATCH_SIZE).then(() => {
        completedBatches++;
        this.uiManager?.updateProgressIndicator(completedBatches, batches.length);
      })
    );

    await Promise.all(batchPromises);
    console.log('[Udemy Translator] All batches translated.');
  }

  private async translateBatch(groupedCues: { cues: Element[], text: string }[], startGroupIndex: number) {
    const htmlParts: string[] = [];
    const cueToTranslationMap = new Map<Element, { groupIndex: number, cueIndexInGroup: number }>();

    groupedCues.forEach((group, groupIndex) => {
      const actualGroupIndex = startGroupIndex + groupIndex;
      htmlParts.push(`<div ${ATTRIBUTES.DATA_SENTENCE_GROUP}="${actualGroupIndex}">`);
      group.cues.forEach((cue, cueIndexInGroup) => {
        const cueTextElement = cue.querySelector(SELECTORS.TRANSCRIPT.CUE_TEXT);
        if (cueTextElement) {
          const originalText = cueTextElement.textContent || '';
          if (!cueTextElement.getAttribute(ATTRIBUTES.DATA_ORIGINAL_TEXT)) {
            cueTextElement.setAttribute(ATTRIBUTES.DATA_ORIGINAL_TEXT, originalText);
          }
          htmlParts.push(`<div ${ATTRIBUTES.DATA_CUE_INDEX}="${cueIndexInGroup}">${originalText}</div>`);
          cueToTranslationMap.set(cue, { groupIndex: actualGroupIndex, cueIndexInGroup });
        }
      });
      htmlParts.push(`</div>`);
    });

    try {
      const result = await Translator.translateHTML(htmlParts.join(''), this.config!.deepseekApiKey || this.config!.geminiApiKey || '', this.config!.targetLanguage || 'Korean', this.config!);
      if (!result.success || !result.translatedText) throw new Error(result.error);

      const parser = new DOMParser();
      const doc = parser.parseFromString(result.translatedText, 'text/html');
      doc.querySelectorAll(`[${ATTRIBUTES.DATA_SENTENCE_GROUP}]`).forEach(groupDiv => {
        const groupIndex = parseInt(groupDiv.getAttribute(ATTRIBUTES.DATA_SENTENCE_GROUP) || '-1', 10);
        if (groupIndex < 0) return;
        const firstCue = groupDiv.querySelector(`[${ATTRIBUTES.DATA_CUE_INDEX}]`);
        const fullTranslation = firstCue?.textContent?.trim() || '';

        cueToTranslationMap.forEach((info, cue) => {
          if (info.groupIndex === groupIndex) {
            const cueTextElement = cue.querySelector(SELECTORS.TRANSCRIPT.CUE_TEXT);
            if (cueTextElement) {
              const originalText = cueTextElement.getAttribute(ATTRIBUTES.DATA_ORIGINAL_TEXT) || '';

              // Clear existing content
              cueTextElement.innerHTML = '';

              // Create and append translated text div
              const translatedDiv = document.createElement('div');
              translatedDiv.className = CLASSES.TRANSCRIPT_CUE.TRANSLATION;
              translatedDiv.textContent = fullTranslation;
              cueTextElement.appendChild(translatedDiv);

              // If showOriginal is enabled, create and append original text div
              if (this.config?.showOriginal) {
                const originalDiv = document.createElement('div');
                originalDiv.className = CLASSES.TRANSCRIPT_CUE.ORIGINAL;
                originalDiv.textContent = originalText;
                cueTextElement.appendChild(originalDiv);
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('[Udemy Translator] Batch translation error:', error);
      // Mark cues in this batch as failed
    }
  }
  
  private async toggleShowOriginal() {
    if (!this.config) return;
    this.config.showOriginal = !this.config.showOriginal;
    await StorageManager.saveConfig(this.config);
    this.uiManager?.updateConfig(this.config);
    this.uiManager?.updateMenuState();
    if(this.captionContainer) {
        this.observerManager?.setIsUpdatingCaption(true);
        this.uiManager?.displayTranscriptText(this.captionContainer, this.currentActiveText, this.originalCaptionText);
        this.observerManager?.setIsUpdatingCaption(false);
    }
    console.log(`[Udemy Translator] Show original: ${this.config.showOriginal}`);
  }

  private async toggleOriginalPosition() {
    if (!this.config) return;
    this.config.originalPosition = this.config.originalPosition === 'above' ? 'below' : 'above';
    await StorageManager.saveConfig(this.config);
    this.uiManager?.updateConfig(this.config);
    this.uiManager?.updateMenuState();
    if(this.captionContainer) {
        this.observerManager?.setIsUpdatingCaption(true);
        this.uiManager?.displayTranscriptText(this.captionContainer, this.currentActiveText, this.originalCaptionText);
        this.observerManager?.setIsUpdatingCaption(false);
    }
    console.log(`[Udemy Translator] Original position: ${this.config.originalPosition}`);
  }

  public destroy() {
    console.log('[Udemy Translator] Destroying...');
    this.observerManager?.disconnect();
    this.uiManager?.destroy();
    this.observerManager = null;
    this.uiManager = null;
    this.captionContainer = null;
    this.transcriptPanel = null;
  }
}

// Entry point
const controller = new ContentController();
controller.init();

window.addEventListener('beforeunload', () => {
  controller.destroy();
});