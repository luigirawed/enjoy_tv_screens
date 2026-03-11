import React, { useState, useEffect, useCallback } from 'react';
import SlideViewer from './components/SlideViewer';
import SettingsMenu from './components/SettingsMenu';
import DisplayCodeScreen from './components/DisplayCodeScreen';
import AdminScreen from './components/AdminScreen';
import { fetchAllSlideImages } from './api/slides-fetcher';
import { preloadImages } from './utils/image-cache';
import { startScheduler } from './utils/scheduler';
import { isDisplayAuthorized, isAdminMode, revokeAuthorization } from './utils/display-pairing';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if we're in admin mode (for pairing displays)
  const isAdmin = isAdminMode();

  // Check if this display is authorized
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (isAdmin) return true; // Admin mode doesn't need authorization
    return isDisplayAuthorized();
  });

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [presentationId] = useState(
    import.meta.env.VITE_SLIDES_PRESENTATION_ID ||
    localStorage.getItem('tv_presentation_id') || ''
  );
  const [intervalSecs, setIntervalSecs] = useState(
    Number(localStorage.getItem('tv_interval')) || 10
  );
  const [isPaused, setIsPaused] = useState(
    localStorage.getItem('tv_paused') === 'true'
  );

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('tv_interval', intervalSecs.toString());
    localStorage.setItem('tv_paused', isPaused.toString());
  }, [intervalSecs, isPaused]);

  // Main slide fetcher
  const loadSlides = useCallback(async () => {
    if (!isAuthorized || !presentationId) {
      setImages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedImages = await fetchAllSlideImages(presentationId);
      const urls = fetchedImages.map(img => img.url);
      const cachedUrls = await preloadImages(urls);
      setImages(cachedUrls);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, presentationId]);

  // Initial load
  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  // Background 6-hour scheduler
  useEffect(() => {
    if (!isAuthorized || !presentationId) return;

    const cleanup = startScheduler(() => {
      console.log("Executing scheduled background refresh");
      loadSlides();
    });

    return () => cleanup();
  }, [isAuthorized, presentationId, loadSlides]);

  // TV Remote Listener for opening settings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSettings && (e.key === 'ArrowUp' || e.key === 'Enter')) {
        setShowSettings(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

  // Render admin screen if in admin mode
  if (isAdmin) {
    return <AdminScreen onComplete={() => {
      // Remove admin param and reload
      window.location.href = window.location.pathname;
    }} />;
  }

  // Render setup screen if not authorized
  if (!isAuthorized) {
    return <DisplayCodeScreen />;
  }

  return (
    <div className="app-container">
      {loading && images.length === 0 && (
        <div className="fullscreen-loader">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="loader-logo" />
          <div className="spinner"></div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
          <button onClick={loadSlides}>Retry</button>
        </div>
      )}

      {!presentationId && !loading && (
        <div className="setup-prompt">
          <h2>Welcome!</h2>
          <p>No presentation ID configured. Set <strong>VITE_SLIDES_PRESENTATION_ID</strong> in your environment.</p>
        </div>
      )}

      <SlideViewer
        images={images}
        intervalSeconds={intervalSecs}
        isPaused={isPaused}
      />

      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        interval={intervalSecs}
        setInterval={setIntervalSecs}
        isPaused={isPaused}
        setPaused={setIsPaused}
        presentationId={presentationId}
        setPresentationId={() => { }} // Read-only from env now
        onForceRefresh={() => {
          loadSlides();
          setShowSettings(false);
        }}
        onLogout={() => {
          revokeAuthorization();
          setIsAuthorized(false);
        }}
      />
    </div>
  );
}

export default App;
