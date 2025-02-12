// Background script to handle content script injection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'inject') {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          });
          sendResponse({ success: true });
        } catch (error) {
          console.error('Injection error:', error);
          sendResponse({ success: false, error: error.message });
        }
      });
      return true; // Keep the message channel open for async response
    }
  });
  
  // Listen for installation
  chrome.runtime.onInstalled.addListener(() => {
    console.log('PromoCode Tester extension installed');
  });