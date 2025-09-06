// Form handling for LinkedIn Easy Apply automation
// Fills standard fields and handles additional questions

class FormHandler {
  constructor() {
    this.config = null;
    this.userData = null;
  }

  setConfig(config) {
    this.config = config;
    this.userData = config.user;
  }

  // Fill all form fields in the current step
  async fillForm() {
    try {
      const selectors = window.linkedinEasyApplySelectors;
      const stealth = window.linkedinEasyApplyStealth;

      // Wait for form to be ready
      await this.waitForFormReady();

      // Fill standard fields
      await this.fillStandardFields();

      // Handle additional questions
      await this.handleAdditionalQuestions();

      // Check for unexpected required fields
      const unexpectedRequired = await this.checkUnexpectedRequiredFields();
      if (unexpectedRequired.length > 0) {
        throw new Error(
          `Unexpected required fields found: ${unexpectedRequired.join(", ")}`
        );
      }

      console.log("Form filled successfully");
      return true;
    } catch (error) {
      console.error("Error filling form:", error);
      throw error;
    }
  }

  // Wait for form to be ready
  async waitForFormReady() {
    const selectors = window.linkedinEasyApplySelectors;

    // Wait for modal content
    await selectors.waitForElement("modalContent", 5000);

    // Wait a bit more for form fields to render
    await this.sleep(1000);
  }

  // Fill standard user information fields
  async fillStandardFields() {
    const stealth = window.linkedinEasyApplyStealth;

    const fieldMappings = [
      {
        key: "fullName",
        labels: ["name", "full name", "first name", "last name"],
      },
      { key: "email", labels: ["email", "e-mail"] },
      { key: "phone", labels: ["phone", "telephone", "mobile", "contact"] },
      { key: "location", labels: ["location", "city", "address"] },
      { key: "experienceYears", labels: ["experience", "years", "yrs"] },
      {
        key: "linkedinUrl",
        labels: ["linkedin", "linkedin profile", "profile"],
      },
      {
        key: "salaryExpectation",
        labels: ["salary", "compensation", "pay", "rate"],
      },
    ];

    for (const mapping of fieldMappings) {
      const value = this.userData[mapping.key];
      if (!value) continue;

      try {
        const field = this.findFieldByLabels(mapping.labels);
        if (field) {
          await stealth.interactWithField(field, value);
          console.log(`Filled ${mapping.key}: ${value}`);
        }
      } catch (error) {
        console.warn(`Failed to fill ${mapping.key}:`, error);
      }
    }
  }

  // Handle additional questions
  async handleAdditionalQuestions() {
    const selectors = window.linkedinEasyApplySelectors;
    const stealth = window.linkedinEasyApplyStealth;

    // Find all question containers
    const questionContainers = selectors.findAllElements("questionContainer");

    for (const container of questionContainers) {
      try {
        await this.handleQuestionContainer(container);
      } catch (error) {
        console.warn("Error handling question container:", error);
      }
    }
  }

  // Handle a single question container
  async handleQuestionContainer(container) {
    const stealth = window.linkedinEasyApplyStealth;

    // Get question text
    const questionText = container.textContent.toLowerCase();

    // Determine question type and answer
    const answer = this.getAnswerForQuestion(questionText);
    if (!answer) {
      console.log(`No default answer for question: ${questionText}`);
      return;
    }

    // Find and fill the appropriate input
    const input = this.findInputInContainer(container);
    if (input) {
      await stealth.interactWithField(input, answer);
      console.log(`Answered question: ${questionText} -> ${answer}`);
    }
  }

  // Get answer for a question based on text content
  getAnswerForQuestion(questionText) {
    const defaults = this.config.additionalQuestionsDefaults;
    if (!defaults) return null;

    // Work authorization
    if (
      questionText.includes("work authorization") ||
      questionText.includes("authorized to work")
    ) {
      return defaults.workAuthorization;
    }

    // Relocation
    if (
      questionText.includes("relocation") ||
      questionText.includes("relocate")
    ) {
      return defaults.relocation;
    }

    // Visa sponsorship
    if (
      questionText.includes("visa sponsorship") ||
      questionText.includes("sponsor")
    ) {
      return defaults.visaSponsorship;
    }

    // Remote work
    if (
      questionText.includes("remote") ||
      questionText.includes("work from home")
    ) {
      return defaults.remoteWork || "Yes";
    }

    // Contract work
    if (
      questionText.includes("contract") ||
      questionText.includes("freelance")
    ) {
      return defaults.contractWork || "No";
    }

    // Part-time work
    if (
      questionText.includes("part time") ||
      questionText.includes("part-time")
    ) {
      return defaults.partTime || "No";
    }

    // Salary questions
    if (
      questionText.includes("salary") ||
      questionText.includes("compensation")
    ) {
      return defaults.salary;
    }

    // Yes/No questions
    if (questionText.includes("yes") || questionText.includes("no")) {
      return defaults.yesNo;
    }

    // Multiple choice questions
    if (questionText.includes("select") || questionText.includes("choose")) {
      return defaults.mcq;
    }

    return null;
  }

