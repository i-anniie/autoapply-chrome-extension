// LinkedIn Easy Apply Popup Controller
// Handles UI interactions and communication with content script

class PopupController {
  constructor() {
    this.isRunning = false;
    this.stats = {
      applied: 0,
      skipped: 0,
      errors: 0,
      processed: 0,
    };

    this.initializeElements();
    this.setupEventListeners();
    this.loadInitialState();
  }

  initializeElements() {
    this.elements = {
      startStopBtn: document.getElementById("startStopBtn"),
      btnText: document.getElementById("btnText"),
      statusDot: document.getElementById("statusDot"),
      statusText: document.getElementById("statusText"),
      dryRunToggle: document.getElementById("dryRunToggle"),
      appliedCount: document.getElementById("appliedCount"),
      skippedCount: document.getElementById("skippedCount"),
      errorCount: document.getElementById("errorCount"),
      processedCount: document.getElementById("processedCount"),
      importConfigBtn: document.getElementById("importConfigBtn"),
      exportConfigBtn: document.getElementById("exportConfigBtn"),
      resetStatsBtn: document.getElementById("resetStatsBtn"),
      configFileInput: document.getElementById("configFileInput"),
      currentPage: document.getElementById("currentPage"),
      lastRun: document.getElementById("lastRun"),
    };
  }

  setupEventListeners() {
    this.elements.startStopBtn.addEventListener("click", () =>
      this.toggleAutomation()
    );
    this.elements.dryRunToggle.addEventListener("change", () =>
      this.toggleDryRun()
    );
    this.elements.importConfigBtn.addEventListener("click", () =>
      this.importConfig()
    );
    this.elements.exportConfigBtn.addEventListener("click", () =>
      this.exportConfig()
    );
    this.elements.resetStatsBtn.addEventListener("click", () =>
      this.resetStats()
    );
    this.elements.configFileInput.addEventListener("change", (e) =>
      this.handleConfigFile(e)
    );

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message);
    });
  }

  async loadInitialState() {
    try {
      // Check if we're on LinkedIn jobs page
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.url && tab.url.includes("linkedin.com/jobs")) {
        this.elements.currentPage.textContent = "LinkedIn Jobs Page";
      } else {
        this.elements.currentPage.textContent = "Not on LinkedIn Jobs";
        this.elements.startStopBtn.disabled = true;
      }

      // Load stats from storage
      const result = await chrome.storage.local.get([
        "isRunning",
        "stats",
        "lastRun",
        "dryRun",
      ]);

      if (result.isRunning) {
        this.isRunning = true;
        this.updateUI();
      }

      if (result.stats) {
        this.stats = { ...this.stats, ...result.stats };
        this.updateStats();
      }

      if (result.lastRun) {
        this.elements.lastRun.textContent = new Date(
          result.lastRun
        ).toLocaleString();
      }

      if (result.dryRun !== undefined) {
        this.elements.dryRunToggle.checked = result.dryRun;
      }
    } catch (error) {
      console.error("Failed to load initial state:", error);
    }
  }

  async toggleAutomation() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url || !tab.url.includes("linkedin.com/jobs")) {
        alert("Please navigate to a LinkedIn jobs page first.");
        return;
      }

      this.isRunning = !this.isRunning;

      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: this.isRunning ? "START" : "STOP",
      });

      // Update storage
      await chrome.storage.local.set({
        isRunning: this.isRunning,
        lastRun: this.isRunning ? Date.now() : undefined,
      });

      this.updateUI();
    } catch (error) {
      console.error("Failed to toggle automation:", error);
      this.isRunning = false;
      this.updateUI();
    }
  }

  async toggleDryRun() {
    const dryRun = this.elements.dryRunToggle.checked;
    await chrome.storage.local.set({ dryRun });

    // Notify content script if running
    if (this.isRunning) {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        await chrome.tabs.sendMessage(tab.id, {
          type: "UPDATE_DRY_RUN",
          dryRun,
        });
      } catch (error) {
        console.error("Failed to update dry run mode:", error);
      }
    }
  }

  async importConfig() {
    this.elements.configFileInput.click();
  }

  async handleConfigFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // Validate config structure
      if (!this.validateConfig(config)) {
        alert("Invalid configuration file format.");
        return;
      }

      // Save to storage
      await chrome.storage.local.set({ userConfig: config });
      alert("Configuration imported successfully!");
    } catch (error) {
      console.error("Failed to import config:", error);
      alert("Failed to import configuration file.");
    }
  }

  async exportConfig() {
    try {
      const result = await chrome.storage.local.get(["userConfig"]);
      const config = result.userConfig || {};

      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "linkedin-easy-apply-config.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export config:", error);
      alert("Failed to export configuration.");
    }
  }

  async resetStats() {
    if (confirm("Are you sure you want to reset all statistics?")) {
      this.stats = { applied: 0, skipped: 0, errors: 0, processed: 0 };
      await chrome.storage.local.set({ stats: this.stats });
      this.updateStats();
    }
  }

  validateConfig(config) {
    const requiredFields = ["user", "resumes", "titleBuckets", "throttling"];
    return requiredFields.every((field) => config[field] !== undefined);
  }

  handleMessage(message) {
    switch (message.type) {
      case "STATS_UPDATE":
        this.stats = { ...this.stats, ...message.stats };
        this.updateStats();
        break;
      case "STATUS_UPDATE":
        this.updateStatus(message.status);
        break;
    }
  }

  updateUI() {
    if (this.isRunning) {
      this.elements.btnText.textContent = "Stop Automation";
      this.elements.statusDot.classList.add("running");
      this.elements.statusText.textContent = "Running";
    } else {
      this.elements.btnText.textContent = "Start Automation";
      this.elements.statusDot.classList.remove("running", "cooldown");
      this.elements.statusText.textContent = "Stopped";
    }
  }

  updateStatus(status) {
    this.elements.statusDot.className = "status-dot";
    this.elements.statusText.textContent = status;

    if (status === "Running") {
      this.elements.statusDot.classList.add("running");
    } else if (status === "Cooldown") {
      this.elements.statusDot.classList.add("cooldown");
    }
  }

  updateStats() {
    this.elements.appliedCount.textContent = this.stats.applied;
    this.elements.skippedCount.textContent = this.stats.skipped;
    this.elements.errorCount.textContent = this.stats.errors;
    this.elements.processedCount.textContent = this.stats.processed;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
