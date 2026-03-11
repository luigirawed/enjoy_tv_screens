import { getValidToken } from './google-auth';

const SLIDES_API_BASE = 'https://slides.googleapis.com/v1/presentations';

/**
 * Validates the token and fetches the presentation metadata including all slides.
 * @param {string} presentationId 
 * @returns {Array} Array of slide objects
 */
export async function fetchPresentationSlides(presentationId) {
  const token = await getValidToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${SLIDES_API_BASE}/${presentationId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized');
    if (response.status === 404) throw new Error('Presentation not found');
    throw new Error('Failed to fetch presentation metadata');
  }

  const data = await response.json();
  return data.slides || [];
}

/**
 * Fetches a high-quality thumbnail URL for a specific slide.
 * Note: These URLs expire after 30 minutes.
 * @param {string} presentationId 
 * @param {string} pageObjectId 
 * @returns {string} Temporary thumbnail URL
 */
export async function fetchSlideThumbnailUrl(presentationId, pageObjectId) {
  const token = await getValidToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${SLIDES_API_BASE}/${presentationId}/pages/${pageObjectId}/thumbnail?thumbnailProperties.thumbnailSize=LARGE`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch thumbnail for slide ${pageObjectId}`);
  }

  const data = await response.json();
  return data.contentUrl; 
}

/**
 * Convenience function to fetch all slide image URLs for a presentation.
 * Returns an array of objects containing objectId and url.
 * @param {string} presentationId 
 */
export async function fetchAllSlideImages(presentationId) {
  const slides = await fetchPresentationSlides(presentationId);
  
  // To avoid hitting rate limits too aggressively, we could batch or delay, 
  // but for small presentations Promise.all is usually fine.
  const slideData = await Promise.all(
    slides.map(async (slide) => {
      try {
        const url = await fetchSlideThumbnailUrl(presentationId, slide.objectId);
        return { objectId: slide.objectId, url };
      } catch (err) {
        console.error(err);
        return { objectId: slide.objectId, url: null, error: err.message };
      }
    })
  );

  return slideData.filter(s => s.url !== null);
}
