/**
 * Simple API Key accessor — reads from VITE_GOOGLE_API_KEY environment variable.
 */
export function getApiKey() {
  return import.meta.env.VITE_GOOGLE_API_KEY || null;
}
