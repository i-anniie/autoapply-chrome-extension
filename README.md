# LinkedIn Easy Apply Automation

A personal-use Chrome extension that automates LinkedIn Easy Apply job applications with intelligent filtering, resume selection, and human-like behavior simulation.

## ⚠️ Important Legal Notice

**This tool is for personal use only and may violate LinkedIn's Terms of Service. Use at your own risk with a spare account for testing. The developers are not responsible for any account restrictions or violations.**

## Features

- **Smart Job Filtering**: Only applies to jobs matching predefined title buckets, within 15-day posting window, and in specified locations (India and its cities)
- **Automatic Resume Selection**: Chooses between frontend/fullstack resumes based on job title
- **Human-like Behavior**: Simulates typing, clicking, scrolling with randomized delays
- **Rate Limiting**: Built-in throttling to avoid detection (8-15s delays, batch cooldowns)
- **Dry Run Mode**: Test safely without submitting applications
- **Local Storage**: All data stored locally, no external servers or APIs
- **Real-time Monitoring**: Live status updates and statistics

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
  "user": {
    "fullName": "Your Name",
    "email": "your.email@example.com",
    "phone": "+1-XXX-XXX-XXXX",
    "location": "Your City, Country",
    "experienceYears": "2",
    "linkedinUrl": "https://www.linkedin.com/in/yourprofile/",
    "salaryExpectation": "Open to discussion"
  },
  "resumes": {
    "frontend": "Your Frontend Resume Name",
    "fullstack": "Your Fullstack Resume Name"
  }
}
```

### 2. Configure Resume Labels

**Important**: The resume labels must match exactly what appears in LinkedIn's resume picker. To find the exact names:

1. Go to LinkedIn and start an Easy Apply application
2. When the resume selection appears, note the exact text shown
3. Update the `resumes` section in `userData.json` with these exact names

### 3. Customize Job Title Buckets

Modify the `titleBuckets` section to match your target roles:

```json
{
  "titleBuckets": {
    "frontend": [
      "frontend developer",
      "react developer",
      "nextjs developer",
      "ui developer"
    ],
    "fullstack": [
      "fullstack developer",
      "nodejs developer",
      "backend developer",
      "javascript developer"
    ]
  }
}
```

### 4. Configure Location Filtering

The extension includes location filtering for India and its major cities. You can customize this in the `locationFilter` section:

```json
{
  "locationFilter": {
    "enabled": true,
    "countries": ["India"],
    "cities": [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Surat",
      "Lucknow",
      "Kanpur"
    ],
    "workTypes": ["hybrid", "remote", "in-office", "on-site"],
    "strictMode": false
  }
}
```

**Location Filter Options:**

- `enabled`: Enable/disable location filtering
- `countries`: List of allowed countries
- `cities`: List of allowed cities (includes major Indian cities by default)
- `workTypes`: Allowed work arrangements (hybrid, remote, in-office, on-site)
- `strictMode`: If true, requires exact matches; if false, uses partial matching

## Usage

### 1. Navigate to LinkedIn Jobs

Go to any LinkedIn jobs page (e.g., `https://www.linkedin.com/jobs/search/`)

### 2. Open Extension Popup

Click the extension icon in your browser toolbar

### 3. Configure Settings

- **Dry Run Mode**: Enable for safe testing (recommended initially)
- **Import/Export Config**: Backup or share your configuration
- **Reset Stats**: Clear application statistics

### 4. Start Automation

Click "Start Automation" to begin processing jobs

### 5. Monitor Progress

- Watch the popup for real-time statistics
- Enable debug overlay for detailed logging
- Check browser console for additional information

## Configuration Options

### Throttling Settings

```json
{
  "throttling": {
    "perActionDelayMs": { "min": 8000, "max": 15000 },
    "batchSize": 8,
    "batchCooldownMs": { "min": 180000, "max": 420000 },
    "maxPerHour": 20,
    "maxPerDay": 80
  }
}
```

### Behavior Settings

```json
{
  "behavior": {
    "simulateTyping": true,
    "typingDelayPerCharMs": { "min": 50, "max": 180 },
    "randomScrolls": true,
    "randomMouseNoise": true,
    "scrollIntoViewBeforeInteract": true
  }
}
```

### Skip Rules

```json
{
  "skipRules": {
    "ifUnexpectedRequiredQuestion": true,
    "ifMultipleAttachmentsRequired": true,
    "blockedCompanies": [],
    "blockedKeywords": ["senior", "lead", "principal", "architect", "manager"]
  }
}
```

## Safety Features

### Rate Limiting

- 8-15 second delays between actions
- Batch processing with 3-7 minute cooldowns
- Daily and hourly application limits
- Automatic pause when limits reached

### Human-like Behavior

- Simulated typing with character delays
- Random mouse movements and scrolling
- Micro-pauses and occasional backspacing
- Realistic click sequences

### Error Handling

- Graceful skipping of problematic jobs
- Automatic modal cleanup on errors
- Comprehensive logging and debugging
- Safe fallbacks for unexpected scenarios

## Troubleshooting

### Common Issues

1. **Extension not working on LinkedIn**

   - Ensure you're on a LinkedIn jobs page
   - Check that the extension is enabled
   - Refresh the page and try again

2. **Resume selection failing**

   - Verify resume labels match exactly what LinkedIn shows
   - Check that you have resumes uploaded to LinkedIn
   - Try the dry run mode to debug

3. **Jobs not being found**

   - Ensure job titles match your configured buckets
   - Check that jobs have "Easy Apply" buttons
   - Verify posting dates are within 15 days
   - Confirm jobs are in allowed locations (India and its cities)
   - Check that work types match (hybrid, remote, in-office, on-site)

4. **Form filling issues**
   - Update your user data in the configuration
   - Check for unexpected required fields
   - Enable debug overlay for detailed logging

### Debug Mode

Enable debug overlay in the configuration:

```json
{
  "debug": {
    "overlay": true,
    "dryRun": true,
    "logLevel": "debug"
  }
}
```

This will show:

- Real-time status updates
- Current job being processed
- Application statistics
- Detailed log messages

## File Structure

```
linkedin-easy-apply/
├── manifest.json                 # Extension manifest
├── background.js                 # Service worker
├── src/
│   ├── content/
│   │   ├── content.js           # Main orchestrator
│   │   ├── jobScanner.js        # Job detection and filtering
│   │   ├── dateParser.js        # LinkedIn date parsing
│   │   ├── formHandler.js       # Form filling logic
│   │   ├── resumePicker.js      # Resume selection
│   │   ├── stealth.js           # Human-like behavior
│   │   ├── throttle.js          # Rate limiting
│   │   ├── selectors.js         # CSS selectors
│   │   ├── storage.js           # Data management
│   │   ├── logger.js            # Logging system
│   │   └── uiOverlay.js         # Debug overlay
│   ├── popup/
│   │   ├── popup.html           # Extension popup
│   │   ├── popup.js             # Popup controller
│   │   └── popup.css            # Popup styles
│   ├── config/
│   │   └── userData.json        # User configuration
│   └── icons/                   # Extension icons
└── README.md                    # This file
```

## Contributing

This is a personal-use project. If you find bugs or want to suggest improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Disclaimer

- This tool is for educational and personal use only
- Use responsibly and respect LinkedIn's Terms of Service
- Test with a spare account before using on your main account
- The developers are not responsible for any account restrictions
- Always comply with applicable laws and regulations

## License

This project is provided as-is for personal use. No warranty or support is provided.
