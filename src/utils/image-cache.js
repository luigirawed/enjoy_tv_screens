export async function preloadImages(urls) {
  const promises = urls.map(url => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(url);
      img.onerror = () => {
        console.error(`Failed to preload image: ${url}`);
        // Resolve anyway so Promise.all doesn't fail the whole batch
        resolve(null); 
      };
    });
  });
  
  const results = await Promise.all(promises);
  return results.filter(url => url !== null);
}
