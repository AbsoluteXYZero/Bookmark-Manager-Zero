// VirusTotal check (PRIMARY safety layer)
async function checkVirusTotal(url) {
  if (!settings.virusTotalApiKey) {
    return { status: 'unknown', detections: 0, total: 0 };
  }
  
  try {
    // Encode URL for VirusTotal API
    const urlId = btoa(url).replace(/=/g, '');
    
    // Check if URL has been scanned before
    const response = await fetch(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: {
          'x-apikey': settings.virusTotalApiKey
        }
      }
    );
    
    if (response.status === 404) {
      // URL not in database, submit for scanning
      const scanResponse = await fetch(
        'https://www.virustotal.com/api/v3/urls',
        {
          method: 'POST',
          headers: {
            'x-apikey': settings.virusTotalApiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `url=${encodeURIComponent(url)}`
        }
      );
      
      if (!scanResponse.ok) {
        if (scanResponse.status === 429) {
          return { 
            status: 'rate_limited', 
            detections: 0, 
            total: 0,
            message: 'Rate limit reached (4/min)'
          };
        }
        return { status: 'error', detections: 0, total: 0 };
      }
      
      // Return pending status while scan processes
      return { 
        status: 'scanning', 
        detections: 0, 
        total: 0,
        message: 'Scanning in progress...'
      };
    } else if (response.ok) {
      const data = await response.json();
      return analyzeVirusTotalResults(data);
    } else if (response.status === 429) {
      return { 
        status: 'rate_limited', 
        detections: 0, 
        total: 0,
        message: 'Rate limit reached (4/min)'
      };
    }
    
    return { status: 'error', detections: 0, total: 0 };
  } catch (error) {
    console.error('VirusTotal check failed:', error);
    return { 
      status: 'error', 
      detections: 0, 
      total: 0,
      error: error.message 
    };
  }
}

// Analyze VirusTotal results
function analyzeVirusTotalResults(data) {
  try {
    const stats = data.data?.attributes?.last_analysis_stats;
    
    if (!stats) {
      return { status: 'unknown', detections: 0, total: 0 };
    }
    
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const undetected = stats.undetected || 0;
    const harmless = stats.harmless || 0;
    
    const total = malicious + suspicious + undetected + harmless;
    const detections = malicious + suspicious;
    
    // Determine safety status
    let status;
    if (detections === 0) {
      status = 'safe';
    } else if (detections >= 5) {
      status = 'unsafe';
    } else {
      status = 'warning'; // 1-4 detections = suspicious but not definitive
    }
    
    return {
      status,
      detections,
      total,
      malicious,
      suspicious,
      undetected,
      harmless
    };
  } catch (error) {
    console.error('Error analyzing VirusTotal results:', error);
    return { status: 'error', detections: 0, total: 0 };
  }
}// State management
let bookmarkTree = [];
let searchTerm = '';
let activeFilter = null;
let undoHistory = [];
let expandedFolders = new Set();
let viewMode = 'enhanced-list';
let settings = {
  virusTotalApiKey: '',
  googleSafeBrowsingKey: '',
  urlScanApiKey: ''
};

// Cache for safety/status checks (prevents redundant API calls)
const checkCache = new Map();

// Load settings from storage
async function loadSettings() {
  const result = await browser.storage.local.get('settings');
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadBookmarks();
  setupEventListeners();
  
  // Listen for bookmark changes from Firefox (so we stay in sync)
  browser.bookmarks.onCreated.addListener(() => loadBookmarks());
  browser.bookmarks.onRemoved.addListener(() => loadBookmarks());
  browser.bookmarks.onChanged.addListener(() => loadBookmarks());
  browser.bookmarks.onMoved.addListener(() => loadBookmarks());
  
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('dark', savedTheme === 'dark');
  updateThemeIcon();
});

// Setup all event listeners
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderBookmarks();
  });
  
  // Filter toggle
  document.getElementById('filterToggle').addEventListener('click', () => {
    document.getElementById('filterBar').classList.toggle('hidden');
  });
  
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      if (activeFilter === filter) {
        activeFilter = null;
        chip.classList.remove('active');
      } else {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        activeFilter = filter;
        chip.classList.add('active');
      }
      renderBookmarks();
    });
  });
  
  // View mode buttons
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      renderBookmarks();
    });
  });
  
  // New bookmark
  document.getElementById('newBookmarkBtn').addEventListener('click', () => {
    // TODO: Open create bookmark modal
    console.log('Create new bookmark');
  });
  
  // New folder
  document.getElementById('newFolderBtn').addEventListener('click', () => {
    // TODO: Open create folder modal
    console.log('Create new folder');
  });
  
  // Find duplicates
  document.getElementById('findDuplicatesBtn').addEventListener('click', findDuplicates);
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    updateThemeIcon();
  });
  
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
  
  // Undo
  document.getElementById('undoBtn').addEventListener('click', performUndo);
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  icon.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

