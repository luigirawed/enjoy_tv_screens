import React, { useEffect, useRef, useState } from 'react';
import { Settings, Play, Pause, RefreshCw, X, LogOut, Wifi, AlertCircle } from 'lucide-react';
import { testBridgeConnection } from '../api/slides-fetcher';
import './SettingsMenu.css';

export default function SettingsMenu({
  isOpen,
  onClose,
  interval,
  setInterval,
  isPaused,
  setPaused,
  presentationId,
  setPresentationId,
  onForceRefresh,
  onLogout
}) {
  const menuRef = useRef(null);
  const [bridgeStatus, setBridgeStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [bridgeError, setBridgeError] = useState('');

  // Simple roving tabindex implementation for TV Remotes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const focusables = Array.from(menuRef.current.querySelectorAll('.tv-focusable'));
      if (focusables.length === 0) return;

      const currentIndex = focusables.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % focusables.length;
        focusables[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
        focusables[nextIndex].focus();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus first element for TV input consistency
    setTimeout(() => {
      const first = menuRef.current?.querySelector('.tv-focusable');
      if (first) first.focus();
    }, 100);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-panel" ref={menuRef}>
        <div className="settings-header">
          <h2><Settings size={28} /> Display Settings</h2>
          <button className="icon-btn tv-focusable" onClick={onClose} aria-label="Close">
            <X size={28} />
          </button>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label>Google Slides ID</label>
            <input
              type="text"
              className="tv-focusable"
              value={presentationId}
              onChange={(e) => setPresentationId(e.target.value)}
              placeholder="e.g. 1BxiMvs... (found in URL)"
              readOnly={!!import.meta.env.VITE_SLIDES_PRESENTATION_ID}
            />
            <small>
              {import.meta.env.VITE_SLIDES_PRESENTATION_ID
                ? "Id is currently locked by the .env file"
                : "Found in the slide's URL: /d/[ID_HERE]/edit"}
            </small>
          </div>

          <div className="setting-group">
            <label>Slide Duration (seconds)</label>
            <input
              type="number"
              className="tv-focusable"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value) || 10)}
              min="1"
            />
          </div>

          <div className="setting-group">
            <label>Bridge Status</label>
            <button
              className="action-btn tv-focusable"
              onClick={async () => {
                setBridgeStatus('testing');
                setBridgeError('');
                const result = await testBridgeConnection();
                if (result.success) {
                  setBridgeStatus('success');
                } else {
                  setBridgeStatus('error');
                  setBridgeError(result.error || `HTTP ${result.status}`);
                }
              }}
              disabled={bridgeStatus === 'testing'}
            >
              <Wifi size={20} />
              {bridgeStatus === 'testing' ? 'Testing...' : 'Test Bridge Connection'}
            </button>
            {bridgeStatus === 'success' && (
              <div className="bridge-success">✓ Bridge is accessible</div>
            )}
            {bridgeStatus === 'error' && (
              <div className="bridge-error">
                <AlertCircle size={16} />
                {bridgeError}
              </div>
            )}
          </div>

          <div className="setting-actions">
            <button className="action-btn tv-focusable" onClick={() => setPaused(!isPaused)}>
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              {isPaused ? 'Resume Slides' : 'Pause Slides'}
            </button>

            <button className="action-btn tv-focusable" onClick={onForceRefresh}>
              <RefreshCw size={20} />
              Force Refresh Now
            </button>

            <button className="action-btn danger tv-focusable" onClick={onLogout}>
              <LogOut size={20} />
              Lock Display
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
