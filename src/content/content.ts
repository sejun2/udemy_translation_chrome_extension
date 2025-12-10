import { StorageManager } from '../utils/storage';
import { TranslationConfig } from '../utils/types';
import { Translator } from '../utils/translator';
import { SentenceMerger } from '../utils/sentenceMerger';
import { getMessage, getBrowserLanguage, SupportedLanguage } from '../utils/i18n';

class UdemySubtitleTranslator {
  private captionObserver: MutationObserver | null = null;
  private transcriptObserver: MutationObserver | null = null;
  private controlBarObserver: MutationObserver | null = null;
  private captionAreaObserver: MutationObserver | null = null;
  private transcriptAreaObserver: MutationObserver | null = null;
  private config: TranslationConfig | null = null;
  private currentActiveText = '';
  private lastDisplayedText = '';
  private originalCaptionText = '';
  private captionContainer: Element | null = null;
  private transcriptPanel: Element | null = null;
  private isUpdatingCaption = false;
  private transcriptUpdateScheduled = false;
  private progressIndicator: HTMLElement | null = null;
  private totalBatches = 0;
  private completedBatches = 0;
  private isTranslating = false;
  private settingsButton: HTMLElement | null = null;
  private settingsMenu: HTMLElement | null = null;
  private uiLanguage: SupportedLanguage = getBrowserLanguage();

