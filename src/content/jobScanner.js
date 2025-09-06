// Job scanning and filtering for LinkedIn Easy Apply automation
// Finds job cards, extracts information, and filters by title and date

class JobScanner {
  constructor() {
    this.config = null;
    this.jobs = [];
    this.processedJobs = new Set();
  }

  setConfig(config) {
    this.config = config;
  }

  // Scan for jobs on the current page
  async scanJobs() {
    try {
      const selectors = window.linkedinEasyApplySelectors;
      const dateParser = window.linkedinEasyApplyDateParser;
      const storage = window.linkedinEasyApplyStorage;

      // Wait for job list to load (longer timeout due to LinkedIn render)
      const jobList = await selectors.waitForElement("jobList", 15000);
      if (!jobList) {
        console.warn("Job list not found");
        return [];
      }

      // Get all job cards
      let jobCards = selectors.findAllElements("jobCard", jobList);
      // Fallback: search globally if list scoping fails
      if (!jobCards || jobCards.length === 0) {
        jobCards = selectors.findAllElements("jobCard", document);
      }
      console.log(`Found ${jobCards.length} job cards`);

      const validJobs = [];

      for (const card of jobCards) {
        try {
          const jobInfo = await this.extractJobInfo(card);
          if (jobInfo && this.isValidJob(jobInfo)) {
            validJobs.push(jobInfo);
          }
        } catch (error) {
          console.error("Error extracting job info:", error);
        }
      }

      // Sort by date (newest first)
      const sortedJobs = dateParser.sortJobsByDate(validJobs);

      // Filter out already processed jobs
      const appliedJobs = await storage.getAppliedJobs();
      const appliedJobIds = new Set(appliedJobs.map((job) => job.id));

      const newJobs = sortedJobs.filter((job) => !appliedJobIds.has(job.id));

      console.log(`Found ${newJobs.length} new valid jobs`);
      return newJobs;
    } catch (error) {
      console.error("Error scanning jobs:", error);
      return [];
    }
  }

  // Extract job information from a job card
  async extractJobInfo(card) {
    const selectors = window.linkedinEasyApplySelectors;

    try {
      // Extract job title
      const titleElement = selectors.findElement("jobTitle", card);
      const title = titleElement?.textContent?.trim() || "";

      // Extract company name
      const companyElement = selectors.findElement("jobCompany", card);
      const company = companyElement?.textContent?.trim() || "";

      // Extract location
      const locationElement = selectors.findElement("jobLocation", card);
      const location = locationElement?.textContent?.trim() || "";

      // Extract date
      const dateElement = selectors.findElement("jobDate", card);
      const dateText = dateElement?.textContent?.trim() || "";

      // Check for Easy Apply button
      const easyApplyButton = selectors.findElement("easyApplyButton", card);
      const hasEasyApply = !!easyApplyButton;

      // Generate unique job ID
      const jobId = this.generateJobId(title, company, location);

      // Determine job bucket
      const bucket = this.determineJobBucket(title);

      return {
        id: jobId,
        title,
        company,
        location,
        dateText,
        hasEasyApply,
        bucket,
        element: card,
        easyApplyButton,
      };
    } catch (error) {
      console.error("Error extracting job info:", error);
      return null;
    }
  }

  // Check if job is valid for processing
  isValidJob(jobInfo) {
    if (!jobInfo) return false;

    // Must have Easy Apply
    if (!jobInfo.hasEasyApply) {
      console.log(`Skipping job "${jobInfo.title}" - No Easy Apply button`);
      return false;
    }

    // Must match title bucket
    if (!jobInfo.bucket) {
      console.log(`Skipping job "${jobInfo.title}" - Title not in buckets`);
      return false;
    }

    // Must be within date range
    const dateParser = window.linkedinEasyApplyDateParser;
    if (!dateParser.isWithinDateRange(jobInfo.dateText)) {
      console.log(`Skipping job "${jobInfo.title}" - Outside date range`);
      return false;
    }

    // Check location filter
    if (!this.isLocationValid(jobInfo.location)) {
      console.log(`Skipping job "${jobInfo.title}" - Location not in filter`);
      return false;
    }

    // Check for blocked keywords
    if (this.hasBlockedKeywords(jobInfo.title, jobInfo.company)) {
      console.log(
        `Skipping job "${jobInfo.title}" - Contains blocked keywords`
      );
      return false;
    }

    return true;
  }

