/**
 * Fetches all slide image URLs for a presentation using the Google Apps Script bridge.
 * This bypasses the need for OAuth or API Keys on the frontend.
 */
export async function fetchAllSlideImages(presentationId) {
  const bridgeUrl = import.meta.env.VITE_BRIDGE_URL;
  if (!bridgeUrl) throw new Error('Missing VITE_BRIDGE_URL in environment');

  const response = await fetch(`${bridgeUrl}?presentationId=${presentationId}`);

  if (!response.ok) {
    throw new Error(`Bridge error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  // The bridge returns a list of { objectId, url }
  return data;
}
