// CSS selectors and text matching utilities for LinkedIn Easy Apply
// Provides robust selectors that work across different LinkedIn layouts

class SelectorManager {
  constructor() {
    this.selectors = {
      // Job list and cards
      jobList: [
        ".jobs-search-results-list",
        ".jobs-search-results",
        '[data-test-id="job-search-results"]',
        ".jobs-search-results-list__list",
        "ul.jobs-search__results-list",
        ".scaffold-layout__list-container",
        ".jobs-unified-search__results-list",
      ],
      jobCard: [
        ".job-card-container",
        ".jobs-search-results__list-item",
        '[data-test-id="job-card"]',
        "li.jobs-search-results__list-item",
        ".base-card.base-search-card",
        ".jobs-unified-top-card__container",
        "a.job-card-list__title, a.base-card__full-link",
      ],
      jobTitle: [
        ".job-card-list__title",
        ".job-card-container__link",
        'a[data-test-id="job-title"]',
        ".jobs-unified-top-card__job-title",
      ],
      jobCompany: [
        ".job-card-container__company-name",
        ".job-card-container__metadata-item",
        ".jobs-unified-top-card__company-name",
      ],
      jobLocation: [
        ".job-card-container__metadata-item",
        ".jobs-unified-top-card__bullet",
      ],
      jobDate: [
        ".job-card-container__metadata-item",
        ".jobs-unified-top-card__posted-date",
        "time",
      ],

      // Easy Apply button
      easyApplyButton: [
        'button[aria-label*="Easy Apply"]',
        'button:contains("Easy Apply")',
        ".jobs-apply-button",
        'button[data-test-id="apply-button"]',
      ],

      // Application modal
      applicationModal: [
        ".jobs-easy-apply-modal",
        ".jobs-apply-modal",
        '[data-test-id="apply-modal"]',
      ],
      modalContent: [
        ".jobs-easy-apply-modal-content",
        ".jobs-apply-modal-content",
      ],

      // Resume selection
      resumeSection: [
        ".jobs-resume-picker",
        ".resume-picker",
        '[data-test-id="resume-picker"]',
      ],
      resumeOption: [
        'input[type="radio"][name*="resume"]',
        'input[type="radio"][name*="cv"]',
        ".resume-option",
      ],

      // Form fields
      formField: [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="tel"]',
        'input[type="number"]',
        "textarea",
        "select",
      ],
      requiredField: [
        "input[required]",
        "textarea[required]",
        "select[required]",
      ],

      // Navigation buttons
      nextButton: [
        'button[aria-label*="Continue"]',
        'button:contains("Next")',
        'button:contains("Continue")',
        ".jobs-easy-apply-footer__next-button",
      ],
      submitButton: [
        'button[aria-label*="Submit"]',
        'button:contains("Submit application")',
        'button:contains("Submit")',
        ".jobs-easy-apply-footer__submit-button",
      ],
      closeButton: [
        'button[aria-label*="Dismiss"]',
        'button[aria-label*="Close"]',
        ".jobs-easy-apply-modal__close-button",
      ],

      // Additional questions
      questionContainer: [
        ".jobs-easy-apply-form-section",
        ".form-section",
        ".question-container",
      ],
      radioGroup: ["fieldset", ".radio-group", '[role="radiogroup"]'],
      checkboxGroup: [".checkbox-group", '[role="group"]'],
    };
  }

  // Find element using multiple selector strategies
  findElement(selectorKey, context = document) {
    const selectors = this.selectors[selectorKey];
    if (!selectors) {
      console.warn(`Unknown selector key: ${selectorKey}`);
      return null;
    }

    for (const selector of selectors) {
      try {
        // Handle :contains() pseudo-selector manually
        if (selector.includes(":contains(")) {
          const element = this.findByText(selector, context);
          if (element) return element;
        } else {
          const element = context.querySelector(selector);
          if (element) return element;
        }
      } catch (error) {
        // Continue to next selector if current one fails
        continue;
      }
    }

    return null;
  }

  // Find all elements using multiple selector strategies
  findAllElements(selectorKey, context = document) {
    const selectors = this.selectors[selectorKey];
    if (!selectors) {
      console.warn(`Unknown selector key: ${selectorKey}`);
      return [];
    }

    for (const selector of selectors) {
      try {
        if (selector.includes(":contains(")) {
          const elements = this.findAllByText(selector, context);
          if (elements.length > 0) return elements;
        } else {
          const elements = Array.from(context.querySelectorAll(selector));
          if (elements.length > 0) return elements;
        }
      } catch (error) {
        continue;
      }
    }

    return [];
  }

  // Find element by text content (for :contains() pseudo-selector)
  findByText(selector, context = document) {
    const textMatch = selector.match(/:contains\("([^"]+)"\)/);
    if (!textMatch) return null;

    const text = textMatch[1];
    const baseSelector = selector.replace(/:contains\("[^"]+"\)/, "");

    const elements = baseSelector
      ? Array.from(context.querySelectorAll(baseSelector))
      : Array.from(context.querySelectorAll("*"));

    return elements.find((el) => el.textContent.includes(text)) || null;
  }

  // Find all elements by text content
  findAllByText(selector, context = document) {
    const textMatch = selector.match(/:contains\("([^"]+)"\)/);
    if (!textMatch) return [];

    const text = textMatch[1];
    const baseSelector = selector.replace(/:contains\("[^"]+"\)/, "");

    const elements = baseSelector
      ? Array.from(context.querySelectorAll(baseSelector))
      : Array.from(context.querySelectorAll("*"));

    return elements.filter((el) => el.textContent.includes(text));
  }

  // Find form field by label text
  findFieldByLabel(labelText, context = document) {
    const labels = Array.from(context.querySelectorAll("label"));
    const matchingLabel = labels.find((label) =>
      label.textContent.toLowerCase().includes(labelText.toLowerCase())
    );

    if (matchingLabel) {
      const field = matchingLabel.querySelector("input, textarea, select");
      if (field) return field;

      // Check for associated field via 'for' attribute
      const forAttr = matchingLabel.getAttribute("for");
      if (forAttr) {
        return context.getElementById(forAttr);
      }
    }

    // Fallback: search by placeholder or name attributes
    const fields = Array.from(
      context.querySelectorAll("input, textarea, select")
    );
    return fields.find((field) => {
      const placeholder = field.placeholder?.toLowerCase() || "";
      const name = field.name?.toLowerCase() || "";
      const ariaLabel = field.getAttribute("aria-label")?.toLowerCase() || "";

      return (
        placeholder.includes(labelText.toLowerCase()) ||
        name.includes(labelText.toLowerCase()) ||
        ariaLabel.includes(labelText.toLowerCase())
      );
    });
  }

  // Find radio button by value
  findRadioByValue(value, context = document) {
    const radios = Array.from(context.querySelectorAll('input[type="radio"]'));
    return radios.find(
      (radio) =>
        radio.value.toLowerCase() === value.toLowerCase() ||
        radio.nextElementSibling?.textContent
          .toLowerCase()
          .includes(value.toLowerCase())
    );
  }

  // Find select option by text
  findSelectOptionByText(selectElement, optionText) {
    const options = Array.from(selectElement.querySelectorAll("option"));
    return options.find((option) =>
      option.textContent.toLowerCase().includes(optionText.toLowerCase())
    );
  }

  // Check if element is visible and interactable
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
      !element.readOnly
    );
  }

  // Wait for element to appear
  async waitForElement(selectorKey, timeout = 10000, context = document) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = this.findElement(selectorKey, context);
        // jobList and other container elements may not be "interactable"; only require existence
        const skipInteractableCheck = selectorKey === "jobList";
        if (
          element &&
          (skipInteractableCheck || this.isElementInteractable(element))
        ) {
          resolve(element);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element not found within ${timeout}ms`));
          return;
        }

        setTimeout(checkElement, 100);
      };

      checkElement();
    });
  }

  // Wait for element to disappear
  async waitForElementToDisappear(
    selectorKey,
    timeout = 10000,
    context = document
  ) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = this.findElement(selectorKey, context);
        if (!element) {
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element still present after ${timeout}ms`));
          return;
        }

        setTimeout(checkElement, 100);
      };

      checkElement();
    });
  }
}

// Export singleton instance
window.linkedinEasyApplySelectors = new SelectorManager();
