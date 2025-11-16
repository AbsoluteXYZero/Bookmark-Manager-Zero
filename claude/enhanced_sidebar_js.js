// State management (mimicking React state)
let state = {
  bookmarkTree: [],
  searchTerm: '',
  activeFilter: null,
  undoHistory: [],
  expandedFolders: new Set(),
  viewMode: 'enhanced-list',
  draggedItem: null,
  dragOverInfo: null,
  hoveredBookmark: null,
  editingBookmark: null,
  deletingBookmark: null,
  deletingFolder: null,
  isDuplicateModalOpen: false,
  duplicateGroups: {},
  folderMap: new Map(),
  visibleFields: { url: true, tags: false, keyword: false, folder: false, dateAdded: false },
  settings: {
    virusTotalApiKey: ''
  }
};

// Cache for safety/status checks
const checkCache = new Map();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadBookmarks();
  setupEventListeners();
  
  // Listen for bookmark changes from Firefox
  browser.bookmarks.onCreated.addListener(() => reloadBookmarks());
  browser.bookmarks.onRemoved.addListener(() => reloadBookmarks());
  browser.bookmarks.onChanged.addListener(() => reloadBookmarks());
  browser.bookmarks.onMoved.addListener(() => reloadBookmarks());
  
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('dark', savedTheme === 'dark');
  updateThemeIcon();
});

// Load settings
async function loadSettings() {
  const result = await browser.storage.local.get('settings');
  if (result.settings) {
    state.settings = { ...state.settings, ...result.settings };
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchTerm = e.target.value.toLowerCase();
    render();
  });
  
  // Filter toggle
  document.getElementById('filterToggle').addEventListener('click', () => {
    document.getElementById('filterBar').classList.toggle('hidden');
  });
  
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      if (state.activeFilter === filter) {
        state.activeFilter = null;
        chip.classList.remove('active');
      } else {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        state.activeFilter = filter;
        chip.classList.add('active');
      }
      render();
    });
  });
  
  // View mode buttons
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.viewMode = btn.dataset.view;
      render();
    });
  });
  
  // New bookmark
  document.getElementById('newBookmarkBtn').addEventListener('click', () => openCreateBookmarkModal());
  
  // New folder
  document.getElementById('newFolderBtn').addEventListener('click', () => openCreateFolderModal());
  
  // Find duplicates
  document.getElementById('findDuplicatesBtn').addEventListener('click', handleFindDuplicates);
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
  
  // Undo
  document.getElementById('undoBtn').addEventListener('click', performUndo);
  
  // Edit modal buttons
  document.getElementById('saveEditBtn').addEventListener('click', handleSaveEdit);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editModal').classList.add('hidden');
    state.editingBookmark = null;
  });
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  icon.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

// Load bookmarks from Firefox
async function loadBookmarks() {
  try {
    const tree = await browser.bookmarks.getTree();
    state.bookmarkTree = processBookmarkTree(tree[0].children);
    state.folderMap = buildFolderMap(state.bookmarkTree);
    
    await loadCachedStatuses();
    render();
    
    // Start checking links in background
    checkAllLinks();
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    showError('Failed to load bookmarks');
  }
}

async function reloadBookmarks() {
  await loadBookmarks();
}

// Process Firefox bookmark tree
function processBookmarkTree(nodes, parentPath = []) {
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
        children: processBookmarkTree(node.children || [], [...parentPath, node.title])
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
        folderPath: parentPath.join(' / ') || 'Root',
        linkStatus: 'unchecked',
        safetyData: {
          status: 'unchecked',
          detections: 0,
          total: 0
        }
      });
    }
  }
  
  return result;
}

// Build folder map for display
function buildFolderMap(nodes, path = []) {
  const map = new Map();
  
  for (const node of nodes) {
    if (node.type === 'folder') {
      const currentPath = [...path, node.title].join(' / ');
      map.set(node.id, currentPath);
      const childMap = buildFolderMap(node.children, [...path, node.title]);
      childMap.forEach((v, k) => map.set(k, v));
    }
  }
  
  return map;
}

