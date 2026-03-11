import { getApiKey } from './api-key';

const SLIDES_API_BASE = 'https://slides.googleapis.com/v1/presentations';

/**
 * Fetches all slides from a public presentation using an API key.
 */
export async function fetchPresentationSlides(presentationId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Missing API Key');

  const response = await fetch(`${SLIDES_API_BASE}/${presentationId}?key=${apiKey}`);

  if (!response.ok) {
    if (response.status === 404) throw new Error('Presentation not found');
    if (response.status === 403) throw new Error('Presentation is not public or API key is invalid');
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.slides || [];
}

/**
 * Fetches a thumbnail URL for a specific slide using an API key.
 */
export async function fetchSlideThumbnailUrl(presentationId, pageObjectId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Missing API Key');

  const response = await fetch(
    `${SLIDES_API_BASE}/${presentationId}/pages/${pageObjectId}/thumbnail?thumbnailProperties.thumbnailSize=LARGE&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch thumbnail for slide ${pageObjectId}`);
  }

  const data = await response.json();
  return data.contentUrl;
}

/**
 * Fetches all slide image URLs for a presentation.
 */
export async function fetchAllSlideImages(presentationId) {
  const slides = await fetchPresentationSlides(presentationId);

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
