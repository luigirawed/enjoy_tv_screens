import React, { useState, useEffect } from 'react';
import { initGoogleIdentity, requestLogin } from '../api/google-auth';
import './LoginScreen.css';

export default function LoginScreen({ onLoginSuccess }) {
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize the Google client API.
    initGoogleIdentity(
      (token) => {
        console.log("Login successful!");
        onLoginSuccess();
      },
      (err) => {
        console.error("Login failed:", err);
        setError("Failed to authenticate. Please make sure popups are allowed.");
      }
    );
    
    // Give external script a moment to parse
    setTimeout(() => setIsReady(true), 1000);
  }, [onLoginSuccess]);

  const handleLoginClick = () => {
    try {
      setError(null);
      requestLogin();
    } catch (err) {
      setError("Google API not ready yet. Please try again.");
    }
  };

  return (
    <div className="login-screen">
      <h1>Google TV Slides Sign In</h1>
      <p>Please authorize this display to read your Google Slides.</p>
      
      {!isReady ? (
        <div style={{ marginTop: '2rem' }}>Loading Google Auth...</div>
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
            <small>Note: You may need to plug in a USB keyboard or use your TV remote to log in initially.</small>
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
