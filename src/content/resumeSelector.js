// resumeSelector.js
// Helper to select resume based on job title

const frontendKeywords = [
  "frontend developer",
  "react developer",
  "react.js developer",
  "next.js developer",
  "ui developer",
];

const fullstackKeywords = [
  "fullstack developer",
  "mern developer",
  "mern stack developer",
  "node.js developer",
  "typescript developer",
  "backend developer",
  "javascript developer",
];

/**
 * Decides which resume to use based on job title
 * @param {string} jobTitle
 * @param {string} frontendResumeId
 * @param {string} fullstackResumeId
 * @returns {string} resumeId
 */
function pickResume(jobTitle, frontendResumeId, fullstackResumeId) {
  const titleLower = jobTitle.toLowerCase();
  for (const keyword of frontendKeywords) {
    if (titleLower.includes(keyword)) {
      return frontendResumeId;
    }
  }
  // Default to fullstack resume
  return fullstackResumeId;
}

export { pickResume };