  // Find input element in a container
  findInputInContainer(container) {
    const selectors = window.linkedinEasyApplySelectors;

    // Try different input types
    const inputTypes = [
      'input[type="text"]',
      'input[type="radio"]',
      'input[type="checkbox"]',
      "select",
      "textarea",
    ];

    for (const inputType of inputTypes) {
      const input = container.querySelector(inputType);
      if (input && selectors.isElementInteractable(input)) {
        return input;
      }
    }

    return null;
  }

  // Find field by multiple possible labels
  findFieldByLabels(labels) {
    const selectors = window.linkedinEasyApplySelectors;

    for (const label of labels) {
      const field = selectors.findFieldByLabel(label);
      if (field) return field;
    }

    return null;
  }

  // Check for unexpected required fields
  async checkUnexpectedRequiredFields() {
    const selectors = window.linkedinEasyApplySelectors;
    const unexpectedFields = [];

    const requiredFields = selectors.findAllElements("requiredField");

    for (const field of requiredFields) {
      if (!this.isFieldHandled(field)) {
        const label = this.getFieldLabel(field);
        unexpectedFields.push(label || "Unknown field");
      }
    }

    return unexpectedFields;
  }

  // Check if a field is already handled
  isFieldHandled(field) {
    const value = field.value || field.checked;
    return value && value.toString().trim() !== "";
  }

  // Get label for a field
  getFieldLabel(field) {
    const selectors = window.linkedinEasyApplySelectors;
    return (
      selectors.getAssociatedLabel(field) || field.placeholder || field.name
    );
  }

  // Navigate to next step
  async goToNextStep() {
    try {
      const selectors = window.linkedinEasyApplySelectors;
      const stealth = window.linkedinEasyApplyStealth;

      // Find next button
      const nextButton = selectors.findElement("nextButton");
      if (!nextButton) {
        throw new Error("Next button not found");
      }

      // Click next button
      await stealth.simulateClick(nextButton);

      // Wait for next step to load
      await this.sleep(2000);

      return true;
    } catch (error) {
      console.error("Error going to next step:", error);
      throw error;
    }
  }

  // Submit the application
  async submitApplication() {
    try {
      const selectors = window.linkedinEasyApplySelectors;
      const stealth = window.linkedinEasyApplyStealth;

      // Find submit button
      const submitButton = selectors.findElement("submitButton");
      if (!submitButton) {
        throw new Error("Submit button not found");
      }

      // Click submit button
      await stealth.simulateClick(submitButton);

      // Wait for submission confirmation
      await this.sleep(3000);

      return true;
    } catch (error) {
      console.error("Error submitting application:", error);
      throw error;
    }
  }

  // Close the application modal
  async closeModal() {
    try {
      const selectors = window.linkedinEasyApplySelectors;
      const stealth = window.linkedinEasyApplyStealth;

      // Try to find close button
      const closeButton = selectors.findElement("closeButton");
      if (closeButton) {
        await stealth.simulateClick(closeButton);
      } else {
        // Fallback: press Escape key
        const escapeEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          which: 27,
          bubbles: true,
        });
        document.dispatchEvent(escapeEvent);
      }

      // Wait for modal to close
      await this.sleep(1000);
    } catch (error) {
      console.error("Error closing modal:", error);
    }
  }

  // Check if we're on the final step
  isFinalStep() {
    const selectors = window.linkedinEasyApplySelectors;
    const submitButton = selectors.findElement("submitButton");
    return !!submitButton;
  }

  // Check if modal is still open
  isModalOpen() {
    const selectors = window.linkedinEasyApplySelectors;
    const modal = selectors.findElement("applicationModal");
    return !!modal;
  }

  // Sleep utility
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
window.linkedinEasyApplyFormHandler = new FormHandler();
