// content.js
// Main content script for LinkedIn Easy Apply Automation
console.log("[Easy Apply Extension] content.js injected and running");

let automationActive = false;
let appliedCount = 0;
let easyApplyJobs = [];
let currentJobIndex = 0;
let throttleAfter = Math.floor(Math.random() * 6) + 10; // 10-15
let throttlePause = Math.floor(Math.random() * 3) + 2; // 2-5 min

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_AUTOMATION") {
    startAutomation();
    sendResponse({ status: "started" });
  } else if (msg.type === "STOP_AUTOMATION") {
    stopAutomation();
    sendResponse({ status: "stopped" });
  } else if (msg.type === "RESET_AUTOMATION") {
    resetAutomation();
    sendResponse({ status: "reset" });
  }
});

function startAutomation() {
  if (automationActive) return;
  console.log("[Easy Apply Extension] Automation started");
  automationActive = true;
  appliedCount = 0;
  currentJobIndex = 0;
  easyApplyJobs = scanEasyApplyJobs();
  console.log(
    `[Easy Apply Extension] Found ${easyApplyJobs.length} Easy Apply jobs`
  );
  processNextJob();
}

function stopAutomation() {
  automationActive = false;
  console.log("[Easy Apply Extension] Automation stopped");
}

function resetAutomation() {
  appliedCount = 0;
  currentJobIndex = 0;
  easyApplyJobs = [];
  console.log("[Easy Apply Extension] Automation reset");
}

function scanEasyApplyJobs() {
  // Find job cards with Easy Apply in the footer
  const jobCards = Array.from(document.querySelectorAll("[data-job-id]"));
  return jobCards
    .map((card) => {
      const easyApplyLi = Array.from(
        card.querySelectorAll(".job-card-container__footer-wrapper li")
      ).find((li) =>
        li.textContent.trim().toLowerCase().includes("easy apply")
      );
      if (easyApplyLi) {
        return { card };
      }
      return null;
    })
    .filter(Boolean);
}

async function processNextJob() {
  if (!automationActive || currentJobIndex >= easyApplyJobs.length) {
    chrome.runtime.sendMessage({ type: "UPDATE_COUNTER", count: appliedCount });
    console.log(
      "[Easy Apply Extension] Automation finished or stopped by user"
    );
    return;
  }

  // Throttling after every 10-15 applications
  if (appliedCount > 0 && appliedCount % throttleAfter === 0) {
    console.log(
      `[Easy Apply Extension] Throttling for ${throttlePause} minutes after ${appliedCount} applications`
    );
    await sleep(throttlePause * 60 * 1000); // Pause for 2-5 min
  }

  const { card } = easyApplyJobs[currentJobIndex];
  scrollIntoView(card);
  simulateMouseHover(card);
  await sleep(randomDelay(200, 600));
  card.click();
  console.log(`[Easy Apply Extension] Clicked job card ${currentJobIndex + 1}`);
  await sleep(randomDelay(800, 1500));

  // Wait for the right-side job details pane to update to the correct job
  let jobId = card.getAttribute("data-job-id");
  let detailsPane = null;
  let found = false;
  for (let i = 0; i < 30; i++) {
    // Try for up to 3 seconds
    // The details pane usually has a data-job-id or job id in the URL
    detailsPane = document.querySelector(
      ".jobs-search__job-details--container, .jobs-details__main-content"
    );
    // Check if the details pane contains the correct job id or title
    if (detailsPane) {
      // Try to match by job id in the details pane
      const detailsJobId = detailsPane
        .querySelector("[data-job-id]")
        ?.getAttribute("data-job-id");
      if (detailsJobId === jobId) {
        found = true;
        break;
      }
      // Fallback: match by job title
      const titleEl = detailsPane.querySelector(
        "h2, .topcard__title, .job-details-jobs-unified-top-card__job-title"
      );
      const cardTitleEl = card.querySelector(
        "h3, .job-card-list__title, .base-search-card__title"
      );
      if (
        titleEl &&
        cardTitleEl &&
        titleEl.textContent.trim() === cardTitleEl.textContent.trim()
      ) {
        found = true;
        break;
      }
    }
    await sleep(100);
  }

  if (!found) {
    console.log(
      `[Easy Apply Extension] Could not find job details pane for job ${
        currentJobIndex + 1
      }`
    );
    currentJobIndex++;
    processNextJob();
    return;
  }

  // Now look for Easy Apply button in the details pane
  let easyApplyBtn = null;
  for (let i = 0; i < 30; i++) {
    // Try for up to 3 seconds
    easyApplyBtn = Array.from(
      detailsPane.querySelectorAll("button[aria-label], button")
    ).find((btn) => {
      const label = btn.getAttribute("aria-label") || "";
      return (
        label.toLowerCase().includes("easy apply") ||
        btn.textContent.trim().toLowerCase().includes("easy apply")
      );
    });
    if (easyApplyBtn) break;
    await sleep(100);
  }

  if (easyApplyBtn) {
    simulateMouseHover(easyApplyBtn);
    await sleep(randomDelay(200, 600));
    easyApplyBtn.click();
    console.log(
      `[Easy Apply Extension] Clicked Easy Apply in details pane for job ${
        currentJobIndex + 1
      }`
    );
    await sleep(randomDelay(800, 1500));

    // Extract job info
    let jobInfo;
    if (
      window.jobScanner &&
      typeof window.jobScanner.getJobInfo === "function"
    ) {
      jobInfo = await window.jobScanner.getJobInfo(card);
    } else {
      // Fallback: extract job title and company from card
      const titleEl = card.querySelector(
        "h3, .job-card-list__title, .base-search-card__title"
      );
      const companyEl = card.querySelector(
        ".job-card-container__company-name, .base-search-card__subtitle"
      );
      jobInfo = {
        title: titleEl ? titleEl.textContent.trim() : "",
        company: companyEl ? companyEl.textContent.trim() : "",
        card,
      };
    }
    // Select resume
    const resumeId =
      window.resumeSelector &&
      typeof window.resumeSelector.pickResume === "function"
        ? window.resumeSelector.pickResume(jobInfo.title)
        : "";
    // Fill and submit form
    if (
      window.formHandler &&
      typeof window.formHandler.handleForm === "function"
    ) {
      await window.formHandler.handleForm(jobInfo, resumeId);
    }

    appliedCount++;
    chrome.runtime.sendMessage({ type: "INCREMENT_COUNTER" });
    currentJobIndex++;
    await sleep(randomDelay(5000, 12000));
    processNextJob();
  } else {
    console.log(
      `[Easy Apply Extension] No Easy Apply button found in details pane for job ${
        currentJobIndex + 1
      }`
    );
    currentJobIndex++;
    processNextJob();
  }
}

function scrollIntoView(element) {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function simulateMouseHover(element) {
  const mouseOver = new MouseEvent("mouseover", { bubbles: true });
  element.dispatchEvent(mouseOver);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Expose for testing
window.startAutomation = startAutomation;
window.stopAutomation = stopAutomation;
window.resetAutomation = resetAutomation;
