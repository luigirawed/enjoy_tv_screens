/**
 * Google TV Slides Bridge - Using Native SlidesApp
 * 
 * This script runs as the deploying user and uses their native Google permissions
 * to access presentations. No API keys or OAuth tokens needed on the client side.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com/ and create a new project
 * 2. Paste this entire file as Code.gs
 * 3. Click Deploy → New deployment
 * 4. Select type: Web app
 * 5. Execute as: Me
 * 6. Who has access: Anyone
 * 7. Click Deploy and copy the URL
 * 8. Set that URL as VITE_BRIDGE_URL in your GitHub secrets
 * 
 * IMPORTANT: After ANY code change, you must create a NEW deployment
 * (Deploy → New deployment), not just save. The URL changes each time.
 */

function doGet(e) {
  try {
    var presentationId = e.parameter.presentationId;
    
    if (!presentationId) {
      return jsonResponse({ error: "Missing presentationId parameter" });
    }
    
    // Clean the ID (remove any accidental quotes or whitespace)
    presentationId = presentationId.replace(/['"]/g, '').trim();
    
    // Try using the native SlidesApp first (most reliable)
    var presentation;
    try {
      presentation = SlidesApp.openById(presentationId);
    } catch (openErr) {
      return jsonResponse({ 
        error: "Could not open presentation. Check the ID is correct and that the script owner has access. Details: " + openErr.message 
      });
    }
    
    var slides = presentation.getSlides();
    
    if (!slides || slides.length === 0) {
      return jsonResponse({ error: "Presentation has no slides" });
    }
    
    // Get thumbnail URLs for each slide using the REST API with the script's OAuth token
    var imageUrls = [];
    var token = ScriptApp.getOAuthToken();
    
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      var objectId = slide.getObjectId();
      
      try {
        var thumbUrl = "https://slides.googleapis.com/v1/presentations/" + presentationId + "/pages/" + objectId + "/thumbnail?thumbnailProperties.thumbnailSize=LARGE";
        var thumbRes = UrlFetchApp.fetch(thumbUrl, {
          headers: { "Authorization": "Bearer " + token },
          muteHttpExceptions: true
        });
        
        if (thumbRes.getResponseCode() === 200) {
          var thumbData = JSON.parse(thumbRes.getContentText());
          imageUrls.push({
            objectId: objectId,
            url: thumbData.contentUrl,
            slideIndex: i
          });
        } else {
          // If thumbnail API fails, try to export as image via Drive
          Logger.log("Thumbnail API failed for slide " + i + ": " + thumbRes.getContentText());
          imageUrls.push({
            objectId: objectId,
            url: null,
            slideIndex: i,
            error: "Could not generate thumbnail"
          });
        }
      } catch (thumbErr) {
        Logger.log("Error getting thumbnail for slide " + i + ": " + thumbErr.message);
        imageUrls.push({
          objectId: objectId,
          url: null,
          slideIndex: i,
          error: thumbErr.message
        });
      }
    }
    
    // Filter out slides that failed to get thumbnails
    var validImages = imageUrls.filter(function(img) { return img.url !== null; });
    
    if (validImages.length === 0) {
      return jsonResponse({ 
        error: "Could not generate thumbnails for any slides. The Google Slides API may need to be enabled. Go to the Apps Script editor → Services → Add Google Slides API.",
        details: imageUrls
      });
    }
    
    return jsonResponse(validImages);
    
  } catch (err) {
    return jsonResponse({ error: "Unexpected error: " + err.message });
  }
}

/**
 * Helper to return a JSON response with proper CORS headers
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this in the Apps Script editor to verify access
 * Replace the ID below with your actual presentation ID
 */
function testAccess() {
  var testId = "1FjkQWq9MmWMu72qaDy8CzOD3EckZ4gmgPUTZuB5L7yg";
  
  try {
    var presentation = SlidesApp.openById(testId);
    Logger.log("✅ Successfully opened: " + presentation.getName());
    Logger.log("   Slides count: " + presentation.getSlides().length);
    
    // Test thumbnail generation
    var slides = presentation.getSlides();
    var token = ScriptApp.getOAuthToken();
    var firstSlide = slides[0];
    var thumbUrl = "https://slides.googleapis.com/v1/presentations/" + testId + "/pages/" + firstSlide.getObjectId() + "/thumbnail";
    var thumbRes = UrlFetchApp.fetch(thumbUrl, {
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    });
    
    if (thumbRes.getResponseCode() === 200) {
      var thumbData = JSON.parse(thumbRes.getContentText());
      Logger.log("✅ Thumbnail URL: " + thumbData.contentUrl);
    } else {
      Logger.log("❌ Thumbnail failed: " + thumbRes.getResponseCode() + " " + thumbRes.getContentText());
      Logger.log("   You may need to enable the Google Slides API:");
      Logger.log("   Go to Services (+ icon) → Google Slides API → Add");
    }
  } catch (err) {
    Logger.log("❌ Failed to open presentation: " + err.message);
    Logger.log("   Make sure the presentation is shared with your account");
  }
}
