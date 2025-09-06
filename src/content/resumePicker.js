// Resume selection logic for LinkedIn Easy Apply automation
// Automatically selects the appropriate resume based on job title bucket

class ResumePicker {
  constructor() {
    this.config = null;
  }

  setConfig(config) {
    this.config = config;
  }

  // Select the appropriate resume for a job
  async selectResume(jobBucket) {
    if (!this.config || !this.config.resumes) {
      throw new Error("Resume configuration not available");
    }

    const resumeLabel = this.getResumeLabel(jobBucket);
    if (!resumeLabel) {
      throw new Error(`No resume configured for bucket: ${jobBucket}`);
    }

    try {
      const selectors = window.linkedinEasyApplySelectors;
      const stealth = window.linkedinEasyApplyStealth;

      // Wait for resume section to appear
      const resumeSection = await selectors.waitForElement(
        "resumeSection",
        10000
      );
      if (!resumeSection) {
        throw new Error("Resume section not found");
      }

      // Find resume options
      const resumeOptions = selectors.findAllElements(
        "resumeOption",
        resumeSection
      );
      if (resumeOptions.length === 0) {
        throw new Error("No resume options found");
      }

      // Find the correct resume
      const targetResume = this.findResumeByLabel(resumeOptions, resumeLabel);
      if (!targetResume) {
        console.warn(
          `Resume "${resumeLabel}" not found, using first available resume`
        );
        const firstResume = resumeOptions[0];
        await stealth.simulateClick(firstResume);
        return true;
      }

      // Select the resume
      await stealth.simulateClick(targetResume);
      console.log(`Selected resume: ${resumeLabel}`);
      return true;
    } catch (error) {
      console.error("Error selecting resume:", error);
      throw error;
    }
  }

  // Get resume label for job bucket
  getResumeLabel(jobBucket) {
    if (!this.config || !this.config.resumes) return null;

    switch (jobBucket) {
      case "frontend":
        return this.config.resumes.frontend;
      case "fullstack":
        return this.config.resumes.fullstack;
      default:
        return null;
    }
  }

  // Find resume option by label
  findResumeByLabel(resumeOptions, targetLabel) {
    for (const option of resumeOptions) {
      // Check if this is a radio button with associated label
      if (option.type === "radio") {
        const label = this.getAssociatedLabel(option);
        if (label && this.matchesResumeLabel(label, targetLabel)) {
          return option;
        }
      }

      // Check if this is a button or div with text content
      if (
        option.textContent &&
        this.matchesResumeLabel(option.textContent, targetLabel)
      ) {
        return option;
      }
    }

    return null;
  }

  // Get label associated with a form element
  getAssociatedLabel(element) {
    // Check for 'for' attribute
    const forAttr = element.getAttribute("for");
    if (forAttr) {
      const label = document.getElementById(forAttr);
      if (label) return label.textContent;
    }

    // Check for aria-labelledby
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const label = document.getElementById(labelledBy);
      if (label) return label.textContent;
    }

    // Check for aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Check parent label
    const parentLabel = element.closest("label");
    if (parentLabel) return parentLabel.textContent;

    // Check previous sibling label
    const prevSibling = element.previousElementSibling;
    if (prevSibling && prevSibling.tagName === "LABEL") {
      return prevSibling.textContent;
    }

    // Check next sibling label
    const nextSibling = element.nextElementSibling;
    if (nextSibling && nextSibling.tagName === "LABEL") {
      return nextSibling.textContent;
    }

    return null;
  }

  // Check if label matches target resume label
  matchesResumeLabel(label, targetLabel) {
    if (!label || !targetLabel) return false;

    const normalizedLabel = label.toLowerCase().trim();
    const normalizedTarget = targetLabel.toLowerCase().trim();

    // Exact match
    if (normalizedLabel === normalizedTarget) return true;

    // Contains match
    if (normalizedLabel.includes(normalizedTarget)) return true;

    // Partial match for common variations
    const labelWords = normalizedLabel.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);

    // Check if all target words are present in label
    return targetWords.every((word) =>
      labelWords.some((labelWord) => labelWord.includes(word))
    );
  }

  // Get available resumes
  async getAvailableResumes() {
    try {
      const selectors = window.linkedinEasyApplySelectors;

      // Wait for resume section
      const resumeSection = await selectors.waitForElement(
        "resumeSection",
        5000
      );
      if (!resumeSection) return [];

      // Find all resume options
      const resumeOptions = selectors.findAllElements(
        "resumeOption",
        resumeSection
      );
      const resumes = [];

      for (const option of resumeOptions) {
        const label =
          this.getAssociatedLabel(option) ||
          option.textContent ||
          "Unknown Resume";
        resumes.push({
          element: option,
          label: label.trim(),
          value: option.value || option.id || label.trim(),
        });
      }

      return resumes;
    } catch (error) {
      console.error("Error getting available resumes:", error);
      return [];
    }
  }

  // Validate resume configuration
  validateResumeConfig() {
    if (!this.config || !this.config.resumes) {
      return { valid: false, error: "No resume configuration found" };
    }

    const { frontend, fullstack } = this.config.resumes;

    if (!frontend || !fullstack) {
      return {
        valid: false,
        error: "Both frontend and fullstack resume labels must be configured",
      };
    }

    if (frontend === fullstack) {
      return {
        valid: false,
        error: "Frontend and fullstack resume labels must be different",
      };
    }

    return { valid: true };
  }

  // Test resume selection (for debugging)
  async testResumeSelection() {
    try {
      const resumes = await this.getAvailableResumes();
      console.log("Available resumes:", resumes);

      const validation = this.validateResumeConfig();
      console.log("Resume config validation:", validation);

      return { resumes, validation };
    } catch (error) {
      console.error("Error testing resume selection:", error);
      return { error: error.message };
    }
  }
}

// Export singleton instance
window.linkedinEasyApplyResumePicker = new ResumePicker();
