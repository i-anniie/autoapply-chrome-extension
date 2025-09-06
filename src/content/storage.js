// Storage management for LinkedIn Easy Apply automation
// Handles chrome.storage.local operations and config management

class StorageManager {
  constructor() {
    this.defaultConfig = null;
    this.userConfig = null;
  }

  async initialize() {
    try {
      // Load default config
      try {
        const url = chrome.runtime.getURL("src/config/userData.json");
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.defaultConfig = await response.json();
      } catch (e) {
        console.error("Failed to load default config via fetch:", e);
        this.defaultConfig = this.defaultConfig || {};
      }

      // Load user config from storage
      const result = await chrome.storage.local.get(["userConfig"]);
      this.userConfig = result.userConfig || this.defaultConfig || {};

      return this.userConfig;
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      return this.defaultConfig || {};
    }
  }

  async getConfig() {
    if (!this.userConfig) {
      const cfg = await this.initialize();
      this.userConfig = cfg || this.defaultConfig || {};
    }
    return this.userConfig || this.defaultConfig || {};
  }

  async updateConfig(newConfig) {
    try {
      this.userConfig = { ...this.userConfig, ...newConfig };
      await chrome.storage.local.set({ userConfig: this.userConfig });
      return this.userConfig;
    } catch (error) {
      console.error("Failed to update config:", error);
      throw error;
    }
  }

  async getStats() {
    try {
      const result = await chrome.storage.local.get(["stats"]);
      return (
        result.stats || {
          applied: 0,
          skipped: 0,
          errors: 0,
          processed: 0,
        }
      );
    } catch (error) {
      console.error("Failed to get stats:", error);
      return { applied: 0, skipped: 0, errors: 0, processed: 0 };
    }
  }

  async updateStats(stats) {
    try {
      const currentStats = await this.getStats();
      const newStats = { ...currentStats, ...stats };
      await chrome.storage.local.set({ stats: newStats });
      return newStats;
    } catch (error) {
      console.error("Failed to update stats:", error);
      throw error;
    }
  }

  async incrementStat(statName, amount = 1) {
    try {
      const currentStats = await this.getStats();
      currentStats[statName] = (currentStats[statName] || 0) + amount;
      await chrome.storage.local.set({ stats: currentStats });
      return currentStats;
    } catch (error) {
      console.error("Failed to increment stat:", error);
      throw error;
    }
  }

  async getState() {
    try {
      const result = await chrome.storage.local.get([
        "isRunning",
        "lastRun",
        "dryRun",
        "currentJobIndex",
        "batchStartTime",
      ]);
      return {
        isRunning: result.isRunning || false,
        lastRun: result.lastRun || null,
        dryRun: result.dryRun !== undefined ? result.dryRun : true,
        currentJobIndex: result.currentJobIndex || 0,
        batchStartTime: result.batchStartTime || null,
      };
    } catch (error) {
      console.error("Failed to get state:", error);
      return {
        isRunning: false,
        lastRun: null,
        dryRun: true,
        currentJobIndex: 0,
        batchStartTime: null,
      };
    }
  }

  async updateState(state) {
    try {
      await chrome.storage.local.set(state);
    } catch (error) {
      console.error("Failed to update state:", error);
      throw error;
    }
  }

  async getAppliedJobs() {
    try {
      const result = await chrome.storage.local.get(["appliedJobs"]);
      return result.appliedJobs || [];
    } catch (error) {
      console.error("Failed to get applied jobs:", error);
      return [];
    }
  }

  async addAppliedJob(jobId, jobTitle, company) {
    try {
      const appliedJobs = await this.getAppliedJobs();
      const jobRecord = {
        id: jobId,
        title: jobTitle,
        company: company,
        appliedAt: Date.now(),
      };

      // Remove duplicate if exists
      const filteredJobs = appliedJobs.filter((job) => job.id !== jobId);
      filteredJobs.push(jobRecord);

      // Keep only last 1000 jobs
      if (filteredJobs.length > 1000) {
        filteredJobs.splice(0, filteredJobs.length - 1000);
      }

      await chrome.storage.local.set({ appliedJobs: filteredJobs });
      return filteredJobs;
    } catch (error) {
      console.error("Failed to add applied job:", error);
      throw error;
    }
  }

  async isJobApplied(jobId) {
    try {
      const appliedJobs = await this.getAppliedJobs();
      return appliedJobs.some((job) => job.id === jobId);
    } catch (error) {
      console.error("Failed to check if job applied:", error);
      return false;
    }
  }

  async clearAllData() {
    try {
      await chrome.storage.local.clear();
      this.userConfig = null;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      throw error;
    }
  }

  async exportData() {
    try {
      const allData = await chrome.storage.local.get(null);
      return allData;
    } catch (error) {
      console.error("Failed to export data:", error);
      throw error;
    }
  }

  async importData(data) {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.local.set(data);
      this.userConfig = data.userConfig || this.defaultConfig;
    } catch (error) {
      console.error("Failed to import data:", error);
      throw error;
    }
  }

  // Helper method to get specific config sections
  async getConfigSection(section) {
    const config = await this.getConfig();
    return config[section] || null;
  }

  // Helper method to validate config
  validateConfig(config) {
    const requiredSections = ["user", "resumes", "titleBuckets", "throttling"];
    return requiredSections.every((section) => config[section] !== undefined);
  }
}

// Export singleton instance
window.linkedinEasyApplyStorage = new StorageManager();
