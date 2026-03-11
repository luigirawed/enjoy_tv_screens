/**
 * Fetches all slide image URLs for a presentation using the Google Apps Script bridge.
 * This bypasses the need for OAuth or API Keys on the frontend.
 */
export async function fetchAllSlideImages(presentationId) {
  const bridgeUrl = import.meta.env.VITE_BRIDGE_URL;
  if (!bridgeUrl) throw new Error('Missing VITE_BRIDGE_URL in environment');

  let response;
  try {
    response = await fetch(`${bridgeUrl}?presentationId=${presentationId}`);
  } catch (networkErr) {
    console.error('Network error:', networkErr);
    throw new Error(`Network error: ${networkErr.message}. Check if the bridge URL is accessible.`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Bridge error response:', response.status, errorText);

    // Try to parse error as JSON
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || `Bridge error: ${response.status}`);
    } catch {
      throw new Error(`Bridge error: ${response.status} - ${response.statusText}`);
    }
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No slides found in presentation. Make sure the presentation has slides and is not empty.');
  }

  // The bridge returns a list of { objectId, url }
  return data;
}

/**
 * Test if the bridge URL is accessible
 */
export async function testBridgeConnection() {
  const bridgeUrl = import.meta.env.VITE_BRIDGE_URL;
  if (!bridgeUrl) return { success: false, error: 'No bridge URL configured' };

  try {
    const response = await fetch(bridgeUrl, {
      redirect: 'follow',
      mode: 'cors'
    });
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
