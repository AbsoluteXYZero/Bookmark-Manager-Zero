<div align="center">

<img src="icons/bookmark-96.svg" alt="Bookmark Manager Zero Logo" width="128" height="128">

# Bookmark Manager Zero

**The only bookmark manager with integrated security scanning.**

A modern, privacy-focused interface for managing your browser bookmarks with real-time link validation and multi-source malware detection.

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 🚀 Get the Extension

<table>
  <tr>
    <td align="center" width="50%">
      <a href="https://addons.mozilla.org/en-US/firefox/addon/bookmark-manager-zero/">
        <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="Get Firefox Addon" height="60">
      </a>
      <br><br>
      <a href="https://github.com/AbsoluteXYZero/Bookmark-Manager-Zero-Firefox">
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" alt="Firefox" width="60" height="60">
        <br>
        <strong>Firefox Repository</strong>
      </a>
    </td>
    <td align="center" width="50%">
      <a href="https://chromewebstore.google.com/detail/bookmark-manager-zero/jbpiddimkkdfhoellbiegdopfpilnclc">
        <img src="https://developer.chrome.com/static/docs/webstore/branding/image/HRs9MPufa1J1h5glNhut.png" alt="Available in Chrome Web Store" height="60">
      </a>
      <br><br>
      <a href="https://github.com/AbsoluteXYZero/Bookmark-Manager-Zero-Chrome">
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="Chrome" width="60" height="60">
        <br>
        <strong>Chrome Repository</strong>
      </a>
    </td>
  </tr>
</table>

---

</div>

## 🌟 Why Bookmark Manager Zero?

Stop blindly clicking old bookmarks. **Know which links are dead, parked, or potentially dangerous before you visit them.**

Other bookmark managers make you choose between organization OR security. Bookmark Manager Zero combines both with:

### 🔗 **Intelligent Link Detection**
- **Dead Link Detection** - Automatically identifies broken URLs (404s, server errors)
- **Parked Domain Detection** - Spots expired domains redirecting to parking pages (22+ parking services)
- **HTTP Redirect Detection** - Detects when HTTP bookmarks redirect to HTTPS
- **Visual Status Icons** - Instant visual feedback with clickable chain icons showing detailed status

### 🛡️ **Multi-Layer Security Scanning**

**4-Phase Protection System:**
1. **Local Blocklists** - 8 sources with dual URLhaus coverage:
   - URLhaus Active (~107K actively distributing malware URLs, updated every 5 minutes)
   - URLhaus Historical (~37K historical threats, updated every 12 hours)
   - BlockList Project - Malware (~300K domains)
   - BlockList Project - Phishing (~214K domains)
   - BlockList Project - Scam (~112K domains)
   - HaGeZi TIF (~608K threat intelligence domains)
   - Phishing-Filter (~21K phishing domains)
   - OISD Big (~215K malicious domains)
   - Total: **~1.35M unique malicious domains** after deduplication
2. **Google Safe Browsing** - Real-time threat intelligence (optional API, 10K requests/day)
3. **Yandex Safe Browsing** - Geographic diversity with Russian/Eastern European threats (optional API, 100K requests/day)
4. **VirusTotal** - Multi-engine scanning from 70+ antivirus vendors (optional API, 500 requests/day)

- **Folder Rescan** - Right-click any folder to recursively scan all bookmarks in that folder and subfolders
- **Suspicious Pattern Detection** - Flags URL shorteners, unusual TLDs, homograph attacks
- **Safety History Tracking** - Monitor how link safety changes over time
- **Clickable Shield Icons** - Click any shield for detailed threat information
- **Whitelist Support** - Mark trusted URLs to skip safety checks

### ✨ **Modern Organization & UI**
- **Native Integration** - Works directly with your browser's bookmark system (bi-directional sync)
- **Advanced Search** - Real-time search across titles and URLs
- **Drag & Drop** - Intuitive reordering and folder management
- **List & Grid Views** - Choose your preferred layout
- **8 Themes** - Enhanced themes with modern 3D depth effects, plus classic Light, Dark, Blue, and customizable Tinted
- **Website Previews** - Visual thumbnails of bookmarked sites

### 🔒 **Privacy First**
- **Zero Tracking** - No analytics, no data collection
- **Local Storage** - All data stays in your browser
- **Encrypted API Keys** - AES-256-GCM encryption for stored credentials
- **Offline Mode** - Works fully offline when external features disabled
- **Open Source** - Fully auditable code (MIT License)

