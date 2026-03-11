const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/presentations.readonly';

/**
 * Builds the Google OAuth URL and redirects the browser directly.
 * This uses the Implicit Grant flow (no popup, no external script).
 * Works in any browser including TV Bro on Android TV.
 */
export function redirectToGoogleLogin() {
  if (!CLIENT_ID) {
    console.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
    return;
  }

  // Must exactly match what's in Google Cloud Console → Authorized redirect URIs
  const redirectUri = import.meta.env.VITE_REDIRECT_URI || (window.location.origin + window.location.pathname);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Checks the URL hash for an access_token returned from Google's redirect.
 * Returns true if a token was found and saved, false otherwise.
 */
export function handleRedirectResult() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return false;

  const params = new URLSearchParams(hash.substring(1)); // remove the #
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');

  if (accessToken) {
    saveToken(accessToken, expiresIn);
    // Clean the URL so the token isn't visible
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  }
  return false;
}

function saveToken(accessToken, expiresIn) {
  localStorage.setItem('g_access_token', accessToken);
  const expiryTime = Date.now() + (parseInt(expiresIn || '3600', 10) * 1000);
  localStorage.setItem('g_token_expiry', expiryTime.toString());
}

export function getAccessToken() {
  const token = localStorage.getItem('g_access_token');
  const expiry = localStorage.getItem('g_token_expiry');

  if (token && expiry && expiry !== 'undefined') {
    const expiresAt = parseInt(expiry, 10);
    if (expiresAt > Date.now() + 300000) {
      return token;
    }
  }

  clearTokens();
  return null;
}

export async function getValidToken() {
  const token = getAccessToken();
  if (token) return token;
  return null;
}

export function clearTokens() {
  localStorage.removeItem('g_access_token');
  localStorage.removeItem('g_token_expiry');
}
