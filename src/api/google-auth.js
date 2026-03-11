const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Required scopes for Google Slides API
const SCOPES = 'https://www.googleapis.com/auth/presentations.readonly';

let tokenClient = null;
let initPromiseResolve = null;

// A promise that resolves when the GSI client is actually ready
export const gsiReady = new Promise((resolve) => {
  initPromiseResolve = resolve;
});

/**
 * Initializes the Google Identity Services client.
 * Retries up to 30 seconds for the external script to load (TV browsers can be slow).
 */
export function initGoogleIdentity(onTokenSuccess, onTokenError) {
  if (!CLIENT_ID) {
    console.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
    return;
  }

  let attempts = 0;
  const maxAttempts = 60; // 60 x 500ms = 30 seconds of retrying

  function tryInit() {
    attempts++;

    if (window.google?.accounts?.oauth2) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            saveToken(tokenResponse);
            onTokenSuccess(tokenResponse.access_token);
          } else {
            onTokenError(tokenResponse.error_description || tokenResponse.error || 'Authentication failed');
          }
        },
      });
      console.log(`GSI client initialized after ${attempts} attempt(s)`);
      initPromiseResolve(true);
    } else if (attempts < maxAttempts) {
      setTimeout(tryInit, 500);
    } else {
      console.error('Google Identity Services script failed to load after 30 seconds.');
      initPromiseResolve(false);
    }
  }

  tryInit();
}

/**
 * Triggers the Google Sign-In popup.
 * Returns false if the client isn't ready yet.
 */
export function requestLogin() {
  if (!tokenClient) {
    return false;
  }
  tokenClient.requestAccessToken({ prompt: 'consent' });
  return true;
}

function saveToken(tokenData) {
  localStorage.setItem('g_access_token', tokenData.access_token);
  const expiryTime = Date.now() + (tokenData.expires_in * 1000);
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
