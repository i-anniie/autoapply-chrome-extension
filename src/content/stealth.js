// stealth.js
// Helper module for simulating human-like interactions

// Random delay between min and max ms
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Smooth scroll element into view
function smoothScroll(element) {
  if (element && element.scrollIntoView) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Simulate mouse hover
function simulateMouseHover(element) {
  if (element) {
    const mouseOver = new MouseEvent("mouseover", { bubbles: true });
    element.dispatchEvent(mouseOver);
  }
}

// Simulate human typing
async function simulateTyping(element, value, minDelay = 50, maxDelay = 120) {
  element.focus();
  element.value = "";
  for (let char of value) {
    element.value += char;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(randomDelay(minDelay, maxDelay));
  }
}

// Throttle after every 10-15 applications
async function throttleIfNeeded(appliedCount) {
  const threshold = Math.floor(Math.random() * 6) + 10; // 10-15
  if (appliedCount > 0 && appliedCount % threshold === 0) {
    const pauseMinutes = Math.floor(Math.random() * 4) + 2; // 2-5 min
    await sleep(pauseMinutes * 60 * 1000);
  }
}

export {
  randomDelay,
  sleep,
  smoothScroll,
  simulateMouseHover,
  simulateTyping,
  throttleIfNeeded,
};
