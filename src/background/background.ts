chrome.runtime.onInstalled.addListener(() => {
  console.log('[Udemy Translator] Extension installed');

  chrome.storage.sync.get('translationConfig', (result) => {
    if (!result.translationConfig) {
      chrome.storage.sync.set({
        translationConfig: {
          targetLanguage: 'ko',
          translationEngine: 'google',
          enabled: false
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CONFIG') {
    chrome.storage.sync.get('translationConfig', (result) => {
      sendResponse(result.translationConfig);
    });
    return true;
  }

  if (message.type === 'SAVE_CONFIG') {
    chrome.storage.sync.set({ translationConfig: message.config }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url?.includes('udemy.com/course')) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_TRANSLATION' });
  }
});
