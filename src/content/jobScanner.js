// jobScanner.js
// Utility to scan LinkedIn job cards and extract job info

/**
 * Scans the LinkedIn Jobs page for job cards with Easy Apply
 * @returns {Array<{title: string, company: string, easyApplyButton: HTMLElement, card: HTMLElement}>}
 */
function getEasyApplyJobs() {
  const jobCards = Array.from(document.querySelectorAll("[data-job-id]"));
  const jobs = [];
  jobCards.forEach((card) => {
    // Find Easy Apply button
    const easyBtn = card.querySelector(
      "button[aria-label*='Easy Apply'], button:contains('Easy Apply')"
    );
    if (easyBtn) {
      // Extract job title
      let title = "";
      let company = "";
      // Try common selectors
      const titleEl = card.querySelector(
        "h3, .job-card-list__title, .base-search-card__title"
      );
      if (titleEl) title = titleEl.textContent.trim();
      const companyEl = card.querySelector(
        ".job-card-container__company-name, .base-search-card__subtitle"
      );
      if (companyEl) company = companyEl.textContent.trim();
      jobs.push({ title, company, easyApplyButton: easyBtn, card });
    }
  });
  return jobs;
}

// Export for usage in content.js
export { getEasyApplyJobs };
