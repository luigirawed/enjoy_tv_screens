import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SlideViewer.css';

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="clock-container">
      <div className="clock-time">{timeStr}</div>
      <div className="clock-date">{dateStr}</div>
    </div>
  );
}

export default function SlideViewer({ images, intervalSeconds, isPaused }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setProgress(0);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setProgress(0);
  }, [images.length]);

  // Interval Controller
  useEffect(() => {
    if (isPaused || images.length === 0) return;

    const intervalMs = intervalSeconds * 1000;
    const tickMs = 50; // Update progress every 50ms for smooth animation
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += tickMs;
      setProgress((elapsed / intervalMs) * 100);

      if (elapsed >= intervalMs) {
        goToNext();
        elapsed = 0;
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [images.length, intervalSeconds, isPaused, currentIndex, goToNext]);

  // TV Remote Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'MediaTrackNext') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'MediaTrackPrevious') {
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  if (!images || images.length === 0) {
    return <div className="viewer-empty">No slides available</div>;
  }

  return (
    <div className="slide-viewer">
      {/* Slide Area */}
      <div className="slide-area">
        {images.map((imgUrl, index) => (
          <div
            key={`${imgUrl}-${index}`}
            className={`slide ${index === currentIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${imgUrl})` }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: isPaused ? '0%' : `${progress}%` }}
        />
      </div>

      {/* Ticker Bar */}
      <div className="ticker-bar">
        <div className="ticker-left">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="ticker-logo" />
        </div>
        <div className="ticker-right">
          <LiveClock />
        </div>
      </div>
    </div>
  );
}
