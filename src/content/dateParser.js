// LinkedIn date parsing utility
// Converts LinkedIn's various date formats to days since posting

class DateParser {
  constructor() {
    this.maxDays = 15;
  }

  setConfig(config) {
    if (!config || !config.postingDateFilter) {
      this.maxDays = 15;
      return;
    }
    this.maxDays = config.postingDateFilter.maxDays || 15;
  }

  parseDate(dateText) {
    if (!dateText) return { days: 999, isValid: false };

    const normalizedText = dateText.toLowerCase().trim();

    try {
      // Handle "Just now" or "Posted today"
      if (
        normalizedText.includes("just now") ||
        normalizedText.includes("posted today") ||
        normalizedText.includes("today")
      ) {
        return { days: 0, isValid: true };
      }

      // Handle "X minutes ago" or "X hours ago"
      if (
        normalizedText.includes("minute") ||
        normalizedText.includes("hour")
      ) {
        return { days: 0, isValid: true };
      }

      // Handle "Yesterday"
      if (normalizedText.includes("yesterday")) {
        return { days: 1, isValid: true };
      }

      // Handle "X day(s) ago"
      const dayMatch = normalizedText.match(/(\d+)\s*day/i);
      if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        return { days, isValid: days <= this.maxDays };
      }

      // Handle "X week(s) ago"
      const weekMatch = normalizedText.match(/(\d+)\s*week/i);
      if (weekMatch) {
        const weeks = parseInt(weekMatch[1]);
        const days = weeks * 7;
        return { days, isValid: days <= this.maxDays };
      }

      // Handle "30+ days ago" - always reject
      if (
        normalizedText.includes("30+ days") ||
        normalizedText.includes("30+")
      ) {
        return { days: 31, isValid: false };
      }

      // Try to extract any number and assume it's days
      const numberMatch = normalizedText.match(/(\d+)/);
      if (numberMatch) {
        const days = parseInt(numberMatch[1]);
        return { days, isValid: days <= this.maxDays };
      }

      // If we can't parse it, assume it's old
      return { days: 999, isValid: false };
    } catch (error) {
      console.error("Error parsing date:", dateText, error);
      return { days: 999, isValid: false };
    }
  }

  isWithinDateRange(dateText) {
    const result = this.parseDate(dateText);
    return result.isValid;
  }

  getDaysOld(dateText) {
    const result = this.parseDate(dateText);
    return result.days;
  }

  // Helper method to sort jobs by date (newest first)
  sortJobsByDate(jobs) {
    return jobs.sort((a, b) => {
      const aDays = this.getDaysOld(a.dateText);
      const bDays = this.getDaysOld(b.dateText);
      return aDays - bDays; // Ascending order (0 days first)
    });
  }

  // Helper method to filter jobs by date range
  filterJobsByDate(jobs) {
    return jobs.filter((job) => this.isWithinDateRange(job.dateText));
  }

  // Test method for debugging
  testDateParsing() {
    const testCases = [
      "Just now",
      "Posted today",
      "2 minutes ago",
      "1 hour ago",
      "Yesterday",
      "2 days ago",
      "1 week ago",
      "2 weeks ago",
      "30+ days ago",
      "Posted 5 days ago",
      "3d",
      "1w",
    ];

    console.log("Date Parser Test Results:");
    testCases.forEach((testCase) => {
      const result = this.parseDate(testCase);
      console.log(
        `"${testCase}" -> ${result.days} days (valid: ${result.isValid})`
      );
    });
  }
}

// Export singleton instance
window.linkedinEasyApplyDateParser = new DateParser();
