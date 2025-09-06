// Background service worker for LinkedIn Easy Apply automation
// Handles alarms, message relay, and cooldown management

class BackgroundService {
  constructor() {
    this.setupMessageHandlers();
    this.setupAlarmHandlers();
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "SET_ALARM":
          this.setCooldownAlarm(message.delayMs);
          break;
        case "CLEAR_ALARMS":
          this.clearAllAlarms();
          break;
        case "GET_STORAGE":
          this.getStorageData(message.keys, sendResponse);
          return true; // Keep message channel open for async response
        case "SET_STORAGE":
          this.setStorageData(message.data);
          break;
      }
    });
  }

  setupAlarmHandlers() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === "batchCooldown") {
        console.log("Batch cooldown completed");
        // Notify content script that cooldown is over
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].url.includes("linkedin.com/jobs")) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "COOLDOWN_COMPLETE" });
          }
        });
      }
    });
  }

  setCooldownAlarm(delayMs) {
    chrome.alarms.create("batchCooldown", {
      delayInMinutes: delayMs / 60000,
    });
  }

  clearAllAlarms() {
    chrome.alarms.clearAll();
  }

  async getStorageData(keys, sendResponse) {
    try {
      const result = await chrome.storage.local.get(keys);
      sendResponse({ success: true, data: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async setStorageData(data) {
    try {
      await chrome.storage.local.set(data);
    } catch (error) {
      console.error("Failed to set storage data:", error);
    }
  }
}

// Initialize background service
new BackgroundService();