  async init() {
    console.log('[Udemy Translator] Initializing with transcript reuse strategy...');
    console.log('[Udemy Translator] Current URL:', window.location.href);

    this.config = await StorageManager.getConfig();
    console.log('[Udemy Translator] Config loaded:', this.config);

    // Set UI language from config or use browser language
    this.uiLanguage = this.config.uiLanguage || getBrowserLanguage();

    if (!this.config.enabled) {
      console.log('[Udemy Translator] Translation is disabled. Enable it in the popup.');
      return;
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.translationConfig) {
        this.config = changes.translationConfig.newValue;
        console.log('[Udemy Translator] Config updated:', this.config);

        // Update UI language if changed
        if (this.config?.uiLanguage) {
          this.uiLanguage = this.config.uiLanguage;
        }

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

    // Step 4: Add settings button to video controls
    setTimeout(() => this.addSettingsButton(), 2000);

    // Step 5: Start observing specific areas for dynamic changes
    setTimeout(() => this.observeCaptionArea(), 2500);
    setTimeout(() => this.observeTranscriptArea(), 2500);
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

    // Translate transcript in background if using an API-based translation engine
    const apiEngines = ['deepseek', 'gemini'];
    if (this.config?.translationEngine && apiEngines.includes(this.config.translationEngine) && !this.isTranslating) {
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

  /**
   * Observe caption area for dynamic changes
   */
  private observeCaptionArea() {
    // Find the caption area parent container
    const captionArea = document.querySelector('[data-purpose="captions-cue-text"]')?.parentElement;

    if (!captionArea) {
      console.log('[Udemy Translator] Caption area parent not found, will retry');
      return;
    }

    // Disconnect existing observer if any
    this.captionAreaObserver?.disconnect();

    this.captionAreaObserver = new MutationObserver(() => {
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
    });

    // Observe only the caption area parent
    this.captionAreaObserver.observe(captionArea, {
      childList: true,
      subtree: true
    });

    console.log('[Udemy Translator] Caption area observer started');
  }

  /**
   * Observe transcript area for dynamic changes
   */
  private observeTranscriptArea() {
    // Find the transcript area parent container (sidebar)
    const transcriptArea = document.querySelector('[data-purpose="transcript-panel"]')?.parentElement;

    if (!transcriptArea) {
      console.log('[Udemy Translator] Transcript area parent not found, will retry');
      return;
    }

    // Disconnect existing observer if any
    this.transcriptAreaObserver?.disconnect();

    this.transcriptAreaObserver = new MutationObserver(() => {
      // Re-find transcript panel if it was replaced
      if (!this.transcriptPanel || !document.body.contains(this.transcriptPanel)) {
        const newPanel = document.querySelector('[data-purpose="transcript-panel"]');
        if (newPanel) {
          console.log('[Udemy Translator] Transcript panel replaced, reattaching observer');
          this.processTranscriptPanel(newPanel);
          if (this.captionContainer && this.currentActiveText) {
            this.displayTranscriptText(this.captionContainer, this.currentActiveText);
          }
        }
      }
    });

    // Observe only the transcript area parent
    this.transcriptAreaObserver.observe(transcriptArea, {
      childList: true,
      subtree: true
    });

    console.log('[Udemy Translator] Transcript area observer started');
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

    // If using API-based translation, also update originalCaptionText from data attribute
    const apiEngines = ['deepseek', 'gemini'];
    if (this.config?.translationEngine && apiEngines.includes(this.config.translationEngine)) {
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
   * Translate all cues in the transcript panel using HTML batch translation
   */
  private async translateTranscriptPanel(panel: Element) {
    const apiKey = this.config?.deepseekApiKey || this.config?.geminiApiKey;
    if (!apiKey || !this.config?.targetLanguage) {
      console.warn('[Udemy Translator] API key or target language not configured');
      return;
    }

    console.log(`[Udemy Translator] Starting ${this.config.translationEngine} HTML batch translation...`);

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

    // Split into batches to avoid timeout (10 groups per batch)
    const BATCH_SIZE = 10;
    const batches: typeof groupedCues[] = [];

    for (let i = 0; i < groupedCues.length; i += BATCH_SIZE) {
      batches.push(groupedCues.slice(i, i + BATCH_SIZE));
    }

    console.log(`[Udemy Translator] Split into ${batches.length} batches (${BATCH_SIZE} groups each)`);

    // Mark translation as in progress
    this.isTranslating = true;

    // Show progress indicator
    this.totalBatches = batches.length;
    this.completedBatches = 0;
    this.showProgressIndicator();

    // Translate all batches in parallel
    const batchPromises = batches.map((batch, batchIndex) => {
      console.log(`[Udemy Translator] Starting batch ${batchIndex + 1}/${batches.length}...`);

      return this.translateBatch(batch, batchIndex * BATCH_SIZE).then(() => {
        // Update progress
        this.completedBatches++;
        this.updateProgressIndicator(this.completedBatches, this.totalBatches);
        console.log(`[Udemy Translator] ✓ Completed batch ${batchIndex + 1}/${batches.length}`);
      });
    });

    // Wait for all batches to complete
    await Promise.all(batchPromises);

    console.log('[Udemy Translator] All batches translated successfully!');

    // Mark translation as complete
    this.isTranslating = false;

    // Hide progress indicator
    this.hideProgressIndicator();
  }

  /**
   * Translate a batch of sentence groups
   */
  private async translateBatch(groupedCues: { cues: Element[], text: string }[], startGroupIndex: number) {
    // Build HTML with sentence group information
    const htmlParts: string[] = [];
    const cueToTranslationMap = new Map<Element, { groupIndex: number, cueIndexInGroup: number }>();

    groupedCues.forEach((group, groupIndex) => {
      const actualGroupIndex = startGroupIndex + groupIndex;

      // Mark the start of a sentence group
      htmlParts.push(`<div data-sentence-group="${actualGroupIndex}">`);

      group.cues.forEach((cue, cueIndexInGroup) => {
        const cueTextElement = cue.querySelector('[data-purpose="cue-text"]');
        if (cueTextElement) {
          const originalText = cueTextElement.textContent || '';

          // Store original text in data attribute
          if (!cueTextElement.getAttribute('data-original-text')) {
            cueTextElement.setAttribute('data-original-text', originalText);
          }

          // Create cue div with group and cue index
          htmlParts.push(`<div data-cue-index="${cueIndexInGroup}">${originalText}</div>`);

          // Map the actual DOM element to its group and position
          cueToTranslationMap.set(cue, { groupIndex: actualGroupIndex, cueIndexInGroup });
        }
      });

      // Close sentence group
      htmlParts.push(`</div>`);
    });

    const htmlString = htmlParts.join('');

    try {
      // Translate HTML batch using configured provider
      const result = await Translator.translateHTML(
        htmlString,
        this.config!.deepseekApiKey || this.config!.geminiApiKey || '',
        this.config!.targetLanguage || 'Korean',
        this.config!
      );

      if (!result.success || !result.translatedText) {
        console.error(`[Udemy Translator] Batch translation failed: ${result.error}`);
        return;
      }

      console.log('[Udemy Translator] ✓ Received translated HTML, parsing...');

      // Parse translated HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.translatedText, 'text/html');
      const sentenceGroups = doc.querySelectorAll('[data-sentence-group]');

      // Apply translations group by group
      sentenceGroups.forEach(groupDiv => {
        const groupIndex = parseInt(groupDiv.getAttribute('data-sentence-group') || '-1', 10);
        if (groupIndex < 0) return;

        const cuesInGroup = groupDiv.querySelectorAll('[data-cue-index]');

        // DeepSeek already put the SAME complete translation in each cue
        // So we just take the first one (they should all be identical)
        const firstCue = cuesInGroup[0];
        const fullTranslation = firstCue?.textContent?.trim() || '';

        // Find all DOM elements that belong to this group and apply translation
        cueToTranslationMap.forEach((info, cue) => {
          if (info.groupIndex === groupIndex) {
            const cueTextElement = cue.querySelector('[data-purpose="cue-text"]');
            if (cueTextElement) {
              // Get original text from data attribute
              const originalText = cueTextElement.getAttribute('data-original-text') || '';

              // Clear current content
              cueTextElement.innerHTML = '';

              // Create translation div
              const translationDiv = document.createElement('div');
              translationDiv.className = 'udemy-transcript-translation';
              translationDiv.textContent = fullTranslation;
              translationDiv.style.cssText = 'font-weight: 600; color: inherit; margin-bottom: 2px;';

              // Create original text div (smaller, gray)
              const originalDiv = document.createElement('div');
              originalDiv.className = 'udemy-transcript-original-text';
              originalDiv.textContent = originalText;
              originalDiv.style.cssText = 'font-size: 0.85em; color: #6a6f73; opacity: 0.8; line-height: 1.3; margin-top: 2px;';

              // Apply based on config
              const shouldShowOriginal = this.config?.showOriginal ?? true;
              const position = this.config?.originalPosition ?? 'below';

              if (shouldShowOriginal && originalText) {
                if (position === 'above') {
                  cueTextElement.appendChild(originalDiv);
                  cueTextElement.appendChild(translationDiv);
                } else {
                  cueTextElement.appendChild(translationDiv);
                  cueTextElement.appendChild(originalDiv);
                }
              } else {
                cueTextElement.appendChild(translationDiv);
              }
            }
          }
        });
      });

      console.log(`[Udemy Translator] ✓ Batch translated ${sentenceGroups.length} groups`);

    } catch (error) {
      console.error('[Udemy Translator] Batch translation error:', error);
    }
  }

  /**
   * Create and show translation progress indicator
   */
  private showProgressIndicator() {
    if (this.progressIndicator) {
      return;
    }

    const indicator = document.createElement('div');
    indicator.id = 'udemy-translation-progress';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(86, 36, 208, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      min-width: 200px;
      transition: all 0.3s ease;
    `;

    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <div>
          <div style="font-size: 13px; opacity: 0.9;">${getMessage('translating', this.uiLanguage)}</div>
          <div id="progress-text" style="font-size: 12px; opacity: 0.8; margin-top: 2px;">0%</div>
        </div>
      </div>
    `;

    // Add keyframe animation for spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(indicator);
    this.progressIndicator = indicator;
  }

  /**
   * Update progress indicator
   */
  private updateProgressIndicator(completed: number, total: number) {
    if (!this.progressIndicator) {
      return;
    }

    const percentage = Math.round((completed / total) * 100);
    const progressText = this.progressIndicator.querySelector('#progress-text');

    if (progressText) {
      progressText.textContent = `${completed}/${total} (${percentage}%)`;
    }
  }

  /**
   * Hide and remove progress indicator
   */
  private hideProgressIndicator() {
    if (!this.progressIndicator) {
      return;
    }

    // Show completion message briefly
    this.progressIndicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 18px;">✓</div>
        <div style="font-size: 13px;">${getMessage('translationComplete', this.uiLanguage)}</div>
      </div>
    `;

    // Fade out and remove after 2 seconds
    setTimeout(() => {
      if (this.progressIndicator) {
        this.progressIndicator.style.opacity = '0';
        setTimeout(() => {
          if (this.progressIndicator) {
            this.progressIndicator.remove();
            this.progressIndicator = null;
          }
        }, 300);
      }
    }, 2000);
  }

  /**
   * Add settings button to video controls
   */
  private addSettingsButton() {
    // Check if button already exists
    if (this.settingsButton && document.body.contains(this.settingsButton)) {
      return;
    }

    // Find the control bar
    const controlBar = document.querySelector('[data-purpose="video-controls"]');
    if (!controlBar) {
      console.log('[Udemy Translator] Video controls not found');
      return;
    }

    // Create settings button container (popper wrapper)
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popper-module--popper--mM5Ie';

    // Create settings button
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ud-btn ud-btn-small ud-btn-ghost ud-btn-text-sm control-bar-dropdown--trigger--FnmP- control-bar-dropdown--trigger-dark--ZK26r control-bar-dropdown--trigger-small--ogRJ4';
    button.setAttribute('data-purpose', 'caption-settings-toggle');

    // Add extension icon
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icon48.png');
    icon.alt = getMessage('captionSettings', this.uiLanguage);
    icon.style.cssText = 'width: 20px; height: 20px; display: block;';
    button.appendChild(icon);

    // Create settings menu
    const menu = this.createSettingsMenu();

    buttonContainer.appendChild(button);
    buttonContainer.appendChild(menu);

    // Insert at the rightmost position of the control bar
    controlBar.appendChild(buttonContainer);

    // Add event listener to toggle menu
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSettingsMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (menu.style.display === 'block' && !buttonContainer.contains(e.target as Node)) {
        this.closeSettingsMenu();
      }
    });

    this.settingsButton = button;
    this.settingsMenu = menu;

    // Start observing control bar for changes
    this.observeControlBar(controlBar);

    console.log('[Udemy Translator] Settings button added to video controls');
  }

  /**
   * Observe control bar for DOM changes and re-add button if needed
   */
  private observeControlBar(controlBar: Element) {
    // Disconnect existing observer if any
    this.controlBarObserver?.disconnect();

    this.controlBarObserver = new MutationObserver(() => {
      // Check if settings button still exists in the DOM
      if (!this.settingsButton || !document.body.contains(this.settingsButton)) {
        console.log('[Udemy Translator] Control bar changed, re-adding settings button');
        this.addSettingsButton();
      }
    });

    // Observe the control bar for child list changes
    this.controlBarObserver.observe(controlBar, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Create settings menu
   */
  private createSettingsMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'popper-module--popper-content--XE9z5';
    menu.style.cssText = `
      display: none;
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 0.8rem;
      background: rgba(28, 29, 31, 0.98);
      border-radius: 8px;
      padding: 8px 0;
      min-width: 200px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 999999;
    `;

    menu.innerHTML = `
      <div style="padding: 8px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 8px;">
        <div style="color: #fff; font-size: 14px; font-weight: 600;">${getMessage('captionSettings', this.uiLanguage)}</div>
      </div>
      <div style="padding: 4px 0;">
        <button type="button" class="ud-btn ud-btn-medium ud-btn-ghost ud-text-sm ud-block-list-item ud-block-list-item-small ud-block-list-item-neutral" data-action="toggle-original" style="width: 100%; justify-content: flex-start; padding: 8px 16px;">
          <div class="ud-block-list-item-content" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span>${getMessage('showOriginal', this.uiLanguage)}</span>
            <span class="control-bar-dropdown--checkbox-slider--3T-2W" style="margin-left: auto;"></span>
          </div>
        </button>
        <button type="button" class="ud-btn ud-btn-medium ud-btn-ghost ud-text-sm ud-block-list-item ud-block-list-item-small ud-block-list-item-neutral" data-action="toggle-position" style="width: 100%; justify-content: flex-start; padding: 8px 16px;">
          <div class="ud-block-list-item-content" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span>${getMessage('originalPosition', this.uiLanguage)}</span>
            <span class="position-indicator" style="margin-left: auto; font-size: 12px; color: #ccc;">${getMessage('below', this.uiLanguage)}</span>
          </div>
        </button>
      </div>
    `;

    // Update initial state
    this.updateMenuState(menu);

    // Add event listeners
    const toggleOriginalBtn = menu.querySelector('[data-action="toggle-original"]');
    const togglePositionBtn = menu.querySelector('[data-action="toggle-position"]');

    toggleOriginalBtn?.addEventListener('click', () => this.toggleShowOriginal());
    togglePositionBtn?.addEventListener('click', () => this.toggleOriginalPosition());

    return menu;
  }

  /**
   * Update menu state based on current config
   */
  private updateMenuState(menu: HTMLElement) {
    if (!this.config) return;

    const toggleOriginalBtn = menu.querySelector('[data-action="toggle-original"]');
    const positionIndicator = menu.querySelector('.position-indicator');

    // Update toggle state
    if (toggleOriginalBtn) {
      if (this.config.showOriginal) {
        toggleOriginalBtn.setAttribute('aria-checked', 'true');
      } else {
        toggleOriginalBtn.setAttribute('aria-checked', 'false');
      }
    }

    // Update position indicator
    if (positionIndicator) {
      positionIndicator.textContent = this.config.originalPosition === 'above'
        ? getMessage('above', this.uiLanguage)
        : getMessage('below', this.uiLanguage);
    }
  }

  /**
   * Toggle settings menu
   */
  private toggleSettingsMenu() {
    if (!this.settingsMenu) return;

    if (this.settingsMenu.style.display === 'none') {
      this.settingsMenu.style.display = 'block';
      this.updateMenuState(this.settingsMenu);
    } else {
      this.settingsMenu.style.display = 'none';
    }
  }

  /**
   * Close settings menu
   */
  private closeSettingsMenu() {
    if (this.settingsMenu) {
      this.settingsMenu.style.display = 'none';
    }
  }

  /**
   * Update all transcript cues to reflect current config
   */
  private updateTranscriptCues() {
    if (!this.transcriptPanel) {
      return;
    }

    const allCues = this.transcriptPanel.querySelectorAll('[data-purpose="transcript-cue"]');
    const shouldShowOriginal = this.config?.showOriginal ?? true;
    const position = this.config?.originalPosition ?? 'below';

    allCues.forEach(cue => {
      const cueTextElement = cue.querySelector('[data-purpose="cue-text"]');
      if (!cueTextElement) return;

      // Check if translation already exists
      const translationDiv = cueTextElement.querySelector('.udemy-transcript-translation');
      const originalDiv = cueTextElement.querySelector('.udemy-transcript-original-text');

      if (!translationDiv) {
        // Not yet translated, skip
        return;
      }

      // Get original text from data attribute
      const originalText = cueTextElement.getAttribute('data-original-text') || '';

      // Clear and rebuild structure
      cueTextElement.innerHTML = '';

      // Re-add translation div
      cueTextElement.appendChild(translationDiv);

      // Handle original text based on config
      if (shouldShowOriginal && originalText) {
        if (!originalDiv) {
          const newOriginalDiv = document.createElement('div');
          newOriginalDiv.className = 'udemy-transcript-original-text';
          newOriginalDiv.textContent = originalText;
          newOriginalDiv.style.cssText = 'font-size: 0.85em; color: #6a6f73; opacity: 0.8; line-height: 1.3; margin-top: 2px;';

          if (position === 'above') {
            cueTextElement.insertBefore(newOriginalDiv, translationDiv);
          } else {
            cueTextElement.appendChild(newOriginalDiv);
          }
        } else {
          if (position === 'above') {
            cueTextElement.insertBefore(originalDiv, translationDiv);
          } else {
            cueTextElement.appendChild(originalDiv);
          }
        }
      }
      // If shouldShowOriginal is false, originalDiv won't be added (already cleared)
    });

    console.log(`[Udemy Translator] Updated ${allCues.length} transcript cues`);
  }

  /**
   * Toggle show original setting
   */
  private async toggleShowOriginal() {
    if (!this.config) return;

    this.config.showOriginal = !this.config.showOriginal;
    await StorageManager.saveConfig(this.config);

    // Update menu state
    if (this.settingsMenu) {
      this.updateMenuState(this.settingsMenu);
    }

    // Update caption display immediately
    this.updateCaptionDisplay();

    // Update transcript cues
    this.updateTranscriptCues();

    console.log(`[Udemy Translator] Show original: ${this.config.showOriginal}`);
  }

  /**
   * Toggle original position setting
   */
  private async toggleOriginalPosition() {
    if (!this.config) return;

    this.config.originalPosition = this.config.originalPosition === 'above' ? 'below' : 'above';
    await StorageManager.saveConfig(this.config);

    // Update menu state
    if (this.settingsMenu) {
      this.updateMenuState(this.settingsMenu);
    }

    // Update caption display immediately
    this.updateCaptionDisplay();

    // Update transcript cues
    this.updateTranscriptCues();

    console.log(`[Udemy Translator] Original position: ${this.config.originalPosition}`);
  }

  destroy() {
    if (this.transcriptObserver) {
      this.transcriptObserver.disconnect();
      this.transcriptObserver = null;
    }
    if (this.controlBarObserver) {
      this.controlBarObserver.disconnect();
      this.controlBarObserver = null;
    }
    if (this.captionAreaObserver) {
      this.captionAreaObserver.disconnect();
      this.captionAreaObserver = null;
    }
    if (this.transcriptAreaObserver) {
      this.transcriptAreaObserver.disconnect();
      this.transcriptAreaObserver = null;
    }
    if (this.captionObserver) {
      this.captionObserver.disconnect();
      this.captionObserver = null;
    }
    if (this.progressIndicator) {
      this.progressIndicator.remove();
      this.progressIndicator = null;
    }
    if (this.settingsButton?.parentElement) {
      this.settingsButton.parentElement.remove();
      this.settingsButton = null;
    }
    if (this.settingsMenu) {
      this.settingsMenu.remove();
      this.settingsMenu = null;
    }
    this.captionContainer = null;
    this.transcriptPanel = null;
  }
}

const translator = new UdemySubtitleTranslator();
translator.init();

window.addEventListener('beforeunload', () => {
  translator.destroy();
});