  // Determine which bucket a job title belongs to
  determineJobBucket(title) {
    if (!this.config || !this.config.titleBuckets) return null;

    const normalizedTitle = title.toLowerCase();

    // Check frontend bucket
    for (const keyword of this.config.titleBuckets.frontend) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        return "frontend";
      }
    }

    // Check fullstack bucket
    for (const keyword of this.config.titleBuckets.fullstack) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        return "fullstack";
      }
    }

    return null;
  }

  // Check if job location is valid based on filter
  isLocationValid(location) {
    if (
      !this.config ||
      !this.config.locationFilter ||
      !this.config.locationFilter.enabled
    ) {
      return true; // No location filter configured, allow all
    }

    const locationFilter = this.config.locationFilter;
    const normalizedLocation = location.toLowerCase();

    const strict = !!locationFilter.strictMode;

    // Check allowed country
    const hasValidCountry = (locationFilter.countries || []).some((country) =>
      normalizedLocation.includes(country.toLowerCase())
    );

    // Check allowed cities
    const hasValidCity = (locationFilter.cities || []).some((city) =>
      normalizedLocation.includes(city.toLowerCase())
    );

    // In non-strict mode, accept if either country or city matches
    if (!strict && !(hasValidCountry || hasValidCity)) {
      return false;
    }

    // In strict mode, require both country and city
    if (strict && !(hasValidCountry && hasValidCity)) {
      return false;
    }

    // Check work type (hybrid, remote, in-office, on-site)
    const hasValidWorkType = (locationFilter.workTypes || []).some((workType) =>
      normalizedLocation.includes(workType.toLowerCase())
    );

    if (!hasValidWorkType) {
      return false;
    }

    return true;
  }

  // Check if job has blocked keywords
  hasBlockedKeywords(title, company) {
    if (!this.config || !this.config.skipRules) return false;

    const blockedKeywords = this.config.skipRules.blockedKeywords || [];
    const blockedCompanies = this.config.skipRules.blockedCompanies || [];

    const normalizedTitle = title.toLowerCase();
    const normalizedCompany = company.toLowerCase();

    // Check title keywords
    for (const keyword of blockedKeywords) {
      if (normalizedTitle.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    // Check company names
    for (const blockedCompany of blockedCompanies) {
      if (normalizedCompany.includes(blockedCompany.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  // Generate unique job ID
  generateJobId(title, company, location) {
    const combined = `${title}-${company}-${location}`;
    return btoa(combined)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 16);
  }

  // Scroll to load more jobs
  async scrollToLoadMore() {
    try {
      const selectors = window.linkedinEasyApplySelectors;
      const jobList = selectors.findElement("jobList");

      if (!jobList) return false;

      // Scroll to bottom of job list
      jobList.scrollTop = jobList.scrollHeight;

      // Wait for potential new jobs to load
      await this.sleep(2000);

      // Check if new jobs were loaded
      const newJobCards = selectors.findAllElements("jobCard", jobList);
      return newJobCards.length > this.jobs.length;
    } catch (error) {
      console.error("Error scrolling to load more jobs:", error);
      return false;
    }
  }

  // Get next job to process
  async getNextJob() {
    try {
      // If no jobs cached, scan for new ones
      if (this.jobs.length === 0) {
        this.jobs = await this.scanJobs();
      }

      // Find next unprocessed job
      for (const job of this.jobs) {
        if (!this.processedJobs.has(job.id)) {
          return job;
        }
      }

      // Try to load more jobs
      const loadedMore = await this.scrollToLoadMore();
      if (loadedMore) {
        this.jobs = await this.scanJobs();
        return this.getNextJob();
      }

      return null;
    } catch (error) {
      console.error("Error getting next job:", error);
      return null;
    }
  }

  // Mark job as processed
  markJobProcessed(jobId) {
    this.processedJobs.add(jobId);
  }

  // Clear processed jobs cache
  clearProcessedJobs() {
    this.processedJobs.clear();
  }

  // Get job statistics
  getJobStats() {
    return {
      totalJobs: this.jobs.length,
      processedJobs: this.processedJobs.size,
      remainingJobs: this.jobs.length - this.processedJobs.size,
    };
  }

  // Sleep utility
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Refresh job list
  async refreshJobs() {
    this.jobs = [];
    this.processedJobs.clear();
    return await this.scanJobs();
  }

  // Check if we're on a valid LinkedIn jobs page
  isOnJobsPage() {
    return window.location.href.includes("linkedin.com/jobs");
  }

  // Wait for page to be ready
  async waitForPageReady() {
    return new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  }
}

// Export singleton instance
window.linkedinEasyApplyJobScanner = new JobScanner();
