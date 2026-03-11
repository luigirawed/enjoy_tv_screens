import React, { useState, useEffect, useCallback } from 'react';
import PinScreen from './components/PinScreen';
import SlideViewer from './components/SlideViewer';
import SettingsMenu from './components/SettingsMenu';
import { fetchAllSlideImages } from './api/slides-fetcher';
import { preloadImages } from './utils/image-cache';
import { startScheduler } from './utils/scheduler';
import { getPublicIP, isIPAllowed } from './utils/ip-check';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipAllowed, setIpAllowed] = useState(null); // null = checking

  // PIN gate
  const correctPin = import.meta.env.VITE_ACCESS_PIN;
  const [pinVerified, setPinVerified] = useState(() => {
    // If no PIN is configured, skip the gate entirely
    if (!correctPin) return true;
    return localStorage.getItem('tv_pin_verified') === 'true';
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

  // Check IP allowlist on load
  useEffect(() => {
    async function checkIP() {
      const allowlist = import.meta.env.VITE_ALLOWED_IPS;
      if (!allowlist) {
        setIpAllowed(true);
        return;
      }
      const ip = await getPublicIP();
      setIpAllowed(isIPAllowed(ip, allowlist));
    }
    checkIP();
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('tv_interval', intervalSecs.toString());
    localStorage.setItem('tv_paused', isPaused.toString());
  }, [intervalSecs, isPaused]);

  // Main slide fetcher
  const loadSlides = useCallback(async () => {
    if (!pinVerified || !presentationId) {
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
  }, [pinVerified, presentationId]);

  // Initial load
  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  // Background 6-hour scheduler
  useEffect(() => {
    if (!pinVerified || !presentationId) return;

    const cleanup = startScheduler(() => {
      console.log("Executing scheduled background refresh");
      loadSlides();
    });

    return () => cleanup();
  }, [pinVerified, presentationId, loadSlides]);

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

  // IP check gate
  if (ipAllowed === null) {
    return (
      <div className="fullscreen-loader">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="loader-logo" />
        <div className="spinner"></div>
      </div>
    );
  }

  if (ipAllowed === false) {
    return (
      <div className="blocked-screen">
        <h1>Access Restricted</h1>
        <p>This display is not authorized to run from this network.</p>
      </div>
    );
  }

  // PIN gate
  if (!pinVerified) {
    return <PinScreen onSuccess={() => setPinVerified(true)} />;
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
        setPresentationId={() => {}} // Read-only from env now
        onForceRefresh={() => {
          loadSlides();
          setShowSettings(false);
        }}
        onLogout={() => {
          localStorage.removeItem('tv_pin_verified');
          setPinVerified(false);
        }}
      />
    </div>
  );
}

export default App;
