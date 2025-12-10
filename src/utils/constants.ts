export const SELECTORS = {
  TRANSCRIPT: {
    PANEL: '[data-purpose="transcript-panel"]',
    TOGGLE_BUTTON: [
      '[data-purpose="transcript-toggle"]',
      'button[aria-label*="Transcript"]',
      'button[aria-label*="대본"]',
      'button[aria-controls*="transcript"]'
    ],
    CUE: '[data-purpose="transcript-cue"]',
    ACTIVE_CUE: [
      '[data-purpose="transcript-cue-active"]',
      '[data-purpose="transcript-cue"][aria-current="true"]',
      '[data-purpose="transcript-cue"].is-active',
      '[data-purpose="transcript-cue"][class*="highlight"]',
      '[data-purpose="transcript-cue"][class*="active"]',
      '[data-purpose="transcript-cue"][class*="underline-cue"]',
      '[class*="transcript-cue"][class*="highlight"]',
      '[class*="transcript-cue"][class*="active"]',
      '[class*="transcript"][class*="underline-cue"]'
    ].join(','),
    CUE_TEXT: '[data-purpose="cue-text"]',
    ACTIVE_CUE_TEXT: [
      '[data-purpose="cue-text"][data-highlighted="true"]',
      '[data-purpose="cue-text"][class*="highlight-cue"]',
      '[data-purpose="cue-text"][class*="highlight"]',
      '[data-purpose="cue-text"][class*="active"]'
    ].join(',')
  },
  CAPTION: {
    CONTAINER: '[data-purpose="captions-cue-text"]'
  },
  VIDEO: {
    CONTROLS: '[data-purpose="video-controls"]'
  },
  SETTINGS_MENU: {
    TOGGLE_ORIGINAL_BUTTON: '[data-action="toggle-original"]',
    TOGGLE_POSITION_BUTTON: '[data-action="toggle-position"]',
    POSITION_INDICATOR: '.position-indicator'
  }
};

export const IDS = {
  PROGRESS_INDICATOR: 'udemy-translation-progress',
  SPINNER_STYLE: 'udemy-translator-spinner-style',
  PROGRESS_TEXT: 'udemy-translator-progress-text'
};

export const CLASSES = {
  CAPTION_DISPLAY: {
    TRANSLATED: 'udemy-transcript-caption',
    ORIGINAL: 'udemy-transcript-original'
  },
  TRANSCRIPT_CUE: {
    TRANSLATION: 'ut-translation',
    ORIGINAL: 'ut-original'
  },
  SETTINGS_MENU: {
    BUTTON_CONTAINER: 'popper-module--popper--mM5Ie',
    BUTTON: 'ud-btn ud-btn-small ud-btn-ghost ud-btn-text-sm control-bar-dropdown--trigger--FnmP- control-bar-dropdown--trigger-dark--ZK26r control-bar-dropdown--trigger-small--ogRJ4',
    MENU_CONTAINER: 'popper-module--popper-content--XE9z5'
  },
  SPINNER: 'udemy-translator-spinner',
  REMOVAL_CANDIDATE: [
    '.udemy-translation',
    '.udemy-original',
    '.udemy-original-only',
    '.udemy-waiting',
    '.udemy-transcript-caption',
    '.udemy-transcript-original'
  ].join(',')
};

export const CONFIG = {
  TRANSLATION_BATCH_SIZE: 10,
  MAINTENANCE_INTERVAL: 1500,
  WAIT_FOR_ELEMENT_TIMEOUT: 30000,
  PROGRESS_INDICATOR_FADEOUT: 2000,
  PROGRESS_INDICATOR_REMOVAL_DELAY: 300
};

export const ATTRIBUTES = {
  DATA_PURPOSE: 'data-purpose',
  ARIA_EXPANDED: 'aria-expanded',
  ARIA_CURRENT: 'aria-current',
  DATA_HIGHLIGHTED: 'data-highlighted',
  DATA_ORIGINAL_TEXT: 'data-original-text',
  DATA_SENTENCE_GROUP: 'data-sentence-group',
  DATA_CUE_INDEX: 'data-cue-index',
  ROLE: 'role',
  ARIA_CHECKED: 'aria-checked'
};
