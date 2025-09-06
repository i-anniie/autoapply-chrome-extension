// Stealth behavior simulation for LinkedIn Easy Apply automation
// Implements human-like interactions to reduce detection

class StealthBehavior {
  constructor() {
    this.config = {
      simulateTyping: true,
      typingDelayPerCharMs: { min: 50, max: 180 },
      randomScrolls: true,
      randomMouseNoise: true,
      scrollIntoViewBeforeInteract: true,
      microPauses: true,
      occasionalBackspace: true,
    };
  }

  setConfig(config) {
    this.config = { ...this.config, ...config.behavior };
  }

  // Generate random delay within range
  randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Wait for random amount of time
  async randomWait(minMs = 100, maxMs = 500) {
    const delay = this.randomDelay(minMs, maxMs);
    await this.sleep(delay);
  }

  // Sleep utility
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Simulate human-like typing
  async simulateTyping(element, text) {
    if (!this.config.simulateTyping) {
      element.value = text;
      this.dispatchEvents(element, "input", "change");
      return;
    }

    // Clear existing value
    element.value = "";
    this.dispatchEvents(element, "input", "change");

    // Focus the element
    element.focus();
    await this.randomWait(50, 150);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Simulate occasional backspace and retype
      if (this.config.occasionalBackspace && Math.random() < 0.05 && i > 0) {
        element.value = element.value.slice(0, -1);
        this.dispatchEvents(element, "input", "change");
        await this.randomWait(100, 300);

        element.value += char;
        this.dispatchEvents(element, "input", "change");
      } else {
        element.value += char;
        this.dispatchEvents(element, "input", "change");
      }

      // Random typing delay
      const delay = this.randomDelay(
        this.config.typingDelayPerCharMs.min,
        this.config.typingDelayPerCharMs.max
      );
      await this.sleep(delay);

      // Occasional micro-pauses
      if (this.config.microPauses && Math.random() < 0.1) {
        await this.randomWait(200, 800);
      }
    }

    // Final blur
    element.blur();
    await this.randomWait(100, 300);
  }

  // Dispatch realistic events
  dispatchEvents(element, ...eventTypes) {
    eventTypes.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    });
  }

  // Simulate realistic mouse click sequence
  async simulateClick(element) {
    if (!element || !this.isElementInteractable(element)) {
      throw new Error("Element not interactable");
    }

    // Scroll into view if needed
    if (this.config.scrollIntoViewBeforeInteract) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      await this.randomWait(300, 800);
    }

    // Add random mouse noise before click
    if (this.config.randomMouseNoise) {
      await this.addMouseNoise(element);
    }

    // Get element position
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Simulate realistic click sequence
    const events = [
      { type: "mouseover", clientX: x, clientY: y },
      { type: "mousedown", clientX: x, clientY: y },
      { type: "mouseup", clientX: x, clientY: y },
      { type: "click", clientX: x, clientY: y },
    ];

    for (const eventData of events) {
      const event = new MouseEvent(eventData.type, {
        bubbles: true,
        cancelable: true,
        clientX: eventData.clientX,
        clientY: eventData.clientY,
        button: 0,
      });

      element.dispatchEvent(event);

      // Small delay between events
      await this.randomWait(10, 50);
    }

    // Random post-click delay
    await this.randomWait(100, 400);
  }

  // Add random mouse movements around element
  async addMouseNoise(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Generate 2-4 random mouse movements
    const numMovements = this.randomDelay(2, 4);

    for (let i = 0; i < numMovements; i++) {
      const offsetX = this.randomDelay(-50, 50);
      const offsetY = this.randomDelay(-30, 30);

      const event = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: centerX + offsetX,
        clientY: centerY + offsetY,
      });

      document.dispatchEvent(event);
      await this.randomWait(50, 150);
    }
  }

  // Simulate random scrolling
  async simulateRandomScroll() {
    if (!this.config.randomScrolls) return;

    const scrollAmount = this.randomDelay(100, 400);
    const direction = Math.random() < 0.5 ? 1 : -1;

    window.scrollBy({
      top: scrollAmount * direction,
      behavior: "smooth",
    });

    await this.randomWait(500, 1500);
  }

  // Check if element is interactable
  isElementInteractable(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0 &&
      !element.disabled &&
      !element.readOnly &&
      element.offsetParent !== null
    );
  }

  // Simulate form field interaction
  async interactWithField(field, value) {
    if (!this.isElementInteractable(field)) {
      throw new Error("Field not interactable");
    }

    // Scroll into view
    if (this.config.scrollIntoViewBeforeInteract) {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      await this.randomWait(200, 600);
    }

    // Focus field
    field.focus();
    await this.randomWait(100, 300);

    // Handle different field types
    if (field.tagName === "SELECT") {
      await this.handleSelectField(field, value);
    } else if (field.type === "radio" || field.type === "checkbox") {
      await this.handleRadioCheckbox(field);
    } else {
      await this.simulateTyping(field, value);
    }
  }

  // Handle select dropdown
  async handleSelectField(selectElement, value) {
    // Find option by text
    const options = Array.from(selectElement.querySelectorAll("option"));
    const option = options.find((opt) =>
      opt.textContent.toLowerCase().includes(value.toLowerCase())
    );

    if (option) {
      selectElement.value = option.value;
      this.dispatchEvents(selectElement, "change");
      await this.randomWait(100, 300);
    }
  }

  // Handle radio button or checkbox
  async handleRadioCheckbox(element) {
    if (!element.checked) {
      await this.simulateClick(element);
    }
  }

  // Simulate human-like page interaction
  async simulatePageInteraction() {
    // Random scroll
    await this.simulateRandomScroll();

    // Random mouse movements
    if (this.config.randomMouseNoise) {
      const randomX = this.randomDelay(100, window.innerWidth - 100);
      const randomY = this.randomDelay(100, window.innerHeight - 100);

      const event = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: randomX,
        clientY: randomY,
      });

      document.dispatchEvent(event);
    }

    // Random pause
    await this.randomWait(500, 2000);
  }

  // Simulate reading behavior (pause with occasional scrolls)
  async simulateReading(durationMs = 3000) {
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      // Occasional small scroll
      if (Math.random() < 0.3) {
        window.scrollBy({
          top: this.randomDelay(-100, 100),
          behavior: "smooth",
        });
      }

      await this.randomWait(500, 1500);
    }
  }
}

// Export singleton instance
window.linkedinEasyApplyStealth = new StealthBehavior();
