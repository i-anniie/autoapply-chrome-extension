> ⚠️ **DEVELOPMENT WARNING & LEGAL DISCLAIMER**
>
> This version of the extension is still in development. You may encounter bugs or incomplete features. As development is ongoing, you must use this tool at your own risk. The developers are not responsible for any outcomes, issues, or damages resulting from its use.
>
> **Legal Disclaimer:**
>
> - This tool is for educational and personal use only.
> - It is not affiliated with, endorsed by, or supported by LinkedIn or any third party.
> - Use of this tool may violate LinkedIn’s Terms of Service and could result in account restrictions, bans, or other consequences.
> - The user assumes all responsibility and risk for using the tool.
> - The developers disclaim all liability for any consequences, including but not limited to account bans, data loss, or legal actions.
> - No user data is collected or transmitted externally; all data remains local.
> - Do not use this tool for commercial purposes or in violation of any laws or regulations.

# LinkedIn Easy Apply Automation

A personal-use Chrome extension that automates LinkedIn Easy Apply job applications with intelligent filtering, resume selection, and human-like behavior simulation.

## ⚠️ Important Legal Notice

**This tool is for personal use only and may violate LinkedIn's Terms of Service. Use at your own risk with a spare account for testing. The developers are not responsible for any account restrictions or violations.**

## Features

- **Automatic Resume Selection**: Chooses between frontend/fullstack resumes based on job title
- **Human-like Behavior**: Simulates typing, clicking, scrolling with randomized delays
- **Rate Limiting**: Built-in throttling to avoid detection (5-12s delays, batch cooldowns)
- **Local Storage**: All data stored locally, no external servers or APIs
- **Real-time Monitoring**: Live status updates and statistics in the popup

## Installation

### Method 1: Load Unpacked Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension should now appear in your extensions list

### Method 2: Pack Extension

1. In `chrome://extensions/`, click "Pack extension"
2. Select the project folder as the extension root directory
3. Click "Pack Extension" to create a `.crx` file
4. Install the `.crx` file by dragging it to the extensions page

## Configuration

### 1. Update User Data

Edit `src/config/userData.json` with your information:

```json
{
  "fullName": "Your Name",
  "email": "your.email@example.com",
  "phone": "+1-XXX-XXX-XXXX",
  "location": "Your City, Country",
  "experience": "2",
  "linkedinUrl": "https://www.linkedin.com/in/yourprofile/",
  "salaryExpectation": "Open to discussion",
  "frontendResumeId": "Your Frontend Resume ID",
  "fullstackResumeId": "Your Fullstack Resume ID",
  "additionalQuestions": {
    "yesNo": "Yes",
    "mcq": "A",
    "salary": "Open"
  }
}
```

### 2. Configure Resume IDs

**Important**: The resume IDs must match exactly what appears in LinkedIn's resume picker. To find the exact IDs:

1. Go to LinkedIn and start an Easy Apply application
2. When the resume selection appears, inspect the element or note the value
3. Update the `frontendResumeId` and `fullstackResumeId` in `userData.json` accordingly

### 3. Customize Job Title Buckets

Modify the keywords in `resumeSelector.js` to match your target roles:

```js
const frontendKeywords = [
  "frontend developer",
  "react developer",
  "react.js",
  "next.js",
  "ui developer",
];
const fullstackKeywords = [
  "fullstack developer",
  "mern developer",
  "node.js",
  "typescript developer",
  "backend developer",
  "javascript developer",
];
```

## Usage

1. Navigate to a LinkedIn Jobs page (e.g., `https://www.linkedin.com/jobs/search/`)
2. Open the extension popup from your browser toolbar
3. Click "Start" to begin automation
4. Monitor progress in the popup and browser console
5. Click "Stop" to halt automation at any time

## Safety Features

- 5-12 second delays between actions
- Throttling after every 10-15 applications (2-5 minute cooldown)
- Simulated typing, scrolling, and mouse events
- All data stored locally, no external servers

## Troubleshooting

### Common Issues

1. **Extension not working on LinkedIn**

   - Ensure you're on a LinkedIn jobs page
   - Check that the extension is enabled
   - Refresh the page and try again

2. **Resume selection failing**

   - Verify resume IDs match exactly what LinkedIn expects
   - Check that you have resumes uploaded to LinkedIn

3. **Jobs not being found**

   - Ensure job titles match your configured keywords
   - Check that jobs have "Easy Apply" in the footer

4. **Form filling issues**
   - Update your user data in the configuration
   - Check for unexpected required fields

## File Structure

```
linkedin-easy-apply/
├── manifest.json                 # Extension manifest
├── background.js                 # Service worker
├── src/
│   ├── content/
│   │   ├── content.js           # Main orchestrator
│   │   ├── jobScanner.js        # Job detection and filtering
│   │   ├── formHandler.js       # Form filling logic
│   │   ├── resumeSelector.js    # Resume selection
│   │   ├── stealth.js           # Human-like behavior
│   ├── popup/
│   │   ├── popup.html           # Extension popup
│   │   ├── popup.js             # Popup controller
│   │   └── popup.css            # Popup styles
│   ├── config/
│   │   └── userData.json        # User configuration
└── README.md                    # This file
```

## Disclaimer

- This tool is for educational and personal use only
- Use responsibly and respect LinkedIn's Terms of Service
- Test with a spare account before using on your main account
- The developers are not responsible for any account restrictions
- Always comply with applicable laws and regulations

## License

This project is provided as-is for personal use. No warranty or support is provided.
