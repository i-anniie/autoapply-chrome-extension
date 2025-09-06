// background.js

// Handles extension lifecycle and relays messages between popup.js and content.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ appliedCount: 0 });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_AUTOMATION' || msg.type === 'STOP_AUTOMATION' || msg.type === 'RESET_AUTOMATION') {
    // Relay to active tab (content.js)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, msg);
      }
    });
    sendResponse({ status: 'relayed' });
  } else if (msg.type === 'INCREMENT_COUNTER') {
    chrome.storage.local.get(['appliedCount'], (result) => {
      const newCount = (result.appliedCount || 0) + 1;
      chrome.storage.local.set({ appliedCount: newCount }, () => {
        chrome.runtime.sendMessage({ type: 'UPDATE_COUNTER', count: newCount });
      });
    });
  } else if (msg.type === 'UPDATE_COUNTER') {
    chrome.runtime.sendMessage({ type: 'UPDATE_COUNTER', count: msg.count });
  } else if (msg.type === 'GET_COUNTER') {
    chrome.storage.local.get(['appliedCount'], (result) => {
      sendResponse({ count: result.appliedCount || 0 });
    });
    return true; // Keep sendResponse async
  }
});
