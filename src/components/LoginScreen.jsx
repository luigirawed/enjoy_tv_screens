import React, { useState, useEffect } from 'react';
import { initGoogleIdentity, requestLogin, gsiReady } from '../api/google-auth';
import './LoginScreen.css';

export default function LoginScreen({ onLoginSuccess }) {
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    // Initialize the Google client API.
    initGoogleIdentity(
      (token) => {
        console.log("Login successful!");
        onLoginSuccess();
      },
      (err) => {
        console.error("Login failed:", err);
        setError("Failed to authenticate: " + err);
      }
    );

    // Wait for the GSI script to actually be ready before showing the button
    gsiReady.then((success) => {
      if (success) {
        setIsReady(true);
      } else {
        setScriptFailed(true);
      }
    });
  }, [onLoginSuccess]);

  const handleLoginClick = () => {
    setError(null);
    const ok = requestLogin();
    if (!ok) {
      setError("Google API not ready yet. Please wait a moment and try again.");
    }
  };

  return (
    <div className="login-screen">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="login-logo" />
      <h1>Google TV Slides</h1>
      <p>Please authorize this display to read your Google Slides.</p>
      
      {scriptFailed ? (
        <div className="error-message" style={{ marginTop: '2rem' }}>
          <p>Could not load Google Sign-In.</p>
          <p><small>Check your internet connection and reload.</small></p>
          <button className="tv-button" onClick={() => window.location.reload()}>Reload</button>
        </div>
      ) : !isReady ? (
        <div className="loading-auth">
          <div className="spinner" style={{ width: 40, height: 40, marginBottom: '1rem' }}></div>
          <p>Loading Google Sign-In...</p>
        </div>
      ) : (
        <div className="auth-box">
          <button 
            className="tv-button login-btn" 
            onClick={handleLoginClick}
            autoFocus
          >
            Sign in with Google
          </button>
          <p className="hint">
            <small>A Google popup will appear. Use a USB keyboard or your TV remote to log in.</small>
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}