---

## 📊 Feature Comparison

| Feature | Bookmark Manager Zero | Traditional Bookmark Managers |
|---------|:--------------------:|:----------------------------:|
| Dead link detection | ✅ | Some |
| Parked domain detection | ✅ | ❌ |
| Multi-source malware scanning | ✅ | ❌ |
| Safety indicators on bookmarks | ✅ | ❌ |
| Suspicious pattern detection | ✅ | ❌ |
| HTTP redirect detection | ✅ | ❌ |
| Safety history tracking | ✅ | ❌ |
| Modern UI with themes | ✅ | Limited |
| Website previews | ✅ | ❌ |
| No tracking/analytics | ✅ | Varies |
| Free (no premium upsell) | ✅ | Limited |

---

## 🎯 Key Features at a Glance

### Core Functionality
- ✅ **Native Bookmark Integration** - Bi-directional sync with browser bookmarks
- 🎨 **Material Design UI** - Clean, modern interface with 3 themes
- 🔍 **Advanced Search** - Real-time filtering across all bookmarks
- 📁 **Smart Folder Management** - Create, edit, move, and organize
- 🔄 **Drag & Drop** - Intuitive reordering

### Safety & Security
- 🛡️ **Multi-Source Scanning** - 8 blocklist sources (dual URLhaus coverage) + Google Safe Browsing + Yandex Safe Browsing + VirusTotal
- 🔗 **Link Status Checking** - Dead, parked, and redirect detection
- 📂 **Folder Rescan** - Recursively scan all bookmarks in a folder and subfolders with detailed statistics
- ⚠️ **Suspicious Patterns** - URL shorteners, unusual TLDs, homograph attacks
- 📜 **Safety History** - Track status changes over time
- ✅ **Whitelist System** - Mark trusted URLs

### User Experience
- 🖼️ **Website Previews** - Visual thumbnails
- 📊 **Multiple Views** - List and grid layouts
- ⌨️ **Keyboard Navigation** - Full keyboard support
- 🔍 **Smart Filters** - Filter by status and safety
- ⏮️ **Undo System** - Restore deleted bookmarks

### Privacy & Control
- 🔒 **No Tracking** - Zero analytics or data collection
- 🔐 **Encrypted Storage** - AES-256-GCM for API keys
- 🌐 **Offline Mode** - Works without external services
- 🗑️ **Auto-Clear Cache** - Configurable cleanup
- 📦 **Local Storage** - All data in your browser

---

## 🎨 Customization

- **8 Built-in Themes** - Enhanced Blue (default), Enhanced Light, Enhanced Dark, Enhanced Gray, Blue, Light, Dark, and customizable Tinted theme
- **Enhanced Themes** - Modern design with 3D depth effects and rounded containers
- **Custom Accent Colors** - Choose any color for theme highlights
- **Adjustable Opacity** - Control bookmark background transparency (0-100%)
- **Custom Text Colors** - Personalize bookmark and folder text
- **Background Images** - Upload your own backgrounds with positioning controls
- **Zoom Control** - 50%-200% zoom levels
- **GUI Scaling** - 80%-140% interface scaling

---

## 🔧 Technical Details

- **Browser Compatibility:** Firefox 109+, Chrome/Edge 116+
- **Manifest Version:** V3 (modern extension API)
- **Storage:** IndexedDB for blocklists, browser.storage for settings
- **APIs Used:** Native Bookmarks API, optional Google Safe Browsing, optional Yandex Safe Browsing, optional VirusTotal
- **Rate Limiting:** Built-in (5 bookmarks/batch, 1s delays)
- **Cache TTL:** 24 hours (configurable)

---

## 🤝 Contributing

This project is open source (MIT License). Contributions are welcome!

- **Report Issues:** Use GitHub Issues for bug reports or feature requests
- **Submit PRs:** Fork the repository and submit pull requests
- **Browser-Specific Repos:**
  - [Firefox Version](https://github.com/AbsoluteXYZero/Bookmark-Manager-Zero-Firefox)
  - [Chrome Version](https://github.com/AbsoluteXYZero/Bookmark-Manager-Zero-Chrome)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## ☕ Support Development

If you find this extension useful, consider supporting development:

**[Buy Me a Coffee](https://buymeacoffee.com/absolutexyzero)**

---

<div align="center">

**Made with ❤️ for the privacy-conscious bookmark enthusiast**

</div>
