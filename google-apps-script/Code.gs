/**
 * Google TV Slides Bridge - Version that includes visibility info
 * 
 * DEPLOYMENT:
 * 1. Go to script.google.com/create
 * 2. Paste this code
 * 3. File → Project Properties → Scopes → ADD:
 *    - https://www.googleapis.com/auth/presentations
 *    - https://www.googleapis.com/auth/script.external_request
 * 4. OR create appsscript.json with the scopes below
 * 5. Deploy as Web App (Anyone access)
 * 6. Share the presentation with the deploying account
 * 
 * The resulting URL should be: https://script.google.com/macros/s/.../exec
 * (NOT /a/macros/...)
 */

function doGet(e) {
  try {
    var presentationId = e.parameter.presentationId;
    
    if (!presentationId) {
      return jsonResponse({ error: "Missing presentationId parameter" });
    }
    
    // Clean the ID
    presentationId = presentationId.replace(/['"]/g, '').trim();
    
    // Open the presentation using SlidesApp
    var presentation;
    try {
      presentation = SlidesApp.openById(presentationId);
    } catch (openErr) {
      return jsonResponse({ 
        error: "Cannot access presentation. " +
               "1) Make sure the ID is correct. " +
               "2) Share the presentation with the account that deployed this script (as Viewer or more). " +
               "Error: " + openErr.message
      });
    }
    
    var slides = presentation.getSlides();
    
    if (!slides || slides.length === 0) {
      return jsonResponse({ error: "Presentation has no slides" });
    }
    
    // Get OAuth token for thumbnail API
    var token = ScriptApp.getOAuthToken();
    var imageUrls = [];
    
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      var objectId = slide.getObjectId();
      
      // Check if slide is visible/hidden using the REST API
      var isVisible = true;
      try {
        var slideUrl = "https://slides.googleapis.com/v1/presentations/" + 
                       presentationId + "/pages/" + objectId;
        var slideRes = UrlFetchApp.fetch(slideUrl, {
          headers: { "Authorization": "Bearer " + token },
          muteHttpExceptions: true
        });
        
        if (slideRes.getResponseCode() === 200) {
          var slideData = JSON.parse(slideRes.getContentText());
          var visibility = "VISIBLE";
          if (slideData.pageProperties && slideData.pageProperties.pageVisibility) {
            visibility = slideData.pageProperties.pageVisibility;
          }
          isVisible = (visibility === "VISIBLE");
        }
      } catch (err) {
        // Default to visible if we can't check
        isVisible = true;
      }
      
      try {
        var thumbUrl = "https://slides.googleapis.com/v1/presentations/" + 
                       presentationId + "/pages/" + objectId + "/thumbnail" +
                       "?thumbnailProperties.thumbnailSize=LARGE";
                        
        var thumbRes = UrlFetchApp.fetch(thumbUrl, {
          headers: { "Authorization": "Bearer " + token },
          muteHttpExceptions: true
        });
        
        if (thumbRes.getResponseCode() === 200) {
          var thumbData = JSON.parse(thumbRes.getContentText());
          imageUrls.push({
            objectId: objectId,
            url: thumbData.contentUrl,
            slideNumber: i + 1,
            isVisible: isVisible
          });
        } else {
          imageUrls.push({
            objectId: objectId,
            slideNumber: i + 1,
            isVisible: isVisible,
            error: "Thumbnail failed: " + thumbRes.getResponseCode()
          });
        }
      } catch (thumbErr) {
        imageUrls.push({
          objectId: objectId,
          slideNumber: i + 1,
          isVisible: isVisible,
          error: thumbErr.message
        });
      }
    }
    
    // Filter successful ones
    var validImages = imageUrls.filter(function(img) { return img.url !== undefined; });
    
    if (validImages.length === 0) {
      return jsonResponse({ 
        error: "Could not get any thumbnails. The script may need Slides API scope. " +
               "Add to appsscript.json: \"https://www.googleapis.com/auth/presentations\"",
        details: imageUrls
      });
    }
    
    return jsonResponse(validImages);
    
  } catch (err) {
    return jsonResponse({ error: err.message + " (stack: " + err.stack + ")" });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create appsscript.json with proper scopes
 */
function createManifest() {
  return {
    "timeZone": "America/New_York",
    "dependencies": {
      "enabledAdvancedServices": [{
        "userSymbol": "Slides",
        "serviceId": "slides",
        "version": "v1"
      }]
    },
    "oauthScopes": [
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/script.external_request",
      "https://www.googleapis.com/auth/drive.readonly"
    ],
    "exceptionLogging": "STACKDRIVER"
  };
}
