// Main content script for LinkedIn Easy Apply automation
// Orchestrates the entire automation process

class LinkedInEasyApplyAutomation {
  constructor() {
    this.isRunning = false;
    this.isDryRun = true;
    this.config = null;
    this.currentJob = null;
    this.automationLoop = null;
  }

  async initialize() {
    try {
      console.log("Initializing LinkedIn Easy Apply automation...");

      // Initialize all modules
      await this.initializeModules();

      // Load configuration
      await this.loadConfiguration();

      // Set up message listeners
      this.setupMessageListeners();

      // Initialize UI overlay
      this.initializeOverlay();

      console.log("LinkedIn Easy Apply automation initialized successfully");
    } catch (error) {
      console.error("Failed to initialize automation:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        availableModules: Object.keys(window).filter((key) =>
          key.startsWith("linkedinEasyApply")
        ),
      });
    }
  }

  async initializeModules() {
    // Wait for all modules to be available
    await this.waitForModules();

    // Initialize storage
    if (
      window.linkedinEasyApplyStorage &&
      window.linkedinEasyApplyStorage.initialize
    ) {
      await window.linkedinEasyApplyStorage.initialize();
    }

    // Initialize throttle manager
    if (
      window.linkedinEasyApplyThrottle &&
      window.linkedinEasyApplyThrottle.initialize
    ) {
      await window.linkedinEasyApplyThrottle.initialize();
    }

    // Initialize logger
    if (
      window.linkedinEasyApplyLogger &&
      window.linkedinEasyApplyLogger.setConfig
    ) {
      window.linkedinEasyApplyLogger.setConfig({ debug: { logLevel: "info" } });
    }
  }

  async waitForModules() {
    const requiredModules = [
      "linkedinEasyApplyStorage",
      "linkedinEasyApplyThrottle",
      "linkedinEasyApplyLogger",
      "linkedinEasyApplyDateParser",
      "linkedinEasyApplyJobScanner",
      "linkedinEasyApplyResumePicker",
      "linkedinEasyApplyFormHandler",
      "linkedinEasyApplyStealth",
      "linkedinEasyApplySelectors",
      "linkedinEasyApplyUIOverlay",
    ];

    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let elapsed = 0;

    console.log("Waiting for modules to load...");

    while (elapsed < maxWaitTime) {
      const missingModules = requiredModules.filter(
        (moduleName) => window[moduleName] === undefined
      );

      if (missingModules.length === 0) {
        console.log("All modules loaded successfully");
        return;
      }

      if (elapsed % 1000 === 0) {
        // Log every second
        console.log(`Still waiting for modules: ${missingModules.join(", ")}`);
      }

      await this.sleep(checkInterval);
      elapsed += checkInterval;
    }

    const stillMissing = requiredModules.filter(
      (moduleName) => window[moduleName] === undefined
    );
    throw new Error(
      `Timeout waiting for modules to load. Still missing: ${stillMissing.join(
        ", "
      )}`
    );
  }

  async loadConfiguration() {
    try {
      this.config = await window.linkedinEasyApplyStorage.getConfig();

      // Set config for all modules
      window.linkedinEasyApplyDateParser.setConfig(this.config);
      window.linkedinEasyApplyJobScanner.setConfig(this.config);
      window.linkedinEasyApplyResumePicker.setConfig(this.config);
      window.linkedinEasyApplyFormHandler.setConfig(this.config);
      window.linkedinEasyApplyStealth.setConfig(this.config);
      window.linkedinEasyApplyThrottle.setConfig(this.config);

      // Set logger config
      window.linkedinEasyApplyLogger.setConfig(this.config);

      console.log("Configuration loaded successfully");
    } catch (error) {
      console.error("Failed to load configuration:", error);
      throw error;
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case "START":
          await this.startAutomation();
          break;
        case "STOP":
          await this.stopAutomation();
          break;
        case "UPDATE_DRY_RUN":
          this.isDryRun = message.dryRun;
          window.linkedinEasyApplyLogger.info(
            `Dry run mode: ${this.isDryRun ? "ON" : "OFF"}`
          );
          break;
        case "COOLDOWN_COMPLETE":
          window.linkedinEasyApplyLogger.info("Batch cooldown completed");
          break;
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  initializeOverlay() {
    if (this.config?.debug?.overlay) {
      window.linkedinEasyApplyUIOverlay.setConfig(this.config);
      window.linkedinEasyApplyUIOverlay.makeDraggable();
    }
  }

  async startAutomation() {
    if (this.isRunning) {
      console.log("Automation is already running");
      return;
    }

    try {
      this.isRunning = true;
      window.linkedinEasyApplyLogger.info("Starting automation...");
      window.linkedinEasyApplyUIOverlay.updateStatus("Starting...", "#ffd93d");

      // Update storage
      await window.linkedinEasyApplyStorage.updateState({ isRunning: true });

      // Start the automation loop
      this.automationLoop = this.runAutomationLoop();
    } catch (error) {
      console.error("Failed to start automation:", error);
      await this.stopAutomation();
    }
  }

  async stopAutomation() {
    if (!this.isRunning) {
      console.log("Automation is not running");
      return;
    }

    try {
      this.isRunning = false;
      window.linkedinEasyApplyLogger.info("Stopping automation...");
      window.linkedinEasyApplyUIOverlay.updateStatus("Stopped", "#ff6b6b");

      // Update storage
      await window.linkedinEasyApplyStorage.updateState({ isRunning: false });

      // Clear any ongoing processes
      if (this.automationLoop) {
        this.automationLoop = null;
      }
    } catch (error) {
      console.error("Failed to stop automation:", error);
    }
  }

  async runAutomationLoop() {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        const canProcess = window.linkedinEasyApplyThrottle.canProcessJob();
        if (!canProcess.canProcess) {
          window.linkedinEasyApplyLogger.warn(
            `Cannot process job: ${canProcess.reason}`
          );
          window.linkedinEasyApplyUIOverlay.updateStatus(
            `Waiting: ${canProcess.reason}`,
            "#ffd93d"
          );

          // Wait and check again
          await this.sleep(30000);
          continue;
        }

        // Get next job
        const job = await window.linkedinEasyApplyJobScanner.getNextJob();
        if (!job) {
          window.linkedinEasyApplyLogger.info("No more jobs to process");
          window.linkedinEasyApplyUIOverlay.updateStatus(
            "No more jobs",
            "#888"
          );

          // Wait and try again
          await this.sleep(10000);
          continue;
        }

        // Process the job
        await this.processJob(job);

        // Wait between jobs
        await window.linkedinEasyApplyThrottle.waitForActionDelay();
      } catch (error) {
        console.error("Error in automation loop:", error);
        await window.linkedinEasyApplyThrottle.incrementCounter("errors");
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    try {
      this.currentJob = job;
      window.linkedinEasyApplyLogger.info(
        `Processing job: ${job.title} at ${job.company}`
      );
      window.linkedinEasyApplyUIOverlay.updateCurrentJob(job);
      window.linkedinEasyApplyUIOverlay.updateStatus(
        "Processing job...",
        "#74c0fc"
      );

      // Mark job as processed
      window.linkedinEasyApplyJobScanner.markJobProcessed(job.id);
      await window.linkedinEasyApplyThrottle.incrementCounter("processed");

      // Check if this is a dry run
      if (this.isDryRun) {
        window.linkedinEasyApplyLogger.info(
          `DRY RUN: Would apply to ${job.title} at ${job.company}`
        );
        await window.linkedinEasyApplyThrottle.incrementCounter("skipped");
        return;
      }

      // Click Easy Apply button
      await this.clickEasyApplyButton(job);

      // Process the application
      await this.processApplication(job);

      // Record successful application
      await window.linkedinEasyApplyStorage.addAppliedJob(
        job.id,
        job.title,
        job.company
      );
      await window.linkedinEasyApplyThrottle.incrementCounter("applied");

      window.linkedinEasyApplyLogger.info(
        `Successfully applied to: ${job.title} at ${job.company}`
      );
    } catch (error) {
      console.error(`Error processing job ${job.title}:`, error);
      await window.linkedinEasyApplyThrottle.incrementCounter("errors");

      // Try to close any open modals
      try {
        await window.linkedinEasyApplyFormHandler.closeModal();
      } catch (closeError) {
        console.error("Error closing modal:", closeError);
      }
    } finally {
      this.currentJob = null;
      window.linkedinEasyApplyUIOverlay.updateCurrentJob(null);
    }
  }

  async clickEasyApplyButton(job) {
    try {
      const stealth = window.linkedinEasyApplyStealth;

      // Scroll to job card
      job.element.scrollIntoView({ behavior: "smooth", block: "center" });
      await this.sleep(1000);

      // Click Easy Apply button
      await stealth.simulateClick(job.easyApplyButton);

      // Wait for modal to open
      await this.sleep(2000);
    } catch (error) {
      console.error("Error clicking Easy Apply button:", error);
      throw error;
    }
  }

  async processApplication(job) {
    try {
      const formHandler = window.linkedinEasyApplyFormHandler;
      const resumePicker = window.linkedinEasyApplyResumePicker;

      // Wait for application modal
      await this.waitForApplicationModal();

      // Process each step
      while (formHandler.isModalOpen()) {
        // Select resume if needed
        if (await this.needsResumeSelection()) {
          await resumePicker.selectResume(job.bucket);
        }

        // Fill form fields
        await formHandler.fillForm();

        // Check if this is the final step
        if (formHandler.isFinalStep()) {
          await formHandler.submitApplication();
          break;
        } else {
          await formHandler.goToNextStep();
        }

        // Wait for next step to load
        await this.sleep(2000);
      }
    } catch (error) {
      console.error("Error processing application:", error);
      throw error;
    }
  }

  async waitForApplicationModal() {
    const selectors = window.linkedinEasyApplySelectors;

    try {
      await selectors.waitForElement("applicationModal", 10000);
    } catch (error) {
      throw new Error("Application modal did not open");
    }
  }

  async needsResumeSelection() {
    const selectors = window.linkedinEasyApplySelectors;
    const resumeSection = selectors.findElement("resumeSection");
    return !!resumeSection;
  }

  // Utility methods
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Check if we're on a valid page
  isOnValidPage() {
    return window.location.href.includes("linkedin.com/jobs");
  }
}

// Initialize automation when page loads
let automation;

async function initializeAutomation() {
  if (window.location.href.includes("linkedin.com/jobs")) {
    automation = new LinkedInEasyApplyAutomation();
    await automation.initialize();
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAutomation);
} else {
  initializeAutomation();
}

// Re-initialize on navigation
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (currentUrl.includes("linkedin.com/jobs")) {
      setTimeout(initializeAutomation, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });
