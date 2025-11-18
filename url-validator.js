// URL validation and sanitization to prevent SSRF attacks

// Blocked schemes that could be used for SSRF
const BLOCKED_SCHEMES = ['file', 'javascript', 'data', 'vbscript', 'about'];

// Private IP ranges to block
const PRIVATE_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private network (Class A)
  /^172\.(1[6-9]|2\d|3[01])\./, // Private network (Class B)
  /^192\.168\./,               // Private network (Class C)
  /^169\.254\./,               // Link-local
  /^::1$/,                     // IPv6 loopback
  /^fe80:/i,                   // IPv6 link-local
  /^fc00:/i,                   // IPv6 private
  /^fd00:/i,                   // IPv6 private
  /^localhost$/i               // localhost
];

// Validate and sanitize a URL
export function validateUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Invalid URL: empty or not a string' };
  }

  let url;
  try {
    url = new URL(urlString.trim());
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check for blocked schemes
  const scheme = url.protocol.replace(':', '').toLowerCase();
  if (BLOCKED_SCHEMES.includes(scheme)) {
    return { valid: false, error: `Blocked URL scheme: ${scheme}` };
  }

  // Only allow http and https
  if (scheme !== 'http' && scheme !== 'https') {
    return { valid: false, error: `Only HTTP and HTTPS URLs are allowed` };
  }

  // Check for private/internal IPs
  const hostname = url.hostname.toLowerCase();

  // Check if hostname is an IP address
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIPv6 = hostname.includes(':');

  if (isIPv4 || isIPv6) {
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, error: 'Private/internal IP addresses are not allowed' };
      }
    }
  } else {
    // Check hostname against patterns
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, error: 'Private/internal addresses are not allowed' };
      }
    }
  }

  // Additional security: check for credentials in URL
  if (url.username || url.password) {
    return { valid: false, error: 'URLs with credentials are not allowed' };
  }

  return { valid: true, url: url.href };
}

// Sanitize a URL for safe use
export function sanitizeUrl(urlString) {
  const validation = validateUrl(urlString);
  if (!validation.valid) {
    console.warn(`URL validation failed: ${validation.error}`);
    return null;
  }
  return validation.url;
}

// Validate URLs for batch processing
export function validateUrls(urls) {
  return urls.map(url => {
    const validation = validateUrl(url);
    return {
      original: url,
      ...validation
    };
  });
}
