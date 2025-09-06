// Centralized logging system for LinkedIn Easy Apply automation
// Supports different log levels and optional overlay display

class Logger {
  constructor() {
    this.logLevel = "info";
    this.overlay = null;
    this.logs = [];
    this.maxLogs = 100;
  }

  setConfig(config) {
    this.logLevel = config.debug?.logLevel || "info";
    this.maxLogs = 100;
  }

  createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement("div");
    this.overlay.id = "linkedin-easy-apply-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 8px;
      z-index: 10000;
      overflow-y: auto;
      border: 2px solid #0077b5;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
      color: #0077b5;
      border-bottom: 1px solid #333;
      padding-bottom: 4px;
    `;
    header.textContent = "LinkedIn Easy Apply - Debug Log";
    this.overlay.appendChild(header);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 8px;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => this.hideOverlay();
    this.overlay.appendChild(closeBtn);

    this.logContainer = document.createElement("div");
    this.overlay.appendChild(this.logContainer);

    document.body.appendChild(this.overlay);
  }

  hideOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.logContainer = null;
    }
  }

  showOverlay() {
    this.createOverlay();
  }

  log(level, message, data = null) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    if (levels[level] > levels[this.logLevel]) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging
    const consoleMethod =
      level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[consoleMethod](`[LinkedIn Easy Apply] ${message}`, data || "");

    // Overlay logging
    if (this.overlay && this.logContainer) {
      this.addToOverlay(logEntry);
    }
  }

  addToOverlay(logEntry) {
    const logElement = document.createElement("div");
    logElement.style.cssText = `
      margin-bottom: 4px;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 11px;
      word-wrap: break-word;
    `;

    const levelColors = {
      error: "#ff6b6b",
      warn: "#ffd93d",
      info: "#6bcf7f",
      debug: "#74c0fc",
    };

    logElement.style.color = levelColors[logEntry.level] || "white";
    logElement.innerHTML = `
      <span style="color: #888;">[${logEntry.timestamp}]</span>
      <span style="color: ${
        levelColors[logEntry.level]
      }; font-weight: bold;">[${logEntry.level.toUpperCase()}]</span>
      ${logEntry.message}
    `;

    if (logEntry.data) {
      const dataElement = document.createElement("div");
      dataElement.style.cssText =
        "margin-left: 10px; color: #ccc; font-size: 10px;";
      dataElement.textContent = JSON.stringify(logEntry.data, null, 2);
      logElement.appendChild(dataElement);
    }

    this.logContainer.appendChild(logElement);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  error(message, data = null) {
    this.log("error", message, data);
  }

  warn(message, data = null) {
    this.log("warn", message, data);
  }

  info(message, data = null) {
    this.log("info", message, data);
  }

  debug(message, data = null) {
    this.log("debug", message, data);
  }

  clear() {
    this.logs = [];
    if (this.logContainer) {
      this.logContainer.innerHTML = "";
    }
  }

  getLogs() {
    return [...this.logs];
  }
}

// Export singleton instance
window.linkedinEasyApplyLogger = new Logger();
