# Privacy Policy for Bookmark Manager Zero

**Last Updated:** November 18, 2025

## Overview

Bookmark Manager Zero is a browser extension that provides a modern interface for managing your Firefox bookmarks. This privacy policy explains what data is collected, how it's used, and your privacy rights.

## Data Collection and Storage

### Local Data Storage

All bookmark data and user preferences are stored **locally on your device** using Firefox's built-in storage API (`browser.storage.local`). This includes:

- User preferences (theme, view mode, zoom level)
- Bookmark status cache (link availability and safety checks)
- Whitelisted URLs
- Safety check history
- API keys (encrypted)
- Error logs (optional debugging data)

**Important:** This data never leaves your device except as described in the "External Services" section below.

### Private Browsing Mode

When using the extension in Firefox Private Browsing mode:
- All data is stored only in memory (RAM)
- No data is written to disk
- All session data is cleared when you close the private window
- Settings and preferences do not persist across sessions

## External Services

The extension may communicate with the following third-party services **only when specific features are enabled**:

### 1. **WordPress mshots (Screenshot Service)**
- **When Used:** When bookmark preview images are enabled (can be disabled)
- **Data Sent:** Bookmark URLs
- **Purpose:** Generate website screenshot thumbnails
- **Service:** `s0.wp.com/mshots/v1/`
- **Privacy Policy:** https://automattic.com/privacy/

### 2. **URLhaus Malware Database**
- **When Used:** When safety checking is enabled (can be disabled)
- **Data Sent:** Bookmark URLs
- **Purpose:** Check if URLs are known malware/phishing sites
- **Service:** `urlhaus.abuse.ch`
- **Privacy Policy:** https://urlhaus.abuse.ch/api/#privacy

### 3. **BlockList Project**
- **When Used:** When safety checking is enabled (can be disabled)
- **Data Sent:** Domain names from bookmarks
- **Purpose:** Check against known malicious domains
- **Service:** `blocklistproject.github.io`
- **Privacy Policy:** https://github.com/blocklistproject/Lists

### 4. **Google Safe Browsing API** (Optional)
- **When Used:** Only if you provide an API key
- **Data Sent:** Bookmark URLs (hashed)
- **Purpose:** Additional malware/phishing protection
- **Service:** `safebrowsing.googleapis.com`
- **Privacy Policy:** https://developers.google.com/safe-browsing/v4/usage-limits
- **Note:** Requires user-provided API key, disabled by default

### 5. **VirusTotal API** (Optional)
- **When Used:** Only when you manually click "Check on VirusTotal"
- **Data Sent:** Domain names from bookmarks
- **Purpose:** Scan URLs for threats across multiple antivirus engines
- **Service:** `www.virustotal.com`
- **Privacy Policy:** https://www.virustotal.com/gui/privacy-policy
- **Note:** Requires user-provided API key, manual action only

### 6. **Textise** (Optional)
- **When Used:** Only when you manually click "View Text-Only"
- **Data Sent:** Bookmark URL
- **Purpose:** Display text-only version of webpage
- **Service:** `www.textise.net`

### 7. **Google Favicons**
- **When Used:** When displaying bookmark favicons
- **Data Sent:** Domain names
- **Purpose:** Retrieve website favicon icons
- **Service:** `www.google.com/s2/favicons`

## User Control

You have complete control over external service usage:

### Disable All External Services:
1. Open extension settings (gear icon)
2. Uncheck "Show Link Status"
3. Uncheck "Show Safety Status"
4. Uncheck "Show Previews"

### Privacy-Focused Configuration:
- All external services can be completely disabled
- Works fully offline with external features disabled
- No telemetry or analytics
- No user tracking
- No advertisements

## API Key Security

If you choose to provide API keys for Google Safe Browsing or VirusTotal:

- Keys are **encrypted** using AES-256-GCM before storage
- Encryption key is derived from your browser's unique fingerprint
- Keys are stored in `browser.storage.local` (encrypted)
- Keys are never transmitted except to the respective API services
- In private browsing mode, keys are stored in memory only

## Data Retention

- **Normal Mode:** Data persists until you clear browser storage or uninstall the extension
- **Private Browsing Mode:** All data cleared when private window closes
- **Cache Auto-Clear:** Optional automatic cache cleanup (configurable: 1, 7, 30, 90 days, or never)

## Permissions Explanation

The extension requests the following permissions:

### `bookmarks`
- **Why:** Read and manage your Firefox bookmarks
- **What:** Access bookmark titles, URLs, folders, and metadata
- **Scope:** All bookmarks in your Firefox profile

### `storage`
- **Why:** Save user preferences and cache data locally
- **What:** Store settings, cache, API keys (encrypted)
- **Scope:** Local storage only (no sync)

### `tabs`
- **Why:** Open bookmarks in new tabs
- **What:** Create tabs when you click bookmarks
- **Scope:** Tab creation only

### `<all_urls>` (Host Permissions)
- **Why:** Check if bookmark links are still working
- **What:** Send HEAD requests to bookmark URLs to verify availability
- **Scope:** Only used for link checking feature (can be disabled)
- **Note:** No page content is accessed, only HTTP status codes

## Third-Party Access

**The extension does not:**
- Sell or share your data with third parties
- Use analytics or tracking services
- Display advertisements
- Collect personally identifiable information
- Transmit data to our servers (we don't have any servers)

## Children's Privacy

This extension does not knowingly collect data from children under 13. The extension is designed for general audiences.

## Changes to Privacy Policy

We may update this privacy policy from time to time. Changes will be reflected in the extension listing and the "Last Updated" date above.

## Data Subject Rights (GDPR/CCPA)

As the extension stores all data locally on your device:

- **Right to Access:** You can view all stored data in Firefox DevTools → Storage
- **Right to Delete:** Uninstall the extension or clear browser storage
- **Right to Export:** Use Firefox's built-in export features
- **Right to Object:** Disable any feature in settings

## Contact

For privacy concerns or questions:
- **GitHub Issues:** https://github.com/AbsoluteXYZero/Bookmark-Manager-Zero/issues
- **Extension Developer:** AbsoluteXYZero

## Open Source

This extension is open source. You can audit the code at:
https://github.com/AbsoluteXYZero/Bookmark-Manager-Zero

## Summary

**Your privacy is important:**
- ✅ All data stored locally on your device
- ✅ No tracking or analytics
- ✅ External services are optional and can be disabled
- ✅ Full transparency about data usage
- ✅ Private browsing mode supported with memory-only storage
- ✅ API keys encrypted before storage
- ✅ Open source for full transparency
