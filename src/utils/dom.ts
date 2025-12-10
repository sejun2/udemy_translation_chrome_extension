import { CONFIG } from './constants';

/**
 * Waits for a single element to appear in the DOM.
 * @param selector The CSS selector of the element.
 * @param timeout The maximum time to wait in milliseconds.
 * @returns A promise that resolves with the element, or rejects on timeout.
 */
export function waitForElement(selector: string, timeout = CONFIG.WAIT_FOR_ELEMENT_TIMEOUT): Promise<Element> {
  return new Promise((resolve, reject) => {
    // Try to find the element immediately
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Set up a mutation observer to watch for changes
    const observer = new MutationObserver((mutations, obs) => {
      const targetElement = document.querySelector(selector);
      if (targetElement) {
        obs.disconnect();
        resolve(targetElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Set up a timeout to reject the promise
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms.`));
    }, timeout);
  });
}

/**
 * Waits for the first element matching any of the provided selectors to appear.
 * @param selectors An array of CSS selectors.
 * @param timeout The maximum time to wait.
 * @returns A promise that resolves with the found element.
 */
export function waitForAnyElement(selectors: string[], timeout = CONFIG.WAIT_FOR_ELEMENT_TIMEOUT): Promise<Element> {
    return new Promise((resolve, reject) => {
        // Check if any element already exists
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }
        }

        const observer = new MutationObserver((mutations, obs) => {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    return resolve(element);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`None of the elements for selectors "${selectors.join(', ')}" were found within ${timeout}ms.`));
        }, timeout);
    });
}