// Load all bookmarks from Firefox (reads native bookmarks directly)
async function loadBookmarks() {
  try {
    const tree = await browser.bookmarks.getTree();
    bookmarkTree = processBookmarkTree(tree[0].children);
    
    // Load any cached status/safety data
    await loadCachedStatuses();
    
    renderBookmarks();
    
    // Start checking links in background
    checkAllLinks();
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    showError('Failed to load bookmarks');
  }
}

// Process Firefox bookmark tree (preserves all native data)
function processBookmarkTree(nodes) {
  const result = [];
  
  for (const node of nodes) {
    if (node.type === 'folder') {
      result.push({
        id: node.id,
        type: 'folder',
        title: node.title,
        parentId: node.parentId,
        index: node.index,
        dateAdded: node.dateAdded,
        dateGroupModified: node.dateGroupModified,
        children: processBookmarkTree(node.children || [])
      });
    } else if (node.type === 'bookmark' && node.url) {
      result.push({
        id: node.id,
        type: 'bookmark',
        title: node.title,
        url: node.url,
        parentId: node.parentId,
        index: node.index,
        dateAdded: node.dateAdded,
        // Extension-only metadata (not saved to Firefox bookmarks)
        linkStatus: 'unchecked', // live, dead, parked
        safetyData: {
          status: 'unchecked', // safe, unsafe, warning, scanning, rate_limited, error
          detections: 0,
          total: 0
        }
      });
    }
  }
  
  return result;
}

// Load cached status data (stored separately from bookmarks)
async function loadCachedStatuses() {
  try {
    const result = await browser.storage.local.get('bookmarkStatuses');
    const statuses = result.bookmarkStatuses || {};
    
    // Apply cached statuses to bookmarks
    function applyStatuses(nodes) {
      for (const node of nodes) {
        if (node.type === 'bookmark' && statuses[node.url]) {
          const cached = statuses[node.url];
          // Only use cache if less than 24 hours old
          if (Date.now() - cached.timestamp < 86400000) {
            node.linkStatus = cached.linkStatus;
            node.safetyData = cached.safetyData;
          }
        }
        if (node.type === 'folder') {
          applyStatuses(node.children);
        }
      }
    }
    
    applyStatuses(bookmarkTree);
  } catch (error) {
    console.error('Error loading cached statuses:', error);
  }
}

// Save status to cache (not to Firefox bookmarks)
async function saveStatusToCache(url, linkStatus, safetyData) {
  try {
    const result = await browser.storage.local.get('bookmarkStatuses');
    const statuses = result.bookmarkStatuses || {};
    
    statuses[url] = {
      linkStatus,
      safetyData,
      timestamp: Date.now()
    };
    
    await browser.storage.local.set({ bookmarkStatuses: statuses });
  } catch (error) {
    console.error('Error saving status to cache:', error);
  }
}

