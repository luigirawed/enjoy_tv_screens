import React, { useState, useEffect, useCallback } from 'react';
import SlideViewer from './components/SlideViewer';
import SettingsMenu from './components/SettingsMenu';
import DisplayCodeScreen from './components/DisplayCodeScreen';
import PinEntryScreen from './components/PinEntryScreen';
import { fetchAllSlideImages } from './api/slides-fetcher';
import { preloadImages } from './utils/image-cache';
import { startScheduler } from './utils/scheduler';
import { isDisplayAuthorized, revokeAuthorization } from './utils/display-pairing';
import { getPublicIP, isIPAllowed } from './utils/ip-check';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipValidated, setIpValidated] = useState(false);
  const [ipCheckComplete, setIpCheckComplete] = useState(false);

  // Check IP on mount - only allow admin access from allowed IPs
  useEffect(() => {
    const checkIP = async () => {
      const allowedIPs = import.meta.env.VITE_ALLOWED_IPS;

      // If no IP restriction configured, allow access
      if (!allowedIPs) {
        setIpValidated(true);
        setIpCheckComplete(true);
        return;
      }

      const clientIP = await getPublicIP();
      const isAllowed = isIPAllowed(clientIP, allowedIPs);

      setIpValidated(isAllowed);
      setIpCheckComplete(true);
    };

    checkIP();
  }, []);

  // Check if this display is authorized
  const [isAuthorized, setIsAuthorized] = useState(() => {
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

  // Wake Lock to prevent screen from sleeping
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      if (!isAuthorized) return;

      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock active - screen will stay on');
        }
      } catch (err) {
        console.log('Wake Lock not available:', err.message);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        try {
          await wakeLock.release();
          wakeLock = null;
          console.log('Wake Lock released');
        } catch (err) {
          console.log('Error releasing wake lock:', err.message);
        }
      }
    };

    // Request wake lock when authorized
    if (isAuthorized) {
      requestWakeLock();
    }

    // Handle visibility change (tab becomes visible again)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthorized) {
        await releaseWakeLock();
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthorized]);

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

  // Handle successful PIN authorization on TV
  const handlePinAuthorized = () => {
    setIsAuthorized(true);
  };

  // Wait for IP check to complete
  if (!ipCheckComplete) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '20px' }}>Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Render authorization screens based on IP status
  // If IP is allowed and not authorized → show PIN entry (TV can self-authorize)
  // If IP is not allowed and not authorized → show display code (needs external admin)
  if (!isAuthorized) {
    if (ipValidated) {
      // IP is allowed - TV can enter PIN to authorize itself
      return <PinEntryScreen onAuthorized={handlePinAuthorized} />;
    } else {
      // IP is not allowed - need external admin device
      return <DisplayCodeScreen />;
    }
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
