// Simple encryption utilities for API keys
// Uses WebCrypto API with AES-GCM

// Generate a consistent key from browser fingerprint
async function getDerivedKey() {
  // Use a combination of browser info as seed (not perfect but better than plaintext)
  const browserInfo = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(browserInfo);

  // Hash the browser info to create key material
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Import as a key
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string (like an API key)
export async function encryptApiKey(plaintext) {
  if (!plaintext) return null;

  try {
    const key = await getDerivedKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

// Decrypt a string (like an API key)
export async function decryptApiKey(encrypted) {
  if (!encrypted) return null;

  try {
    const key = await getDerivedKey();

    // Convert from base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Store encrypted API key
export async function storeEncryptedApiKey(keyName, apiKey) {
  const encrypted = await encryptApiKey(apiKey);
  if (encrypted) {
    await browser.storage.local.set({ [keyName]: encrypted });
    return true;
  }
  return false;
}

// Retrieve and decrypt API key
export async function getDecryptedApiKey(keyName) {
  const result = await browser.storage.local.get(keyName);
  if (result[keyName]) {
    return await decryptApiKey(result[keyName]);
  }
  return null;
}