// Filter bookmarks based on search and active filter
function filterBookmarks(nodes) {
  return nodes.reduce((acc, node) => {
    if (node.type === 'folder') {
      const filteredChildren = filterBookmarks(node.children);
      if (filteredChildren.length > 0 || (!searchTerm && !activeFilter)) {
        acc.push({ ...node, children: filteredChildren });
      }
    } else if (node.type === 'bookmark') {
      // Apply filter
      if (activeFilter) {
        const matches = (
          (activeFilter === 'live' && node.status === 'live') ||
          (activeFilter === 'dead' && (node.status === 'dead' || node.status === 'parked')) ||
          (activeFilter === 'safe' && node.safetyStatus === 'safe') ||
          (activeFilter === 'unsafe' && node.safetyStatus === 'unsafe') ||
          (activeFilter === 'unchecked' && node.status === 'unchecked')
        );
        if (!matches) return acc;
      }
      
      // Apply search
      if (searchTerm) {
        const matches = (
          node.title.toLowerCase().includes(searchTerm) ||
          node.url.toLowerCase().includes(searchTerm) ||
          (node.keyword && node.keyword.toLowerCase().includes(searchTerm)) ||
          node.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        if (!matches) return acc;
      }
      
      acc.push(node);
    }
    return acc;
  }, []);
}

// Render bookmarks in the UI
function renderBookmarks() {
  const content = document.getElementById('content');
  const filtered = filterBookmarks(bookmarkTree);
  
  if (filtered.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-title">No bookmarks found</div>
        <div class="empty-text">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }
  
  const containerClass = viewMode === 'grid' ? 'grid-view' : 'list-view';
  content.innerHTML = `<div class="${containerClass}">${renderNodes(filtered)}</div>`;
}

// Render individual nodes (recursive)
function renderNodes(nodes) {
  return nodes.map(node => {
    if (node.type === 'folder') {
      return renderFolder(node);
    } else {
      return renderBookmark(node);
    }
  }).join('');
}

// Render a folder
function renderFolder(folder) {
  const isExpanded = expandedFolders.has(folder.id);
  const count = countBookmarks(folder.children);
  
  return `
    <div class="folder-item" data-id="${folder.id}">
      <div class="folder-header">
        <div class="folder-toggle ${isExpanded ? 'expanded' : ''}" onclick="toggleFolder('${folder.id}')">
          ▶
        </div>
        <div class="folder-icon">📁</div>
        <div class="folder-title">${escapeHtml(folder.title)}</div>
        <div class="folder-count">${count}</div>
      </div>
      ${isExpanded ? `<div class="folder-children">${renderNodes(folder.children)}</div>` : ''}
    </div>
  `;
}

// Render a bookmark
function renderBookmark(bookmark) {
  const favicon = getFavicon(bookmark.url);
  const statusBadge = getStatusBadge(bookmark.status);
  const safetyBadge = getSafetyBadge(bookmark.safetyStatus);
  
  return `
    <div class="bookmark-item" data-id="${bookmark.id}" draggable="true">
      <div class="bookmark-header">
        <div class="bookmark-favicon">${favicon}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="status-badges">
            ${statusBadge}
            ${safetyBadge}
          </div>
        </div>
      </div>
      <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
      ${bookmark.tags.length > 0 ? `
        <div class="bookmark-meta">
          ${bookmark.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="bookmark-actions">
        <button class="action-btn" onclick="openBookmark('${bookmark.id}')">🔗 Open</button>
        <button class="action-btn" onclick="editBookmark('${bookmark.id}')">✏️ Edit</button>
        <button class="action-btn" onclick="checkLink('${bookmark.id}')">🔄 Recheck</button>
        <button class="action-btn" onclick="deleteBookmark('${bookmark.id}')">🗑️ Delete</button>
        ${bookmark.safetyStatus !== 'unknown' ? `
          <button class="action-btn" onclick="viewSafetyReport('${bookmark.id}')">🛡️ Report</button>
        ` : ''}
      </div>
    </div>
  `;
}

// Helper functions
function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `<img src="https://www.google.com/s2/favicons?domain=${domain}" width="16" height="16" onerror="this.style.display='none'">`;
  } catch {
    return '🔖';
  }
}

function getStatusBadge(status) {
  const badges = {
    live: '<span class="status-badge status-live">✓ Live</span>',
    dead: '<span class="status-badge status-dead">✗ Dead</span>',
    parked: '<span class="status-badge status-dead">⚠ Parked</span>',
    checking: '<span class="status-badge status-checking">⏳ Checking...</span>',
    unchecked: ''
  };
  return badges[status] || '';
}

function getSafetyBadge(safety) {
  const badges = {
    safe: '<span class="status-badge status-safe">🛡️ Safe</span>',
    unsafe: '<span class="status-badge status-unsafe">⚠️ Unsafe</span>',
    checking: '<span class="status-badge status-checking">🔍 Scanning...</span>',
    unknown: ''
  };
  return badges[safety] || '';
}

function countBookmarks(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'bookmark') count++;
    else if (node.type === 'folder') count += countBookmarks(node.children);
  }
  return count;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toggle folder expansion
window.toggleFolder = function(folderId) {
  if (expandedFolders.has(folderId)) {
    expandedFolders.delete(folderId);
  } else {
    expandedFolders.add(folderId);
  }
  renderBookmarks();
};

// Find bookmark by ID in tree
function findBookmark(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.type === 'folder') {
      const found = findBookmark(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// === LINK CHECKING FUNCTIONS ===

// Check all links in background
async function checkAllLinks() {
  const bookmarks = getAllBookmarks(bookmarkTree);
  
  for (const bookmark of bookmarks) {
    if (bookmark.status === 'unchecked') {
      await checkSingleLink(bookmark);
    }
  }
}

// Get all bookmarks from tree (flatten)
function getAllBookmarks(nodes) {
  const bookmarks = [];
  for (const node of nodes) {
    if (node.type === 'bookmark') {
      bookmarks.push(node);
    } else if (node.type === 'folder') {
      bookmarks.push(...getAllBookmarks(node.children));
    }
  }
  return bookmarks;
}

// Check a single link (status + safety)
async function checkSingleLink(bookmark) {
  // Update UI to show checking
  updateBookmark(bookmark.id, { 
    linkStatus: 'checking',
    safetyData: { status: 'scanning', detections: 0, total: 0 }
  });
  renderBookmarks();
  
  // Check if we have cached result
  const cached = checkCache.get(bookmark.url);
  if (cached && Date.now() - cached.timestamp < 86400000) { // 24 hour cache
    updateBookmark(bookmark.id, {
      linkStatus: cached.linkStatus,
      safetyData: cached.safetyData
    });
    renderBookmarks();
    return;
  }
  
  // Run checks in parallel
  const [linkStatus, safetyData] = await Promise.all([
    checkLinkStatus(bookmark.url),
    checkLinkSafety(bookmark.url)
  ]);
  
  const result = { linkStatus, safetyData };
  
  // Cache result (in extension storage, not in bookmarks)
  checkCache.set(bookmark.url, {
    ...result,
    timestamp: Date.now()
  });
  
  // Save to extension storage for persistence
  await saveStatusToCache(bookmark.url, linkStatus, safetyData);
  
  // Update bookmark in our tree (not in Firefox bookmarks)
  updateBookmark(bookmark.id, result);
  renderBookmarks();
}

// Check if link is live/dead
async function checkLinkStatus(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Avoid CORS issues
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    // no-cors always returns opaque response, so we check if fetch succeeded
    return 'live';
  } catch (error) {
    // Check if it's a parked domain by trying to get the page
    try {
      const response = await fetch(url, { mode: 'no-cors' });
      const text = await response.text();
      if (text.toLowerCase().includes('parked') || text.toLowerCase().includes('domain for sale')) {
        return 'parked';
      }
    } catch {}
    
    return 'dead';
  }
}

// VirusTotal as primary safety check
async function checkLinkSafety(url) {
  try {
    if (!settings.virusTotalApiKey) {
      console.warn('VirusTotal API key not configured');
      return { 
        status: 'unknown', 
        detections: 0, 
        total: 0,
        message: 'VirusTotal API key not configured'
      };
    }
    
    const vtResult = await checkVirusTotal(url);
    return vtResult;
  } catch (error) {
    console.error('Safety check error:', error);
    return { 
      status: 'unknown', 
      detections: 0, 
      total: 0,
      error: error.message 
    };
  }
}

// Google Safe Browsing check
async function checkGoogleSafeBrowsing(url) {
  if (!settings.googleSafeBrowsingKey) return 'safe';
  
  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${settings.googleSafeBrowsingKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            clientId: 'bookmark-manager-zero',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        })
      }
    );
    
    const data = await response.json();
    return data.matches && data.matches.length > 0 ? 'unsafe' : 'safe';
  } catch (error) {
    console.error('Google Safe Browsing check failed:', error);
    return 'safe'; // Default to safe on error
  }
}

// URLScan.io check
async function checkURLScan(url) {
  if (!settings.urlScanApiKey) return 'safe';
  
  try {
    // Submit URL for scanning
    const submitResponse = await fetch('https://urlscan.io/api/v1/scan/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': settings.urlScanApiKey
      },
      body: JSON.stringify({ url, visibility: 'private' })
    });
    
    const submitData = await submitResponse.json();
    
    // Wait a bit for scan to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get results
    const resultResponse = await fetch(submitData.api);
    const resultData = await resultResponse.json();
    
    // Check verdict
    if (resultData.verdicts?.overall?.malicious || resultData.verdicts?.overall?.score > 50) {
      return 'unsafe';
    }
    
    return 'safe';
  } catch (error) {
    console.error('URLScan check failed:', error);
    return 'safe'; // Default to safe on error
  }
}

// Manual recheck of a single bookmark
window.checkLink = async function(bookmarkId) {
  const bookmark = findBookmark(bookmarkTree, bookmarkId);
  if (bookmark) {
    // Clear cache for this URL
    checkCache.delete(bookmark.url);
    await checkSingleLink(bookmark);
  }
};

// === BOOKMARK ACTIONS ===

window.openBookmark = function(bookmarkId) {
  const bookmark = findBookmark(bookmarkTree, bookmarkId);
  if (bookmark) {
    browser.tabs.create({ url: bookmark.url });
  }
};

window.editBookmark = function(bookmarkId) {
  const bookmark = findBookmark(bookmarkTree, bookmarkId);
  if (bookmark) {
    // Open edit modal
    document.getElementById('editTitle').value = bookmark.title;
    document.getElementById('editUrl').value = bookmark.url;
    document.getElementById('editModal').classList.remove('hidden');
    
    // Store ID for save operation
    document.getElementById('editModal').dataset.bookmarkId = bookmarkId;
  }
};

// Save edited bookmark to Firefox
document.addEventListener('DOMContentLoaded', () => {
  // ... existing initialization ...
  
  // Edit modal save button
  document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const bookmarkId = document.getElementById('editModal').dataset.bookmarkId;
    const title = document.getElementById('editTitle').value.trim();
    const url = document.getElementById('editUrl').value.trim();
    
    if (!title || !url) {
      alert('Title and URL are required');
      return;
    }
    
    try {
      // Update in Firefox bookmarks directly
      await browser.bookmarks.update(bookmarkId, { title, url });
      
      // Close modal
      document.getElementById('editModal').classList.add('hidden');
      
      // Reload to get fresh data from Firefox
      await loadBookmarks();
      
      // Clear cache for this URL to trigger recheck
      const bookmark = findBookmark(bookmarkTree, bookmarkId);
      if (bookmark) {
        checkCache.delete(bookmark.url);
        await checkSingleLink(bookmark);
      }
    } catch (error) {
      alert('Failed to update bookmark: ' + error.message);
    }
  });
  
  // Cancel edit button
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editModal').classList.add('hidden');
  });
});

window.deleteBookmark = async function(bookmarkId) {
  if (confirm('Are you sure you want to delete this bookmark? This will delete it from Firefox bookmarks.')) {
    try {
      const bookmark = findBookmark(bookmarkTree, bookmarkId);
      
      // Store for undo
      undoHistory.push({ 
        type: 'delete', 
        bookmark: { ...bookmark } // Clone the bookmark data
      });
      updateUndoButton();
      
      // Delete from Firefox bookmarks directly
      await browser.bookmarks.remove(bookmarkId);
      
      // Reload from Firefox
      await loadBookmarks();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete bookmark: ' + error.message);
    }
  }
};

window.viewSafetyReport = function(bookmarkId) {
  const bookmark = findBookmark(bookmarkTree, bookmarkId);
  if (!bookmark) return;
  
  const { safetyData } = bookmark;
  
  let reportHTML = `
    <div class="modal" id="safetyReportModal">
      <div class="modal-content">
        <div class="modal-header">VirusTotal Security Report</div>
        <div style="margin-bottom: 20px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${escapeHtml(bookmark.title)}</div>
          <div style="font-size: 13px; color: var(--md-sys-color-on-surface-variant); word-break: break-all;">
            ${escapeHtml(bookmark.url)}
          </div>
        </div>
  `;
  
  if (safetyData.status === 'safe') {
    reportHTML += `
      <div style="background: #dcfce7; border: 2px solid #10b981; border-radius: 16px; padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
        <div style="font-size: 18px; font-weight: 600; color: #166534; margin-bottom: 8px;">Clean</div>
        <div style="font-size: 14px; color: #166534;">
          No security vendors flagged this URL as malicious
        </div>
        <div style="margin-top: 16px; font-size: 24px; font-weight: 700; color: #10b981;">
          0/${safetyData.total}
        </div>
        <div style="font-size: 12px; color: #166534; margin-top: 4px;">detections</div>
      </div>
    `;
  } else if (safetyData.status === 'unsafe') {
    reportHTML += `
      <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 16px; padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 18px; font-weight: 600; color: #991b1b; margin-bottom: 8px;">Malicious</div>
        <div style="font-size: 14px; color: #991b1b;">
          Multiple security vendors flagged this URL as dangerous
        </div>
        <div style="margin-top: 16px; font-size: 24px; font-weight: 700; color: #ef4444;">
          ${safetyData.detections}/${safetyData.total}
        </div>
        <div style="font-size: 12px; color: #991b1b; margin-top: 4px;">detections</div>
      </div>
    `;
  } else if (safetyData.status === 'warning') {
    reportHTML += `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 16px; padding: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 18px; font-weight: 600; color: #92400e; margin-bottom: 8px;">Suspicious</div>
        <div style="font-size: 14px; color: #92400e;">
          Some security vendors flagged this URL
        </div>
        <div style="margin-top: 16px; font-size: 24px; font-weight: 700; color: #f59e0b;">
          ${safetyData.detections}/${safetyData.total}
        </div>
        <div style="font-size: 12px; color: #92400e; margin-top: 4px;">detections</div>
      </div>
    `;
  }
  
  if (safetyData.malicious !== undefined) {
    reportHTML += `
      <div style="margin-top: 20px; background: var(--md-sys-color-surface-variant); border-radius: 12px; padding: 16px;">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Detailed Analysis</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
          <div>
            <div style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Malicious</div>
            <div style="font-size: 20px; font-weight: 600; color: #ef4444;">${safetyData.malicious || 0}</div>
          </div>
          <div>
            <div style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Suspicious</div>
            <div style="font-size: 20px; font-weight: 600; color: #f59e0b;">${safetyData.suspicious || 0}</div>
          </div>
          <div>
            <div style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Undetected</div>
            <div style="font-size: 20px; font-weight: 600;">${safetyData.undetected || 0}</div>
          </div>
          <div>
            <div style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 4px;">Harmless</div>
            <div style="font-size: 20px; font-weight: 600; color: #10b981;">${safetyData.harmless || 0}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  reportHTML += `
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="btn" onclick="document.getElementById('safetyReportModal').remove()">Close</button>
          <button class="btn btn-primary" onclick="window.open('https://www.virustotal.com/gui/url/${btoa(bookmark.url).replace(/=/g, '')}', '_blank')">
            View on VirusTotal
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', reportHTML);
};

// Update a bookmark in the tree
function updateBookmark(id, updates) {
  function update(nodes) {
    for (const node of nodes) {
      if (node.id === id) {
        Object.assign(node, updates);
        return true;
      }
      if (node.type === 'folder' && update(node.children)) {
        return true;
      }
    }
    return false;
  }
  update(bookmarkTree);
}

// Find duplicates
function findDuplicates() {
  const urlMap = new Map();
  const bookmarks = getAllBookmarks(bookmarkTree);
  
  for (const bookmark of bookmarks) {
    if (!urlMap.has(bookmark.url)) {
      urlMap.set(bookmark.url, []);
    }
    urlMap.get(bookmark.url).push(bookmark);
  }
  
  const duplicates = Array.from(urlMap.values()).filter(arr => arr.length > 1);
  
  if (duplicates.length === 0) {
    alert('No duplicate bookmarks found!');
  } else {
    alert(`Found ${duplicates.length} duplicate URLs with ${duplicates.reduce((sum, arr) => sum + arr.length, 0)} total bookmarks.`);
    // TODO: Show duplicates modal
  }
}

// Undo functionality
function updateUndoButton() {
  const btn = document.getElementById('undoBtn');
  btn.classList.toggle('hidden', undoHistory.length === 0);
}

async function performUndo() {
  if (undoHistory.length === 0) return;
  
  const action = undoHistory.pop();
  
  if (action.type === 'delete') {
    // Restore deleted bookmark to Firefox
    try {
      await browser.bookmarks.create({
        parentId: action.bookmark.parentId,
        title: action.bookmark.title,
        url: action.bookmark.url,
        index: action.bookmark.index
      });
      await loadBookmarks();
    } catch (error) {
      alert('Failed to undo: ' + error.message);
      undoHistory.push(action); // Put it back
    }
  }
  
  updateUndoButton();
}

function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">Error</div>
      <div class="empty-text">${escapeHtml(message)}</div>
    </div>
  `;
}