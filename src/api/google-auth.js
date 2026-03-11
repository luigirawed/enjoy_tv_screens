const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Required scopes for Google Slides API
const SCOPES = 'https://www.googleapis.com/auth/presentations.readonly';

let tokenClient = null;

/**
 * Initializes the Google Identity Services client.
 * Must be called after the Google `<script>` has loaded.
 */
export function initGoogleIdentity(onTokenSuccess, onTokenError) {
  if (!CLIENT_ID) {
    console.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
    return;
  }

  if (window.google?.accounts?.oauth2) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          saveToken(tokenResponse);
          onTokenSuccess(tokenResponse.access_token);
        } else {
          onTokenError(tokenResponse.error || 'Authentication failed');
        }
      },
    });
  } else {
    // If google script isn't loaded yet, try again in a bit
    setTimeout(() => initGoogleIdentity(onTokenSuccess, onTokenError), 500);
  }
}

/**
 * Triggers the Google Sign-In popup
 */
export function requestLogin() {
  if (!tokenClient) {
    throw new Error('Google Identity client not initialized');
  }
  // Request an access token (implicit flow, no refresh token)
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

function saveToken(tokenData) {
  localStorage.setItem('g_access_token', tokenData.access_token);
  // tokens from implicit flow usually expire in 3600s
  const expiryTime = Date.now() + (tokenData.expires_in * 1000);
  localStorage.setItem('g_token_expiry', expiryTime.toString());
}

export function getAccessToken() {
  const token = localStorage.getItem('g_access_token');
  const expiry = localStorage.getItem('g_token_expiry');
  
  if (token && expiry && expiry !== 'undefined') {
    const expiresAt = parseInt(expiry, 10);
    // Add 5 min buffer to expiry
    if (expiresAt > Date.now() + 300000) {
      return token;
    }
  }
  
  // If no token or expired, clear them
  clearTokens();
  return null;
}

export async function getValidToken() {
  const token = getAccessToken();
  if (token) return token;

  // We don't have refresh tokens in the implicit flow
  // We must return null and prompt the user to click login again
  return null;
}

export function clearTokens() {
  localStorage.removeItem('g_access_token');
  localStorage.removeItem('g_token_expiry');
}
