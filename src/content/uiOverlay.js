// UI Overlay for LinkedIn Easy Apply automation
// Provides visual feedback and debugging information

class UIOverlay {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
    this.config = null;
  }

  setConfig(config) {
    this.config = config;
    if (config.debug?.overlay) {
      this.show();
    } else {
      this.hide();
    }
  }

  // Create and show the overlay
  show() {
    if (this.overlay) return;

    this.overlay = document.createElement("div");
    this.overlay.id = "linkedin-easy-apply-ui-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      padding: 15px;
      border-radius: 8px;
      z-index: 10000;
      border: 2px solid #0077b5;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    `;

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      color: #0077b5;
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement("span");
    title.textContent = "LinkedIn Easy Apply";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    closeBtn.onclick = () => this.hide();

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.overlay.appendChild(header);

    // Create status section
    this.statusSection = document.createElement("div");
    this.statusSection.style.cssText = "margin-bottom: 10px;";
    this.overlay.appendChild(this.statusSection);

    // Create stats section
    this.statsSection = document.createElement("div");
    this.statsSection.style.cssText = "margin-bottom: 10px;";
    this.overlay.appendChild(this.statsSection);

    // Create current job section
    this.currentJobSection = document.createElement("div");
    this.currentJobSection.style.cssText = "margin-bottom: 10px;";
    this.overlay.appendChild(this.currentJobSection);

    // Create log section
    this.logSection = document.createElement("div");
    this.logSection.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 10px;
      background: rgba(255, 255, 255, 0.1);
      padding: 8px;
      border-radius: 4px;
    `;
    this.overlay.appendChild(this.logSection);

    document.body.appendChild(this.overlay);
    this.isVisible = true;

    // Initialize content
    this.updateStatus("Initializing...");
    this.updateStats({ applied: 0, skipped: 0, errors: 0, processed: 0 });
    this.updateCurrentJob(null);
  }

  // Hide the overlay
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.isVisible = false;
    }
  }

  // Toggle overlay visibility
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // Update status
  updateStatus(status, color = "#6bcf7f") {
    if (!this.statusSection) return;

    this.statusSection.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
        <span style="font-weight: 500;">Status: ${status}</span>
      </div>
    `;
  }

  // Update statistics
  updateStats(stats) {
    if (!this.statsSection) return;

    this.statsSection.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
        <div style="color: #6bcf7f;">Applied: ${stats.applied}</div>
        <div style="color: #ffd93d;">Skipped: ${stats.skipped}</div>
        <div style="color: #ff6b6b;">Errors: ${stats.errors}</div>
        <div style="color: #74c0fc;">Processed: ${stats.processed}</div>
      </div>
    `;
  }

  // Update current job information
  updateCurrentJob(job) {
    if (!this.currentJobSection) return;

    if (!job) {
      this.currentJobSection.innerHTML =
        '<div style="color: #888;">No job being processed</div>';
      return;
    }

    this.currentJobSection.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 4px;">Current Job:</div>
      <div style="font-size: 11px; line-height: 1.4;">
        <div style="color: #74c0fc;">${job.title}</div>
        <div style="color: #888;">${job.company}</div>
        <div style="color: #888;">${job.dateText}</div>
      </div>
    `;
  }

  // Add log entry
  addLog(message, level = "info") {
    if (!this.logSection) return;

    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      error: "#ff6b6b",
      warn: "#ffd93d",
      info: "#6bcf7f",
      debug: "#74c0fc",
    };

    const logEntry = document.createElement("div");
    logEntry.style.cssText = `
      margin-bottom: 2px;
      color: ${colors[level] || "#fff"};
    `;
    logEntry.innerHTML = `
      <span style="color: #888;">[${timestamp}]</span>
      <span style="color: ${
        colors[level] || "#fff"
      }; font-weight: bold;">[${level.toUpperCase()}]</span>
      ${message}
    `;

    this.logSection.appendChild(logEntry);
    this.logSection.scrollTop = this.logSection.scrollHeight;

    // Keep only last 50 log entries
    const entries = this.logSection.children;
    if (entries.length > 50) {
      this.logSection.removeChild(entries[0]);
    }
  }

  // Clear logs
  clearLogs() {
    if (this.logSection) {
      this.logSection.innerHTML = "";
    }
  }

  // Update overlay position
  updatePosition(x, y) {
    if (this.overlay) {
      this.overlay.style.left = `${x}px`;
      this.overlay.style.top = `${y}px`;
    }
  }

  // Make overlay draggable
  makeDraggable() {
    if (!this.overlay) return;

    let isDragging = false;
    let startX, startY, startLeft, startTop;

    const header = this.overlay.querySelector("div");
    if (!header) return;

    header.style.cursor = "move";

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(this.overlay.style.left) || 20;
      startTop = parseInt(this.overlay.style.top) || 20;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      this.overlay.style.left = `${startLeft + deltaX}px`;
      this.overlay.style.top = `${startTop + deltaY}px`;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  // Show temporary message
  showMessage(message, duration = 3000) {
    if (!this.overlay) return;

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
      position: absolute;
      top: -30px;
      left: 0;
      right: 0;
      background: #0077b5;
      color: white;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
      font-size: 11px;
      z-index: 10001;
    `;
    messageDiv.textContent = message;

    this.overlay.appendChild(messageDiv);

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, duration);
  }

  // Check if overlay is visible
  isOverlayVisible() {
    return this.isVisible;
  }
}

// Export singleton instance
window.linkedinEasyApplyUIOverlay = new UIOverlay();
