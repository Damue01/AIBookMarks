# Privacy Policy for AIBookMarks

**Last updated: February 22, 2026**

## Overview

AIBookMarks is an open-source browser extension that helps you organize bookmarks using AI-powered classification. We are committed to protecting your privacy.

## Data Collection

**AIBookMarks does NOT collect, store, or transmit any personal data to our servers.** We do not have any servers.

### What data stays on your device

- All bookmark data remains in your browser's local storage
- Extension settings (language, sort preferences, custom rules) are stored locally via `chrome.storage`
- Backup snapshots are stored locally in IndexedDB within your browser

### What data is sent to third-party AI services

When you use the AI classification feature, the following data is sent **only to the AI provider you have configured** (OpenAI, Anthropic Claude, Ollama, or a custom API endpoint):

- **Bookmark titles** — used for AI to understand and categorize your bookmarks
- **Bookmark URLs** — used for AI to understand the content of your bookmarks
- **Your existing folder structure** — used so AI can suggest appropriate target folders

This data is sent **directly from your browser to the AI API endpoint you configured**. AIBookMarks does not proxy, intercept, or store this data on any intermediate server.

**You are responsible for reviewing the privacy policy of your chosen AI provider:**

- OpenAI: https://openai.com/policies/privacy-policy
- Anthropic (Claude): https://www.anthropic.com/privacy
- Ollama: runs locally on your machine — no data leaves your device

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `bookmarks` | Core functionality: read, create, move, and organize your bookmarks |
| `storage` | Store your settings, AI configuration, and custom rules locally |
| Content Script (`<all_urls>`) | Display a small toast notification on the current page when a new bookmark is auto-classified. No page content is read or collected. |

## Data Sharing

We do **not**:

- Collect analytics or telemetry
- Use tracking scripts or pixels
- Share any data with third parties (beyond your chosen AI provider as described above)
- Store any data on external servers

## Open Source

AIBookMarks is fully open source. You can audit the entire codebase at:

https://github.com/Damue01/AIBookMarks

## Children's Privacy

AIBookMarks does not knowingly collect any information from children under 13.

## Changes to This Policy

Any changes to this privacy policy will be reflected in this document, with the "Last updated" date revised accordingly.

## Contact

If you have questions about this privacy policy, please open an issue on our GitHub repository:

https://github.com/Damue01/AIBookMarks/issues
