// Throttling and rate limiting for LinkedIn Easy Apply automation
// Manages delays, batch processing, and cooldown periods

class ThrottleManager {
  constructor() {
    this.config = {
      perActionDelayMs: { min: 8000, max: 15000 },
      batchSize: 8,
      batchCooldownMs: { min: 180000, max: 420000 },
      maxPerHour: 20,
      maxPerDay: 80,
    };

    this.counters = {
      applied: 0,
      skipped: 0,
      errors: 0,
      processed: 0,
    };

    this.batchStartTime = null;
    this.lastHourReset = Date.now();
    this.lastDayReset = Date.now();
  }

  setConfig(config) {
    this.config = { ...this.config, ...config.throttling };
  }

  async initialize() {
    try {
      const storage = window.linkedinEasyApplyStorage;
      const stats = await storage.getStats();
      this.counters = { ...this.counters, ...stats };

      const state = await storage.getState();
      this.batchStartTime = state.batchStartTime;

      this.resetCountersIfNeeded();
    } catch (error) {
      console.error("Failed to initialize throttle manager:", error);
    }
  }

  // Check if we can process more jobs
  canProcessJob() {
    // Check hourly limit
    if (this.counters.applied >= this.config.maxPerHour) {
      return { canProcess: false, reason: "Hourly limit reached" };
    }

    // Check daily limit
    if (this.counters.applied >= this.config.maxPerDay) {
      return { canProcess: false, reason: "Daily limit reached" };
    }

    // Check if we're in batch cooldown
    if (this.isInCooldown()) {
      return { canProcess: false, reason: "Batch cooldown active" };
    }

    return { canProcess: true };
  }

  // Check if we're currently in a batch cooldown
  isInCooldown() {
    if (!this.batchStartTime) return false;

    const jobsInBatch = this.counters.processed % this.config.batchSize;
    if (jobsInBatch === 0 && this.counters.processed > 0) {
      // We've completed a batch, check if cooldown is still active
      const cooldownDuration = this.randomDelay(
        this.config.batchCooldownMs.min,
        this.config.batchCooldownMs.max
      );

      const timeSinceBatchStart = Date.now() - this.batchStartTime;
      return timeSinceBatchStart < cooldownDuration;
    }

    return false;
  }

  // Get random delay within configured range
  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Wait for per-action delay
  async waitForActionDelay() {
    const delay = this.randomDelay(
      this.config.perActionDelayMs.min,
      this.config.perActionDelayMs.max
    );

    console.log(`Waiting ${delay}ms before next action...`);
    await this.sleep(delay);
  }

  // Sleep utility
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Start a new batch
  startBatch() {
    this.batchStartTime = Date.now();
    this.saveState();
  }

  // Check if we need to start a new batch
  shouldStartNewBatch() {
    const jobsInBatch = this.counters.processed % this.config.batchSize;
    return jobsInBatch === 0 && this.counters.processed > 0;
  }

  // Check if we need to start cooldown
  shouldStartCooldown() {
    const jobsInBatch = this.counters.processed % this.config.batchSize;
    return jobsInBatch === 0 && this.counters.processed > 0;
  }

  // Start batch cooldown
  async startCooldown() {
    if (!this.shouldStartCooldown()) return;

    const cooldownDuration = this.randomDelay(
      this.config.batchCooldownMs.min,
      this.config.batchCooldownMs.max
    );

    console.log(
      `Starting batch cooldown for ${Math.round(
        cooldownDuration / 60000
      )} minutes`
    );

    // Set alarm in background script
    try {
      await chrome.runtime.sendMessage({
        type: "SET_ALARM",
        delayMs: cooldownDuration,
      });
    } catch (error) {
      console.error("Failed to set cooldown alarm:", error);
    }

    // Update status
    this.updateStatus("Cooldown");
  }

  // Increment counter and update storage
  async incrementCounter(type, amount = 1) {
    this.counters[type] = (this.counters[type] || 0) + amount;

    try {
      const storage = window.linkedinEasyApplyStorage;
      await storage.updateStats({ [type]: this.counters[type] });

      // Notify popup of stats update
      chrome.runtime.sendMessage({
        type: "STATS_UPDATE",
        stats: this.counters,
      });
    } catch (error) {
      console.error("Failed to update counter:", error);
    }
  }

  // Reset counters if needed (hourly/daily)
  resetCountersIfNeeded() {
    const now = Date.now();

    // Reset hourly counters
    if (now - this.lastHourReset > 3600000) {
      // 1 hour
      this.counters.applied = 0;
      this.lastHourReset = now;
      console.log("Hourly counters reset");
    }

    // Reset daily counters
    if (now - this.lastDayReset > 86400000) {
      // 24 hours
      this.counters.applied = 0;
      this.lastDayReset = now;
      console.log("Daily counters reset");
    }
  }

  // Update status in popup
  updateStatus(status) {
    try {
      chrome.runtime.sendMessage({
        type: "STATUS_UPDATE",
        status,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  // Save current state
  async saveState() {
    try {
      const storage = window.linkedinEasyApplyStorage;
      await storage.updateState({
        batchStartTime: this.batchStartTime,
      });
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  // Get current statistics
  getStats() {
    return { ...this.counters };
  }

  // Get time until next batch can start
  getTimeUntilNextBatch() {
    if (!this.batchStartTime) return 0;

    const jobsInBatch = this.counters.processed % this.config.batchSize;
    if (jobsInBatch !== 0) return 0;

    const cooldownDuration = this.randomDelay(
      this.config.batchCooldownMs.min,
      this.config.batchCooldownMs.max
    );

    const timeSinceBatchStart = Date.now() - this.batchStartTime;
    const remainingTime = cooldownDuration - timeSinceBatchStart;

    return Math.max(0, remainingTime);
  }

  // Get formatted time string
  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  // Check if we should pause for the day
  shouldPauseForDay() {
    return this.counters.applied >= this.config.maxPerDay;
  }

  // Check if we should pause for the hour
  shouldPauseForHour() {
    return this.counters.applied >= this.config.maxPerHour;
  }

  // Get next available time
  getNextAvailableTime() {
    if (this.shouldPauseForDay()) {
      const timeUntilMidnight = 86400000 - (Date.now() % 86400000);
      return timeUntilMidnight;
    }

    if (this.shouldPauseForHour()) {
      const timeUntilNextHour = 3600000 - (Date.now() % 3600000);
      return timeUntilNextHour;
    }

    return this.getTimeUntilNextBatch();
  }

  // Log current status
  logStatus() {
    console.log("Throttle Status:", {
      counters: this.counters,
      batchStartTime: this.batchStartTime,
      isInCooldown: this.isInCooldown(),
      timeUntilNextBatch: this.formatTime(this.getTimeUntilNextBatch()),
      canProcess: this.canProcessJob(),
    });
  }
}

// Export singleton instance
window.linkedinEasyApplyThrottle = new ThrottleManager();
