// popup.js
// Handles popup UI actions and messaging

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetBtn = document.getElementById("resetBtn");
  const appliedCountSpan = document.getElementById("appliedCount");

  // Load counter from storage
  chrome.storage.local.get(["appliedCount"], (result) => {
    appliedCountSpan.textContent = result.appliedCount || 0;
  });

  // Listen for counter updates from background/content
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "UPDATE_COUNTER") {
      appliedCountSpan.textContent = msg.count;
      chrome.storage.local.set({ appliedCount: msg.count });
    }
  });

  startBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "START_AUTOMATION" });
    });
  });

  stopBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "STOP_AUTOMATION" });
    });
  });

  resetBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "RESET_AUTOMATION" });
      appliedCountSpan.textContent = "0";
      chrome.storage.local.set({ appliedCount: 0 });
    });
  });
});
