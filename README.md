<div align="center"> <img src="icons/bookmark-96.png" alt="Bookmark Manager Zero Logo" width="128" height="128" style="margin-top: -20px; margin-bottom: -20px;">


<h1 align="center">Bookmark Manager Zero</h1>

<p align="center">
  The only modern, privacy-focused bookmark management suite with real-time link validation and multi-source malware detection.
</p>
</div>
<br>

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; text-align: center;">
  <!-- Firefox Block -->
  <div style="flex: 1 1 200px; max-width: 250px;">
    <a href="https://addons.mozilla.org/en-US/firefox/addon/bookmark-manager-zero/">
      <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" alt="Get Firefox Addon" height="60" />
    </a>
    <br /><br />
    <a href="https://gitlab.com/AbsoluteXYZero/BMZ-Firefox">
      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" alt="Firefox" width="60" height="60" />
      <br />
      <strong>Gitlab Firefox Repo</strong>
    </a>
  </div>
  
  <!-- Middle Column: Google Play + Web App -->
  <div style="flex: 1 1 200px; max-width: 250px;">
    <a href="https://play.google.com/store/apps/details?id=com.absolutezero.bookmarkmanagerzero">
      <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play url" style="width: 250px; transform: scaleY(1.11) translateY(3px);" />
    </a>
    <br /><br />
    <a href="https://bmzweb.absolutezero.fyi/">
      <img src="icons/bookmark-96.png" alt="Website" width="80" height="80" />
      <br />
      <strong>Web Application</strong>
    </a>
  </div>
  <!-- Chrome Block -->
  <div style="flex: 1 1 200px; max-width: 250px;">
    <a href="https://chromewebstore.google.com/detail/bookmark-manager-zero/jbpiddimkkdfhoellbiegdopfpilnclc">
      <img src="https://developer.chrome.com/static/docs/webstore/branding/image/HRs9MPufa1J1h5glNhut.png" alt="Available in Chrome Web Store" style="width: 250px; transform: scaleY(1.05) translateY(3px);" />
    </a>
    <br /><br />
    <a href="https://gitlab.com/AbsoluteXYZero/BMZ-Chrome">
      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="Chrome" width="60" height="60" />
      <br />
      <strong>Gitlab Chrome Repo</strong>
    </a>
  </div>
</div>



<br>


📸 Gallery (Click to view full size)

<table>
  <tr>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 204148.png" alt="Screenshot 1" width="100%">
    </td>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 204209.png" alt="Screenshot 2" width="100%">
    </td>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 204352.png" alt="Screenshot 3" width="100%">
    </td>
  </tr>
  <tr>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 204236.png" alt="Screenshot 4" width="100%">
    </td>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 204421.png" alt="Screenshot 5" width="100%">
    </td>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 204437.png" alt="Screenshot 6" width="100%">
    </td>
  </tr>
  <tr>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 215914.png" alt="Screenshot 7" width="100%">
    </td>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-11-19 224518.png" alt="Screenshot 8" width="100%">
    </td>
    <td width="33%">
      <img src="screenshots/Screenshot 2025-12-05 133834.png" alt="Screenshot 9" width="100%">
    </td>
  </tr>
</table>


</div>




## Why Bookmark Manager Zero?

Stop blindly clicking old bookmarks. **Know which links are dead, parked, or dangerous before you visit them.**

Most bookmark managers focus on organization alone. Bookmark Manager Zero gives you organization *and* security - automatically checking your bookmarks against malware databases, detecting dead links, and flagging suspicious URLs.

