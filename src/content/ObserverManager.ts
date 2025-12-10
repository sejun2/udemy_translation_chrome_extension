import { ATTRIBUTES, CLASSES, SELECTORS } from '../utils/constants';

type ObserverManagerCallbacks = {
  onActiveCueChange: (activeText: string, originalText: string) => void;
  onCaptionContainerReady: (container: Element) => void;
};

export class ObserverManager {
  private captionObserver: MutationObserver | null = null;
  private transcriptObserver: MutationObserver | null = null;
  private isUpdatingCaption = false;
  private transcriptUpdateScheduled = false;
  private callbacks: ObserverManagerCallbacks;

  constructor(callbacks: ObserverManagerCallbacks) {
    this.callbacks = callbacks;
  }

  public observeCaptionDisplay(container: Element) {
    this.captionObserver?.disconnect();

    this.captionObserver = new MutationObserver(() => {
      // This observer's main job is to detect when Udemy's own caption changes,
      // so we can grab the original text if needed.
      if (this.isUpdatingCaption) {
        return;
      }
      const text = container.textContent?.trim() || '';
      // We can notify the controller if the original text changes, if necessary.
    });

    this.captionObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    
    this.callbacks.onCaptionContainerReady(container);
  }

  public observeTranscriptPanel(panel: Element) {
    this.transcriptObserver?.disconnect();

    this.transcriptObserver = new MutationObserver(() => {
      if (this.transcriptUpdateScheduled) {
        return;
      }
      this.transcriptUpdateScheduled = true;

      window.requestAnimationFrame(() => {
        this.transcriptUpdateScheduled = false;
        const { activeText, originalText } = this.getActiveTranscriptData(panel);
        if (activeText) {
          this.callbacks.onActiveCueChange(activeText, originalText);
        }
      });
    });

    this.transcriptObserver.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', ATTRIBUTES.ARIA_CURRENT, ATTRIBUTES.DATA_HIGHLIGHTED, ATTRIBUTES.DATA_PURPOSE],
    });

    // Initial check
    const { activeText, originalText } = this.getActiveTranscriptData(panel);
    if (activeText) {
        this.callbacks.onActiveCueChange(activeText, originalText);
    }
  }

  private getActiveTranscriptData(panel: Element): { activeText: string, originalText: string } {
    const activeCue = panel.querySelector(SELECTORS.TRANSCRIPT.ACTIVE_CUE) 
                   || panel.querySelector(SELECTORS.TRANSCRIPT.ACTIVE_CUE_TEXT);
    
    if (!activeCue) return { activeText: '', originalText: '' };

    const cueTextElement = activeCue.matches(SELECTORS.TRANSCRIPT.CUE_TEXT) 
      ? activeCue
      : activeCue.querySelector(SELECTORS.TRANSCRIPT.CUE_TEXT);

    if (!cueTextElement) return { activeText: '', originalText: '' };

    const translationDiv = cueTextElement.querySelector(`.${CLASSES.TRANSCRIPT_CUE.TRANSLATION}`);
    const activeText = (translationDiv ? translationDiv.textContent : cueTextElement.textContent)?.trim() || '';
    const originalText = cueTextElement.getAttribute(ATTRIBUTES.DATA_ORIGINAL_TEXT) || activeText;

    return { activeText, originalText };
  }

  public setIsUpdatingCaption(isUpdating: boolean) {
    this.isUpdatingCaption = isUpdating;
  }

  public disconnect() {
    this.captionObserver?.disconnect();
    this.transcriptObserver?.disconnect();
  }
}
