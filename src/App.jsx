import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import SlideViewer from './components/SlideViewer';
import SettingsMenu from './components/SettingsMenu';
import { getValidToken, clearTokens, handleRedirectResult } from './api/google-auth';
import { fetchAllSlideImages } from './api/slides-fetcher';
import { preloadImages } from './utils/image-cache';
import { startScheduler } from './utils/scheduler';
import { getPublicIP, isIPAllowed } from './utils/ip-check';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipAllowed, setIpAllowed] = useState(null); // null = checking

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [presentationId, setPresentationId] = useState(
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

  // Check auth on load (also handles returning from Google redirect)
  useEffect(() => {
    async function checkAuth() {
      // First, check if we're returning from a Google redirect
      const redirected = handleRedirectResult();
      if (redirected) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
      // Otherwise check for existing token
      const token = await getValidToken();
      if (token) setIsAuthenticated(true);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('tv_presentation_id', presentationId);
    localStorage.setItem('tv_interval', intervalSecs.toString());
    localStorage.setItem('tv_paused', isPaused.toString());
  }, [presentationId, intervalSecs, isPaused]);

  // Main slide fetcher
  const loadSlides = useCallback(async () => {
    if (!isAuthenticated || !presentationId) {
      setImages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedImages = await fetchAllSlideImages(presentationId);
      const urls = fetchedImages.map(img => img.url);

      // Preload images
      const cachedUrls = await preloadImages(urls);
      setImages(cachedUrls);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load slides");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, presentationId]);

  // Initial load when ID or Auth changes
  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  // Background 6-hour scheduler
  useEffect(() => {
    if (!isAuthenticated || !presentationId) return;
    
    const cleanup = startScheduler(() => {
      console.log("Executing scheduled background refresh");
      loadSlides();
    });

    return () => cleanup();
  }, [isAuthenticated, presentationId, loadSlides]);

  // TV Remote Listener for opening settings
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Enter or Up arrow to open settings when not already open
      if (!showSettings && (e.key === 'ArrowUp' || e.key === 'Enter')) {
        setShowSettings(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

  const handleLogout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setShowSettings(false);
    setImages([]);
  };

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

  if (!isAuthenticated && !loading) {
    return <LoginScreen />;
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
          <p>Press <strong>UP</strong> or <strong>ENTER</strong> on your remote to open Settings and set your Google Slides ID.</p>
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
        setPresentationId={setPresentationId}
        onForceRefresh={() => {
          loadSlides();
          setShowSettings(false);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
