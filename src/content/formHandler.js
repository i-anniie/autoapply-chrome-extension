// formHandler.js
// Handles auto-filling and submitting LinkedIn Easy Apply forms

import { pickResume } from "./resumeSelector.js";

// Load user data
async function getUserData() {
  const response = await fetch(
    chrome.runtime.getURL("src/config/userData.json")
  );
  return await response.json();
}

// Simulate human typing
async function typeInput(element, value) {
  element.focus();
  element.value = "";
  for (let char of value) {
    element.value += char;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(randomDelay(50, 120));
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Main handler
async function handleForm(jobInfo, resumeId) {
  const userData = await getUserData();
  let form;
  let step = 0;
  let finished = false;
  while (!finished && step < 10) {
    await sleep(randomDelay(400, 900));
    form = document.querySelector("form");
    if (!form) {
      console.log(
        "[Easy Apply Extension] No form found, exiting form handler."
      );
      break;
    }
    const fields = Array.from(
      form.querySelectorAll("input, textarea, select")
    ).filter((el) => el.offsetParent !== null);
    for (const field of fields) {
      const name = field.getAttribute("name") || field.getAttribute("id") || "";
      if (/resume/i.test(name)) {
        field.value = resumeId;
        field.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("[Easy Apply Extension] Selected resume");
      } else if (/name/i.test(name)) {
        await typeInput(field, userData.fullName);
        console.log("[Easy Apply Extension] Filled name");
      } else if (/email/i.test(name)) {
        await typeInput(field, userData.email);
        console.log("[Easy Apply Extension] Filled email");
      } else if (/phone/i.test(name)) {
        await typeInput(field, userData.phone);
        console.log("[Easy Apply Extension] Filled phone");
      } else if (/location/i.test(name)) {
        await typeInput(field, userData.location);
        console.log("[Easy Apply Extension] Filled location");
      } else if (/experience/i.test(name)) {
        await typeInput(field, userData.experience);
        console.log("[Easy Apply Extension] Filled experience");
      } else if (/linkedin/i.test(name)) {
        await typeInput(field, userData.linkedinUrl);
        console.log("[Easy Apply Extension] Filled LinkedIn URL");
      } else if (/salary/i.test(name)) {
        await typeInput(field, userData.salaryExpectation);
        console.log("[Easy Apply Extension] Filled salary");
      } else if (/yes|no/i.test(name)) {
        field.value = userData.additionalQuestions.yesNo || "Yes";
        field.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("[Easy Apply Extension] Answered Yes/No");
      } else if (/mcq|option/i.test(name)) {
        field.value = userData.additionalQuestions.mcq || "A";
        field.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("[Easy Apply Extension] Answered MCQ");
      } else {
        if (!field.value) {
          await typeInput(field, userData.salaryExpectation);
          console.log("[Easy Apply Extension] Filled default");
        }
      }
      await sleep(randomDelay(100, 300));
    }

    // Find the main action button (Next, Continue, Review, Submit, etc.)
    let actionBtn = Array.from(form.querySelectorAll("button")).find((btn) => {
      const txt = btn.textContent.trim().toLowerCase();
      return (
        txt === "next" ||
        txt === "continue" ||
        txt === "review" ||
        txt === "submit application" ||
        txt === "submit" ||
        txt.includes("next") ||
        txt.includes("continue") ||
        txt.includes("review") ||
        txt.includes("submit")
      );
    });
    if (actionBtn) {
      actionBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      actionBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      await sleep(randomDelay(200, 600));
      actionBtn.click();
      console.log(
        "[Easy Apply Extension] Clicked action button:",
        actionBtn.textContent.trim()
      );
      await sleep(randomDelay(1200, 2000));
      // If it's a submit, check if modal closes
      if (/submit/.test(actionBtn.textContent.trim().toLowerCase())) {
        for (let i = 0; i < 20; i++) {
          if (!document.querySelector("form")) {
            finished = true;
            console.log(
              "[Easy Apply Extension] Form submitted and modal closed."
            );
            break;
          }
          await sleep(200);
        }
      }
    } else {
      // No action button, check if modal is closed
      if (!document.querySelector("form")) {
        finished = true;
        console.log("[Easy Apply Extension] Modal closed, finished.");
      } else {
        // Try to close modal if possible
        const closeBtn = document.querySelector(
          "button[aria-label='Dismiss'], button[aria-label='Close']"
        );
        if (closeBtn) {
          closeBtn.click();
          finished = true;
          console.log("[Easy Apply Extension] Closed modal with close button.");
        } else {
          finished = true;
          console.log("[Easy Apply Extension] No more steps, breaking.");
        }
      }
    }
    step++;
  }
}

export { handleForm };
