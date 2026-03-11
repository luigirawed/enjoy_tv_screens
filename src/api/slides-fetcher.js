/**
 * Fetches all slide image URLs for a presentation using the Google Apps Script bridge.
 * This bypasses the need for OAuth or API Keys on the frontend.
 */
export async function fetchAllSlideImages(presentationId) {
  const bridgeUrl = import.meta.env.VITE_BRIDGE_URL;
  if (!bridgeUrl) throw new Error('Missing VITE_BRIDGE_URL in environment');

  // Strip any accidental quotes from the presentation ID
  const cleanId = presentationId.replace(/['"]/g, '').trim();
  const requestUrl = `${bridgeUrl}?presentationId=${encodeURIComponent(cleanId)}`;

  console.log('[Bridge] Fetching slides:', { bridgeUrl, presentationId: cleanId, requestUrl });

  let response;
  try {
    response = await fetch(requestUrl);
  } catch (networkErr) {
    console.error('Network error:', networkErr);
    throw new Error(`Network error: ${networkErr.message}. Check if the bridge URL is accessible.`);
  }

  // Google Apps Script redirects (302) are followed automatically by fetch.
  // A 200 response may still contain an error in the JSON body.
  const responseText = await response.text();
  console.log('[Bridge] Response status:', response.status, '| Body preview:', responseText.substring(0, 300));

  if (!response.ok) {
    console.error('Bridge error response:', response.status, responseText);

    // Try to parse error as JSON
    try {
      const errorJson = JSON.parse(responseText);
      throw new Error(errorJson.error || `Bridge error: ${response.status}`);
    } catch (parseErr) {
      throw new Error(`Bridge error: ${response.status} - ${response.statusText}`);
    }
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseErr) {
    console.error('[Bridge] Failed to parse JSON:', parseErr, '| Raw:', responseText.substring(0, 500));
    throw new Error('Bridge returned invalid JSON. The script may have an error or returned an HTML error page.');
  }

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
