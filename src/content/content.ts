import { StorageManager } from '../utils/storage';
import { TranslationConfig } from '../utils/types';
import { Translator } from '../utils/translator';
import { SentenceMerger } from '../utils/sentenceMerger';

class UdemySubtitleTranslator {
  private captionObserver: MutationObserver | null = null;
  private transcriptObserver: MutationObserver | null = null;
  private config: TranslationConfig | null = null;
  private currentActiveText = '';
  private lastDisplayedText = '';
  private originalCaptionText = '';
  private captionContainer: Element | null = null;
  private transcriptPanel: Element | null = null;
  private isUpdatingCaption = false;
  private transcriptUpdateScheduled = false;
  private maintenanceInterval: number | null = null;
  private translationCache = new Map<string, string>();
  private pendingTranslations = new Set<string>();
  private translationInProgress = false;

  async init() {
    console.log('[Udemy Translator] Initializing with transcript reuse strategy...');
    console.log('[Udemy Translator] Current URL:', window.location.href);

    this.config = await StorageManager.getConfig();
    console.log('[Udemy Translator] Config loaded:', this.config);

    if (!this.config.enabled) {
      console.log('[Udemy Translator] Translation is disabled. Enable it in the popup.');
      return;
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.translationConfig) {
        this.config = changes.translationConfig.newValue;
        console.log('[Udemy Translator] Config updated:', this.config);

        if (this.config && this.config.enabled) {
          this.restart();
        } else {
          this.destroy();
        }
      }
    });

    this.start();
  }

  private restart() {
    this.destroy();
    this.currentActiveText = '';
    this.start();
  }

  private start() {
    // Step 1: Ensure transcript panel is open
    this.ensureTranscriptPanelOpen();

    // Step 2: Wait for and observe transcript panel
    setTimeout(() => this.waitForTranscriptPanel(), 1000);

    // Step 3: Observe active caption for real-time display
    setTimeout(() => this.waitForCaptionDisplay(), 1500);

    // Step 4: Lightweight maintenance to reattach observers if DOM gets replaced
    this.startMaintenanceLoop();
  }

  private ensureTranscriptPanelOpen() {
    console.log('[Udemy Translator] Checking transcript panel...');

    const transcriptButton = this.findTranscriptToggle();

    if (!transcriptButton) {
      console.log('[Udemy Translator] Transcript button not found');
      return;
    }

    const isExpanded = transcriptButton.getAttribute('aria-expanded') === 'true';

    if (!isExpanded) {
      console.log('[Udemy Translator] Opening transcript panel...');
      transcriptButton.click();
    } else {
      console.log('[Udemy Translator] Transcript panel already open');
    }
  }

  private findTranscriptToggle(): HTMLButtonElement | null {
    const selectors = [
      '[data-purpose="transcript-toggle"]',
      'button[aria-label*="Transcript"]',
      'button[aria-label*="대본"]',
      'button[aria-controls*="transcript"]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLButtonElement) {
        return el;
      }
    }

    // Some layouts render it as a div with role=button
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement && el.getAttribute('role') === 'button') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.display = 'none';
        el.appendChild(btn);
        btn.click();
        btn.remove();
        return el as HTMLButtonElement;
      }
    }

    return null;
  }

  private waitForTranscriptPanel() {
    console.log('[Udemy Translator] Waiting for transcript panel...');

    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts += 1;
      const transcriptPanel = document.querySelector('[data-purpose="transcript-panel"]');

      if (transcriptPanel) {
        console.log('[Udemy Translator] Transcript panel found!');
        clearInterval(checkInterval);
        this.processTranscriptPanel(transcriptPanel);
        return;
      }

      // Retry toggling the transcript panel if not found yet
      if (attempts % 3 === 0) {
        const toggle = this.findTranscriptToggle();
        if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
          console.log('[Udemy Translator] Retrying to open transcript panel...');
          toggle.click();
        }
      }
    }, 1000);

    setTimeout(() => clearInterval(checkInterval), 30000);
  }

  private async processTranscriptPanel(panel: Element) {
    console.log('[Udemy Translator] Hooking into transcript panel for active cue detection...');
    this.transcriptPanel = panel;

    // Start observing immediately so caption updates work during translation
    this.updateCaptionFromTranscript();
    this.observeTranscriptPanel(panel);

    // Translate transcript in background if using DeepSeek
    if (this.config?.translationEngine === 'deepseek') {
      // Don't await - let it run in background
      this.translateTranscriptPanel(panel).catch(err => {
        console.error('[Udemy Translator] Background translation error:', err);
      });
    }
  }

  private observeTranscriptPanel(panel: Element) {
    this.transcriptObserver?.disconnect();

    this.transcriptObserver = new MutationObserver((mutations) => {
      if (this.transcriptUpdateScheduled) {
        return;
      }
      this.transcriptUpdateScheduled = true;
      // Defer to batch multiple mutations together to reduce load
      window.requestAnimationFrame(() => {
        this.transcriptUpdateScheduled = false;
        this.updateCaptionFromTranscript();
      });
    });

    this.transcriptObserver.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-current', 'data-highlighted', 'data-purpose']
    });

    this.updateCaptionFromTranscript();
  }

  private waitForCaptionDisplay() {
    console.log('[Udemy Translator] Waiting for caption display...');

    const checkInterval = setInterval(() => {
      const captionContainer = document.querySelector('[data-purpose="captions-cue-text"]');

      if (captionContainer) {
        console.log('[Udemy Translator] Caption display found!');
        clearInterval(checkInterval);
        this.observeCaptionDisplay(captionContainer);
        // Apply current text immediately if known
        if (this.currentActiveText) {
          this.displayTranscriptText(captionContainer, this.currentActiveText);
        }
      }
    }, 1000);

    setTimeout(() => clearInterval(checkInterval), 30000);
  }

  private observeCaptionDisplay(container: Element) {
    this.captionContainer = container;
    if (this.captionObserver) {
      this.captionObserver.disconnect();
    }

    this.captionObserver = new MutationObserver(() => {
      if (this.isUpdatingCaption) {
        return;
      }
      const text = this.getCleanText(container);
      if (text && text !== this.originalCaptionText) {
        this.originalCaptionText = text;
      }
    });

    this.captionObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  private updateCaptionDisplay() {
    if (!this.captionContainer) {
      return;
    }

    if (this.currentActiveText) {
      this.displayTranscriptText(this.captionContainer, this.currentActiveText);
      return;
    }

    // Fallback to the currently rendered caption text if transcript highlight is not ready yet
    const fallbackText = this.getCleanText(this.captionContainer);
    if (fallbackText) {
      this.displayTranscriptText(this.captionContainer, fallbackText);
    }
  }

  private updateCaptionFromTranscript() {
    if (!this.transcriptPanel) {
      return;
    }

    const activeText = this.getActiveTranscriptText(this.transcriptPanel);
    if (!activeText) {
      return;
    }

    if (activeText !== this.currentActiveText) {
      this.currentActiveText = activeText;
      console.log(`[Udemy Translator] 📍 Active transcript cue changed: "${activeText.substring(0, 40)}..."`);
    }

    if (this.captionContainer) {
      this.displayTranscriptText(this.captionContainer, this.currentActiveText);
    }

  }

  private startMaintenanceLoop() {
    if (this.maintenanceInterval !== null) {
      return;
    }

    this.maintenanceInterval = window.setInterval(() => {
      // Re-find caption container if it was replaced
      if (!this.captionContainer || !document.body.contains(this.captionContainer)) {
        const newCaption = document.querySelector('[data-purpose="captions-cue-text"]');
        if (newCaption) {
          console.log('[Udemy Translator] Caption container replaced, reattaching observer');
          this.observeCaptionDisplay(newCaption);
          this.lastDisplayedText = '';
          if (this.currentActiveText) {
            this.displayTranscriptText(newCaption, this.currentActiveText);
          }
        }
      }

      // Re-find transcript panel if it was replaced
      if (!this.transcriptPanel || !document.body.contains(this.transcriptPanel)) {
        const newPanel = document.querySelector('[data-purpose="transcript-panel"]');
        if (newPanel) {
          this.processTranscriptPanel(newPanel);
          if (this.captionContainer && this.currentActiveText) {
            this.displayTranscriptText(this.captionContainer, this.currentActiveText);
          }
        }
      }
    }, 1500);
  }

  private getActiveTranscriptElement(panel: Element): Element | null {
    const selectorPriority = [
      '[data-purpose="transcript-cue-active"]',
      '[data-purpose="transcript-cue"][aria-current="true"]',
      '[data-purpose="transcript-cue"].is-active',
      '[data-purpose="transcript-cue"][class*="highlight"]',
      '[data-purpose="transcript-cue"][class*="active"]',
      '[data-purpose="transcript-cue"][class*="underline-cue"]',
      '[class*="transcript-cue"][class*="highlight"]',
      '[class*="transcript-cue"][class*="active"]',
      '[class*="transcript"][class*="underline-cue"]',
      '[data-purpose="cue-text"][data-highlighted="true"]',
      '[data-purpose="cue-text"][class*="highlight-cue"]',
      '[data-purpose="cue-text"][class*="highlight"]',
      '[data-purpose="cue-text"][class*="active"]'
    ];

    for (const selector of selectorPriority) {
      const el = panel.querySelector(selector);
      if (el) {
        return el;
      }
    }

    return null;
  }

  private getActiveTranscriptText(panel: Element): string | null {
    const activeCue = this.getActiveTranscriptElement(panel);
    if (!activeCue) {
      return null;
    }

    const cueTextElement = activeCue.querySelector('[data-purpose="cue-text"]') || activeCue;
    const text = cueTextElement.textContent?.trim() || '';

    // If using DeepSeek, also update originalCaptionText from data attribute
    if (this.config?.translationEngine === 'deepseek') {
      const originalText = cueTextElement.getAttribute('data-original-text');
      if (originalText) {
        this.originalCaptionText = originalText.trim();
      }
    }

    return text || null;
  }

  private getCleanText(container: Element): string {
    const clone = container.cloneNode(true) as Element;
    const translations = clone.querySelectorAll('.udemy-translation, .udemy-original, .udemy-original-only, .udemy-waiting, .udemy-transcript-caption, .udemy-transcript-original');
    translations.forEach(el => el.remove());
    return clone.textContent?.trim() || '';
  }

  private displayTranscriptText(container: Element, text: string) {
    if (!text) {
      return;
    }

    const currentContent = this.getCleanText(container);
    if (this.lastDisplayedText === text && currentContent === text) {
      return;
    }

    this.isUpdatingCaption = true;
    this.lastDisplayedText = text;
    const currentStyle = window.getComputedStyle(container);
    const baseFontSize = currentStyle.fontSize;

    // Minimize DOM churn: reuse existing first child if it has our class
    let translatedDiv = container.querySelector('.udemy-transcript-caption') as HTMLDivElement | null;
    let originalDiv = container.querySelector('.udemy-transcript-original') as HTMLDivElement | null;

    if (!translatedDiv) {
      translatedDiv = document.createElement('div');
      translatedDiv.className = 'udemy-transcript-caption';
      container.innerHTML = '';
      container.appendChild(translatedDiv);
    } else {
      translatedDiv.textContent = '';
    }

    translatedDiv.textContent = text;
    translatedDiv.style.fontSize = baseFontSize;
    translatedDiv.style.fontWeight = 'bold';
    translatedDiv.style.color = '#ffffff';
    translatedDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.9)';
    translatedDiv.style.lineHeight = '1.4';

    const shouldShowOriginal = this.config?.showOriginal ?? true;

    if (shouldShowOriginal && this.originalCaptionText) {
      if (!originalDiv) {
        originalDiv = document.createElement('div');
        originalDiv.className = 'udemy-transcript-original';
      }
      originalDiv.textContent = this.originalCaptionText;
      originalDiv.style.fontSize = `calc(${baseFontSize} * 0.8)`;
      originalDiv.style.color = '#cccccc';
      originalDiv.style.opacity = '0.75';
      originalDiv.style.marginTop = '4px';
      originalDiv.style.textShadow = '1px 1px 3px rgba(0,0,0,0.9)';

      const position = this.config?.originalPosition ?? 'below';
      if (position === 'above') {
        if (originalDiv.parentElement !== container) {
          container.innerHTML = '';
          container.appendChild(originalDiv);
          container.appendChild(translatedDiv);
        } else {
          container.insertBefore(originalDiv, translatedDiv);
        }
      } else {
        if (originalDiv.parentElement !== container) {
          container.appendChild(originalDiv);
        }
      }
    } else if (originalDiv) {
      originalDiv.remove();
    }

    this.isUpdatingCaption = false;
  }

  /**
   * Translate all cues in the transcript panel
   */
  private async translateTranscriptPanel(panel: Element) {
    if (!this.config?.deepseekApiKey || !this.config?.targetLanguage) {
      console.warn('[Udemy Translator] DeepSeek API key or target language not configured');
      return;
    }

    console.log('[Udemy Translator] Starting DeepSeek translation for transcript...');

    // Get all transcript cues
    const allCues = Array.from(panel.querySelectorAll('[data-purpose="transcript-cue"]'));
    if (allCues.length === 0) {
      console.log('[Udemy Translator] No transcript cues found');
      return;
    }

    console.log(`[Udemy Translator] Found ${allCues.length} cues to translate`);

    // Group cues by sentence to handle fragmented text
    const groupedCues = SentenceMerger.groupCuesBySentence(allCues);

    console.log(`[Udemy Translator] Grouped into ${groupedCues.length} sentence groups`);

    // Translate each group in real-time
    for (const group of groupedCues) {
      await this.translateCueGroup(group.cues, group.text);
    }

    console.log('[Udemy Translator] Translation completed');
  }

  /**
   * Translate a group of cues that form a complete sentence
   * Updates the DOM immediately when translation is received
   */
  private async translateCueGroup(cues: Element[], mergedText: string) {
    if (cues.length === 0 || !mergedText) return;

    // Check cache first
    if (this.translationCache.has(mergedText)) {
      const cachedTranslation = this.translationCache.get(mergedText)!;
      this.applyCachedTranslationToCues(cues, cachedTranslation);
      return;
    }

    // Skip if already pending
    if (this.pendingTranslations.has(mergedText)) {
      return;
    }

    this.pendingTranslations.add(mergedText);

    try {
      // Translate using DeepSeek
      const result = await Translator.translateWithDeepSeek(
        mergedText,
        this.config!.deepseekApiKey!,
        this.config!.targetLanguage || 'Korean'
      );

      if (result.success && result.translatedText) {
        // Cache the result
        this.translationCache.set(mergedText, result.translatedText);

        // Apply translation to cues IMMEDIATELY
        this.applyTranslationToCues(cues, result.translatedText);

        console.log(`[Udemy Translator] ✓ Translated: "${mergedText.substring(0, 30)}..." → "${result.translatedText.substring(0, 30)}..."`);
      } else {
        console.error(`[Udemy Translator] Translation failed: ${result.error}`);
        // Keep original text
        this.applyTranslationToCues(cues, mergedText);
      }
    } catch (error) {
      console.error('[Udemy Translator] Translation error:', error);
      // Keep original text
      this.applyTranslationToCues(cues, mergedText);
    } finally {
      this.pendingTranslations.delete(mergedText);
    }
  }

  /**
   * Apply cached translation to cues
   */
  private applyCachedTranslationToCues(cues: Element[], translation: string) {
    // Apply translation to ALL cues in the group
    for (const cue of cues) {
      const cueTextElement = cue.querySelector('[data-purpose="cue-text"]');
      if (cueTextElement) {
        // Store original text before replacing
        if (!cueTextElement.getAttribute('data-original-text')) {
          cueTextElement.setAttribute('data-original-text', cueTextElement.textContent || '');
        }
        cueTextElement.textContent = translation;
      }
    }
  }

  /**
   * Apply translation to DOM immediately (real-time update)
   */
  private applyTranslationToCues(cues: Element[], translation: string) {
    // Apply translation to ALL cues in the group
    for (const cue of cues) {
      const cueTextElement = cue.querySelector('[data-purpose="cue-text"]');
      if (cueTextElement) {
        // Store original text before replacing
        if (!cueTextElement.getAttribute('data-original-text')) {
          cueTextElement.setAttribute('data-original-text', cueTextElement.textContent || '');
        }
        cueTextElement.textContent = translation;
      }
    }
  }

  destroy() {
    if (this.transcriptObserver) {
      this.transcriptObserver.disconnect();
      this.transcriptObserver = null;
    }
    if (this.maintenanceInterval !== null) {
      window.clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }
    this.captionContainer = null;
    this.transcriptPanel = null;
    this.translationCache.clear();
    this.pendingTranslations.clear();
  }
}

const translator = new UdemySubtitleTranslator();
translator.init();

window.addEventListener('beforeunload', () => {
  translator.destroy();
});
