// Load saved settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await browser.storage.local.get('settings');
    if (result.settings) {
      document.getElementById('virusTotalApiKey').value = result.settings.virusTotalApiKey || '';
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('testBtn').addEventListener('click', testConnections);
}

// Save settings to storage
async function saveSettings() {
  const settings = {
    virusTotalApiKey: document.getElementById('virusTotalApiKey').value.trim()
  };
  
  try {
    await browser.storage.local.set({ settings });
    showSuccessMessage();
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings. Please try again.');
  }
}

// Show success message
function showSuccessMessage() {
  const message = document.getElementById('successMessage');
  message.classList.add('show');
  setTimeout(() => {
    message.classList.remove('show');
  }, 3000);
}

// Test API connections
async function testConnections() {
  const btn = document.getElementById('testBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>⏳</span><span>Testing...</span>';
  btn.disabled = true;
  
  const results = [];
  
  // Test VirusTotal
  const vtKey = document.getElementById('virusTotalApiKey').value.trim();
  if (vtKey) {
    const vtResult = await testVirusTotal(vtKey);
    results.push(`VirusTotal: ${vtResult ? '✓ Working' : '✗ Failed'}`);
  } else {
    results.push('VirusTotal: Not configured');
  }
  
  // Show results
  alert('API Connection Test Results:\n\n' + results.join('\n'));
  
  btn.innerHTML = originalText;
  btn.disabled = false;
}

// Test VirusTotal API
async function testVirusTotal(apiKey) {
  try {
    // Test with a simple domain lookup
    const response = await fetch(
      'https://www.virustotal.com/api/v3/domains/google.com',
      {
        headers: {
          'x-apikey': apiKey
        }
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('VirusTotal test error:', error);
    return false;
  }
}