/**
 * Display Pairing Authentication System
 * 
 * This system allows TVs to be authorized without requiring PIN entry on the TV itself.
 * 
 * Flow:
 * 1. TV generates a unique display ID (stored in localStorage)
 * 2. TV shows a 6-character pairing code
 * 3. Admin visits the app with ?pin=XXXXXX (6-digit PIN) from an allowed IP
 * 4. Admin enters the pairing code to authorize the display
 * 5. Authorization is stored in localStorage on the TV (expires in 30 days)
 */

const STORAGE_KEY_DISPLAY_ID = 'tv_display_id';
const STORAGE_KEY_AUTHORIZATION = 'tv_authorization';
const AUTHORIZATION_EXPIRY_DAYS = 30;

/**
 * Generate a unique display ID (6 characters)
 */
export function generateDisplayId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0,O,1,I
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Get or create the display ID for this TV
 */
export function getDisplayId() {
    let displayId = localStorage.getItem(STORAGE_KEY_DISPLAY_ID);

    if (!displayId) {
        displayId = generateDisplayId();
        localStorage.setItem(STORAGE_KEY_DISPLAY_ID, displayId);
    }

    return displayId;
}

/**
 * Authorize this display with a pairing code
 * Called from admin page to register this TV
 */
export function authorizeDisplay(authorizationData) {
    const auth = {
        ...authorizationData,
        authorizedAt: Date.now(),
        expiresAt: Date.now() + (AUTHORIZATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem(STORAGE_KEY_AUTHORIZATION, JSON.stringify(auth));
    return auth;
}

/**
 * Check if this display is currently authorized
 */
export function isDisplayAuthorized() {
    const authStr = localStorage.getItem(STORAGE_KEY_AUTHORIZATION);
    if (!authStr) return false;

    try {
        const auth = JSON.parse(authStr);
        if (Date.now() > auth.expiresAt) {
            // Authorization expired, clear it
            localStorage.removeItem(STORAGE_KEY_AUTHORIZATION);
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get authorization details
 */
export function getAuthorization() {
    const authStr = localStorage.getItem(STORAGE_KEY_AUTHORIZATION);
    if (!authStr) return null;

    try {
        return JSON.parse(authStr);
    } catch (e) {
        return null;
    }
}

/**
 * Revoke authorization (logout)
 */
export function revokeAuthorization() {
    localStorage.removeItem(STORAGE_KEY_AUTHORIZATION);
}

/**
 * Check if admin mode is requested via URL PIN parameter
 * User must provide ?pin=XXXXXX where XXXXXX is the 6-digit PIN
 */
export function isAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get('pin');
    const correctPin = getPin();

    // If no PIN configured, admin mode is disabled
    if (!correctPin) return false;

    // Check if PIN matches (exactly 6 digits)
    return pinParam === correctPin;
}

/**
 * Get the PIN from environment
 */
export function getPin() {
    return import.meta.env.VITE_ACCESS_PIN || null;
}

/**
 * Validate a pairing code format
 */
export function isValidPairingCode(code) {
    if (!code || code.length !== 6) return false;
    return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

/**
 * Generate a random pairing code for admin to enter
 * This is shown on the TV and entered on the admin device
 */
export function generatePairingCode() {
    return getDisplayId(); // Use the display ID as the pairing code
}
