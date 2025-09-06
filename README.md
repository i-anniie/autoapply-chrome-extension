# LinkedIn Easy Apply Automation Chrome Extension

This Chrome Extension automates the process of applying to 'Easy Apply' jobs on LinkedIn. It simulates human behavior, selects resumes intelligently, and works fully locally with no backend.

## Features

- Start/Stop automation from popup
- Live counter of applied jobs
- Resume selection based on job title
- Dynamic form autofill with typing simulation
- Stealth mode (random delays, scrolling, mouse events)
- Throttling after every 10-15 applications

## Usage

1. Open LinkedIn Jobs and apply your filters.
2. Click the extension icon and press Start.
3. The extension will apply to all 'Easy Apply' jobs on the page.
4. Click Stop to halt automation at any time.

## Limitations

- Cannot bypass CAPTCHAs
- May require selector updates if LinkedIn changes their DOM
- Use responsibly to avoid account restrictions

## File Structure

- manifest.json
- background.js
- src/
  - content/
    - content.js
    - jobScanner.js
    - formHandler.js
    - resumeSelector.js
    - stealth.js
  - popup/
    - popup.html
    - popup.js
    - popup.css
  - config/
    - userData.json
- icons/
  - icon16.png
  - icon48.png
  - icon128.png