Featured on [FMHY](https://fmhy.net/internet-tools#bookmark-managers).

### Your Bookmarks Stay Yours

Unlike services like Raindrop.io that move your bookmarks into their ecosystem, the browser extensions work directly with your native Firefox or Chrome bookmarks. Your browser's bookmarks are the source of truth - Bookmark Manager Zero reads from them and writes back to them. Edit something in your browser's built-in bookmark manager and it appears in Bookmark Manager Zero. Make changes in Bookmark Manager Zero and they're saved to your browser's native bookmarks. No lock-in, no migration required.

### Taking Bookmarks Mobile

Mobile browsers and web apps can't access your browser's native bookmarks due to platform restrictions. To bridge this gap, Bookmark Manager Zero offers optional GitLab Snippets sync. Connect with a GitLab personal access token and your bookmarks sync to a private snippet. The web app and Android app (which is simply a dedicated wrapper around the web app) can then sync with that snippet, giving you access to your bookmarks on the go for your phones, tablets, or on public computers.

**Why GitLab?** It's free, secure, and setup takes minutes - just generate a personal access token. Unlike Google or other OAuth-based sync options, you never have to enter your actual login credentials on devices you don't fully trust. Paste in your PAT (personal access token), sync your bookmarks, and you're done. (GitHub was considered first, but their API made the integration a nightmare.)

---

## What It Does

### Link Health Checking

Your bookmarks break over time. Sites go offline, domains expire and get parked, HTTP links redirect to HTTPS. Bookmark Manager Zero detects all of this:

- **Dead links** - 404 errors, server timeouts, unreachable sites
- **Parked domains** - Expired domains redirecting to parking pages (detects 22+ parking services)
- **Redirects** - HTTP to HTTPS redirects and other URL changes
- **Visual indicators** - Color-coded icons show link status and safety at a glance

### Security Scanning

Every bookmark gets checked against multiple threat databases:

**Built-in protection (free, no API keys needed):**

- 10 blocklist sources covering ~1.36 million known malicious domains
- Includes URLhaus, BlockList Project, HaGeZi, OISD, and more
- Blocklists update automatically in the background
- URLVoid malware scanning

**Optional API integrations (free tiers available):**

- VirusTotal - Checks against 70+ antivirus engines
- Google Safe Browsing - Real-time threat data
- Yandex Safe Browsing - Better coverage for Eastern European threats

The scanner also flags suspicious patterns like URL shorteners, unusual domain extensions, and homograph attacks (fake domains using lookalike characters).

**A tool, not a gatekeeper:** Bookmark Manager Zero will never block you from visiting your bookmarks - it just tells you what it found. Scanning relies partly on community-maintained blocklists, so false positives and false negatives happen. If something gets flagged and you trust it, whitelist it and move on.

### Organization

- Search bookmarks instantly by title or URL
- Drag and drop to reorder bookmarks and folders
- Switch between list and grid views
- See website preview thumbnails
- Track and Undo changes with the built-in changelog

### Privacy

- No analytics or tracking whatsoever
- All data stored locally in your browser
- API keys encrypted with AES-256-GCM
- Works fully offline if you disable external features
- Open source - audit the code yourself

---

## Customization

Make it yours with 8 built-in themes, custom accent colors, adjustable transparency, background images, and zoom controls. The "Enhanced" themes add modern 3D depth effects if that's your style.

---

## Versions

All versions share the same features. Pick whichever fits your setup, or use multiple with GitLab Snippets sync to keep everything in sync.

### Firefox Extension

Install from the [Mozilla Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/bookmark-manager-zero/). Opens in the Firefox sidebar and syncs directly with your Firefox bookmarks.

[Source code on GitLab](https://gitlab.com/AbsoluteXYZero/BMZ-Firefox/)

### Chrome Extension

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/bookmark-manager-zero/jbpiddimkkdfhoellbiegdopfpilnclc). Opens in Chrome's side panel and syncs with your Chrome bookmarks.

[Source code on GitLab](https://gitlab.com/AbsoluteXYZero/BMZ-Chrome/)

### Android App

Install from [Google Play](https://play.google.com/store/apps/details?id=com.absolutezero.bookmarkmanagerzero). A dedicated kiosk-style app that wraps the web application for a native Android experience. Same features as the web version with the convenience of a standalone app.

### Web Application

Use it at [bmzweb.absolutezero.fyi](https://bmzweb.absolutezero.fyi/) - no installation needed. Good for accessing bookmarks on shared or public computers without logging into browser accounts. Bookmarks sync via GitLab Snippets, or use it completely offline in local mode.

[Source code on GitLab](https://gitlab.com/AbsoluteXYZero/BMZ-Web/)

---

## Technical Notes

**Browser extensions:** Require Firefox 109+ or Chrome 116+ (Manifest V3). Bookmarks scan at roughly 33/second. Results cached for 7 days, blocklists refresh every 24 hours.

**Web app:** Pure static HTML/JS - host it yourself if you want. Uses IndexedDB for storage, Web Workers for background scanning. Zero framework dependencies.

---

## Support

If you find this useful, consider [buying me a coffee](https://buymeacoffee.com/absolutexyzero).

---

<div align="center">

**Born from frustration with bookmarks that aged poorly. Built for myself because no one else was going to*

</div>