// Load cached statuses
async function loadCachedStatuses() {
  try {
    const result = await browser.storage.local.get('bookmarkStatuses');
    const statuses = result.bookmarkStatuses || {};
    
    function applyStatuses(nodes) {
      for (const node of nodes) {
        if (node.type === 'bookmark' && statuses[node.url]) {
          const cached = statuses[node.url];
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
    
    applyStatuses(state.bookmarkTree);
  } catch (error) {
    console.error('Error loading cached statuses:', error);
  }
}

// Save status to cache
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

// Check all links
async function checkAllLinks() {
  const bookmarks = getAllBookmarks(state.bookmarkTree);
  
  for (const bookmark of bookmarks) {
    if (bookmark.linkStatus === 'unchecked') {
      await checkSingleLink(bookmark);
    }
  }
}

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

// Check single link
async function checkSingleLink(bookmark) {
  updateBookmark(bookmark.id, { 
    linkStatus: 'checking',
    safetyData: { status: 'scanning', detections: 0, total: 0 }
  });
  render();
  
  const cached = checkCache.get(bookmark.url);
  if (cached && Date.now() - cached.timestamp < 86400000) {
    updateBookmark(bookmark.id, {
      linkStatus: cached.linkStatus,
      safetyData: cached.safetyData
    });
    render();
    return;
  }
  
  const [linkStatus, safetyData] = await Promise.all([
    checkLinkStatus(bookmark.url),
    checkLinkSafety(bookmark.url)
  ]);
  
  const result = { linkStatus, safetyData };
  
  checkCache.set(bookmark.url, {
    ...result,
    timestamp: Date.now()
  });
  
  await saveStatusToCache(bookmark.url, linkStatus, safetyData);
  
  updateBookmark(bookmark.id, result);
  render();
}

// Check link status
async function checkLinkStatus(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return 'live';
  } catch (error) {
    return 'dead';
  }
}

// Check link safety with VirusTotal
async function checkLinkSafety(url) {
  try {
    if (!state.settings.virusTotalApiKey) {
      return { 
        status: 'unchecked', 
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
      status: 'error', 
      detections: 0, 
      total: 0,
      error: error.message 
    };
  }
}

// VirusTotal check
async function checkVirusTotal(url) {
  if (!state.settings.virusTotalApiKey) {
    return { status: 'unchecked', detections: 0, total: 0 };
  }
  
  try {
    const urlId = btoa(url).replace(/=/g, '');
    
    const response = await fetch(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: {
          'x-apikey': state.settings.virusTotalApiKey
        }
      }
    );
    
    if (response.status === 404) {
      const scanResponse = await fetch(
        'https://www.virustotal.com/api/v3/urls',
        {
          method: 'POST',
          headers: {
            'x-apikey': state.settings.virusTotalApiKey,
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
    
    let status;
    if (detections === 0) {
      status = 'safe';
    } else if (detections >= 5) {
      status = 'unsafe';
    } else {
      status = 'warning';
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
}

// Update bookmark in tree
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
  update(state.bookmarkTree);
}

// Find bookmark
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

// Render everything
function render() {
  renderBookmarks();
  renderUndoButton();
}

// Render bookmarks
function renderBookmarks() {
  const content = document.getElementById('content');
  const filtered = filterBookmarks(state.bookmarkTree);
  
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
  
  const containerClass = state.viewMode === 'grid' ? 'grid-view' : 'list-view';
  content.innerHTML = `<div class="${containerClass}">${renderNodes(filtered)}</div>`;
}

// Filter bookmarks
function filterBookmarks(nodes) {
  return nodes.reduce((acc, node) => {
    if (node.type === 'folder') {
      const filteredChildren = filterBookmarks(node.children);
      if (filteredChildren.length > 0 || (!state.searchTerm && !state.activeFilter)) {
        acc.push({ ...node, children: filteredChildren });
      }
    } else if (node.type === 'bookmark') {
      if (state.activeFilter) {
        const matches = (
          (state.activeFilter === 'live' && node.linkStatus === 'live') ||
          (state.activeFilter === 'dead' && (node.linkStatus === 'dead' || node.linkStatus === 'parked')) ||
          (state.activeFilter === 'safe' && node.safetyData.status === 'safe') ||
          (state.activeFilter === 'unsafe' && node.safetyData.status === 'unsafe') ||
          (state.activeFilter === 'unchecked' && node.linkStatus === 'unchecked')
        );
        if (!matches) return acc;
      }
      
      if (state.searchTerm) {
        const matches = (
          node.title.toLowerCase().includes(state.searchTerm) ||
          node.url.toLowerCase().includes(state.searchTerm)
        );
        if (!matches) return acc;
      }
      
      acc.push(node);
    }
    return acc;
  }, []);
}

// Render nodes recursively
function renderNodes(nodes) {
  return nodes.map(node => {
    if (node.type === 'folder') {
      return renderFolder(node);
    } else {
      return renderBookmark(node);
    }
  }).join('');
}

// Render folder
function renderFolder(folder) {
  const isExpanded = state.expandedFolders.has(folder.id);
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

function countBookmarks(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'bookmark') count++;
    else if (node.type === 'folder') count += countBookmarks(node.children);
  }
  return count;
}

// Render bookmark
function renderBookmark(bookmark) {
  const favicon = getFavicon(bookmark.url);
  const linkIndicator = getLinkStatusIndicator(bookmark.linkStatus);
  const shieldIndicator = getShieldIndicator(bookmark.safetyData, bookmark.url);
  const dateAdded = bookmark.dateAdded ? new Date(bookmark.dateAdded).toLocaleDateString() : 'Unknown';
  
  const tooltipText = `Title: ${bookmark.title}\\nURL: ${bookmark.url}\\nFolder: ${bookmark.folderPath}\\nAdded: ${dateAdded}`;
  
  return `
    <div class="bookmark-item" data-id="${bookmark.id}" draggable="true" title="${tooltipText}">
      <div class="bookmark-header">
        <div class="bookmark-favicon">${favicon}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="status-indicators">
            ${linkIndicator}
            ${shieldIndicator}
          </div>
        </div>
      </div>
      <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
      ${state.visibleFields.folder ? `<div class="bookmark-meta"><span class="tag">📁 ${escapeHtml(bookmark.folderPath)}</span></div>` : ''}
      ${state.visibleFields.dateAdded ? `<div class="bookmark-meta"><span class="tag">📅 ${dateAdded}</span></div>` : ''}
      <div class="bookmark-actions">
        <button class="action-btn" onclick="openBookmark('${bookmark.id}')">🔗 Open</button>
        <button class="action-btn" onclick="editBookmark('${bookmark.id}')">✏️ Edit</button>
        <button class="action-btn" onclick="recheckLink('${bookmark.id}')">🔄 Recheck</button>
        <button class="action-btn" onclick="deleteBookmark('${bookmark.id}')">🗑️ Delete</button>
      </div>
    </div>
  `;
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" width="24" height="24" onerror="this.style.display='none'" alt="">`;
  } catch {
    return '🔖';
  }
}

function getLinkStatusIndicator(linkStatus) {
  const indicators = {
    live: '<span class="status-dot status-dot-green" title="✓ Link is live and accessible">●</span>',
    dead: '<span class="status-dot status-dot-red" title="✗ Link is dead or unreachable">●</span>',
    parked: '<span class="status-dot status-dot-red" title="⚠ Domain is parked or for sale">●</span>',
    checking: '<span class="status-dot status-dot-yellow" title="⏳ Checking link status...">●</span>',
    unchecked: '<span class="status-dot status-dot-gray" title="? Link status not yet checked">●</span>'
  };
  return indicators[linkStatus] || indicators.unchecked;
}

function getShieldIndicator(safetyData, url) {
  const { status, detections, total, malicious, suspicious } = safetyData;
  const vtUrl = `https://www.virustotal.com/gui/url/${btoa(url).replace(/=/g, '')}`;
  
  if (status === 'safe') {
    return `<span class="shield-indicator shield-safe" onclick="window.open('${vtUrl}', '_blank')" title="🛡️ Clean - No threats detected by VirusTotal&#10;0/${total} security vendors flagged this URL&#10;Click to view full report" style="cursor: pointer;">🛡️</span>`;
  } else if (status === 'unsafe') {
    const malText = malicious ? `&#10;${malicious} marked as malicious` : '';
    const susText = suspicious ? `&#10;${suspicious} marked as suspicious` : '';
    return `<span class="shield-indicator shield-unsafe" onclick="window.open('${vtUrl}', '_blank')" title="⚠️ Malicious - Multiple threats detected!&#10;${detections}/${total} security vendors flagged this URL${malText}${susText}&#10;Click to view full report" style="cursor: pointer;">🛡️</span>`;
  } else if (status === 'warning') {
    const malText = malicious ? `&#10;${malicious} marked as malicious` : '';
    const susText = suspicious ? `&#10;${suspicious} marked as suspicious` : '';
    return `<span class="shield-indicator shield-warning" onclick="window.open('${vtUrl}', '_blank')" title="⚠️ Suspicious - Some vendors flagged this URL&#10;${detections}/${total} security vendors flagged this URL${malText}${susText}&#10;Click to view full report" style="cursor: pointer;">🛡️</span>`;
  } else if (status === 'scanning') {
    return `<span class="shield-indicator shield-scanning" title="🔍 VirusTotal scan in progress...&#10;Please wait while we analyze this URL">🛡️</span>`;
  } else if (status === 'rate_limited') {
    return `<span class="shield-indicator shield-gray" title="⏸️ Rate limit reached&#10;VirusTotal allows 4 requests per minute&#10;Try again in a moment">🛡️</span>`;
  } else if (status === 'error') {
    return `<span class="shield-indicator shield-gray" title="❌ Error during security check&#10;Unable to scan this URL&#10;Try rechecking or verify your API key">🛡️</span>`;
  } else {
    return `<span class="shield-indicator shield-gray" title="? Security status unknown&#10;Not yet scanned by VirusTotal&#10;Click 'Recheck' to scan">🛡️</span>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Global functions for onclick handlers
window.toggleFolder = function(folderId) {
  if (state.expandedFolders.has(folderId)) {
    state.expandedFolders.delete(folderId);
  } else {
    state.expandedFolders.add(folderId);
  }
  render();
};

window.openBookmark = function(bookmarkId) {
  const bookmark = findBookmark(state.bookmarkTree, bookmarkId);
  if (bookmark) {
    browser.tabs.create({ url: bookmark.url });
  }
};

window.editBookmark = function(bookmarkId) {
  const bookmark = findBookmark(state.bookmarkTree, bookmarkId);
  if (bookmark) {
    state.editingBookmark = bookmark;
    document.getElementById('editTitle').value = bookmark.title;
    document.getElementById('editUrl').value = bookmark.url;
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').dataset.bookmarkId = bookmarkId;
  }
};

async function handleSaveEdit() {
  const bookmarkId = document.getElementById('editModal').dataset.bookmarkId;
  const title = document.getElementById('editTitle').value.trim();
  const url = document.getElementById('editUrl').value.trim();
  
  if (!title || !url) {
    alert('Title and URL are required');
    return;
  }
  
  try {
    await browser.bookmarks.update(bookmarkId, { title, url });
    document.getElementById('editModal').classList.add('hidden');
    state.editingBookmark = null;
    await reloadBookmarks();
    
    const bookmark = findBookmark(state.bookmarkTree, bookmarkId);
    if (bookmark) {
      checkCache.delete(bookmark.url);
      await checkSingleLink(bookmark);
    }
  } catch (error) {
    alert('Failed to update bookmark: ' + error.message);
  }
}

window.recheckLink = async function(bookmarkId) {
  const bookmark = findBookmark(state.bookmarkTree, bookmarkId);
  if (bookmark) {
    checkCache.delete(bookmark.url);
    await checkSingleLink(bookmark);
  }
};

window.deleteBookmark = async function(bookmarkId) {
  if (confirm('Are you sure you want to delete this bookmark from Firefox?')) {
    try {
      const bookmark = findBookmark(state.bookmarkTree, bookmarkId);
      
      state.undoHistory.push({ 
        type: 'delete', 
        bookmark: { ...bookmark }
      });
      
      await browser.bookmarks.remove(bookmarkId);
      await reloadBookmarks();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete bookmark: ' + error.message);
    }
  }
};

function renderUndoButton() {
  const btn = document.getElementById('undoBtn');
  btn.classList.toggle('hidden', state.undoHistory.length === 0);
}

async function performUndo() {
  if (state.undoHistory.length === 0) return;
  
  const action = state.undoHistory.pop();
  
  if (action.type === 'delete') {
    try {
      await browser.bookmarks.create({
        parentId: action.bookmark.parentId,
        title: action.bookmark.title,
        url: action.bookmark.url,
        index: action.bookmark.index
      });
      await reloadBookmarks();
    } catch (error) {
      alert('Failed to undo: ' + error.message);
      state.undoHistory.push(action);
    }
  }
  
  render();
}

function openCreateBookmarkModal() {
  alert('Create bookmark modal - to be implemented');
}

function openCreateFolderModal() {
  alert('Create folder modal - to be implemented');
}

function handleFindDuplicates() {
  const urlMap = new Map();
  const bookmarks = getAllBookmarks(state.bookmarkTree);
  
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
  }
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