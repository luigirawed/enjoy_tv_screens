/**
 * Fetches the visitor's public IP address using a free API.
 * Falls back gracefully if the service is unavailable.
 */
export async function getPublicIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) throw new Error('IP lookup failed');
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.error('Could not determine public IP:', err);
    return null;
  }
}

/**
 * Checks whether the given IP is in the allowlist.
 * @param {string} ip - The visitor's public IP
 * @param {string} allowlistStr - Comma-separated IPs from env
 * @returns {boolean}
 */
export function isIPAllowed(ip, allowlistStr) {
  if (!allowlistStr) return true; // No restriction configured
  if (!ip) return false; // Can't verify, block by default

  const allowedIPs = allowlistStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (allowedIPs.length === 0) return true; // Empty list = no restriction
  return allowedIPs.includes(ip);
}
